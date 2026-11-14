"""
Automated Test Suite for Intelligent Location-Based Task Allocation System
Author: Jan Isaac Mwaniki Maina (Admission No: 166393)
Supervisor: Dr. Dickson Owuor
Strathmore University, School of Computing and Engineering Sciences
"""

import math
from datetime import datetime
from zoneinfo import ZoneInfo
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from api.models import User, AgentProfile, Task, Assignment, LocationLog, PerformanceLog
from api.allocation import (
    calculate_haversine_distance,
    calculate_proximity_score,
    calculate_workload_score,
    calculate_skill_similarity,
    is_agent_on_duty_nairobi,
    rank_candidates_for_task,
    EARTH_RADIUS_KM
)


class AllocationMathTests(TestCase):
    """
    Unit tests for Section 3.3.4 and Section 5.4 allocation mathematical formulation.
    Validates Haversine distance, proximity score, workload score, and shift evaluation.
    """

    def test_haversine_distance_identical_points(self):
        """Distance between identical coordinates must be 0.0 km."""
        dist = calculate_haversine_distance(-1.286389, 36.817223, -1.286389, 36.817223)
        self.assertEqual(dist, 0.0)

    def test_haversine_distance_nairobi_cbd_to_westlands(self):
        """Distance between Nairobi CBD and Westlands should be ~2.2 - 2.5 km."""
        cbd_lat, cbd_lng = -1.286389, 36.817223
        westlands_lat, westlands_lng = -1.2683, 36.8080
        dist = calculate_haversine_distance(cbd_lat, cbd_lng, westlands_lat, westlands_lng)
        self.assertGreater(dist, 1.8)
        self.assertLess(dist, 3.0)

    def test_haversine_distance_nairobi_cbd_to_jkia(self):
        """Distance between Nairobi CBD and JKIA airport should be ~12 - 15 km."""
        cbd_lat, cbd_lng = -1.286389, 36.817223
        jkia_lat, jkia_lng = -1.3192, 36.9278
        dist = calculate_haversine_distance(cbd_lat, cbd_lng, jkia_lat, jkia_lng)
        self.assertGreater(dist, 10.0)
        self.assertLess(dist, 18.0)

    def test_proximity_score_at_zero_distance(self):
        """Proximity score at 0 km must equal 1.0 (maximum score)."""
        score = calculate_proximity_score(0.0, max_radius_km=25.0)
        self.assertEqual(score, 1.0)

    def test_proximity_score_at_half_radius(self):
        """Proximity score at half max radius (12.5 km of 25 km) should be 0.5."""
        score = calculate_proximity_score(12.5, max_radius_km=25.0)
        self.assertAlmostEqual(score, 0.5, places=2)

    def test_proximity_score_beyond_max_radius(self):
        """Proximity score beyond max radius should clamp to floor 0.05."""
        score = calculate_proximity_score(35.0, max_radius_km=25.0)
        self.assertEqual(score, 0.05)

    def test_workload_score_formula(self):
        """
        Validates workload score: S_workload = 1 / (1 + activeTasks).
        0 tasks -> 1.0
        1 task  -> 0.5
        2 tasks -> 0.3333
        3 tasks -> 0.25
        """
        self.assertEqual(calculate_workload_score(0), 1.0)
        self.assertEqual(calculate_workload_score(1), 0.5)
        self.assertAlmostEqual(calculate_workload_score(2), 0.3333, places=3)
        self.assertEqual(calculate_workload_score(3), 0.25)

    def test_skill_similarity_fallback_keyword_overlap(self):
        """Tests keyword and semantic skill overlap calculation."""
        task_text = "Emergency 3-phase power distribution transformer fault in industrial area"
        agent_profile = "Samuel Kiprop Senior Electrical Technician 3-phase power distribution switchboard"
        agent_skills = ["3-phase power distribution", "Circuit breaker overhaul", "415V switchboard"]
        req_skills = ["3-phase power distribution", "Circuit breaker overhaul"]

        score = calculate_skill_similarity(task_text, agent_profile, agent_skills, req_skills)
        self.assertGreater(score, 0.60)
        self.assertLessEqual(score, 1.0)

    def test_duty_evaluation_on_call(self):
        """An agent marked on-call must always evaluate as active on-duty."""
        class MockAgent:
            is_on_call = True
            shift_start = "08:00"
            shift_end = "17:00"

        is_on_duty, status_key, label = is_agent_on_duty_nairobi(MockAgent())
        self.assertTrue(is_on_duty)
        self.assertEqual(status_key, 'on_call')


