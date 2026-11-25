import math
import os
import numpy as np
from datetime import datetime
from zoneinfo import ZoneInfo

# Earth radius in kilometers
EARTH_RADIUS_KM = 6371.0

# Singleton holder for fine-tuned SBERT model
_SBERT_MODEL = None

def get_sbert_model():
    """Loads the fine-tuned SBERT model if present, otherwise returns None for token fallback."""
    global _SBERT_MODEL
    if _SBERT_MODEL is not None:
        return _SBERT_MODEL

    model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'fine_tuned_kenyan_field_sbert'))
    if os.path.exists(model_dir):
        try:
            from sentence_transformers import SentenceTransformer
            _SBERT_MODEL = SentenceTransformer(model_dir)
            print(f"[OK] Loaded fine-tuned SBERT model from {model_dir}")
            return _SBERT_MODEL
        except Exception as e:
            print(f"[WARN] Could not load SBERT from {model_dir}: {e}")
    return None

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points on Earth in kilometers."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(EARTH_RADIUS_KM * c, 2)

def calculate_proximity_score(distance_km: float, max_radius_km: float = 25.0) -> float:
    """Computes proximity score S_proximity in range [0.0, 1.0]. Closer is higher."""
    if distance_km <= 0.0:
        return 1.0
    if distance_km >= max_radius_km:
        return 0.05
    return round(max(0.05, 1.0 - (distance_km / max_radius_km)), 4)

def calculate_workload_score(active_tasks_count: int, max_tasks: int = 3) -> float:
    """Computes workload score S_workload using inverse factor: 1 / (1 + activeTasks)."""
    return round(1.0 / (1.0 + active_tasks_count), 4)

def calculate_skill_similarity(task_text: str, agent_profile_text: str, agent_skills: list, task_required_skills: list) -> float:
    """
    Computes semantic similarity score S_skill.
    Uses fine-tuned SBERT model if available, otherwise computes token semantic overlap.
    """
    model = get_sbert_model()
    if model is not None:
        try:
            emb_task = model.encode(task_text, convert_to_numpy=True)
            emb_agent = model.encode(agent_profile_text, convert_to_numpy=True)
            
            dot = np.dot(emb_task, emb_agent)
            norm_a = np.linalg.norm(emb_task)
            norm_b = np.linalg.norm(emb_agent)
            if norm_a > 0 and norm_b > 0:
                sim = float(dot / (norm_a * norm_b))
                return round(max(0.05, min(0.99, sim)), 4)
        except Exception as e:
            print(f"Error computing SBERT similarity: {e}")

    # Fallback Token Jaccard + Keyword Match
    task_words = set(task_text.lower().split())
    agent_words = set(agent_profile_text.lower().split())
    if agent_skills:
        for skill in agent_skills:
            agent_words.update(skill.lower().split())

    intersection = task_words.intersection(agent_words)
    union = task_words.union(agent_words)
    base_jaccard = len(intersection) / len(union) if union else 0.1

    # Check skill array matches
    skill_match_count = 0
    if task_required_skills and agent_skills:
        agent_skill_str = " ".join([s.lower() for s in agent_skills])
        for req in task_required_skills:
            if req.lower() in agent_skill_str:
                skill_match_count += 1
        skill_boost = (skill_match_count / len(task_required_skills)) * 0.4
    else:
        skill_boost = 0.2

    sim = min(0.98, max(0.15, (base_jaccard * 2.5) + skill_boost + 0.3))
    return round(sim, 4)
def is_agent_on_duty_nairobi(agent):
    """Evaluates whether a technician is actively on duty in Nairobi Metro time."""
    if getattr(agent, 'is_on_call', False):
        return True, 'on_call', 'On-Call (Standby)'
    
    start_str = getattr(agent, 'shift_start', '08:00') or '08:00'
    end_str = getattr(agent, 'shift_end', '17:00') or '17:00'
    
    try:
        now_nairobi = datetime.now(ZoneInfo('Africa/Nairobi'))
        curr_min = now_nairobi.hour * 60 + now_nairobi.minute
        
        s_parts = [int(p) for p in start_str.split(':')[:2]]
        e_parts = [int(p) for p in end_str.split(':')[:2]]
        start_min = s_parts[0] * 60 + (s_parts[1] if len(s_parts) > 1 else 0)
        end_min = e_parts[0] * 60 + (e_parts[1] if len(e_parts) > 1 else 0)
        
        if start_min <= end_min:
            on_duty = (start_min <= curr_min <= end_min)
        else:
            on_duty = (curr_min >= start_min or curr_min <= end_min)
            
        if on_duty:
            return True, 'on_duty', 'Available (On Duty)'
        return False, 'off_duty', f'Off Duty (Shift Ended at {end_str})'
    except Exception:
        return True, 'on_duty', 'Available (On Duty)'

GENERIC_CATEGORIES = {'', 'general field service', 'auto-detected (nlp)', 'auto'}


def infer_task_domain_and_skills(title: str, description: str, agents_queryset=None):
    """
    Uses fine-tuned SBERT semantic similarity against enrolled technician profiles
    to infer the closest service domain and prerequisite skills from natural language text.
    """
    text = f"{title}. {description}".strip()
    if not text:
        return 'General Field Service', []

    model = get_sbert_model()
    if model is not None and agents_queryset is not None:
        try:
            task_emb = model.encode(text, normalize_embeddings=True)
            best_sim = -1.0
            best_agent = None
            for agent in agents_queryset:
                emb = getattr(agent, 'skill_embedding', None)
                if not emb:
                    continue
                sim = float(np.dot(task_emb, np.array(emb, dtype=np.float32)))
                if sim > best_sim:
                    best_sim = sim
                    best_agent = agent
            if best_agent is not None and best_sim >= 0.20:
                skills = list(best_agent.skills[:3]) if isinstance(best_agent.skills, list) else []
                return best_agent.domain, skills
        except Exception as e:
            print(f"[WARN] SBERT domain inference failed: {e}")

    return 'General Field Service', []


