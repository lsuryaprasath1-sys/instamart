const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { requireAdmin } = require('../middleware/auth');

// GET /api/users - List all users with performance summary
router.get('/', requireAdmin, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT 
        u.id,
        u.picker_id,
        u.name,
        u.phone,
        u.role,
        u.is_active,
        u.created_at,
        u.updated_at,
        (SELECT COUNT(*) FROM audits WHERE picker_id = u.picker_id) as total_audits,
        (SELECT COUNT(*) FROM negative_items WHERE picker_id = u.picker_id) as total_negative_items,
        (SELECT status FROM login_history WHERE picker_id = u.picker_id ORDER BY id DESC LIMIT 1) as current_login_status,
        (SELECT login_time FROM login_history WHERE picker_id = u.picker_id ORDER BY id DESC LIMIT 1) as last_login_time,
        (SELECT last_activity FROM login_history WHERE picker_id = u.picker_id ORDER BY id DESC LIMIT 1) as last_activity_time
      FROM users u
      ORDER BY u.role DESC, u.name ASC
    `).all();

    res.json({ users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users - Create new picker account
router.post('/', requireAdmin, (req, res) => {
  const { picker_id, name, phone = '', password, role = 'picker' } = req.body;

  if (!picker_id || !name || !password) {
    return res.status(400).json({ error: 'Picker ID, Name, and Password are required' });
  }

  const cleanPickerId = picker_id.trim().toUpperCase();
  const cleanName = name.trim();
  const cleanPhone = phone ? phone.trim() : '';

  // Check unique picker_id
  const existing = db.prepare('SELECT id FROM users WHERE UPPER(picker_id) = ?').get(cleanPickerId);
  if (existing) {
    return res.status(400).json({ error: `Picker ID "${cleanPickerId}" is already registered. Please choose another.` });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const now = new Date().toISOString();

  try {
    const result = db.prepare(`
      INSERT INTO users (picker_id, name, phone, password_hash, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `).run(cleanPickerId, cleanName, cleanPhone, passwordHash, role, now, now);

    // Record activity log
    db.prepare(`
      INSERT INTO activity_logs (user_id, picker_id, picker_name, action, details, created_at)
      VALUES (?, ?, ?, 'USER_CREATED', ?, ?)
    `).run(
      req.user.id,
      req.user.picker_id,
      req.user.name,
      `Created new ${role} account: ${cleanPickerId} (${cleanName})`,
      now
    );

    res.status(201).json({
      message: `Account created successfully for ${cleanName} (${cleanPickerId})`,
      user: {
        id: result.lastInsertRowid,
        picker_id: cleanPickerId,
        name: cleanName,
        role,
        is_active: 1,
        created_at: now
      }
    });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user: ' + err.message });
  }
});

// PUT /api/users/:id - Edit user name or toggle status
router.put('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, phone, is_active } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const now = new Date().toISOString();
  const updatedName = name ? name.trim() : user.name;
  const updatedPhone = phone !== undefined ? phone.trim() : user.phone;
  const updatedActive = is_active !== undefined ? (is_active ? 1 : 0) : user.is_active;

  try {
    db.prepare(`
      UPDATE users
      SET name = ?, phone = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `).run(updatedName, updatedPhone, updatedActive, now, id);

    db.prepare(`
      INSERT INTO activity_logs (user_id, picker_id, picker_name, action, details, created_at)
      VALUES (?, ?, ?, 'USER_UPDATED', ?, ?)
    `).run(
      req.user.id,
      req.user.picker_id,
      req.user.name,
      `Updated user ${user.picker_id}: Name='${updatedName}', Phone='${updatedPhone}', Active=${updatedActive}`,
      now
    );

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        picker_id: user.picker_id,
        name: updatedName,
        phone: updatedPhone,
        role: user.role,
        is_active: updatedActive,
        updated_at: now
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// POST /api/users/:id/reset-password - Reset password
router.post('/:id/reset-password', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { new_password } = req.body;

  if (!new_password || new_password.trim().length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters long' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(new_password.trim(), salt);
  const now = new Date().toISOString();

  try {
    db.prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = ?
      WHERE id = ?
    `).run(passwordHash, now, id);

    db.prepare(`
      INSERT INTO activity_logs (user_id, picker_id, picker_name, action, details, created_at)
      VALUES (?, ?, ?, 'PASSWORD_RESET', ?, ?)
    `).run(
      req.user.id,
      req.user.picker_id,
      req.user.name,
      `Reset password for picker ${user.picker_id} (${user.name})`,
      now
    );

    res.json({ message: `Password reset successfully for ${user.name} (${user.picker_id})` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// GET /api/users/:picker_id/performance - Deep picker stats
router.get('/:picker_id/performance', requireAdmin, (req, res) => {
  const { picker_id } = req.params;

  try {
    const user = db.prepare('SELECT id, picker_id, name, role, is_active, created_at FROM users WHERE UPPER(picker_id) = UPPER(?)').get(picker_id);
    if (!user) {
      return res.status(404).json({ error: 'Picker not found' });
    }

    const audits = db.prepare('SELECT * FROM audits WHERE picker_id = ? ORDER BY created_at DESC LIMIT 50').all(user.picker_id);
    const negativeItems = db.prepare('SELECT * FROM negative_items WHERE picker_id = ? ORDER BY created_at DESC LIMIT 50').all(user.picker_id);
    const loginSessions = db.prepare('SELECT * FROM login_history WHERE picker_id = ? ORDER BY login_time DESC LIMIT 50').all(user.picker_id);

    const totalAudits = db.prepare('SELECT COUNT(*) as count FROM audits WHERE picker_id = ?').get(user.picker_id).count;
    const totalNegative = db.prepare('SELECT COUNT(*) as count FROM negative_items WHERE picker_id = ?').get(user.picker_id).count;
    const resolvedNegative = db.prepare("SELECT COUNT(*) as count FROM negative_items WHERE picker_id = ? AND resolution_status = 'Resolved'").get(user.picker_id).count;

    res.json({
      picker: user,
      metrics: {
        total_audits: totalAudits,
        total_negative_items: totalNegative,
        resolved_negative_items: resolvedNegative,
        open_negative_items: totalNegative - resolvedNegative
      },
      recent_audits: audits,
      recent_negative_items: negativeItems,
      recent_sessions: loginSessions
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch picker performance' });
  }
});

module.exports = router;
