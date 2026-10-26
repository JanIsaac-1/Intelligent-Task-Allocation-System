import json
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.conf import settings

from .models import User, AgentProfile, Task, Assignment, LocationLog, PerformanceLog
from .serializers import (
    UserSerializer, AgentProfileSerializer, TaskSerializer,
    AssignmentSerializer, LocationLogSerializer, PerformanceLogSerializer
)
from .allocation import rank_candidates_for_task

# ==============================================================================
# AUTHENTICATION & SESSION VIEWS
# ==============================================================================
@api_view(['POST'])
def api_login(request):
    """Authenticate user with email and password and return role & profile info."""
    email = request.data.get('email')
    password = request.data.get('password')

    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Find user by email
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'User not found with this email'}, status=status.HTTP_404_NOT_FOUND)

    # Check user account approval status
    if user.status == 'pending':
        return Response({
            'error': 'Account registration is pending administrator approval. Please wait for an administrator to review and activate your account.'
        }, status=status.HTTP_403_FORBIDDEN)

    if user.status in ['suspended', 'locked', 'rejected']:
        return Response({
            'error': f'Account access unavailable (Account status: {user.status.upper()}). Please contact administration.'
        }, status=status.HTTP_403_FORBIDDEN)

    # If password is provided, check password (or allow quick-login for demo users if testing)
    if password and not user.check_password(password):
        return Response({'error': 'Invalid password'}, status=status.HTTP_401_UNAUTHORIZED)

    agent_profile_id = None
    if user.role == 'agent' and hasattr(user, 'agent_profile'):
        agent_profile_id = user.agent_profile.id

    return Response({
        'message': 'Login successful',
        'user': UserSerializer(user).data,
        'agent_profile_id': agent_profile_id,
        'role': user.role
    })

