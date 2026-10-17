import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  LogOut, 
  RefreshCw, 
  Clock, 
  MapPin, 
  AlertTriangle,
  ChevronDown,
  Building2,
  Smartphone
} from 'lucide-react';
import { api, setToken, setCurrentUser } from '../utils/api';

export default function Navbar({ user, onLogout, onSwitchUser, activeTab, setActiveTab, onOpenAndroidModal }) {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const testAccounts = [
    { picker_id: 'SURYA', name: 'Surya (Admin)', role: 'admin' },
    { picker_id: 'PKR-101', name: 'Ramesh Kumar (Picker)', role: 'picker' },
    { picker_id: 'PKR-102', name: 'Priya Sharma (Picker)', role: 'picker' },
    { picker_id: 'PKR-103', name: 'Amit Verma (Picker)', role: 'picker' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#1e1e24] text-white shadow-lg border-b border-gray-800">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab(user.role === 'admin' ? 'dashboard' : 'new-audit')}>
          <div className="w-10 h-10 rounded-xl bg-[#fc8019] flex items-center justify-center shadow-md shadow-[#fc8019]/30">
            <span className="font-black text-xl text-white tracking-tighter">IM</span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">SWIGGY</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-[#fc8019] text-white font-bold tracking-wider uppercase">Instamart</span>
            </div>
            <div className="text-[11px] text-gray-400 font-medium flex items-center space-x-1">
              <Building2 className="w-3 h-3 text-[#fc8019]" />
              <span>FC-BLR-04 • Rack Audit Hub</span>
            </div>
          </div>
        </div>

        {/* Live Clock & Shift Status (Desktop / Tablet) */}
        <div className="hidden sm:flex items-center space-x-3 bg-gray-900/80 px-3 py-1.5 rounded-lg border border-gray-800 text-xs">
          <Clock className="w-3.5 h-3.5 text-[#fc8019]" />
          <span className="font-mono text-gray-200">{currentTime}</span>
          <span className="text-gray-600">|</span>
          <span className="flex items-center space-x-1 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Shift Active</span>
          </span>
        </div>

        {/* User Badge & Actions */}
        <div className="flex items-center space-x-2">
          {/* User Info Capsule */}
          <div className="relative">
            <button
              onClick={() => setShowSwitchDropdown(!showSwitchDropdown)}
              className="flex items-center space-x-2 bg-gray-800/90 hover:bg-gray-800 border border-gray-700 rounded-full py-1 pl-1.5 pr-2.5 transition-all text-left"
              title="Click to switch test accounts"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                user?.role === 'admin' ? 'bg-purple-600 text-white' : 'bg-[#fc8019] text-white'
              }`}>
                {user?.role === 'admin' ? 'AD' : user?.picker_id?.replace('PKR-', 'P') || 'U'}
              </div>
              <div className="hidden md:block leading-none pr-1">
                <div className="text-xs font-semibold text-white max-w-[120px] truncate">{user?.name}</div>
                <div className="text-[10px] text-gray-400 font-mono flex items-center space-x-1 mt-0.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${user?.role === 'admin' ? 'bg-purple-400' : 'bg-emerald-400'}`}></span>
                  <span>{user?.picker_id}</span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* Test Switch Dropdown */}
            {showSwitchDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-[#25252d] border border-gray-700 rounded-xl shadow-2xl py-2 z-50 text-xs">
                <div className="px-3 py-1.5 border-b border-gray-700 text-gray-400 uppercase font-semibold text-[10px] flex items-center justify-between">
                  <span>Switch Test Account</span>
                  <span className="text-[#fc8019]">Quick Demo</span>
                </div>
                {testAccounts.map((acc) => (
                  <button
                    key={acc.picker_id}
                    onClick={() => {
                      setShowSwitchDropdown(false);
                      onSwitchUser(acc.picker_id);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-gray-800 transition-colors ${
                      user?.picker_id === acc.picker_id ? 'bg-[#fc8019]/15 text-[#fc8019] font-bold' : 'text-gray-300'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-white">{acc.name}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{acc.picker_id}</div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                      acc.role === 'admin' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-orange-950 text-orange-300 border border-orange-800'
                    }`}>
                      {acc.role}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Android App & APK Download Button */}
          <button
            onClick={onOpenAndroidModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 border border-purple-600/70 text-xs font-bold transition-all active:scale-95 shadow-xs"
            title="Download Android APK or run on Zebra/Honeywell Scanner"
          >
            <Smartphone className="w-3.5 h-3.5 text-purple-400" />
            <span>Android APK</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-gray-800 hover:bg-red-950/60 hover:text-red-400 text-gray-300 border border-gray-700 transition-colors"
            title="Sign out & end shift"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
