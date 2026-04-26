import { WardData, Alert, AQIStatus, PriorityWard, MapWard, Resource } from './types';

// Color Palette
export const COLORS = {
  primary: '#1e3a5f',
  sidebarBg: '#0f2942',
  background: '#f5f7fa',
  status: {
    good: '#00e400',
    satisfactory: '#ffff00',
    moderate: '#ff7e00',
    poor: '#ff0000',
    veryPoor: '#8f3f97',
    severe: '#7e0023',
  },
  badges: {
    critical: '#dc2626',
    warning: '#f59e0b',
    info: '#3b82f6',
    success: '#10b981',
  }
};

export const MOCK_WARDS: WardData[] = [
  { id: 'W001', name: 'Anand Vihar', aqi: 425, pm25: 310, pm10: 450, status: 'Severe', trend: 'up', lastUpdated: '10 mins ago' },
  { id: 'W002', name: 'RK Puram', aqi: 312, pm25: 180, pm10: 290, status: 'Very Poor', trend: 'down', lastUpdated: '15 mins ago' },
  { id: 'W003', name: 'Punjabi Bagh', aqi: 289, pm25: 145, pm10: 210, status: 'Poor', trend: 'stable', lastUpdated: '5 mins ago' },
  { id: 'W004', name: 'Mandir Marg', aqi: 195, pm25: 90, pm10: 150, status: 'Moderate', trend: 'down', lastUpdated: '12 mins ago' },
  { id: 'W005', name: 'Dwarka Sector 8', aqi: 345, pm25: 210, pm10: 320, status: 'Very Poor', trend: 'up', lastUpdated: '8 mins ago' },
  { id: 'W006', name: 'Okhla Phase 2', aqi: 380, pm25: 240, pm10: 360, status: 'Very Poor', trend: 'up', lastUpdated: '20 mins ago' },
  { id: 'W007', name: 'Bawana', aqi: 455, pm25: 350, pm10: 480, status: 'Severe', trend: 'up', lastUpdated: '3 mins ago' },
  { id: 'W008', name: 'Lodhi Road', aqi: 175, pm25: 85, pm10: 140, status: 'Moderate', trend: 'stable', lastUpdated: '25 mins ago' },
];

export const PRIORITY_WARDS: PriorityWard[] = [
  {
    id: 1,
    priority: 1,
    name: 'Rohini',
    zone: 'North Delhi',
    population: '2.5L',
    currentAQI: 412,
    aqiStatus: 'Severe',
    trendValue: 23,
    primarySource: 'Vehicular',
    sourcePercentage: 45,
    sourceColor: 'bg-orange-600',
    actions: ['Deploy water sprinklers', 'Traffic control at 3 points'],
    urgency: 'critical'
  },
  {
    id: 2,
    priority: 2,
    name: 'Dwarka',
    zone: 'West Delhi',
    population: '1.8L',
    currentAQI: 327,
    aqiStatus: 'Very Poor',
    trendValue: 15,
    primarySource: 'Construction',
    sourcePercentage: 52,
    sourceColor: 'bg-yellow-600',
    actions: ['Halt construction activities', 'Deploy road sweepers'],
    urgency: 'high'
  },
  {
    id: 3,
    priority: 3,
    name: 'Najafgarh',
    zone: 'South-West Delhi',
    population: '1.2L',
    currentAQI: 298,
    aqiStatus: 'Poor',
    trendValue: -8,
    primarySource: 'Industrial',
    sourcePercentage: 38,
    sourceColor: 'bg-gray-600',
    actions: ['Monitor industrial emissions', 'Continue current measures'],
    urgency: 'moderate'
  },
  {
    id: 4,
    priority: 4,
    name: 'Okhla Phase 3',
    zone: 'South Delhi',
    population: '2.1L',
    currentAQI: 285,
    aqiStatus: 'Poor',
    trendValue: 5,
    primarySource: 'Waste Burning',
    sourcePercentage: 60,
    sourceColor: 'bg-red-600',
    actions: ['Increase patrol', 'Public awareness announcement'],
    urgency: 'moderate'
  },
  {
    id: 5,
    priority: 5,
    name: 'Mundka',
    zone: 'West Delhi',
    population: '1.5L',
    currentAQI: 275,
    aqiStatus: 'Poor',
    trendValue: -2,
    primarySource: 'Industrial',
    sourcePercentage: 42,
    sourceColor: 'bg-gray-600',
    actions: ['Inspect factories', 'Check waste disposal'],
    urgency: 'moderate'
  }
];

