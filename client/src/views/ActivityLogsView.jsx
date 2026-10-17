import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  RotateCcw, 
  Clock, 
  User, 
  ShieldCheck, 
  MapPin, 
  FileCheck, 
  KeyRound,
  AlertTriangle
} from 'lucide-react';
import { api } from '../utils/api';

export default function ActivityLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterPicker, setFilterPicker] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [filterAction, filterPicker]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterAction) params.action = filterAction;
      if (filterPicker) params.picker_id = filterPicker;

      const data = await api.logs.getActivity(params);
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'LOGIN':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">Login</span>;
      case 'LOGOUT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-700">Logout</span>;
      case 'AUDIT_SUBMITTED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-[#fc8019]">Audit Submitted</span>;
      case 'NEGATIVE_ITEM_RESOLVED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">Discrepancy Resolved</span>;
      case 'USER_CREATED':
      case 'USER_UPDATED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-800">User Management</span>;
      case 'PASSWORD_RESET':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">Password Reset</span>;
      case 'LOCATION_MASTER_UPLOADED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800">Location Master</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-800">{action}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-5">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">
              Warehouse Activity Trail & Security Audit
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Immutable timeline of warehouse logins, audit submissions, location updates, and account actions
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 self-start sm:self-auto">
          {logs.length} Logged Events
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">Filter by Action</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:border-[#fc8019]"
            >
              <option value="">All Actions</option>
              <option value="LOGIN">Logins</option>
              <option value="LOGOUT">Logouts</option>
              <option value="AUDIT_SUBMITTED">Audit Submissions</option>
              <option value="NEGATIVE_ITEM_RESOLVED">Negative Resolved</option>
              <option value="USER_CREATED">User Created</option>
              <option value="USER_UPDATED">User Updated</option>
              <option value="PASSWORD_RESET">Password Reset</option>
              <option value="LOCATION_MASTER_UPLOADED">Location Master Uploaded</option>
            </select>
          </div>

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
        </div>

        <button
          onClick={() => { setFilterAction(''); setFilterPicker(''); }}
          className="text-xs text-gray-500 hover:text-gray-800 flex items-center space-x-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Logs Table / Cards */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 space-y-2">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs">Fetching audit logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200">
          No activity logs match your filter criteria.
        </div>
      ) : (
        <div className="space-y-2.5">
          {logs.map((log) => {
            const dateFormatted = new Date(log.created_at).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            });

            return (
              <div
                key={log.id}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200 hover:border-indigo-300 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getActionBadge(log.action)}
                    <span className="font-bold text-gray-900">{log.picker_name || 'System'}</span>
                    <span className="font-mono text-gray-500 text-[11px]">({log.picker_id || 'SYS'})</span>
                  </div>
                  <p className="text-gray-700 font-medium">{log.details}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-gray-400 text-[11px] block">{dateFormatted}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