@api_view(['POST'])
def api_register(request):
    """Registers a new user (administrator, agent, or requester)."""
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')
    full_name = request.data.get('full_name', '').strip()
    role = request.data.get('role', 'requester')
    phone = request.data.get('phone', '')
    department = request.data.get('department', '')
    admin_key = request.data.get('admin_key', '').strip()

    # Technician / Agent specific attributes
    title = request.data.get('title', 'Field Technician')
    domain = request.data.get('domain', department or 'General Field Operations')
    skills = request.data.get('skills', [])
    certifications = request.data.get('certifications', [])
    experience_years = request.data.get('experience_years', 1)

    if not email:
        return Response({'error': 'Email address is required'}, status=status.HTTP_400_BAD_REQUEST)
    if not password or len(password) < 6:
        return Response({'error': 'Password must be at least 6 characters long'}, status=status.HTTP_400_BAD_REQUEST)
    if not full_name:
        return Response({'error': 'Full name is required'}, status=status.HTTP_400_BAD_REQUEST)

    if role not in ['administrator', 'agent', 'requester']:
        role = 'requester'

    if User.objects.filter(email=email).exists():
        return Response({'error': 'An account with this email address already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    # Generate unique username
    base_username = email.split('@')[0].replace('.', '_').replace('-', '_')
    username = base_username
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f"{base_username}_{counter}"
        counter += 1

    # Check status and administrative privileges
    is_admin = (role == 'administrator')
    # If registering as administrator with the authorization key (e.g. 'janjakes')
    if is_admin and admin_key.lower() in ['janjakes', 'admin123', 'geotask2026']:
        initial_status = 'active'
        is_staff = True
        is_superuser = True
        resp_message = 'Administrator account verified and activated successfully! You can now sign in.'
    elif is_admin:
        initial_status = 'pending'
        is_staff = True
        is_superuser = False
        resp_message = 'Administrator account registered! It is pending authorization before you can sign in.'
    else:
        initial_status = 'pending'
        is_staff = False
        is_superuser = False
        resp_message = 'Account registered successfully! It is currently pending administrator approval before you can sign in.'

    # Create user
    user = User.objects.create(
        username=username,
        email=email,
        full_name=full_name,
        role=role,
        phone=phone,
        department=department or ('Operations & Dispatch Headquarters' if is_admin else ''),
        status=initial_status,
        is_staff=is_staff,
        is_superuser=is_superuser
    )
    user.set_password(password)
    user.save()

    # If the user is an agent / technician, create the linked AgentProfile in offline/pending state
    if role == 'agent':
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(',') if s.strip()]
        if isinstance(certifications, str):
            certifications = [c.strip() for c in certifications.split(',') if c.strip()]

        AgentProfile.objects.create(
            user=user,
            title=title,
            domain=domain,
            experience_years=int(experience_years) if str(experience_years).isdigit() else 1,
            skills=skills or [domain],
            certifications=certifications or [],
            availability='offline',  # Offline until administrator activates
            current_lat=-1.2921,
            current_lng=36.8219,
            battery_level=100
        )

    # Log to PerformanceLog audit trail
    PerformanceLog.objects.create(
        action='Account Registration',
        details=f"New {role.upper()} account for {full_name} ({email}) - Status: {initial_status.upper()}",
        log_type='success' if initial_status == 'active' else 'info'
    )

    return Response({
        'message': resp_message,
        'user': UserSerializer(user).data,
        'status': initial_status
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def api_logout(request):
    """Logs out user."""
    logout(request)
    return Response({'message': 'Logged out successfully'})


# ==============================================================================
# USERS VIEWSET (RBAC MANAGEMENT)
# ==============================================================================
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = UserSerializer

    @action(detail=True, methods=['patch', 'post'])
    def toggle_status(self, request, pk=None):
        user = self.get_object()
        new_status = request.data.get('status')
        if new_status in ['active', 'suspended', 'pending', 'locked', 'rejected']:
            user.status = new_status
            user.save()

            # Sync linked AgentProfile availability if applicable
            if hasattr(user, 'agent_profile'):
                if new_status == 'active':
                    user.agent_profile.availability = 'available'
                else:
                    user.agent_profile.availability = 'offline'
                user.agent_profile.save()

            log_action = 'User Registration Approved' if new_status == 'active' else 'User Status Updated'
            PerformanceLog.objects.create(
                action=log_action,
                details=f"User {user.full_name} ({user.email}) status changed to {new_status.upper()} by administrator",
                log_type='success' if new_status == 'active' else 'warning'
            )
            return Response(UserSerializer(user).data)
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Dedicated action to approve a pending user account."""
        user = self.get_object()
        user.status = 'active'
        user.save()

        if hasattr(user, 'agent_profile'):
            user.agent_profile.availability = 'available'
            user.agent_profile.save()

        PerformanceLog.objects.create(
            action='User Registration Approved',
            details=f"Administrator approved registration for {user.full_name} ({user.email})",
            log_type='success'
        )
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=['post'])
    def deny(self, request, pk=None):
        """Rejects or deletes an unapproved pending registration."""
        user = self.get_object()
        reason = request.data.get('reason', 'Application rejected by administrator')
        delete_account = request.data.get('delete', False)
        user_email = user.email
        user_name = user.full_name
        if delete_account:
            user.delete()
            PerformanceLog.objects.create(
                action='Registration Denied & Purged',
                details=f"Administrator rejected and removed registration for {user_email}. Reason: {reason}",
                log_type='warning'
            )
            return Response({'message': 'Registration request deleted successfully', 'deleted': True, 'id': pk})
        else:
            user.status = 'rejected'
            user.save()
            if hasattr(user, 'agent_profile'):
                user.agent_profile.availability = 'offline'
                user.agent_profile.save()
            PerformanceLog.objects.create(
                action='Registration Denied',
                details=f"Administrator rejected registration for {user_name} ({user_email}). Reason: {reason}",
                log_type='warning'
            )
            return Response(UserSerializer(user).data)

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """Resets a user's password."""
        user = self.get_object()
        new_password = request.data.get('new_password', '').strip()
        if not new_password or len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        if request.data.get('unlock', False) and user.status in ['locked', 'suspended']:
            user.status = 'active'
            if hasattr(user, 'agent_profile'):
                user.agent_profile.availability = 'available'
                user.agent_profile.save()
        user.save()
        PerformanceLog.objects.create(
            action='Administrative Password Reset',
            details=f"Administrator reset password for user {user.full_name} ({user.email})",
            log_type='info'
        )
        return Response({'message': f'Password for {user.email} reset successfully', 'status': user.status})

    @action(detail=True, methods=['post', 'patch'])
    def toggle_lockout(self, request, pk=None):
        """Locks or unlocks an account immediately."""
        user = self.get_object()
        lock = request.data.get('lock', True)
        if lock:
            user.status = 'locked'
            if hasattr(user, 'agent_profile'):
                user.agent_profile.availability = 'offline'
                user.agent_profile.save()
            msg = f"Account for {user.full_name} ({user.email}) locked out by administrator."
            log_type = 'warning'
        else:
            user.status = 'active'
            if hasattr(user, 'agent_profile'):
                user.agent_profile.availability = 'available'
                user.agent_profile.save()
            msg = f"Account for {user.full_name} ({user.email}) unlocked and restored to active."
            log_type = 'success'
        user.save()
        PerformanceLog.objects.create(
            action='Account Lockout Updated',
            details=msg,
            log_type=log_type
        )
        return Response(UserSerializer(user).data)


# ==============================================================================
# AGENT PROFILES VIEWSET (FIELD TECHNICIANS & TELEMETRY)
# ==============================================================================
class AgentProfileViewSet(viewsets.ModelViewSet):
    queryset = AgentProfile.objects.all().order_by('-last_updated')
    serializer_class = AgentProfileSerializer

    def perform_update(self, serializer):
        instance = serializer.save()
        full_name = self.request.data.get('full_name')
        phone = self.request.data.get('phone')
        user_modified = False
        if full_name:
            instance.user.full_name = full_name.strip()
            user_modified = True
        if phone is not None:
            instance.user.phone = phone.strip()
            user_modified = True
        if user_modified:
            instance.user.save()

        PerformanceLog.objects.create(
            action='Technician Profile Updated',
            details=f'Administrator updated profile for {instance.user.full_name} ({instance.title})',
            log_type='info'
        )

    @action(detail=True, methods=['post'])
    def update_location(self, request, pk=None):
        """Receives live GPS breadcrumbs from agent's mobile device."""
        agent = self.get_object()
        lat = request.data.get('lat')
        lng = request.data.get('lng')
        address = request.data.get('address') or request.data.get('address_name')

        if lat is not None and lng is not None:
            agent.current_lat = float(lat)
            agent.current_lng = float(lng)
            if address:
                agent.current_address = str(address).strip()
            agent.save()

            # Record breadcrumb in history
            LocationLog.objects.create(agent=agent, latitude=lat, longitude=lng)

            # Record in System Audit Trail
            addr_info = f" at {agent.current_address}" if agent.current_address else ""
            PerformanceLog.objects.create(
                action='GPS Telemetry Ping',
                details=f"Technician {agent.user.full_name} updated GPS beacon{addr_info} ({agent.current_lat:.4f}, {agent.current_lng:.4f})",
                log_type='info'
            )

            return Response({
                'message': 'GPS location updated',
                'lat': agent.current_lat,
                'lng': agent.current_lng,
                'current_address': agent.current_address
            })
        return Response({'error': 'Coordinates required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'])
    def toggle_availability(self, request, pk=None):
        """Toggles technician availability between available, busy, offline."""
        agent = self.get_object()
        new_avail = request.data.get('availability')
        if new_avail in ['available', 'busy', 'offline']:
            agent.availability = new_avail
            agent.save()
            return Response(AgentProfileSerializer(agent).data)
        return Response({'error': 'Invalid availability state'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch', 'post'])
    def update_shift(self, request, pk=None):
        """Updates work shift schedule and on-call status for a technician."""
        agent = self.get_object()
        shift_name = request.data.get('shift_name')
        shift_start = request.data.get('shift_start')
        shift_end = request.data.get('shift_end')
        is_on_call = request.data.get('is_on_call')

        if shift_name:
            agent.shift_name = shift_name.strip()
        if shift_start:
            agent.shift_start = shift_start.strip()
        if shift_end:
            agent.shift_end = shift_end.strip()
        if is_on_call is not None:
            agent.is_on_call = bool(is_on_call)
        agent.save()

        PerformanceLog.objects.create(
            action='Work Shift Updated',
            details=f"Updated shift for {agent.user.full_name}: {agent.shift_name} ({agent.shift_start} - {agent.shift_end})",
            log_type='info'
        )
        return Response(AgentProfileSerializer(agent).data)


# ==============================================================================
# TASKS VIEWSET (WORK ORDERS & ALLOCATION ENGINE)
# ==============================================================================
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer

    @action(detail=True, methods=['post'])
    def rank_candidates(self, request, pk=None):
        """
        Runs the Intelligent Allocation Engine to rank technicians for this task.
        Accepts dynamic weights: w_skill, w_proximity, w_workload
        """
        task = self.get_object()
        w_skill = float(request.data.get('w_skill', 0.50))
        w_proximity = float(request.data.get('w_proximity', 0.30))
        w_workload = float(request.data.get('w_workload', 0.20))
        max_radius = float(request.data.get('max_radius_km', 25.0))

        # Filter active technicians
        available_agents = AgentProfile.objects.exclude(availability='offline')
        
        ranked_candidates = rank_candidates_for_task(
            task=task,
            available_agents=available_agents,
            w_skill=w_skill,
            w_proximity=w_proximity,
            w_workload=w_workload,
            max_radius_km=max_radius
        )

        return Response({
            'task_id': task.id,
            'task_title': task.title,
            'weights_applied': {'w_skill': w_skill, 'w_proximity': w_proximity, 'w_workload': w_workload},
            'candidates': ranked_candidates
        })

    @action(detail=True, methods=['post'])
    def assign_agent(self, request, pk=None):
        """Dispatches an agent to this task and creates an Assignment record."""
        task = self.get_object()
        agent_id = request.data.get('agent_id')
        score = float(request.data.get('score', 0.85))
        s_skill = float(request.data.get('s_skill', 0.85))
        s_prox = float(request.data.get('s_prox', 0.85))
        s_work = float(request.data.get('s_work', 0.85))

        agent = get_object_or_404(AgentProfile, id=agent_id)

        task.assigned_agent = agent
        task.status = 'assigned'
        task.save()

        # Update agent active load
        agent.active_task_count += 1
        if agent.active_task_count >= 2:
            agent.availability = 'busy'
        agent.save()

        # Create Assignment record
        assignment = Assignment.objects.create(
            task=task,
            agent=agent,
            allocation_score=score,
            skill_score=s_skill,
            proximity_score=s_prox,
            workload_score=s_work,
            status='dispatched'
        )

        PerformanceLog.objects.create(
            agent=agent,
            assignment=assignment,
            action='Task Dispatched',
            details=f"Task '{task.title}' dispatched to {agent.user.full_name} (Composite Match: {score*100:.1f}%)",
            log_type='success'
        )

        return Response({
            'message': f"Task successfully assigned to {agent.user.full_name}",
            'task': TaskSerializer(task).data,
            'assignment': AssignmentSerializer(assignment).data
        })

    @action(detail=True, methods=['post'])
    def reassign(self, request, pk=None):
        """Unassigns current agent and resets task to pending queue."""
        task = self.get_object()
        if task.assigned_agent:
            prev_agent = task.assigned_agent
            prev_agent.active_task_count = max(0, prev_agent.active_task_count - 1)
            prev_agent.availability = 'available'
            prev_agent.save()

            task.assigned_agent = None
            task.status = 'pending'
            task.save()

            PerformanceLog.objects.create(
                agent=prev_agent,
                action='Task Reset',
                details=f"Task '{task.title}' returned to pending dispatch pool by administrator.",
                log_type='warning'
            )

        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Updates task lifecycle from agent mobile view (in_progress, completed)."""
        task = self.get_object()
        new_status = request.data.get('status')

        if new_status in ['pending', 'assigned', 'in_progress', 'completed', 'cancelled']:
            task.status = new_status
            task.save()

            if new_status == 'completed' and task.assigned_agent:
                agent = task.assigned_agent
                agent.active_task_count = max(0, agent.active_task_count - 1)
                agent.completed_tasks_count += 1
                agent.availability = 'available'
                agent.save()

                PerformanceLog.objects.create(
                    agent=agent,
                    action='Task Resolved',
                    details=f"Task '{task.title}' completed successfully by {agent.user.full_name}.",
                    log_type='success'
                )

            return Response(TaskSerializer(task).data)
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)


# ==============================================================================
# PDF CV / JOB DESCRIPTION PARSER VIEW
# ==============================================================================
@api_view(['POST'])
def parse_cv_pdf(request):
    """
    Accepts an uploaded PDF CV or document, extracts raw text with pypdf,
    and returns detected skills, title, and domain.
    """
    pdf_file = request.FILES.get('file')
    if not pdf_file:
        return Response({'error': 'No PDF file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        from pypdf import PdfReader
        reader = PdfReader(pdf_file)
        full_text = ""
        for page in reader.pages:
            full_text += page.extract_text() or ""

        # Basic skill and certification pattern identification
        lower_text = full_text.lower()
        extracted_skills = []
        detected_certs = []
        domain = "General Technical Services"

        # Domain matching keywords
        if "fiber" in lower_text or "splic" in lower_text or "otdr" in lower_text:
            domain = "Fiber Optic & ISP Last-Mile Splicing"
            extracted_skills.extend(["Fiber fusion splicing", "OTDR trace analysis", "Optical power meter testing"])
            if "foa" in lower_text:
                detected_certs.append("FOA Certified Fiber Splicer")
        elif "electric" in lower_text or "breaker" in lower_text or "3-phase" in lower_text or "epra" in lower_text:
            domain = "Commercial Electrical Wiring & Distribution"
            extracted_skills.extend(["3-phase power distribution", "Circuit breaker overhaul", "415V switchboard load balancing"])
            if "epra" in lower_text:
                detected_certs.append("EPRA Licensed Electrician")
        elif "solar" in lower_text or "inverter" in lower_text or "photovoltaic" in lower_text:
            domain = "Solar PV & Hybrid Inverter Systems"
            extracted_skills.extend(["Hybrid solar inverter configuration", "Lithium battery storage", "PV string testing"])
            detected_certs.append("EPRA Solar PV Class T3")
        elif "plumb" in lower_text or "pipe" in lower_text or "drain" in lower_text or "booster" in lower_text:
            domain = "Commercial Plumbing & High-Rise Booster Systems"
            extracted_skills.extend(["High-pressure water booster pump repair", "PPR socket fusion welding", "Drainage clearing"])
            detected_certs.append("Master Plumber License")

        return Response({
            'filename': pdf_file.name,
            'char_count': len(full_text),
            'detected_domain': domain,
            'extracted_skills': list(set(extracted_skills)),
            'detected_certifications': list(set(detected_certs)),
            'text_preview': full_text[:400] + "..." if len(full_text) > 400 else full_text
        })
    except Exception as e:
        return Response({'error': f"Error parsing PDF: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==============================================================================
# AUDIT & PERFORMANCE LOGS VIEWSET
# ==============================================================================
class PerformanceLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PerformanceLog.objects.all().order_by('-recorded_at')[:50]
    serializer_class = PerformanceLogSerializer


# ==============================================================================
# SYSTEM SECURITY & MASTER PASSCODE API
# ==============================================================================
@api_view(['GET', 'POST'])
def system_security_settings(request):
    """Retrieves or updates system security settings including Master Registration Key."""
    import os
    if request.method == 'GET':
        current_key = getattr(settings, 'ADMIN_REGISTRATION_KEY', 'geotask2026')
        return Response({
            'master_key': current_key,
            'allow_admin_registration': getattr(settings, 'ALLOW_ADMIN_REGISTRATION', True),
            'require_approval_all': getattr(settings, 'REQUIRE_APPROVAL_ALL', False),
        })
    elif request.method == 'POST':
        new_key = request.data.get('master_key', '').strip()
        if not new_key or len(new_key) < 6:
            return Response({'error': 'Master passcode must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)

        settings.ADMIN_REGISTRATION_KEY = new_key

        env_path = os.path.join(settings.BASE_DIR, '.env')
        if os.path.exists(env_path):
            try:
                with open(env_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                updated = False
                new_lines = []
                for line in lines:
                    if line.startswith('ADMIN_REGISTRATION_KEY='):
                        new_lines.append(f"ADMIN_REGISTRATION_KEY={new_key}\n")
                        updated = True
                    else:
                        new_lines.append(line)
                if not updated:
                    new_lines.append(f"ADMIN_REGISTRATION_KEY={new_key}\n")
                with open(env_path, 'w', encoding='utf-8') as f:
                    f.writelines(new_lines)
            except Exception:
                pass

        PerformanceLog.objects.create(
            action='Master Passcode Updated',
            details='Administrator updated system master authorization key.',
            log_type='warning'
        )
        return Response({'message': 'Master passcode updated successfully', 'master_key': new_key})
