import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Filter, 
  Calendar, 
  Users, 
  ClipboardList, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Layers,
  CheckCircle2
} from 'lucide-react';
import { api, getToken } from '../utils/api';

export default function ReportsExportView() {
  const [format, setFormat] = useState('xlsx'); // 'xlsx' or 'csv'
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pickerId, setPickerId] = useState('');
  const [status, setStatus] = useState('');
  const [downloadingType, setDownloadingType] = useState('');

  const reportCards = [
    {
      id: 'audits',
      title: 'Warehouse Audit History',
      description: 'Complete manifest of audits submitted, coordinates, SKU counts, and completion statuses.',
      icon: ClipboardList,
      color: 'bg-[#fc8019]'
    },
    {
      id: 'negative-items',
      title: 'Negative / Missing Items Log',
      description: 'All discrepancy records, missing quantities, picker names, remarks, and resolution notes.',
      icon: AlertTriangle,
      color: 'bg-red-600'
    },
    {
      id: 'picker-performance',
      title: 'Picker Performance & Audit KPIs',
      description: 'Audit counts per picker, negative items flagged, resolved items, and activity hours.',
      icon: Users,
      color: 'bg-purple-600'
    },
    {
      id: 'login-history',
      title: 'Login & Shift Attendance History',
      description: 'Sign-in & sign-out timestamps, shift durations, active/inactive statuses, and IPs.',
      icon: Clock,
      color: 'bg-emerald-600'
    },
    {
      id: 'location-summary',
      title: 'Location-Wise Audit Coverage',
      description: 'Audit frequency breakdown per Floor-Aisle-Rack-Bin, SKUs checked, and last audit dates.',
      icon: MapPin,
      color: 'bg-blue-600'
    },
    {
      id: 'rack-negatives',
      title: 'Rack-Wise Discrepancy Summary',
      description: 'High discrepancy racks, total missing units, and open vs resolved issues aggregated by rack.',
      icon: Layers,
      color: 'bg-amber-600'
    }
  ];

  const handleDownload = async (reportId) => {
    setDownloadingType(reportId);
    try {
      const filters = {};
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;
      if (pickerId) filters.picker_id = pickerId;
      if (status) filters.status = status;

      const url = api.reports.getExportUrl(reportId, format, filters);
      
      // Fetch with Bearer token
      const token = getToken();
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Export generation failed');
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Instamart_${reportId}_Report_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert('Error downloading report: ' + err.message);
    } finally {
      setDownloadingType('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-5">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#fc8019] flex items-center justify-center text-white shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">
              Warehouse Analytics & Reports Export
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Export filtered warehouse audit datasets to Excel (.xlsx) or CSV for leadership reporting and auditing
          </p>
        </div>

        {/* Format Selector Pills */}
        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setFormat('xlsx')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              format === 'xlsx'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Excel (.xlsx)
          </button>
          <button
            onClick={() => setFormat('csv')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              format === 'csv'
                ? 'bg-white text-[#fc8019] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            CSV Format
          </button>
        </div>
      </div>

      {/* Filter Parameters */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200 space-y-3">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-700">
          <Filter className="w-4 h-4 text-[#fc8019]" />
          <span>Report Filter Parameters (Optional)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#fc8019]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#fc8019]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">Picker ID</label>
            <input
              type="text"
              placeholder="e.g. PKR-101"
              value={pickerId}
              onChange={(e) => setPickerId(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#fc8019]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full text-xs bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#fc8019]"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Under Review">Under Review</option>
              <option value="Resolved">Resolved</option>
              <option value="COMPLETED">Completed</option>
              <option value="FLAGGED">Flagged</option>
            </select>
          </div>
        </div>
      </div>

      {/* 6 Report Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCards.map((rep) => {
          const Icon = rep.icon;
          const isDownloading = downloadingType === rep.id;

          return (
            <div
              key={rep.id}
              className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-[#fc8019] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className={`w-10 h-10 rounded-xl ${rep.color} flex items-center justify-center text-white shadow-xs`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-sm text-gray-900 group-hover:text-[#fc8019] transition-colors">
                  {rep.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {rep.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDownload(rep.id)}
                disabled={isDownloading}
                className="w-full py-2.5 px-3 bg-gray-900 hover:bg-[#fc8019] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Generating File...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {format.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
