import { AgentProfile, Task, AllocationWeights, AuthUser, SystemUser, SystemLog, AnalyticsSummary } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Helper to perform fetch with error handling and fallback
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let message = errorBody;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.error) message = parsed.error;
      else if (parsed.detail) message = parsed.detail;
    } catch {}
    throw new Error(message);
  }

  return response.json();
}

// ----------------------------------------------------------------------
// Authentication
// ----------------------------------------------------------------------
export async function apiLogin(email: string, password?: string): Promise<{
  user: AuthUser;
  agentProfileId?: number | string;
  role: AuthUser['role'];
}> {
  const res = await request<{
    user: {
      id: string | number;
      email: string;
      full_name: string;
      role: AuthUser['role'];
      phone?: string;
      department?: string;
    };
    agent_profile_id?: number | string;
    role: AuthUser['role'];
  }>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password: password || '' }),
  });

  return {
    user: {
      id: res.user.id,
      email: res.user.email,
      fullName: res.user.full_name,
      role: res.user.role,
      phone: res.user.phone,
      department: res.user.department,
      agentProfileId: res.agent_profile_id,
    },
    agentProfileId: res.agent_profile_id,
    role: res.role,
  };
}

export async function apiRegister(data: {
  email: string;
  password: string;
  fullName: string;
  role: 'administrator' | 'agent' | 'requester';
  phone?: string;
  department?: string;
  title?: string;
  domain?: string;
  skills?: string[];
  experienceYears?: number;
  adminKey?: string;
}): Promise<{
  message: string;
  user: AuthUser;
  status: 'pending' | 'active';
}> {
  const payload = {
    email: data.email,
    password: data.password,
    full_name: data.fullName,
    role: data.role,
    phone: data.phone || '',
    department: data.department || '',
    admin_key: data.adminKey || '',
    title: data.title || (data.role === 'agent' ? 'Field Technician' : data.role === 'administrator' ? 'Dispatch Administrator' : 'Requester'),
    domain: data.domain || data.department || (data.role === 'administrator' ? 'Operations & Dispatch Headquarters' : 'General Field Operations'),
    skills: data.skills || [],
    experience_years: data.experienceYears || 1,
  };

  const res = await request<{
    message: string;
    user: {
      id: string | number;
      email: string;
      full_name: string;
      role: AuthUser['role'];
      phone?: string;
      department?: string;
    };
    status: 'pending' | 'active';
  }>('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    message: res.message,
    user: {
      id: res.user.id,
      email: res.user.email,
      fullName: res.user.full_name,
      role: res.user.role,
      phone: res.user.phone,
      department: res.user.department,
    },
    status: res.status,
  };
}

// ----------------------------------------------------------------------
// Tasks API
// ----------------------------------------------------------------------
export async function fetchTasks(): Promise<Task[]> {
  const data = await request<any[]>('/tasks/');
  const list = Array.isArray(data) ? data : (data as any).results || [];

  return list.map((t: any) => ({
    id: String(t.id),
    title: t.title,
    description: t.description,
    category: t.category,
    requiredSkills: Array.isArray(t.required_skills) ? t.required_skills : [],
    location: {
      lat: t.target_lat,
      lng: t.target_lng,
      addressName: t.address_name,
    },
    priority: t.priority,
    status: t.status,
    requesterName: t.requester_name || 'Anonymous',
    requesterPhone: t.requester_phone || '+254 700 000 000',
    requesterId: t.requester ? String(t.requester) : undefined,
    assignedAgentId: t.assigned_agent ? String(t.assigned_agent) : undefined,
    createdAt: t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Today',
    deadline: t.deadline || 'Within 4 hours',
    estimatedHours: t.estimated_hours || 2.0,
  }));
}