class ModelIntegrityTests(TestCase):
    """
    Unit tests for database models, RBAC constraints, and field workforce relationships.
    """

    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@geotask.ke',
            username='admin_test',
            full_name='System Admin',
            role='administrator',
            status='active'
        )
        self.tech_user = User.objects.create_user(
            email='tech@geotask.ke',
            username='tech_test',
            full_name='Brian Omondi',
            role='agent',
            status='active'
        )
        self.tech_profile = AgentProfile.objects.create(
            user=self.tech_user,
            title='Lead Fiber Optic Splicing Engineer',
            domain='Fiber Optic & ISP Last-Mile Splicing',
            experience_years=5,
            skills=['Fiber optic cable fusion splicing', 'OTDR fault trace analysis'],
            certifications=['Certified Fiber Optic Technician (CFOT)'],
            current_lat=-1.2618,
            current_lng=36.8042,
            current_address='Waiyaki Way, Westlands, Nairobi',
            battery_level=90,
            active_task_count=0,
            skill_embedding=[0.05] * 384
        )

    def test_user_creation_and_string_representation(self):
        self.assertEqual(str(self.admin), "System Admin (Administrator / Dispatcher)")
        self.assertEqual(self.admin.role, 'administrator')

    def test_agent_profile_embedding_dimensions(self):
        """Verify 384-dimensional dense SBERT skill embedding vector."""
        self.assertEqual(len(self.tech_profile.skill_embedding), 384)
        self.assertEqual(self.tech_profile.domain, 'Fiber Optic & ISP Last-Mile Splicing')

    def test_task_creation_and_assignment_flow(self):
        task = Task.objects.create(
            requester=self.admin,
            title='Severed aerial fiber backbone cable',
            description='Underground construction cut main distribution fiber cable on Parklands Road.',
            category='Fiber Optic & ISP Last-Mile Splicing',
            required_skills=['Fiber optic cable fusion splicing'],
            priority='critical',
            target_lat=-1.2650,
            target_lng=36.8150,
            address_name='Parklands Road, Nairobi'
        )
        self.assertEqual(task.status, 'pending')

        assignment = Assignment.objects.create(
            task=task,
            agent=self.tech_profile,
            allocation_score=0.942,
            skill_score=0.965,
            proximity_score=0.910,
            workload_score=1.000,
            status='dispatched'
        )
        self.assertEqual(assignment.task.id, task.id)
        self.assertEqual(assignment.agent.id, self.tech_profile.id)
        self.assertGreaterEqual(assignment.allocation_score, 0.90)


class MultiCriteriaCandidateRankingTests(TestCase):
    """
    Integration tests for candidate ranking engine across multiple simulated technicians.
    """

    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@geotask.ke',
            username='admin_dispatch',
            full_name='Jan Isaac Maina',
            role='administrator'
        )

        # Agent 1: Closer (1.5 km), high skill, 0 active tasks
        u1 = User.objects.create_user(email='tech1@geotask.ke', username='tech1', full_name='Agent Closer')
        self.agent1 = AgentProfile.objects.create(
            user=u1,
            title='Senior Commercial Electrician',
            domain='Commercial Electrical Wiring & Distribution',
            skills=['3-phase power distribution', 'Circuit breaker overhaul'],
            certifications=['EPRA Class A'],
            current_lat=-1.2800,
            current_lng=36.8200,
            active_task_count=0,
            is_on_call=True,
            skill_embedding=[0.1] * 384
        )

        # Agent 2: Farther (18 km), high skill, 2 active tasks
        u2 = User.objects.create_user(email='tech2@geotask.ke', username='tech2', full_name='Agent Farther')
        self.agent2 = AgentProfile.objects.create(
            user=u2,
            title='Senior Commercial Electrician',
            domain='Commercial Electrical Wiring & Distribution',
            skills=['3-phase power distribution', 'Circuit breaker overhaul'],
            certifications=['EPRA Class A'],
            current_lat=-1.3800,
            current_lng=36.9500,
            active_task_count=2,
            is_on_call=True,
            skill_embedding=[0.1] * 384
        )

        self.task = Task.objects.create(
            requester=self.admin,
            title='Main switchboard trip at corporate headquarters',
            description='3-phase circuit breaker tripped and burning smell detected in switchboard room.',
            category='Commercial Electrical Wiring & Distribution',
            required_skills=['3-phase power distribution', 'Circuit breaker overhaul'],
            priority='high',
            target_lat=-1.286389,
            target_lng=36.817223,
            address_name='Kenyatta Avenue, Nairobi CBD'
        )

    def test_ranking_engine_ranks_closer_less_loaded_agent_first(self):
        agents = [self.agent1, self.agent2]
        ranked = rank_candidates_for_task(self.task, agents, w_skill=0.50, w_proximity=0.30, w_workload=0.20)

        self.assertEqual(len(ranked), 2)
        # Agent 1 must score higher because of closer distance and 0 active workload
        self.assertEqual(ranked[0]['agent_id'], self.agent1.id)
        self.assertGreater(ranked[0]['total_score'], ranked[1]['total_score'])
        self.assertGreater(ranked[0]['proximity_score'], ranked[1]['proximity_score'])
        self.assertGreater(ranked[0]['workload_score'], ranked[1]['workload_score'])


