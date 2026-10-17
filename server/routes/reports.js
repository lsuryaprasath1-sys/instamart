const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const { db } = require('../db');
const { requireAdmin } = require('../middleware/auth');

function sendWorkbook(res, data, sheetName, filename, format = 'xlsx') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  if (format === 'csv') {
    const csvData = XLSX.utils.sheet_to_csv(ws);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    return res.send(csvData);
  } else {
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    return res.send(buf);
  }
}

// 1. Audit History Export
router.get('/audits', requireAdmin, (req, res) => {
  const { format = 'xlsx', date_from, date_to, picker_id, status } = req.query;

  let query = 'SELECT * FROM audits WHERE 1=1';
  const params = [];

  if (date_from) {
    query += ' AND created_at >= ?';
    params.push(date_from);
  }
  if (date_to) {
    query += ' AND created_at <= ?';
    params.push(date_to + 'T23:59:59.999Z');
  }
  if (picker_id) {
    query += ' AND UPPER(picker_id) = UPPER(?)';
    params.push(picker_id);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(...params).map(r => ({
    'Audit ID': r.audit_id,
    'Picker ID': r.picker_id,
    'Picker Name': r.picker_name,
    'Location ID': r.location_id,
    'Floor': r.floor,
    'Aisle': r.aisle,
    'Rack': r.rack,
    'Bin': r.bin,
    'Zone Type': r.zone_type,
    'Rack Type': r.rack_type,
    'Space Type': r.space_type,
    'Storage Type': r.storage_type,
    'Total SKUs Audited': r.total_skus,
    'Negative Items Count': r.negative_items_count,
    'Audit Status': r.status,
    'Created At': r.created_at
  }));

  sendWorkbook(res, rows, 'Audit History', `Instamart_Audit_History_${Date.now()}`, format);
});

// 2. Negative Items Export
router.get('/negative-items', requireAdmin, (req, res) => {
  const { format = 'xlsx', status, sku_id, picker_id } = req.query;

  let query = 'SELECT * FROM negative_items WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND resolution_status = ?';
    params.push(status);
  }
  if (sku_id) {
    query += ' AND (sku_id LIKE ? OR sku_name LIKE ?)';
    params.push(`%${sku_id}%`, `%${sku_id}%`);
  }
  if (picker_id) {
    query += ' AND UPPER(picker_id) = UPPER(?)';
    params.push(picker_id);
  }

  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(...params).map(r => ({
    'ID': r.id,
    'Audit ID': r.audit_id,
    'SKU ID': r.sku_id,
    'SKU Name': r.sku_name,
    'Missing Quantity': r.quantity,
    'Location ID': r.location_id,
    'Floor': r.floor,
    'Aisle': r.aisle,
    'Rack': r.rack,
    'Bin': r.bin,
    'Zone Type': r.zone_type,
    'Picker ID': r.picker_id,
    'Picker Name': r.picker_name,
    'Remarks': r.remarks,
    'Resolution Status': r.resolution_status,
    'Resolution Notes': r.resolution_notes || '',
    'Resolved By': r.resolved_by || '',
    'Resolved At': r.resolved_at || '',
    'Created At': r.created_at
  }));

  sendWorkbook(res, rows, 'Negative Items', `Instamart_Negative_Items_${Date.now()}`, format);
});

// 3. Picker Performance Export
router.get('/picker-performance', requireAdmin, (req, res) => {
  const { format = 'xlsx' } = req.query;

  const rows = db.prepare(`
    SELECT 
      u.picker_id as 'Picker ID',
      u.name as 'Picker Name',
      u.role as 'Role',
      CASE WHEN u.is_active = 1 THEN 'Active' ELSE 'Deactivated' END as 'Account Status',
      (SELECT COUNT(*) FROM audits WHERE picker_id = u.picker_id) as 'Total Audits Completed',
      (SELECT COUNT(*) FROM negative_items WHERE picker_id = u.picker_id) as 'Total Negative Items Flagged',
      (SELECT COUNT(*) FROM negative_items WHERE picker_id = u.picker_id AND resolution_status = 'Resolved') as 'Resolved Negatives',
      (SELECT status FROM login_history WHERE picker_id = u.picker_id ORDER BY id DESC LIMIT 1) as 'Current Login Status',
      (SELECT login_time FROM login_history WHERE picker_id = u.picker_id ORDER BY id DESC LIMIT 1) as 'Last Login Time',
      (SELECT last_activity FROM login_history WHERE picker_id = u.picker_id ORDER BY id DESC LIMIT 1) as 'Last Activity Time'
    FROM users u
    WHERE u.role = 'picker'
    ORDER BY 'Total Audits Completed' DESC
  `).all();

  sendWorkbook(res, rows, 'Picker Performance', `Instamart_Picker_Performance_${Date.now()}`, format);
});

