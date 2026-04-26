import { useState, useEffect, useCallback } from 'react';
import { WardAQIData } from '../types';
import { fetchBatchAirQuality, mergeWithFallback } from '../services/airQualityApi';

export type DataSource = 'google' | 'local' | 'mixed';

interface UseWardDataResult {
  wards: WardAQIData[];
  loading: boolean;
  error: string | null;
  dataSource: DataSource;
  refreshFromGoogle: () => Promise<void>;
  lastUpdated: Date | null;
}

interface WardNameMapEntry {
  ward_no: string;
  ward_name: string;
}

/**
 * Parses and normalizes raw ward data from local JSON
 */
function normalizeLocalWardData(data: any[]): WardAQIData[] {
  return data.map((ward: any) => ({
    ward_unique: ward.ward_unique,
    ward_id: ward.ward_id,
    zone: ward.zone,
    centroid_lat: typeof ward.centroid_lat === 'string' ? parseFloat(ward.centroid_lat) : ward.centroid_lat,
    centroid_lon: typeof ward.centroid_lon === 'string' ? parseFloat(ward.centroid_lon) : ward.centroid_lon,
    aqi: ward.aqi === null || ward.aqi === undefined || ward.aqi === '' ? null : Number(ward.aqi),
    aqi_category: ward.aqi_category || 'unknown',
    dominant_pollutant: ward.dominant_pollutant || '',
    source_hint: ward.source_hint || '',
    nearest_station: ward.nearest_station || '',
    nearest_station_km: typeof ward.nearest_station_km === 'string' ? parseFloat(ward.nearest_station_km) : ward.nearest_station_km,
    updated_utc: ward.updated_utc || '',
  }));
}

/**
 * Fetches local ward data from JSON file
 */
async function fetchLocalWardData(): Promise<WardAQIData[]> {
  const response = await fetch('/ward_latest_aqi.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch local ward data: ${response.status}`);
  }
  const data = await response.json();
  return normalizeLocalWardData(data);
}

/**
 * Fetches ward name map and returns a lookup map: ward_no -> ward_name
 */
async function fetchWardNameMap(): Promise<Map<string, string>> {
  const response = await fetch('/ward_name_map.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch ward name map: ${response.status}`);
  }
  const data: WardNameMapEntry[] = await response.json();
  const map = new Map<string, string>();
  for (const entry of data) {
    if (entry.ward_no && entry.ward_name) {
      map.set(String(entry.ward_no), entry.ward_name);
    }
  }
  return map;
}

/**
 * Hook configuration options
 */
interface UseWardDataOptions {
  /** Whether to attempt Google API fetch on initial load (default: true) */
  useGoogleApi?: boolean;
  /** Maximum number of wards to fetch from Google API per batch (default: 20) */
  googleBatchSize?: number;
}

