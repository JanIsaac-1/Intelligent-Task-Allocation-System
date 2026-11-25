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

        # Verify default omitted weights use High-Precision Technical Match standard (0.70 / 0.15 / 0.15)
        default_res = self.client.post(url, {}, format='json')
        self.assertEqual(default_res.status_code, status.HTTP_200_OK)
        self.assertEqual(default_res.data['weights_applied'], {'w_skill': 0.70, 'w_proximity': 0.15, 'w_workload': 0.15})

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

    def test_create_task_without_domain_or_skills_auto_infers(self):
        response = self.client.post('/api/tasks/', {
            'title': 'Server room cooling unit stopped blowing cold air',
            'description': 'CRAC precision chiller keeps tripping with compressor alarm.',
            'priority': 'critical',
            'target_lat': -1.2921,
            'target_lng': 36.8219,
            'address_name': 'Upper Hill, Nairobi',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(bool(response.data['category']))

    def test_analytics_summary_live_metrics(self):
        # Assign and complete a task so Assignment scores & completion timing are recorded
        self.client.post(f"/api/tasks/{self.task.id}/assign_agent/", {
            'agent_id': self.tech_profile.id,
            'score': 0.91,
            's_skill': 0.96,
            's_prox': 0.88,
            's_work': 0.90,
        }, format='json')
        self.client.patch(f"/api/tasks/{self.task.id}/update_status/", {'status': 'completed'}, format='json')

        response = self.client.get('/api/analytics/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_assignments'], 1)
        self.assertAlmostEqual(response.data['avg_skill_score'], 0.96)
        self.assertEqual(response.data['completed_tasks'], 1)
        self.assertEqual(len(response.data['recent_assignments']), 1)
        self.assertEqual(response.data['recent_assignments'][0]['status'], 'completed')

    def test_parse_cv_txt_and_docx(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        import io
        import zipfile

        cv_text = (
            "Name: Alex Mwende\n"
            "Phone: +254 712 345 678\n"
            "Email: alex.mwende@geotask.ke\n"
            "Experience: 6 years of experience in fiber optic fusion splicing, OTDR trace analysis, and FTTH drop cabling.\n"
            "Certifications: FOA Certified Fiber Splicer, Safety at Heights\n"
        )
        txt_file = SimpleUploadedFile('alex_cv.txt', cv_text.encode('utf-8'), content_type='text/plain')
        res_txt = self.client.post('/api/parse-cv/', {'file': txt_file})
        self.assertEqual(res_txt.status_code, status.HTTP_200_OK)
        self.assertEqual(res_txt.data['candidate_name'], 'Alex Mwende')
        self.assertEqual(res_txt.data['detected_phone'], '+254 712 345 678')
        self.assertEqual(res_txt.data['detected_experience_years'], 6)
        self.assertIn('Fiber', res_txt.data['detected_domain'])
        self.assertGreaterEqual(len(res_txt.data['extracted_skills']), 1)

        # Verify .docx extraction via in-memory OOXML document
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, 'w') as zf:
            xml = (
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
                '<w:body><w:p><w:r><w:t>Solar PV inverter installer with 5 years experience and EPRA Solar PV license.</w:t></w:r></w:p></w:body>'
                '</w:document>'
            )
            zf.writestr('word/document.xml', xml)
        docx_file = SimpleUploadedFile(
            'solar_jd.docx',
            buf.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        res_docx = self.client.post('/api/parse-cv/', {'file': docx_file})
        self.assertEqual(res_docx.status_code, status.HTTP_200_OK)
        self.assertIn('Solar', res_docx.data['detected_domain'])

    def test_create_agent_enrollment_with_sbert_embedding(self):
        response = self.client.post('/api/agents/', {
            'full_name': 'Jane Wanjiru',
            'phone': '+254 722 111 333',
            'title': 'Solar PV & Hybrid Inverter Engineer',
            'domain': 'Solar PV & Hybrid Inverter Systems',
            'experience_years': 5,
            'skills': ['Hybrid solar inverter configuration', 'Lithium battery storage'],
            'certifications': ['EPRA Solar PV Class T3'],
            'bio': 'Experienced off-grid and hybrid solar specialist.',
            'current_lat': -1.2700,
            'current_lng': 36.8100,
            'current_address': 'Westlands, Nairobi',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        agent = AgentProfile.objects.get(id=response.data['id'])
        self.assertEqual(agent.user.full_name, 'Jane Wanjiru')
        self.assertIsNotNone(agent.skill_embedding)
        self.assertEqual(len(agent.skill_embedding), 384)

    def test_parse_cv_grounded_software_and_long_field_cv_accuracy(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        # 1. Software engineer CV should NEVER be misclassified into ATM/field trades or hallucinate ATM skills
        swe_cv = (
            "Jan Isaac\n"
            "Nairobi, Kenya\n"
            "+254 707 088 504\n"
            "jano89995@gmail.com\n\n"
            "PROFESSIONAL SUMMARY\n"
            "Full-Stack Software Engineer with strong expertise in JavaScript ecosystems, specializing in\n"
            "React.js and Node.js for building scalable web applications and backend systems. Experienced\n"
            "in designing REST APIs and PostgreSQL data pipelines.\n\n"
            "TECHNICAL SKILLS\n"
            "Frontend: React.js, TypeScript, Tailwind CSS\n"
            "Backend: Node.js, REST APIs, PostgreSQL, Docker\n\n"
            "EXPERIENCE\n"
            "Software Developer | Acme Tech | 2021 - 2025\n"
        )
        res_swe = self.client.post(
            '/api/parse-cv/',
            {'file': SimpleUploadedFile('jan_cv.txt', swe_cv.encode('utf-8'), content_type='text/plain')},
        )
        self.assertEqual(res_swe.status_code, status.HTTP_200_OK)
        self.assertEqual(res_swe.data['candidate_name'], 'Jan Isaac')
        self.assertEqual(res_swe.data['detected_title'], 'Full-Stack Software Engineer')
        self.assertEqual(res_swe.data['detected_domain'], 'Software Engineering & Full-Stack Systems')
        self.assertEqual(res_swe.data['detected_experience_years'], 4)
        self.assertIn('React.js', res_swe.data['extracted_skills'])
        self.assertIn('Node.js', res_swe.data['extracted_skills'])
        self.assertNotIn('ATM cash dispenser mechanism overhaul', res_swe.data['extracted_skills'])
        self.assertTrue(res_swe.data['detected_bio'].startswith('Full-Stack Software Engineer'))
        self.assertNotIn('+254', res_swe.data['detected_bio'])

        # 2. Long field technician CV (>2000 chars) where domain skills appear near the bottom
        filler_bio = "Experienced facility operations and building maintenance technician working across commercial properties in Nairobi. " * 22
        long_plumbing_cv = (
            "Name: Peter Kamau\n"
            "Phone: +254 722 998 877\n\n"
            f"PROFILE\n{filler_bio}\n\n"
            "SKILLS\n"
            "PPR socket fusion welding, High-pressure water booster pump repair, Pressure reducing valve calibration\n\n"
            "CERTIFICATIONS\n"
            "Master Plumber License, OSHA Safety\n"
        )
        self.assertGreater(len(long_plumbing_cv), 2000)
        res_plm = self.client.post(
            '/api/parse-cv/',
            {'file': SimpleUploadedFile('peter_plumbing.txt', long_plumbing_cv.encode('utf-8'), content_type='text/plain')},
        )
        self.assertEqual(res_plm.status_code, status.HTTP_200_OK)
        self.assertEqual(res_plm.data['detected_domain'], 'Commercial Plumbing & High-Rise Booster Systems')
        self.assertIn('PPR socket fusion welding', res_plm.data['extracted_skills'])
        self.assertIn('Master Plumber License', res_plm.data['detected_certifications'])

    def test_parse_cv_pdf_bullets_and_languages_subsection(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        pdf_style_cv = (
            "JAN ISAAC\n"
            "Full-Stack Software Engineer\n\n"
            "SKILLS & COMPETENCIES\n"
            "Languages: JavaScript, TypeScript, SQL\n"
            "\uf0b7 React.js / Next.js / Tailwind CSS\n"
            "• Node.js, Express.js, PostgreSQL, Docker\n\n"
            "WORK EXPERIENCE\n"
            "Backend Developer (2022 - Present)\n"
        )
        res = self.client.post(
            '/api/parse-cv/',
            {'file': SimpleUploadedFile('pdf_like.txt', pdf_style_cv.encode('utf-8'), content_type='text/plain')},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['detected_domain'], 'Software Engineering & Full-Stack Systems')
        self.assertIn('JavaScript', res.data['extracted_skills'])
        self.assertIn('React.js', res.data['extracted_skills'])
        self.assertIn('Node.js', res.data['extracted_skills'])
        self.assertIn('PostgreSQL', res.data['extracted_skills'])

    def test_admin_add_user_persists_login_and_agent_profile(self):
        # 1. Admin creates a Field Agent via POST /api/users/
        res_agent = self.client.post('/api/users/', {
            'full_name': 'Mary Atieno',
            'email': 'mary.atieno@geotask.ke',
            'password': 'SecretPass123',
            'phone': '+254 711 222 333',
            'role': 'agent',
            'department': 'Field Operations',
            'status': 'active',
            'title': 'Solar PV Field Technician',
            'domain': 'Solar PV & Hybrid Inverter Systems',
            'experience_years': 4,
            'skills': ['Hybrid solar inverter configuration', 'Lithium battery diagnostics'],
            'current_address': 'Kilimani, Nairobi',
        }, format='json')
        self.assertEqual(res_agent.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_agent.data['email'], 'mary.atieno@geotask.ke')

        # Verify AgentProfile & 384-d SBERT embedding were provisioned automatically
        agent_profile = AgentProfile.objects.get(user__email='mary.atieno@geotask.ke')
        self.assertEqual(agent_profile.title, 'Solar PV Field Technician')
        self.assertEqual(agent_profile.availability, 'available')
        self.assertIsNotNone(agent_profile.skill_embedding)
        self.assertEqual(len(agent_profile.skill_embedding), 384)

        # Verify the newly provisioned user can authenticate immediately
        login_res = self.client.post('/api/auth/login/', {
            'email': 'mary.atieno@geotask.ke',
            'password': 'SecretPass123',
        }, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertEqual(login_res.data['role'], 'agent')

        # 2. Duplicate email should be rejected cleanly with HTTP 400
        dup_res = self.client.post('/api/users/', {
            'full_name': 'Mary Duplicate',
            'email': 'mary.atieno@geotask.ke',
            'password': 'AnotherPass123',
            'role': 'requester',
        }, format='json')
        self.assertEqual(dup_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', dup_res.data)

    def test_requester_task_linking_and_cancel_pending_order(self):
        requester_user = User.objects.create_user(
            email='facility@westlands.ke',
            username='facility_westlands',
            full_name='Grace Njeri',
            role='requester',
            phone='+254 722 444 555',
            status='active',
        )
        create_res = self.client.post('/api/tasks/', {
            'title': 'Faulty 3-phase isolator switch at Westlands Annex',
            'description': 'Main distribution breaker trips whenever backup power switches over.',
            'priority': 'high',
            'target_lat': -1.2635,
            'target_lng': 36.8024,
            'address_name': 'Westlands, Nairobi',
            'requester': requester_user.id,
        }, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_res.data['requester'], requester_user.id)
        self.assertEqual(create_res.data['requester_name'], 'Grace Njeri')
        self.assertEqual(create_res.data['requester_phone'], '+254 722 444 555')

        cancel_res = self.client.patch(
            f"/api/tasks/{create_res.data['id']}/update_status/",
            {'status': 'cancelled'},
            format='json',
        )
        self.assertEqual(cancel_res.status_code, status.HTTP_200_OK)
        self.assertEqual(cancel_res.data['status'], 'cancelled')

    def test_negative_sbert_similarity_never_outranks_matched_domain(self):
        # Negative SBERT cosine similarity must stay low (<=0.05 base) rather than jumping to ~0.50
        fridge_user = User.objects.create_user(
            email='fridge@geotask.ke',
            username='fridge_tech',
            full_name='Eric Kibet',
            role='agent',
            status='active',
        )
        fridge_agent = AgentProfile.objects.create(
            user=fridge_user,
            title='Commercial Refrigeration Specialist',
            domain='Commercial Cold Rooms & Supermarket Refrigeration',
            skills=['Semi-hermetic compressor overhaul', 'Refrigerant R404A charging'],
            availability='available',
            current_lat=-1.286,
            current_lng=36.817,
        )
        wisp_task = Task.objects.create(
            title='Wifi connection fix',
            description='The wifi in the office shows connected to the internet but pages do not load',
            category='Point-to-Point Wireless & Microwave Internet (WISP)',
            required_skills=['MikroTik RouterOS wireless configuration', 'Ubiquiti airMAX optimization'],
            priority='high',
            target_lat=-1.286,
            target_lng=36.817,
        )
        # Align tech_profile to WISP domain for direct comparison
        self.tech_profile.domain = 'Point-to-Point Wireless & Microwave Internet (WISP)'
        self.tech_profile.skills = ['MikroTik RouterOS wireless configuration', 'Ubiquiti airMAX optimization']
        self.tech_profile.save()

        ranked = rank_candidates_for_task(wisp_task, [fridge_agent, self.tech_profile], w_skill=0.70, w_proximity=0.15, w_workload=0.15)
        self.assertEqual(ranked[0]['agent_id'], self.tech_profile.id)
        self.assertGreater(ranked[0]['skill_score'], 0.40)
        self.assertLess(ranked[1]['skill_score'], 0.30)
