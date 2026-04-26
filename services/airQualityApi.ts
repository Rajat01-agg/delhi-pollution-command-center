/**
 * Air Quality API Service
 * 
 * Fetches air quality data from Google Air Quality API via backend proxy,
 * with fallback to local ward data when Google API fails or rate-limits.
 */

import { WardAQIData, AQICategoryRaw } from '../types';

// Google API response types
interface GoogleAirQualityIndex {
  code: string;
  displayName: string;
  aqi: number;
  aqiDisplay: string;
  color: { red: number; green: number; blue: number };
  category: string;
  dominantPollutant: string;
}

interface GoogleAirQualityResponse {
  dateTime: string;
  indexes: GoogleAirQualityIndex[];
  pollutants?: Array<{
    code: string;
    displayName: string;
    fullName: string;
    concentration: { value: number; units: string };
  }>;
}

interface BatchLocationRequest {
  ward_unique: string;
  lat: number;
  lon: number;
}

/**
 * Maps Google's AQI category to our internal category format
 */
function mapGoogleCategory(category: string, aqi: number): AQICategoryRaw {
  const cat = category.toLowerCase();
  if (cat.includes('good') || aqi <= 50) return 'good';
  if (cat.includes('satisfactory') || aqi <= 100) return 'satisfactory';
  if (cat.includes('moderate') || aqi <= 200) return 'moderate';
  if (cat.includes('poor') || aqi <= 300) return 'poor';
  if (cat.includes('very') || cat.includes('unhealthy') || aqi <= 400) return 'very_poor';
  return 'severe';
}

/**
 * Maps Google's dominant pollutant code to our format
 */
function mapDominantPollutant(pollutant: string): string {
  const map: Record<string, string> = {
    'pm25': 'pm25',
    'pm10': 'pm10',
    'o3': 'o3',
    'no2': 'no2',
    'so2': 'so2',
    'co': 'co',
  };
  return map[pollutant.toLowerCase()] || pollutant.toLowerCase();
}

/**
 * Derives primary source string from dominant pollutant
 *
 * pm25/pm10 → "dust/construction"
 * no2/co    → "vehicular"
 * so2       → "industrial"
 * o3        → "secondary"
 */
function deriveSourceHint(dominantPollutant: string): string {
  const pollutant = dominantPollutant.toLowerCase();
  if (pollutant === 'pm25' || pollutant === 'pm10') return 'dust/construction';
  if (pollutant === 'no2' || pollutant === 'co') return 'vehicular';
  if (pollutant === 'so2') return 'industrial';
  if (pollutant === 'o3') return 'secondary';
  return 'mixed';
}

/**
 * Fetches air quality for a single location from Google API via proxy
 */
export async function fetchGoogleAirQuality(
  lat: number,
  lon: number
): Promise<GoogleAirQualityResponse | null> {
  try {
    const response = await fetch('/api/airquality', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lat, lon }),
    });

    if (!response.ok) {
      console.warn(`Google API proxy returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data as GoogleAirQualityResponse;
  } catch (error) {
    console.warn('Failed to fetch from Google API proxy:', error);
    return null;
  }
}

/**
 * Transforms Google API response into our WardAQIData format
 */
export function transformGoogleResponse(
  googleData: GoogleAirQualityResponse,
  wardInfo: { ward_unique: string; ward_id: string; zone: string; lat: number; lon: number }
): Partial<WardAQIData> {
  // Find the universal AQI index (or first available)
  const aqiIndex = googleData.indexes.find(i => i.code === 'uaqi') || googleData.indexes[0];
  
  if (!aqiIndex) {
    return {
      aqi: null,
      aqi_category: 'unknown',
      dominant_pollutant: '',
      source_hint: '',
      updated_utc: googleData.dateTime,
    };
  }

  const dominantPollutant = mapDominantPollutant(aqiIndex.dominantPollutant || '');
  
  return {
    aqi: aqiIndex.aqi,
    aqi_category: mapGoogleCategory(aqiIndex.category || '', aqiIndex.aqi),
    dominant_pollutant: dominantPollutant,
    source_hint: deriveSourceHint(dominantPollutant),
    updated_utc: googleData.dateTime,
  };
}

/**
 * Fetches air quality for multiple ward locations with batching.
 * Returns a map of ward_unique -> partial WardAQIData.
 * 
 * Note: Google API doesn't support batch requests, so we make individual calls
 * with rate limiting to avoid hitting quotas.
 */
export async function fetchBatchAirQuality(
  locations: BatchLocationRequest[],
  delayMs = 100 // Delay between requests to avoid rate limiting
): Promise<Map<string, Partial<WardAQIData>>> {
  const results = new Map<string, Partial<WardAQIData>>();
  
  // Limit concurrent requests - process in small batches
  const batchSize = 5;
  
  for (let i = 0; i < locations.length; i += batchSize) {
    const batch = locations.slice(i, i + batchSize);
    
    const promises = batch.map(async (loc) => {
      const response = await fetchGoogleAirQuality(loc.lat, loc.lon);
      if (response) {
        const parts = loc.ward_unique.match(/^(\d+)([A-Z]+)$/);
        const wardId = parts ? parts[1] : loc.ward_unique;
        const zone = parts ? parts[2] : '';
        
        const transformed = transformGoogleResponse(response, {
          ward_unique: loc.ward_unique,
          ward_id: wardId,
          zone: zone,
          lat: loc.lat,
          lon: loc.lon,
        });
        return { ward_unique: loc.ward_unique, data: transformed };
      }
      return { ward_unique: loc.ward_unique, data: null };
    });
    
    const batchResults = await Promise.all(promises);
    
    for (const result of batchResults) {
      if (result.data) {
        results.set(result.ward_unique, result.data);
      }
    }
    
    // Add delay between batches
    if (i + batchSize < locations.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

/**
 * Merges Google API data with local fallback data.
 * Google data takes precedence where available.
 */
export function mergeWithFallback(
  localWards: WardAQIData[],
  googleData: Map<string, Partial<WardAQIData>>
): WardAQIData[] {
  return localWards.map(ward => {
    const googleUpdate = googleData.get(ward.ward_unique);
    if (googleUpdate && googleUpdate.aqi !== null && googleUpdate.aqi !== undefined) {
      return {
        ...ward,
        ...googleUpdate,
      } as WardAQIData;
    }
    return ward;
  });
}
