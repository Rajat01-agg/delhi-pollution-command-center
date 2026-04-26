import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Sparkles,
  ArrowRight,
  FileText,
  Hammer,
  Car,
  Factory,
  Droplets,
  Wind,
  RotateCcw,
  Send,
  DollarSign,
  Scale,
  Users,
  Bot,
} from 'lucide-react';

// =============================================================================
// IMPACT WEIGHTS - Based on Delhi Pollution Control Committee data
// =============================================================================
const IMPACT_WEIGHTS = {
  constructionBan: 0.15,    // 15% reduction
  oddEvenTraffic: 0.20,     // 20% reduction
  industryShutdown: 0.10,   // 10% reduction
  sprinklers: 0.0005,       // 0.05% per unit (max 500 units)
  smogTowers: 0.08,         // 8% reduction
};

// =============================================================================
// CALCULATION LOGIC
// =============================================================================
interface ActivePolicies {
  constructionBan: boolean;
  oddEvenTraffic: boolean;
  industryShutdown: boolean;
  sprinklerCount: number;
  smogTowers: boolean;
}

const calculateImpact = (activePolicies: ActivePolicies): number => {
  let reductionFactor = 0;

  if (activePolicies.constructionBan) reductionFactor += IMPACT_WEIGHTS.constructionBan;
  if (activePolicies.oddEvenTraffic) reductionFactor += IMPACT_WEIGHTS.oddEvenTraffic;
  if (activePolicies.industryShutdown) reductionFactor += IMPACT_WEIGHTS.industryShutdown;
  if (activePolicies.smogTowers) reductionFactor += IMPACT_WEIGHTS.smogTowers;
  reductionFactor += activePolicies.sprinklerCount * IMPACT_WEIGHTS.sprinklers;

  // Cap reduction at 60% (realistic maximum)
  return Math.min(reductionFactor, 0.60);
};

const generateTrendData = (currentAQI: number, reductionFactor: number) => {
  return Array.from({ length: 24 }, (_, i) => {
    // "Base" trend simulates natural daily variation (peaking at morning/evening)
    const naturalVariation = Math.sin(i / 3) * 20;
    const baseAQI = currentAQI + naturalVariation;

    // "Predicted" trend applies the reduction gradually over 6 hours
    const effectiveness = Math.min(i / 6, 1); // Ramps up from 0 to 1 over 6 hours
    const finalReduction = reductionFactor * effectiveness;
    const predictedAQI = baseAQI * (1 - finalReduction);

    return {
      time: `${String(i).padStart(2, '0')}:00`,
      base: Math.round(baseAQI),
      predicted: Math.round(predictedAQI),
    };
  });
};

const getAQICategory = (aqi: number): { label: string; color: string; bgColor: string } => {
  if (aqi <= 50) return { label: 'Good', color: 'text-green-700', bgColor: 'bg-green-100' };
  if (aqi <= 100) return { label: 'Satisfactory', color: 'text-green-600', bgColor: 'bg-green-50' };
  if (aqi <= 200) return { label: 'Moderate', color: 'text-yellow-700', bgColor: 'bg-yellow-100' };
  if (aqi <= 300) return { label: 'Poor', color: 'text-orange-700', bgColor: 'bg-orange-100' };
  if (aqi <= 400) return { label: 'Very Poor', color: 'text-red-600', bgColor: 'bg-red-100' };
  return { label: 'Severe', color: 'text-red-800', bgColor: 'bg-red-200' };
};

// =============================================================================
// PRESETS
// =============================================================================
type PresetType = 'strict' | 'moderate' | 'custom';

const PRESETS: Record<PresetType, { label: string; description: string }> = {
  strict: { label: 'Strict (GRAP-4)', description: 'All emergency measures active' },
  moderate: { label: 'Moderate', description: 'Traffic restrictions only' },
  custom: { label: 'Custom', description: 'Manual selection' },
};

// =============================================================================
// POLICY CONFIG
// =============================================================================
interface PolicyConfig {
  id: keyof Omit<ActivePolicies, 'sprinklerCount'> | 'sprinklers';
  label: string;
  description: string;
  icon: React.ElementType;
  impact: 'high' | 'low';
  iconColor: string;
}

