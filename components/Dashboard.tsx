import React, { useMemo, useState } from 'react';
import { 
  Map, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle, 
  Bell, 
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronDown,
  Loader2,
  X,
  RefreshCw
} from 'lucide-react';
import { MOCK_ALERTS } from '../constants';
import GRAPComplianceWidget from './GRAPComplianceWidget';
import ExportBriefingButton from './ExportBriefingButton';
import { 
  useWardData, 
  sortWardsByAQI, 
  calculateAverageAQI, 
  countCriticalAlerts, 
  countWardsWithActions,
  getActionsForSource,
  derivePrimarySource,
  deriveAQIStatusFromValue,
  getUrgencyFromAQI,
  getDeterministicTrendDelta,
} from '../hooks/useWardData';

const PAGE_SIZE = 5;

interface PriorityRow {
  id: number;
  priority: number;
  name: string;
  zone: string;
  population: string;
  currentAQI: number | null;
  aqiStatus: string;
  trendValue: number;
  primarySource: string;
  actions: string[];
  urgency: 'critical' | 'high' | 'moderate';
  ward_unique: string;
  wardId: string;
  updatedUtc: string;
  nearestStation: string;
  nearestStationKm: number;
  // Placeholder kept for CSV compatibility (not shown in UI)
  sourcePercentage?: number;
}

