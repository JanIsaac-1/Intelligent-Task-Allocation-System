export type Role = 'administrator' | 'agent' | 'requester';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type AgentAvailability = 'available' | 'busy' | 'offline';

export interface AuthUser {
  id: string | number;
  email: string;
  fullName: string;
  role: Role;
  phone?: string;
  department?: string;
  agentProfileId?: number | string;
}

export interface SystemUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: 'active' | 'suspended' | 'pending' | 'locked' | 'rejected';
  domain?: string;
  skills?: string[];
  experienceYears?: number;
  department: string;
  createdAt: string;
  lastLogin: string;
}

export interface Location {
  lat: number;
  lng: number;
  addressName: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'agent';
  title: string;
  domain: string;
  experienceYears: number;
  certifications: string[];
  skills: string[];
  bio: string;
  availability: AgentAvailability;
  currentLocation: Location;
  activeTaskCount: number;
  completedTasksCount: number;
  avatarUrl: string;
  batteryLevel?: number;
  lastUpdated: string;
  shiftName?: string;
  shiftStart?: string;
  shiftEnd?: string;
  isOnCall?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  requiredSkills: string[];
  location: Location;
  priority: TaskPriority;
  status: TaskStatus;
  requesterName: string;
  requesterPhone: string;
  requesterId?: string;
  assignedAgentId?: string;
  createdAt: string;
  deadline: string;
  estimatedHours: number;
}

export interface AllocationScore {
  agentId: string;
  agentName: string;
  agentTitle: string;
  skillScore: number;       // 0.0 - 1.0
  proximityScore: number;   // 0.0 - 1.0
  distanceKm: number;       // e.g. 2.4 km
  workloadScore: number;    // 0.0 - 1.0
  compositeScore: number;   // 0.0 - 1.0
  breakdown: {
    wSkill: number;
    wProximity: number;
    wWorkload: number;
  };
}

export interface AllocationWeights {
  wSkill: number;      // e.g. 0.50
  wProximity: number;  // e.g. 0.30
  wWorkload: number;   // e.g. 0.20
}

export interface AlgorithmPolicy {
  maxProximityRadiusKm: number;  // e.g. 25 km
  maxActiveTasksPerAgent: number; // e.g. 3
  gpsPingIntervalSec: number;     // e.g. 30 sec
  autoDispatchEnabled: boolean;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface AssignmentAuditRecord {
  id: number;
  task_id: number;
  task_title: string;
  task_category: string;
  task_status: string;
  agent_name: string;
  agent_domain: string;
  allocation_score: number;
  skill_score: number;
  proximity_score: number;
  workload_score: number;
  distance_km: number;
  status: string;
  assigned_at: string;
  completed_at: string | null;
}

export interface DomainBreakdownItem {
  domain: string;
  total: number;
  pending: number;
  active: number;
  completed: number;
}

export interface AnalyticsSummary {
  total_tasks: number;
  pending_tasks: number;
  assigned_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  completion_rate_pct: number;
  total_assignments: number;
  avg_composite_score: number | null;
  avg_skill_score: number | null;
  avg_proximity_score: number | null;
  avg_workload_score: number | null;
  avg_dispatch_distance_km: number | null;
  avg_baseline_distance_km: number | null;
  distance_optimization_pct: number | null;
  avg_response_minutes: number | null;
  fairness_index: number;
  recent_assignments: AssignmentAuditRecord[];
  domain_breakdown: DomainBreakdownItem[];
}
