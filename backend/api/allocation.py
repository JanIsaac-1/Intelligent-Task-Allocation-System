import math
import os
import numpy as np

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
            print(f"✅ Loaded fine-tuned SBERT model from {model_dir}")
            return _SBERT_MODEL
        except Exception as e:
            print(f"⚠️ Could not load SBERT from {model_dir}: {e}")
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
                return round(max(0.05, min(0.99, (sim + 1.0) / 2.0 if sim < 0 else sim)), 4)
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

def rank_candidates_for_task(task, available_agents, w_skill=0.50, w_proximity=0.30, w_workload=0.20, max_radius_km=25.0):
    """
    Ranks all available agents for a task using the multi-criteria composite formula:
    Total = (w_skill * S_skill) + (w_proximity * S_proximity) + (w_workload * S_workload)
    """
    candidates = []

    task_full_text = f"{task.title}. {task.description}. Category: {task.category}."
    required_skills = task.required_skills if isinstance(task.required_skills, list) else []

    for agent in available_agents:
        # Distance calculation
        dist_km = calculate_haversine_distance(
            task.target_lat, task.target_lng,
            agent.current_lat, agent.current_lng
        )
        s_prox = calculate_proximity_score(dist_km, max_radius_km)

        # Workload calculation
        s_work = calculate_workload_score(agent.active_task_count)

        # Skill semantic matching
        profile_text = f"{agent.title} in {agent.domain}. Skills: {', '.join(agent.skills)}. Certifications: {', '.join(agent.certifications)}. {agent.bio or ''}"
        s_skill = calculate_skill_similarity(task_full_text, profile_text, agent.skills, required_skills)

        # Composite allocation score
        total_score = round((w_skill * s_skill) + (w_proximity * s_prox) + (w_workload * s_work), 4)

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
        })

    # Sort descending by total score
    candidates.sort(key=lambda x: x['total_score'], reverse=True)
    return candidates