export async function createTask(taskData: {
  title: string;
  description: string;
  category: string;
  requiredSkills: string[];
  priority: string;
  lat: number;
  lng: number;
  addressName: string;
  requesterId?: string | number;
}): Promise<Task> {
  const numericRequester =
    taskData.requesterId !== undefined && taskData.requesterId !== '' && !isNaN(Number(taskData.requesterId))
      ? Number(taskData.requesterId)
      : undefined;

  const payload = {
    title: taskData.title,
    description: taskData.description,
    category: taskData.category,
    required_skills: taskData.requiredSkills,
    priority: taskData.priority,
    target_lat: taskData.lat,
    target_lng: taskData.lng,
    address_name: taskData.addressName,
    status: 'pending',
    ...(numericRequester ? { requester: numericRequester } : {}),
  };

  const t = await request<any>('/tasks/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    id: String(t.id),
    title: t.title,
    description: t.description,
    category: t.category,
    requiredSkills: t.required_skills || [],
    location: {
      lat: t.target_lat,
      lng: t.target_lng,
      addressName: t.address_name,
    },
    priority: t.priority,
    status: t.status,
    requesterName: t.requester_name || 'Task Requester',
    requesterPhone: t.requester_phone || '+254 700 000 000',
    requesterId: t.requester ? String(t.requester) : (numericRequester ? String(numericRequester) : undefined),
    createdAt: 'Just now',
    deadline: 'Within 4 hours',
    estimatedHours: 2.0,
  };
}

export async function rankCandidates(
  taskId: string | number,
  weights: AllocationWeights
): Promise<any[]> {
  const res = await request<any>(`/tasks/${taskId}/rank_candidates/`, {
    method: 'POST',
    body: JSON.stringify({
      w_skill: weights.wSkill,
      w_proximity: weights.wProximity,
      w_workload: weights.wWorkload,
    }),
  });

  return (res.candidates || []).map((c: any) => ({
    agentId: String(c.agent_id),
    agentName: c.agent_name,
    agentTitle: c.agent_title,
    domain: c.domain,
    skillScore: c.skill_score,
    proximityScore: c.proximity_score,
    distanceKm: c.distance_km,
    workloadScore: c.workload_score,
    compositeScore: c.total_score,
    breakdown: {
      wSkill: weights.wSkill,
      wProximity: weights.wProximity,
      wWorkload: weights.wWorkload,
    },
  }));
}

export async function assignAgentToTask(
  taskId: string | number,
  agentId: string | number,
  score: number,
  breakdown?: { sSkill: number; sProx: number; sWork: number }
): Promise<any> {
  return request(`/tasks/${taskId}/assign_agent/`, {
    method: 'POST',
    body: JSON.stringify({
      agent_id: agentId,
      score: score,
      ...(breakdown ? {
        s_skill: breakdown.sSkill,
        s_prox: breakdown.sProx,
        s_work: breakdown.sWork,
      } : {}),
    }),
  });
}

export async function reassignTask(taskId: string | number): Promise<any> {
  return request(`/tasks/${taskId}/reassign/`, {
    method: 'POST',
  });
}

