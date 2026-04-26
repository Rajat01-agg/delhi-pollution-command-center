import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Plus, 
  Minus, 
  Home, 
  Expand, 
  X, 
  Zap, 
  Share2,
  AlertTriangle,
  Truck,
  Loader2
} from 'lucide-react';
import { MOCK_RESOURCES } from '../constants';
import { Resource, ResourceStatus, WardAQIData } from '../types';
import { 
  useWardData, 
  getColorForCategory, 
  deriveAQIStatusFromValue, 
  getActionsForSource,
  getUrgencyFromAQI,
  derivePrimarySource,
} from '../hooks/useWardData';

// Helper to update map view
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

// Helper: Calculate center of a polygon
const getPolygonCenter = (coords: [number, number][]): [number, number] => {
  let lat = 0, lng = 0;
  coords.forEach(c => {
    lat += c[0];
    lng += c[1];
  });
  return [lat / coords.length, lng / coords.length];
};

// Helper: Distance calculation (approximate Euclidean for demo)
const getDistance = (p1: [number, number], p2: [number, number]) => {
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
};

const DELHI_BOUNDS: L.LatLngBoundsExpression = [
  [28.4, 76.8],
  [28.9, 77.3],
];

// Extended ward type for map display
interface MapWardDisplay {
  ward: WardAQIData;
  position: [number, number];
  aqi: number | null;
  aqiStatus: string;
  color: string;
  urgency: 'critical' | 'high' | 'moderate';
  primarySource: string;
  actions: string[];
}

