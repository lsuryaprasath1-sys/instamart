const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/negative-items - List negative items with role filter
router.get('/', requireAuth, (req, res) => {
  const { status, sku_id, rack, floor, aisle, picker_id, date_from, date_to } = req.query;

  let query = 'SELECT * FROM negative_items WHERE 1=1';
  const params = [];

  // Role check: Pickers only see their own negative items
  if (req.user.role === 'picker') {
    query += ' AND picker_id = ?';
    params.push(req.user.picker_id);
  } else if (picker_id) {
    // Admin filtering by picker
    query += ' AND UPPER(picker_id) = UPPER(?)';
    params.push(picker_id);
  }

  if (status) {
    query += ' AND resolution_status = ?';
    params.push(status);
  }

  if (sku_id) {
    query += ' AND (sku_id LIKE ? OR sku_name LIKE ?)';
    params.push(`%${sku_id}%`, `%${sku_id}%`);
  }

  if (rack) {
    query += ' AND rack = ?';
    params.push(rack);
  }

  if (floor) {
    query += ' AND floor = ?';
    params.push(floor);
  }

  if (aisle) {
    query += ' AND aisle = ?';
    params.push(aisle);
  }

  if (date_from) {
    query += ' AND created_at >= ?';
    params.push(date_from);
  }

  if (date_to) {
    query += ' AND created_at <= ?';
    params.push(date_to + 'T23:59:59.999Z');
  }

  query += ' ORDER BY created_at DESC LIMIT 300';

  try {
    const items = db.prepare(query).all(...params);
    res.json({ negative_items: items });
  } catch (err) {
    console.error('Error fetching negative items:', err);
    res.status(500).json({ error: 'Failed to fetch negative items' });
  }
});

// GET /api/negative-items/stats - Quick counts for badge counts
router.get('/stats', requireAuth, (req, res) => {
  try {
    let whereClause = '';
    const params = [];

    if (req.user.role === 'picker') {
      whereClause = ' WHERE picker_id = ?';
      params.push(req.user.picker_id);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM negative_items ${whereClause}`).get(...params).count;
    const open = db.prepare(`SELECT COUNT(*) as count FROM negative_items WHERE resolution_status = 'Open' ${req.user.role === 'picker' ? 'AND picker_id = ?' : ''}`).get(...(req.user.role === 'picker' ? [req.user.picker_id] : [])).count;
    const underReview = db.prepare(`SELECT COUNT(*) as count FROM negative_items WHERE resolution_status = 'Under Review' ${req.user.role === 'picker' ? 'AND picker_id = ?' : ''}`).get(...(req.user.role === 'picker' ? [req.user.picker_id] : [])).count;
    const resolved = db.prepare(`SELECT COUNT(*) as count FROM negative_items WHERE resolution_status = 'Resolved' ${req.user.role === 'picker' ? 'AND picker_id = ?' : ''}`).get(...(req.user.role === 'picker' ? [req.user.picker_id] : [])).count;

    res.json({
      total,
      open,
      under_review: underReview,
      resolved
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch negative items stats' });
  }
});

// PATCH /api/negative-items/:id - Admin update resolution status
router.patch('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { resolution_status, resolution_notes } = req.body;

  const validStatuses = ['Open', 'Under Review', 'Resolved'];
  if (!validStatuses.includes(resolution_status)) {
    return res.status(400).json({
      error: `Invalid resolution status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  const existing = db.prepare('SELECT * FROM negative_items WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Negative item record not found' });
  }

  const now = new Date().toISOString();
  const resolvedAt = resolution_status === 'Resolved' ? now : null;
  const resolvedBy = resolution_status === 'Resolved' ? req.user.name : null;

  try {
    db.prepare(`
      UPDATE negative_items
      SET resolution_status = ?,
          resolution_notes = COALESCE(?, resolution_notes),
          resolved_by = COALESCE(?, resolved_by),
          resolved_at = COALESCE(?, resolved_at)
      WHERE id = ?
    `).run(resolution_status, resolution_notes, resolvedBy, resolvedAt, id);

    // Record activity log
    db.prepare(`
      INSERT INTO activity_logs (user_id, picker_id, picker_name, action, details, created_at)
      VALUES (?, ?, ?, 'NEGATIVE_ITEM_RESOLVED', ?, ?)
    `).run(
      req.user.id,
      req.user.picker_id,
      req.user.name,
      `Updated negative item #${id} (SKU: ${existing.sku_id}) status to '${resolution_status}'`,
      now
    );

    const updated = db.prepare('SELECT * FROM negative_items WHERE id = ?').get(id);
    return res.json({ message: 'Resolution status updated successfully', item: updated });
  } catch (err) {
    console.error('Error updating negative item resolution:', err);
    return res.status(500).json({ error: 'Failed to update negative item' });
  }
});

module.exports = router;
