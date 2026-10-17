import React, { useState, useEffect } from 'react';
import { 
  ScanLine, 
  Plus, 
  Trash2, 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  MapPin, 
  User, 
  Clock, 
  Sparkles, 
  Info, 
  ArrowRight,
  Package,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import LocationSelector from '../components/LocationSelector';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import AuditReviewModal from '../components/AuditReviewModal';
import { api } from '../utils/api';
import { sounds } from '../utils/sound';

export default function NewAuditView({ user, onAuditSubmitted }) {
  // Current date/time display
  const [currentDateTime, setCurrentDateTime] = useState('');
  
  // Location selection state
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Audited Items manifest
  const [items, setItems] = useState([
    {
      id: 1,
      sku_id: '',
      sku_name: '',
      quantity: 1,
      status: 'Available',
      remarks: '',
      photo_url: null,
      photo_preview: null,
      uploading_photo: false
    }
  ]);

  // Modals & UI States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeItemIndexForScan, setActiveItemIndexForScan] = useState(0);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  // Submission Success State
  const [submittedAuditResult, setSubmittedAuditResult] = useState(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Item management
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        sku_id: '',
        sku_name: '',
        quantity: 1,
        status: 'Available',
        remarks: '',
        photo_url: null,
        photo_preview: null,
        uploading_photo: false
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      // Clear instead of removing last item
      setItems([{
        id: Date.now(),
        sku_id: '',
        sku_name: '',
        quantity: 1,
        status: 'Available',
        remarks: '',
        photo_url: null,
        photo_preview: null,
        uploading_photo: false
      }]);
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const openScannerForItem = (index) => {
    setActiveItemIndexForScan(index);
    setIsScannerOpen(true);
  };

  const handleScanSuccess = async (barcode, productName) => {
    const next = [...items];
    next[activeItemIndexForScan].sku_id = barcode;
    if (productName) {
      next[activeItemIndexForScan].sku_name = productName;
    } else {
      // Try catalog lookup
      try {
        const res = await api.audits.lookupSku(barcode);
        if (res.product) {
          next[activeItemIndexForScan].sku_name = res.product.name;
        }
      } catch (e) {}
    }
    setItems(next);
  };

  // Photo upload handling
  const handlePhotoUpload = async (index, file) => {
    if (!file) return;

    handleItemChange(index, 'uploading_photo', true);
    const previewUrl = URL.createObjectURL(file);
    handleItemChange(index, 'photo_preview', previewUrl);

    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await api.audits.uploadPhoto(formData);
      handleItemChange(index, 'photo_url', res.url);
    } catch (err) {
      alert('Photo upload failed: ' + err.message);
    } finally {
      handleItemChange(index, 'uploading_photo', false);
    }
  };

  // Validation before opening review modal
  const handleValidateAndReview = () => {
    setValidationError('');

    if (!selectedLocation) {
      setValidationError('Warehouse location is required. Please complete Floor, Aisle, Rack, and Bin selection.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (items.length === 0) {
      setValidationError('At least one SKU item is required.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.sku_id.trim()) {
        setValidationError(`Item #${i + 1}: SKU ID is mandatory. Please enter or scan a barcode.`);
        return;
      }

      if (it.quantity === '' || parseInt(it.quantity, 10) < 0) {
        setValidationError(`Item #${i + 1} (${it.sku_id}): Quantity must be 0 or greater.`);
        return;
      }

      // Negative/Missing rule: SKU ID, Quantity, and Remarks are MANDATORY
      if (it.status === 'Negative/Missing') {
        if (!it.remarks.trim()) {
          setValidationError(`Item #${i + 1} (${it.sku_id}): Remarks are strictly mandatory for Negative/Missing items to describe inventory discrepancy.`);
          return;
        }
      }
    }

    setIsReviewOpen(true);
  };

  // Final submission after review
  const handleSubmitAudit = async () => {
    setSubmitting(true);
    setValidationError('');

    try {
      const payload = {
        location: selectedLocation,
        items: items.map(it => ({
          sku_id: it.sku_id.trim(),
          sku_name: it.sku_name.trim() || undefined,
          quantity: parseInt(it.quantity, 10),
          status: it.status,
          remarks: it.remarks.trim(),
          photo_url: it.photo_url
        }))
      };

      const result = await api.audits.create(payload);

      // Trigger celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      sounds.playScanSuccess();

      setSubmittedAuditResult(result);
      setIsReviewOpen(false);

      if (onAuditSubmitted) {
        onAuditSubmitted(result);
      }
    } catch (err) {
      setValidationError(err.message || 'Audit submission failed.');
      setIsReviewOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset for new audit
  const handleStartAnotherAudit = () => {
    setSelectedLocation(null);
    setItems([
      {
        id: Date.now(),
        sku_id: '',
        sku_name: '',
        quantity: 1,
        status: 'Available',
        remarks: '',
        photo_url: null,
        photo_preview: null,
        uploading_photo: false
      }
    ]);
    setSubmittedAuditResult(null);
    setValidationError('');
  };

  // If already submitted successfully, show confirmation screen
  if (submittedAuditResult) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-gray-200 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs uppercase font-extrabold text-emerald-600 tracking-wider">Audit Recorded Successfully</span>
            <h2 className="text-2xl font-black text-gray-900 mt-1">Audit Completed!</h2>
            <div className="mt-2 inline-flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-300">
              <span className="text-xs text-gray-500 font-semibold">Unique Audit ID:</span>
              <span className="text-sm font-mono font-black text-gray-900">{submittedAuditResult.audit_id}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-left space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Location ID:</span>
              <span className="font-mono font-bold text-gray-900">{submittedAuditResult.location_id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Audited By:</span>
              <span className="font-bold text-gray-900">{user?.name} ({user?.picker_id})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-500">Total SKUs Checked:</span>
              <span className="font-bold text-gray-900">{submittedAuditResult.total_skus}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Negative/Missing SKUs:</span>
              <span className={`font-bold ${submittedAuditResult.negative_items_count > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {submittedAuditResult.negative_items_count}
              </span>
            </div>
          </div>

          <button
            onClick={handleStartAnotherAudit}
            className="w-full py-3.5 bg-[#fc8019] hover:bg-[#e07014] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#fc8019]/30 transition-all flex items-center justify-center space-x-2 active:scale-98"
          >
            <Plus className="w-5 h-5" />
            <span>Perform Next Rack Audit</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-5">
      {/* Picker Info & Real-Time Header */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#fc8019] flex items-center justify-center font-bold text-base">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-extrabold text-gray-900">{user?.name}</h2>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-mono font-bold border border-gray-300">
                {user?.picker_id}
              </span>
            </div>
            <div className="text-[11px] text-gray-500 font-medium">Logged in warehouse picker session</div>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-600 font-mono">
          <Clock className="w-3.5 h-3.5 text-[#fc8019]" />
          <span>{currentDateTime}</span>
        </div>
      </div>

      {/* Error alert if validation fails */}
      {validationError && (
        <div className="p-3.5 rounded-2xl bg-red-50 border-2 border-red-300 text-red-800 text-xs flex items-start space-x-2.5 animate-shake">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="font-medium">{validationError}</div>
        </div>
      )}

      {/* Step 1: Strict Dependent Dropdown Location Selector */}
      <LocationSelector
        selectedLocation={selectedLocation}
        onLocationSelect={setSelectedLocation}
      />

      {/* Step 2: Multi-SKU Items Audit Section */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        {/* Section Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#fc8019] flex items-center justify-center text-white">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Step 2: Audit Rack SKUs ({items.length})</h3>
              <p className="text-[11px] text-gray-400">Scan or type SKU, set count, flag status & capture photo</p>
            </div>
          </div>

          <button
            onClick={handleAddItem}
            className="flex items-center space-x-1 text-xs bg-[#fc8019] hover:bg-[#e07014] text-white px-3 py-1.5 rounded-xl font-bold shadow-xs transition-colors active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add SKU</span>
          </button>
        </div>

        {/* Items List */}
        <div className="p-3 sm:p-5 space-y-4">
          {items.map((item, index) => {
            const isNegative = item.status === 'Negative/Missing';
            const isDamaged = item.status === 'Damaged';
            const isMismatch = item.status === 'Mismatch';

            return (
              <div
                key={item.id}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all space-y-3 ${
                  isNegative
                    ? 'bg-red-50/70 border-red-300'
                    : isDamaged
                    ? 'bg-amber-50/70 border-amber-300'
                    : isMismatch
                    ? 'bg-purple-50/70 border-purple-300'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                {/* Item Card Header */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-gray-900 text-white font-mono text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-gray-800">
                      SKU Item #{index + 1}
                    </span>
                    {item.sku_name && (
                      <span className="text-xs text-gray-600 font-medium truncate max-w-[200px] sm:max-w-xs">
                        • {item.sku_name}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="p-1 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove SKU item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* SKU Barcode Field + Scanner Launcher */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      SKU Barcode / ID <span className="text-[#fc8019]">*</span>
                    </label>
                    <div className="flex space-x-1.5">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Enter SKU barcode or code"
                          value={item.sku_id}
                          onChange={(e) => handleItemChange(index, 'sku_id', e.target.value)}
                          className="w-full text-sm font-mono font-bold bg-white border-2 border-gray-300 rounded-xl px-3 py-2 focus:border-[#fc8019] focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => openScannerForItem(index)}
                        className="bg-[#fc8019] hover:bg-[#e07014] text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shrink-0 shadow-xs active:scale-95 transition-all"
                        title="Scan with camera or pick demo barcode"
                      >
                        <ScanLine className="w-4 h-4" />
                        <span className="hidden sm:inline">Scan Barcode</span>
                      </button>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Physical Quantity <span className="text-[#fc8019]">*</span>
                    </label>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleItemChange(index, 'quantity', Math.max(0, (parseInt(item.quantity, 10) || 0) - 1))}
                        className="w-9 h-9 rounded-xl bg-gray-200 hover:bg-gray-300 font-bold text-sm text-gray-800 flex items-center justify-center shrink-0 active:scale-95"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-full text-center text-sm font-bold bg-white border-2 border-gray-300 rounded-xl py-1.5 focus:border-[#fc8019] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleItemChange(index, 'quantity', (parseInt(item.quantity, 10) || 0) + 1)}
                        className="w-9 h-9 rounded-xl bg-gray-200 hover:bg-gray-300 font-bold text-sm text-gray-800 flex items-center justify-center shrink-0 active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* SKU Status Selector - 4 Required Choices */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Item Audit Status <span className="text-[#fc8019]">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { status: 'Available', label: 'Available', color: 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold' },
                      { status: 'Negative/Missing', label: 'Negative / Missing', color: 'border-red-500 bg-red-100 text-red-900 font-black' },
                      { status: 'Damaged', label: 'Damaged', color: 'border-amber-500 bg-amber-50 text-amber-800 font-bold' },
                      { status: 'Mismatch', label: 'Mismatch', color: 'border-purple-500 bg-purple-50 text-purple-800 font-bold' },
                    ].map((btn) => {
                      const isSelected = item.status === btn.status;
                      return (
                        <button
                          key={btn.status}
                          type="button"
                          onClick={() => handleItemChange(index, 'status', btn.status)}
                          className={`py-2 px-2 rounded-xl text-xs border-2 text-center transition-all ${
                            isSelected
                              ? `${btn.color} shadow-xs scale-102`
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Remarks & Photo Proof row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                  {/* Remarks Field (Mandatory if Negative/Missing) */}
                  <div className="sm:col-span-8">
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                      <span>Remarks {isNegative && <span className="text-red-600">(Mandatory for Missing Items)*</span>}</span>
                      <span className="text-[10px] text-gray-400">Explain condition or missing count</span>
                    </label>
                    <input
                      type="text"
                      placeholder={isNegative ? "Mandatory: e.g. 3 units missing from bin inventory" : "Optional notes, damage description, or observations"}
                      value={item.remarks}
                      onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                      className={`w-full text-xs bg-white border-2 rounded-xl px-3 py-2 focus:outline-none ${
                        isNegative && !item.remarks.trim()
                          ? 'border-red-400 focus:border-red-500'
                          : 'border-gray-300 focus:border-[#fc8019]'
                      }`}
                    />
                  </div>

                  {/* Photo Upload / Camera snap */}
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Photo Proof {(isDamaged || isNegative || isMismatch) && <span className="text-amber-600">(Recommended)</span>}
                    </label>
                    <div className="flex items-center space-x-2">
                      <label className="flex-1 cursor-pointer py-1.5 px-3 bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 hover:border-[#fc8019] rounded-xl text-xs text-gray-600 flex items-center justify-center space-x-1.5 transition-colors">
                        <Camera className="w-4 h-4 text-gray-500" />
                        <span className="truncate">
                          {item.uploading_photo ? 'Uploading...' : item.photo_url ? 'Replace Photo' : 'Upload / Snap'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => handlePhotoUpload(index, e.target.files[0])}
                        />
                      </label>

                      {item.photo_preview && (
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-gray-300 shrink-0">
                          <img
                            src={item.photo_preview}
                            alt="Proof thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Another Item Button */}
          <button
            type="button"
            onClick={handleAddItem}
            className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-[#fc8019] bg-gray-50/50 hover:bg-orange-50/30 rounded-2xl text-xs font-bold text-gray-600 hover:text-[#fc8019] transition-all flex items-center justify-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another SKU to this Rack Audit</span>
          </button>
        </div>
      </div>

      {/* Review & Submit Bottom Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-gray-800">
            {items.length} SKU(s) Prepared for Audit
          </div>
          <div className="text-[11px] text-gray-500">
            Location: <span className="font-mono font-bold text-[#fc8019]">{selectedLocation ? selectedLocation.location_id : 'Not Selected'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleValidateAndReview}
          className="w-full sm:w-auto px-6 py-3.5 bg-[#fc8019] hover:bg-[#e07014] text-white font-black text-sm rounded-xl shadow-lg shadow-[#fc8019]/30 transition-all flex items-center justify-center space-x-2 active:scale-98"
        >
          <FileCheck className="w-5 h-5" />
          <span>Review & Submit Audit</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Pre-Submission Review Modal */}
      <AuditReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onSubmit={handleSubmitAudit}
        submitting={submitting}
        location={selectedLocation}
        items={items}
        user={user}
      />
    </div>
  );
}
