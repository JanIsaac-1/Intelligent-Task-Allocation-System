from django.db import models
from django.contrib.auth.models import AbstractUser

# ==============================================================================
# 1. USER MODEL (AUTHENTICATION & RBAC ROLES)
# ==============================================================================
class User(AbstractUser):
    ROLE_CHOICES = (
        ('administrator', 'Administrator / Dispatcher'),
        ('agent', 'Field Agent / Technician'),
        ('requester', 'Task Requester / Client'),
    )
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('pending', 'Pending Approval'),
    )

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='requester')
    phone = models.CharField(max_length=50, blank=True, null=True)
    department = models.CharField(max_length=150, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'full_name']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.full_name} ({self.get_role_display()})"


# ==============================================================================
# 2. AGENT PROFILE MODEL (FIELD TECHNICIAN ATTRIBUTES & SBERT VECTORS)
# ==============================================================================
class AgentProfile(models.Model):
    AVAILABILITY_CHOICES = (
        ('available', 'Available'),
        ('busy', 'Busy / On Task'),
        ('offline', 'Offline'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='agent_profile')
    title = models.CharField(max_length=150)
    domain = models.CharField(max_length=100)
    experience_years = models.IntegerField(default=1)
    skills = models.JSONField(default=list, help_text="List of extracted technical skills")
    certifications = models.JSONField(default=list, help_text="List of verified trade licenses")
    bio = models.TextField(blank=True, null=True)
    availability = models.CharField(max_length=20, choices=AVAILABILITY_CHOICES, default='available')
    
    # Live GPS Telemetry
    current_lat = models.FloatField(default=-1.2921)
    current_lng = models.FloatField(default=36.8219)
    battery_level = models.IntegerField(default=100)
    
    # Workload Balancing Attributes
    active_task_count = models.IntegerField(default=0)
    completed_tasks_count = models.IntegerField(default=0)
    
    # 384-dimensional dense SBERT skill embedding vector
    skill_embedding = models.JSONField(blank=True, null=True, help_text="SBERT 384-dim dense embedding vector")
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'agent_profiles'

    def __str__(self):
        return f"{self.user.full_name} - {self.title} ({self.domain})"


# ==============================================================================
# 3. TASK MODEL (FIELD WORK ORDERS)
# ==============================================================================
class Task(models.Model):
    PRIORITY_CHOICES = (
        ('critical', 'Critical (Emergency)'),
        ('high', 'High Priority'),
        ('medium', 'Medium Priority'),
        ('low', 'Low Priority'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending Dispatch'),
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    requester = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submitted_tasks', null=True, blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField(help_text="Raw natural language customer problem statement")
    category = models.CharField(max_length=100)
    required_skills = models.JSONField(default=list, help_text="Identified prerequisite skills")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Target Geographic Location (Nairobi coordinates)
    target_lat = models.FloatField(default=-1.2921)
    target_lng = models.FloatField(default=36.8219)
    address_name = models.CharField(max_length=255, default="Nairobi, Kenya")

    assigned_agent = models.ForeignKey(AgentProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    deadline = models.DateTimeField(null=True, blank=True)
    estimated_hours = models.FloatField(default=2.0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tasks'

    def __str__(self):
        return f"TASK-{self.id}: {self.title} [{self.get_status_display()}]"


# ==============================================================================
# 4. ASSIGNMENT MODEL (DISPATCH MAPPING & COMPOSITE ALLOCATION SCORES)
# ==============================================================================
class Assignment(models.Model):
    STATUS_CHOICES = (
        ('dispatched', 'Dispatched'),
        ('accepted', 'Accepted by Agent'),
        ('in_transit', 'Technician In Transit'),
        ('in_progress', 'Work In Progress'),
        ('completed', 'Completed & Verified'),
        ('cancelled', 'Reassigned / Cancelled'),
    )

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='assignments')
    agent = models.ForeignKey(AgentProfile, on_delete=models.CASCADE, related_name='assignments')
    
    # Multi-Criteria Scoring Components (Section 3.3.4)
    allocation_score = models.FloatField(help_text="Final composite score S_composite")
    skill_score = models.FloatField(help_text="NLP Cosine similarity score S_skill")
    proximity_score = models.FloatField(help_text="Haversine distance score S_proximity")
    workload_score = models.FloatField(help_text="Load factor score S_workload")

    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='dispatched')
    assigned_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'assignments'

    def __str__(self):
        return f"Assignment {self.id}: {self.task.title} -> {self.agent.user.full_name} (Score: {self.allocation_score*100:.1f}%)"


# ==============================================================================
# 5. LOCATION LOG MODEL (GPS TELEMETRY BREADCRUMBS)
# ==============================================================================
class LocationLog(models.Model):
    agent = models.ForeignKey(AgentProfile, on_delete=models.CASCADE, related_name='location_history')
    latitude = models.FloatField()
    longitude = models.FloatField()
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'location_logs'
        ordering = ['-recorded_at']

    def __str__(self):
        return f"{self.agent.user.full_name} @ ({self.latitude}, {self.longitude}) - {self.recorded_at.strftime('%H:%M:%S')}"


# ==============================================================================
# 6. PERFORMANCE LOG MODEL (AUDIT STREAM & METRICS)
# ==============================================================================
class PerformanceLog(models.Model):
    LOG_TYPES = (
        ('info', 'Information'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('error', 'Error'),
    )

    agent = models.ForeignKey(AgentProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='performance_logs')
    assignment = models.ForeignKey(Assignment, on_delete=models.SET_NULL, null=True, blank=True, related_name='logs')
    action = models.CharField(max_length=150)
    details = models.TextField()
    log_type = models.CharField(max_length=15, choices=LOG_TYPES, default='info')
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'performance_logs'
        ordering = ['-recorded_at']

    def __str__(self):
        return f"[{self.recorded_at.strftime('%H:%M:%S')}] {self.action}: {self.details[:50]}"
