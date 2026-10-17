const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'swiggy-instamart-warehouse-audit-secret-2026';

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token missing or invalid format' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists and is active
    const user = db.prepare('SELECT id, picker_id, name, role, is_active FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User account not found' });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account has been deactivated by administrator. Please contact warehouse lead.' });
    }

    req.user = user;
    req.sessionId = decoded.sessionId;

    // Update last_activity in login_history
    if (req.sessionId) {
      const now = new Date().toISOString();
      db.prepare('UPDATE login_history SET last_activity = ? WHERE id = ?').run(now, req.sessionId);
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required for this action' });
    }
    next();
  });
}

module.exports = {
  JWT_SECRET,
  requireAuth,
  requireAdmin
};
