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
  status: 'active' | 'suspended' | 'pending';
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