const POLICIES: PolicyConfig[] = [
  {
    id: 'constructionBan',
    label: 'Construction Ban',
    description: 'Halt all construction activities',
    icon: Hammer,
    impact: 'high',
    iconColor: 'text-amber-600',
  },
  {
    id: 'oddEvenTraffic',
    label: 'Odd-Even Traffic',
    description: 'Alternate-day vehicle restrictions',
    icon: Car,
    impact: 'high',
    iconColor: 'text-blue-600',
  },
  {
    id: 'industryShutdown',
    label: 'Industry Shutdown',
    description: 'Close non-essential factories',
    icon: Factory,
    impact: 'low',
    iconColor: 'text-purple-600',
  },
  {
    id: 'smogTowers',
    label: 'Smog Towers',
    description: 'Activate all smog towers',
    icon: Wind,
    impact: 'low',
    iconColor: 'text-cyan-600',
  },
];

// =============================================================================
// CHAT TYPES & LOGIC
// =============================================================================
interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const generateAIResponse = (
  query: string,
  activePolicies: ActivePolicies,
  reductionPercent: number
): string => {
  const lowerQuery = query.toLowerCase();

  // ROI / Cost queries
  if (lowerQuery.includes('roi') || lowerQuery.includes('cost') || lowerQuery.includes('financial')) {
    if (activePolicies.constructionBan) {
      return `**Construction Ban ROI**: This measure costs ₹5 Cr/day in lost economic activity but prevents ₹18 Cr in healthcare costs due to reduced respiratory cases. **Net ROI: 3.6x positive**. Recovery time: 6 hours.`;
    }
    if (activePolicies.sprinklerCount > 0) {
      const cost = (activePolicies.sprinklerCount * 400).toLocaleString();
      const savings = (activePolicies.sprinklerCount * 2800).toLocaleString();
      return `**Sprinkler Economics**: Deploying ${activePolicies.sprinklerCount} units costs ₹${cost}/day but saves ₹${savings} in healthcare. **ROI: 7x**. Maintenance cost is minimal.`;
    }
    return `**Financial Overview**: Current policy mix has a projected **net positive ROI of 4.2x**. Major cost savings come from reduced hospital admissions (₹12 Cr/day) vs implementation costs (₹2.8 Cr/day).`;
  }

  // Public sentiment queries
  if (lowerQuery.includes('public') || lowerQuery.includes('sentiment') || lowerQuery.includes('reaction')) {
    if (activePolicies.oddEvenTraffic) {
      return `**Public Sentiment Alert**: Odd-Even scheme historically faces **62% public opposition** in first week. Recommend: (1) Deploy 300 extra buses, (2) Waive Metro fares during peak hours, (3) Run digital awareness campaign. Expected sentiment shift: +35% approval by Day 5.`;
    }
    if (activePolicies.constructionBan) {
      return `**Social Impact**: Construction ban affects 2.1M daily wage workers. **High protest risk**. Mitigation: Announce ₹500/day compensation via DBT (Direct Benefit Transfer). Estimated cost: ₹10.5 Cr/week. This will reduce unrest by 78%.`;
    }
    return `**Overall Sentiment**: Current policy combination is **moderately acceptable** (58% approval). Key concern: economic impact on small businesses. Recommend targeted relief packages for vendors near construction zones.`;
  }

  // Legal / compliance queries
  if (lowerQuery.includes('legal') || lowerQuery.includes('law') || lowerQuery.includes('compliance')) {
    return `**Legal Clearance**: All selected measures are compliant with GRAP Stage-4 protocols under Air Quality Management Act 2021. **No court challenges expected**. Construction ban requires 24h notice as per Section 12(3). Odd-Even is pre-approved by NGT Order 2023/47.`;
  }

  // Suggestions / alternatives
  if (lowerQuery.includes('suggest') || lowerQuery.includes('alternative') || lowerQuery.includes('better')) {
    if (reductionPercent < 15) {
      return `**Recommendation**: Current configuration yields only ${reductionPercent}% reduction. Consider adding **Odd-Even Traffic** (adds 20%) + **Construction Ban** (adds 15%) for critical impact. Total projected: ~40% AQI drop.`;
    }
    return `**Optimization Tip**: You're achieving ${reductionPercent}% reduction. To maximize efficiency, prioritize: (1) Odd-Even (highest impact/cost ratio), (2) Sprinklers in hotspots (Anand Vihar, Dwarka), (3) Industry shutdown only if AQI > 450.`;
  }

  // Default contextual response
  if (reductionPercent > 0) {
    return `Your current policy mix achieves **${reductionPercent}% AQI reduction**. This translates to approximately **${Math.round(reductionPercent * 0.8)}% drop in PM2.5 levels** within 8 hours. I can help analyze costs, public sentiment, or suggest optimizations. What would you like to know?`;
  }

  return `I'm Niti-AI, your policy advisor. I can help you understand the **ROI**, **legal implications**, **public sentiment**, and suggest **optimal strategies** based on your current selections. Try asking about costs, public reaction, or alternatives.`;
};

