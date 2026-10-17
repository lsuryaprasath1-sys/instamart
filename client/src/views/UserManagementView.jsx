import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit2, 
  KeyRound, 
  UserCheck, 
  UserX, 
  Clock, 
  ClipboardList, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  Eye, 
  ShieldCheck,
  Search,
  Lock
} from 'lucide-react';
import { api } from '../utils/api';

export default function UserManagementView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resetPwdUser, setResetPwdUser] = useState(null);
  const [perfUser, setPerfUser] = useState(null);
  const [perfData, setPerfData] = useState(null);
  const [loadingPerf, setLoadingPerf] = useState(false);

  // Form states
  const [newPickerId, setNewPickerId] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('picker');

  const [editName, setEditName] = useState('');
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.users.list();
      setUsers(data.users || []);
    } catch (err) {
      alert('Failed to load users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newPickerId.trim() || !newName.trim() || !newPassword.trim()) {
      alert('All fields are required');
      return;
    }

    setActionLoading(true);
    try {
      await api.users.create({
        picker_id: newPickerId.trim().toUpperCase(),
        name: newName.trim(),
        password: newPassword,
        role: newRole
      });
      setShowAddModal(false);
      setNewPickerId('');
      setNewName('');
      setNewPassword('');
      fetchUsers();
    } catch (err) {
      alert('Error creating user: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setActionLoading(true);
    try {
      await api.users.update(editingUser.id, {
        name: editName.trim()
      });
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert('Error updating user: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (user) => {
    const nextState = user.is_active ? 0 : 1;
    const confirmMsg = user.is_active 
      ? `Are you sure you want to deactivate ${user.name} (${user.picker_id})? They will not be able to log in.`
      : `Activate account for ${user.name} (${user.picker_id})?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.users.update(user.id, { is_active: nextState });
      fetchUsers();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPwdUser || resetPasswordVal.trim().length < 4) {
      alert('New password must be at least 4 characters');
      return;
    }

    setActionLoading(true);
    try {
      await api.users.resetPassword(resetPwdUser.id, resetPasswordVal.trim());
      alert(`Password updated for ${resetPwdUser.name}`);
      setResetPwdUser(null);
      setResetPasswordVal('');
    } catch (err) {
      alert('Error resetting password: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewPerformance = async (user) => {
    setPerfUser(user);
    setLoadingPerf(true);
    try {
      const data = await api.users.getPerformance(user.picker_id);
      setPerfData(data);
    } catch (err) {
      alert('Failed to fetch performance: ' + err.message);
    } finally {
      setLoadingPerf(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.picker_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-5">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">
              Warehouse User & Picker Management
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Provision Picker IDs, manage login access, reset passwords, and inspect individual audit KPIs
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#fc8019] hover:bg-[#e07014] text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Picker</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex items-center space-x-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by picker name or Picker ID (e.g. Ramesh or PKR-101)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs text-gray-800 focus:outline-none placeholder-gray-400"
        />
      </div>

      {/* Users Cards / List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 space-y-2">
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs">Loading warehouse staff accounts...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((u) => {
            const isActive = u.is_active === 1;

            return (
              <div
                key={u.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 hover:border-purple-300 shadow-xs transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white ${
                      u.role === 'admin' ? 'bg-purple-600' : 'bg-[#fc8019]'
                    }`}>
                      {u.role === 'admin' ? 'AD' : u.picker_id.replace('PKR-', 'P')}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-gray-900">{u.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-gray-500">
                        Picker ID: <span className="font-bold text-gray-800">{u.picker_id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Active/Inactive badge */}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase border ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-red-100 text-red-800 border-red-300'
                    }`}>
                      {isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </div>
                </div>

                {/* Performance stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Total Audits</span>
                    <span className="font-black text-gray-900 text-sm">{u.total_audits || 0}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Flagged Negatives</span>
                    <span className="font-black text-red-600 text-sm">{u.total_negative_items || 0}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Current Status</span>
                    <span className={`font-bold ${u.current_login_status === 'ACTIVE' ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {u.current_login_status === 'ACTIVE' ? '● On Floor Active' : 'Off Duty'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Last Active</span>
                    <span className="text-gray-700 font-mono">
                      {u.last_activity_time ? new Date(u.last_activity_time).toLocaleTimeString('en-IN') : 'None'}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleViewPerformance(u)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Performance</span>
                  </button>

                  <button
                    onClick={() => { setEditingUser(u); setEditName(u.name); }}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center space-x-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Name</span>
                  </button>

                  <button
                    onClick={() => { setResetPwdUser(u); setResetPasswordVal(''); }}
                    className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center space-x-1"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Reset Password</span>
                  </button>

                  <button
                    onClick={() => handleToggleActive(u)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 border ${
                      isActive
                        ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-[#fc8019]" />
                <h3 className="font-black text-base text-gray-900">Add New Picker Account</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Picker ID (Unique Identifier) *</label>
                <input
                  type="text"
                  placeholder="e.g. PKR-105"
                  value={newPickerId}
                  onChange={(e) => setNewPickerId(e.target.value.toUpperCase())}
                  className="w-full font-mono font-bold p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:border-[#fc8019] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Sandeep Rao"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:border-[#fc8019] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Initial Password *</label>
                <input
                  type="password"
                  placeholder="e.g. picker123"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:border-[#fc8019] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:border-[#fc8019] focus:outline-none"
                >
                  <option value="picker">Warehouse Picker</option>
                  <option value="admin">Warehouse Admin / Supervisor</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-[#fc8019] hover:bg-[#e07014] text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Name Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-200 space-y-4">
            <h3 className="font-black text-base text-gray-900">Edit Name for {editingUser.picker_id}</h3>
            <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:border-[#fc8019] focus:outline-none"
                  required
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2 bg-[#fc8019] text-white font-bold rounded-xl shadow-md"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPwdUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-amber-600" />
              <h3 className="font-black text-base text-gray-900">Reset Password for {resetPwdUser.name}</h3>
            </div>
            <p className="text-xs text-gray-500">Provide a new password for Picker ID: {resetPwdUser.picker_id}</p>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">New Password (min 4 chars)</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:border-[#fc8019] focus:outline-none"
                  required
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPwdUser(null)}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2 bg-amber-600 text-white font-bold rounded-xl shadow-md"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Performance Drawer / Modal */}
      {perfUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="font-black text-base text-gray-900">{perfUser.name} Performance</h3>
                <span className="text-xs text-gray-500 font-mono">Picker ID: {perfUser.picker_id}</span>
              </div>
              <button onClick={() => setPerfUser(null)} className="p-1 rounded-full text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingPerf ? (
              <div className="py-8 text-center text-xs text-gray-500">Loading metrics...</div>
            ) : perfData ? (
              <div className="space-y-4 text-xs">
                {/* Metrics 4-grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-gray-500 uppercase block font-bold">Total Audits</span>
                    <span className="text-lg font-black text-gray-900">{perfData.metrics.total_audits}</span>
                  </div>
                  <div className="p-2.5 bg-red-50 rounded-xl border border-red-200">
                    <span className="text-[10px] text-red-600 uppercase block font-bold">Negatives</span>
                    <span className="text-lg font-black text-red-700">{perfData.metrics.total_negative_items}</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-600 uppercase block font-bold">Resolved</span>
                    <span className="text-lg font-black text-emerald-700">{perfData.metrics.resolved_negative_items}</span>
                  </div>
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="text-[10px] text-amber-600 uppercase block font-bold">Pending</span>
                    <span className="text-lg font-black text-amber-700">{perfData.metrics.open_negative_items}</span>
                  </div>
                </div>

                {/* Recent Audits Table */}
                <div>
                  <h4 className="font-bold text-gray-800 mb-1.5">Recent Audits by {perfUser.name}</h4>
                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                    {perfData.recent_audits.length === 0 ? (
                      <div className="p-3 text-gray-400">No audits submitted yet</div>
                    ) : (
                      perfData.recent_audits.map((a) => (
                        <div key={a.audit_id} className="p-2.5 bg-white flex justify-between">
                          <div>
                            <span className="font-mono font-bold text-gray-900">{a.audit_id}</span>
                            <div className="text-[11px] text-gray-500">{a.location_id} • {new Date(a.created_at).toLocaleDateString()}</div>
                          </div>
                          <span className="font-semibold text-gray-700">{a.total_skus} SKUs</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="pt-2 text-right">
              <button
                onClick={() => setPerfUser(null)}
                className="px-4 py-2 bg-gray-800 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
