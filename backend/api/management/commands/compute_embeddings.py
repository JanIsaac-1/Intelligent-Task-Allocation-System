from django.core.management.base import BaseCommand
from api.models import AgentProfile
from api.allocation import get_sbert_model

class Command(BaseCommand):
    help = "Generates and saves 384-dim dense SBERT embeddings for all technician profiles."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Loading fine-tuned Kenyan Field SBERT model..."))
        model = get_sbert_model()
        if model is None:
            self.stdout.write(self.style.ERROR("Failed to load fine-tuned SBERT model. Check model directory."))
            return

        agents = AgentProfile.objects.select_related('user').all()
        self.stdout.write(self.style.NOTICE(f"Computing embeddings for {agents.count()} agents..."))

        updated_count = 0
        for agent in agents:
            skills_str = ", ".join(agent.skills) if isinstance(agent.skills, list) else str(agent.skills)
            certs_str = ", ".join(agent.certifications) if isinstance(agent.certifications, list) else str(agent.certifications)
            profile_text = f"{agent.title} in {agent.domain}. Skills: {skills_str}. Certifications: {certs_str}. {agent.bio or ''}"
            
            # Compute normalized dense 384-dim embedding
            embedding = model.encode(profile_text, normalize_embeddings=True)
            agent.skill_embedding = [float(x) for x in embedding]
            agent.save(update_fields=['skill_embedding'])
            updated_count += 1
            self.stdout.write(self.style.SUCCESS(f"  [{updated_count}/{agents.count()}] {agent.user.full_name} ({agent.domain}) -> 384-dim vector saved."))

        self.stdout.write(self.style.SUCCESS(f"Successfully updated embeddings for all {updated_count} agents!"))