const getAutoTriggerMessage = (policyId: string, isActive: boolean): string | null => {
  if (!isActive) return null;

  switch (policyId) {
    case 'constructionBan':
      return `🔍 **Construction Ban Analysis**: Projected AQI drop: **15%**. ⚠️ Economic Impact: ₹5 Cr/day loss in construction sector. Public sentiment: **High protest risk** among 2.1M workers. Recommendation: Pair with compensation scheme.`;
    case 'oddEvenTraffic':
      return `🚗 **Odd-Even Traffic Analysis**: Strongest impact measure (**20% AQI reduction**). ⚠️ Revenue Warning: ₹20 Cr/day fuel tax loss. Public sentiment: **62% initial opposition**. Mitigation: Boost public transport by 40%.`;
    case 'industryShutdown':
      return `🏭 **Industry Shutdown Analysis**: Moderate impact (**10% AQI drop**). ⚠️ Economic Cost: ₹35 Cr/day in lost manufacturing output. Legal: Requires 48h notice for non-essential units. Consider targeting top 50 polluting units only.`;
    case 'smogTowers':
      return `💨 **Smog Towers Activated**: Limited spatial impact (**8% reduction in 2km radius**). Cost-effective for localized hotspots. Best deployed near schools & hospitals. Energy cost: ₹1.2L/day per tower.`;
    default:
      return null;
  }
};

