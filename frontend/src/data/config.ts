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

export interface MasterDomain {
  domain: string;
  code: string;
  skills: string[];
  certifications: string[];
  titles: string[];
}

export const MASTER_DOMAINS: MasterDomain[] = [
  {
    "domain": "Fiber Optic & ISP Last-Mile Splicing",
    "code": "TEL",
    "skills": [
      "Fiber optic cable fusion splicing",
      "OTDR fault trace analysis",
      "Optical power meter testing",
      "Underground conduit rodding",
      "ODF patch panel termination",
      "Aerial drop cable stringing"
    ],
    "certifications": [
      "FOA Certified Fiber Splicer Level 3",
      "CCNA Routing & Switching",
      "FTTH Specialist",
      "Safety at Heights"
    ],
    "titles": [
      "Senior Fiber Optic Splicing Engineer",
      "Field Telecom Line Technician",
      "FTTH Drop Splicing Specialist",
      "Optical Network Maintenance Technician"
    ]
  },
  {
    "domain": "Commercial Electrical Wiring & Distribution",
    "code": "ELE",
    "skills": [
      "3-phase power distribution",
      "Circuit breaker overhaul",
      "415V switchboard load balancing",
      "Insulation resistance Megger testing",
      "Phase rotation diagnostics",
      "Power factor correction capacitor bank maintenance"
    ],
    "certifications": [
      "EPRA Class A Electrician License",
      "EPRA Class B Wireman",
      "OSHA Safety Certification",
      "High Voltage Safety"
    ],
    "titles": [
      "Commercial Electrical Engineer",
      "EPRA Licensed Master Electrician",
      "Industrial Power Systems Wireman",
      "Building Electrical Maintenance Technician"
    ]
  },
  {
    "domain": "Solar PV & Hybrid Inverter Systems",
    "code": "SOL",
    "skills": [
      "Hybrid solar inverter configuration",
      "Lithium LiFePO4 battery bank diagnostics",
      "Solar PV string testing (Voc/Isc)",
      "Solar water heater collector descaling",
      "DC isolator switch wiring",
      "Grid-tie export limit configuration"
    ],
    "certifications": [
      "EPRA Solar PV Class T3",
      "EPRA Solar Water Heating License",
      "Victron Certified Professional",
      "Deye Factory Trained"
    ],
    "titles": [
      "Senior Solar PV Systems Engineer",
      "EPRA Certified Solar Technician",
      "Hybrid Solar & Battery Storage Specialist",
      "Rooftop Solar Maintenance Tech"
    ]
  },
  {
    "domain": "Standby Diesel Generators & ATS Changeovers",
    "code": "GEN",
    "skills": [
      "Diesel generator overhaul",
      "ATS synchronization panel troubleshooting",
      "DeepSea / ComAp controller diagnostics",
      "Fuel injection pump calibration",
      "Starter motor solenoid replacement",
      "Alternator AVR voltage tuning"
    ],
    "certifications": [
      "Generator Technician Certification",
      "DeepSea Electronics Certified",
      "Perkins / Cummins Certified",
      "EPRA Electrical Class B"
    ],
    "titles": [
      "Diesel Generator & Power Systems Specialist",
      "Automatic Transfer Switch (ATS) Technician",
      "Standby Plant Maintenance Engineer",
      "Industrial Engine Field Mechanic"
    ]
  },
  {
    "domain": "Borehole & Submersible Water Pumps",
    "code": "BOR",
    "skills": [
      "Submersible borehole pump diagnostics",
      "Motor control center (MCC) starter repair",
      "Dry-run protection sensor wiring",
      "Deep-well riser pipe retrieval",
      "Water pressure switch calibration",
      "Borehole yield flow rate testing"
    ],
    "certifications": [
      "WRA Borehole Installation License",
      "Davis & Shirtliff Certified Technician",
      "Grundfos Product Specialist",
      "EPRA Wireman"
    ],
    "titles": [
      "Borehole & Pump Systems Engineer",
      "Submersible Pump Installation Specialist",
      "Water Hydraulics & Well Tech",
      "Davis & Shirtliff Certified Pump Tech"
    ]
  },
  {
    "domain": "Commercial Plumbing & High-Rise Booster Systems",
    "code": "PLM",
    "skills": [
      "High-pressure water booster pump repair",
      "PPR socket fusion welding",
      "Cast iron and PVC drainage clearing",
      "Pressure reducing valve (PRV) calibration",
      "Water meter manifold overhaul",
      "Sewer line rodding"
    ],
    "certifications": [
      "Master Plumber License",
      "PPR Socket Fusion Certified",
      "High-Pressure Booster Tech",
      "OSHA Safety"
    ],
    "titles": [
      "Commercial Hydraulic Plumber",
      "Master Plumber & Pipefitter",
      "High-Rise Water Pressure Specialist",
      "Sanitary & Drainage Maintenance Tech"
    ]
  },
  {
    "domain": "Electric Fences, Razor Wire & Perimeter Security",
    "code": "FNC",
    "skills": [
      "High-voltage electric fence energizer repair",
      "Nemtek / Stafix fence line fault finding",
      "HT wire tensioning and insulator replacement",
      "Earth loop resistance optimization",
      "Siren and strobe alarm integration",
      "Razor wire coil mounting"
    ],
    "certifications": [
      "Nemtek Certified Electric Fence Installer",
      "Stafix Product Specialist",
      "EPRA Class C License",
      "Physical Security Inspector"
    ],
    "titles": [
      "Certified Electric Fence Technician",
      "Perimeter Security Systems Engineer",
      "Nemtek & Stafix Certified Installer",
      "Physical Security Wireman"
    ]
  },
  {
    "domain": "CCTV Surveillance & Biometric Access Control",
    "code": "SEC",
    "skills": [
      "IP PTZ camera configuration",
      "NVR storage array troubleshooting",
      "ZKTeco biometric turnstile integration",
      "Magnetic door lock power supply repair",
      "Automatic vehicle boom barrier motor maintenance",
      "Video management software (VMS) setup"
    ],
    "certifications": [
      "Hikvision Certified Security Associate",
      "ZKTeco Access Control Certified",
      "Dahua Technology Specialist",
      "CompTIA Security+"
    ],
    "titles": [
      "CCTV & Electronic Security Engineer",
      "Biometric Access Control Specialist",
      "IP Surveillance Systems Technician",
      "ZKTeco & Hikvision Certified Tech"
    ]
  },
  {
    "domain": "Data Center Precision Cooling & CRAC (HVAC)",
    "code": "HVC",
    "skills": [
      "Computer Room Air Conditioning (CRAC) diagnostics",
      "Refrigerant R410A / R407C leak detection",
      "Precision cooling compressor replacement",
      "EC condenser fan motor speed control",
      "Electrode steam humidifier maintenance",
      "Chilled water control valve calibration"
    ],
    "certifications": [
      "EPA Section 608 Universal",
      "HVAC Excellence Certified",
      "Stulz / Emerson Precision Cooling Certified",
      "Refrigerant Handling License"
    ],
    "titles": [
      "Data Center Precision Cooling Specialist",
      "HVAC & CRAC Certified Engineer",
      "Commercial Chiller & Climate Technician",
      "Precision Environmental Control Tech"
    ]
  },
  {
    "domain": "Point-to-Point Wireless & Microwave Internet (WISP)",
    "code": "WSP",
    "skills": [
      "Microwave link dish azimuth alignment",
      "Ubiquiti airMAX / LTU link optimization",
      "MikroTik RouterOS wireless configuration",
      "Gigabit PoE surge protection installation",
      "Rooftop telecommunications mast rigging",
      "RF noise spectrum analysis"
    ],
    "certifications": [
      "MikroTik MTCNA / MTCRE",
      "Ubiquiti Enterprise Wireless Admin",
      "Tower Rigging & Rescue Safety",
      "RF Spectrum Engineering"
    ],
    "titles": [
      "WISP & Microwave Link Engineer",
      "Wireless Network Field Technician",
      "RF Telecommunications Rigging Tech",
      "MikroTik & Ubiquiti Certified Specialist"
    ]
  },
  {
    "domain": "Structured Cabling & Enterprise LAN Infrastructure",
    "code": "LAN",
    "skills": [
      "Cat6 / Cat6A structured cable termination",
      "24/48-port patch panel punching",
      "Fluke Versiv DSX-5000 certification testing",
      "Server rack cable management and dressing",
      "Under-desk brush plate trunking",
      "Keystone jack modular termination"
    ],
    "certifications": [
      "Fluke Networks CCTT Certified",
      "CompTIA Network+",
      "BICSI Installer Level 2",
      "Panduit / Siemon Certified"
    ],
    "titles": [
      "Structured Cabling Technician",
      "Enterprise Network Infrastructure Specialist",
      "Data Center Cable Dressing Tech",
      "Fluke Certified Cabling Installer"
    ]
  },
  {
    "domain": "Banking Automation & ATM / POS Field Support",
    "code": "ATM",
    "skills": [
      "ATM cash dispenser mechanism overhaul",
      "Motorized card reader sensor cleaning",
      "Receipt journal thermal printer repair",
      "Cash deposit automation module calibration",
      "POS / PDQ terminal hardware troubleshooting",
      "Safe lock electronic keypad diagnostics"
    ],
    "certifications": [
      "NCR Certified ATM Engineer",
      "Diebold Nixdorf Hardware Certified",
      "PCI-DSS Security Awareness",
      "Electronic Cash Drawer Tech"
    ],
    "titles": [
      "ATM & Banking Automation Field Engineer",
      "Retail POS Hardware Specialist",
      "Self-Service Banking Terminal Tech",
      "Cash Dispenser Maintenance Engineer"
    ]
  },
  {
    "domain": "Commercial Cold Rooms & Supermarket Refrigeration",
    "code": "REF",
    "skills": [
      "Semi-hermetic compressor overhaul",
      "Cold room evaporator defrost cycle repair",
      "Thermostatic expansion valve (TXV) tuning",
      "Refrigerant R404A / R134a charging",
      "Digital temperature controller programming (Dixell/Eliwell)",
      "Cold room insulated door seal replacement"
    ],
    "certifications": [
      "Commercial Refrigeration Mechanic License",
      "Bitzer / Copeland Compressor Certified",
      "EPA Universal Refrigerant Handler",
      "Cold Chain Safety"
    ],
    "titles": [
      "Commercial Refrigeration Specialist",
      "Cold Room & Chiller Field Engineer",
      "Supermarket Refrigeration Tech",
      "Industrial Refrigeration Mechanic"
    ]
  },
  {
    "domain": "Elevator, Passenger Lift & Escalator Services",
    "code": "LFT",
    "skills": [
      "Elevator traction motor brake adjustment",
      "Passenger lift door interlock mechanism repair",
      "Hoistway leveling sensor calibration",
      "Elevator safety governor testing",
      "Variable Frequency Drive (VVVF) tuning",
      "Emergency passenger entrapment rescue"
    ],
    "certifications": [
      "Certified Elevator Mechanic (CEM)",
      "Schindler / Otis / Kone Certified",
      "OSHA Elevator Safety Standards",
      "Electrical Class A"
    ],
    "titles": [
      "Certified Elevator & Lift Technician",
      "Passenger Lift Maintenance Engineer",
      "Escalator Field Service Specialist",
      "Elevator Safety Inspector"
    ]
  },
  {
    "domain": "Fire Alarm & FM-200 Gas Suppression Systems",
    "code": "FIR",
    "skills": [
      "FM-200 / NOVEC gas suppression cylinder inspection",
      "Addressable fire alarm panel programming",
      "Optical smoke beam detector alignment",
      "Manual call point (MCP) loop testing",
      "Diesel fire pump automated start test",
      "Fire damper actuator inspection"
    ],
    "certifications": [
      "NFPA Certified Fire Protection Specialist",
      "FM-200 Clean Agent Certified",
      "Addressable Fire Alarm Technician",
      "County Fire Safety Inspector"
    ],
    "titles": [
      "Fire Alarm & Suppression Systems Engineer",
      "FM-200 / NOVEC Clean Agent Specialist",
      "Fire Protection Field Technician",
      "Certified Fire Safety Systems Inspector"
    ]
  },
  {
    "domain": "Deep House Cleaning & Post-Construction Scrubbing",
    "code": "CLN",
    "skills": [
      "Industrial rotary floor scrubber operation",
      "Post-renovation cement/paint residue stripping",
      "High-pressure hot water carpet extraction",
      "Telescopic squeegee high-window washing",
      "Grout line acid washing and sanitization",
      "Sofa fabric shampooing and deodorizing"
    ],
    "certifications": [
      "Certified Professional Housekeeper (CPH)",
      "IICRC Carpet Cleaning Certified",
      "Hazardous Chemical Handling Safety",
      "Floor Restoration Specialist"
    ],
    "titles": [
      "Professional Deep Cleaning Specialist",
      "Housekeeping & Post-Construction Cleaning Lead",
      "Commercial Floor Care & Sanitation Tech",
      "Carpet & Upholstery Extraction Specialist"
    ]
  },
  {
    "domain": "Fumigation & Pest Control Services",
    "code": "PST",
    "skills": [
      "Thermal fogging machine operation",
      "Residual chemical surface spraying",
      "Termite soil barrier trenching and injection",
      "Cockroach gel baiting in food premises",
      "Bedbug multi-stage eradication",
      "Rodent bait station servicing"
    ],
    "certifications": [
      "Pest Control Products Board (PCPB) License",
      "Public Health Officer Certification",
      "Structural Termite Specialist",
      "Chemical Application Safety"
    ],
    "titles": [
      "Certified Pest Control & Fumigation Specialist",
      "Public Health Pest Management Officer",
      "Structural Pest & Termite Control Tech",
      "Urban Pest Management Professional"
    ]
  },
  {
    "domain": "Domestic Home Appliance Repair",
    "code": "APP",
    "skills": [
      "Automatic washing machine drum motor repair",
      "Electric/gas cooker ignition and burner maintenance",
      "Domestic refrigerator thermostat and gas charging",
      "Microwave oven magnetron and high-voltage diode testing",
      "Electric water dispenser cooling coil repair",
      "Dishwasher water drain pump overhaul"
    ],
    "certifications": [
      "EPRA Domestic Electrical Wireman",
      "Home Appliance Tech Certified",
      "Refrigeration & Gas Cooker Safety",
      "Electronics Diagnostics"
    ],
    "titles": [
      "Domestic Appliance Repair Technician",
      "Washing Machine & Cooker Specialist",
      "Home Electrical Appliance Field Tech",
      "White Goods Maintenance Engineer"
    ]
  },
  {
    "domain": "General Handyman, TV Mounting & Furniture Assembly",
    "code": "HDY",
    "skills": [
      "Heavy-duty TV wall bracket installation",
      "Gypsum hollow-wall butterfly anchor mounting",
      "Curtain rod and window blind drilling",
      "Flat-pack wardrobe and cabinet assembly",
      "Mortise door lock and handle replacement",
      "Decorative wall mirror and artwork hanging"
    ],
    "certifications": [
      "Certified General Handyman",
      "Carpentry & Joinery Trade Test",
      "Power Tool Safety Certification",
      "Interior Finishing Specialist"
    ],
    "titles": [
      "Professional Handyman & Installer",
      "Residential Carpentry & Mounting Specialist",
      "General Maintenance Handyman",
      "Furniture Assembly & Fixture Tech"
    ]
  },
  {
    "domain": "Satellite TV, DStv & Home Wi-Fi Setup",
    "code": "ENT",
    "skills": [
      "DStv satellite dish azimuth and elevation realignment",
      "Satellite finder signal meter diagnostics",
      "Home Wi-Fi mesh range extender configuration",
      "Cat6 ethernet cable routing and wall faceplate termination",
      "Smart TV soundbar and home theater audio calibration",
      "Quad LNB multi-room decoder distribution"
    ],
    "certifications": [
      "MultiChoice DStv Accredited Installer",
      "CompTIA Network+",
      "Audio-Visual Systems Certified",
      "RF Signal Specialist"
    ],
    "titles": [
      "Satellite & Home Entertainment Technician",
      "DStv & Audio-Visual Field Specialist",
      "Residential Wireless & TV Tech",
      "Home Network & Cable Installer"
    ]
  },
  {
    "domain": "Mobile Automotive Roadside Assistance",
    "code": "AUT",
    "skills": [
      "Emergency 12V vehicle battery jumpstart",
      "Mobile OBD-II computer diagnostic scanning",
      "Flat tire replacement and stripped wheel nut extraction",
      "Alternator charging voltage testing",
      "Emergency radiator coolant hose leak repair",
      "Mobile starter motor solenoid tapping and replacement"
    ],
    "certifications": [
      "Certified Automotive Technician (NITA)",
      "Motor Vehicle Mechanics Trade Test",
      "Automotive Electrical Specialist",
      "Roadside Safety & Recovery"
    ],
    "titles": [
      "Mobile Auto-Electrician & Roadside Mechanic",
      "Emergency Roadside Assistance Specialist",
      "Automotive Field Diagnostic Tech",
      "Mobile Vehicle Battery & Recovery Technician"
    ]
  },
  {
    "domain": "Domestic Water Heating & Instant Showers",
    "code": "SWR",
    "skills": [
      "Lorenzetti and Enerbras instant shower element replacement",
      "Dedicated 20A/32A shower circuit breaker wiring",
      "Water heater storage geyser thermostat repair",
      "Shower head descaling and pressure valve regulation",
      "Earth continuity bonding for wet areas",
      "Pressure-relief safety valve replacement"
    ],
    "certifications": [
      "EPRA Domestic Electrician Class C",
      "Plumbing & Sanitary Trade Test",
      "Instant Shower Installation Certified",
      "Water Heating Appliance Safety"
    ],
    "titles": [
      "Water Heating & Instant Shower Technician",
      "Domestic Electrical & Plumbing Specialist",
      "Water Heater Repair Wireman",
      "Lorenzetti & Appliance Specialist"
    ]
  }
];
