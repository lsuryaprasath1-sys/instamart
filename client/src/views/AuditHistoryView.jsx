import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Camera, 
  Package, 
  Clock, 
  User, 
  RotateCcw
} from 'lucide-react';
import { api } from '../utils/api';

export default function AuditHistoryView({ user }) {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterRack, setFilterRack] = useState('');
  const [filterSku, setFilterSku] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPicker, setFilterPicker] = useState('');

  // Audit detail modal
  const [selectedAuditDetails, setSelectedAuditDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchAudits();
  }, [filterDateFrom, filterDateTo, filterRack, filterSku, filterStatus, filterPicker]);

  const fetchAudits = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;
      if (filterRack) params.rack = filterRack;
      if (filterSku) params.sku_id = filterSku;
      if (filterStatus) params.status = filterStatus;
      if (user.role === 'admin' && filterPicker) params.picker_id = filterPicker;

      const data = await api.audits.list(params);
      setAudits(data.audits || []);
    } catch (err) {
      setError('Failed to load audit history: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAuditDetail = async (auditId) => {
    setLoadingDetails(true);
    try {
      const data = await api.audits.getById(auditId);
      setSelectedAuditDetails(data);
    } catch (err) {
      alert('Could not load audit details: ' + err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleResetFilters = () => {
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterRack('');
    setFilterSku('');
    setFilterStatus('');
    setFilterPicker('');
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-5">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#fc8019] flex items-center justify-center text-white">
              <ClipboardList className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">
              {user.role === 'admin' ? 'Warehouse Audit History' : 'My Completed Audits'}
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {user.role === 'admin'
              ? 'Monitoring all logged audits submitted by warehouse pickers'
              : 'Audit history and logged records for ' + user.name}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-xs font-bold text-[#fc8019]">
            {audits.length} Records Found
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-700">
            <Filter className="w-4 h-4 text-[#fc8019]" />
            <span>Search & Filter Audits</span>
          </div>

          <button
            onClick={handleResetFilters}
            className="text-xs text-gray-500 hover:text-gray-800 flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Date from */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">From Date</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#fc8019]"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#fc8019]"
            />
          </div>

          {/* Rack filter */}
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

          {/* SKU filter */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">SKU ID</label>
            <input
              type="text"
              placeholder="Search SKU..."
              value={filterSku}
              onChange={(e) => setFilterSku(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#fc8019]"
            />
          </div>

          {/* Audit Status filter */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">Audit Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#fc8019]"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed (No Discrepancies)</option>
              <option value="FLAGGED">Flagged (Missing / Negatives)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audits Card List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 space-y-2">
          <div className="w-8 h-8 border-3 border-[#fc8019] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs">Fetching audits from warehouse records...</p>
        </div>
      ) : audits.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 space-y-3 border border-gray-200">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">No Audits Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            No audits match your selected filter criteria. Try clearing filters or submit a new audit.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {audits.map((audit) => {
            const isFlagged = audit.negative_items_count > 0 || audit.status === 'FLAGGED';
            const auditDate = new Date(audit.created_at).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });

            return (
              <div
                key={audit.audit_id}
                onClick={() => handleOpenAuditDetail(audit.audit_id)}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 hover:border-[#fc8019] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-sm text-gray-900 group-hover:text-[#fc8019] transition-colors">
                      {audit.audit_id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isFlagged
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {isFlagged ? `Flagged (${audit.negative_items_count} Missing)` : 'Completed'}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {auditDate}
                    </span>
                  </div>

                  {/* Coordinates row */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 font-medium">
                    <span className="flex items-center space-x-1 text-gray-800 font-bold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                      <MapPin className="w-3.5 h-3.5 text-[#fc8019]" />
                      <span>{audit.location_id}</span>
                    </span>
                    <span>Floor {audit.floor}</span>
                    <span>• Aisle {audit.aisle}</span>
                    <span>• Rack {audit.rack}</span>
                    <span>• Bin {audit.bin}</span>
                    <span className="text-gray-400">({audit.zone_type || 'Ambient'})</span>
                  </div>

                  {user.role === 'admin' && (
                    <div className="text-[11px] text-gray-500 font-mono flex items-center space-x-1">
                      <User className="w-3 h-3 text-gray-400" />
                      <span>Auditor: {audit.picker_name} ({audit.picker_id})</span>
                    </div>
                  )}
                </div>

                {/* SKU counts & button */}
                <div className="flex items-center space-x-4 self-end sm:self-center shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-bold text-gray-900">
                      {audit.total_skus} SKU{audit.total_skus !== 1 ? 's' : ''}
                    </div>
                    {audit.negative_items_count > 0 ? (
                      <div className="text-[11px] text-red-600 font-bold flex items-center justify-end space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{audit.negative_items_count} Missing</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>All Available</span>
                      </div>
                    )}
                  </div>

                  <div className="p-2 rounded-xl bg-gray-50 group-hover:bg-[#fc8019] group-hover:text-white text-gray-400 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Audit Detail Drawer / Modal */}
      {selectedAuditDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
          <div className="bg-white text-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#fc8019] flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-tight font-mono">
                    {selectedAuditDetails.audit.audit_id}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Location {selectedAuditDetails.audit.location_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAuditDetails(null)}
                className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Coordinates & Picker metadata */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500">Location ID</span>
                  <div className="font-mono font-bold text-gray-900 text-sm">
                    {selectedAuditDetails.audit.location_id}
                  </div>
                  <div className="text-gray-600 mt-0.5">
                    Floor {selectedAuditDetails.audit.floor} • Aisle {selectedAuditDetails.audit.aisle} • Rack {selectedAuditDetails.audit.rack} • Bin {selectedAuditDetails.audit.bin}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500">Auditor</span>
                  <div className="font-bold text-gray-900">
                    {selectedAuditDetails.audit.picker_name}
                  </div>
                  <div className="text-gray-500 font-mono text-[11px]">
                    ID: {selectedAuditDetails.audit.picker_id}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500">Zone / Storage</span>
                  <div className="font-semibold text-gray-800">
                    {selectedAuditDetails.audit.zone_type || 'Ambient'} • {selectedAuditDetails.audit.storage_type || 'Bin'}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500">Audit Timestamp</span>
                  <div className="font-mono text-gray-800">
                    {new Date(selectedAuditDetails.audit.created_at).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-xs font-bold uppercase text-gray-700 mb-2 flex items-center space-x-1">
                  <Package className="w-4 h-4 text-[#fc8019]" />
                  <span>Audited Items ({selectedAuditDetails.items.length})</span>
                </h4>

                <div className="divide-y divide-gray-200 border border-gray-200 rounded-2xl overflow-hidden">
                  {selectedAuditDetails.items.map((it) => (
                    <div key={it.id} className="p-3 bg-white space-y-2 text-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-gray-900">{it.sku_name || it.sku_id}</div>
                          <div className="text-[11px] font-mono text-gray-500">SKU: {it.sku_id}</div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          it.status === 'Available'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : it.status === 'Negative/Missing'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : it.status === 'Damaged'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-purple-100 text-purple-800 border border-purple-300'
                        }`}>
                          {it.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-gray-600">
                        <span className="font-semibold">Quantity Counted: {it.quantity}</span>
                        {it.photo_url && (
                          <a
                            href={it.photo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline flex items-center space-x-1"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>View Photo Proof</span>
                          </a>
                        )}
                      </div>

                      {it.remarks && (
                        <div className="p-2 rounded-lg bg-gray-50 text-gray-700 text-[11px] border border-gray-200">
                          <span className="font-bold text-gray-500">Remarks:</span> {it.remarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 text-right">
              <button
                onClick={() => setSelectedAuditDetails(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-xl"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
