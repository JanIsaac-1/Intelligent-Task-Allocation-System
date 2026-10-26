import { AllocationWeights, AlgorithmPolicy } from '../types';

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
    domain: 'Solar PV & Hybrid Inverter Systems',
    skills: ['Hybrid solar inverter configuration', 'Lithium LiFePO4 battery bank diagnostics', 'Solar PV string testing', 'DC isolator switch wiring'],
    certifications: ['EPRA Solar PV Class T3', 'Victron Certified Professional']
  },
  {
    domain: 'Commercial Cleaning & Sanitization',
    skills: ['Industrial rotary floor scrubber operation', 'Post-renovation cement/paint residue stripping', 'Hot water carpet extraction', 'Telescopic window washing'],
    certifications: ['Certified Professional Housekeeper (CPH)', 'Chemical Safety']
  },
  {
    domain: 'Automotive & Emergency Roadside',
    skills: ['Emergency 12V vehicle battery jumpstart', 'Mobile OBD-II computer diagnostic scanning', 'Flat tire replacement', 'Alternator voltage diagnostics'],
    certifications: ['Certified Automotive Technician (NITA)', 'Roadside Safety & Recovery']
  }
];