// 4. Login History Export
router.get('/login-history', requireAdmin, (req, res) => {
  const { format = 'xlsx', picker_id, status } = req.query;

  let query = 'SELECT * FROM login_history WHERE 1=1';
  const params = [];

  if (picker_id) {
    query += ' AND UPPER(picker_id) = UPPER(?)';
    params.push(picker_id);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY login_time DESC';

  const rows = db.prepare(query).all(...params).map(r => ({
    'Session ID': r.id,
    'Picker ID': r.picker_id,
    'Picker Name': r.name,
    'Login Time': r.login_time,
    'Logout Time': r.logout_time || 'Still Active',
    'Session Status': r.status,
    'Last Activity': r.last_activity,
    'IP Address': r.ip_address || '',
    'User Agent': r.user_agent || ''
  }));

  sendWorkbook(res, rows, 'Login History', `Instamart_Login_History_${Date.now()}`, format);
});

// 5. Location-Wise Audit Summary Export
router.get('/location-summary', requireAdmin, (req, res) => {
  const { format = 'xlsx' } = req.query;

  const rows = db.prepare(`
    SELECT 
      lm.location_id as 'Location ID',
      lm.floor as 'Floor',
      lm.aisle as 'Aisle',
      lm.rack as 'Rack',
      lm.bin as 'Bin',
      lm.zone_type as 'Zone Type',
      lm.storage_type as 'Storage Type',
      COUNT(a.id) as 'Times Audited',
      COALESCE(SUM(a.total_skus), 0) as 'Total SKUs Checked',
      COALESCE(SUM(a.negative_items_count), 0) as 'Total Negative Items Found',
      MAX(a.created_at) as 'Last Audited At'
    FROM location_master lm
    LEFT JOIN audits a ON lm.location_id = a.location_id
    GROUP BY lm.location_id
    ORDER BY 'Times Audited' DESC, lm.floor, lm.aisle, lm.rack, lm.bin
  `).all();

  sendWorkbook(res, rows, 'Location Audit Summary', `Instamart_Location_Audit_Summary_${Date.now()}`, format);
});

// 6. Rack-Wise Negative-Item Summary Export
router.get('/rack-negatives', requireAdmin, (req, res) => {
  const { format = 'xlsx' } = req.query;

  const rows = db.prepare(`
    SELECT 
      floor as 'Floor',
      aisle as 'Aisle',
      rack as 'Rack',
      (floor || '-' || aisle || '-' || rack) as 'Rack Code',
      zone_type as 'Zone Type',
      COUNT(*) as 'Total Negative Items',
      SUM(CASE WHEN resolution_status = 'Open' THEN 1 ELSE 0 END) as 'Open Negatives',
      SUM(CASE WHEN resolution_status = 'Under Review' THEN 1 ELSE 0 END) as 'Under Review Negatives',
      SUM(CASE WHEN resolution_status = 'Resolved' THEN 1 ELSE 0 END) as 'Resolved Negatives',
      SUM(quantity) as 'Total Units Discrepant'
    FROM negative_items
    GROUP BY floor, aisle, rack
    ORDER BY 'Total Negative Items' DESC
  `).all();

  sendWorkbook(res, rows, 'Rack Negative Summary', `Instamart_Rack_Negative_Summary_${Date.now()}`, format);
});

module.exports = router;