def compute_agent_embedding(agent):
    """Computes normalized 384-dim SBERT profile embedding for an AgentProfile instance."""
    model = get_sbert_model()
    if model is None:
        return None
    skills_str = ", ".join(agent.skills) if isinstance(agent.skills, list) else str(agent.skills or '')
    certs_str = ", ".join(agent.certifications) if isinstance(agent.certifications, list) else str(agent.certifications or '')
    profile_text = f"{agent.title} in {agent.domain}. Skills: {skills_str}. Certifications: {certs_str}. {agent.bio or ''}"
    try:
        emb = model.encode(profile_text, normalize_embeddings=True)
        return [float(x) for x in emb]
    except Exception as e:
        print(f"[WARN] Could not compute embedding for agent {agent.id}: {e}")
        return None


DOMAIN_CATALOG = [
    {
        'domain': 'Fiber Optic & ISP Last-Mile Splicing',
        'default_title': 'Fiber Optic Splicing Technician',
        'keywords': ('fiber', 'fibre', 'splic', 'otdr', 'ftth', 'gpon', 'olt', 'onu', 'patch cord', 'attenuation'),
        'skills': [
            'Fiber optic cable fusion splicing',
            'OTDR fault trace analysis',
            'FTTH drop cable termination',
            'Optical power meter testing',
            'GPON ONT / OLT commissioning',
        ],
    },
    {
        'domain': 'Commercial Electrical Wiring & Distribution',
        'default_title': 'Commercial Electrical Technician',
        'keywords': ('electrical', 'electrician', '3-phase', 'three-phase', 'switchboard', 'circuit breaker', 'megger', 'earthing', '415v', 'wiring'),
        'skills': [
            '3-phase power distribution',
            'Circuit breaker overhaul',
            '415V switchboard load balancing',
            'Insulation resistance Megger testing',
            'Phase rotation diagnostics',
        ],
    },
    {
        'domain': 'Solar PV & Hybrid Inverter Systems',
        'default_title': 'Solar PV & Inverter Specialist',
        'keywords': ('solar', 'photovoltaic', 'inverter', 'mppt', 'lifepo4', 'victron', 'deye', 'pv string', 'battery bank'),
        'skills': [
            'Hybrid solar inverter configuration',
            'Lithium LiFePO4 battery bank diagnostics',
            'Solar PV string testing (Voc/Isc)',
            'DC isolator switch wiring',
            'Grid-tie export limit configuration',
        ],
    },
    {
        'domain': 'Standby Diesel Generators & ATS Changeovers',
        'default_title': 'Generator & ATS Power Specialist',
        'keywords': ('generator', 'genset', 'diesel', 'ats', 'automatic transfer switch', 'perkins', 'cummins', 'deepsea', 'comap', 'alternator'),
        'skills': [
            'Diesel generator overhaul',
            'ATS synchronization panel troubleshooting',
            'DeepSea / ComAp controller diagnostics',
            'Fuel injection pump calibration',
            'Alternator AVR voltage tuning',
        ],
    },
    {
        'domain': 'Borehole & Submersible Water Pumps',
        'default_title': 'Borehole & Submersible Pump Engineer',
        'keywords': ('borehole', 'submersible', 'grundfos', 'davis & shirtliff', 'riser pipe', 'well yield', 'dry-run'),
        'skills': [
            'Submersible borehole pump diagnostics',
            'Motor control center (MCC) starter repair',
            'Dry-run protection sensor wiring',
            'Deep-well riser pipe retrieval',
            'Borehole yield flow rate testing',
        ],
    },
    {
        'domain': 'Commercial Plumbing & High-Rise Booster Systems',
        'default_title': 'Master Hydraulic Plumber',
        'keywords': ('plumb', 'booster pump', 'ppr', 'drainage', 'sewer', 'pipefit', 'prv', 'pressure reducing', 'sanitary'),
        'skills': [
            'High-pressure water booster pump repair',
            'PPR socket fusion welding',
            'Cast iron and PVC drainage clearing',
            'Pressure reducing valve (PRV) calibration',
            'Water meter manifold overhaul',
        ],
    },
    {
        'domain': 'Electric Fences, Razor Wire & Perimeter Security',
        'default_title': 'Perimeter Security & Electric Fence Technician',
        'keywords': ('electric fence', 'energizer', 'nemtek', 'stafix', 'razor wire', 'perimeter security'),
        'skills': [
            'High-voltage electric fence energizer repair',
            'Nemtek / Stafix fence line fault finding',
            'HT wire tensioning and insulator replacement',
            'Earth loop resistance optimization',
            'Razor wire coil mounting',
        ],
    },
    {
        'domain': 'CCTV Surveillance & Biometric Access Control',
        'default_title': 'CCTV & Access Control Engineer',
        'keywords': ('cctv', 'biometric', 'zkteco', 'hikvision', 'dahua', 'nvr', 'ptz', 'access control', 'boom barrier', 'turnstile'),
        'skills': [
            'IP PTZ camera configuration',
            'NVR storage array troubleshooting',
            'ZKTeco biometric turnstile integration',
            'Magnetic door lock power supply repair',
            'Video management software (VMS) setup',
        ],
    },
    {
        'domain': 'Data Center Precision Cooling & CRAC (HVAC)',
        'default_title': 'HVAC & CRAC Certified Engineer',
        'keywords': ('hvac', 'crac', 'precision cooling', 'chiller', 'vrf', 'r410a', 'r407c', 'air conditioning', 'humidifier'),
        'skills': [
            'Computer Room Air Conditioning (CRAC) diagnostics',
            'Refrigerant R410A / R407C leak detection',
            'Precision cooling compressor replacement',
            'EC condenser fan motor speed control',
            'Chilled water control valve calibration',
        ],
    },
    {
        'domain': 'Point-to-Point Wireless & Microwave Internet (WISP)',
        'default_title': 'WISP & Microwave Link Engineer',
        'keywords': ('microwave', 'wisp', 'ubiquiti', 'airmax', 'mikrotik', 'routeros', 'ptp link', 'mast rigging', 'rf spectrum'),
        'skills': [
            'Microwave link dish azimuth alignment',
            'Ubiquiti airMAX / LTU link optimization',
            'MikroTik RouterOS wireless configuration',
            'Gigabit PoE surge protection installation',
            'RF noise spectrum analysis',
        ],
    },
    {
        'domain': 'Structured Cabling & Enterprise LAN Infrastructure',
        'default_title': 'Structured Cabling & LAN Specialist',
        'keywords': ('structured cabling', 'cat6', 'patch panel', 'fluke', 'keystone', 'server rack', 'lan cabling', 'ethernet cabling'),
        'skills': [
            'Cat6 / Cat6A structured cable termination',
            '24/48-port patch panel punching',
            'Fluke Versiv DSX-5000 certification testing',
            'Server rack cable management and dressing',
            'Keystone jack modular termination',
        ],
    },
    {
        'domain': 'Banking Automation & ATM / POS Field Support',
        'default_title': 'ATM & Banking Automation Field Engineer',
        'keywords': ('atm', 'cash dispenser', 'ncr', 'diebold', 'nixdorf', 'pos terminal', 'pdq', 'card reader'),
        'skills': [
            'ATM cash dispenser mechanism overhaul',
            'Motorized card reader sensor cleaning',
            'Receipt journal thermal printer repair',
            'Cash deposit automation module calibration',
            'POS / PDQ terminal hardware troubleshooting',
        ],
    },
    {
        'domain': 'Commercial Cold Rooms & Supermarket Refrigeration',
        'default_title': 'Commercial Refrigeration Specialist',
        'keywords': ('cold room', 'refrigerat', 'compressor', 'evaporator', 'defrost', 'txv', 'r404a', 'r134a', 'dixell', 'eliwell'),
        'skills': [
            'Semi-hermetic compressor overhaul',
            'Cold room evaporator defrost cycle repair',
            'Thermostatic expansion valve (TXV) tuning',
            'Refrigerant R404A / R134a charging',
            'Digital temperature controller programming',
        ],
    },
    {
        'domain': 'Elevator, Passenger Lift & Escalator Services',
        'default_title': 'Certified Elevator & Lift Technician',
        'keywords': ('elevator', 'passenger lift', 'escalator', 'hoistway', 'vvvf', 'schindler', 'otis', 'kone'),
        'skills': [
            'Elevator traction motor brake adjustment',
            'Passenger lift door interlock mechanism repair',
            'Hoistway leveling sensor calibration',
            'Elevator safety governor testing',
            'Variable Frequency Drive (VVVF) tuning',
        ],
    },
    {
        'domain': 'Fire Alarm & FM-200 Gas Suppression Systems',
        'default_title': 'Fire Alarm & Suppression Systems Engineer',
        'keywords': ('fire alarm', 'fm-200', 'novec', 'smoke detector', 'nfpa', 'suppression', 'fire pump', 'fire damper'),
        'skills': [
            'FM-200 / NOVEC gas suppression cylinder inspection',
            'Addressable fire alarm panel programming',
            'Optical smoke beam detector alignment',
            'Manual call point (MCP) loop testing',
            'Diesel fire pump automated start test',
        ],
    },
    {
        'domain': 'Deep House Cleaning & Post-Construction Scrubbing',
        'default_title': 'Deep Cleaning & Sanitation Lead',
        'keywords': ('deep clean', 'post-construction', 'carpet extraction', 'housekeeping', 'floor scrubber', 'sanitization', 'upholstery'),
        'skills': [
            'Industrial rotary floor scrubber operation',
            'Post-renovation cement/paint residue stripping',
            'High-pressure hot water carpet extraction',
            'Telescopic squeegee high-window washing',
            'Sofa fabric shampooing and deodorizing',
        ],
    },
    {
        'domain': 'Fumigation & Pest Control Services',
        'default_title': 'Pest Control & Fumigation Specialist',
        'keywords': ('fumigat', 'pest control', 'termite', 'bedbug', 'cockroach', 'rodent', 'pcpb', 'fogging'),
        'skills': [
            'Thermal fogging machine operation',
            'Residual chemical surface spraying',
            'Termite soil barrier trenching and injection',
            'Bedbug multi-stage eradication',
            'Rodent bait station servicing',
        ],
    },
    {
        'domain': 'Domestic Home Appliance Repair',
        'default_title': 'Domestic Appliance Repair Technician',
        'keywords': ('washing machine', 'cooker', 'microwave', 'magnetron', 'water dispenser', 'dishwasher', 'home appliance'),
        'skills': [
            'Automatic washing machine drum motor repair',
            'Electric/gas cooker ignition and burner maintenance',
            'Domestic refrigerator thermostat and gas charging',
            'Microwave oven magnetron testing',
            'Dishwasher water drain pump overhaul',
        ],
    },
    {
        'domain': 'General Handyman, TV Mounting & Furniture Assembly',
        'default_title': 'General Maintenance Handyman',
        'keywords': ('handyman', 'tv mounting', 'tv bracket', 'furniture assembly', 'carpentry', 'curtain rod', 'mortise lock'),
        'skills': [
            'Heavy-duty TV wall bracket installation',
            'Gypsum hollow-wall butterfly anchor mounting',
            'Flat-pack wardrobe and cabinet assembly',
            'Mortise door lock and handle replacement',
            'Curtain rod and window blind drilling',
        ],
    },
    {
        'domain': 'Satellite TV, DStv & Home Wi-Fi Setup',
        'default_title': 'DStv & Home Entertainment Technician',
        'keywords': ('dstv', 'satellite', 'lnb', 'multichoice', 'soundbar', 'home theater', 'wi-fi mesh', 'decoder'),
        'skills': [
            'DStv satellite dish azimuth and elevation realignment',
            'Satellite finder signal meter diagnostics',
            'Home Wi-Fi mesh range extender configuration',
            'Smart TV soundbar calibration',
            'Quad LNB multi-room decoder distribution',
        ],
    },
    {
        'domain': 'Mobile Automotive Roadside Assistance',
        'default_title': 'Mobile Auto-Electrician & Roadside Mechanic',
        'keywords': ('roadside', 'obd-ii', 'obd2', 'jumpstart', 'vehicle battery', 'automotive', 'tire replacement', 'radiator coolant'),
        'skills': [
            'Emergency 12V vehicle battery jumpstart',
            'Mobile OBD-II computer diagnostic scanning',
            'Flat tire replacement and wheel recovery',
            'Alternator charging voltage testing',
            'Emergency radiator coolant hose leak repair',
        ],
    },
    {
        'domain': 'Domestic Water Heating & Instant Showers',
        'default_title': 'Water Heating & Instant Shower Technician',
        'keywords': ('instant shower', 'lorenzetti', 'enerbras', 'geyser', 'water heater', 'heating element', 'ariston'),
        'skills': [
            'Lorenzetti and Enerbras instant shower element replacement',
            'Dedicated 20A/32A shower circuit breaker wiring',
            'Water heater storage geyser thermostat repair',
            'Earth continuity bonding for wet areas',
            'Pressure-relief safety valve replacement',
        ],
    },
    {
        'domain': 'Software Engineering & Full-Stack Systems',
        'default_title': 'Full-Stack Software Engineer',
        'keywords': (
            'software engineer', 'full-stack', 'full stack', 'frontend', 'backend',
            'javascript', 'typescript', 'react', 'node.js', 'nodejs', 'next.js',
            'python', 'django', 'flask', 'fastapi', 'rest api', 'restful', 'graphql',
            'postgresql', 'mongodb', 'mysql', 'docker', 'kubernetes', 'git', 'ci/cd',
        ),
        'skills': [
            'Full-Stack Web Development',
            'RESTful API Design',
            'React.js & Frontend Architecture',
            'Node.js & Backend Services',
            'Relational & NoSQL Databases',
        ],
    },
    {
        'domain': 'Enterprise IT Infrastructure & Cloud Operations',
        'default_title': 'IT Systems & Network Administrator',
        'keywords': (
            'system administrator', 'sysadmin', 'devops', 'cloud infrastructure', 'aws',
            'azure', 'gcp', 'linux', 'active directory', 'vmware', 'cisco', 'firewall',
            'vpn', 'helpdesk', 'it support', 'cybersecurity',
        ),
        'skills': [
            'Linux & Windows Server Administration',
            'Cloud Infrastructure (AWS / Azure)',
            'Network Routing, Switching & Firewalls',
            'Identity & Access Management',
            'IT Incident Triage & Support',
        ],
    },
]

