const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDatabase } = require('./db');
const uploadsDir = require('./storage');

const authRoutes = require('./routes/auth');
const locationRoutes = require('./routes/locations');
const auditRoutes = require('./routes/audits');
const negativeItemRoutes = require('./routes/negativeItems');
const userRoutes = require('./routes/users');
const analyticsRoutes = require('./routes/analytics');
const logsRoutes = require('./routes/logs');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;
const rootDir = path.join(__dirname, '..');

// Initialize SQLite database & seed data
initDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads serving
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/negative-items', negativeItemRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/reports', reportsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Swiggy Instamart Rack Audit API'
  });
});

// Dedicated Android APK Download Endpoints
app.get(['/download/app.apk', '/download/Swiggy_Instamart_Rack_Audit.apk', '/api/download/apk'], (req, res) => {
  const targetPath = path.join(rootDir, 'client', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  if (!fs.existsSync(targetPath)) {
    return res.status(503).json({ error: 'Android APK has not been built. Configure the Android SDK and run build-apk.bat.' });
  }

  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="Swiggy_Instamart_Rack_Audit.apk"');
  return res.sendFile(targetPath);
});

// Serve frontend build in production if available
const clientDistPath = path.join(rootDir, 'client', 'dist');
app.use(express.static(clientDistPath));

app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/download')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(200).send('Swiggy Instamart Rack Audit API is running.');
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  Swiggy Instamart Rack Audit Server is active!`);
  console.log(`  Local URL:        http://localhost:${PORT}`);
  console.log(`  Android APK URL:  http://localhost:${PORT}/download/Swiggy_Instamart_Rack_Audit.apk`);
  console.log(`====================================================`);
});