export const useWardData = (options: UseWardDataOptions = {}): UseWardDataResult => {
  const { useGoogleApi = true, googleBatchSize = 20 } = options;
  
  const [wards, setWards] = useState<WardAQIData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>('local');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  /**
   * Refreshes data from Google API, merging with local fallback
   */
  const refreshFromGoogle = useCallback(async () => {
    if (wards.length === 0) return;
    
    try {
      // Prepare locations for batch fetch (limit to googleBatchSize for rate limiting)
      const locations = wards.slice(0, googleBatchSize).map(w => ({
        ward_unique: w.ward_unique,
        lat: w.centroid_lat,
        lon: w.centroid_lon,
      }));
      
      const googleData = await fetchBatchAirQuality(locations);
      
      if (googleData.size > 0) {
        const merged = mergeWithFallback(wards, googleData);
        setWards(merged);
        setDataSource(googleData.size === wards.length ? 'google' : 'mixed');
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.warn('Failed to refresh from Google API:', err);
      // Keep existing data, don't update dataSource
    }
  }, [wards, googleBatchSize]);

  useEffect(() => {
    const fetchWards = async () => {
      try {
        setLoading(true);
        
        // Step 1: Always fetch local data first as baseline/fallback
        let localWards = await fetchLocalWardData();

        // Apply ward names from ward_name_map.json when available
        try {
          const nameMap = await fetchWardNameMap();
          localWards = localWards.map((ward) => ({
            ...ward,
            ward_name: nameMap.get(ward.ward_id) ?? ward.ward_unique,
          }));
        } catch (nameErr) {
          console.warn('Ward name map not available, using ward codes as fallback:', nameErr);
        }

        setWards(localWards);
        setDataSource('local');
        setError(null);
        
        // Step 2: If Google API is enabled, try to enhance with live data
        if (useGoogleApi) {
          try {
            // Only fetch for a sample of wards to avoid rate limiting
            // Priority wards (high AQI) are more important
            const sortedByAqi = [...localWards]
              .filter(w => w.aqi !== null)
              .sort((a, b) => (b.aqi || 0) - (a.aqi || 0));
            
            const priorityWards = sortedByAqi.slice(0, googleBatchSize);
            
            const locations = priorityWards.map(w => ({
              ward_unique: w.ward_unique,
              lat: w.centroid_lat,
              lon: w.centroid_lon,
            }));
            
            const googleData = await fetchBatchAirQuality(locations);
            
            if (googleData.size > 0) {
              const merged = mergeWithFallback(localWards, googleData);
              setWards(merged);
              setDataSource(googleData.size === localWards.length ? 'google' : 'mixed');
              setLastUpdated(new Date());
              console.info(`Enhanced ${googleData.size} wards with Google API data`);
            } else {
              console.info('Google API returned no data, using local fallback');
              setLastUpdated(new Date());
            }
          } catch (googleErr) {
            // Google API failed, but we still have local data
            console.warn('Google API unavailable, using local fallback:', googleErr);
            setLastUpdated(new Date());
          }
        } else {
          setLastUpdated(new Date());
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setWards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWards();
  }, [useGoogleApi, googleBatchSize]);

  return { wards, loading, error, dataSource, refreshFromGoogle, lastUpdated };
};

// Helper functions for ward data processing

/**
 * Derive primary source for a ward using dominant pollutant (if present)
 * and falling back to source_hint from the static dataset.
 */
export const derivePrimarySource = (ward: WardAQIData): string => {
  const dominant = (ward.dominant_pollutant || '').toLowerCase();

  // Prefer Google-derived dominant pollutant mapping when available
  if (dominant === 'pm25' || dominant === 'pm10') return 'dust/construction';
  if (dominant === 'no2' || dominant === 'co') return 'vehicular';
  if (dominant === 'so2') return 'industrial';
  if (dominant === 'o3') return 'secondary';

  // Fallback to original source_hint heuristics from ward_latest_aqi.json
  const hint = (ward.source_hint || '').toLowerCase();
  if (hint.includes('vehicular') || hint.includes('traffic')) return 'vehicular';
  if (hint.includes('industrial') || hint.includes('industry')) return 'industrial';
  if (hint.includes('dust') || hint.includes('construction')) return 'dust/construction';
  if (hint.includes('waste') || hint.includes('burning') || hint.includes('biomass')) return 'waste/burning';

  return hint || 'mixed';
};

/**
 * Get actions based on primary source string
 */
export const getActionsForSource = (source: string): string[] => {
  const hint = (source || '').toLowerCase();
  
  if (hint.includes('vehicular') || hint.includes('traffic')) {
    return ['Traffic diversion', 'Enforce PUC checks'];
  }
  if (hint.includes('industrial') || hint.includes('industry')) {
    return ['Inspect factories', 'Shut high emitters'];
  }
  if (hint.includes('dust') || hint.includes('construction')) {
    return ['Deploy sprinklers', 'Halt construction'];
  }
  if (hint.includes('waste') || hint.includes('burning') || hint.includes('biomass')) {
    return ['Increase patrol', 'Public warning'];
  }
  return ['Monitor', 'Public advisory'];
};

/**
 * Derive AQI status label from numeric AQI
 */
export const deriveAQIStatusFromValue = (aqi: number | null): string => {
  if (aqi === null) return 'Unknown';
  if (aqi >= 400) return 'Severe';
  if (aqi >= 300) return 'Very Poor';
  if (aqi >= 200) return 'Poor';
  if (aqi >= 100) return 'Moderate';
  if (aqi >= 50) return 'Satisfactory';
  return 'Good';
};

/**
 * Get urgency level from AQI
 */
export const getUrgencyFromAQI = (aqi: number | null): 'critical' | 'high' | 'moderate' => {
  if (aqi === null) return 'moderate';
  if (aqi >= 400) return 'critical';
  if (aqi >= 300) return 'high';
  return 'moderate';
};

/**
 * Get color for AQI category (for map markers)
 */
export const getColorForCategory = (category: string): string => {
  switch (category) {
    case 'good': return '#00e400';           // green
    case 'satisfactory': return '#90EE90';   // lightgreen
    case 'moderate': return '#ffff00';        // yellow
    case 'poor': return '#ff7e00';            // orange
    case 'very_poor': return '#ff0000';       // red
    case 'severe': return '#8B0000';          // darkred
    default: return '#808080';                // gray for unknown
  }
};

/**
 * Calculate average AQI from ward data (ignoring nulls)
 */
export const calculateAverageAQI = (wards: WardAQIData[]): number => {
  const validAqis = wards.filter(w => w.aqi !== null).map(w => w.aqi as number);
  if (validAqis.length === 0) return 0;
  return Math.round(validAqis.reduce((sum, aqi) => sum + aqi, 0) / validAqis.length);
};

/**
 * Count critical alerts (AQI >= 300)
 */
export const countCriticalAlerts = (wards: WardAQIData[]): number => {
  return wards.filter(w => w.aqi !== null && w.aqi >= 300).length;
};

/**
 * Count wards with actions (any ward that returns at least 1 action)
 */
export const countWardsWithActions = (wards: WardAQIData[]): number => {
  return wards.filter((w) => getActionsForSource(derivePrimarySource(w)).length > 0).length;
};

/**
 * Sort wards by AQI descending (nulls at end)
 */
export const sortWardsByAQI = (wards: WardAQIData[]): WardAQIData[] => {
  return [...wards].sort((a, b) => {
    if (a.aqi === null && b.aqi === null) return 0;
    if (a.aqi === null) return 1;
    if (b.aqi === null) return -1;
    return b.aqi - a.aqi;
  });
};

/**
 * Deterministic pseudo-random trend delta per ward based on ward_unique.
 * Returns an integer between -15 and +15, stable across reloads.
 */
export const getDeterministicTrendDelta = (wardUnique: string): number => {
  let hash = 0;
  for (let i = 0; i < wardUnique.length; i++) {
    hash = (hash * 31 + wardUnique.charCodeAt(i)) | 0;
  }
  const normalized = ((hash % 31) + 31) % 31; // 0..30
  return normalized - 15; // -15..15
};