_DOMAIN_PROTOTYPE_EMBEDDINGS = None


def _get_domain_prototypes(model):
    """Lazily computes normalized SBERT embeddings for every entry in DOMAIN_CATALOG."""
    global _DOMAIN_PROTOTYPE_EMBEDDINGS
    if _DOMAIN_PROTOTYPE_EMBEDDINGS is not None:
        return _DOMAIN_PROTOTYPE_EMBEDDINGS
    if model is None:
        return None
    texts = [
        f"{entry['domain']}. Role: {entry['default_title']}. Keywords: {', '.join(entry['keywords'][:8])}. Skills: {', '.join(entry['skills'])}."
        for entry in DOMAIN_CATALOG
    ]
    embs = model.encode(texts, normalize_embeddings=True)
    _DOMAIN_PROTOTYPE_EMBEDDINGS = embs
    return embs


def _encode_document_chunks(model, clean_text: str):
    """Encodes overlapping chunks across the full document and returns a unit-normalized vector."""
    if not clean_text:
        return None
    chunk_size = 1100
    stride = 900
    chunks = []
    pos = 0
    while pos < len(clean_text) and len(chunks) < 6:
        chunks.append(clean_text[pos:pos + chunk_size])
        pos += stride
    embs = model.encode(chunks, normalize_embeddings=True)
    mean_emb = np.mean(embs, axis=0)
    norm = float(np.linalg.norm(mean_emb))
    if norm > 0:
        return mean_emb / norm
    return embs[0]


