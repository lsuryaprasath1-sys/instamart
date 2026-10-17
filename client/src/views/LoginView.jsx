import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  HelpCircle, 
  CheckCircle2, 
  ShieldCheck, 
  PhoneCall, 
  X,
  Sparkles,
  Smartphone,
  KeyRound,
  RotateCcw,
  Clock,
  Shield,
  Check
} from 'lucide-react';
import { api, setToken, setCurrentUser } from '../utils/api';

export default function LoginView({ onLoginSuccess }) {
  // Mode: 'picker' or 'admin'
  const [loginMode, setLoginMode] = useState('picker');

  // Picker mode states
  const [pickerId, setPickerId] = useState('');
  const [password, setPassword] = useState('');

  // Admin phone & OTP states
  const [adminPhone, setAdminPhone] = useState('9876543210');
  const [adminOtp, setAdminOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpPreview, setOtpPreview] = useState('');
  const [adminDetails, setAdminDetails] = useState(null);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Common UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Handle Picker Login Form
  const handlePickerSubmit = async (e) => {
    e.preventDefault();
    if (!pickerId.trim() || !password.trim()) {
      setError('Please enter both Picker ID and Password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const data = await api.auth.login(pickerId.trim(), password);
      setToken(data.token);
      setCurrentUser(data.user);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin Send OTP
  const handleSendAdminOtp = async (e) => {
    if (e) e.preventDefault();
    if (!adminPhone.trim()) {
      setError('Please enter a valid Admin mobile number.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.auth.sendAdminOtp(adminPhone.trim());
      setOtpSent(true);
      setOtpPreview(res.otp_preview);
      setAdminDetails({ name: res.admin_name, phone: res.phone });
      setOtpCountdown(300); // 5 minutes
      setSuccessMsg(`OTP sent to +91 ${res.phone}`);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please check mobile number.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin Verify OTP
  const handleVerifyAdminOtp = async (e) => {
    if (e) e.preventDefault();
    if (!adminOtp.trim() || adminOtp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP sent to your phone.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.auth.verifyAdminOtp(adminPhone.trim(), adminOtp.trim());
      setToken(res.token);
      setCurrentUser(res.user);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-Click Full Admin Login (Auto-request and auto-verify)
  const handleQuickAdminLogin = async () => {
    setLoading(true);
    setError('');
    setLoginMode('admin');
    setAdminPhone('9876543210');

    try {
      const sendRes = await api.auth.sendAdminOtp('9876543210');
      setOtpSent(true);
      setOtpPreview(sendRes.otp_preview);
      setAdminOtp(sendRes.otp_preview);

      // Verify immediately
      const verifyRes = await api.auth.verifyAdminOtp('9876543210', sendRes.otp_preview);
      setToken(verifyRes.token);
      setCurrentUser(verifyRes.user);
      onLoginSuccess(verifyRes.user);
    } catch (err) {
      setError('Quick Admin login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login for Pickers
  const handleQuickPickerLogin = async (id, pwd) => {
    setLoginMode('picker');
    setPickerId(id);
    setPassword(pwd);
    setLoading(true);
    setError('');

    try {
      const data = await api.auth.login(id, pwd);
      setToken(data.token);
      setCurrentUser(data.user);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-[#16161c] flex flex-col justify-between p-4 sm:p-6 text-gray-100">
      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#fc8019] flex items-center justify-center shadow-lg shadow-[#fc8019]/40">
            <span className="font-black text-xl text-white">IM</span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-lg tracking-tight text-white">SWIGGY</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#fc8019] text-white font-extrabold tracking-wider uppercase">
                Instamart
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Warehouse Rack Audit Management</p>
          </div>
        </div>

        <button
          onClick={() => setShowHelpModal(true)}
          className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-700 transition-colors"
          title="Warehouse help & contact supervisor"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto">
        <div className="bg-[#1f1f27] border border-gray-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
          {/* Subtle Orange/Purple Glow Backdrop */}
          <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
            loginMode === 'admin' ? 'bg-purple-600/15' : 'bg-[#fc8019]/15'
          }`}></div>

          {/* Role Mode Switcher Tabs */}
          <div className="flex rounded-2xl bg-[#16161c] p-1.5 border border-gray-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setLoginMode('picker');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 ${
                loginMode === 'picker'
                  ? 'bg-[#fc8019] text-white shadow-md shadow-[#fc8019]/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Picker Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMode('admin');
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 ${
                loginMode === 'admin'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin OTP</span>
            </button>
          </div>

          {/* Heading */}
          <div className="mb-5">
            {loginMode === 'picker' ? (
              <>
                <h2 className="text-2xl font-black tracking-tight text-white">Warehouse Picker Login</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Sign in with your username or Picker ID and password.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
                  <span>Admin Control Center</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Sign in with registered mobile phone number & secure OTP verification.
                </p>
              </>
            )}
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start space-x-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 1: PICKER LOGIN (ID + Password)                            */}
          {/* ============================================================== */}
          {loginMode === 'picker' && (
            <form onSubmit={handlePickerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Username / Picker ID <span className="text-[#fc8019]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Surya or PKR-101"
                    value={pickerId}
                    onChange={(e) => setPickerId(e.target.value.toUpperCase())}
                    className="w-full bg-[#16161c] border-2 border-gray-700 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#fc8019] font-mono transition-colors"
                    disabled={loading}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                    Password <span className="text-[#fc8019]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(true)}
                    className="text-[11px] text-[#fc8019] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#16161c] border-2 border-gray-700 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#fc8019] transition-colors"
                    disabled={loading}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 bg-[#fc8019] hover:bg-[#e07014] text-white font-black text-sm rounded-2xl shadow-lg shadow-[#fc8019]/30 transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Verifying Credentials...</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-2">
                    <span>Start Audit Shift</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>
          )}

          {/* ============================================================== */}
          {/* TAB 2: ADMIN LOGIN (Mobile Phone + OTP)                       */}
          {/* ============================================================== */}
          {loginMode === 'admin' && (
            <div className="space-y-4">
              {!otpSent ? (
                // Step 1: Enter Mobile Number & Request OTP
                <form onSubmit={handleSendAdminOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-1.5">
                      Admin Mobile Number <span className="text-purple-400">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <span className="absolute left-10 text-xs font-bold text-gray-400 select-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength="10"
                        placeholder="9876543210"
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-[#16161c] border-2 border-gray-700 rounded-2xl pl-20 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono tracking-wider transition-colors"
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-[11px] text-gray-400">
                      <span>Default Admin Phone: <strong className="text-purple-300 font-mono">9876543210</strong></span>
                      <button
                        type="button"
                        onClick={() => setAdminPhone('9876543210')}
                        className="text-purple-400 hover:underline font-semibold"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || adminPhone.length < 10}
                    className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center space-x-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Sending Secure OTP...</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-2">
                        <span>Send Login OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                </form>
              ) : (
                // Step 2: Enter & Verify 6-digit OTP
                <form onSubmit={handleVerifyAdminOtp} className="space-y-4">
                  {/* SMS Delivery Notification Banner */}
                  <div className="p-3.5 rounded-2xl bg-purple-950/70 border border-purple-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-purple-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>SMS Gateway Delivered</span>
                      </div>
                      <span className="text-[10px] text-purple-400 font-mono">+91 {adminPhone}</span>
                    </div>

                    <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-purple-900/60">
                      <div>
                        <div className="text-[10px] text-gray-400">Your Login OTP:</div>
                        <div className="text-lg font-black text-purple-300 tracking-widest font-mono">
                          {otpPreview}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAdminOtp(otpPreview)}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold shadow-xs flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>1-Click Auto Fill</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-purple-300">
                        Enter 6-Digit OTP <span className="text-purple-400">*</span>
                      </label>
                      {otpCountdown > 0 ? (
                        <span className="text-[11px] text-gray-400 font-mono flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-purple-400" />
                          <span>Expires in {formatCountdown(otpCountdown)}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendAdminOtp}
                          className="text-[11px] text-purple-400 hover:underline font-bold"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        maxLength="6"
                        placeholder="••••••"
                        value={adminOtp}
                        onChange={(e) => setAdminOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-[#16161c] border-2 border-purple-500/80 rounded-2xl pl-10 pr-4 py-3 text-lg text-center tracking-[0.5em] text-white font-mono focus:outline-none focus:border-purple-400 transition-colors"
                        disabled={loading}
                        autoFocus
                        required
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setAdminOtp('');
                        setError('');
                      }}
                      className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-2xl border border-gray-700 transition-colors"
                    >
                      Change Phone
                    </button>
                    <button
                      type="submit"
                      disabled={loading || adminOtp.length !== 6}
                      className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center space-x-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Verifying...</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-2">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Verify & Access Control Center</span>
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Quick Demo Login Chips */}
          <div className="mt-6 pt-5 border-t border-gray-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-[#fc8019]" />
                <span>Instant Demo Logins</span>
              </span>
              <span className="text-[10px] text-gray-500">1-click test access</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={handleQuickAdminLogin}
                disabled={loading}
                className="col-span-2 p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800 text-left transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-purple-200 flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-400" />
                    <span>Admin Lead (Mobile OTP Login)</span>
                  </div>
                  <div className="text-[10px] text-purple-400 font-mono mt-0.5">
                    📱 Phone: 9876543210 • Anand Raj (FC Lead)
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-800 text-purple-200 font-bold group-hover:bg-purple-700">
                  Login with OTP →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPickerLogin('PKR-101', 'picker123')}
                disabled={loading}
                className="p-2.5 rounded-xl bg-orange-950/40 hover:bg-orange-900/50 border border-orange-800 text-left transition-colors"
              >
                <div className="font-bold text-orange-200">Picker 1 (Ramesh)</div>
                <div className="text-[10px] text-orange-400 font-mono">PKR-101 • Zone A Pick</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPickerLogin('PKR-102', 'picker123')}
                disabled={loading}
                className="p-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700 text-left transition-colors"
              >
                <div className="font-bold text-gray-200">Picker 2 (Priya)</div>
                <div className="text-[10px] text-gray-400 font-mono">PKR-102 • Zone B Pick</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="max-w-md w-full mx-auto text-center py-2 text-xs text-gray-500">
        <p>Swiggy Instamart Dark Store Operations • FC-BLR-04</p>
        <p className="text-[10px] text-gray-600 mt-0.5">Automated timestamp, session audit logging & OTP security enabled</p>
      </div>

      {/* Help / Contact Admin Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[#1f1f27] border border-gray-700 rounded-3xl p-6 max-w-sm w-full text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-[#fc8019]" />
                <h3 className="font-bold text-base">Warehouse Admin Support</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-gray-300 space-y-2.5 leading-relaxed">
              <p>
                In accordance with warehouse security policies, picker accounts and password credentials are provisioned directly by the <strong>Warehouse Admin / Operations Lead</strong>.
              </p>
              <div className="p-3 rounded-xl bg-gray-800/80 border border-gray-700 space-y-1 font-mono text-[11px]">
                <div className="text-gray-400">Warehouse Lead: Anand Raj</div>
                <div className="text-purple-300">Admin Phone: +91 9876543210 (OTP enabled)</div>
                <div className="text-[#fc8019]">Desk Extension: #4402 (FC Lead Office)</div>
                <div className="text-gray-300">Default Picker Password: <span className="text-white font-bold">picker123</span></div>
              </div>
              <p className="text-gray-400 text-[11px]">
                If your account is deactivated or you forgot your credentials, visit the Admin desk to reset your account.
              </p>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
