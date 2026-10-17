import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Flashlight, Barcode, Check, Search, AlertCircle, Sparkles } from 'lucide-react';
import { sounds } from '../utils/sound';
import { api } from '../utils/api';

export default function BarcodeScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [manualSku, setManualSku] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [torchOn, setTorchOn] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadCatalog();
      startCamera();
    } else {
      stopCamera();
      setManualSku('');
      setCameraError('');
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const loadCatalog = async () => {
    try {
      const data = await api.audits.getCatalog();
      setCatalog(data.catalog || []);
    } catch (e) {
      console.warn('Could not load catalog presets');
    }
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access not supported on this browser/environment.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera stream error:', err);
      setCameraError('Camera access unavailable or permission denied. Use demo barcodes or manual entry.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && track.getCapabilities && track.getCapabilities().torch) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !torchOn }],
        });
        setTorchOn(!torchOn);
      } catch (e) {
        console.warn('Torch not supported', e);
      }
    }
  };

  const handleBarcodeScanned = (barcode, productName = '') => {
    sounds.playScanSuccess();
    onScanSuccess(barcode, productName);
    onClose();
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualSku.trim()) return;

    const matched = catalog.find((c) => c.sku_id === manualSku.trim());
    handleBarcodeScanned(manualSku.trim(), matched ? matched.name : '');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-[#1e1e24] text-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-700 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#fc8019] flex items-center justify-center">
              <Barcode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Warehouse Barcode Scanner</h3>
              <p className="text-[11px] text-gray-400">Aim camera at SKU barcode or pick demo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport / Laser HUD */}
        <div className="relative bg-black h-56 sm:h-64 flex items-center justify-center overflow-hidden">
          {cameraActive ? (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-gray-400">
              <Camera className="w-12 h-12 text-gray-600 mb-2" />
              <p className="text-xs max-w-xs">{cameraError || 'Initializing warehouse optical feed...'}</p>
            </div>
          )}

          {/* Viewfinder Target Reticle */}
          <div className="relative w-64 h-36 border-2 border-white/60 rounded-2xl flex flex-col items-center justify-between p-2 shadow-2xl pointer-events-none">
            {/* Corner Markers */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-3 border-l-3 border-[#fc8019] rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-3 border-r-3 border-[#fc8019] rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-3 border-l-3 border-[#fc8019] rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-3 border-r-3 border-[#fc8019] rounded-br-lg"></div>

            {/* Red Laser Sweep Line */}
            <div className="animate-scan"></div>

            <div className="text-[10px] uppercase font-mono tracking-widest text-[#fc8019] bg-black/60 px-2 py-0.5 rounded-md mt-auto">
              Scan Viewport Active
            </div>
          </div>

          {/* Torch button */}
          {cameraActive && (
            <button
              onClick={toggleTorch}
              className={`absolute top-3 right-3 p-2 rounded-full border transition-colors ${
                torchOn ? 'bg-amber-400 text-gray-900 border-amber-300' : 'bg-black/50 text-white border-white/30'
              }`}
              title="Toggle Torch"
            >
              <Flashlight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Manual Entry Form */}
          <form onSubmit={handleManualSubmit} className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300 block">
              Scan / Enter SKU Barcode Manually:
            </label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. 8901030383756 or SKU Code"
                  value={manualSku}
                  onChange={(e) => setManualSku(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#fc8019] font-mono"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="bg-[#fc8019] hover:bg-[#e07014] text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md active:scale-95 shrink-0"
              >
                <Check className="w-4 h-4" />
                <span>Confirm</span>
              </button>
            </div>
          </form>

          {/* Quick Demo Barcodes Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-[#fc8019]" />
                <span>1-Tap Instamart Demo SKUs</span>
              </span>
              <span className="text-[10px] text-gray-500">Tap to instantly simulate scan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {catalog.map((item) => (
                <button
                  key={item.sku_id}
                  type="button"
                  onClick={() => handleBarcodeScanned(item.sku_id, item.name)}
                  className="text-left p-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700 hover:border-[#fc8019] transition-all flex items-start justify-between group active:scale-95"
                >
                  <div className="pr-2">
                    <div className="text-xs font-semibold text-white group-hover:text-[#fc8019] line-clamp-1">
                      {item.name}
                    </div>
                    <div className="text-[11px] font-mono text-gray-400">{item.sku_id}</div>
                  </div>
                  <span className="text-[9px] bg-gray-900 px-1.5 py-0.5 rounded text-gray-300 shrink-0 font-medium border border-gray-700">
                    {item.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-900 border-t border-gray-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs rounded-xl transition-colors"
          >
            Cancel & Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
}