def _extract_experience_years(clean_text: str, lower_text: str):
    """Extracts experience years from explicit mentions or employment date ranges."""
    import re

    explicit = re.findall(
        r'(\d{1,2})\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp|relevant|proven|hands-on)?',
        lower_text,
    )
    if explicit:
        best = max(int(v) for v in explicit)
        if 1 <= best <= 40:
            return best

    # Compute span from work history date ranges like "2019 - Present" or "Jan 2020 - Dec 2023"
    current_year = datetime.now().year
    ranges = re.findall(
        r'(19\d{2}|20\d{2})\s*(?:–|—|-|\bto\b)\s*(19\d{2}|20\d{2}|present|current|now|date)',
        lower_text,
    )
    valid_spans = []
    for start_s, end_s in ranges:
        start_y = int(start_s)
        end_y = current_year if end_s in ('present', 'current', 'now', 'date') else int(end_s)
        if 1980 <= start_y <= current_year and start_y <= end_y <= current_year + 1:
            valid_spans.append((start_y, end_y))
    if valid_spans:
        earliest = min(s for s, _ in valid_spans)
        latest = max(e for _, e in valid_spans)
        span = latest - earliest
        if span >= 1:
            return min(35, span)
    return None


def _extract_bio_summary(clean_text: str) -> str:
    """Extracts clean summary/profile prose without contact headers or raw noise."""
    import re

    lines = [ln.strip() for ln in clean_text.splitlines()]
    summary_headers = re.compile(
        r'^(?:professional\s+summary|executive\s+summary|career\s+summary|summary|profile|about\s+me|career\s+objective|objective|job\s+summary|role\s+overview)\s*:?\s*$',
        re.I,
    )
    stop_headers = re.compile(
        r'^(?:skills|technical\s+skills|core\s+competencies|key\s+skills|work\s+experience|experience|employment|education|certifications|licenses|projects|references|languages)\s*:?\s*$',
        re.I,
    )

    for idx, line in enumerate(lines):
        inline_match = re.match(
            r'^(?:professional\s+summary|summary|profile|objective|about)\s*[:\-]\s*(.+)$',
            line,
            re.I,
        )
        if inline_match:
            collected = [inline_match.group(1).strip()]
            for nxt in lines[idx + 1:idx + 8]:
                if not nxt:
                    if len(' '.join(collected)) >= 80:
                        break
                    continue
                if stop_headers.match(nxt):
                    break
                collected.append(nxt)
            bio = ' '.join(collected)
            return bio[:400].rstrip()

        if summary_headers.match(line):
            collected = []
            for nxt in lines[idx + 1:idx + 10]:
                if not nxt:
                    if len(' '.join(collected)) >= 80:
                        break
                    continue
                if stop_headers.match(nxt) or nxt.isupper() and len(nxt.split()) <= 4:
                    break
                collected.append(nxt)
            if collected:
                return ' '.join(collected)[:400].rstrip()

    # Fallback: skip short header/contact lines and assemble substantive body text
    body_lines = []
    for line in lines:
        if not line:
            continue
        if '@' in line or re.search(r'\+?\d[\d\s\-()]{7,}', line) or 'http' in line.lower():
            continue
        if stop_headers.match(line) or len(line.split()) <= 3:
            continue
        body_lines.append(line)
        if len(' '.join(body_lines)) >= 360:
            break
    return ' '.join(body_lines)[:400].rstrip()