export async function updateTaskStatus(
  taskId: string | number,
  status: string
): Promise<any> {
  return request(`/tasks/${taskId}/update_status/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ----------------------------------------------------------------------
// Agents API
// ----------------------------------------------------------------------
export async function fetchAgents(): Promise<AgentProfile[]> {
  const data = await request<any[]>('/agents/');
  const list = Array.isArray(data) ? data : (data as any).results || [];

  return list.map((a: any) => ({
    id: String(a.id),
    name: a.full_name || (a.user ? a.user.full_name : 'Technician'),
    email: a.email || (a.user ? a.user.email : ''),
    phone: a.phone || (a.user ? a.user.phone : '+254 700 000 000'),
    role: 'agent',
    title: a.title,
    domain: a.domain,
    experienceYears: a.experience_years,
    certifications: Array.isArray(a.certifications) ? a.certifications : [],
    skills: Array.isArray(a.skills) ? a.skills : [],
    bio: a.bio || '',
    availability: a.availability,
    currentLocation: {
      lat: a.current_lat,
      lng: a.current_lng,
      addressName: a.current_address || 'Nairobi Metro',
    },
    activeTaskCount: a.active_task_count,
    completedTasksCount: a.completed_tasks_count,
    avatarUrl: `https://images.unsplash.com/photo-${
      a.id % 2 === 0
        ? '1534528741775-53994a69daeb'
        : '1507003211169-0a1dd7228f2d'
    }?w=150&auto=format&fit=crop&q=80`,
    batteryLevel: a.battery_level || 90,
    lastUpdated: 'Live GPS',
    shiftName: a.shift_name || 'Standard Business (08:00 - 17:00)',
    shiftStart: a.shift_start || '08:00',
    shiftEnd: a.shift_end || '17:00',
    isOnCall: Boolean(a.is_on_call),
  }));
}

export async function updateAgentLocation(
  agentId: string | number,
  lat: number,
  lng: number,
  addressName?: string
): Promise<any> {
  return request(`/agents/${agentId}/update_location/`, {
    method: 'POST',
    body: JSON.stringify({ lat, lng, address_name: addressName }),
  });
}

export async function toggleAgentAvailability(
  agentId: string | number,
  availability: string
): Promise<any> {
  return request(`/agents/${agentId}/toggle_availability/`, {
    method: 'PATCH',
    body: JSON.stringify({ availability }),
  });
}

export async function updateAgentProfile(
  agentId: string | number,
  data: Partial<AgentProfile>
): Promise<any> {
  const payload: any = {
    title: data.title,
    domain: data.domain,
    experience_years: data.experienceYears,
    skills: data.skills,
    certifications: data.certifications,
    bio: data.bio,
    availability: data.availability,
    full_name: data.name,
    phone: data.phone,
  };
  return request('/agents/' + agentId + '/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function createAgentProfile(agentData: {
  name: string;
  email?: string;
  password?: string;
  phone: string;
  title: string;
  domain: string;
  experienceYears: number;
  skills: string[];
  certifications: string[];
  bio: string;
  lat: number;
  lng: number;
  addressName: string;
}): Promise<AgentProfile> {
  const a = await request<any>('/agents/', {
    method: 'POST',
    body: JSON.stringify({
      full_name: agentData.name,
      email: agentData.email,
      ...(agentData.password ? { password: agentData.password } : {}),
      phone: agentData.phone,
      title: agentData.title,
      domain: agentData.domain,
      experience_years: agentData.experienceYears,
      skills: agentData.skills,
      certifications: agentData.certifications,
      bio: agentData.bio,
      current_lat: agentData.lat,
      current_lng: agentData.lng,
      current_address: agentData.addressName,
    }),
  });

  return {
    id: String(a.id),
    name: a.full_name || agentData.name,
    email: a.email || agentData.email || '',
    phone: a.phone || agentData.phone,
    role: 'agent',
    title: a.title,
    domain: a.domain,
    experienceYears: a.experience_years || agentData.experienceYears,
    skills: a.skills || agentData.skills,
    certifications: a.certifications || agentData.certifications,
    bio: a.bio || agentData.bio,
    availability: a.availability || 'available',
    currentLocation: {
      lat: a.current_lat || agentData.lat,
      lng: a.current_lng || agentData.lng,
      addressName: a.current_address || agentData.addressName,
    },
    activeTaskCount: a.active_task_count || 0,
    completedTasksCount: a.completed_tasks_count || 0,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    batteryLevel: a.battery_level || 100,
    lastUpdated: 'Just now',
    shiftName: a.shift_name || 'Standard Business (08:00 - 17:00)',
    shiftStart: a.shift_start || '08:00',
    shiftEnd: a.shift_end || '17:00',
    isOnCall: Boolean(a.is_on_call),
  };
}

// ----------------------------------------------------------------------
// PDF / DOCX / TXT CV & JD Parsing
// ----------------------------------------------------------------------
export async function uploadCvPdf(file: File): Promise<{
  candidate_name?: string;
  detected_email?: string;
  detected_phone?: string;
  detected_experience_years?: number | null;
  detected_title?: string;
  detected_domain: string;
  extracted_skills: string[];
  detected_certifications: string[];
  detected_bio?: string;
  text_preview: string;
}> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/parse-cv/`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to parse document on backend');
  }

  return response.json();
}

// ----------------------------------------------------------------------
// Users & Admin Approvals API
// ----------------------------------------------------------------------
export async function fetchUsers(): Promise<SystemUser[]> {
  const data = await request<any[]>('/users/');
  const list = Array.isArray(data) ? data : (data as any).results || [];

  return list.map((u: any) => ({
    id: String(u.id),
    fullName: u.full_name || u.username,
    email: u.email,
    phone: u.phone || '+254 700 000 000',
    role: u.role,
    status: u.status || 'active',
    department: u.department || 'General Operations',
    createdAt: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Recent',
    lastLogin: 'Active',
  }));
}

