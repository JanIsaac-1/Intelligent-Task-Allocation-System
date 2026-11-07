from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import User, AgentProfile, Task, Assignment, PerformanceLog

class Command(BaseCommand):
    help = "Seeds initial Kenyan users, field technicians, and Nairobi work orders into PostgreSQL"

    def handle(self, *args, **options):
        self.stdout.write("[SEED] Starting database seeding...")

        # 1. Create Administrators
        admin_user, _ = User.objects.get_or_create(
            email="jan.maina@geotask.com",
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

        # 3. Create Field Technicians (All 22 Specialized & Everyday Domains)
        agents_data = [
            {
                        "email": "samuel.kiprop@geotask.ke",
                        "username": "samuel_kiprop",
                        "full_name": "Samuel Kiprop",
                        "phone": "+254 711 234 567",
                        "title": "Senior Electrical Technician",
                        "domain": "Commercial Electrical Wiring & Distribution",
                        "experience_years": 6,
                        "skills": [
                                    "3-phase power distribution",
                                    "Circuit breaker overhaul",
                                    "415V switchboard load balancing",
                                    "Insulation resistance testing",
                                    "ATS generator changeover"
                        ],
                        "certifications": [
                                    "EPRA Class A Electrician License",
                                    "High Voltage Safety"
                        ],
                        "bio": "Specialized in commercial 3-phase switchgear, KPLC industrial meters, and emergency backup generator automatic transfer switch (ATS) maintenance.",
                        "current_lat": -1.2618,
                        "current_lng": 36.8042,
                        "current_address": "Waiyaki Way, Westlands, Nairobi",
                        "battery_level": 88,
                        "availability": "available"
            },
            {
                        "email": "brian.omondi@geotask.ke",
                        "username": "brian_omondi",
                        "full_name": "Brian Omondi",
                        "phone": "+254 722 345 678",
                        "title": "Lead Fiber Optic Splicing Engineer",
                        "domain": "Fiber Optic & ISP Last-Mile Splicing",
                        "experience_years": 5,
                        "skills": [
                                    "Fiber optic cable fusion splicing",
                                    "OTDR fault trace analysis",
                                    "Optical power meter testing",
                                    "Underground conduit rodding",
                                    "ODF patch panel termination"
                        ],
                        "certifications": [
                                    "FOA Certified Fiber Splicer Level 3",
                                    "CCNA"
                        ],
                        "bio": "Experienced fiber specialist handling high-count backbone trunk cuts, aerial drop lines, and optical distribution cabinet troubleshooting across Nairobi.",
                        "current_lat": -1.2982,
                        "current_lng": 36.7891,
                        "current_address": "Argwings Kodhek Rd, Kilimani, Nairobi",
                        "battery_level": 94,
                        "availability": "available"
            },
            {
                        "email": "david.njoroge@geotask.ke",
                        "username": "david_njoroge",
                        "full_name": "David Njoroge",
                        "phone": "+254 733 456 789",
                        "title": "Master Hydraulic Plumber",
                        "domain": "Commercial Plumbing & High-Rise Booster Systems",
                        "experience_years": 8,
                        "skills": [
                                    "High-pressure water booster pump repair",
                                    "PPR socket fusion welding",
                                    "Cast iron and PVC drainage clearing",
                                    "Pressure reducing valve (PRV) calibration"
                        ],
                        "certifications": [
                                    "Master Plumber License",
                                    "High-Pressure Booster Tech"
                        ],
                        "bio": "Commercial high-rise plumbing specialist expert in multi-stage booster pumps, apartment vertical riser bursts, and borehole pressure manifolds.",
                        "current_lat": -1.2833,
                        "current_lng": 36.8167,
                        "current_address": "Kenyatta Avenue, CBD, Nairobi",
                        "battery_level": 76,
                        "availability": "available"
            },
            {
                        "email": "grace.wanjiku@geotask.ke",
                        "username": "grace_wanjiku",
                        "full_name": "Grace Wanjiku",
                        "phone": "+254 744 567 890",
                        "title": "Lead Housekeeping & Sanitation Specialist",
                        "domain": "Deep House Cleaning & Post-Construction Scrubbing",
                        "experience_years": 4,
                        "skills": [
                                    "Industrial rotary floor scrubber operation",
                                    "Post-renovation cement/paint residue stripping",
                                    "Hot water carpet extraction",
                                    "Telescopic window washing"
                        ],
                        "certifications": [
                                    "Certified Professional Housekeeper (CPH)",
                                    "Chemical Safety"
                        ],
                        "bio": "Deep cleaning lead equipped with rotary floor scrubbers, tile acid strippers, and upholstery hot-water extractors.",
                        "current_lat": -1.3005,
                        "current_lng": 36.8225,
                        "current_address": "Ole Sangale Rd, Madaraka, Nairobi",
                        "battery_level": 91,
                        "availability": "available"
            },
            {
                        "email": "kevin.mutua@geotask.ke",
                        "username": "kevin_mutua",
                        "full_name": "Kevin Mutua",
                        "phone": "+254 755 678 901",
                        "title": "Solar PV & Battery Systems Engineer",
                        "domain": "Solar PV & Hybrid Inverter Systems",
                        "experience_years": 5,
                        "skills": [
                                    "Hybrid solar inverter configuration",
                                    "Lithium LiFePO4 battery bank diagnostics",
                                    "Solar PV string testing",
                                    "DC isolator switch wiring"
                        ],
                        "certifications": [
                                    "EPRA Solar PV Class T3",
                                    "Victron Certified Professional"
                        ],
                        "bio": "Specialized in commercial and residential hybrid solar setups (Deye, Victron, Growatt), Lithium battery BMS troubleshooting, and solar water heaters.",
                        "current_lat": -1.3211,
                        "current_lng": 36.8521,
                        "current_address": "Enterprise Rd, Industrial Area, Nairobi",
                        "battery_level": 82,
                        "availability": "available"
            },
            {
                        "email": "dennis.kamau@geotask.ke",
                        "username": "dennis_kamau",
                        "full_name": "Dennis Kamau",
                        "phone": "+254 766 789 012",
                        "title": "Mobile Auto-Electrician & Roadside Mechanic",
                        "domain": "Mobile Automotive Roadside Assistance",
                        "experience_years": 7,
                        "skills": [
                                    "Emergency 12V vehicle battery jumpstart",
                                    "Mobile OBD-II computer diagnostic scanning",
                                    "Flat tire replacement",
                                    "Alternator voltage diagnostics"
                        ],
                        "certifications": [
                                    "Certified Automotive Technician (NITA)",
                                    "Roadside Safety & Recovery"
                        ],
                        "bio": "Mobile auto-electrician providing emergency roadside battery jumpstarts, diagnostic scanning, and mobile breakdown recovery across Nairobi highways.",
                        "current_lat": -1.3325,
                        "current_lng": 36.8912,
                        "current_address": "Mombasa Road, Syokimau, Nairobi",
                        "battery_level": 68,
                        "availability": "available"
            },
            {
                        "email": "peter.koech@geotask.ke",
                        "username": "peter_koech",
                        "full_name": "Peter Koech",
                        "phone": "+254 777 890 123",
                        "title": "Lead Generator & ATS Power Specialist",
                        "domain": "Standby Diesel Generators & ATS Changeovers",
                        "experience_years": 7,
                        "skills": [
                                    "Diesel generator overhaul",
                                    "ATS synchronization panel troubleshooting",
                                    "DeepSea controller diagnostics",
                                    "Fuel injection pump calibration"
                        ],
                        "certifications": [
                                    "Generator Technician Certification",
                                    "DeepSea Electronics Certified"
                        ],
                        "bio": "Heavy power plant technician expert in Perkins, Cummins, and CAT standby diesel generator sets, automatic transfer switch panels, and alternator AVR tuning.",
                        "current_lat": -1.312,
                        "current_lng": 36.835,
                        "current_address": "Commercial Street, Industrial Area, Nairobi",
                        "battery_level": 85,
                        "availability": "available"
            },
            {
                        "email": "james.mwangi@geotask.ke",
                        "username": "james_mwangi",
                        "full_name": "James Mwangi",
                        "phone": "+254 788 901 234",
                        "title": "Borehole & Submersible Pump Systems Engineer",
                        "domain": "Borehole & Submersible Water Pumps",
                        "experience_years": 9,
                        "skills": [
                                    "Submersible borehole pump diagnostics",
                                    "Motor control center (MCC) starter repair",
                                    "Dry-run protection sensor wiring",
                                    "Deep-well riser pipe retrieval"
                        ],
                        "certifications": [
                                    "WRA Borehole Installation License",
                                    "Davis & Shirtliff Certified Technician"
                        ],
                        "bio": "Specialized in deep borehole pump installations, Grundfos SP retrieval, borehole yield testing, and high-pressure control panel overhauls.",
                        "current_lat": -1.228,
                        "current_lng": 36.885,
                        "current_address": "Thika Road, Roysambu, Nairobi",
                        "battery_level": 90,
                        "availability": "available"
            },
            {
                        "email": "victor.otieno@geotask.ke",
                        "username": "victor_otieno",
                        "full_name": "Victor Otieno",
                        "phone": "+254 799 012 345",
                        "title": "Certified Electric Fence & Security Tech",
                        "domain": "Electric Fences, Razor Wire & Perimeter Security",
                        "experience_years": 5,
                        "skills": [
                                    "High-voltage electric fence energizer repair",
                                    "Nemtek fence line fault finding",
                                    "HT wire tensioning and insulator replacement",
                                    "Razor wire coil mounting"
                        ],
                        "certifications": [
                                    "Nemtek Certified Electric Fence Installer",
                                    "EPRA Class C License"
                        ],
                        "bio": "Perimeter security wireman specializing in Nemtek and Stafix energizer fault finding, boundary wall concertina razor wire, and zone tamper alarms.",
                        "current_lat": -1.3195,
                        "current_lng": 36.728,
                        "current_address": "Karen Road, Karen, Nairobi",
                        "battery_level": 80,
                        "availability": "available"
            },
            {
                        "email": "faith.chebet@geotask.ke",
                        "username": "faith_chebet",
                        "full_name": "Faith Chebet",
                        "phone": "+254 712 345 670",
                        "title": "CCTV Surveillance & Access Control Engineer",
                        "domain": "CCTV Surveillance & Biometric Access Control",
                        "experience_years": 6,
                        "skills": [
                                    "IP PTZ camera configuration",
                                    "NVR storage array troubleshooting",
                                    "ZKTeco biometric turnstile integration",
                                    "Magnetic door lock power supply repair"
                        ],
                        "certifications": [
                                    "Hikvision Certified Security Associate",
                                    "ZKTeco Access Control Certified"
                        ],
                        "bio": "Electronic security specialist experienced in IP surveillance networks, commercial biometric turnstiles, video management software (VMS), and boom barriers.",
                        "current_lat": -1.2705,
                        "current_lng": 36.8155,
                        "current_address": "Parklands Road, Parklands, Nairobi",
                        "battery_level": 87,
                        "availability": "available"
            },
            {
                        "email": "alex.kariuki@geotask.ke",
                        "username": "alex_kariuki",
                        "full_name": "Alex Kariuki",
                        "phone": "+254 723 456 781",
                        "title": "Data Center Precision Cooling Specialist",
                        "domain": "Data Center Precision Cooling & CRAC (HVAC)",
                        "experience_years": 8,
                        "skills": [
                                    "Computer Room Air Conditioning (CRAC) diagnostics",
                                    "Refrigerant R410A leak detection",
                                    "Precision cooling compressor replacement",
                                    "Electrode steam humidifier maintenance"
                        ],
                        "certifications": [
                                    "HVAC Excellence Certified",
                                    "EPA Section 608 Universal"
                        ],
                        "bio": "Precision HVAC specialist serving critical telco server facilities, cleanroom air conditioning, CRAC chilled water valves, and dual-circuit compressors.",
                        "current_lat": -1.294,
                        "current_lng": 36.808,
                        "current_address": "Kilimanjaro Avenue, Upper Hill, Nairobi",
                        "battery_level": 78,
                        "availability": "available"
            },
            {
                        "email": "collins.kiprotich@geotask.ke",
                        "username": "collins_kiprotich",
                        "full_name": "Collins Kiprotich",
                        "phone": "+254 734 567 892",
                        "title": "WISP & Microwave Wireless Link Engineer",
                        "domain": "Point-to-Point Wireless & Microwave Internet (WISP)",
                        "experience_years": 6,
                        "skills": [
                                    "Microwave link dish azimuth alignment",
                                    "Ubiquiti airMAX optimization",
                                    "MikroTik RouterOS wireless configuration",
                                    "Rooftop telecommunications mast rigging"
                        ],
                        "certifications": [
                                    "MikroTik MTCNA / MTCRE",
                                    "Tower Rigging & Rescue Safety"
                        ],
                        "bio": "Wireless internet service provider engineer experienced in high-capacity unlicensed and licensed microwave links, tower climbing, and RF spectrum scanning.",
                        "current_lat": -1.268,
                        "current_lng": 36.772,
                        "current_address": "James Gichuru Road, Lavington, Nairobi",
                        "battery_level": 83,
                        "availability": "available"
            },
            {
                        "email": "mercy.achieng@geotask.ke",
                        "username": "mercy_achieng",
                        "full_name": "Mercy Achieng",
                        "phone": "+254 745 678 903",
                        "title": "Enterprise Structured Cabling Specialist",
                        "domain": "Structured Cabling & Enterprise LAN Infrastructure",
                        "experience_years": 4,
                        "skills": [
                                    "Cat6 / Cat6A structured cable termination",
                                    "24/48-port patch panel punching",
                                    "Fluke Versiv DSX-5000 certification testing",
                                    "Server rack cable management and dressing"
                        ],
                        "certifications": [
                                    "Fluke Networks CCTT Certified",
                                    "BICSI Installer Level 2"
                        ],
                        "bio": "Commercial data cabling specialist certified in Cat6A 10Gbps UTP/STP termination, Fluke copper certification testing, and server cabinet dressing.",
                        "current_lat": -1.2845,
                        "current_lng": 36.824,
                        "current_address": "Harambee Avenue, CBD, Nairobi",
                        "battery_level": 92,
                        "availability": "available"
            },
            {
                        "email": "joseph.ndungu@geotask.ke",
                        "username": "joseph_ndungu",
                        "full_name": "Joseph Ndung'u",
                        "phone": "+254 756 789 014",
                        "title": "ATM & Self-Service Banking Field Engineer",
                        "domain": "Banking Automation & ATM / POS Field Support",
                        "experience_years": 7,
                        "skills": [
                                    "ATM cash dispenser mechanism overhaul",
                                    "Motorized card reader sensor cleaning",
                                    "Receipt journal thermal printer repair",
                                    "POS terminal hardware troubleshooting"
                        ],
                        "certifications": [
                                    "NCR Certified ATM Engineer",
                                    "Diebold Nixdorf Hardware Certified"
                        ],
                        "bio": "Banking automation specialist handling Diebold Nixdorf and NCR multi-cassette cash presenters, motorized magnetic card readers, and retail POS payment terminals.",
                        "current_lat": -1.286,
                        "current_lng": 36.82,
                        "current_address": "Mama Ngina Street, CBD, Nairobi",
                        "battery_level": 74,
                        "availability": "available"
            },
            {
                        "email": "eric.kibet@geotask.ke",
                        "username": "eric_kibet",
                        "full_name": "Eric Kibet",
                        "phone": "+254 767 890 125",
                        "title": "Commercial Refrigeration & Cold Chain Tech",
                        "domain": "Commercial Cold Rooms & Supermarket Refrigeration",
                        "experience_years": 8,
                        "skills": [
                                    "Semi-hermetic compressor overhaul",
                                    "Cold room evaporator defrost cycle repair",
                                    "Thermostatic expansion valve (TXV) tuning",
                                    "Refrigerant R404A charging"
                        ],
                        "certifications": [
                                    "Commercial Refrigeration Mechanic License",
                                    "Bitzer / Copeland Compressor Certified"
                        ],
                        "bio": "Commercial refrigeration technician specializing in walk-in cold rooms, supermarket display freezers, Bitzer semi-hermetics, and electronic defrost controllers.",
                        "current_lat": -1.318,
                        "current_lng": 36.865,
                        "current_address": "Likoni Road, Industrial Area, Nairobi",
                        "battery_level": 81,
                        "availability": "available"
            },
            {
                        "email": "timothy.maina@geotask.ke",
                        "username": "timothy_maina",
                        "full_name": "Timothy Maina",
                        "phone": "+254 778 901 236",
                        "title": "Certified Elevator & Passenger Lift Technician",
                        "domain": "Elevator, Passenger Lift & Escalator Services",
                        "experience_years": 9,
                        "skills": [
                                    "Elevator traction motor brake adjustment",
                                    "Passenger lift door interlock mechanism repair",
                                    "Variable Frequency Drive (VVVF) tuning",
                                    "Emergency passenger entrapment rescue"
                        ],
                        "certifications": [
                                    "Certified Elevator Mechanic (CEM)",
                                    "Schindler / Otis Certified"
                        ],
                        "bio": "Certified lift mechanic specialized in passenger elevator traction drives, landing door interlocks, speed governors, and 24/7 passenger entrapment rescues.",
                        "current_lat": -1.265,
                        "current_lng": 36.802,
                        "current_address": "Rhapta Road, Westlands, Nairobi",
                        "battery_level": 89,
                        "availability": "available"
            },
            {
                        "email": "beatrice.wambui@geotask.ke",
                        "username": "beatrice_wambui",
                        "full_name": "Beatrice Wambui",
                        "phone": "+254 789 012 347",
                        "title": "Fire Alarm & Gas Suppression Engineer",
                        "domain": "Fire Alarm & FM-200 Gas Suppression Systems",
                        "experience_years": 5,
                        "skills": [
                                    "FM-200 / NOVEC gas suppression cylinder inspection",
                                    "Addressable fire alarm panel programming",
                                    "Optical smoke beam detector alignment",
                                    "Manual call point loop testing"
                        ],
                        "certifications": [
                                    "NFPA Certified Fire Protection Specialist",
                                    "FM-200 Clean Agent Certified"
                        ],
                        "bio": "Fire protection systems engineer specialized in server room gas discharge flooding, addressable loop smoke detection, and automated fire pump testing.",
                        "current_lat": -1.297,
                        "current_lng": 36.812,
                        "current_address": "Mara Road, Upper Hill, Nairobi",
                        "battery_level": 95,
                        "availability": "available"
            },
            {
                        "email": "simon.barasa@geotask.ke",
                        "username": "simon_barasa",
                        "full_name": "Simon Barasa",
                        "phone": "+254 790 123 458",
                        "title": "Pest Management & Fumigation Specialist",
                        "domain": "Fumigation & Pest Control Services",
                        "experience_years": 6,
                        "skills": [
                                    "Thermal fogging machine operation",
                                    "Residual chemical surface spraying",
                                    "Termite soil barrier trenching and injection",
                                    "Cockroach gel baiting in food premises"
                        ],
                        "certifications": [
                                    "Pest Control Products Board (PCPB) License",
                                    "Public Health Officer Certification"
                        ],
                        "bio": "Licensed public health pest exterminator specializing in multi-stage bedbug elimination, commercial kitchen pest eradication, and sub-soil termite proofing.",
                        "current_lat": -1.278,
                        "current_lng": 36.845,
                        "current_address": "Juja Road, Pangani, Nairobi",
                        "battery_level": 86,
                        "availability": "available"
            },
            {
                        "email": "lucy.njeri@geotask.ke",
                        "username": "lucy_njeri",
                        "full_name": "Lucy Njeri",
                        "phone": "+254 701 234 569",
                        "title": "Domestic Home Appliance Repair Specialist",
                        "domain": "Domestic Home Appliance Repair",
                        "experience_years": 5,
                        "skills": [
                                    "Automatic washing machine drum motor repair",
                                    "Electric/gas cooker ignition and burner maintenance",
                                    "Domestic refrigerator thermostat and gas charging",
                                    "Microwave oven magnetron testing"
                        ],
                        "certifications": [
                                    "Home Appliance Tech Certified",
                                    "EPRA Domestic Electrical Wireman"
                        ],
                        "bio": "Field technician specialized in front/top-load automatic washing machines (LG, Samsung), dual-fuel cookers, microwaves, and domestic refrigeration appliances.",
                        "current_lat": -1.215,
                        "current_lng": 36.782,
                        "current_address": "Limuru Road, Ruaka, Nairobi",
                        "battery_level": 93,
                        "availability": "available"
            },
            {
                        "email": "anthony.musyoka@geotask.ke",
                        "username": "anthony_musyoka",
                        "full_name": "Anthony Musyoka",
                        "phone": "+254 712 987 654",
                        "title": "Residential Handyman & Mounting Technician",
                        "domain": "General Handyman, TV Mounting & Furniture Assembly",
                        "experience_years": 6,
                        "skills": [
                                    "Heavy-duty TV wall bracket installation",
                                    "Gypsum hollow-wall butterfly anchor mounting",
                                    "Curtain rod and window blind drilling",
                                    "Flat-pack wardrobe and cabinet assembly"
                        ],
                        "certifications": [
                                    "Certified General Handyman",
                                    "Carpentry & Joinery Trade Test"
                        ],
                        "bio": "Residential mounting and assembly craftsman expert in gypsum swivel TV brackets, modular furniture assembly, curtain tracks, and mortise door lock replacement.",
                        "current_lat": -1.305,
                        "current_lng": 36.788,
                        "current_address": "Ngong Road, Adams Arcade, Nairobi",
                        "battery_level": 88,
                        "availability": "available"
            },
            {
                        "email": "daniel.korir@geotask.ke",
                        "username": "daniel_korir",
                        "full_name": "Daniel Korir",
                        "phone": "+254 723 876 543",
                        "title": "Accredited DStv & Home Wireless Installer",
                        "domain": "Satellite TV, DStv & Home Wi-Fi Setup",
                        "experience_years": 5,
                        "skills": [
                                    "DStv satellite dish azimuth and elevation realignment",
                                    "Satellite finder signal meter diagnostics",
                                    "Home Wi-Fi mesh range extender configuration",
                                    "Smart TV soundbar and home theater calibration"
                        ],
                        "certifications": [
                                    "MultiChoice DStv Accredited Installer",
                                    "CompTIA Network+"
                        ],
                        "bio": "Satellite entertainment and home networking tech specializing in rooftop dish alignment (E48-32 error clearance), Smart LNB multi-room setups, and whole-home Wi-Fi mesh.",
                        "current_lat": -1.302,
                        "current_lng": 36.804,
                        "current_address": "Langata Road, Nairobi West, Nairobi",
                        "battery_level": 79,
                        "availability": "available"
            },
            {
                        "email": "george.kimani@geotask.ke",
                        "username": "george_kimani",
                        "full_name": "George Kimani",
                        "phone": "+254 734 765 432",
                        "title": "Water Heating & Instant Shower Electrician",
                        "domain": "Domestic Water Heating & Instant Showers",
                        "experience_years": 6,
                        "skills": [
                                    "Lorenzetti and Enerbras instant shower element replacement",
                                    "Dedicated 20A/32A shower circuit breaker wiring",
                                    "Water heater storage geyser thermostat repair",
                                    "Pressure-relief safety valve replacement"
                        ],
                        "certifications": [
                                    "EPRA Domestic Electrician Class C",
                                    "Plumbing & Sanitary Trade Test"
                        ],
                        "bio": "Dedicated residential water heating technician expert in instant shower electrical wiring, Lorenzetti element replacements, Ariston geyser tanks, and earthing bonding.",
                        "current_lat": -1.315,
                        "current_lng": 36.792,
                        "current_address": "Muhoho Avenue, South C, Nairobi",
                        "battery_level": 84,
                        "availability": "available"
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
                    'current_address': a_data.get('current_address', 'Nairobi Metro'),
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
                'address_name': 'Madaraka Estate (Ole Sangale Road)',
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
