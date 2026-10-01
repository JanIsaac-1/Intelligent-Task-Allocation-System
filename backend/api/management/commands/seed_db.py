from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import User, AgentProfile, Task, Assignment, PerformanceLog

class Command(BaseCommand):
    help = "Seeds initial Kenyan users, field technicians, and Nairobi work orders into PostgreSQL"

    def handle(self, *args, **options):
        self.stdout.write("[SEED] Starting database seeding...")

        # 1. Create Administrators
        admin_user, _ = User.objects.get_or_create(
            email="jan.maina@strathmore.edu",
            defaults={
                'username': 'jan_maina',
                'full_name': 'Jan Isaac Mwaniki Maina',
                'role': 'administrator',
                'phone': '+254 712 345 678',
                'department': 'Operations & Dispatch Headquarters',
                'status': 'active',
                'is_staff': True,
                'is_superuser': True
            }
        )
        admin_user.set_password("admin123")
        admin_user.save()

        supervisor_user, _ = User.objects.get_or_create(
            email="dowuor@strathmore.edu",
            defaults={
                'username': 'dr_owuor',
                'full_name': 'Dr. Dickson Owuor',
                'role': 'administrator',
                'phone': '+254 722 987 654',
                'department': 'Faculty of Information Technology',
                'status': 'active',
                'is_staff': True
            }
        )
        supervisor_user.set_password("admin123")
        supervisor_user.save()

        # 2. Create Requesters
        requester1, _ = User.objects.get_or_create(
            email="itdesk@apexfinance.co.ke",
            defaults={
                'username': 'apex_it',
                'full_name': 'Apex Financial IT Helpdesk',
                'role': 'requester',
                'phone': '+254 700 112 233',
                'department': 'Corporate Facilities & IT',
                'status': 'active'
            }
        )
        requester1.set_password("user123")
        requester1.save()

        requester2, _ = User.objects.get_or_create(
            email="estates@kilimani.co.ke",
            defaults={
                'username': 'kilimani_estates',
                'full_name': 'Kilimani Heights Estate Management',
                'role': 'requester',
                'phone': '+254 733 445 566',
                'department': 'Property Care Services',
                'status': 'active'
            }
        )
        requester2.set_password("user123")
        requester2.save()

        # 3. Create Field Technicians
        agents_data = [
            {
                'email': 'samuel.kiprop@geotask.ke',
                'username': 'samuel_kiprop',
                'full_name': 'Samuel Kiprop',
                'phone': '+254 711 234 567',
                'title': 'Senior Electrical Technician',
                'domain': 'Commercial Electrical Wiring & Distribution',
                'experience_years': 6,
                'skills': ['3-phase power distribution', 'Circuit breaker overhaul', '415V switchboard load balancing', 'Insulation resistance testing', 'ATS generator changeover'],
                'certifications': ['EPRA Class A Electrician License', 'High Voltage Safety'],
                'bio': 'Specialized in commercial 3-phase switchgear, KPLC industrial meters, and emergency backup generator automatic transfer switch (ATS) maintenance.',
                'current_lat': -1.2618,
                'current_lng': 36.8042, # Westlands
                'battery_level': 88,
                'availability': 'available'
            },
            {
                'email': 'brian.omondi@geotask.ke',
                'username': 'brian_omondi',
                'full_name': 'Brian Omondi',
                'phone': '+254 722 345 678',
                'title': 'Lead Fiber Optic Splicing Engineer',
                'domain': 'Fiber Optic & ISP Last-Mile Splicing',
                'experience_years': 5,
                'skills': ['Fiber optic cable fusion splicing', 'OTDR fault trace analysis', 'Optical power meter testing', 'Underground conduit rodding', 'ODF patch panel termination'],
                'certifications': ['FOA Certified Fiber Splicer Level 3', 'CCNA'],
                'bio': 'Experienced fiber specialist handling high-count backbone trunk cuts, aerial drop lines, and optical distribution cabinet troubleshooting across Nairobi.',
                'current_lat': -1.2982,
                'current_lng': 36.7891, # Kilimani
                'battery_level': 94,
                'availability': 'available'
            },
            {
                'email': 'david.njoroge@geotask.ke',
                'username': 'david_njoroge',
                'full_name': 'David Njoroge',
                'phone': '+254 733 456 789',
                'title': 'Master Hydraulic Plumber',
                'domain': 'Commercial Plumbing & High-Rise Booster Systems',
                'experience_years': 8,
                'skills': ['High-pressure water booster pump repair', 'PPR socket fusion welding', 'Cast iron and PVC drainage clearing', 'Pressure reducing valve (PRV) calibration'],
                'certifications': ['Master Plumber License', 'High-Pressure Booster Tech'],
                'bio': 'Commercial high-rise plumbing specialist expert in multi-stage booster pumps, apartment vertical riser bursts, and borehole pressure manifolds.',
                'current_lat': -1.2833,
                'current_lng': 36.8167, # CBD
                'battery_level': 76,
                'availability': 'available'
            },
            {
                'email': 'grace.wanjiku@geotask.ke',
                'username': 'grace_wanjiku',
                'full_name': 'Grace Wanjiku',
                'phone': '+254 744 567 890',
                'title': 'Lead Housekeeping & Sanitation Specialist',
                'domain': 'Deep House Cleaning & Post-Construction Scrubbing',
                'experience_years': 4,
                'skills': ['Industrial rotary floor scrubber operation', 'Post-renovation cement/paint residue stripping', 'Hot water carpet extraction', 'Telescopic window washing'],
                'certifications': ['Certified Professional Housekeeper (CPH)', 'Chemical Safety'],
                'bio': 'Deep cleaning lead equipped with rotary floor scrubbers, tile acid strippers, and upholstery hot-water extractors.',
                'current_lat': -1.3005,
                'current_lng': 36.8225, # Madaraka
                'battery_level': 91,
                'availability': 'available'
            },
            {
                'email': 'kevin.mutua@geotask.ke',
                'username': 'kevin_mutua',
                'full_name': 'Kevin Mutua',
                'phone': '+254 755 678 901',
                'title': 'Solar PV & Battery Systems Engineer',
                'domain': 'Solar PV & Hybrid Inverter Systems',
                'experience_years': 5,
                'skills': ['Hybrid solar inverter configuration', 'Lithium LiFePO4 battery bank diagnostics', 'Solar PV string testing', 'DC isolator switch wiring'],
                'certifications': ['EPRA Solar PV Class T3', 'Victron Certified Professional'],
                'bio': 'Specialized in commercial and residential hybrid solar setups (Deye, Victron, Growatt), Lithium battery BMS troubleshooting, and solar water heaters.',
                'current_lat': -1.3211,
                'current_lng': 36.8521, # Industrial Area
                'battery_level': 82,
                'availability': 'available'
            },
            {
                'email': 'dennis.kamau@geotask.ke',
                'username': 'dennis_kamau',
                'full_name': 'Dennis Kamau',
                'phone': '+254 766 789 012',
                'title': 'Mobile Auto-Electrician & Roadside Mechanic',
                'domain': 'Mobile Automotive Roadside Assistance',
                'experience_years': 7,
                'skills': ['Emergency 12V vehicle battery jumpstart', 'Mobile OBD-II computer diagnostic scanning', 'Flat tire replacement', 'Alternator voltage diagnostics'],
                'certifications': ['Certified Automotive Technician (NITA)', 'Roadside Safety & Recovery'],
                'bio': 'Mobile auto-electrician providing emergency roadside battery jumpstarts, diagnostic scanning, and mobile breakdown recovery across Nairobi highways.',
                'current_lat': -1.3325,
                'current_lng': 36.8912, # Mombasa Road / Syokimau
                'battery_level': 68,
                'availability': 'available'
            }
        ]

        created_agents = []
        for a_data in agents_data:
            user, _ = User.objects.get_or_create(
                email=a_data['email'],
                defaults={
                    'username': a_data['username'],
                    'full_name': a_data['full_name'],
                    'role': 'agent',
                    'phone': a_data['phone'],
                    'department': a_data['domain'],
                    'status': 'active'
                }
            )
            user.set_password("agent123")
            user.save()

            profile, _ = AgentProfile.objects.get_or_create(
                user=user,
                defaults={
                    'title': a_data['title'],
                    'domain': a_data['domain'],
                    'experience_years': a_data['experience_years'],
                    'skills': a_data['skills'],
                    'certifications': a_data['certifications'],
                    'bio': a_data['bio'],
                    'current_lat': a_data['current_lat'],
                    'current_lng': a_data['current_lng'],
                    'battery_level': a_data['battery_level'],
                    'availability': a_data['availability']
                }
            )
            created_agents.append(profile)

        # 4. Create Initial Field Tasks
        tasks_data = [
            {
                'title': 'Underground Optical Fiber Cut - Waiyaki Way',
                'description': 'Excavator during road widening severed the 48-core primary trunk optical cable outside Delta Towers. Multiple corporate tenants report complete optical link loss (LOS). Immediate OTDR trace testing and manhole fusion splicing required.',
                'category': 'Fiber Optic & ISP Last-Mile Splicing',
                'required_skills': ['Fiber optic cable fusion splicing', 'OTDR fault trace analysis', 'Underground conduit rodding'],
                'priority': 'critical',
                'status': 'pending',
                'target_lat': -1.2642,
                'target_lng': 36.8015,
                'address_name': 'Waiyaki Way (Opposite Delta Towers), Westlands',
                'requester': requester1
            },
            {
                'title': 'Commercial 3-Phase Main Switchboard Sparking',
                'description': 'Main 415V distribution board in basement substation is sparking and buzzing under heavy A/C load. Main 400A circuit breaker tripped, and standby generator failed to synchronize ATS.',
                'category': 'Commercial Electrical Wiring & Distribution',
                'required_skills': ['3-phase power distribution', 'Circuit breaker overhaul', '415V switchboard load balancing'],
                'priority': 'critical',
                'status': 'pending',
                'target_lat': -1.2995,
                'target_lng': 36.8172,
                'address_name': 'Hospital Road, Upper Hill Financial District',
                'requester': requester1
            },
            {
                'title': 'Rooftop Water Booster Pump Motor Failure',
                'description': 'Commercial multi-stage rooftop water booster pump motor burned out. Complete water pressure outage across upper floors 6 through 14. Replacement pump is on site.',
                'category': 'Commercial Plumbing & High-Rise Booster Systems',
                'required_skills': ['High-pressure water booster pump repair', 'PPR socket fusion welding'],
                'priority': 'high',
                'status': 'pending',
                'target_lat': -1.2891,
                'target_lng': 36.7825,
                'address_name': 'Argwings Kodhek Road, Kilimani Heights',
                'requester': requester2
            },
            {
                'title': 'Post-Renovation Apartment Deep Scrubbing',
                'description': 'Newly renovated 3-bedroom apartment requires complete post-construction cleanup. Floors covered with paint splatters, grout haze on ceramic tiles, and balcony glass covered in dust.',
                'category': 'Deep House Cleaning & Post-Construction Scrubbing',
                'required_skills': ['Industrial rotary floor scrubber operation', 'Post-renovation cement/paint residue stripping'],
                'priority': 'medium',
                'status': 'pending',
                'target_lat': -1.3060,
                'target_lng': 36.8142,
                'address_name': 'Madaraka Estate (Near Strathmore University)',
                'requester': requester2
            }
        ]

        for t_data in tasks_data:
            Task.objects.get_or_create(
                title=t_data['title'],
                defaults=t_data
            )

        # 5. Create Initial Performance Log
        PerformanceLog.objects.create(
            action='System Initialized',
            details='Database populated with initial Kenyan field technicians and Nairobi work orders.',
            log_type='info'
        )

        self.stdout.write(self.style.SUCCESS("[SUCCESS] Database successfully seeded with Kenyan technicians and work orders!"))
