import { AgentProfile, Task, SystemLog, SystemUser, AllocationWeights, AlgorithmPolicy } from '../types';

export const INITIAL_SYSTEM_USERS: SystemUser[] = [
  {
    id: 'user-admin-1',
    fullName: 'Dr. Dickson Owuor',
    email: 'dowuor@strathmore.edu',
    phone: '+254 722 000 111',
    role: 'administrator',
    status: 'active',
    department: 'School of Computing (SCES)',
    createdAt: '2026-06-01',
    lastLogin: 'Today, 08:15'
  },
  {
    id: 'user-admin-2',
    fullName: 'Jan Isaac Mwaniki',
    email: 'jan.mwaniki@strathmore.edu',
    phone: '+254 711 222 333',
    role: 'administrator',
    status: 'active',
    department: 'Operations & Dispatch Desk',
    createdAt: '2026-06-05',
    lastLogin: 'Today, 09:40'
  },
  {
    id: 'user-agent-1',
    fullName: 'Samuel Kiprop',
    email: 'samuel.kiprop@fieldops.co.ke',
    phone: '+254 712 345 678',
    role: 'agent',
    status: 'active',
    department: 'Telecom & Fiber Ops',
    createdAt: '2026-06-10',
    lastLogin: 'Today, 08:30'
  },
  {
    id: 'user-agent-2',
    fullName: 'Brian Omondi',
    email: 'brian.omondi@fieldops.co.ke',
    phone: '+254 722 890 123',
    role: 'agent',
    status: 'active',
    department: 'Electrical Engineering',
    createdAt: '2026-06-12',
    lastLogin: 'Today, 09:10'
  },
  {
    id: 'user-agent-3',
    fullName: 'Grace Wanjiku',
    email: 'grace.wanjiku@fieldops.co.ke',
    phone: '+254 733 456 789',
    role: 'agent',
    status: 'active',
    department: 'HVAC Systems',
    createdAt: '2026-06-15',
    lastLogin: 'Today, 07:45'
  },
  {
    id: 'user-req-1',
    fullName: 'Facilities Directorate',
    email: 'facilities@strathmore.edu',
    phone: '+254 720 001 002',
    role: 'requester',
    status: 'active',
    department: 'Campus Infrastructure',
    createdAt: '2026-06-02',
    lastLogin: 'Yesterday, 16:30'
  },
  {
    id: 'user-req-2',
    fullName: 'Apex Financial IT Desk',
    email: 'helpdesk@apexfinance.co.ke',
    phone: '+254 722 999 111',
    role: 'requester',
    status: 'active',
    department: 'Corporate IT Client',
    createdAt: '2026-06-18',
    lastLogin: 'Today, 08:40'
  }
];

export interface PresetConfig {
  id: string;
  name: string;
  description: string;
  tag: string;
  weights: AllocationWeights;
}

export const OPTIMIZATION_PRESETS: PresetConfig[] = [
  {
    id: 'preset-balanced',
    name: 'Balanced Dispatch (Standard)',
    description: 'Evenly distributes focus across skill compatibility, proximity, and workload.',
    tag: 'Standard Default',
    weights: { wSkill: 0.50, wProximity: 0.30, wWorkload: 0.20 }
  },
  {
    id: 'preset-emergency',
    name: 'Emergency Rapid Response',
    description: 'Heavily prioritizes nearest geographic proximity for critical outages and urgent breakdowns.',
    tag: 'Proximity Focus',
    weights: { wSkill: 0.25, wProximity: 0.60, wWorkload: 0.15 }
  },
  {
    id: 'preset-technical',
    name: 'High-Precision Technical Match',
    description: 'Prioritizes exact certified technical competencies and experience over distance.',
    tag: 'Skill Focus',
    weights: { wSkill: 0.70, wProximity: 0.15, wWorkload: 0.15 }
  },
  {
    id: 'preset-fairness',
    name: 'Workload Fairness & Equity',
    description: 'Prioritizes underutilized technicians to balance distribution across all active agents.',
    tag: 'Workload Focus',
    weights: { wSkill: 0.40, wProximity: 0.20, wWorkload: 0.40 }
  }
];

export const DEFAULT_ALGORITHM_POLICY: AlgorithmPolicy = {
  maxProximityRadiusKm: 25,
  maxActiveTasksPerAgent: 3,
  gpsPingIntervalSec: 30,
  autoDispatchEnabled: true
};

