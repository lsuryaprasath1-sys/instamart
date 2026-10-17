import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle2, RotateCcw, AlertCircle, Info, ChevronRight, Layers } from 'lucide-react';
import { api } from '../utils/api';

export default function LocationSelector({ selectedLocation, onLocationSelect, disabled = false }) {
  const [floors, setFloors] = useState([]);
  const [aisles, setAisles] = useState([]);
  const [racks, setRacks] = useState([]);
  const [bins, setBins] = useState([]);

  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedAisle, setSelectedAisle] = useState('');
  const [selectedRack, setSelectedRack] = useState('');
  const [selectedBin, setSelectedBin] = useState('');

  const [locationDetails, setLocationDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Load floors on initial mount
  useEffect(() => {
    fetchFloors();
  }, []);

  // Sync if parent clears or passes selectedLocation
  useEffect(() => {
    if (!selectedLocation) {
      handleReset();
    }
  }, [selectedLocation]);

  const fetchFloors = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.locations.query({});
      setFloors(data.floors || []);
    } catch (err) {
      setError('Unable to load warehouse floors from Location Master');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: When floor is selected, fetch aisles
  const handleFloorChange = async (e) => {
    const floor = e.target.value;
    setSelectedFloor(floor);
    setSelectedAisle('');
    setSelectedRack('');
    setSelectedBin('');
    setLocationDetails(null);
    setAisles([]);
    setRacks([]);
    setBins([]);
    onLocationSelect(null);

    if (!floor) return;

    setLoading(true);
    try {
      const data = await api.locations.query({ floor });
      setAisles(data.aisles || []);
    } catch (err) {
      setError('Error loading aisles for selected floor');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: When aisle is selected, fetch racks
  const handleAisleChange = async (e) => {
    const aisle = e.target.value;
    setSelectedAisle(aisle);
    setSelectedRack('');
    setSelectedBin('');
    setLocationDetails(null);
    setRacks([]);
    setBins([]);
    onLocationSelect(null);

    if (!aisle) return;

    setLoading(true);
    try {
      const data = await api.locations.query({ floor: selectedFloor, aisle });
      setRacks(data.racks || []);
    } catch (err) {
      setError('Error loading racks for selected aisle');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: When rack is selected, fetch bins
  const handleRackChange = async (e) => {
    const rack = e.target.value;
    setSelectedRack(rack);
    setSelectedBin('');
    setLocationDetails(null);
    setBins([]);
    onLocationSelect(null);

    if (!rack) return;

    setLoading(true);
    try {
      const data = await api.locations.query({ floor: selectedFloor, aisle: selectedAisle, rack });
      setBins(data.bins || []);
    } catch (err) {
      setError('Error loading bins for selected rack');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: When bin is selected, fetch full details & auto-generate Location ID
  const handleBinChange = async (e) => {
    const bin = e.target.value;
    setSelectedBin(bin);

    if (!bin) {
      setLocationDetails(null);
      onLocationSelect(null);
      return;
    }

    setLoading(true);
    try {
      const data = await api.locations.query({
        floor: selectedFloor,
        aisle: selectedAisle,
        rack: selectedRack,
        bin,
      });

      if (data.location) {
        setLocationDetails(data.location);
        onLocationSelect(data.location);
      }
    } catch (err) {
      setError('Error loading complete location metadata');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFloor('');
    setSelectedAisle('');
    setSelectedRack('');
    setSelectedBin('');
    setLocationDetails(null);
    setAisles([]);
    setRacks([]);
    setBins([]);
    onLocationSelect(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-[#fc8019] flex items-center justify-center text-white">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Step 1: Select Warehouse Location</h3>
            <p className="text-[11px] text-gray-400">Strict Location Master dependent flow</p>
          </div>
        </div>

        {locationDetails && (
          <button
            onClick={handleReset}
            disabled={disabled}
            className="flex items-center space-x-1 text-xs bg-gray-700/80 hover:bg-gray-700 text-gray-200 px-2.5 py-1 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Change</span>
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Dependent Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Dropdown 1: Floor */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              1. Floor <span className="text-[#fc8019]">*</span>
            </label>
            <select
              value={selectedFloor}
              onChange={handleFloorChange}
              disabled={disabled || loading || floors.length === 0}
              className="w-full text-sm font-semibold bg-gray-50 border-2 border-gray-300 rounded-xl px-3 py-2.5 focus:border-[#fc8019] focus:bg-white focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">-- Choose Floor --</option>
              {floors.map((f) => (
                <option key={f} value={f}>
                  Floor {f}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 2: Aisle */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              2. Aisle <span className="text-[#fc8019]">*</span>
            </label>
            <select
              value={selectedAisle}
              onChange={handleAisleChange}
              disabled={disabled || loading || !selectedFloor || aisles.length === 0}
              className="w-full text-sm font-semibold bg-gray-50 border-2 border-gray-300 rounded-xl px-3 py-2.5 focus:border-[#fc8019] focus:bg-white focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">{selectedFloor ? '-- Choose Aisle --' : 'Select Floor 1st'}</option>
              {aisles.map((a) => (
                <option key={a} value={a}>
                  Aisle {a}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 3: Rack */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              3. Rack <span className="text-[#fc8019]">*</span>
            </label>
            <select
              value={selectedRack}
              onChange={handleRackChange}
              disabled={disabled || loading || !selectedAisle || racks.length === 0}
              className="w-full text-sm font-semibold bg-gray-50 border-2 border-gray-300 rounded-xl px-3 py-2.5 focus:border-[#fc8019] focus:bg-white focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">{selectedAisle ? '-- Choose Rack --' : 'Select Aisle 1st'}</option>
              {racks.map((r) => (
                <option key={r} value={r}>
                  Rack {r}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown 4: Bin */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              4. Bin <span className="text-[#fc8019]">*</span>
            </label>
            <select
              value={selectedBin}
              onChange={handleBinChange}
              disabled={disabled || loading || !selectedRack || bins.length === 0}
              className="w-full text-sm font-semibold bg-gray-50 border-2 border-gray-300 rounded-xl px-3 py-2.5 focus:border-[#fc8019] focus:bg-white focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">{selectedRack ? '-- Choose Bin --' : 'Select Rack 1st'}</option>
              {bins.map((b) => (
                <option key={b} value={b}>
                  Bin {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Location Confirmation & Auto-filled Metadata */}
        {locationDetails ? (
          <div className="mt-4 p-4 rounded-xl bg-orange-50/70 border-2 border-[#fc8019]/40 space-y-3 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-200/60 pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#fc8019]">Computed Location ID</span>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-black tracking-tight text-gray-900 font-mono">
                    {locationDetails.location_id}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Validated
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-gray-500">Rack Coordinate</span>
                <div className="text-xs font-semibold text-gray-700">
                  Floor {locationDetails.floor} &gt; Aisle {locationDetails.aisle} &gt; Rack {locationDetails.rack} &gt; Bin {locationDetails.bin}
                </div>
              </div>
            </div>

            {/* Auto-filled details row as specified */}
            <div>
              <div className="text-[11px] font-bold text-gray-600 mb-1.5 flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-[#fc8019]" />
                <span>Auto-retrieved Location Master Properties:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-orange-200 shadow-2xs">
                  <span className="text-[10px] text-gray-500 block uppercase font-semibold">Rank</span>
                  <span className="font-bold text-gray-800">{locationDetails.rank || 'N/A'}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-orange-200 shadow-2xs">
                  <span className="text-[10px] text-gray-500 block uppercase font-semibold">Zone Type</span>
                  <span className="font-bold text-[#fc8019]">{locationDetails.zone_type || 'Standard'}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-orange-200 shadow-2xs">
                  <span className="text-[10px] text-gray-500 block uppercase font-semibold">FC Op Type</span>
                  <span className="font-bold text-gray-800">{locationDetails.primary_fc_operation_type || 'Pick'}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-orange-200 shadow-2xs">
                  <span className="text-[10px] text-gray-500 block uppercase font-semibold">Rack Type</span>
                  <span className="font-bold text-gray-800">{locationDetails.rack_type || 'Standard'}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-orange-200 shadow-2xs">
                  <span className="text-[10px] text-gray-500 block uppercase font-semibold">Space Type</span>
                  <span className="font-bold text-gray-800">{locationDetails.space_type || 'Shelf'}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-orange-200 shadow-2xs">
                  <span className="text-[10px] text-gray-500 block uppercase font-semibold">Storage Type</span>
                  <span className="font-bold text-gray-800">{locationDetails.storage_type || 'Bin'}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-gray-50 border border-dashed border-gray-300 text-center text-xs text-gray-500 flex items-center justify-center space-x-2">
            <Info className="w-4 h-4 text-gray-400" />
            <span>Follow the 4 steps above to select a warehouse location before scanning items.</span>
          </div>
        )}
      </div>
    </div>
  );
}
