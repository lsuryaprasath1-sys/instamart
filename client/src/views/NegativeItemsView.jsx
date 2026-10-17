import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  Camera, 
  Edit3, 
  X, 
  ExternalLink,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { api } from '../utils/api';

export default function NegativeItemsView({ user, onStatsUpdate }) {
  const isAdmin = user?.role === 'admin';

  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, under_review: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSku, setFilterSku] = useState('');
  const [filterRack, setFilterRack] = useState('');
  const [filterPicker, setFilterPicker] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Admin resolution modal
  const [editingItem, setEditingItem] = useState(null);
  const [newStatus, setNewStatus] = useState('Under Review');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Photo lightbox modal
  const [previewPhoto, setPreviewPhoto] = useState(null);

  useEffect(() => {
    fetchNegativeItems();
    fetchStats();
  }, [filterStatus, filterSku, filterRack, filterPicker, filterDateFrom, filterDateTo]);

  const fetchNegativeItems = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterSku) params.sku_id = filterSku;
      if (filterRack) params.rack = filterRack;
      if (filterPicker && isAdmin) params.picker_id = filterPicker;
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;

      const data = await api.negativeItems.list(params);
      setItems(data.negative_items || []);
    } catch (err) {
      setError('Failed to fetch negative items: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.negativeItems.getStats();
      setStats(data);
      if (onStatsUpdate) {
        onStatsUpdate(data.open || 0);
      }
    } catch (err) {}
  };

  const handleOpenResolutionModal = (item) => {
    setEditingItem(item);
    setNewStatus(item.resolution_status === 'Open' ? 'Under Review' : item.resolution_status);
    setResolutionNotes(item.resolution_notes || '');
  };

  const handleSaveResolution = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    setUpdating(true);
    try {
      await api.negativeItems.updateResolution(editingItem.id, newStatus, resolutionNotes);
      setEditingItem(null);
      fetchNegativeItems();
      fetchStats();
    } catch (err) {
      alert('Failed to update resolution: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleResetFilters = () => {
    setFilterStatus('');
    setFilterSku('');
    setFilterRack('');
    setFilterPicker('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-5">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">
              {isAdmin ? 'Warehouse Negative Items Hub' : 'My Negative Items Log'}
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isAdmin
              ? 'Investigate, track discrepancy remarks, review photo proof, and update resolution status'
              : 'Inventory shortages and missing items flagged during your audits'}
          </p>
        </div>

        {/* Stats Pill Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-gray-100 border border-gray-300 text-xs font-bold text-gray-700">
            Total: {stats.total}
          </div>
          <div className="px-3 py-1 rounded-xl bg-red-100 border border-red-300 text-xs font-bold text-red-800">
            Open: {stats.open}
          </div>
          <div className="px-3 py-1 rounded-xl bg-amber-100 border border-amber-300 text-xs font-bold text-amber-800">
            Review: {stats.under_review}
          </div>
          <div className="px-3 py-1 rounded-xl bg-emerald-100 border border-emerald-300 text-xs font-bold text-emerald-800">
            Resolved: {stats.resolved}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-700">
            <Filter className="w-4 h-4 text-[#fc8019]" />
            <span>Filter Negative Items</span>
          </div>

          <button
            onClick={handleResetFilters}
            className="text-xs text-gray-500 hover:text-gray-800 flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">Resolution Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#fc8019]"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open (Pending)</option>
              <option value="Under Review">Under Review</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* SKU search */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">SKU ID or Name</label>
            <input
              type="text"
              placeholder="Search SKU..."
              value={filterSku}
              onChange={(e) => setFilterSku(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#fc8019]"
            />
          </div>

          {/* Rack */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">Rack</label>
            <input
              type="text"
              placeholder="e.g. 1, 2"
              value={filterRack}
              onChange={(e) => setFilterRack(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#fc8019]"
            />
          </div>

          {/* Picker ID filter (Admin only) */}
          {isAdmin && (
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Picker ID</label>
              <input
                type="text"
                placeholder="e.g. PKR-101"
                value={filterPicker}
                onChange={(e) => setFilterPicker(e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#fc8019]"
              />
            </div>
          )}

          {/* From Date */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">From Date</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#fc8019]"
            />
          </div>
        </div>
      </div>

      {/* Negative Items List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 space-y-2">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs">Loading negative items records...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 space-y-3 border border-gray-200">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">Zero Negative Items Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Great news! No inventory discrepancies match your selected criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {items.map((item) => {
            const auditDate = new Date(item.created_at).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });

            const isOpen = item.resolution_status === 'Open';
            const isReview = item.resolution_status === 'Under Review';
            const isResolved = item.resolution_status === 'Resolved';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-red-100 hover:border-red-300 shadow-xs transition-all space-y-3"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-sm text-gray-900">
                      {item.sku_name || item.sku_id}
                    </span>
                    <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                      SKU: {item.sku_id}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-xs font-black">
                      Qty Missing: {item.quantity}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-auto">
                    {/* Status Badge */}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase border ${
                      isOpen
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : isReview
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      {item.resolution_status}
                    </span>

                    {/* Admin Status Edit Button */}
                    {isAdmin && (
                      <button
                        onClick={() => handleOpenResolutionModal(item)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#fc8019] hover:text-white text-gray-600 transition-colors"
                        title="Update resolution status"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Location & Metadata Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Location ID</span>
                    <span className="font-mono font-bold text-[#fc8019] text-sm">{item.location_id}</span>
                    <div className="text-[11px] text-gray-600">
                      Floor {item.floor} • Aisle {item.aisle} • Rack {item.rack} • Bin {item.bin}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Flagged By Picker</span>
                    <span className="font-bold text-gray-900">{item.picker_name}</span>
                    <div className="text-[11px] text-gray-500 font-mono">ID: {item.picker_id}</div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Audit & Zone</span>
                    <span className="font-mono text-gray-800 font-semibold">{item.audit_id}</span>
                    <div className="text-[11px] text-gray-600">Zone: {item.zone_type || 'Ambient'}</div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Audit Timestamp</span>
                    <span className="text-gray-700 font-mono">{auditDate}</span>
                  </div>
                </div>

                {/* Mandatory Remarks & Photo Proof */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 pt-1">
                  <div className="flex-1 bg-red-50/50 p-3 rounded-xl border border-red-200 text-xs">
                    <span className="text-[11px] font-bold text-red-900 block mb-0.5">Discrepancy Remarks:</span>
                    <p className="text-red-800 font-medium italic">"{item.remarks}"</p>
                  </div>

                  {/* Photo Proof */}
                  {item.photo_url && (
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => setPreviewPhoto(item.photo_url)}
                        className="group relative w-16 h-16 rounded-xl overflow-hidden border-2 border-red-200 shadow-2xs hover:border-[#fc8019] transition-all"
                      >
                        <img
                          src={item.photo_url}
                          alt="Discrepancy proof"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Eye className="w-5 h-5" />
                        </div>
                      </button>
                      <div className="text-[11px]">
                        <span className="font-bold text-gray-700 block">Photo Proof</span>
                        <button
                          onClick={() => setPreviewPhoto(item.photo_url)}
                          className="text-[#fc8019] hover:underline font-semibold"
                        >
                          View Full Photo
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Resolution Notes (if updated) */}
                {item.resolution_notes && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Supervisor Resolution Notes:</span> {item.resolution_notes}
                      {item.resolved_by && (
                        <span className="block text-[10px] text-emerald-600 mt-0.5">
                          By: {item.resolved_by} on {new Date(item.resolved_at).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Resolution Status Update Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#fc8019]" />
                <h3 className="font-black text-base text-gray-900">Update Resolution Status</h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-gray-600">
              Item: <span className="font-bold text-gray-900">{editingItem.sku_name || editingItem.sku_id}</span> ({editingItem.quantity} missing) at location{' '}
              <span className="font-mono font-bold text-[#fc8019]">{editingItem.location_id}</span>
            </div>

            <form onSubmit={handleSaveResolution} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Change Status To:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Open', 'Under Review', 'Resolved'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border-2 transition-all ${
                        newStatus === st
                          ? st === 'Resolved'
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-900'
                            : st === 'Under Review'
                            ? 'bg-amber-100 border-amber-500 text-amber-900'
                            : 'bg-red-100 border-red-500 text-red-900'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Resolution Notes / Investigation Details:
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Stock replenished from overflow pallet; inventory ledger adjusted."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-[#fc8019] focus:outline-none"
                ></textarea>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2.5 bg-[#fc8019] hover:bg-[#e07014] text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in" onClick={() => setPreviewPhoto(null)}>
          <div className="relative max-w-2xl max-h-[90vh] bg-black rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img src={previewPhoto} alt="Discrepancy Proof Full" className="w-full h-auto max-h-[85vh] object-contain" />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
