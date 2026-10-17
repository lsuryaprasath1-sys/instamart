import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  TrendingUp, 
  Layers, 
  BarChart3, 
  Calendar,
  Filter,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  Eye,
  ShieldCheck,
  Building2,
  RefreshCw,
  Trophy,
  Award,
  Zap,
  Target,
  FileSpreadsheet,
  ChevronRight,
  UserCheck,
  Smartphone
} from 'lucide-react';
import { api } from '../utils/api';

export default function AdminDashboardView({ onSelectAudit, onSelectTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dashboard Sub-View: 'overview' vs 'picker-performance'
  const [dashboardMode, setDashboardMode] = useState('overview');

  // Picker Performance Data
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedPickerId, setSelectedPickerId] = useState('');
  const [pickerDetail, setPickerDetail] = useState(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  useEffect(() => {
    fetchDashboardMetrics();
    fetchPickerLeaderboard();
  }, []);

  useEffect(() => {
    if (selectedPickerId) {
      fetchIndividualPicker(selectedPickerId);
    }
  }, [selectedPickerId]);

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.analytics.getDashboard();
      setData(res);
    } catch (err) {
      setError('Failed to compile admin metrics: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPickerLeaderboard = async () => {
    try {
      const res = await api.analytics.getPickerPerformance();
      setLeaderboard(res.leaderboard || []);
      if (res.leaderboard && res.leaderboard.length > 0 && !selectedPickerId) {
        setSelectedPickerId(res.leaderboard[0].picker_id);
      }
    } catch (err) {
      console.warn('Failed to load picker leaderboard:', err);
    }
  };

  const fetchIndividualPicker = async (id) => {
    setLoadingPerformance(true);
    try {
      const res = await api.analytics.getPickerPerformance({ picker_id: id });
      setPickerDetail(res.selected_picker);
    } catch (err) {
      console.warn('Failed to load individual picker performance:', err);
    } finally {
      setLoadingPerformance(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-gray-500 space-y-3">
        <div className="w-10 h-10 border-4 border-[#fc8019] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold">Compiling real-time warehouse audit metrics & analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error || 'Error loading dashboard'}</span>
          <button onClick={fetchDashboardMetrics} className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { summary, charts, currently_logged_in, recent_audits } = data;

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Title & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-[#fc8019] flex items-center justify-center text-white shadow-md">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Warehouse Admin Executive Dashboard</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time warehouse KPIs, picker productivity, audit completion rates, and location discrepancy health
          </p>
        </div>

        {/* View Mode Toggle Pills & APK Download */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-auto">
          <div className="flex items-center space-x-1.5 bg-gray-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setDashboardMode('overview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                dashboardMode === 'overview'
                  ? 'bg-white text-gray-900 shadow-xs font-black'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-[#fc8019]" />
              <span>Warehouse KPIs & Heatmaps</span>
            </button>

            <button
              onClick={() => {
                setDashboardMode('picker-performance');
                if (leaderboard.length > 0 && !selectedPickerId) {
                  setSelectedPickerId(leaderboard[0].picker_id);
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                dashboardMode === 'picker-performance'
                  ? 'bg-[#fc8019] text-white shadow-md font-black'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Picker Performance Tracker</span>
            </button>
          </div>

          <a
            href="/download/Swiggy_Instamart_Rack_Audit.apk"
            download
            className="px-3.5 py-2.5 rounded-2xl bg-purple-900 hover:bg-purple-800 text-purple-100 text-xs font-bold flex items-center space-x-1.5 border border-purple-700 shadow-xs transition-colors"
            title="Download Android APK package"
          >
            <Smartphone className="w-4 h-4 text-purple-300" />
            <span>Download APK</span>
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: PICKER PERFORMANCE TRACKER & LEADERBOARD                         */}
      {/* ========================================================================= */}
      {dashboardMode === 'picker-performance' ? (
        <div className="space-y-6 animate-fade-in">
          {/* Top Leaderboard Podium Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-black text-gray-900 flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Warehouse Picker Productivity Leaderboard</span>
              </h2>
              <span className="text-xs text-gray-500 font-semibold">Ranked by audits completed & accuracy</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {leaderboard.slice(0, 3).map((picker, idx) => {
                const isSelected = selectedPickerId === picker.picker_id;
                const medalColors = [
                  'from-amber-500 to-amber-600 text-white', // 1st Gold
                  'from-slate-400 to-slate-500 text-white', // 2nd Silver
                  'from-amber-700 to-amber-800 text-white', // 3rd Bronze
                ];

                return (
                  <div
                    key={picker.picker_id}
                    onClick={() => setSelectedPickerId(picker.picker_id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'border-[#fc8019] bg-orange-50/50 shadow-md ring-2 ring-[#fc8019]/20'
                        : 'border-gray-200 bg-white hover:border-gray-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${medalColors[idx]} font-black text-sm flex items-center justify-center shadow-md`}>
                          #{picker.rank}
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-gray-900">{picker.name}</div>
                          <div className="text-[11px] font-mono text-gray-500">ID: {picker.picker_id}</div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        picker.accuracy_rate >= 95 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {picker.accuracy_rate}% Acc.
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Audits</span>
                        <span className="font-black text-gray-900 text-sm">{picker.total_audits}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Today</span>
                        <span className="font-black text-[#fc8019] text-sm">{picker.today_audits}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">SKUs Audited</span>
                        <span className="font-black text-gray-900 text-sm">{picker.total_skus_scanned}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual Picker Deep-Dive Section */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs space-y-6">
            {/* Picker Selector Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#fc8019] flex items-center space-x-1">
                  <Target className="w-3.5 h-3.5" />
                  <span>Individual Picker Performance Profile</span>
                </span>
                <h3 className="text-lg font-black text-gray-900 mt-0.5">
                  {pickerDetail ? pickerDetail.picker.name : 'Loading Picker...'}
                </h3>
              </div>

              {/* Picker Selection Dropdown */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-gray-500">Select Picker:</span>
                <select
                  value={selectedPickerId}
                  onChange={(e) => setSelectedPickerId(e.target.value)}
                  className="text-xs font-bold bg-gray-50 border-2 border-gray-300 rounded-xl px-3 py-2 focus:border-[#fc8019] focus:outline-none"
                >
                  {leaderboard.map((p) => (
                    <option key={p.picker_id} value={p.picker_id}>
                      {p.name} ({p.picker_id}) — {p.total_audits} Audits
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingPerformance || !pickerDetail ? (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <div className="w-8 h-8 border-3 border-[#fc8019] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs">Loading picker scorecard...</p>
              </div>
            ) : (
              <>
                {/* 4 Scorecard KPI Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <span className="text-[10px] font-bold uppercase text-gray-500 block">Total Audits Completed</span>
                    <div className="text-2xl font-black text-gray-900 mt-1">{pickerDetail.picker.total_audits}</div>
                    <div className="text-[11px] text-[#fc8019] font-bold mt-0.5">{pickerDetail.picker.today_audits} Completed Today</div>
                  </div>

                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 block">Inventory Accuracy Rate</span>
                    <div className="text-2xl font-black text-emerald-700 mt-1">{pickerDetail.picker.accuracy_rate}%</div>
                    <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">{pickerDetail.picker.clean_audits_count} clean audits</div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <span className="text-[10px] font-bold uppercase text-gray-500 block">Total SKUs Scanned</span>
                    <div className="text-2xl font-black text-gray-900 mt-1">{pickerDetail.picker.total_skus_scanned}</div>
                    <div className="text-[11px] text-gray-500 font-medium mt-0.5">Avg {pickerDetail.picker.avg_skus_per_audit} SKUs/rack</div>
                  </div>

                  <div className="bg-red-50/50 p-4 rounded-2xl border border-red-200">
                    <span className="text-[10px] font-bold uppercase text-red-800 block">Discrepancies Flagged</span>
                    <div className="text-2xl font-black text-red-700 mt-1">{pickerDetail.picker.negative_items_found}</div>
                    <div className="text-[11px] text-red-600 font-semibold mt-0.5">Missing items reported</div>
                  </div>
                </div>

                {/* Performance Charts & Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Daily Audits Trend */}
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                    <h4 className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
                      <TrendingUp className="w-4 h-4 text-[#fc8019]" />
                      <span>Daily Auditing Activity (Last 14 Days)</span>
                    </h4>

                    {pickerDetail.daily_trend.length === 0 ? (
                      <div className="text-center py-6 text-xs text-gray-400">No daily logs found</div>
                    ) : (
                      <div className="space-y-2 pt-1">
                        {pickerDetail.daily_trend.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 font-mono">{d.date}</span>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-gray-800 font-mono">{d.audits_count} Audits</span>
                              {d.negatives_count > 0 && (
                                <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.2 rounded font-bold">
                                  {d.negatives_count} Negatives
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Warehouse Zone Coverage for this picker */}
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                    <h4 className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
                      <Layers className="w-4 h-4 text-[#fc8019]" />
                      <span>Warehouse Zones Audited by {pickerDetail.picker.name}</span>
                    </h4>

                    <div className="space-y-2 pt-1">
                      {pickerDetail.zone_distribution.map((z, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-700">{z.zone_type || 'Ambient'}</span>
                          <span className="px-2 py-0.5 rounded-md bg-orange-100 text-[#fc8019] font-bold font-mono">
                            {z.count} Racks Audited
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chronological Audits Feed for this Picker */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-[#fc8019]" />
                      <span>Recent Audits by {pickerDetail.picker.name}</span>
                    </h4>
                    <span className="text-[11px] text-gray-400">{pickerDetail.recent_audits.length} Audits Logged</span>
                  </div>

                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                    {pickerDetail.recent_audits.map((a) => (
                      <div key={a.audit_id} className="p-3 bg-white flex items-center justify-between text-xs hover:bg-gray-50">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-gray-900">{a.audit_id}</span>
                            <span className="text-gray-500">• {a.location_id}</span>
                            <span className="text-[11px] text-gray-400 font-mono">
                              ({new Date(a.created_at).toLocaleDateString()})
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            Floor {a.floor} • Aisle {a.aisle} • Rack {a.rack} • Bin {a.bin}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            a.negative_items_count > 0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {a.negative_items_count > 0 ? `${a.negative_items_count} Discrepancies` : 'Clean Audit'}
                          </span>
                          <div className="text-[11px] text-gray-600 font-bold mt-0.5">{a.total_skus} SKUs Checked</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE 2: WAREHOUSE OVERVIEW & SUMMARY KPIS (STANDARD DASHBOARD)             */
        /* ========================================================================= */
        <div className="space-y-6 animate-fade-in">
          {/* 8 Summary Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Card 1: Total Pickers */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Total Pickers</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-gray-900">{summary.total_pickers}</span>
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">Registered staff accounts</span>
            </div>

            {/* Card 2: Active Pickers */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">Active Pickers</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-emerald-700">{summary.active_pickers}</span>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <span className="text-[10px] text-emerald-600 mt-1 block">Logged-in on floor right now</span>
            </div>

            {/* Card 3: Total Audits Completed */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Total Audits</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-[#fc8019]">{summary.total_audits}</span>
                <CheckCircle2 className="w-5 h-5 text-[#fc8019]" />
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">Racks audited to date</span>
            </div>

            {/* Card 4: Total Negative Items */}
            <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/20 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-800 block">Total Negatives</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-red-700">{summary.total_negative_items}</span>
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-[10px] text-red-600 mt-1 block">Missing SKU records logged</span>
            </div>

            {/* Card 5: Open Negative Items */}
            <div className="bg-white p-4 rounded-2xl border border-red-300 bg-red-50/40 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-900 block">Open Negatives</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-red-800">{summary.open_negative_items}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-200 text-red-800">Needs Action</span>
              </div>
              <span className="text-[10px] text-red-700 mt-1 block">Pending supervisor review</span>
            </div>

            {/* Card 6: Resolved Negative Items */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Resolved Negatives</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-emerald-600">{summary.resolved_negative_items}</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">Reconciled / Replenished</span>
            </div>

            {/* Card 7: Today's Audits */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Today's Audits</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-gray-900">{summary.today_audits}</span>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">Completed this shift</span>
            </div>

            {/* Card 8: Today's Negative Items */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Today's Negatives</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-black text-red-600">{summary.today_negative_items}</span>
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">Flagged today</span>
            </div>
          </div>

          {/* Charts Section: Picker Performance Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart: Picker-wise Audit Count */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-1.5">
                    <BarChart3 className="w-4 h-4 text-[#fc8019]" />
                    <span>Picker-Wise Audit Count</span>
                  </h3>
                  <p className="text-[11px] text-gray-500">Total audits completed per warehouse picker</p>
                </div>
                <button
                  onClick={() => setDashboardMode('picker-performance')}
                  className="text-xs text-[#fc8019] hover:underline font-bold flex items-center space-x-1"
                >
                  <span>Track Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {charts.picker_audit_counts.map((item, idx) => {
                  const maxAudits = Math.max(...charts.picker_audit_counts.map((p) => p.audit_count), 1);
                  const percentage = Math.round((item.audit_count / maxAudits) * 100);

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-800">{item.picker_name}</span>
                        <span className="text-[#fc8019] font-mono">{item.audit_count} Audits</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-[#fc8019] h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart: Picker-wise Negative Item Count */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span>Picker-Wise Discrepancy / Negative Count</span>
                  </h3>
                  <p className="text-[11px] text-gray-500">Missing items discovered by pickers</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {charts.picker_negative_counts.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400">No negative items flagged yet</div>
                ) : (
                  charts.picker_negative_counts.map((item, idx) => {
                    const maxNeg = Math.max(...charts.picker_negative_counts.map((p) => p.negative_count), 1);
                    const percentage = Math.round((item.negative_count / maxNeg) * 100);

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-800">{item.picker_name}</span>
                          <span className="text-red-600 font-mono">{item.negative_count} Flagged</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-red-500 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Location Discrepancy Breakdown Heatmaps (Floor, Aisle, Rack, ZoneType) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-[#fc8019]" />
                <span>Negative Items Location Distribution (Floor, Aisle, Zone)</span>
              </h3>
              <p className="text-[11px] text-gray-500">Inventory discrepancy hotspots across warehouse layout</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* By Floor */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-700 block mb-2">By Warehouse Floor</span>
                <div className="space-y-2">
                  {charts.negatives_by_floor.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">Floor {f.floor}</span>
                      <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 font-bold font-mono">
                        {f.count} Negatives
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Aisle */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-700 block mb-2">By Warehouse Aisle</span>
                <div className="space-y-2">
                  {charts.negatives_by_aisle.map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">Aisle {a.aisle}</span>
                      <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-900 font-bold font-mono">
                        {a.count} Negatives
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* By ZoneType */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <span className="text-xs font-bold text-gray-700 block mb-2">By Zone Type</span>
                <div className="space-y-2">
                  {charts.negatives_by_zone_type.map((z, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">{z.zone_type}</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-bold font-mono">
                        {z.count} Negatives
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Currently Logged-in Pickers & Frequently Audited Racks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Currently Logged-in Pickers Live Table */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Currently Logged-in Warehouse Pickers ({currently_logged_in.length})</span>
                </h3>
                <button
                  onClick={() => onSelectTab('login-status')}
                  className="text-xs text-[#fc8019] hover:underline font-semibold"
                >
                  View All Sessions
                </button>
              </div>

              {currently_logged_in.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">No pickers currently logged in</div>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  {currently_logged_in.map((sess) => (
                    <div key={sess.id} className="p-3 bg-white flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-gray-900">{sess.name}</div>
                        <div className="text-[11px] font-mono text-gray-500">ID: {sess.picker_id}</div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Active Shift
                        </span>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          Since {new Date(sess.login_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Most Frequently Audited Racks */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-[#fc8019]" />
                  <span>Most Frequently Audited Racks</span>
                </h3>
                <span className="text-[11px] text-gray-400">High coverage zones</span>
              </div>

              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                {charts.frequent_racks.map((rack, idx) => (
                  <div key={idx} className="p-3 bg-white flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-gray-900">{rack.rack_code}</span>
                      <div className="text-[11px] text-gray-500">
                        Floor {rack.floor} • Aisle {rack.aisle} • Rack {rack.rack}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-[#fc8019] font-bold font-mono">
                      {rack.audit_count} Audits
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
