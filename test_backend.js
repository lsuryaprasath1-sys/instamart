const http = require('http');

async function runTests() {
  console.log('--- Starting Swiggy Instamart Warehouse Audit E2E Integration Tests ---');
  
  const baseUrl = 'http://localhost:5000/api';

  async function apiCall(endpoint, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });

    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  // 1. Health check
  console.log('1. Testing /health...');
  const health = await apiCall('/health');
  if (health.status !== 200) throw new Error('Health check failed');
  console.log('  [PASS] API Health OK:', health.data.service);

  // 2. Admin Login
  console.log('2. Testing Admin Login (Surya)...');
  const adminLogin = await apiCall('/auth/login', 'POST', { picker_id: 'Surya', password: '6382' });
  if (adminLogin.status !== 200 || !adminLogin.data.token) throw new Error('Admin login failed: ' + JSON.stringify(adminLogin));
  const adminToken = adminLogin.data.token;
  console.log('  [PASS] Admin logged in successfully as:', adminLogin.data.user.name);

  // 3. Picker Login
  console.log('3. Testing Picker Login (PKR-101)...');
  const pickerLogin = await apiCall('/auth/login', 'POST', { picker_id: 'PKR-101', password: 'picker123' });
  if (pickerLogin.status !== 200 || !pickerLogin.data.token) throw new Error('Picker login failed: ' + JSON.stringify(pickerLogin));
  const pickerToken = pickerLogin.data.token;
  console.log('  [PASS] Picker logged in successfully as:', pickerLogin.data.user.name);

  // 4. Test Dependent Dropdown Flow
  console.log('4. Testing Location Master Dependent Flow...');
  const floors = await apiCall('/locations/query', 'GET', null, pickerToken);
  console.log('  Floors available:', floors.data.floors);
  if (!floors.data.floors.includes('0')) throw new Error('Floor 0 not found');

  const aisles = await apiCall('/locations/query?floor=0', 'GET', null, pickerToken);
  console.log('  Aisles on Floor 0:', aisles.data.aisles);
  if (!aisles.data.aisles.includes('A')) throw new Error('Aisle A not found on Floor 0');

  const racks = await apiCall('/locations/query?floor=0&aisle=A', 'GET', null, pickerToken);
  console.log('  Racks on Floor 0, Aisle A:', racks.data.racks);

  const bins = await apiCall('/locations/query?floor=0&aisle=A&rack=1', 'GET', null, pickerToken);
  console.log('  Bins on Floor 0, Aisle A, Rack 1:', bins.data.bins);

  const locDetail = await apiCall('/locations/query?floor=0&aisle=A&rack=1&bin=S', 'GET', null, pickerToken);
  console.log('  [PASS] Retrieved Location Detail:', locDetail.data.location.location_id, 'Zone:', locDetail.data.location.zone_type);
  if (locDetail.data.location.location_id !== '0-A-1-S') throw new Error('Location ID mismatch');

  // 5. Submit New Rack Audit
  console.log('5. Submitting Rack Audit with 1 Available and 1 Negative Item...');
  const newAudit = await apiCall('/audits', 'POST', {
    location: locDetail.data.location,
    items: [
      {
        sku_id: '8901030383756',
        sku_name: 'Maggi 2-Minute Noodles 70g Pack of 4',
        quantity: 12,
        status: 'Available',
        remarks: 'Front row intact'
      },
      {
        sku_id: '8901491101837',
        sku_name: 'Amul Salted Butter 500g',
        quantity: 2,
        status: 'Negative/Missing',
        remarks: 'Physical stock 2 units short against system'
      }
    ]
  }, pickerToken);

  if (newAudit.status !== 201) throw new Error('Audit creation failed: ' + JSON.stringify(newAudit));
  console.log('  [PASS] Created Audit ID:', newAudit.data.audit_id, 'Status:', newAudit.data.status);

  // 6. Check Negative Items Hub
  console.log('6. Checking Negative Items Hub...');
  const negatives = await apiCall('/negative-items', 'GET', null, adminToken);
  const foundNegative = negatives.data.negative_items.find(it => it.audit_id === newAudit.data.audit_id);
  if (!foundNegative) throw new Error('Negative item was not recorded in negative_items table');
  console.log('  [PASS] Negative Item logged with ID:', foundNegative.id, 'SKU:', foundNegative.sku_id, 'Status:', foundNegative.resolution_status);

  // 7. Admin updates Resolution Status
  console.log('7. Admin resolving negative item...');
  const resolved = await apiCall(`/negative-items/${foundNegative.id}`, 'PATCH', {
    resolution_status: 'Resolved',
    resolution_notes: 'Auditor discrepancy verified and corrected with warehouse manager.'
  }, adminToken);
  if (resolved.status !== 200 || resolved.data.item.resolution_status !== 'Resolved') {
    throw new Error('Negative item resolution failed');
  }
  console.log('  [PASS] Negative item successfully updated to:', resolved.data.item.resolution_status);

  // 8. Admin Dashboard Metrics
  console.log('8. Checking Admin Dashboard Metrics...');
  const metrics = await apiCall('/analytics/dashboard', 'GET', null, adminToken);
  if (metrics.status !== 200) throw new Error('Failed to load dashboard metrics');
  console.log('  [PASS] Dashboard Metrics: Total Audits =', metrics.data.summary.total_audits, 'Total Negatives =', metrics.data.summary.total_negative_items);

  // 9. Login History & Activity Logs
  console.log('9. Checking Login History & Activity Logs...');
  const loginHistory = await apiCall('/logs/login-history', 'GET', null, adminToken);
  console.log('  [PASS] Login sessions logged:', loginHistory.data.sessions.length);

  const activityLogs = await apiCall('/logs/activity', 'GET', null, adminToken);
  console.log('  [PASS] Activity trail events logged:', activityLogs.data.logs.length);

  console.log('\n======================================================');
  console.log('  ALL E2E INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
  console.log('======================================================');
  process.exit(0);
}

// Start server child process and test
const { spawn } = require('child_process');
const serverProcess = spawn('node', ['server/index.js'], { stdio: 'inherit' });

setTimeout(() => {
  runTests().catch(err => {
    console.error('Test Failed:', err);
    serverProcess.kill();
    process.exit(1);
  }).finally(() => {
    serverProcess.kill();
  });
}, 2000);
