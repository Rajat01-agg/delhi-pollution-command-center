import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  Bell, 
  Zap, 
  Share2, 
  Target,
  Cpu
} from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  
  // Design Specs from prompt
  const SIDEBAR_BG = '#0f2942'; 
  const ACTIVE_BG = '#f59e0b'; // Orange

  const mainNavItems = [
    { id: ViewState.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: ViewState.MAP, label: 'Ward Map', icon: <Map className="h-5 w-5" /> },
    { id: ViewState.SIMULATOR, label: 'AI Simulator', icon: <Cpu className="h-5 w-5" /> },
    { id: ViewState.ALERTS, label: 'Active Alerts', icon: <Bell className="h-5 w-5" />, badge: 8 },
    { id: ViewState.ACTIONS, label: 'Quick Actions', icon: <Zap className="h-5 w-5" /> },
    // Analytics removed as requested
    { id: ViewState.SOCIAL, label: 'Social Media', icon: <Share2 className="h-5 w-5" /> },
    { id: ViewState.IMPACT, label: 'Impact Tracker', icon: <Target className="h-5 w-5" /> },
  ];


  const renderItem = (item: any) => {
    const isActive = currentView === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onChangeView(item.id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all duration-200 group
          ${isActive 
            ? 'text-white font-semibold shadow-md' 
            : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        style={isActive ? { backgroundColor: ACTIVE_BG } : {}}
      >
        <span className={isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}>
          {item.icon}
        </span>
        <span className="text-sm font-medium">{item.label}</span>
        {item.badge && (
          <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside 
      className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-60 overflow-y-auto custom-scrollbar"
      style={{ backgroundColor: SIDEBAR_BG }}
    >
      <nav className="p-4 flex flex-col min-h-full">
        <div className="flex-1">
          {mainNavItems.map(renderItem)}
        </div>
        
        <div className="mt-8 px-4 text-center">
            <p className="text-xs text-gray-500">v2.4.1 Connected</p>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;