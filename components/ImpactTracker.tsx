import React, { useState, useMemo } from 'react';
import { 
  CheckCircle, 
  TrendingDown, 
  Target, 
  IndianRupee, 
  Download, 
  Filter,
  Droplets,
  Car,
  Hammer,
  Clock,
  AlertCircle,
  ArrowDown,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Cell
} from 'recharts';

// Time filter types
type TimeFilter = 'today' | 'week' | 'month';

// Base mock data for 'today'
const BASE_EFFECTIVENESS_DATA = [
  { action: 'Sprinklers', impact: 27, color: '#3b82f6' },
  { action: 'Traffic Control', impact: 22, color: '#f59e0b' },
  { action: 'Const. Ban', impact: 12, color: '#ef4444' },
  { action: 'Smog Guns', impact: 35, color: '#8b5cf6' },
  { action: 'Road Sweeping', impact: 8, color: '#10b981' },
];

const BASE_COST_EFFICIENCY_DATA = [
  { action: 'Sprinklers', costPerPoint: 1667 },
  { action: 'Traffic Control', costPerPoint: 2273 },
  { action: 'Const. Ban', costPerPoint: 4500 },
  { action: 'Smog Guns', costPerPoint: 1200 },
  { action: 'Road Sweeping', costPerPoint: 800 },
];

// Mock intervention log data
const INTERVENTION_LOG = [
  {
    date: 'Jan 3, 2026 10:30 AM',
    ward: 'Rohini',
    region: 'North Delhi',
    action: 'Water Sprinklers',
    cost: 45000,
    aqiReduction: 27,
    roiStatus: 'Effective'
  },
  {
    date: 'Jan 4, 2026 8:15 AM',
    ward: 'Dwarka',
    region: 'West Delhi',
    action: 'Traffic Control',
    cost: 18000,
    aqiReduction: 22,
    roiStatus: 'Effective'
  },
  {
    date: 'Jan 2, 2026 2:00 PM',
    ward: 'Najafgarh',
    region: 'SW Delhi',
    action: 'Construction Ban',
    cost: 12000,
    aqiReduction: 7,
    roiStatus: 'Limited Effect'
  },
];

// Helper: Adjust data based on time filter
const adjustDataForTimeFilter = (baseValue: number, filter: TimeFilter): number => {
  if (filter === 'week') return Math.round(baseValue * 7.2);
  if (filter === 'month') return Math.round(baseValue * 30.5);
  return baseValue;
};

// Helper: Format currency in Indian locale
const formatCurrency = (amount: number): string => {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
  return formatted.replace(/\u00A0/g, ' ');
};