class APIRestEndpointsTests(TestCase):
    """
    Integration tests for Django REST Framework API endpoints.
    """

    def setUp(self):
        self.client = APIClient()

        # Create Admin
        self.admin = User.objects.create_user(
            email='admin@geotask.ke',
            username='admin_api',
            full_name='Jan Isaac Maina',
            role='administrator',
            status='active'
        )
        self.admin.set_password('adminpass123')
        self.admin.save()

        # Create Technician
        self.tech_user = User.objects.create_user(
            email='tech@geotask.ke',
            username='tech_api',
            full_name='Moses Wanjala',
            role='agent',
            status='active'
        )
        self.tech_user.set_password('techpass123')
        self.tech_user.save()

        self.tech_profile = AgentProfile.objects.create(
            user=self.tech_user,
            title='HVAC Chiller Specialist',
            domain='HVAC, Industrial Chillers & Cold Chain Systems',
            skills=['VRF system diagnostics', 'Refrigerant recovery'],
            current_lat=-1.2921,
            current_lng=36.8219,
            current_address='Upper Hill, Nairobi',
            is_on_call=True
        )

        self.task = Task.objects.create(
            requester=self.admin,
            title='Server room precision AC unit failover alarm',
            description='Primary CRAC unit compressor locked out; temperature rising.',
            category='HVAC, Industrial Chillers & Cold Chain Systems',
            required_skills=['VRF system diagnostics'],
            priority='critical',
            target_lat=-1.2930,
            target_lng=36.8225,
            address_name='Upper Hill, Nairobi'
        )

    def test_api_login_success(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'admin@geotask.ke',
            'password': 'adminpass123'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['role'], 'administrator')

    def test_api_login_invalid_password(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'admin@geotask.ke',
            'password': 'wrongpassword'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_api_register_requester(self):
        response = self.client.post('/api/auth/register/', {
            'email': 'client@strathmore.edu',
            'password': 'clientpass123',
            'full_name': 'Facility Manager',
            'role': 'requester',
            'phone': '+254 700 999 888',
            'department': 'Strathmore Facilities'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='client@strathmore.edu').exists())

    def test_task_list_and_detail(self):
        response = self.client.get('/api/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_rank_candidates_endpoint(self):
        url = f"/api/tasks/{self.task.id}/rank_candidates/"
        response = self.client.post(url, {
            'w_skill': 0.50,
            'w_proximity': 0.30,
            'w_workload': 0.20,
            'max_radius_km': 25.0
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('candidates', response.data)
        self.assertGreaterEqual(len(response.data['candidates']), 1)
        self.assertEqual(response.data['candidates'][0]['agent_id'], self.tech_profile.id)

    def test_assign_agent_endpoint(self):
        url = f"/api/tasks/{self.task.id}/assign_agent/"
        response = self.client.post(url, {
            'agent_id': self.tech_profile.id,
            'score': 0.92,
            's_skill': 0.95,
            's_prox': 0.90,
            's_work': 1.00
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.task.refresh_from_db()
        self.assertEqual(self.task.status, 'assigned')
        self.assertEqual(self.task.assigned_agent.id, self.tech_profile.id)

        # Check Assignment record was created
        assignment = Assignment.objects.filter(task=self.task, agent=self.tech_profile).first()
        self.assertIsNotNone(assignment)
        self.assertEqual(assignment.status, 'dispatched')

    def test_agent_update_location_telemetry(self):
        url = f"/api/agents/{self.tech_profile.id}/update_location/"
        response = self.client.post(url, {
            'lat': -1.2700,
            'lng': 36.8100,
            'address': 'Westlands Roundabout, Nairobi'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.tech_profile.refresh_from_db()
        self.assertAlmostEqual(self.tech_profile.current_lat, -1.2700)
        self.assertEqual(self.tech_profile.current_address, 'Westlands Roundabout, Nairobi')

        # Check LocationLog breadcrumb created
        log = LocationLog.objects.filter(agent=self.tech_profile).first()
        self.assertIsNotNone(log)
        self.assertAlmostEqual(log.latitude, -1.2700)

    def test_agent_toggle_availability(self):
        url = f"/api/agents/{self.tech_profile.id}/toggle_availability/"
        response = self.client.patch(url, {'availability': 'busy'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.tech_profile.refresh_from_db()
        self.assertEqual(self.tech_profile.availability, 'busy')

    def test_agent_update_shift(self):
        url = f"/api/agents/{self.tech_profile.id}/update_shift/"
        response = self.client.post(url, {
            'shift_name': 'Evening Emergency Standby',
            'shift_start': '16:00',
            'shift_end': '00:00',
            'is_on_call': True
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.tech_profile.refresh_from_db()
        self.assertEqual(self.tech_profile.shift_name, 'Evening Emergency Standby')
        self.assertTrue(self.tech_profile.is_on_call)