// Updated Mock Alerts for the new page design
export const MOCK_ALERTS: Alert[] = [
  { 
    id: 'ALRT-2401', 
    severity: 'Critical', 
    title: 'Severe Smog Accumulation', 
    location: 'Anand Vihar, East Delhi', 
    message: 'PM2.5 levels exceeded 500 ug/m3. Visibility reduced to < 50m.', 
    timestamp: '15m ago', 
    status: 'Open',
    type: 'Smog'
  },
  { 
    id: 'ALRT-2402', 
    severity: 'High', 
    title: 'Industrial Fire - Plastic Unit', 
    location: 'Bawana Industrial Area', 
    message: 'Toxic black smoke reported from Sector 3. Fire tenders dispatched.', 
    timestamp: '1 hr ago', 
    status: 'Open',
    type: 'Fire'
  },
  { 
    id: 'ALRT-2403', 
    severity: 'High', 
    title: 'Construction Ban Violation', 
    location: 'Dwarka Sector 21', 
    message: 'Major construction activity detected despite GRAP-4 restrictions.', 
    timestamp: '2 hr ago', 
    status: 'Open',
    type: 'Construction'
  },
  { 
    id: 'ALRT-2404', 
    severity: 'Medium', 
    title: 'Biomass Burning', 
    location: 'Najafgarh Rural Belt', 
    message: 'Multiple localized fires detected by satellite imaging.', 
    timestamp: '4 hr ago', 
    status: 'Open',
    type: 'Burning'
  },
  { 
    id: 'ALRT-2405', 
    severity: 'Medium', 
    title: 'Traffic Congestion Spike', 
    location: 'ITO Junction', 
    message: 'Severe congestion causing localized NO2 spike. Traffic police alerted.', 
    timestamp: '5 hr ago', 
    status: 'Resolved',
    type: 'Traffic'
  },
  { 
    id: 'ALRT-2406', 
    severity: 'Low', 
    title: 'Sensor Malfunction', 
    location: 'Lodhi Road Station', 
    message: 'PM10 sensor stopped transmitting data. Technician assigned.', 
    timestamp: '8 hr ago', 
    status: 'Open',
    type: 'Sensor'
  }
];

export const CHART_DATA = [
  { time: '06:00', aqi: 320 },
  { time: '08:00', aqi: 380 },
  { time: '10:00', aqi: 410 },
  { time: '12:00', aqi: 390 },
  { time: '14:00', aqi: 350 },
  { time: '16:00', aqi: 340 },
  { time: '18:00', aqi: 395 },
];

export const getStatusColor = (status: AQIStatus): string => {
  switch (status) {
    case 'Good': return COLORS.status.good;
    case 'Satisfactory': return COLORS.status.satisfactory;
    case 'Moderate': return COLORS.status.moderate;
    case 'Poor': return COLORS.status.poor;
    case 'Very Poor': return COLORS.status.veryPoor;
    case 'Severe': return COLORS.status.severe;
    default: return '#cccccc';
  }
};