// Helper: Export to CSV
const exportToCSV = (data: typeof INTERVENTION_LOG) => {
  const headers = ['Date', 'Ward', 'Action', 'Cost', 'AQI_Reduction', 'ROI_Status'];
  const rows = data.map(row => [
    row.date,
    row.ward,
    row.action,
    row.cost,
    row.aqiReduction,
    row.roiStatus
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().split('T')[0];
  
  link.setAttribute('href', url);
  link.setAttribute('download', `Impact_Report_${date}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Custom tooltip for cost efficiency chart
const CustomCostTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isHighCost = data.costPerPoint > 2000;
    
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900 text-sm mb-1">{data.action}</p>
        <p className="text-sm text-gray-600 mb-2">{formatCurrency(data.costPerPoint)} per AQI point</p>
        {isHighCost && (
          <div className="bg-orange-50 border border-orange-200 rounded p-2 mt-2">
            <p className="text-xs text-orange-700 font-medium flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              High cost relative to impact
            </p>
            <p className="text-xs text-orange-600 mt-1">Consider alternative actions</p>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const ImpactTracker: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [showExportToast, setShowExportToast] = useState(false);

  // Calculate filtered metrics based on time filter
  const filteredMetrics = useMemo(() => {
    const actionsTaken = adjustDataForTimeFilter(127, timeFilter);
    const totalSpent = adjustDataForTimeFilter(240000, timeFilter);
    const avgReduction = 27; // AQI reduction stays constant per intervention
    const successRate = 87;
    const costPerPoint = Math.round(totalSpent / (actionsTaken * avgReduction));
    
    return {
      actionsTaken,
      totalSpent,
      avgReduction,
      successRate,
      costPerPoint,
      weeklyIncrease: timeFilter === 'today' ? 23 : timeFilter === 'week' ? 164 : 702
    };
  }, [timeFilter]);
  
  // Calculate chart data based on time filter
  const effectivenessData = useMemo(() => {
    return BASE_EFFECTIVENESS_DATA.map(item => ({
      ...item,
      // Impact per intervention stays the same
      impact: item.impact
    }));
  }, [timeFilter]);
  
  const costEfficiencyData = useMemo(() => {
    return BASE_COST_EFFICIENCY_DATA.map(item => ({
      ...item,
      costPerPoint: item.costPerPoint
    }));
  }, [timeFilter]);
  
  // Handle export
  const handleExport = () => {
    setShowExportToast(true);
    exportToCSV(INTERVENTION_LOG);
    setTimeout(() => setShowExportToast(false), 3000);
  };
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Export Toast Notification */}
      {showExportToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <Download className="h-5 w-5" />
          <span className="font-medium">Downloading Report...</span>
        </div>
      )}
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-serif-heading">Impact Tracker</h1>
          <p className="text-gray-600 mt-1">
            Measure effectiveness of pollution control interventions & ROI
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-1 flex shadow-sm">
            {[{label: 'Today', value: 'today'}, {label: 'This Week', value: 'week'}, {label: 'This Month', value: 'month'}].map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeFilter(range.value as TimeFilter)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  timeFilter === range.value
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          
          <button 
            onClick={handleExport}
            className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">ACTIONS TAKEN</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">
                {filteredMetrics.actionsTaken.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-xs">
              +{filteredMetrics.weeklyIncrease} this week
            </span>
            <span className="text-gray-400 ml-2 text-xs">Target: 150</span>
          </div>
        </div>
        
        {/* Avg Reduction */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">AVG AQI REDUCTION</p>
              <h3 className="text-3xl font-bold text-green-600 mt-1">-{filteredMetrics.avgReduction}</h3>
            </div>
            <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
              <TrendingDown className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-gray-500 text-xs">Points per intervention</span>
          </div>
        </div>
        
        {/* Success Rate */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">SUCCESS RATE</p>
              <h3 className="text-3xl font-bold text-blue-600 mt-1">{filteredMetrics.successRate}%</h3>
            </div>
            <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded text-xs">↑ 5%</span>
            <span className="text-gray-400 ml-2 text-xs">vs last week</span>
          </div>
        </div>
        
        {/* Total Cost */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">TOTAL SPENT</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">
                {formatCurrency(filteredMetrics.totalSpent)}
              </h3>
            </div>
            <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
              <IndianRupee className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-gray-500 text-xs">
              {formatCurrency(filteredMetrics.costPerPoint)} per AQI point
            </span>
          </div>
        </div>
      </div>

      {/* ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Effectiveness Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Effectiveness by Action Type</h3>
              <p className="text-xs text-gray-500">Average AQI reduction per intervention type</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={effectivenessData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" hide />
                <YAxis dataKey="action" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                />
                <Bar dataKey="impact" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} label={{ position: 'right', fill: '#6b7280', fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Efficiency Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Cost Efficiency</h3>
              <p className="text-xs text-gray-500">Cost (₹) per 1 AQI point reduction</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costEfficiencyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="action" tick={{fontSize: 11}} interval={0} />
                <YAxis tickFormatter={(val) => `₹${val}`} tick={{fontSize: 12}} />
                <Tooltip content={<CustomCostTooltip />} />
                <Bar dataKey="costPerPoint" radius={[4, 4, 0, 0]} barSize={40}>
                  {costEfficiencyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.costPerPoint > 2000 ? '#f97316' : '#10b981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ACTIONS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Intervention Log
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Detailed record of all actions and their 24h impact assessment
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <select className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option>All Actions</option>
                <option>Sprinklers</option>
                <option>Traffic Control</option>
                <option>Construction Ban</option>
              </select>
            </div>
            <div className="relative">
              <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option>All Wards</option>
                <option>Rohini</option>
                <option>Dwarka</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Ward</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Action Type</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">AQI Before</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">AQI After (24H)</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Impact</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              
              {/* Row 1 - Effective */}
              <tr className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Jan 3, 10:30 AM
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Rohini</p>
                    <p className="text-[11px] text-gray-500">North Delhi</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-md">
                      <Droplets className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Water Sprinklers</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-1 rounded">412</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">385</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="flex items-center gap-1 text-green-600 font-bold">
                      <ArrowDown className="h-4 w-4" />
                      <span>27</span>
                    </div>
                    <p className="text-[10px] text-gray-500">6.5% reduction</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">₹45,000</p>
                    <p className="text-[10px] text-gray-500">₹1,667/point</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit">
                    <CheckCircle className="h-3 w-3" />
                    Effective
                  </span>
                </td>
              </tr>
              
              {/* Row 2 - In Progress */}
              <tr className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Jan 4, 8:15 AM
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Dwarka</p>
                    <p className="text-[11px] text-gray-500">West Delhi</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-100 rounded-md">
                      <Car className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Traffic Control</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">327</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-400 italic">Pending...</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <span className="text-xs text-gray-400">Measuring...</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm font-semibold text-gray-900">₹18,000</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit">
                    <Clock className="h-3 w-3" />
                    In Progress
                  </span>
                </td>
              </tr>
              
              {/* Row 3 - Limited Effect */}
              <tr className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Jan 2, 2:00 PM
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Najafgarh</p>
                    <p className="text-[11px] text-gray-500">SW Delhi</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-100 rounded-md">
                      <Hammer className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Construction Ban</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-1 rounded">315</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-1 rounded">308</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="flex items-center gap-1 text-yellow-600 font-bold">
                      <ArrowDown className="h-4 w-4" />
                      <span>7</span>
                    </div>
                    <p className="text-[10px] text-gray-500">2.2% reduction</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">₹12,000</p>
                    <p className="text-[10px] text-gray-500">₹1,714/point</p>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit border border-yellow-200">
                    <AlertCircle className="h-3 w-3" />
                    Limited Effect
                  </span>
                </td>
              </tr>
              
            </tbody>
          </table>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/50">
            <p className="text-xs text-gray-500">Showing 1-3 of 127 actions</p>
            <div className="flex gap-2">
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-white text-xs font-medium bg-white disabled:opacity-50 text-gray-600">Previous</button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold shadow-sm">1</button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-white text-xs font-medium bg-white text-gray-600">2</button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-white text-xs font-medium bg-white text-gray-600">3</button>
              <button className="px-3 py-1 border border-gray-300 rounded hover:bg-white text-xs font-medium bg-white text-gray-600">Next</button>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default ImpactTracker;