def _extract_title_from_text(clean_text: str, bio: str) -> str:
    """Extracts the candidate/job role title directly stated in the document."""
    import re

    for line in [ln.strip() for ln in clean_text.splitlines()[:12] if ln.strip()]:
        label_match = re.match(r'^(?:job\s*title|title|role|position|designation)\s*[:\-]\s*(.+)$', line, re.I)
        if label_match:
            val = label_match.group(1).strip()
            if 3 <= len(val) <= 75:
                return val

    # Match "<Role Title> with <strong expertise / N years / experience>..." in summary
    if bio:
        lead_match = re.match(
            r'^([A-Z][A-Za-z0-9/&,\-\s]{3,65}?)\s+(?:with\s+(?:\d+|strong|extensive|over|proven|hands-on)|specializing\s+in|experienced\s+in|seeking\s+|who\s+)',
            bio.strip(),
        )
        if lead_match:
            title_cand = lead_match.group(1).strip(' ,.-')
            if 2 <= len(title_cand.split()) <= 7:
                return title_cand

    # Look at header lines 2..7 for a standalone role headline
    role_words = (
        'engineer', 'technician', 'specialist', 'developer', 'mechanic', 'electrician',
        'plumber', 'installer', 'inspector', 'administrator', 'architect', 'lead', 'manager',
        'wireman', 'officer', 'operator', 'analyst', 'consultant',
    )
    for line in [ln.strip() for ln in clean_text.splitlines()[:10] if ln.strip()]:
        if '@' in line or any(ch.isdigit() for ch in line) or len(line) > 70:
            continue
        low = line.lower()
        if any(rw in low for rw in role_words) and 2 <= len(line.split()) <= 7:
            return line
    return ''


CONCRETE_SKILL_PATTERNS = [
    # Software & Web Engineering
    (r'\breact(?:\.js|js)?\b', 'React.js'),
    (r'\bnext(?:\.js|js)\b', 'Next.js'),
    (r'\bnode(?:\.js|js)?\b', 'Node.js'),
    (r'\bexpress(?:\.js|js)?\b', 'Express.js'),
    (r'\btypescript\b', 'TypeScript'),
    (r'\bjavascript\b', 'JavaScript'),
    (r'\bpython\b', 'Python'),
    (r'\bdjango\b', 'Django'),
    (r'\bfastapi\b', 'FastAPI'),
    (r'\bflask\b', 'Flask'),
    (r'\bjava\b', 'Java'),
    (r'\bc#\b', 'C#'),
    (r'\bphp\b', 'PHP'),
    (r'\blaravel\b', 'Laravel'),
    (r'\bhtml5?\b', 'HTML5'),
    (r'\bcss3?\b', 'CSS3'),
    (r'\btailwind(?:\s+css)?\b', 'Tailwind CSS'),
    (r'\bredux\b', 'Redux'),
    (r'\bgraphql\b', 'GraphQL'),
    (r'\brest(?:ful)?\s*apis?\b', 'REST APIs'),
    (r'\bpostgresql\b', 'PostgreSQL'),
    (r'\bmysql\b', 'MySQL'),
    (r'\bmongodb\b', 'MongoDB'),
    (r'\bredis\b', 'Redis'),
    (r'\bsql\b', 'SQL'),
    (r'\bdocker\b', 'Docker'),
    (r'\bkubernetes\b', 'Kubernetes'),
    (r'\baws\b', 'AWS'),
    (r'\bazure\b', 'Microsoft Azure'),
    (r'\bgcp\b', 'Google Cloud (GCP)'),
    (r'\bgit\b', 'Git'),
    (r'\bci/cd\b', 'CI/CD'),
    (r'\blinux\b', 'Linux'),
    # Field / Telecom / Power Engineering Concrete Skills
    (r'\bfusion\s+splic(?:ing|e)\b', 'Fiber optic cable fusion splicing'),
    (r'\botdr\b', 'OTDR fault trace analysis'),
    (r'\bftth\b', 'FTTH drop cable termination'),
    (r'\bgpon\b', 'GPON ONT / OLT commissioning'),
    (r'\b3[\s\-]?phase\b', '3-phase power distribution'),
    (r'\bmegger\b', 'Insulation resistance Megger testing'),
    (r'\bswitchboard\b', 'Switchboard load balancing'),
    (r'\bcircuit\s+breaker\b', 'Circuit breaker overhaul'),
    (r'\bhybrid\s+(?:solar\s+)?inverter\b', 'Hybrid solar inverter configuration'),
    (r'\bmppt\b', 'MPPT charge controller setup'),
    (r'\blifepo4\b', 'Lithium LiFePO4 battery bank diagnostics'),
    (r'\bdiesel\s+generator\b', 'Diesel generator overhaul'),
    (r'\bats\b', 'ATS synchronization panel troubleshooting'),
    (r'\bdeepsea\b', 'DeepSea / ComAp controller diagnostics'),
    (r'\bsubmersible\s+(?:borehole\s+)?pump\b', 'Submersible borehole pump diagnostics'),
    (r'\bppr\b', 'PPR socket fusion welding'),
    (r'\bbooster\s+pump\b', 'High-pressure water booster pump repair'),
    (r'\bhvac\b', 'HVAC system diagnostics'),
    (r'\bchiller\b', 'Commercial chiller maintenance'),
    (r'\bcc(?:tv)?\s+camera|\bip\s+camera|\bptz\b', 'IP PTZ camera configuration'),
    (r'\bzkteco\b', 'ZKTeco biometric integration'),
    (r'\bnemtek\b', 'Nemtek electric fence fault finding'),
    (r'\bmikrotik\b', 'MikroTik RouterOS configuration'),
    (r'\bubiquiti\b', 'Ubiquiti wireless link optimization'),
    (r'\bcat6a?\b', 'Cat6 / Cat6A structured cabling'),
    (r'\bfluke\b', 'Fluke Versiv certification testing'),
    (r'\bfm[\s\-]?200\b', 'FM-200 gas suppression inspection'),
    (r'\bobd[\s\-]?(?:ii|2)\b', 'Mobile OBD-II diagnostic scanning'),
]