export const MASTER_DOMAINS = [
  {
    domain: 'Telecommunications',
    skills: ['Fiber optic cable splicing', 'OTDR fault detection', 'GPON configuration', 'Conduit blowing', 'Cabinet cabling', 'Microwave radio alignment'],
    certifications: ['Certified Fiber Splicer Level 3', 'CCNA Routing & Switching', 'FTTH Specialist', 'FOA Certified']
  },
  {
    domain: 'Electrical',
    skills: ['3-phase power distribution', 'Circuit breaker maintenance', 'Generator ATS synchronization', 'Solar inverter wiring', 'Industrial load balancing', 'High-voltage isolators'],
    certifications: ['EPRA Electrician Class A', 'EPRA Solar PV Class T3', 'OSHA Safety Certification', 'Certified Electrical Inspector']
  },
  {
    domain: 'HVAC',
    skills: ['AC compressor diagnostics', 'Chiller repair', 'Refrigerant R410A charging', 'Air duct balancing', 'Server room precision cooling'],
    certifications: ['HVAC Certified Technician', 'Refrigerant Recovery Certification', 'EPA Section 608']
  },
  {
    domain: 'Plumbing',
    skills: ['Water booster pump repair', 'High pressure pipe welding', 'Drainage blockage clearing', 'Solar water heating', 'Backflow prevention'],
    certifications: ['Master Plumber License', 'High-Pressure Booster Certified', 'Water Quality Specialist']
  },
  {
    domain: 'IT Support',
    skills: ['Wireless access point deployment', 'Switch VLAN configuration', 'Cat6 structured cabling', 'Firewall troubleshooting', 'CCTV IP camera installation'],
    certifications: ['CompTIA Network+', 'CompTIA Security+', 'MikroTik MTCNA', 'Ubiquiti Enterprise Wireless']
  }
];

