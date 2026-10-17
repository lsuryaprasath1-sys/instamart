// Central API client with token injection & error management
function resolveApiBase() {
  const envBase = import.meta.env.VITE_API_BASE_URL;

  if (typeof window !== 'undefined') {
    const { hostname, port, protocol } = window.location;
    const isLocalServer = ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname) && ['5000', '3000', '4173', '5173', ''].includes(port);

    if (isLocalServer) {
      return `${protocol}//${hostname}${port ? `:${port}` : ''}/api`;
    }
  }

  return envBase || '/api';
}

const API_BASE = resolveApiBase();

export function getToken() {
  return localStorage.getItem('swiggy_audit_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('swiggy_audit_token', token);
  } else {
    localStorage.removeItem('swiggy_audit_token');
  }
}

export function getCurrentUser() {
  const userStr = localStorage.getItem('swiggy_audit_user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('swiggy_audit_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('swiggy_audit_user');
  }
}

export async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { ...options.headers };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Session expired or invalid
    setToken(null);
    setCurrentUser(null);
    if (!window.location.pathname.includes('/login')) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (picker_id, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ picker_id, password }),
      }),
    sendAdminOtp: (phone) =>
      request('/auth/admin/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      }),
    verifyAdminOtp: (phone, otp) =>
      request('/auth/admin/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
      }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/auth/me'),
    heartbeat: () => request('/auth/heartbeat', { method: 'POST' }),
  },

  // Locations
  locations: {
    query: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/locations/query${q ? `?${q}` : ''}`);
    },
    getHierarchy: () => request('/locations/hierarchy'),
    getStats: () => request('/locations/stats'),
    uploadCsv: (formData) =>
      request('/locations/upload-csv', {
        method: 'POST',
        body: formData,
      }),
    getSampleCsvUrl: () => `${API_BASE}/locations/sample-csv`,
  },

  // Audits
  audits: {
    create: (data) =>
      request('/audits', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/audits${q ? `?${q}` : ''}`);
    },
    getById: (auditId) => request(`/audits/${auditId}`),
    uploadPhoto: (formData) =>
      request('/audits/upload-photo', {
        method: 'POST',
        body: formData,
      }),
    getCatalog: () => request('/audits/catalog'),
    lookupSku: (sku) => request(`/audits/sku-lookup/${encodeURIComponent(sku)}`),
  },

  // Negative items
  negativeItems: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/negative-items${q ? `?${q}` : ''}`);
    },
    getStats: () => request('/negative-items/stats'),
    updateResolution: (id, resolution_status, resolution_notes) =>
      request(`/negative-items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ resolution_status, resolution_notes }),
      }),
  },

  // Users
  users: {
    list: () => request('/users'),
    create: (data) =>
      request('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    resetPassword: (id, new_password) =>
      request(`/users/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ new_password }),
      }),
    getPerformance: (pickerId) => request(`/users/${pickerId}/performance`),
  },

  // Analytics
  analytics: {
    getDashboard: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/analytics/dashboard${q ? `?${q}` : ''}`);
    },
    getPickerPerformance: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/analytics/picker-performance${q ? `?${q}` : ''}`);
    },
    getMyPerformance: () => request('/analytics/my-performance'),
  },

  // Logs
  logs: {
    getLoginHistory: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/logs/login-history${q ? `?${q}` : ''}`);
    },
    getActivity: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/logs/activity${q ? `?${q}` : ''}`);
    },
  },

  // Reports
  reports: {
    getExportUrl: (type, format = 'xlsx', filters = {}) => {
      const q = new URLSearchParams({ format, ...filters }).toString();
      return `${API_BASE}/reports/${type}?${q}`;
    },
  },
};