def _normalize_cv_text(raw_text: str) -> str:
    """Normalizes non-breaking spaces, Wingdings/PDF bullets, and line endings for clean parsing."""
    import re

    text = (raw_text or '').replace('\r\n', '\n').replace('\r', '\n')
    text = text.replace('\xa0', ' ').replace('\u200b', '').replace('\ufeff', '')
    # Map common PDF Wingdings/Symbol bullet codepoints to standard bullet glyph
    text = re.sub(r'[\uf0b7\uf0a7\uf0d8\uf0fc\u2022\u2023\u25e6\u2043\u2219\u25cf\u25aa\u25ab➢➤❖]', '• ', text)
    # Collapse excess spaces per line while preserving newlines
    lines = [re.sub(r'[ \t]+', ' ', ln).strip() for ln in text.splitlines()]
    return '\n'.join(lines).strip()


def _extract_skills_from_sections(clean_text: str):
    """Parses skills directly listed in Skills / Competencies / Requirements sections."""
    import re

    lines = [ln.strip() for ln in clean_text.splitlines()]
    skill_hdr = re.compile(
        r'^(?:•\s*)?(?:technical\s+skills|core\s+skills|professional\s+skills|key\s+skills|key\s+technical\s+skills|'
        r'core\s+competencies|key\s+competencies|competencies|areas\s+of\s+expertise|technical\s+expertise|expertise|'
        r'skills\s*(?:&|and)\s*(?:competencies|expertise|tools|technologies|abilities)|'
        r'skills|technologies|tech\s+stack|tools\s*(?:&|and)\s*(?:technologies|frameworks)|'
        r'programming\s+languages|software\s+skills|it\s+skills|relevant\s+skills|'
        r'required\s+skills|qualifications\s*(?:&|and)\s*skills|technical\s+requirements)\s*[:\-–—]?\s*(.*)$',
        re.I,
    )
    stop_hdr = re.compile(
        r'^(?:•\s*)?(?:work\s+experience|professional\s+experience|relevant\s+experience|experience|'
        r'employment(?:\s+history)?|career\s+history|work\s+history|education|academic(?:\s+background)?|'
        r'certifications?(?:\s*(?:&|and)\s*licenses?)?|licenses?|projects?|key\s+projects|'
        r'publications?|references?|achievements?|awards?|interests?|hobbies?|spoken\s+languages?)\b',
        re.I,
    )

    extracted = []
    in_section = False
    section_lines_read = 0

    def _add_tokens(chunk: str):
        # Strip optional category label like "Frontend: React.js, Next.js" or "Languages - JS, Python"
        cat_m = re.match(r'^([A-Za-z0-9 &/\-+]{2,32}?)\s*[:\-–—]\s+(.+)$', chunk.strip())
        if cat_m and len(cat_m.group(1).split()) <= 4:
            chunk = cat_m.group(2)
        # Split on delimiters, spaced slashes, and trailing ", and "
        normalized = re.sub(r',\s+and\s+', ', ', chunk)
        for part in re.split(r'[,;|•‣·]+|\s+/\s+|\s{2,}', normalized):
            item = re.sub(r'^[\-\*\d\.\)\s•]+', '', part).strip(' .;:-')
            if not item or len(item) < 2 or len(item) > 55:
                continue
            if len(item.split()) > 6:
                continue
            if item.lower() not in [e.lower() for e in extracted]:
                extracted.append(item)

    for line in lines:
        if not line:
            if in_section and extracted:
                section_lines_read += 1
                if section_lines_read > 20:
                    break
            continue

        hdr_m = skill_hdr.match(line)
        if hdr_m:
            in_section = True
            section_lines_read = 0
            if hdr_m.group(1):
                _add_tokens(hdr_m.group(1))
            continue

        if in_section:
            if stop_hdr.match(line):
                break
            section_lines_read += 1
            _add_tokens(line)
            if len(extracted) >= 14 or section_lines_read >= 18:
                break

    return extracted


