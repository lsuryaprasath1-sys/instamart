import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import LoginView from './views/LoginView';
import NewAuditView from './views/NewAuditView';
import AuditHistoryView from './views/AuditHistoryView';
import NegativeItemsView from './views/NegativeItemsView';
import LoginStatusView from './views/LoginStatusView';
import AdminDashboardView from './views/AdminDashboardView';
import UserManagementView from './views/UserManagementView';
import LocationMasterView from './views/LocationMasterView';
import ReportsExportView from './views/ReportsExportView';
import ActivityLogsView from './views/ActivityLogsView';
import MyPerformanceView from './views/MyPerformanceView';
import InstallAndroidModal from './components/InstallAndroidModal';
import { api, getCurrentUser, setCurrentUser, getToken, setToken } from './utils/api';

export default function App() {
  const [user, setUser] = useState(getCurrentUser());
  const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 'dashboard' : 'new-audit');
  const [negativeCount, setNegativeCount] = useState(0);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);

  // Check existing session on load
  useEffect(() => {
    const checkSession = async () => {
      const token = getToken();
      if (token) {
        try {
          const res = await api.auth.me();
          if (res.user) {
            setUser(res.user);
            setCurrentUser(res.user);
          }
        } catch (e) {
          // Token expired
          setUser(null);
          setCurrentUser(null);
          setToken(null);
        }
      }
      setLoadingInitial(false);
    };

    checkSession();

    // Listen for auth expiration
    const handleAuthExpired = () => {
      setUser(null);
      setCurrentUser(null);
      setToken(null);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  // Heartbeat ping loop every 30 seconds to maintain active session
  useEffect(() => {
    if (!user) return;

    const heartbeatTimer = setInterval(() => {
      api.auth.heartbeat().catch(() => {});
    }, 30000);

    return () => clearInterval(heartbeatTimer);
  }, [user]);

  // Adjust active tab if user role changes
  useEffect(() => {
    if (user) {
      if (user.role === 'picker' && ['dashboard', 'users', 'locations', 'reports', 'logs'].includes(activeTab)) {
        setActiveTab('new-audit');
      }
    }
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setActiveTab(userData.role === 'admin' ? 'dashboard' : 'new-audit');
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {}
    setToken(null);
    setCurrentUser(null);
    setUser(null);
  };

  // Quick Account Switcher for pair testing
  const handleSwitchUser = async (targetPickerId) => {
    try {
      // Find default passwords
      const password = targetPickerId.toUpperCase() === 'SURYA' ? '6382' : 'picker123';
      const data = await api.auth.login(targetPickerId, password);
      setToken(data.token);
      setCurrentUser(data.user);
      setUser(data.user);
      setActiveTab(data.user.role === 'admin' ? 'dashboard' : 'new-audit');
    } catch (e) {
      alert('Could not switch account: ' + e.message);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#16161c] flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#fc8019] flex items-center justify-center shadow-lg font-black text-xl animate-bounce">
            IM
          </div>
          <span className="text-xs text-gray-400 font-mono tracking-wider">Loading Instamart Rack Audit...</span>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Login View
  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-900 flex flex-col pb-16 md:pb-6">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
      />

      {/* Navigation Sub-bar & Bottom Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        negativeCount={negativeCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto py-4">
        {activeTab === 'new-audit' && (
          <NewAuditView
            user={user}
            onAuditSubmitted={() => {}}
          />
        )}

        {activeTab === 'my-audits' && (
          <AuditHistoryView
            user={user}
          />
        )}

        {activeTab === 'my-performance' && (
          <MyPerformanceView
            user={user}
          />
        )}

        {activeTab === 'negative-items' && (
          <NegativeItemsView
            user={user}
            onStatsUpdate={(count) => setNegativeCount(count)}
          />
        )}

        {activeTab === 'login-status' && (
          <LoginStatusView
            user={user}
          />
        )}

        {user.role === 'admin' && activeTab === 'dashboard' && (
          <AdminDashboardView
            onSelectAudit={() => setActiveTab('my-audits')}
            onSelectTab={(tab) => setActiveTab(tab)}
          />
        )}

        {user.role === 'admin' && activeTab === 'users' && (
          <UserManagementView />
        )}

        {user.role === 'admin' && activeTab === 'locations' && (
          <LocationMasterView />
        )}

        {user.role === 'admin' && activeTab === 'reports' && (
          <ReportsExportView />
        )}

        {user.role === 'admin' && activeTab === 'logs' && (
          <ActivityLogsView />
        )}
      </main>

      {/* Android Installation & Scanner Setup Modal */}
      <InstallAndroidModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />
    </div>
  );
}