export const INITIAL_AGENTS: AgentProfile[] = [
  {
    id: 'agent-1',
    name: 'Samuel Kiprop',
    email: 'samuel.kiprop@fieldops.co.ke',
    phone: '+254 712 345 678',
    role: 'agent',
    title: 'Senior Fiber & Optical Systems Technician',
    domain: 'Telecommunications',
    experienceYears: 6,
    certifications: ['Certified Fiber Splicer Level 3', 'CCNA Routing & Switching', 'FTTH Specialist'],
    skills: ['Fiber optic cable splicing', 'OTDR fault detection', 'GPON configuration', 'Conduit blowing', 'Cabinet cabling'],
    bio: 'Specialized in high-density underground fiber repairs and optical distribution frame installations across Nairobi metro.',
    availability: 'available',
    currentLocation: {
      lat: -1.2921,
      lng: 36.8219,
      addressName: 'Nairobi CBD (Kenyatta Ave)'
    },
    activeTaskCount: 0,
    completedTasksCount: 42,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    batteryLevel: 94,
    lastUpdated: '2 mins ago'
  },
  {
    id: 'agent-2',
    name: 'Brian Omondi',
    email: 'brian.omondi@fieldops.co.ke',
    phone: '+254 722 890 123',
    role: 'agent',
    title: 'Commercial Electrical Engineer',
    domain: 'Electrical',
    experienceYears: 5,
    certifications: ['EPRA Electrician Class A', 'OSHA Safety Certification', '3-Phase Systems Specialist'],
    skills: ['3-phase power distribution', 'Circuit breaker maintenance', 'Generator ATS synchronization', 'Solar inverter wiring', 'Industrial load balancing'],
    bio: 'Experienced electrical technician with deep expertise in commercial generator maintenance and emergency distribution panel failures.',
    availability: 'available',
    currentLocation: {
      lat: -1.3090,
      lng: 36.8123,
      addressName: 'Madaraka / Strathmore Area'
    },
    activeTaskCount: 1,
    completedTasksCount: 38,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    batteryLevel: 82,
    lastUpdated: 'Just now'
  },
  {
    id: 'agent-3',
    name: 'Grace Wanjiku',
    email: 'grace.wanjiku@fieldops.co.ke',
    phone: '+254 733 456 789',
    role: 'agent',
    title: 'HVAC & Refrigeration Specialist',
    domain: 'HVAC',
    experienceYears: 4,
    certifications: ['HVAC Certified Technician', 'Refrigerant Recovery Certification'],
    skills: ['AC compressor diagnostics', 'Chiller repair', 'Refrigerant R410A charging', 'Air duct balancing', 'Server room precision cooling'],
    bio: 'Focused on precision climate systems for data centers, corporate server rooms, and commercial HVAC maintenance.',
    availability: 'busy',
    currentLocation: {
      lat: -1.2650,
      lng: 36.8040,
      addressName: 'Westlands (Parklands Rd)'
    },
    activeTaskCount: 2,
    completedTasksCount: 29,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    batteryLevel: 68,
    lastUpdated: '10 mins ago'
  },
  {
    id: 'agent-4',
    name: 'David Mwangi',
    email: 'david.mwangi@fieldops.co.ke',
    phone: '+254 701 234 567',
    role: 'agent',
    title: 'Commercial Hydraulic & Plumbing Tech',
    domain: 'Plumbing',
    experienceYears: 7,
    certifications: ['Master Plumber License', 'High-Pressure Booster Certified'],
    skills: ['Water booster pump repair', 'High pressure pipe welding', 'Drainage blockage clearing', 'Solar water heating', 'Backflow prevention'],
    bio: 'Heavy commercial plumbing specialist handling municipal mains, high-rise pressure boosters, and automated irrigation valves.',
    availability: 'available',
    currentLocation: {
      lat: -1.2985,
      lng: 36.7830,
      addressName: 'Kilimani (Argwings Kodhek)'
    },
    activeTaskCount: 0,
    completedTasksCount: 51,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    batteryLevel: 89,
    lastUpdated: '4 mins ago'
  },
  {
    id: 'agent-5',
    name: 'Kevin Mutua',
    email: 'kevin.mutua@fieldops.co.ke',
    phone: '+254 790 112 233',
    role: 'agent',
    title: 'Field IT & Infrastructure Specialist',
    domain: 'IT Support',
    experienceYears: 3,
    certifications: ['CompTIA Network+', 'MikroTik MTCNA', 'Ubiquiti Enterprise Wireless'],
    skills: ['Wireless access point deployment', 'Switch VLAN configuration', 'Cat6 structured cabling', 'Firewall troubleshooting', 'CCTV IP camera installation'],
    bio: 'Field network technician specializing in branch office deployments, enterprise Wi-Fi surveys, and IP surveillance cameras.',
    availability: 'available',
    currentLocation: {
      lat: -1.3005,
      lng: 36.8180,
      addressName: 'Upper Hill (Hospital Rd)'
    },
    activeTaskCount: 0,
    completedTasksCount: 22,
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    batteryLevel: 77,
    lastUpdated: '1 min ago'
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'TASK-101',
    title: 'Substation Breaker Tripping & Sparks on Distribution Panel',
    description: 'The backup 3-phase generator distribution board is sparking and tripped main circuit breakers in the commercial building basement.',
    category: 'Electrical',
    requiredSkills: ['3-phase power distribution', 'Circuit breaker maintenance', 'High-voltage wiring'],
    location: {
      lat: -1.3085,
      lng: 36.8115,
      addressName: 'Strathmore Business School, Madaraka'
    },
    priority: 'critical',
    status: 'pending',
    requesterName: 'Facilities Directorate - Strathmore',
    requesterPhone: '+254 720 001 002',
    createdAt: '2026-08-19 08:30',
    deadline: '2026-08-19 11:00',
    estimatedHours: 2.5
  },
  {
    id: 'TASK-102',
    title: 'Severed Fiber Line Outside Enterprise HQ',
    description: 'Road excavation contractor accidentally sliced the 48-core primary fiber cable outside the gate. 3 floors currently have zero internet connectivity.',
    category: 'Telecommunications',
    requiredSkills: ['Fiber optic cable splicing', 'OTDR fault detection', 'Conduit blowing'],
    location: {
      lat: -1.2950,
      lng: 36.8080,
      addressName: 'Kilimani / Community Area'
    },
    priority: 'high',
    status: 'pending',
    requesterName: 'Apex Financial Services (IT Desk)',
    requesterPhone: '+254 722 999 111',
    createdAt: '2026-08-19 08:45',
    deadline: '2026-08-19 12:30',
    estimatedHours: 3.0
  },
  {
    id: 'TASK-103',
    title: 'Data Center Precision AC Unit Leaking Water & Overheating',
    description: 'Server room air conditioning unit AC-02 is leaking condensation onto floor trays and blowing warm ambient air. Server temperatures rising.',
    category: 'HVAC',
    requiredSkills: ['AC compressor diagnostics', 'Refrigerant R410A charging', 'Server room precision cooling'],
    location: {
      lat: -1.2680,
      lng: 36.8090,
      addressName: 'Westlands Commercial Hub'
    },
    priority: 'high',
    status: 'assigned',
    assignedAgentId: 'agent-3',
    requesterName: 'CloudNet Data Systems',
    requesterPhone: '+254 711 555 444',
    createdAt: '2026-08-19 07:15',
    deadline: '2026-08-19 10:30',
    estimatedHours: 2.0
  },
  {
    id: 'TASK-104',
    title: 'High-Pressure Booster Pump Failure in Main Water Tank',
    description: 'Main rooftop water pressure booster pump motor stopped spinning, leaving levels 5 to 12 with zero water supply.',
    category: 'Plumbing',
    requiredSkills: ['Water booster pump repair', 'High pressure pipe welding'],
    location: {
      lat: -1.2990,
      lng: 36.7860,
      addressName: 'Yaya Centre Residences, Kilimani'
    },
    priority: 'medium',
    status: 'pending',
    requesterName: 'Property Management Office',
    requesterPhone: '+254 733 121 212',
    createdAt: '2026-08-19 08:00',
    deadline: '2026-08-19 14:00',
    estimatedHours: 1.5
  }
];

export const INITIAL_LOGS: SystemLog[] = [
  {
    id: 'log-1',
    timestamp: '08:30:15',
    action: 'Task Registered',
    details: 'TASK-101 (Electrical Sparks at SBS) created by Facilities Directorate.',
    type: 'info'
  },
  {
    id: 'log-2',
    timestamp: '08:31:00',
    action: 'GPS Position Received',
    details: 'Brian Omondi updated location: Madaraka / Strathmore (-1.3090, 36.8123).',
    type: 'info'
  },
  {
    id: 'log-3',
    timestamp: '08:35:40',
    action: 'Task Assigned',
    details: 'TASK-103 assigned to Grace Wanjiku (Composite Score: 0.88).',
    type: 'success'
  }
];