// Mock Polygons for Map
// Delhi approx center: 28.61, 77.20
export const MOCK_MAP_WARDS: MapWard[] = [
  {
    ...PRIORITY_WARDS[0], // Rohini
    coordinates: [
      [28.70, 77.08], [28.75, 77.08], [28.75, 77.15], [28.70, 77.15]
    ],
    pm25: 287, pm10: 198, no2: 45, so2: 12, updatedAt: '2 mins ago',
    historicalData: [
      { time: '00:00', aqi: 380 }, { time: '04:00', aqi: 395 }, { time: '08:00', aqi: 412 }, { time: '12:00', aqi: 405 }
    ],
    activeInterventions: [{ id: 1, type: 'Water sprinklers', timeAgo: '10 mins ago' }]
  },
  {
    ...PRIORITY_WARDS[1], // Dwarka
    coordinates: [
       [28.56, 77.03], [28.62, 77.03], [28.62, 77.09], [28.56, 77.09]
    ],
    pm25: 210, pm10: 160, no2: 35, so2: 10, updatedAt: '5 mins ago',
    historicalData: [
      { time: '00:00', aqi: 300 }, { time: '04:00', aqi: 310 }, { time: '08:00', aqi: 327 }, { time: '12:00', aqi: 315 }
    ],
    activeInterventions: [{ id: 2, type: 'Road Sweeping', timeAgo: '1 hour ago' }]
  },
  {
    ...PRIORITY_WARDS[2], // Najafgarh
    coordinates: [
      [28.58, 76.95], [28.65, 76.95], [28.65, 77.02], [28.58, 77.02]
    ],
    pm25: 180, pm10: 140, no2: 25, so2: 8, updatedAt: '8 mins ago',
    historicalData: [
      { time: '00:00', aqi: 280 }, { time: '04:00', aqi: 290 }, { time: '08:00', aqi: 298 }, { time: '12:00', aqi: 285 }
    ],
    activeInterventions: []
  },
  {
    ...PRIORITY_WARDS[3], // Okhla (South)
    coordinates: [
      [28.50, 77.25], [28.56, 77.25], [28.56, 77.30], [28.50, 77.30]
    ],
    pm25: 175, pm10: 130, no2: 40, so2: 15, updatedAt: '3 mins ago',
    historicalData: [
      { time: '00:00', aqi: 270 }, { time: '04:00', aqi: 275 }, { time: '08:00', aqi: 285 }, { time: '12:00', aqi: 280 }
    ],
    activeInterventions: [{ id: 3, type: 'Patrolling', timeAgo: '20 mins ago' }]
  },
  {
    id: 6,
    priority: 6,
    name: 'Connaught Place',
    zone: 'Central Delhi',
    population: '0.8L',
    currentAQI: 185,
    aqiStatus: 'Moderate',
    trendValue: -5,
    primarySource: 'Vehicular',
    sourcePercentage: 65,
    sourceColor: 'bg-blue-600',
    actions: ['Traffic diversion'],
    urgency: 'moderate',
    coordinates: [
      [28.62, 77.20], [28.64, 77.20], [28.64, 77.23], [28.62, 77.23]
    ],
    pm25: 95, pm10: 110, no2: 55, so2: 5, updatedAt: '1 min ago',
    historicalData: [
      { time: '00:00', aqi: 210 }, { time: '04:00', aqi: 200 }, { time: '08:00', aqi: 185 }, { time: '12:00', aqi: 190 }
    ],
    activeInterventions: []
  },
  {
    id: 7,
    priority: 7,
    name: 'Yamuna Vihar',
    zone: 'North East Delhi',
    population: '3.1L',
    currentAQI: 390,
    aqiStatus: 'Very Poor',
    trendValue: 12,
    primarySource: 'Biomass Burning',
    sourcePercentage: 55,
    sourceColor: 'bg-purple-600',
    actions: ['Fire tender deployment'],
    urgency: 'high',
    coordinates: [
      [28.68, 77.26], [28.72, 77.26], [28.72, 77.30], [28.68, 77.30]
    ],
    pm25: 250, pm10: 220, no2: 30, so2: 20, updatedAt: '12 mins ago',
    historicalData: [
      { time: '00:00', aqi: 360 }, { time: '04:00', aqi: 375 }, { time: '08:00', aqi: 390 }, { time: '12:00', aqi: 385 }
    ],
    activeInterventions: []
  }
];

export const MOCK_RESOURCES: Resource[] = [
  { id: 'RES-001', type: 'Anti-Smog Gun', status: 'Active', position: [28.64, 77.21], vehicleId: 'ASG-101' },
  { id: 'RES-002', type: 'Water Sprinkler', status: 'Idle', position: [28.68, 77.10], vehicleId: 'WST-204' },
  { id: 'RES-003', type: 'Water Sprinkler', status: 'Active', position: [28.58, 77.05], vehicleId: 'WST-208' },
  { id: 'RES-004', type: 'Anti-Smog Gun', status: 'Maintenance', position: [28.62, 77.28], vehicleId: 'ASG-103' },
  { id: 'RES-005', type: 'Water Sprinkler', status: 'Idle', position: [28.52, 77.27], vehicleId: 'WST-212' },
  { id: 'RES-006', type: 'Anti-Smog Gun', status: 'Idle', position: [28.72, 77.12], vehicleId: 'ASG-105' },
];