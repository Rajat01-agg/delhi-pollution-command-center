import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, Flame, AlertTriangle, CloudFog } from 'lucide-react';
import { ViewState } from '../types';

interface HeaderProps {
  onViewChange?: (view: ViewState) => void;
}

const Header: React.FC<HeaderProps> = ({ onViewChange }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleViewAllAlerts = () => {
    setShowNotifications(false);
    if (onViewChange) {
      onViewChange(ViewState.ALERTS);
    }
  };

  return (
    <header className="fixed top-0 w-full h-16 bg-white shadow-sm z-50 flex flex-col justify-center border-b border-gray-200">
      <div className="flex items-center justify-between px-6 w-full">
        
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
           {/* Logo Icon */}
          <div className="h-9 w-9 rounded-full flex items-center justify-center bg-[#0f2942] text-white shadow-sm border border-white/10">
            <span className="text-[9px] font-bold tracking-[0.18em] pl-[0.18em]">DPCC</span>
          </div>
          <div>
            <h1 className="text-gray-900 font-bold text-base leading-tight">
              Delhi Pollution Control Committee
            </h1>
            <p className="text-gray-500 text-[10px] uppercase tracking-wider font-medium">
              Super Admin Dashboard
            </p>
          </div>
        </div>
        
        {/* Center: Search - Pill Shape */}
        <div className="flex-1 max-w-lg mx-8 hidden md:block">
          <div className="relative group">
            <input 
              type="text"
              placeholder="Search wards, incidents, alerts..."
              className="w-full px-5 py-2.5 pl-11 rounded-full bg-white 
                         border border-gray-300 text-gray-700 text-sm
                         placeholder-gray-400 focus:outline-none 
                         focus:ring-2 focus:ring-gray-200 transition-all shadow-sm"
            />
            <Search className="absolute left-4 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        {/* Right: Notifications + User */}
        <div className="flex items-center gap-6">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1 text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
            >
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 
                               rounded-full text-[10px] flex items-center 
                               justify-center font-bold text-white border-2 border-white">
                3
              </span>
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-gray-900">Notifications</h3>
                  <span className="text-xs font-medium text-blue-600 cursor-pointer hover:underline">Mark all as read</span>
                </div>
                
                <div className="max-h-[400px] overflow-y-auto">
                  {/* Alert 1 */}
                  <div className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer relative group">
                    <div className="absolute right-4 top-4 h-2 w-2 bg-blue-500 rounded-full"></div>
                    <div className="flex gap-3">
                      <div className="mt-1">
                        <Flame className="h-5 w-5 text-orange-500 fill-orange-100" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">Fire Emergency - Bawana</p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          Industrial estate fire reported in plastic unit, response teams dispatched.
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">1 hr ago • Bawana, North Delhi</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Alert 2 */}
                  <div className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer relative">
                    <div className="absolute right-4 top-4 h-2 w-2 bg-blue-500 rounded-full"></div>
                    <div className="flex gap-3">
                      <div className="mt-1">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">Construction Violation - Dwarka</p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          Major construction activity detected despite GRAP-4 ban near Sector 21.
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">1 hr ago • Dwarka, West Delhi</p>
                      </div>
                    </div>
                  </div>

                   {/* Alert 3 */}
                   <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer relative">
                    <div className="flex gap-3">
                      <div className="mt-1">
                        <CloudFog className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">Severe Smog - Anand Vihar</p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                           PM2.5 levels crossed 500 mark. Visibility critical.
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">3 hrs ago • Anand Vihar</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-gray-50 border-t border-gray-100">
                  <button 
                    onClick={handleViewAllAlerts}
                    className="w-full py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    View All Alerts
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* User Profile */}
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="h-9 w-9 bg-navy-800 rounded-full flex 
                            items-center justify-center text-white font-bold shadow-sm bg-[#0f2942]">
              DA
            </div>
            <div className="hidden sm:block text-left">
              <p className="font-bold text-sm text-gray-900 leading-none">DPCC Admin</p>
              <p className="text-xs text-gray-500 leading-none mt-1">Super Admin</p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
          </div>
        </div>
        
      </div>
    </header>
  );
};

export default Header;