import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Award, 
  Zap, 
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Package
} from 'lucide-react';
import { api } from '../utils/api';

export default function MyPerformanceView({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyPerformance();
  }, []);

  const fetchMyPerformance = async () => {
    setLoading(true);
    try {
      const res = await api.analytics.getMyPerformance();
      setData(res);
    } catch (err) {
      console.warn('Failed to load self performance:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-gray-500 space-y-3">
        <div className="w-8 h-8 border-3 border-[#fc8019] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs">Calculating your shift performance score...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-gray-500">
        Unable to load your performance data. Please try again.
      </div>
    );
  }

  const { metrics, recent_audits, daily_trend } = data;
  const goalPercent = Math.min(100, Math.round((metrics.today_audits / metrics.today_goal) * 100));

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-5">
      {/* Header Profile Badge */}
      <div className="bg-gradient-to-r from-gray-900 to-[#1e1e24] text-white p-5 rounded-3xl shadow-md border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#fc8019] flex items-center justify-center font-black text-xl text-white shadow-lg shadow-[#fc8019]/30">
            {user?.picker_id ? user.picker_id.replace('PKR-', 'P') : 'P'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold text-white">{user?.name}</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#fc8019]/20 text-[#fc8019] border border-[#fc8019]/40 text-[10px] font-black uppercase">
                {metrics.tier}
              </span>
            </div>
            <div className="text-xs text-gray-400 font-mono mt-0.5">Picker ID: {user?.picker_id}</div>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-gray-800/80 p-3 rounded-2xl border border-gray-700">
          <Trophy className="w-6 h-6 text-amber-400" />
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400">Auditor Status</div>
            <div className="text-xs font-black text-white">{metrics.tier}</div>
          </div>
        </div>
      </div>

      {/* Today's Shift Target Progress Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-gray-800 flex items-center space-x-1.5">
            <Target className="w-4 h-4 text-[#fc8019]" />
            <span>Today's Shift Audits Goal</span>
          </span>
          <span className="font-mono text-[#fc8019]">
            {metrics.today_audits} / {metrics.today_goal} Racks ({goalPercent}%)
          </span>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-[#fc8019] h-3 rounded-full transition-all duration-700"
            style={{ width: `${goalPercent}%` }}
          ></div>
        </div>
        <p className="text-[11px] text-gray-500">
          {metrics.today_audits >= metrics.today_goal
            ? '🎉 Shift audit target achieved! Excellent work.'
            : `${metrics.today_goal - metrics.today_audits} more rack audits needed to meet today's shift target.`}
        </p>
      </div>

      {/* 4 Scorecard Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-gray-500 block">Total Audits</span>
          <div className="text-2xl font-black text-gray-900 mt-1">{metrics.total_audits}</div>
          <span className="text-[10px] text-gray-400 block mt-0.5">{metrics.weekly_audits} completed this week</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-800 block">Accuracy Rate</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{metrics.accuracy_rate}%</div>
          <span className="text-[10px] text-emerald-600 block mt-0.5">{metrics.clean_audits_count} clean audits</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-gray-500 block">Total SKUs Checked</span>
          <div className="text-2xl font-black text-gray-900 mt-1">{metrics.total_skus_scanned}</div>
          <span className="text-[10px] text-gray-400 block mt-0.5">Physical items verified</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/20 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-red-800 block">Missing Reported</span>
          <div className="text-2xl font-black text-red-700 mt-1">{metrics.negative_items_found}</div>
          <span className="text-[10px] text-red-600 block mt-0.5">Discrepancies identified</span>
        </div>
      </div>

      {/* Daily Audits Trend (7 Days) */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
          <TrendingUp className="w-4 h-4 text-[#fc8019]" />
          <span>My Daily Auditing History (Past 7 Days)</span>
        </h3>

        {daily_trend.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-400">No audits recorded yet in past 7 days</div>
        ) : (
          <div className="space-y-2 pt-1">
            {daily_trend.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-mono">{d.date}</span>
                <span className="font-bold text-gray-900 font-mono px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-[#fc8019]">
                  {d.count} Audits
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Audits List */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
            <Package className="w-4 h-4 text-[#fc8019]" />
            <span>My Most Recent Submitted Audits</span>
          </h3>
          <span className="text-[10px] text-gray-400">Recent 10</span>
        </div>

        <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
          {recent_audits.map((a) => (
            <div key={a.audit_id} className="p-3 bg-white flex items-center justify-between text-xs">
              <div>
                <span className="font-mono font-bold text-gray-900">{a.audit_id}</span>
                <div className="text-[11px] text-gray-500 font-medium">
                  Location: <span className="text-[#fc8019] font-mono font-bold">{a.location_id}</span> • {new Date(a.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="text-right">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  a.negative_items_count > 0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {a.negative_items_count > 0 ? `${a.negative_items_count} Missing` : 'All OK'}
                </span>
                <div className="text-[11px] text-gray-500 font-semibold mt-0.5">{a.total_skus} SKUs</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