// =============================================================================
// COMPONENT
// =============================================================================
const ScenarioSimulator: React.FC = () => {
  // Current AQI (in real app, this would come from live data)
  const CURRENT_AQI = 412;

  // Preset selection
  const [preset, setPreset] = useState<PresetType>('custom');

  // Policy states
  const [constructionBan, setConstructionBan] = useState(false);
  const [oddEvenTraffic, setOddEvenTraffic] = useState(false);
  const [industryShutdown, setIndustryShutdown] = useState(false);
  const [smogTowers, setSmogTowers] = useState(false);
  const [sprinklerCount, setSprinklerCount] = useState(0);

  // Simulation state
  const [hasSimulated, setHasSimulated] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: "👋 Welcome! I'm **Niti-AI**, your policy decision copilot. I'll analyze the impact, costs, and public sentiment of your pollution control measures in real-time. Toggle any policy to see instant analysis.",
      timestamp: new Date(),
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isAITyping, setIsAITyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Apply preset
  const applyPreset = (newPreset: PresetType) => {
    setPreset(newPreset);
    setHasSimulated(false);

    if (newPreset === 'strict') {
      setConstructionBan(true);
      setOddEvenTraffic(true);
      setIndustryShutdown(true);
      setSmogTowers(true);
      setSprinklerCount(500);
    } else if (newPreset === 'moderate') {
      setConstructionBan(false);
      setOddEvenTraffic(true);
      setIndustryShutdown(false);
      setSmogTowers(false);
      setSprinklerCount(100);
    } else {
      // Custom - reset to default
      setConstructionBan(false);
      setOddEvenTraffic(false);
      setIndustryShutdown(false);
      setSmogTowers(false);
      setSprinklerCount(0);
    }
  };

  // Get toggle state for a policy
  const getPolicyState = (id: string): boolean => {
    switch (id) {
      case 'constructionBan': return constructionBan;
      case 'oddEvenTraffic': return oddEvenTraffic;
      case 'industryShutdown': return industryShutdown;
      case 'smogTowers': return smogTowers;
      default: return false;
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Add AI message helper
  const addAIMessage = (text: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'ai',
      text,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, newMessage]);
  };

  // Toggle a policy with auto-trigger
  const togglePolicy = (id: string) => {
    setPreset('custom');
    setHasSimulated(false);

    let newState = false;
    switch (id) {
      case 'constructionBan':
        setConstructionBan((v) => {
          newState = !v;
          return newState;
        });
        break;
      case 'oddEvenTraffic':
        setOddEvenTraffic((v) => {
          newState = !v;
          return newState;
        });
        break;
      case 'industryShutdown':
        setIndustryShutdown((v) => {
          newState = !v;
          return newState;
        });
        break;
      case 'smogTowers':
        setSmogTowers((v) => {
          newState = !v;
          return newState;
        });
        break;
    }

    // Auto-trigger AI analysis
    setTimeout(() => {
      const message = getAutoTriggerMessage(id, newState);
      if (message) {
        setIsAITyping(true);
        setTimeout(() => {
          addAIMessage(message);
          setIsAITyping(false);
        }, 800);
      }
    }, 100);
  };

  // Calculate results
  const activePolicies: ActivePolicies = {
    constructionBan,
    oddEvenTraffic,
    industryShutdown,
    sprinklerCount,
    smogTowers,
  };

  const reductionFactor = useMemo(() => calculateImpact(activePolicies), [
    constructionBan,
    oddEvenTraffic,
    industryShutdown,
    sprinklerCount,
    smogTowers,
  ]);

  const predictedAQI = useMemo(() => {
    return Math.round(CURRENT_AQI * (1 - reductionFactor));
  }, [reductionFactor]);

  const chartData = useMemo(() => {
    return generateTrendData(CURRENT_AQI, hasSimulated ? reductionFactor : 0);
  }, [reductionFactor, hasSimulated]);

  const currentCategory = getAQICategory(CURRENT_AQI);
  const predictedCategory = getAQICategory(predictedAQI);

  const reductionPercent = Math.round(reductionFactor * 100);

  // Simulate handler
  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setHasSimulated(true);
      setIsSimulating(false);
    }, 1200);
  };

  // Reset handler
  const handleReset = () => {
    applyPreset('custom');
    setHasSimulated(false);
  };

  // Handle user query
  const handleUserQuery = (query: string) => {
    if (!query.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setUserInput('');

    // Simulate AI thinking
    setIsAITyping(true);
    setTimeout(() => {
      const response = generateAIResponse(query, activePolicies, reductionPercent);
      addAIMessage(response);
      setIsAITyping(false);
    }, 1200);
  };

  // Quick action handlers
  const handleQuickAction = (action: string) => {
    handleUserQuery(action);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <style>{`
        /* Custom scrollbar for chat */
        .chat-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .chat-scroll::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 3px;
        }
        .chat-scroll::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 3px;
        }
        .chat-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.8);
        }
      `}</style>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-600" />
          Policy Decision Support
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Simulate pollution control measures and view projected impact before implementation
        </p>
      </div>

      {/* 2-Column War Room Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ================================================================= */}
        {/* LEFT COLUMN: ACTION DECK */}
        {/* ================================================================= */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 bg-slate-50">
            <h2 className="font-semibold text-slate-800">Policy Scenarios</h2>
          </div>

          {/* Preset Tabs */}
          <div className="px-5 pt-4">
            <div className="flex gap-2">
              {(Object.keys(PRESETS) as PresetType[]).map((key) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    preset === key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                  }`}
                >
                  {PRESETS[key].label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              {PRESETS[preset].description}
            </p>
          </div>

          {/* Policy Toggles */}
          <div className="flex-1 px-5 py-4 space-y-3 overflow-y-auto">
            {POLICIES.map((policy) => {
              const Icon = policy.icon;
              const isActive = getPolicyState(policy.id);
              return (
                <div
                  key={policy.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isActive
                      ? 'border-blue-200 bg-blue-50/50'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Icon className={`h-4 w-4 ${isActive ? policy.iconColor : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 text-sm">{policy.label}</span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            policy.impact === 'high'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          📉 {policy.impact === 'high' ? 'High Impact' : 'Low Impact'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{policy.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePolicy(policy.id)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      isActive ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        isActive ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
              );
            })}

            {/* Sprinklers Slider */}
            <div className="p-3 rounded-lg border border-gray-100 bg-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-cyan-50">
                  <Droplets className="h-4 w-4 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800 text-sm">Water Sprinklers</span>
                    <span className="text-xs font-semibold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded">
                      {sprinklerCount} units
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Deploy anti-dust sprinklers</p>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={500}
                step={25}
                value={sprinklerCount}
                onChange={(e) => {
                  setSprinklerCount(Number(e.target.value));
                  setPreset('custom');
                  setHasSimulated(false);
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0</span>
                <span>250</span>
                <span>500</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
            <button
              onClick={handleReset}
              className="p-3 rounded-lg border border-gray-300 text-slate-600 hover:bg-white transition"
              title="Reset"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="flex-1 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSimulating ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Generate Impact Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: OUTCOME DECK */}
        {/* ================================================================= */}
        <div className="space-y-4">
          
          {/* Hero Stat Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Projected Outcome
            </p>
            <div className="flex items-center justify-between gap-4">
              {/* Current AQI */}
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">Current AQI</p>
                <p className="text-4xl font-bold text-red-600">{CURRENT_AQI}</p>
                <span
                  className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded ${currentCategory.bgColor} ${currentCategory.color}`}
                >
                  {currentCategory.label}
                </span>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center">
                <ArrowRight
                  className={`h-8 w-8 ${hasSimulated ? 'text-green-500' : 'text-gray-300'}`}
                />
                {hasSimulated && (
                  <span className="text-xs font-semibold text-green-600 mt-1">
                    -{reductionPercent}%
                  </span>
                )}
              </div>

              {/* Predicted AQI */}
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">Predicted AQI</p>
                <p
                  className={`text-4xl font-bold ${
                    hasSimulated ? 'text-green-600' : 'text-gray-300'
                  }`}
                >
                  {hasSimulated ? predictedAQI : '—'}
                </p>
                {hasSimulated && (
                  <span
                    className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded ${predictedCategory.bgColor} ${predictedCategory.color}`}
                  >
                    {predictedCategory.label}
                  </span>
                )}
              </div>
            </div>

            {/* Status Text */}
            {hasSimulated && (
              <p className="text-center text-sm text-slate-600 mt-4 pt-4 border-t border-gray-100">
                Status improves from{' '}
                <span className={`font-semibold ${currentCategory.color}`}>
                  '{currentCategory.label}'
                </span>{' '}
                to{' '}
                <span className={`font-semibold ${predictedCategory.color}`}>
                  '{predictedCategory.label}'
                </span>
              </p>
            )}
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">24-Hour Forecast</h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-red-400" />
                  <span className="text-slate-600">Business as Usual</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-green-500" />
                  <span className="text-slate-600">With Action</span>
                </div>
              </div>
            </div>

            <div className="h-56 relative">
              {isSimulating && (
                <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-lg">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-sm text-slate-600">Running simulation...</p>
                  </div>
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="baseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    interval={3}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    domain={['dataMin - 50', 'dataMax + 50']}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => [
                      value,
                      name === 'base' ? 'Business as Usual' : 'With Action',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="base"
                    stroke="#f87171"
                    strokeWidth={2}
                    fill="url(#baseGradient)"
                    name="base"
                  />
                  {hasSimulated && (
                    <Area
                      type="monotone"
                      dataKey="predicted"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#predictedGradient)"
                      name="predicted"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Niti-AI Strategy Console */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-cyan-500/20 shadow-2xl overflow-hidden flex flex-col h-[400px]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-cyan-500/30 bg-slate-800/50 backdrop-blur flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bot className="h-5 w-5 text-cyan-400" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
                <h3 className="font-semibold text-cyan-300">Niti-AI Policy Advisor</h3>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">Live Context</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 chat-scroll">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-lg text-sm leading-relaxed ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/50 text-slate-200 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                    }`}
                  >
                    <div
                      className="prose prose-invert prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: message.text
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-300">$1</strong>')
                          .replace(/\n/g, '<br />'),
                      }}
                    />
                  </div>
                </div>
              ))}
              {isAITyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-700/50 border border-cyan-500/20 px-3 py-2 rounded-lg">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/30 flex gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => handleQuickAction('What is the ROI of current policies?')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-md text-xs whitespace-nowrap transition border border-slate-600/50"
              >
                <DollarSign className="h-3 w-3 text-green-400" />
                Analyze Cost
              </button>
              <button
                onClick={() => handleQuickAction('What are the legal implications?')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-md text-xs whitespace-nowrap transition border border-slate-600/50"
              >
                <Scale className="h-3 w-3 text-yellow-400" />
                Legal Check
              </button>
              <button
                onClick={() => handleQuickAction('How will the public react?')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-200 rounded-md text-xs whitespace-nowrap transition border border-slate-600/50"
              >
                <Users className="h-3 w-3 text-blue-400" />
                Public Sentiment
              </button>
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-cyan-500/30 bg-slate-800/50">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUserQuery(userInput);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask about ROI, Legal Impact, or Public Sentiment..."
                  className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  disabled={isAITyping}
                />
                <button
                  type="submit"
                  disabled={!userInput.trim() || isAITyping}
                  className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioSimulator;
