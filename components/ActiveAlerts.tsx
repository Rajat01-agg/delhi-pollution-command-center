import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Clock, 
  Search, 
  ChevronDown,
  Flame,
  CloudFog,
  Hammer,
  Truck,
  X,
  MapPin,
  Zap,
  FileText,
  User,
  CheckCircle2,
  Circle,
  PartyPopper,
  Car,
  Radio
} from 'lucide-react';
import { MOCK_ALERTS, COLORS } from '../constants';
import { Alert, AlertSeverity } from '../types';

// Firebase Realtime Database URL for citizen reports
const BRIDGE_API_URL = 'https://delhi-citizen-app-default-rtdb.firebaseio.com/latest_alert.json';

// Dynamic SOP mappings based on alert type
const SOP_MAP: Record<string, string[]> = {
  'Biomass Burning': [
    '1. Dispatch Fire Tender to the reported location.',
    '2. Issue Challan to violators under EPA regulations.',
    '3. Monitor Wind Speed and direction for smoke dispersal.',
    '4. Notify nearby residents via SMS alerts.',
    '5. Document incident with photographic evidence.',
  ],
  'Construction Dust': [
    '1. Halt Construction immediately at the site.',
    '2. Check Anti-Smog Gun deployment status.',
    '3. Verify site compliance with GRAP guidelines.',
    '4. Issue notice if dust suppression measures absent.',
    '5. Schedule follow-up inspection within 24 hours.',
  ],
  'Vehicle Pollution': [
    '1. Divert Traffic from the congested area.',
    '2. Check PUC enforcement status in the zone.',
    '3. Deploy traffic police for vehicle inspection.',
    '4. Identify and penalize visibly polluting vehicles.',
    '5. Monitor NO2 levels post-intervention.',
  ],
  // Default fallback SOP
  'default': [
    'Deploy immediate inspection team to verify incident source and extent.',
    'Issue immediate halt notice if construction or industrial violation is confirmed.',
    'Deploy mechanized road sweepers and water sprinklers if PM2.5 > 400.',
    'Alert local traffic police for potential diversion in affected sector.',
    'Notify residents via SMS and App alerts in 2km radius.',
  ],
};

// Helper to get SOPs based on alert type
const getSOPsForType = (type: string): string[] => {
  // Check for partial matches
  if (type.toLowerCase().includes('biomass') || type.toLowerCase().includes('burning') || type.toLowerCase().includes('fire')) {
    return SOP_MAP['Biomass Burning'];
  }
  if (type.toLowerCase().includes('construction') || type.toLowerCase().includes('dust')) {
    return SOP_MAP['Construction Dust'];
  }
  if (type.toLowerCase().includes('vehicle') || type.toLowerCase().includes('traffic')) {
    return SOP_MAP['Vehicle Pollution'];
  }
  return SOP_MAP['default'];
};

// Interface for bridge API response
interface BridgeReport {
  id: string | number;
  type: string;
  severity: string;
  description: string;
  location: string;
  timestamp: string;
  lat?: number;
  lng?: number;
}

// Convert bridge report to Alert format
const bridgeReportToAlert = (report: BridgeReport): Alert => {
  // Map severity to our AlertSeverity type
  const severityMap: Record<string, AlertSeverity> = {
    'severe': 'Critical',
    'critical': 'Critical',
    'high': 'High',
    'moderate': 'Medium',
    'medium': 'Medium',
    'low': 'Low',
  };
  
  const mappedSeverity = severityMap[report.severity?.toLowerCase()] || 'Medium';
  
  // Determine alert type for icon mapping
  const typeMap: Record<string, string> = {
    'biomass burning': 'Burning',
    'construction dust': 'Construction',
    'vehicle pollution': 'Traffic',
  };
  const alertType = typeMap[report.type?.toLowerCase()] || report.type || 'Other';
  
  return {
    id: `CIT-${report.id}`,
    severity: mappedSeverity,
    title: report.type || 'Citizen Report',
    location: report.location || 'Unknown Location',
    message: report.description || 'No description provided.',
    timestamp: report.timestamp || 'Just now',
    status: 'Open',
    type: alertType,
  };
};

type ResponseStatus = 'pending' | 'active' | 'resolved';

