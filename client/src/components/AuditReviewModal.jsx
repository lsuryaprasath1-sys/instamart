import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  MapPin, 
  User, 
  Clock, 
  Package, 
  Layers, 
  ArrowLeft,
  Send,
  Camera
} from 'lucide-react';

export default function AuditReviewModal({
  isOpen,
  onClose,
  onSubmit,
  submitting,
  location,
  items,
  user
}) {
  if (!isOpen) return null;

  const negativeItems = items.filter(it => it.status === 'Negative/Missing');
  const damagedItems = items.filter(it => it.status === 'Damaged');
  const mismatchItems = items.filter(it => it.status === 'Mismatch');
  const availableItems = items.filter(it => it.status === 'Available');

  const nowFormatted = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
      <div className="bg-white text-gray-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#fc8019] flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Review Rack Audit Submission</h3>
              <p className="text-xs text-gray-400">Verify location coordinates and audited SKU counts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Negative Item Warning Banner */}
          {negativeItems.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-300 text-red-800 flex items-start space-x-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-red-900">
                  {negativeItems.length} Negative/Missing Item(s) Flagged!
                </h4>
                <p className="text-xs text-red-700 mt-0.5">
                  Submitting will automatically log these items into the warehouse Negative Items Hub for supervisor investigation and inventory reconciliation.
                </p>
              </div>
            </div>
          )}

          {/* Location & Auditor Card */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-[#fc8019]" />
                <span>Audited Warehouse Location</span>
              </span>
              <div className="font-mono text-xl font-black text-gray-900 flex items-center space-x-2">
                <span>{location?.location_id}</span>
              </div>
              <div className="text-xs text-gray-600 mt-1 font-medium">
                Floor {location?.floor} • Aisle {location?.aisle} • Rack {location?.rack} • Bin {location?.bin}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                Zone: <span className="font-bold text-[#fc8019]">{location?.zone_type}</span> | Storage: {location?.storage_type}
              </div>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-gray-200 pt-3 sm:pt-0 sm:pl-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1 flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-[#fc8019]" />
                <span>Auditor Details & Timestamp</span>
              </span>
              <div className="text-sm font-bold text-gray-900">{user?.name}</div>
              <div className="text-xs text-gray-600 font-mono">Picker ID: {user?.picker_id}</div>
              <div className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{nowFormatted}</span>
              </div>
            </div>
          </div>

          {/* Counts Bar */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-gray-100 border border-gray-200">
              <span className="block text-[10px] uppercase font-bold text-gray-500">Total SKUs</span>
              <span className="text-lg font-black text-gray-900">{items.length}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="block text-[10px] uppercase font-bold text-emerald-700">Available</span>
              <span className="text-lg font-black text-emerald-700">{availableItems.length}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200">
              <span className="block text-[10px] uppercase font-bold text-red-700">Missing</span>
              <span className="text-lg font-black text-red-700">{negativeItems.length}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="block text-[10px] uppercase font-bold text-amber-700">Damaged/Other</span>
              <span className="text-lg font-black text-amber-700">{damagedItems.length + mismatchItems.length}</span>
            </div>
          </div>

          {/* SKU Items Breakdown List */}
          <div>
            <h4 className="text-xs font-bold uppercase text-gray-700 mb-2 flex items-center space-x-1">
              <Package className="w-4 h-4 text-[#fc8019]" />
              <span>Audited Item Manifest ({items.length})</span>
            </h4>

            <div className="divide-y divide-gray-200 border border-gray-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 bg-white flex items-start justify-between space-x-3 text-xs">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900">{item.sku_name || item.sku_id}</span>
                      <span className="font-mono text-gray-500 text-[11px]">({item.sku_id})</span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-gray-600 font-semibold">Qty: {item.quantity}</span>
                      {item.remarks && (
                        <span className="text-gray-500 italic">
                          • Remarks: "{item.remarks}"
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 space-y-1">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                      item.status === 'Available'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : item.status === 'Negative/Missing'
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : item.status === 'Damaged'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-purple-100 text-purple-800 border border-purple-300'
                    }`}>
                      {item.status}
                    </span>

                    {item.photo_url && (
                      <span className="text-[10px] text-blue-600 flex items-center space-x-0.5">
                        <Camera className="w-3 h-3" />
                        <span>Photo attached</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-3 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl border border-gray-300 transition-colors flex items-center space-x-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Edit Audit</span>
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="flex-1 py-3 bg-[#fc8019] hover:bg-[#e07014] text-white font-black text-sm rounded-xl shadow-lg shadow-[#fc8019]/30 transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Submitting Audit...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <Send className="w-4 h-4" />
                <span>Confirm & Submit Audit</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
