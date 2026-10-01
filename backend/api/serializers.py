from rest_framework import serializers
from .models import User, AgentProfile, Task, Assignment, LocationLog, PerformanceLog

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'role', 'phone', 'department', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']


class AgentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)

    class Meta:
        model = AgentProfile
        fields = [
            'id', 'user', 'full_name', 'email', 'phone', 'title', 'domain',
            'experience_years', 'skills', 'certifications', 'bio', 'availability',
            'current_lat', 'current_lng', 'battery_level', 'active_task_count',
            'completed_tasks_count', 'last_updated'
        ]
        read_only_fields = ['id', 'active_task_count', 'completed_tasks_count', 'last_updated']


class TaskSerializer(serializers.ModelSerializer):
    assigned_agent_details = AgentProfileSerializer(source='assigned_agent', read_only=True)
    requester_name = serializers.CharField(source='requester.full_name', read_only=True, default="Anonymous")

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'category', 'required_skills',
            'priority', 'status', 'target_lat', 'target_lng', 'address_name',
            'assigned_agent', 'assigned_agent_details', 'requester',
            'requester_name', 'deadline', 'estimated_hours', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AssignmentSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)
    agent_name = serializers.CharField(source='agent.user.full_name', read_only=True)

    class Meta:
        model = Assignment
        fields = [
            'id', 'task', 'task_title', 'agent', 'agent_name',
            'allocation_score', 'skill_score', 'proximity_score',
            'workload_score', 'status', 'assigned_at', 'completed_at'
        ]
        read_only_fields = ['id', 'assigned_at']


class LocationLogSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source='agent.user.full_name', read_only=True)

    class Meta:
        model = LocationLog
        fields = ['id', 'agent', 'agent_name', 'latitude', 'longitude', 'recorded_at']
        read_only_fields = ['id', 'recorded_at']


class PerformanceLogSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(source='agent.user.full_name', read_only=True)

    class Meta:
        model = PerformanceLog
        fields = ['id', 'agent', 'agent_name', 'action', 'details', 'log_type', 'recorded_at']
        read_only_fields = ['id', 'recorded_at']
