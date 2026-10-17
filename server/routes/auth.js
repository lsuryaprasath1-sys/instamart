const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { picker_id, password } = req.body;

  if (!picker_id || !password) {
    return res.status(400).json({ error: 'Picker ID and password are required' });
  }

  const cleanPickerId = picker_id.trim();
  const user = db.prepare('SELECT * FROM users WHERE UPPER(picker_id) = UPPER(?)').get(cleanPickerId);

  if (!user) {
    return res.status(401).json({ error: 'Invalid Picker ID or credentials. Please verify or contact warehouse admin.' });
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'This picker account is deactivated. Please contact your warehouse supervisor or admin.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Incorrect password. Please verify or contact admin to reset.' });
  }

  const now = new Date().toISOString();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Browser/Scanner';

  // Record login history
  const sessionResult = db.prepare(`
    INSERT INTO login_history (user_id, picker_id, name, login_time, status, last_activity, ip_address, user_agent)
    VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
  `).run(user.id, user.picker_id, user.name, now, now, ip, userAgent);

  const sessionId = sessionResult.lastInsertRowid;

  // Record activity log
  db.prepare(`
    INSERT INTO activity_logs (user_id, picker_id, picker_name, action, details, created_at)
    VALUES (?, ?, ?, 'LOGIN', ?, ?)
  `).run(user.id, user.picker_id, user.name, `User logged in from ${ip}`, now);

  const token = jwt.sign(
    { id: user.id, picker_id: user.picker_id, role: user.role, sessionId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      picker_id: user.picker_id,
      name: user.name,
      role: user.role,
      is_active: user.is_active
    },
    sessionId,
    login_time: now
  });
});

// POST /api/auth/logout
router.post('/logout', requireAuth, (req, res) => {
  const now = new Date().toISOString();
  if (req.sessionId) {
    db.prepare(`
      UPDATE login_history
      SET logout_time = ?, status = 'INACTIVE', last_activity = ?
      WHERE id = ?
    `).run(now, now, req.sessionId);
  }

  db.prepare(`
    INSERT INTO activity_logs (user_id, picker_id, picker_name, action, details, created_at)
    VALUES (?, ?, ?, 'LOGOUT', 'User signed out', ?)
  `).run(req.user.id, req.user.picker_id, req.user.name, now);

  return res.json({ message: 'Logged out successfully', logout_time: now });
});

// POST /api/auth/heartbeat
router.post('/heartbeat', requireAuth, (req, res) => {
  const now = new Date().toISOString();
  if (req.sessionId) {
    db.prepare('UPDATE login_history SET last_activity = ? WHERE id = ?').run(now, req.sessionId);
  }
  return res.json({ status: 'ok', timestamp: now });
});

// GET /api/auth/me - Validate current session token
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, picker_id, name, phone, role, is_active FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  return res.json({ user });
});