const ActiveAlerts: React.FC = () => {
  const [filter, setFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [responseStatus, setResponseStatus] = useState<ResponseStatus>('pending');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  
  // State for alerts - initialized with mock data
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  
  // Track last received alert ID to detect new ones
  const lastAlertIdRef = useRef<string | null>(null);
  
  // Audio ref for notification sound
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Dynamic SOP steps based on selected alert type
  const currentSOPs = selectedAlert ? getSOPsForType(selectedAlert.type) : SOP_MAP['default'];
  const [sopChecklist, setSopChecklist] = useState<boolean[]>(Array(5).fill(false));

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio('/assets/alert.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Fallback to browser alert if audio fails (e.g., no file or autoplay blocked)
        console.log('Audio playback failed, using visual notification only');
      });
    }
  }, []);

  // Toast trigger with sound
  const triggerAlertToast = useCallback((message: string) => {
    setToastMessage(message);
    playNotificationSound();
    setTimeout(() => {
      setToastMessage(prev => (prev === message ? null : prev));
    }, 5000);
  }, [playNotificationSound]);

  // Real-time Bridge Listener - polls Firebase every 2 seconds
  useEffect(() => {
    const fetchBridgeData = async () => {
      try {
        const response = await fetch(BRIDGE_API_URL);
        if (!response.ok) return;
        
        const data: BridgeReport & { isNew?: boolean } | null = await response.json();
        
        // Check if data exists and is marked as new
        if (!data || !data.id) return;
        
        const latestId = String(data.id);
        
        // Check if this is a new alert (isNew flag and different ID)
        if (data.isNew && lastAlertIdRef.current !== latestId) {
          // Update the last alert ID
          lastAlertIdRef.current = latestId;
          
          const newAlert = bridgeReportToAlert(data);
          
          // Prepend new alert to the list
          setAlerts(prevAlerts => {
            // Avoid duplicates
            if (prevAlerts.some(a => a.id === newAlert.id)) {
              return prevAlerts;
            }
            return [newAlert, ...prevAlerts];
          });
          
          // Show toast notification
          triggerAlertToast(`🚨 New Citizen Report: ${data.type} at ${data.location}`);
        } else if (!lastAlertIdRef.current) {
          // Initialize the ref on first load (without triggering notification)
          lastAlertIdRef.current = latestId;
        }
      } catch (error) {
        // Silently fail - don't interrupt the user experience
        console.debug('Firebase fetch failed:', error);
      }
    };

    // Initial fetch
    fetchBridgeData();
    
    // Poll every 2 seconds
    const intervalId = setInterval(fetchBridgeData, 2000);
    
    return () => clearInterval(intervalId);
  }, [triggerAlertToast]);

  // Reset workflow state whenever a new alert is opened
  useEffect(() => {
    if (selectedAlert) {
      setResponseStatus('pending');
      setSopChecklist(Array(currentSOPs.length).fill(false));
    }
  }, [selectedAlert, currentSOPs.length]);

  // Count summaries from live alerts state
  const activeCount = alerts.filter(a => a.status === 'Open').length;
  const criticalCount = alerts.filter(a => a.severity === 'Critical' && a.status === 'Open').length;
  const resolvedCount = alerts.filter(a => a.status === 'Resolved').length;

  const getSeverityStyles = (severity: AlertSeverity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-50 text-red-700 border-red-100';
      case 'High': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'Medium': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'Low': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getIcon = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('fire') || typeLower.includes('biomass') || typeLower.includes('burning')) {
      return <Flame className="h-5 w-5 text-red-500" />;
    }
    if (typeLower.includes('smog')) {
      return <CloudFog className="h-5 w-5 text-gray-500" />;
    }
    if (typeLower.includes('construction') || typeLower.includes('dust')) {
      return <Hammer className="h-5 w-5 text-yellow-600" />;
    }
    if (typeLower.includes('traffic') || typeLower.includes('vehicle')) {
      return <Car className="h-5 w-5 text-blue-500" />;
    }
    return <AlertTriangle className="h-5 w-5 text-gray-500" />;
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'All' || alert.severity === filter;
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          alert.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const completedSteps = sopChecklist.filter(Boolean).length;
  const progress = currentSOPs.length > 0 ? Math.round((completedSteps / currentSOPs.length) * 100) : 0;
  const canMarkResolved = responseStatus === 'active' && progress === 100;

  const triggerToast = useCallback((message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(prev => (prev === message ? null : prev));
    }, 4000);
  }, []);

  const handleToggleStep = (index: number) => {
    if (responseStatus !== 'active') return;
    setSopChecklist(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const handleInitiateResponse = () => {
    if (!selectedAlert || responseStatus !== 'pending') return;
    setResponseStatus('active');
    triggerToast(`🚀 Rapid Response Team-04 dispatched to ${selectedAlert.location}!`);
  };

  const handleMarkResolved = () => {
    if (!canMarkResolved) return;
    setResponseStatus('resolved');
    triggerToast('✅ Incident closed. Resolution report generated.');
  };

  const handleBroadcastActionPlan = () => {
    if (!selectedAlert || responseStatus !== 'active') return;

    // Generate the message dynamically
    const sopSteps = currentSOPs.map((step, i) => `${i + 1}. ${step.replace(/^\d+\.\s*/, '')}`);
    const sopText = sopSteps.slice(0, 3).join('\n'); // First 3 steps for brevity
    
    const message = `🚨 ACTION INITIATED: ${selectedAlert.title}
📍 Location: ${selectedAlert.location}

The Quick Response Team (QRT-04) has been mobilized.

Next Steps:
${sopText}

⏱️ Est. Resolution: 2 Hours
#DelhiFightsPollution #EmergencyResponse`;

    setBroadcastMessage(message);
    setShowBroadcastModal(true);
  };

  const handleBroadcastToTwitter = async () => {
    try {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(broadcastMessage)}`;
      window.open(twitterUrl, '_blank');

      // Post to Firebase
      await postToFirebase('twitter');
      
      setShowBroadcastModal(false);
      triggerToast('📢 Action Plan sent to Twitter!');
    } catch (error) {
      console.error('Twitter broadcast failed:', error);
      triggerToast('⚠️ Failed to open Twitter.');
    }
  };

  const handleBroadcastToWhatsApp = async () => {
    try {
      const whatsappMessage = broadcastMessage.replace(/\n/g, '%0A');
      const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappMessage}`;
      window.open(whatsappUrl, '_blank');

      // Post to Firebase
      await postToFirebase('whatsapp');
      
      setShowBroadcastModal(false);
      triggerToast('📢 Action Plan sent to WhatsApp!');
    } catch (error) {
      console.error('WhatsApp broadcast failed:', error);
      triggerToast('⚠️ Failed to open WhatsApp.');
    }
  };

  const handleBroadcastToBoth = async () => {
    try {
      // Open both platforms
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(broadcastMessage)}`;
      window.open(twitterUrl, '_blank');

      setTimeout(() => {
        const whatsappMessage = broadcastMessage.replace(/\n/g, '%0A');
        const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappMessage}`;
        window.open(whatsappUrl, '_blank');
      }, 500);

      // Post to Firebase
      await postToFirebase('both');
      
      setShowBroadcastModal(false);
      triggerToast('📢 Action Plan sent to Twitter & WhatsApp!');
    } catch (error) {
      console.error('Broadcast failed:', error);
      triggerToast('⚠️ Broadcast partially completed.');
    }
  };

  const postToFirebase = async (platform: string) => {
    if (!selectedAlert) return;
    
    const firebaseUrl = 'https://delhi-citizen-app-default-rtdb.firebaseio.com/social_media_posts.json';
    const postData = {
      platform: platform === 'both' ? 'gov_action' : `gov_action_${platform}`,
      message: broadcastMessage,
      alert_id: selectedAlert.id,
      location: selectedAlert.location,
      timestamp: new Date().toISOString(),
      type: selectedAlert.type,
    };

    await fetch(firebaseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[80] bg-white shadow-lg border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Zap className="h-4 w-4" />
          </span>
          <span>{toastMessage}</span>
        </div>
      )}
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-serif-heading">Active Alerts</h1>
          <p className="text-gray-600 mt-1">
            Real-time incident reporting and alert management
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Active Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 italic">Active Alerts</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{activeCount}</h3>
          </div>
          <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
        </div>

        {/* Resolved Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 italic">Resolved Alerts</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{resolvedCount}</h3>
          </div>
          <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 italic">Critical Alerts</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{criticalCount}</h3>
          </div>
          <div className="h-12 w-12 bg-orange-50 rounded-full flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-orange-500" />
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 italic">Avg Response Time</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">1h 45m</h3>
          </div>
          <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
            <Clock className="h-6 w-6 text-blue-500" />
          </div>
        </div>

      </div>

      {/* CONTROLS BAR */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {['All', 'Critical', 'High', 'Medium', 'Low'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap
                  ${filter === f 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Search & Sort */}
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <input 
                type="text"
                placeholder="Search by location, type, or incident ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium hover:bg-gray-50">
              Newest First <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
          </div>

        </div>
      </div>

      {/* ALERTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAlerts.map((alert) => (
          <div key={alert.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getSeverityStyles(alert.severity)}`}>
                {alert.severity}
              </span>
              <div className="text-right">
                <span className="text-xs font-medium text-gray-400 block">{alert.id}</span>
                <span className="text-xs font-medium text-gray-500">{alert.timestamp}</span>
              </div>
            </div>

            <div className="flex items-start gap-4 mb-4">
              <div className="mt-1 p-2 bg-gray-50 rounded-lg border border-gray-100">
                {getIcon(alert.type)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                  {alert.title} - {alert.location}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {alert.message}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setSelectedAlert(alert)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                View Details
              </button>
              <button className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors shadow-sm">
                Mark Resolved
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* ALERT DETAILS MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${getSeverityStyles(selectedAlert.severity)}`}>
                                {selectedAlert.severity}
                             </span>
                             <span className="text-sm text-gray-500 font-mono font-medium">{selectedAlert.id}</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">{selectedAlert.title}</h2>
                        <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-2">
                            <MapPin className="h-4 w-4 text-gray-400" /> {selectedAlert.location}
                        </p>
                    </div>
                    <button 
                        onClick={() => setSelectedAlert(null)} 
                        className="p-2 bg-white rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    
                    {/* Description */}
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Incident Description</h3>
                        <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 text-gray-800 leading-relaxed text-sm">
                            {selectedAlert.message}
                            <p className="mt-3 text-xs text-gray-500">
                                This alert was automatically generated by the Pollution Monitoring Grid based on real-time sensor data and satellite imagery analysis.
                            </p>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30">
                            <div className="flex items-center gap-2 mb-1">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <p className="text-xs font-bold text-gray-500 uppercase">Reported Time</p>
                            </div>
                            <p className="font-semibold text-gray-900 pl-6">{selectedAlert.timestamp}</p>
                        </div>
                         <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30">
                            <div className="flex items-center gap-2 mb-1">
                                <Zap className="h-4 w-4 text-gray-400" />
                                <p className="text-xs font-bold text-gray-500 uppercase">Current Status</p>
                            </div>
                            <p className="font-semibold text-gray-900 pl-6">{selectedAlert.status}</p>
                        </div>
                        <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30">
                            <div className="flex items-center gap-2 mb-1">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <p className="text-xs font-bold text-gray-500 uppercase">Source</p>
                            </div>
                            <p className="font-semibold text-gray-900 pl-6">IoT Sensor Network</p>
                        </div>
                        <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/30">
                            <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-gray-400" />
                                <p className="text-xs font-bold text-gray-500 uppercase">Assigned Unit</p>
                            </div>
                            <p className="font-semibold text-gray-900 pl-6">Rapid Response Team-04</p>
                        </div>
                    </div>

                    {/* SOP & Live Response Workflow */}
                    {responseStatus !== 'resolved' ? (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Standard Operating Procedure (SOP)</h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Progress</span>
                            <span className="font-semibold text-gray-800">{progress}%</span>
                          </div>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-100 mb-4 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="space-y-3">
                          {currentSOPs.map((step, i) => {
                            const checked = sopChecklist[i];
                            const isLocked = responseStatus === 'pending';
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleToggleStep(i)}
                                className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                                  checked
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-white border-gray-100 hover:border-blue-200'
                                } ${isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                disabled={isLocked}
                              >
                                <div className="mt-0.5">
                                  {checked ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-gray-300" />
                                  )}
                                </div>
                                <p
                                  className={`text-sm ${
                                    checked ? 'text-gray-500 line-through' : 'text-gray-700'
                                  }`}
                                >
                                  {step}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="relative overflow-hidden rounded-xl border border-green-100 bg-green-50/70 p-6 flex flex-col items-center text-center">
                        <style>{`
                          @keyframes confetti-fall {
                            0% { transform: translate3d(0,-100%,0) rotateZ(0deg); opacity: 0; }
                            10% { opacity: 1; }
                            100% { transform: translate3d(0,120%,0) rotateZ(360deg); opacity: 0; }
                          }
                          .confetti-piece {
                            position: absolute;
                            width: 6px;
                            height: 10px;
                            background: linear-gradient(to bottom, #22c55e, #0ea5e9);
                            border-radius: 2px;
                            animation: confetti-fall 1.4s ease-in-out infinite;
                          }
                        `}</style>
                        {[...Array(18)].map((_, idx) => (
                          <span
                            key={idx}
                            className="confetti-piece"
                            style={{
                              left: `${(idx * 100) / 18}%`,
                              animationDelay: `${(idx % 6) * 0.15}s`,
                            }}
                          />
                        ))}
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white shadow-lg">
                            <PartyPopper className="h-7 w-7" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">Incident Closed</h3>
                          <p className="text-sm text-gray-600 mb-4 max-w-md">
                            Response workflow completed. A summary has been generated for official records and
                            audit.
                          </p>
                          <div className="grid grid-cols-3 gap-3 w-full max-w-lg mb-4">
                            <div className="rounded-lg bg-white px-3 py-2 border border-gray-100">
                              <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Status</p>
                              <p className="text-sm font-bold text-green-700 flex items-center justify-center gap-1">
                                <CheckCircle2 className="h-4 w-4" />
                                Closed
                              </p>
                            </div>
                            <div className="rounded-lg bg-white px-3 py-2 border border-gray-100">
                              <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Time Taken</p>
                              <p className="text-sm font-bold text-gray-800">45 mins</p>
                            </div>
                            <div className="rounded-lg bg-white px-3 py-2 border border-gray-100">
                              <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">AQI Impact</p>
                              <p className="text-sm font-bold text-gray-800">-35 points</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            ID: {selectedAlert.id} • Rapid Response Team-04 • Verified by AI System
                          </p>
                        </div>
                      </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-5 border-t border-gray-100 bg-gray-50">
                    {/* Broadcast Action Plan Button - Only visible when response is active */}
                    {responseStatus === 'active' && (
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <button
                          onClick={handleBroadcastActionPlan}
                          className="w-full px-5 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                        >
                          <Radio className="h-5 w-5" />
                          📢 Broadcast Action Plan
                        </button>
                        <p className="text-xs text-gray-500 text-center mt-2 italic">
                          Publishes to Twitter, WhatsApp & Internal Dashboard
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-3 justify-end items-center">
                      <span className="text-xs text-gray-400 mr-auto italic">ID: {selectedAlert.id} • Verified by AI System</span>
                      <button 
                          onClick={() => {
                            setSelectedAlert(null);
                            setToastMessage(null);
                          }}
                          className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-white hover:shadow-sm transition-all text-sm"
                      >
                          Close
                      </button>
                      <button
                          onClick={handleMarkResolved}
                          disabled={!canMarkResolved}
                          className={`px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all ${
                            canMarkResolved
                              ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                      >
                          <CheckCircle2 className="h-4 w-4" />
                          Mark Resolved
                      </button>
                      <button
                          onClick={handleInitiateResponse}
                          disabled={responseStatus !== 'pending'}
                          className={`px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all ${
                            responseStatus === 'pending'
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                              : responseStatus === 'active'
                              ? 'bg-orange-500 text-white animate-pulse'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                      >
                          <Zap className="h-4 w-4" />
                          {responseStatus === 'pending'
                            ? 'Initiate Response'
                            : responseStatus === 'active'
                            ? 'Response In Progress...'
                            : 'Response Completed'}
                      </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* BROADCAST PLATFORM SELECTION MODAL */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Radio className="h-6 w-6" />
                <span className="font-bold text-lg">📢 Broadcast Action Plan</span>
              </div>
              <button 
                onClick={() => setShowBroadcastModal(false)}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-700 text-sm mb-4">
                Choose where to publish this action plan:
              </p>

              {/* Message Preview */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                <p className="text-xs text-gray-500 font-semibold mb-2 uppercase">Message Preview:</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {broadcastMessage}
                </p>
              </div>

              {/* Platform Selection Buttons */}
              <div className="space-y-3">
                {/* Twitter Only */}
                <button
                  onClick={handleBroadcastToTwitter}
                  className="w-full p-4 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg font-semibold flex items-center justify-between gap-3 transition-all shadow-sm hover:shadow-md group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Post to Twitter</p>
                      <p className="text-xs opacity-90">Share with public timeline</p>
                    </div>
                  </div>
                  <ChevronDown className="h-5 w-5 -rotate-90 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* WhatsApp Only */}
                <button
                  onClick={handleBroadcastToWhatsApp}
                  className="w-full p-4 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-lg font-semibold flex items-center justify-between gap-3 transition-all shadow-sm hover:shadow-md group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Send to WhatsApp</p>
                      <p className="text-xs opacity-90">Broadcast to VayuSetu channel</p>
                    </div>
                  </div>
                  <ChevronDown className="h-5 w-5 -rotate-90 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Both Platforms */}
                <button
                  onClick={handleBroadcastToBoth}
                  className="w-full p-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold flex items-center justify-between gap-3 transition-all shadow-sm hover:shadow-md group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Radio className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Broadcast to Both</p>
                      <p className="text-xs opacity-90">Twitter + WhatsApp simultaneously</p>
                    </div>
                  </div>
                  <ChevronDown className="h-5 w-5 -rotate-90 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Info Note */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>Note:</strong> The message will also be posted to the internal Firebase dashboard for audit purposes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ActiveAlerts;
