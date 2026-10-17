import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  UploadCloud, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Layers, 
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../utils/api';

export default function LocationMasterView() {
  const [stats, setStats] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // CSV Upload State
  const [file, setFile] = useState(null);
  const [uploadMode, setUploadMode] = useState('replace'); // 'replace' or 'append'
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    fetchLocationsData();
  }, []);

  const fetchLocationsData = async () => {
    setLoading(true);
    try {
      const [statsData, hierarchyData] = await Promise.all([
        api.locations.getStats(),
        api.locations.getHierarchy(),
      ]);
      setStats(statsData);
      setLocations(hierarchyData.locations || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setUploadResult(null);
      setUploadError('');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a CSV file to upload.');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', uploadMode);

    try {
      const res = await api.locations.uploadCsv(formData);
      setUploadResult(res);
      setFile(null);
      fetchLocationsData();
    } catch (err) {
      setUploadError(err.message || 'CSV upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const filteredLocations = locations.filter(l =>
    l.location_id.toLowerCase().includes(search.toLowerCase()) ||
    (l.zone_type && l.zone_type.toLowerCase().includes(search.toLowerCase())) ||
    l.floor.toLowerCase().includes(search.toLowerCase()) ||
    l.aisle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-5">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#fc8019] flex items-center justify-center text-white shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">
              Warehouse Location Master Control
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Single Source of Truth: Pickers can only audit locations defined in this uploaded master
          </p>
        </div>

        <a
          href={api.locations.getSampleCsvUrl()}
          download="Location_Master_Template.csv"
          className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#fc8019]" />
          <span>Download Sample Template CSV</span>
        </a>
      </div>

      {/* Warehouse Location Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Total Locations</span>
            <span className="text-xl font-black text-[#fc8019]">{stats.total_locations}</span>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Floors</span>
            <span className="text-xl font-black text-gray-900">{stats.total_floors}</span>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Aisles</span>
            <span className="text-xl font-black text-gray-900">{stats.total_aisles}</span>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Racks</span>
            <span className="text-xl font-black text-gray-900">{stats.total_racks}</span>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs text-center">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Unique Bins</span>
            <span className="text-xl font-black text-gray-900">{stats.total_bins}</span>
          </div>
        </div>
      )}

      {/* CSV Upload Section */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-black text-gray-900 flex items-center space-x-2">
            <UploadCloud className="w-5 h-5 text-[#fc8019]" />
            <span>Upload & Synchronize Location Master CSV</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            CSV must include headers: Floor, Aisle, Rack, Bin, Rank, ZoneType, PrimaryFcOperationType, RackType, SpaceType, StorageType
          </p>
        </div>

        {uploadError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadResult && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <div>
              <span className="font-bold">{uploadResult.message}</span>
              <span className="block text-[11px] text-emerald-700 mt-0.5">
                Total warehouse locations now available for dependent audits: {uploadResult.total_locations}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 hover:border-[#fc8019] rounded-2xl p-6 text-center transition-colors bg-gray-50/50">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="location-csv-input"
            />
            <label htmlFor="location-csv-input" className="cursor-pointer block">
              <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-gray-700">
                {file ? file.name : 'Click to select Location Master CSV or drag and drop'}
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">Supported format: .csv</span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-4 text-xs">
              <span className="font-bold text-gray-700">Upload Mode:</span>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="replace"
                  checked={uploadMode === 'replace'}
                  onChange={() => setUploadMode('replace')}
                  className="accent-[#fc8019]"
                />
                <span className="font-semibold text-gray-800">Replace Entire Warehouse</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="append"
                  checked={uploadMode === 'append'}
                  onChange={() => setUploadMode('append')}
                  className="accent-[#fc8019]"
                />
                <span className="font-semibold text-gray-800">Append / Upsert</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="px-6 py-2.5 bg-[#fc8019] hover:bg-[#e07014] text-white font-black text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {uploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Importing CSV...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload & Validate CSV</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Active Location Master Browser Table */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-gray-900 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-[#fc8019]" />
              <span>Active Warehouse Locations ({filteredLocations.length})</span>
            </h3>
            <p className="text-[11px] text-gray-500">Pickers can select only from these validated coordinates</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by Location ID or Zone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#fc8019]"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-400">Loading location master data...</div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-900 text-white uppercase text-[10px] tracking-wider sticky top-0">
                <tr>
                  <th className="p-2.5">Location ID</th>
                  <th className="p-2.5">Floor</th>
                  <th className="p-2.5">Aisle</th>
                  <th className="p-2.5">Rack</th>
                  <th className="p-2.5">Bin</th>
                  <th className="p-2.5">Zone Type</th>
                  <th className="p-2.5">FC Op</th>
                  <th className="p-2.5">Rack Type</th>
                  <th className="p-2.5">Storage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLocations.slice(0, 100).map((loc) => (
                  <tr key={loc.id} className="hover:bg-orange-50/40 transition-colors">
                    <td className="p-2.5 font-mono font-bold text-gray-900">{loc.location_id}</td>
                    <td className="p-2.5 text-gray-700">{loc.floor}</td>
                    <td className="p-2.5 text-gray-700">{loc.aisle}</td>
                    <td className="p-2.5 text-gray-700">{loc.rack}</td>
                    <td className="p-2.5 text-gray-700">{loc.bin}</td>
                    <td className="p-2.5 font-bold text-[#fc8019]">{loc.zone_type || 'Ambient'}</td>
                    <td className="p-2.5 text-gray-600">{loc.primary_fc_operation_type || 'Pick'}</td>
                    <td className="p-2.5 text-gray-600">{loc.rack_type || 'Standard'}</td>
                    <td className="p-2.5 text-gray-600">{loc.storage_type || 'Bin'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