// POST /api/auth/admin/send-otp - Request OTP for Admin Phone Number
router.post('/admin/send-otp', (req, res) => {
  const { phone } = req.body;

  if (!phone || !phone.trim()) {
    return res.status(400).json({ error: 'Admin mobile phone number is required.' });
  }

  // Clean phone number (strip +91, dashes, spaces)
  let cleanPhone = phone.trim().replace(/[\s\-\+\(\)]/g, '');
  if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
    cleanPhone = cleanPhone.slice(2);
  }

  // Find Admin account matching this phone (or picker_id = ADMIN-01)
  const admin = db.prepare(`
    SELECT * FROM users 
    WHERE role = 'admin' AND (phone = ? OR phone = ? OR phone LIKE ? OR UPPER(picker_id) = UPPER(?))
  `).get(cleanPhone, `+91${cleanPhone}`, `%${cleanPhone}%`, cleanPhone);

  if (!admin) {
    return res.status(404).json({ 
      error: `No registered Admin account found for phone number: ${phone}. Please contact dark store systems manager.` 
    });
  }

  if (!admin.is_active) {
    return res.status(403).json({ error: 'This Admin account has been deactivated.' });
  }

  // Generate 6-digit secure OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString(); // 5 min expiry
  const nowIso = now.toISOString();

  // Store in admin_otps
  db.prepare(`
    INSERT INTO admin_otps (phone, otp_code, expires_at, is_used, created_at)
    VALUES (?, ?, ?, 0, ?)
  `).run(cleanPhone, otpCode, expiresAt, nowIso);

  // Log in activity trail
  db.prepare(`
    INSERT INTO activity_logs (user_id, picker_id, picker_name, action, details, created_at)
    VALUES (?, ?, ?, 'OTP_REQUESTED', ?, ?)
  `).run(admin.id, admin.picker_id, admin.name, `OTP generated for Admin login via phone ${cleanPhone}`, nowIso);

  console.log(`[SMS GATEWAY SIMULATOR] Delivered to +91 ${cleanPhone}: Your Instamart Admin Login OTP is: ${otpCode}`);

  return res.json({
    success: true,
    message: `OTP sent successfully to +91 ${cleanPhone}`,
    phone: cleanPhone,
    admin_name: admin.name,
    otp_preview: otpCode, // Preview provided for instant testing convenience
    expires_in_seconds: 300
  });
});

// POST /api/auth/admin/verify-otp - Verify OTP and complete Admin Login
router.post('/admin/verify-otp', (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone number and 6-digit OTP code are required.' });
  }

  let cleanPhone = phone.trim().replace(/[\s\-\+\(\)]/g, '');
  if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
    cleanPhone = cleanPhone.slice(2);
  }
  const cleanOtp = otp.trim();

  const nowIso = new Date().toISOString();

  // Check valid OTP
  const validOtp = db.prepare(`
    SELECT * FROM admin_otps 
    WHERE (phone = ? OR phone LIKE ?) 
      AND otp_code = ? 
      AND is_used = 0 
      AND expires_at >= ?
    ORDER BY id DESC LIMIT 1
  `).get(cleanPhone, `%${cleanPhone}%`, cleanOtp, nowIso);

  if (!validOtp) {
    return res.status(401).json({ error: 'Invalid or expired OTP code. Please enter the correct 6-digit code or request a new OTP.' });
  }

  // Mark OTP as used
  db.prepare('UPDATE admin_otps SET is_used = 1 WHERE id = ?').run(validOtp.id);

  // Find Admin user
  const admin = db.prepare(`
    SELECT * FROM users 
    WHERE role = 'admin' AND (phone = ? OR phone = ? OR phone LIKE ? OR UPPER(picker_id) = UPPER(?))
  `).get(cleanPhone, `+91${cleanPhone}`, `%${cleanPhone}%`, cleanPhone);

  if (!admin || !admin.is_active) {
    return res.status(403).json({ error: 'Admin account not found or deactivated.' });
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Browser/Scanner';

  // Record login history
  const sessionResult = db.prepare(`
    INSERT INTO login_history (user_id, picker_id, name, login_time, status, last_activity, ip_address, user_agent)
    VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
  `).run(admin.id, admin.picker_id, admin.name, nowIso, nowIso, ip, userAgent);

  const sessionId = sessionResult.lastInsertRowid;

  // Record activity log
  db.prepare(`
    INSERT INTO activity_logs (user_id, picker_id, picker_name, action, details, created_at)
    VALUES (?, ?, ?, 'LOGIN', ?, ?)
  `).run(admin.id, admin.picker_id, admin.name, `Admin signed in via Phone OTP (+91 ${cleanPhone})`, nowIso);

  const token = jwt.sign(
    { id: admin.id, picker_id: admin.picker_id, role: admin.role, sessionId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return res.json({
    token,
    user: {
      id: admin.id,
      picker_id: admin.picker_id,
      name: admin.name,
      phone: admin.phone || cleanPhone,
      role: admin.role,
      is_active: admin.is_active
    },
    sessionId,
    login_time: nowIso
  });
});

module.exports = router;