export interface CreateSystemUserInput {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: 'administrator' | 'agent' | 'requester';
  department?: string;
  status?: 'active' | 'pending';
  title?: string;
  domain?: string;
  experienceYears?: number;
  skills?: string[];
  currentAddress?: string;
}

export async function createSystemUserApi(payload: CreateSystemUserInput): Promise<SystemUser> {
  const u = await request<any>('/users/', {
    method: 'POST',
    body: JSON.stringify({
      full_name: payload.fullName,
      email: payload.email,
      password: payload.password,
      phone: payload.phone,
      role: payload.role,
      department: payload.department,
      status: payload.status || 'active',
      title: payload.title,
      domain: payload.domain,
      experience_years: payload.experienceYears,
      skills: payload.skills,
      current_address: payload.currentAddress,
    }),
  });

  return {
    id: String(u.id),
    fullName: u.full_name || payload.fullName,
    email: u.email || payload.email,
    phone: u.phone || payload.phone || '+254 700 000 000',
    role: u.role || payload.role,
    status: u.status || payload.status || 'active',
    department: u.department || payload.department || 'General Operations',
    createdAt: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Just now',
    lastLogin: 'Never',
  };
}

export async function updateUserStatusApi(userId: string | number, status: string): Promise<any> {
  return request(`/users/${userId}/toggle_status/`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function approveUserApi(userId: string | number): Promise<any> {
  return request(`/users/${userId}/approve/`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

// ----------------------------------------------------------------------
// Performance & System Logs API
// ----------------------------------------------------------------------
export async function fetchLogs(): Promise<SystemLog[]> {
  try {
    const data = await request<any[]>('/logs/');
    const list = Array.isArray(data) ? data : (data as any).results || [];
    return list.map((l: any) => ({
      id: String(l.id),
      timestamp: l.recorded_at ? new Date(l.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Recent',
      action: l.action || 'System Action',
      details: l.details || '',
      type: l.log_type || 'info',
    }));
  } catch (err) {
    console.warn('Failed to fetch logs from backend:', err);
    return [];
  }
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary | null> {
  try {
    return await request<AnalyticsSummary>('/analytics/summary/');
  } catch (err) {
    console.warn('Failed to fetch analytics summary from backend:', err);
    return null;
  }
}

export async function apiDenyUser(userId: string | number, reason?: string, deleteAccount?: boolean): Promise<any> {
  return request(`/users/${userId}/deny/`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || 'Application denied by administrator', delete: Boolean(deleteAccount) }),
  });
}

export async function apiResetUserPassword(userId: string | number, newPassword: string, unlock?: boolean): Promise<any> {
  return request(`/users/${userId}/reset_password/`, {
    method: 'POST',
    body: JSON.stringify({ new_password: newPassword, unlock: Boolean(unlock) }),
  });
}

export async function apiToggleUserLockout(userId: string | number, lock: boolean): Promise<any> {
  return request(`/users/${userId}/toggle_lockout/`, {
    method: 'POST',
    body: JSON.stringify({ lock }),
  });
}

export async function apiUpdateAgentShift(
  agentId: string | number,
  shift: { shiftName?: string; shiftStart?: string; shiftEnd?: string; isOnCall?: boolean }
): Promise<any> {
  return request(`/agents/${agentId}/update_shift/`, {
    method: 'POST',
    body: JSON.stringify({
      shift_name: shift.shiftName,
      shift_start: shift.shiftStart,
      shift_end: shift.shiftEnd,
      is_on_call: shift.isOnCall,
    }),
  });
}

export async function apiFetchSecuritySettings(): Promise<{
  master_key: string;
  allow_admin_registration: boolean;
  require_approval_all: boolean;
}> {
  return request('/system/security/');
}

export async function apiUpdateMasterKey(masterKey: string): Promise<any> {
  return request('/system/security/', {
    method: 'POST',
    body: JSON.stringify({ master_key: masterKey }),
  });
}
