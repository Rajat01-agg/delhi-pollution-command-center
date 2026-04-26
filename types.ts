import React from 'react';

export type AQIStatus = 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe';

export interface WardData {
  id: string;
  name: string;
  aqi: number;
  pm25: number;
  pm10: number;
  status: AQIStatus;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

export interface PriorityWard {
  id: number;
  priority: number;
  name: string;
  zone: string;
  population: string;
  currentAQI: number;
  aqiStatus: AQIStatus;
  trendValue: number;
  primarySource: string;
  sourcePercentage: number;
  sourceColor: string; // e.g., 'bg-orange-600'
  actions: string[];
  urgency: 'critical' | 'high' | 'moderate';
}

export interface MapWard extends PriorityWard {
  coordinates: [number, number][]; // Simple polygon for demo
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  updatedAt: string;
  historicalData: { time: string; aqi: number }[];
  activeInterventions: { id: number; type: string; timeAgo: string }[];
}

export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  location: string;
  message: string;
  timestamp: string;
  status: 'Open' | 'Resolved';
  type: string; // e.g. 'Smog', 'Fire', 'Construction'
}

export interface Metric {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export type ResourceStatus = 'Active' | 'Idle' | 'Maintenance';
export type ResourceType = 'Anti-Smog Gun' | 'Water Sprinkler';

export interface Resource {
  id: string;
  type: ResourceType;
  status: ResourceStatus;
  position: [number, number];
  vehicleId: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  MAP = 'MAP',
  ALERTS = 'ALERTS',
  ACTIONS = 'ACTIONS',
  ANALYTICS = 'ANALYTICS',
  SOCIAL = 'SOCIAL',
  IMPACT = 'IMPACT',
  SIMULATOR = 'SIMULATOR',
  TEAM = 'TEAM',
  SETTINGS = 'SETTINGS',
  REPORTS = 'REPORTS'
}

// Real ward data from ward_latest_aqi.json
export type AQICategoryRaw = 'good' | 'satisfactory' | 'moderate' | 'poor' | 'very_poor' | 'severe' | 'unknown';

export interface WardAQIData {
  ward_unique: string;
  ward_id: string;
  /** Optional human-readable name for the ward (from ward_name_map.json) */
  ward_name?: string;
  zone: string;
  centroid_lat: number;
  centroid_lon: number;
  aqi: number | null;
  aqi_category: AQICategoryRaw;
  dominant_pollutant: string;
  /** Raw source hint from HT Labs / OpenAQ ward dataset */
  source_hint: string;
  nearest_station: string;
  nearest_station_km: number;
  updated_utc: string;
}
