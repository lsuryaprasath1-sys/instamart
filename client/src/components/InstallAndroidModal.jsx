import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  X, 
  CheckCircle2, 
  Layers, 
  ExternalLink, 
  Terminal, 
  Cpu, 
  Wifi, 
  ArrowRight,
  ShieldCheck,
  FileCode2,
  Package
} from 'lucide-react';

export default function InstallAndroidModal({ isOpen, onClose }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install on Android:\n1. Tap the 3 dots (⋮) in Chrome\n2. Tap "Install App" or "Add to Home screen"');
    }
  };

  const handleDownloadApk = () => {
    setDownloadStarted(true);
    // Trigger download
    const link = document.createElement('a');
    link.href = '/download/Swiggy_Instamart_Rack_Audit.apk';
    link.setAttribute('download', 'Swiggy_Instamart_Rack_Audit.apk');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadStarted(false);
    }, 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-[#1e1e24] text-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#fc8019] flex items-center justify-center text-white shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight">Android App & Scanner Terminal Setup</h3>
              <p className="text-[11px] text-gray-400">Download APK file or install standalone app on Android</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Option 1: Direct Android APK File Download */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 to-gray-900 border border-purple-600/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center">1</span>
                <h4 className="font-bold text-white text-sm">Download Android APK (Direct Install)</h4>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold">
                Recommended APK
              </span>
            </div>

            <p className="text-gray-300 leading-relaxed">
              Install the compiled Android package (<code className="text-purple-300">Swiggy_Instamart_Rack_Audit.apk</code>) directly onto your Android smartphone or Zebra/Honeywell scanner:
            </p>

            <button
              onClick={handleDownloadApk}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center space-x-2 active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>{downloadStarted ? 'Downloading APK Package...' : 'Download Swiggy_Instamart_Rack_Audit.apk'}</span>
            </button>

            {/* Android Install Instructions */}
            <div className="p-3 rounded-xl bg-black/40 border border-purple-900/50 space-y-1.5 text-[11px] text-gray-300">
              <span className="font-bold text-purple-300 block">How to install on your Android device:</span>
              <p>1. Tap the download button above or visit <code className="text-purple-300 font-mono">/download/Swiggy_Instamart_Rack_Audit.apk</code></p>
              <p>2. Open your device's <strong>Downloads</strong> folder and tap the downloaded APK</p>
              <p>3. If prompted, allow <em>"Install unknown apps"</em> for your browser or file manager</p>
              <p>4. Tap <strong>Install</strong> to add the Instamart Rack Audit app to your home screen</p>
            </div>
          </div>

          {/* Option 2: 1-Tap Progressive Web App (PWA) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-950/40 to-gray-900 border border-[#fc8019]/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-[#fc8019] text-white font-bold text-[10px] flex items-center justify-center">2</span>
                <h4 className="font-bold text-white text-sm">Instant 1-Tap Home Screen App (PWA)</h4>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                Zero Sideloading
              </span>
            </div>

            <p className="text-gray-300 leading-relaxed">
              Launch and install full-screen without side-loading APK files directly via Chrome:
            </p>

            <button
              onClick={handleInstallClick}
              className="w-full py-3 bg-[#fc8019] hover:bg-[#e07014] text-white font-black text-xs rounded-xl shadow-lg shadow-[#fc8019]/20 transition-all flex items-center justify-center space-x-2 active:scale-98"
            >
              <Package className="w-4 h-4" />
              <span>{isInstalled ? 'Already Installed on This Device' : 'Add to Android Home Screen'}</span>
            </button>
          </div>

          {/* Option 3: Android Studio & Capacitor Build */}
          <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-gray-700 text-white font-bold text-[10px] flex items-center justify-center">3</span>
                <h4 className="font-bold text-white text-sm">Capacitor Android Project (`/android`)</h4>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-[10px] font-mono">
                Source Code
              </span>
            </div>

            <p className="text-gray-400 text-[11px] leading-relaxed">
              The full Android Studio project is located in <code className="text-[#fc8019]">client/android/</code>. You can open it in Android Studio or build with Gradle:
            </p>

            <div className="bg-black/60 p-2.5 rounded-xl border border-gray-800 font-mono text-[11px] text-gray-300 space-y-1">
              <div className="text-emerald-400">cd client/android && gradlew.bat assembleDebug</div>
              <div className="text-gray-500"># Or run double-clickable script: build-apk.bat in root</div>
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Pre-configured with Camera barcode scanner, Flashlight, and Haptic feedback</span>
            </div>
          </div>

          {/* Warehouse Wi-Fi Scanner Terminal Access */}
          <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-gray-300 font-bold">
              <Wifi className="w-4 h-4 text-[#fc8019]" />
              <span>Connecting Handheld Scanners over Dark Store Wi-Fi:</span>
            </div>
            <p className="text-gray-400 leading-relaxed text-[11px]">
              Make sure your scanner terminal or smartphone is connected to the warehouse network, then open <code>http://&lt;server-ip&gt;:5000</code> in Chrome.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-gray-900 border-t border-gray-800 flex items-center justify-between">
          <a
            href="/download/Swiggy_Instamart_Rack_Audit.apk"
            className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center space-x-1"
            download
          >
            <Download className="w-3.5 h-3.5" />
            <span>Direct link: /download/Swiggy_Instamart_Rack_Audit.apk</span>
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-xl"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