const WardMap: React.FC = () => {
  const [selectedWard, setSelectedWard] = useState<MapWardDisplay | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.65, 77.15]); // Approximate center of covered wards
  const [mapZoom, setMapZoom] = useState(11);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'heatmap' | 'resources' | 'vulnerability'>('heatmap');
  const [showSchoolsHospitals, setShowSchoolsHospitals] = useState(true);
  const [showTrafficHotspots, setShowTrafficHotspots] = useState(false);
  const [showActiveFires, setShowActiveFires] = useState(false);

  // Fetch real ward data
  const { wards: rawWards, loading, error } = useWardData();

  const [activeRoute, setActiveRoute] = useState<{
    start: [number, number];
    end: [number, number];
    resource: Resource;
    distance: number;
    eta: number;
  } | null>(null);

  const handleWardClick = (wardDisplay: MapWardDisplay) => {
    setSelectedWard(wardDisplay);
    
    // If AQI is high, trigger resource routing
    if (wardDisplay.aqi !== null && wardDisplay.aqi > 300) {
      const wardCenter = wardDisplay.position;
      
      // Find nearest Idle resource
      let nearestResource: Resource | null = null;
      let minDist = Infinity;

      MOCK_RESOURCES.filter(r => r.status === 'Idle').forEach(res => {
        const d = getDistance(res.position, wardCenter);
        if (d < minDist) {
          minDist = d;
          nearestResource = res;
        }
      });

      if (nearestResource) {
        // Mock calculations: 1 degree approx 111km. 
        // Let's pretend minDist * 100 is km for simplicity in this mock
        const distanceKm = Math.round(minDist * 100 * 10) / 10;
        const etaMins = Math.round(distanceKm * 2.5 + 5); // Mock ETA

        setActiveRoute({
          start: nearestResource.position,
          end: wardCenter,
          resource: nearestResource,
          distance: distanceKm,
          eta: etaMins
        });
      } else {
        setActiveRoute(null);
      }
    } else {
      setActiveRoute(null);
    }
  };

  const closePanel = () => {
    setSelectedWard(null);
    setActiveRoute(null);
  };

  const zoomIn = () => setMapZoom(z => Math.min(z + 1, 18));
  const zoomOut = () => setMapZoom(z => Math.max(z - 1, 5));
  const resetView = () => {
    setMapCenter([28.65, 77.15]);
    setMapZoom(11);
    setSelectedWard(null);
    setActiveRoute(null);
  };
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return '#00e400';
    if (aqi <= 100) return '#ffff00';
    if (aqi <= 200) return '#ff7e00';
    if (aqi <= 300) return '#ff0000';
    if (aqi <= 400) return '#8f3f97';
    return '#7e0023';
  };

  // Custom Icon Factory
  const createResourceIcon = (type: string, status: ResourceStatus) => {
    let colorClass = '';
    let pulseClass = '';
    
    switch (status) {
      case 'Active': 
        colorClass = 'bg-green-500 border-green-700'; 
        pulseClass = 'animate-ping';
        break;
      case 'Idle': 
        colorClass = 'bg-gray-500 border-gray-700'; 
        break;
      case 'Maintenance': 
        colorClass = 'bg-red-500 border-red-700'; 
        break;
    }

    const iconHtml = `
      <div class="relative w-8 h-8 flex items-center justify-center">
        ${status === 'Active' ? `<div class="absolute inset-0 rounded-full bg-green-400 opacity-75 ${pulseClass}"></div>` : ''}
        <div class="relative w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white ${colorClass}">
          ${type === 'Water Sprinkler' 
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.74 5.88a6 6 0 0 1-8.48 8.48A6 6 0 0 1 5.5 11.5c0-.66.09-1.32.26-1.94z"></path></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3zM12 8v8M8 12h8"/></svg>' // Using a simpler shape as "gun" placeholder
          }
        </div>
      </div>
    `;

    return L.divIcon({
      className: 'custom-resource-marker',
      html: iconHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  // Loading and error states
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] bg-gray-100 rounded-xl">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading ward data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] bg-gray-100 rounded-xl">
        <div className="text-center">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 font-medium">Failed to load ward data</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // Transform raw wards to map display format
  const mapWards: MapWardDisplay[] = rawWards
    .filter(w => w.centroid_lat && w.centroid_lon) // Only include wards with valid coordinates
    .map(ward => {
      const primarySource = derivePrimarySource(ward);
      return {
        ward,
        position: [ward.centroid_lat, ward.centroid_lon] as [number, number],
        aqi: ward.aqi,
        aqiStatus: deriveAQIStatusFromValue(ward.aqi),
        color: getColorForCategory(ward.aqi_category),
        urgency: getUrgencyFromAQI(ward.aqi),
        primarySource,
        actions: getActionsForSource(primarySource),
      };
    });

  return (
    <div className={`flex bg-gray-100 ${isFullscreen ? 'fixed inset-0 z-[100] h-screen' : 'h-[calc(100vh-8rem)] rounded-xl overflow-hidden shadow-sm border border-gray-200'}`}>
      {/* Main Map Area */}
      <div className="flex-1 relative bg-slate-100">
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          scrollWheelZoom={true}
          className="h-full w-full outline-none"
          maxBounds={DELHI_BOUNDS}
          maxBoundsViscosity={1.0}
          minZoom={10}
        >
          <MapController center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution='Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          
          {/* Render Resources */}
          {viewMode !== 'vulnerability' && MOCK_RESOURCES.map(resource => (
             <Marker 
                key={resource.id} 
                position={resource.position}
                icon={createResourceIcon(resource.type, resource.status)}
             >
                <Popup>
                    <div className="text-center">
                        <p className="font-bold text-gray-900">{resource.type}</p>
                        <p className="text-xs text-gray-500">{resource.vehicleId}</p>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded mt-1 inline-block 
                            ${resource.status === 'Active' ? 'bg-green-100 text-green-700' : 
                              resource.status === 'Idle' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'}`}>
                            {resource.status}
                        </span>
                    </div>
                </Popup>
             </Marker>
          ))}

          {/* Render Active Route */}
          {activeRoute && (
             <>
               <Polyline 
                 positions={[activeRoute.start, activeRoute.end]} 
                 pathOptions={{ color: '#3b82f6', weight: 4, dashArray: '10, 10', className: 'animate-dash' }}
               />
               <Marker position={activeRoute.end} icon={L.divIcon({ className: 'hidden' })}>
                  <Tooltip permanent direction="top" className="custom-tooltip">
                     <div className="px-2 py-1 text-center bg-white border border-blue-200 rounded shadow-sm">
                        <p className="font-bold text-blue-700 text-xs">Dispatching {activeRoute.resource.vehicleId}</p>
                        <p className="text-[10px] text-gray-500">ETA: {activeRoute.eta} mins</p>
                     </div>
                  </Tooltip>
               </Marker>
             </>
          )}
          
          {/* Render Wards as CircleMarkers */}
          {mapWards.map((wardDisplay) => {
            const isSelected = selectedWard?.ward.ward_unique === wardDisplay.ward.ward_unique;
            const baseOpacity = viewMode === 'resources' ? 0.5 : 0.8;
            const radius = wardDisplay.aqi !== null && wardDisplay.aqi >= 300 ? 12 : 8;

            return (
              <CircleMarker
                key={wardDisplay.ward.ward_unique}
                center={wardDisplay.position}
                radius={isSelected ? radius + 4 : radius}
                pathOptions={{
                  fillColor: wardDisplay.color,
                  fillOpacity: isSelected ? 1 : baseOpacity,
                  color: isSelected ? '#22d3ee' : '#ffffff',
                  weight: isSelected ? 3 : 1,
                }}
                eventHandlers={{
                  click: () => handleWardClick(wardDisplay),
                }}
              >
                <Tooltip sticky direction="top" opacity={1}>
                  <div className="text-center px-2 py-1 bg-slate-900/90 rounded-lg">
                    <p className="font-bold text-xs text-white">{wardDisplay.ward.ward_name || wardDisplay.ward.ward_unique}</p>
                    <p className="text-[11px] font-semibold text-cyan-200">
                      AQI: {wardDisplay.aqi !== null ? wardDisplay.aqi : '—'}
                    </p>
                    <p className="text-[10px] text-slate-300">{wardDisplay.ward.zone}</p>
                    {wardDisplay.aqi !== null && wardDisplay.aqi >= 300 && (
                      <p className="text-[10px] text-red-300 font-bold mt-1">Click for Details</p>
                    )}
                  </div>
                </Tooltip>
                <Popup>
                  <div className="bg-slate-900/95 text-cyan-100 px-4 py-3 rounded-xl shadow-lg border border-cyan-500/50 min-w-[220px]">
                    <p className="text-xs tracking-[0.2em] uppercase text-cyan-400 mb-1">Ward HUD</p>
                    <p className="text-sm font-semibold text-white flex justify-between">
                      <span>{wardDisplay.ward.ward_name || wardDisplay.ward.ward_unique}</span>
                      <span className="text-xs text-cyan-300">Zone: {wardDisplay.ward.zone}</span>
                    </p>
                    <div className="mt-3 flex items-baseline gap-3">
                      <span className="text-4xl font-extrabold text-cyan-300 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]">
                        {wardDisplay.aqi !== null ? wardDisplay.aqi : '—'}
                      </span>
                      <span className="text-xs font-semibold text-cyan-200 uppercase tracking-wide">
                        AQI
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-cyan-200">
                      Status: <span className="font-semibold">{wardDisplay.aqiStatus}</span>
                      <span className="block mt-1 text-[10px] text-cyan-300/80">
                        Source: {wardDisplay.primarySource || 'Unknown'}
                      </span>
                      <span className="block text-[10px] text-cyan-300/80">
                        Station: {wardDisplay.ward.nearest_station} ({wardDisplay.ward.nearest_station_km}km)
                      </span>
                    </p>
                    <button
                      className="mt-3 w-full text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-md py-1.5 flex items-center justify-center gap-1 transition-colors"
                      onClick={() => handleWardClick(wardDisplay)}
                    >
                      <Truck className="h-3 w-3" />
                      View Details
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Floating Command Deck - compact control panel */}
        <div className="absolute top-3 left-3 z-[400] w-56">
          <div className="bg-slate-900/75 border border-white/10 rounded-lg shadow-md text-slate-100 px-2 py-1.5 space-y-1 text-[11px]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-cyan-300 font-semibold">{mapWards.length} Wards</span>
                <span className="text-slate-400">Live Data</span>
              </div>
              
              <label className="flex items-center gap-1 justify-between">
                <span className="text-[10px] text-slate-200">Mode</span>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as typeof viewMode)}
                  className="bg-slate-800/80 border border-slate-600 rounded px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-cyan-400"
                >
                  <option value="heatmap">Pollution heatmap</option>
                  <option value="resources">Resource tracking</option>
                  <option value="vulnerability">Vulnerability map</option>
                </select>
              </label>

              <details className="mt-0.5">
                <summary className="cursor-pointer text-[10px] text-slate-300 select-none">
                  Overlays
                </summary>
                <div className="mt-1 space-y-0.5 text-[10px]">
                  <label className="flex items-center justify-between gap-2">
                    <span>Schools / Hospitals</span>
                    <input
                      type="checkbox"
                      checked={showSchoolsHospitals}
                      onChange={() => setShowSchoolsHospitals((v) => !v)}
                      className="accent-cyan-400 h-3 w-3"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2">
                    <span>Traffic Hotspots</span>
                    <input
                      type="checkbox"
                      checked={showTrafficHotspots}
                      onChange={() => setShowTrafficHotspots((v) => !v)}
                      className="accent-cyan-400 h-3 w-3"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2">
                    <span>Active Fires (FIRMS)</span>
                    <input
                      type="checkbox"
                      checked={showActiveFires}
                      onChange={() => setShowActiveFires((v) => !v)}
                      className="accent-cyan-400 h-3 w-3"
                    />
                  </label>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Map Controls (Top Right) */}
        <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <button onClick={zoomIn} className="p-2 hover:bg-gray-50 border-b border-gray-200 block transition-colors">
              <Plus className="h-5 w-5 text-gray-700" />
            </button>
            <button onClick={zoomOut} className="p-2 hover:bg-gray-50 block transition-colors">
              <Minus className="h-5 w-5 text-gray-700" />
            </button>
          </div>
          
          <button onClick={resetView} className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border border-gray-200 transition-colors" title="Reset View">
            <Home className="h-5 w-5 text-gray-700" />
          </button>
          
          <button onClick={toggleFullscreen} className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border border-gray-200 transition-colors" title="Fullscreen">
            <Expand className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* Live Indicator */}
        <div className="absolute bottom-4 left-4 z-[400] px-4 py-2 bg-white/90 backdrop-blur rounded-full shadow-md border border-gray-200 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span className="text-xs font-semibold text-gray-700">Live Resource Tracking</span>
        </div>
        
        {/* Style for line animation */}
        <style>{`
            .animate-dash {
                animation: dash 1.5s linear infinite;
            }
            @keyframes dash {
                to {
                    stroke-dashoffset: -20;
                }
            }
            .custom-tooltip {
                background: transparent;
                border: none;
                box-shadow: none;
            }
        `}</style>
      </div>

      {/* Right Panel - Ward Details (Slide-over) */}
      <div 
        className={`bg-white shadow-2xl z-20 w-96 overflow-y-auto border-l border-gray-200 transition-all duration-300 absolute right-0 top-0 bottom-0
          ${selectedWard ? 'translate-x-0' : 'translate-x-full hidden'}`}
      >
        {selectedWard && (
          <div className="p-6">
            <button 
              onClick={closePanel}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="mb-6 mt-2">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900 font-serif-heading">
                  Ward {selectedWard.ward.ward_name || selectedWard.ward.ward_unique}
                </h2>
                {selectedWard.urgency === 'critical' && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wide rounded border border-red-200">
                    Critical
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 font-medium">
                Zone: {selectedWard.ward.zone}
              </p>
            </div>
            
            {/* Current AQI */}
            <div 
              className="mb-6 p-6 rounded-xl text-white text-center shadow-inner relative overflow-hidden"
              style={{ backgroundColor: selectedWard.color }}
            >
              <div className="relative z-10">
                <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">Current AQI</p>
                <p className="text-6xl font-bold mb-2 tracking-tighter">
                  {selectedWard.aqi !== null ? selectedWard.aqi : '—'}
                </p>
                <p className="text-lg font-bold uppercase">{selectedWard.aqiStatus}</p>
              </div>
            </div>

            {/* Active Route Info */}
            {activeRoute ? (
                <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4 animate-in fade-in slide-in-from-right duration-300">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 bg-blue-100 rounded text-blue-600">
                            <Truck className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-blue-900 text-sm">Logistics Response Initiated</span>
                    </div>
                    <div className="space-y-1 ml-1 text-sm text-blue-800">
                        <p>Dispatching: <strong>{activeRoute.resource.vehicleId}</strong> ({activeRoute.resource.type})</p>
                        <p>Distance: <strong>{activeRoute.distance} km</strong></p>
                        <p>Est. Arrival: <strong>{activeRoute.eta} mins</strong></p>
                    </div>
                </div>
            ) : selectedWard.aqi !== null && selectedWard.aqi > 300 ? (
                <div className="mb-6 bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                     <p className="text-xs text-yellow-800 font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        No idle resources nearby or route not calculated.
                     </p>
                </div>
            ) : null}
            
            {/* Ward Details Grid */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                Ward Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold mb-1">Dominant Pollutant</p>
                  <p className="text-sm font-bold text-gray-900">{selectedWard.ward.dominant_pollutant || '—'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 font-bold mb-1">Source Hint</p>
                  <p className="text-sm font-bold text-gray-900">{selectedWard.ward.source_hint || '—'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 col-span-2">
                  <p className="text-xs text-gray-500 font-bold mb-1">Nearest Station</p>
                  <p className="text-sm font-bold text-gray-900">
                    {selectedWard.ward.nearest_station || '—'}
                    <span className="text-gray-500 font-normal"> ({selectedWard.ward.nearest_station_km}km)</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                Recommended Actions
              </h3>
              <div className="space-y-2">
                {selectedWard.actions.map((action, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-800 font-medium">• {action}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Last Updated */}
            <div className="mb-6 text-xs text-gray-500">
              Last updated: {selectedWard.ward.updated_utc ? new Date(selectedWard.ward.updated_utc).toLocaleString() : '—'}
            </div>
            
            {/* Actions */}
            <div className="space-y-3 mt-8">
              <button className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2">
                <Zap className="h-5 w-5" />
                Deploy Interventions
              </button>
              <button className="w-full py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                <Share2 className="h-5 w-5" />
                Share Report
              </button>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};

export default WardMap;