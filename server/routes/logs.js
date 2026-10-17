const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/logs/login-history - User sees own sessions, admin sees all
router.get('/login-history', requireAuth, (req, res) => {
  const { picker_id, status, limit = 100 } = req.query;

  let query = 'SELECT * FROM login_history WHERE 1=1';
  const params = [];

  if (req.user.role === 'picker') {
    query += ' AND picker_id = ?';
    params.push(req.user.picker_id);
  } else if (picker_id) {
    query += ' AND UPPER(picker_id) = UPPER(?)';
    params.push(picker_id);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY login_time DESC LIMIT ?';
  params.push(parseInt(limit, 10) || 100);

  try {
    const sessions = db.prepare(query).all(...params);
    res.json({ sessions });
  } catch (err) {
    console.error('Error fetching login history:', err);
    res.status(500).json({ error: 'Failed to fetch login history' });
  }
});

// GET /api/logs/activity - Admin only audit trail
router.get('/activity', requireAdmin, (req, res) => {
  const { action, picker_id, limit = 150 } = req.query;

  let query = 'SELECT * FROM activity_logs WHERE 1=1';
  const params = [];

  if (action) {
    query += ' AND action = ?';
    params.push(action);
  }

  if (picker_id) {
    query += ' AND UPPER(picker_id) = UPPER(?)';
    params.push(picker_id);
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(parseInt(limit, 10) || 150);

  try {
    const logs = db.prepare(query).all(...params);
    res.json({ logs });
  } catch (err) {
    console.error('Error fetching activity logs:', err);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

module.exports = router;
