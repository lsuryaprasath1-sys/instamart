import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  UserCheck, 
  Filter, 
  RotateCcw, 
  Activity, 
  ShieldCheck, 
  Calendar,
  CheckCircle2,
  XCircle,
  Wifi,
  Smartphone
} from 'lucide-react';
import { api } from '../utils/api';

export default function LoginStatusView({ user }) {
  const isAdmin = user?.role === 'admin';

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPicker, setFilterPicker] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchLoginHistory();
  }, [filterPicker, filterStatus]);

  const fetchLoginHistory = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterPicker && isAdmin) params.picker_id = filterPicker;
      if (filterStatus) params.status = filterStatus;

      const data = await api.logs.getLoginHistory(params);
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Failed to load login history:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (loginStr, logoutStr) => {
    if (!loginStr) return '-';
    const start = new Date(loginStr).getTime();
    const end = logoutStr ? new Date(logoutStr).getTime() : Date.now();
    const diffMin = Math.round((end - start) / (1000 * 60));

    if (diffMin < 60) return `${diffMin} min`;
    const hrs = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-5">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">
              {isAdmin ? 'Warehouse Shift & Session Monitor' : 'My Shift & Login History'}
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isAdmin
              ? 'Real-time visibility into warehouse picker sign-ins, shift durations, and active scanner sessions'
              : 'Logged timestamp records and active status for your shifts'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Attendance Sync</span>
          </span>
        </div>
      </div>

      {/* Filter Bar (Admin) */}
      {isAdmin && (
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Filter by Picker ID</label>
              <input
                type="text"
                placeholder="e.g. PKR-101"
                value={filterPicker}
                onChange={(e) => setFilterPicker(e.target.value)}
                className="text-xs bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#fc8019]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Session Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#fc8019]"
              >
                <option value="">All (Active & Ended)</option>
                <option value="ACTIVE">Active Right Now</option>
                <option value="INACTIVE">Ended (Logged Out)</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => { setFilterPicker(''); setFilterStatus(''); }}
            className="text-xs text-gray-500 hover:text-gray-800 flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      )}

      {/* Sessions Table / Cards */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 space-y-2">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs">Loading shift logs...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200 space-y-2">
          <Clock className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">No Login Sessions Found</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isActive = session.status === 'ACTIVE';
            const loginFormatted = new Date(session.login_time).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });
            const logoutFormatted = session.logout_time
              ? new Date(session.logout_time).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })
              : 'Shift In Progress';
            const lastActivityFormatted = session.last_activity
              ? new Date(session.last_activity).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                })
              : '-';

            return (
              <div
                key={session.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 hover:border-emerald-300 shadow-xs transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isActive ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-gray-900">{session.name}</div>
                      <div className="text-[11px] font-mono text-gray-500">Picker ID: {session.picker_id}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase border ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-gray-100 text-gray-600 border-gray-300'
                    }`}>
                      {isActive ? 'Active Shift' : 'Ended'}
                    </span>
                    <span className="text-xs font-bold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
                      Duration: {calculateDuration(session.login_time, session.logout_time)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Login Timestamp</span>
                    <span className="font-mono text-gray-900 font-semibold">{loginFormatted}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Logout Timestamp</span>
                    <span className={`font-mono font-semibold ${isActive ? 'text-emerald-700 italic' : 'text-gray-900'}`}>
                      {logoutFormatted}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Last Active Heartbeat</span>
                    <span className="font-mono text-gray-800 font-semibold">{lastActivityFormatted}</span>
                  </div>
                </div>

                {isAdmin && session.user_agent && (
                  <div className="text-[10px] text-gray-400 font-mono truncate flex items-center space-x-1">
                    <Smartphone className="w-3 h-3 text-gray-400 shrink-0" />
                    <span>Device: {session.user_agent} • IP: {session.ip_address}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
