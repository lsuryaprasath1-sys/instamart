import React from 'react';
import { 
  ScanLine, 
  ClipboardList, 
  AlertTriangle, 
  Clock, 
  LayoutDashboard, 
  Users, 
  MapPin, 
  FileSpreadsheet,
  Activity,
  Trophy
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, user, negativeCount = 0 }) {
  const isAdmin = user?.role === 'admin';

  const pickerTabs = [
    { id: 'new-audit', label: 'New Audit', icon: ScanLine, highlight: true },
    { id: 'my-audits', label: 'My Audits', icon: ClipboardList },
    { id: 'my-performance', label: 'Performance', icon: Trophy },
    { id: 'negative-items', label: 'Negatives', icon: AlertTriangle, badge: negativeCount },
    { id: 'login-status', label: 'My Shifts', icon: Clock },
  ];

  const adminTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-audit', label: 'Audit', icon: ScanLine },
    { id: 'my-audits', label: 'All Audits', icon: ClipboardList },
    { id: 'negative-items', label: 'Negatives', icon: AlertTriangle, badge: negativeCount },
    { id: 'users', label: 'Pickers', icon: Users },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'reports', label: 'Export', icon: FileSpreadsheet },
    { id: 'logs', label: 'Audit Trail', icon: Activity },
  ];

  const tabs = isAdmin ? adminTabs : pickerTabs;

  return (
    <>
      {/* Desktop / Tablet Top Sub-Navigation (if admin has many tabs) */}
      <div className="hidden md:block bg-white border-b border-gray-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center space-x-1 overflow-x-auto py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#fc8019] text-white shadow-xs'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white text-[#fc8019]' : 'bg-red-500 text-white'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Sticky Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1e1e24] border-t border-gray-800 shadow-2xl safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-1.5">
          {tabs.slice(0, 5).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all rounded-lg active:scale-95 ${
                  isActive ? 'text-[#fc8019]' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <div className={`p-1 rounded-full ${isActive ? 'bg-[#fc8019]/20' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#fc8019]' : 'text-gray-400'}`} />
                </div>
                <span className={`text-[10px] mt-0.5 tracking-tight font-medium ${isActive ? 'font-bold text-white' : ''}`}>
                  {tab.label}
                </span>

                {tab.badge > 0 && (
                  <span className="absolute top-0.5 right-3 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center border-2 border-[#1e1e24]">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