def _keyword_score_for_domain(lower_text: str, keywords: tuple) -> float:
    """Computes normalized keyword density score in [0.0, 1.0] using boundary-aware matching."""
    import re

    hits = 0
    for kw in keywords:
        if len(kw) <= 4 and ' ' not in kw:
            if re.search(rf'\b{re.escape(kw)}\b', lower_text):
                hits += 1
        elif kw in lower_text:
            hits += 1
    if hits == 0:
        return 0.0
    return min(1.0, hits / 4.0)


def extract_profile_from_text(full_text: str, agents_queryset=None):
    """
    Extracts structured technician/candidate profile attributes (name, title, domain, skills,
    certifications, contact info, experience, bio summary) grounded strictly in the document
    text, ranked across the canonical domain catalog with fine-tuned SBERT + keyword verification.
    """
    import re

    clean_text = _normalize_cv_text(full_text)
    lower_text = clean_text.lower()

    # 1. Contact & experience extraction
    email_match = re.search(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', clean_text)
    phone_match = re.search(
        r'(?:\+254|0)[\s\-]?[17]\d{2}[\s\-]?\d{3}[\s\-]?\d{3}|\+\d{1,3}[\s\-]?(?:\(?\d{2,4}\)?[\s\-]?){2,4}\d{2,4}',
        clean_text,
    )

    detected_email = email_match.group(0) if email_match else ''
    detected_phone = phone_match.group(0).strip() if phone_match else ''
    detected_exp = _extract_experience_years(clean_text, lower_text)

    # Candidate name heuristic from explicit label or header lines
    candidate_name = ''
    header_stop = (
        'curriculum', 'vitae', 'resume', 'job description', 'profile', 'summary',
        'engineer', 'technician', 'developer', 'specialist', 'nairobi', 'kenya',
    )
    for line in [ln.strip() for ln in clean_text.splitlines()[:8] if ln.strip()]:
        label_match = re.match(r'^(?:name|full\s*name|candidate|applicant)\s*[:\-]\s*(.+)$', line, re.I)
        if label_match:
            candidate_name = label_match.group(1).strip()
            break
        words = line.split()
        if (
            2 <= len(words) <= 4
            and '@' not in line
            and not any(ch.isdigit() for ch in line)
            and not any(k in line.lower() for k in header_stop)
            and all(w[0].isupper() for w in words if w.isalpha())
        ):
            candidate_name = line.title() if line.isupper() else line
            break

    # 2. Summary & explicit document role title
    detected_bio = _extract_bio_summary(clean_text)
    doc_title = _extract_title_from_text(clean_text, detected_bio)

    # 3. Certification matching + section extraction
    cert_patterns = [
        ('epra solar', 'EPRA Solar PV Class T3'),
        ('epra', 'EPRA Licensed Electrician'),
        ('foa', 'FOA Certified Fiber Splicer Level 3'),
        ('cfot', 'Certified Fiber Optic Technician (CFOT)'),
        ('ccna', 'CCNA Routing & Switching'),
        ('comptia', 'CompTIA Certified'),
        ('ftth', 'FTTH Specialist'),
        ('nca', 'NCA Registered Contractor'),
        ('nema', 'NEMA Environmental Compliance Certified'),
        ('nita', 'NITA Trade Test Certified'),
        ('osha', 'OSHA Safety Certification'),
        ('nfpa', 'NFPA Certified Fire Protection Specialist'),
        ('pcpb', 'Pest Control Products Board (PCPB) License'),
        ('mikrotik', 'MikroTik Certified Network Associate (MTCNA)'),
        ('ubiquiti', 'Ubiquiti Enterprise Wireless Admin'),
        ('safety at heights', 'Safety at Heights Certified'),
        ('first aid', 'OSH First Aid & Fire Marshal'),
        ('master plumber', 'Master Plumber License'),
        ('nemtek', 'Nemtek Certified Electric Fence Installer'),
        ('hikvision', 'Hikvision Certified Security Associate'),
        ('zkteco', 'ZKTeco Access Control Certified'),
        ('aws certified', 'AWS Certified'),
        ('azure', 'Microsoft Azure Certified'),
    ]
    detected_certs = []
    for kw, label in cert_patterns:
        if re.search(rf'\b{re.escape(kw)}\b', lower_text) and label not in detected_certs:
            detected_certs.append(label)

    # 4. Grounded Skills extraction (section items first, then keyword/SBERT-verified domain skills)
    extracted_skills = _extract_skills_from_sections(clean_text)

    # 5. Domain classification combining keyword evidence + full-document SBERT similarity
    agent_list = list(agents_queryset) if agents_queryset is not None else []
    model = get_sbert_model()

    best_entry = None
    best_combined = -1.0
    domain_scores = []

    proto_embs = None
    doc_emb = None
    if model is not None and clean_text:
        try:
            doc_emb = _encode_document_chunks(model, clean_text)
            proto_embs = _get_domain_prototypes(model)
        except Exception as e:
            print(f"[WARN] SBERT CV extraction error: {e}")

    for idx, entry in enumerate(DOMAIN_CATALOG):
        kw_score = _keyword_score_for_domain(lower_text, entry['keywords'])
        sbert_sim = 0.0
        if doc_emb is not None and proto_embs is not None:
            sbert_sim = float(np.dot(doc_emb, proto_embs[idx]))
        # Require either explicit keyword hits or strong SBERT semantic similarity
        combined = (0.55 * kw_score) + (0.45 * max(0.0, sbert_sim))
        domain_scores.append((combined, kw_score, sbert_sim, entry))
        if combined > best_combined:
            best_combined = combined
            best_entry = (combined, kw_score, sbert_sim, entry)

    detected_domain = 'General Technical & Field Operations'
    detected_title = doc_title or 'Technical Field Specialist'
    matched_entry = None

    if best_entry is not None:
        _, best_kw, best_sim, entry = best_entry
        if best_kw > 0 or best_sim >= 0.34:
            matched_entry = entry
            detected_domain = entry['domain']
            if not doc_title:
                detected_title = entry['default_title']

    # Add domain/agent skills ONLY when genuinely evidenced in the document text (never hallucinate)
    evidenced_pool = []
    if matched_entry is not None:
        evidenced_pool.extend(matched_entry['skills'])
    if matched_entry is None or matched_entry['domain'] in [e['domain'] for e in DOMAIN_CATALOG[:22]]:
        for ag in agent_list:
            if getattr(ag, 'domain', None) == detected_domain and isinstance(ag.skills, list):
                evidenced_pool.extend(ag.skills)

    # Also match explicit technical keywords found anywhere in body when CV lacked a Skills section
    if len(extracted_skills) < 4 and matched_entry is not None:
        for sk in evidenced_pool:
            sk_words = [w for w in re.findall(r'[a-z0-9\+\.#]+', sk.lower()) if len(w) > 2]
            if not sk_words:
                continue
            word_hits = sum(1 for w in sk_words if w in lower_text)
            if word_hits >= max(1, (len(sk_words) + 1) // 2):
                if sk.lower() not in [e.lower() for e in extracted_skills]:
                    extracted_skills.append(sk)

    # Concrete technical lexicon scan across entire CV/JD body when Skills section wasn't detected cleanly
    if len(extracted_skills) < 5:
        for pat, label in CONCRETE_SKILL_PATTERNS:
            if re.search(pat, lower_text):
                if label.lower() not in [e.lower() for e in extracted_skills]:
                    extracted_skills.append(label)
                    if len(extracted_skills) >= 12:
                        break

    preview_source = detected_bio or clean_text[:400]
    return {
        'candidate_name': candidate_name,
        'detected_email': detected_email,
        'detected_phone': detected_phone,
        'detected_experience_years': detected_exp,
        'detected_title': detected_title,
        'detected_domain': detected_domain,
        'extracted_skills': extracted_skills[:12],
        'detected_certifications': detected_certs,
        'detected_bio': detected_bio,
        'text_preview': preview_source[:400] + ('...' if len(preview_source) > 400 else ''),
    }


def rank_candidates_for_task(task, available_agents, w_skill=0.70, w_proximity=0.15, w_workload=0.15, max_radius_km=25.0):
    """
    Ranks all available agents for a task using multi-criteria composite formula,
    prioritizing active on-duty / on-call technicians over off-shift agents:
    Total = ((w_skill * S_skill) + (w_proximity * S_proximity) + (w_workload * S_workload)) * shift_factor
    """
    candidates = []

    raw_cat = (task.category or '').strip()
    required_skills = task.required_skills if isinstance(task.required_skills, list) else []
    skills_clause = f" Required Skills: {', '.join(required_skills)}." if required_skills else ""
    if raw_cat.lower() in GENERIC_CATEGORIES:
        task_full_text = f"{task.title}. {task.description}.{skills_clause}"
    else:
        task_full_text = f"{task.title}. {task.description}. Category: {raw_cat}.{skills_clause}"

    # Encode task problem text once with fine-tuned Kenyan SBERT
    model = get_sbert_model()
    task_emb = None
    if model is not None:
        try:
            task_emb = model.encode(task_full_text, normalize_embeddings=True)
        except Exception as e:
            print(f"[WARN] Failed to encode task text with SBERT: {e}")

    for agent in available_agents:
        is_on_duty, duty_status, duty_label = is_agent_on_duty_nairobi(agent)

        # Distance calculation
        dist_km = calculate_haversine_distance(
            task.target_lat, task.target_lng,
            agent.current_lat, agent.current_lng
        )
        s_prox = calculate_proximity_score(dist_km, max_radius_km)

        # Workload calculation
        s_work = calculate_workload_score(agent.active_task_count)

        # Pure SBERT cosine similarity score (monotonic >= 0.05 clamp)
        if task_emb is not None and getattr(agent, 'skill_embedding', None):
            try:
                agent_emb = np.array(agent.skill_embedding, dtype=np.float32)
                sim = float(np.dot(task_emb, agent_emb))
                s_skill = round(max(0.05, min(0.99, sim)), 4)
            except Exception:
                profile_text = f"{agent.title} in {agent.domain}. Skills: {', '.join(agent.skills)}. Certifications: {', '.join(agent.certifications)}. {agent.bio or ''}"
                s_skill = calculate_skill_similarity(task_full_text, profile_text, agent.skills, required_skills)
        else:
            profile_text = f"{agent.title} in {agent.domain}. Skills: {', '.join(agent.skills)}. Certifications: {', '.join(agent.certifications)}. {agent.bio or ''}"
            s_skill = calculate_skill_similarity(task_full_text, profile_text, agent.skills, required_skills)

        # Shift active weighting factor: prioritize on-duty technicians
        shift_factor = 1.0 if is_on_duty else 0.65
        total_score = round(((w_skill * s_skill) + (w_proximity * s_prox) + (w_workload * s_work)) * shift_factor, 4)

        candidates.append({
            'agent_id': agent.id,
            'agent_name': agent.user.full_name,
            'agent_title': agent.title,
            'domain': agent.domain,
            'distance_km': dist_km,
            'skill_score': s_skill,
            'proximity_score': s_prox,
            'workload_score': s_work,
            'total_score': total_score,
            'active_task_count': agent.active_task_count,
            'availability': agent.availability,
            'battery_level': agent.battery_level,
            'is_on_duty': is_on_duty,
            'duty_status': duty_status,
            'duty_label': duty_label,
            'shift_name': getattr(agent, 'shift_name', 'Standard Business (08:00 - 17:00)'),
            'shift_hours': f"{getattr(agent, 'shift_start', '08:00')} - {getattr(agent, 'shift_end', '17:00')}",
        })

    # Sort descending by total score
    candidates.sort(key=lambda x: x['total_score'], reverse=True)
    return candidates