const Dashboard: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PriorityRow | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch real ward data
  const { wards: rawWards, loading, error, refreshFromGoogle } = useWardData();

  // Get unique zones for filter
  const availableZones = useMemo(() => {
    const zones = Array.from(new Set(rawWards.map(w => w.zone)));
    return ['all', ...zones.sort()];
  }, [rawWards]);

  // Filter wards by selected zone
  const filteredWards = useMemo(() => {
    if (selectedZone === 'all') return rawWards;
    return rawWards.filter(ward => ward.zone === selectedZone);
  }, [rawWards, selectedZone]);

  // Process and sort wards by AQI (highest first)
  const allWards: PriorityRow[] = useMemo(() => {
    const sorted = sortWardsByAQI(filteredWards);
    return sorted.map((ward, index) => {
      const trendValue = getDeterministicTrendDelta(ward.ward_unique);
      const primarySource = derivePrimarySource(ward);
      return {
        id: index + 1,
        priority: index + 1,
        name: ward.ward_name || ward.ward_unique,
        zone: ward.zone,
        population: '—', // Not available in data
        currentAQI: ward.aqi,
        aqiStatus: deriveAQIStatusFromValue(ward.aqi),
        trendValue,
        primarySource: primarySource || 'Unknown',
        actions: getActionsForSource(primarySource),
        urgency: getUrgencyFromAQI(ward.aqi),
        ward_unique: ward.ward_unique,
        wardId: ward.ward_id,
        updatedUtc: ward.updated_utc,
        nearestStation: ward.nearest_station || '—',
        nearestStationKm: ward.nearest_station_km || 0,
        sourcePercentage: 50,
      };
    });
  }, [filteredWards]);

  // Calculate summary metrics from filtered data
  const wardsMonitored = filteredWards.length;
  const avgAQI = useMemo(() => calculateAverageAQI(filteredWards), [filteredWards]);
  const criticalAlerts = useMemo(() => countCriticalAlerts(filteredWards), [filteredWards]);
  const actionsCount = useMemo(() => countWardsWithActions(filteredWards), [filteredWards]);

  const totalPages = Math.ceil(allWards.length / PAGE_SIZE);

  const pageWards = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return allWards.slice(startIndex, startIndex + PAGE_SIZE);
  }, [allWards, currentPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleExportCSV = (scope: 'district' | 'all') => {
    setShowExportOptions(false);

    const dataToExport = (() => {
      if (scope === 'all') {
        return allWards;
      }

      const district = window.prompt('Enter district/zone name for export (e.g., "West Delhi", "South Delhi")');
      if (!district) return [];
      return allWards.filter((ward) =>
        ward.zone.toLowerCase().includes(district.toLowerCase())
      );
    })();

    if (!dataToExport.length) {
      window.alert('No wards found for the selected criteria.');
      return;
    }

    const headers = [
      'Rank',
      'Ward',
      'Zone',
      'Population',
      'Live AQI',
      'AQI Status',
      '24h Trend',
      'Primary Source',
      'Source %',
      'Urgency',
    ];

    const rows = dataToExport.map((ward) => [
      ward.priority,
      ward.name,
      ward.zone,
      ward.population,
      ward.currentAQI,
      ward.aqiStatus,
      ward.trendValue,
      ward.primarySource,
      ward.sourcePercentage ?? 0,
      ward.urgency,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      scope === 'all' ? 'all_wards_aqi.csv' : 'district_wise_wards_aqi.csv'
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await refreshFromGoogle();
      // Show brief success message
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    } catch (err) {
      console.error('Refresh failed:', err);
      setIsRefreshing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading ward data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 font-medium">Failed to load ward data</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* PAGE HEADER SECTION */}
      <div className="mb-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-serif-heading">
              Delhi Pollution Command Center
            </h1>
            <p className="text-gray-600 mt-1">
              Real-time monitoring and intervention dashboard for all 272 Delhi wards
            </p>
          </div>
          
          {/* Zone Filter, Refresh Data, and Export Briefing buttons */}
          <div className="flex items-center gap-3 relative z-20">
            {/* Zone Dropdown */}
            <select
              value={selectedZone}
              onChange={(e) => {
                setSelectedZone(e.target.value);
                setCurrentPage(1); // Reset to first page when zone changes
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors cursor-pointer"
            >
              <option value="all">All Zones</option>
              {availableZones.filter(z => z !== 'all').map(zone => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>

            {/* Refresh Data Button */}
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>

            {/* Export CM Briefing */}
            <ExportBriefingButton 
              currentAQI={avgAQI} 
              criticalWards={allWards.slice(0, 10)} 
              actionsTakenCount={actionsCount}
            />
          </div>
        </div>
      </div>

      {/* KEY METRICS CARDS (4-column grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        
        {/* Card 1: Total Wards Monitored */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">WARDS MONITORED</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{wardsMonitored}</h3>
            </div>
            <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center 
                            justify-center border border-blue-100">
              <Map className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-xs">100% Coverage</span>
            <span className="text-gray-400 ml-2 text-xs">Active</span>
          </div>
        </div>
        
        {/* Card 2: Critical Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">CRITICAL ALERTS</p>
              <h3 className="text-3xl font-bold text-red-600 mt-1">{criticalAlerts}</h3>
            </div>
            <div className="h-10 w-10 bg-red-50 rounded-lg flex items-center 
                            justify-center border border-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <div className="flex items-center text-sm">
             <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded text-xs flex items-center gap-1">
               AQI ≥ 300
             </span>
             <span className="text-gray-400 ml-2 text-xs">threshold</span>
          </div>
        </div>
        
        {/* Card 3: Average AQI Today */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">AVG AQI TODAY</p>
              <h3 className={`text-3xl font-bold mt-1 ${
                avgAQI >= 400 ? 'text-red-700' : 
                avgAQI >= 300 ? 'text-purple-700' : 
                avgAQI >= 200 ? 'text-orange-600' : 'text-yellow-600'
              }`}>{avgAQI}</h3>
            </div>
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${
              avgAQI >= 400 ? 'bg-red-50 border-red-100' : 
              avgAQI >= 300 ? 'bg-purple-50 border-purple-100' : 
              avgAQI >= 200 ? 'bg-orange-50 border-orange-100' : 'bg-yellow-50 border-yellow-100'
            }`}>
              <TrendingUp className={`h-5 w-5 ${
                avgAQI >= 400 ? 'text-red-700' : 
                avgAQI >= 300 ? 'text-purple-700' : 
                avgAQI >= 200 ? 'text-orange-600' : 'text-yellow-600'
              }`} />
            </div>
          </div>
          <div className="flex items-center text-sm">
             <span className={`font-bold px-2 py-0.5 rounded text-xs ${
               avgAQI >= 400 ? 'bg-red-50 text-red-700' : 
               avgAQI >= 300 ? 'bg-purple-50 text-purple-700' : 
               avgAQI >= 200 ? 'bg-orange-50 text-orange-700' : 'bg-yellow-50 text-yellow-700'
             }`}>{deriveAQIStatusFromValue(avgAQI)}</span>
             <span className="text-gray-400 ml-2 text-xs">Category</span>
          </div>
        </div>
        
        {/* Card 4: Actions (24H) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">ACTIONS (24H)</p>
              <h3 className="text-3xl font-bold text-green-600 mt-1">{actionsCount}</h3>
            </div>
            <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center 
                            justify-center border border-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="flex items-center text-sm">
             <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-xs">Wards with Actions</span>
          </div>
        </div>
        
      </div>

      {/* LIVE ALERTS TICKER (Horizontal scrolling) */}
      <div className="bg-white rounded-lg border border-red-100 shadow-sm overflow-hidden relative h-14 flex items-center mb-6">
        {/* Static Label */}
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center bg-white px-4 border-r border-red-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 text-red-600">
                <Bell className="h-4 w-4 animate-pulse fill-red-600" />
                <span className="font-bold text-sm tracking-tight whitespace-nowrap">Live Alerts</span>
            </div>
        </div>

        {/* Scrolling Content */}
        <div className="flex-1 overflow-hidden ml-32 mask-linear-gradient">
           <div className="animate-marquee flex items-center gap-8">
               {/* Duplicating alerts 3 times to create a long seamless loop */}
               {[...MOCK_ALERTS, ...MOCK_ALERTS, ...MOCK_ALERTS].map((alert, index) => (
                   <div key={`${alert.id}-${index}`} className="flex items-center gap-3 shrink-0">
                       <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border
                           ${alert.type === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                             alert.type === 'Warning' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                             'bg-blue-50 text-blue-700 border-blue-200'
                           }`}>
                           {alert.type}
                       </span>
                       <span className="text-sm text-gray-700 font-medium whitespace-nowrap">
                           {alert.message}
                       </span>
                       <span className="text-gray-300">|</span>
                   </div>
               ))}
           </div>
        </div>
      </div>
      
      {/* GRAP COMPLIANCE WIDGET - Mission Critical */}
      <GRAPComplianceWidget currentAQI={avgAQI} />

      {/* PRIORITY WARDS TABLE (Main content) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
        
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Priority Wards Needing Action
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Ranked by combined urgency score (AQI + Population Density + Trend)
            </p>
          </div>
          
          <div className="flex items-center gap-3 relative">
            <button
              className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-white text-xs text-gray-700 font-medium transition-colors bg-white"
              onClick={() => setShowExportOptions((open) => !open)}
            >
              Export CSV
            </button>
            <button className="px-3 py-1.5 bg-gray-900 text-white rounded-md 
                               hover:bg-gray-800 text-xs font-medium shadow-sm transition-colors">
              Bulk Actions
            </button>

            {showExportOptions && (
              <div className="absolute right-0 top-9 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-30">
                <button
                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                  onClick={() => handleExportCSV('district')}
                >
                  Download district-wise CSV
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 border-t border-gray-100"
                  onClick={() => handleExportCSV('all')}
                >
                  Download complete wards CSV
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Ward Details
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Live AQI
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  24h Trend
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Primary Source
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Protocol
                </th>
                <th className="px-6 py-3 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              
              {pageWards.map((ward) => (
                <tr key={ward.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white
                      ${ward.urgency === 'critical' ? 'bg-red-600 shadow-red-200 shadow-sm' : 
                        ward.urgency === 'high' ? 'bg-orange-500' : 'bg-yellow-500'}`}>
                      {ward.priority}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-bold text-sm text-gray-900 group-hover:text-blue-700 transition-colors">{ward.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{ward.zone} • {ward.population}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-baseline gap-1">
                          <span className={`text-lg font-bold 
                            ${ward.currentAQI === null ? 'text-gray-400' :
                              ward.aqiStatus === 'Severe' ? 'text-red-700' : 
                              ward.aqiStatus === 'Very Poor' ? 'text-purple-700' : 
                              ward.aqiStatus === 'Poor' ? 'text-orange-600' : 'text-yellow-600'}`}>
                            {ward.currentAQI === null ? '—' : ward.currentAQI}
                          </span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded
                        ${ward.currentAQI === null ? 'bg-gray-100 text-gray-500' :
                          ward.aqiStatus === 'Severe' ? 'bg-red-100 text-red-800' : 
                          ward.aqiStatus === 'Very Poor' ? 'bg-purple-100 text-purple-800' : 
                          ward.aqiStatus === 'Poor' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {ward.aqiStatus}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center gap-1 font-bold text-sm ${
                      ward.trendValue > 0
                        ? 'text-red-600'
                        : ward.trendValue < 0
                        ? 'text-green-600'
                        : 'text-gray-500'
                    }`}>
                      {ward.trendValue > 0 && <ArrowUp className="h-4 w-4" />}
                      {ward.trendValue < 0 && <ArrowDown className="h-4 w-4" />}
                      <span>{ward.trendValue === 0 ? '0' : Math.abs(ward.trendValue)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-gray-700">
                        {ward.primarySource || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {ward.actions.map((action, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 shrink-0"></div>
                          <p className="text-xs text-gray-600 leading-tight">
                            {action}
                          </p>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-all shadow-sm
                       ${ward.urgency === 'critical' ? 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-100' : 
                         ward.urgency === 'high' ? 'bg-white hover:bg-orange-50 text-orange-700 border border-orange-200' : 
                         'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200'}`}
                      onClick={ward.urgency === 'critical' ? undefined : () => setSelectedRow(ward)}
                    >
                      {ward.urgency === 'critical' ? 'Deploy Response' : 'View Options'}
                    </button>
                  </td>
                </tr>
              ))}
              
            </tbody>
          </table>
        </div>
        
        {/* Table Footer */}
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50/50">
          <p className="text-xs text-gray-500 font-medium">
            {(() => {
              const start = (currentPage - 1) * PAGE_SIZE + 1;
              const end = Math.min(currentPage * PAGE_SIZE, allWards.length);
              return `Showing ${start}-${end} of ${allWards.length} prioritized wards`;
            })()}
          </p>
          <div className="flex items-center gap-1">
            <button
              className="p-1 border border-gray-300 rounded hover:bg-white disabled:opacity-50 text-gray-500"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </button>

            {[1, 2].map((page) => (
              <button
                key={page}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  currentPage === page
                    ? 'bg-blue-600 text-white font-bold'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}

            <span className="text-gray-400 text-xs px-1">...</span>

            <button
              className="p-1 border border-gray-300 rounded hover:bg-white text-gray-500 disabled:opacity-50"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        
      </div>

      {/* Ward Details Modal */}
      {selectedRow && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ward Details</p>
                <p className="text-sm font-semibold text-gray-900">{selectedRow.name}</p>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="p-2 bg-white rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm text-gray-800">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1">Ward ID</p>
                  <p className="font-semibold text-gray-900">{selectedRow.wardId}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1">Live AQI</p>
                  <p className="font-semibold text-gray-900">{selectedRow.currentAQI ?? '—'}</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1">Primary Source</p>
                <p className="font-semibold text-gray-900">{selectedRow.primarySource || '—'}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1">Nearest Station</p>
                <p className="font-semibold text-gray-900">
                  {selectedRow.nearestStation}
                  {selectedRow.nearestStationKm > 0 && (
                    <span className="text-gray-500 font-normal"> ({selectedRow.nearestStationKm}km)</span>
                  )}
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1">Recommended Actions</p>
                <div className="mt-1 space-y-1">
                  {selectedRow.actions.map((action, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 shrink-0" />
                      <p className="text-xs text-gray-700 leading-tight">{action}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Last updated: {selectedRow.updatedUtc ? new Date(selectedRow.updatedUtc).toLocaleString() : '—'}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedRow(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-white hover:shadow-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
