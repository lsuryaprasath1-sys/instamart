const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db, PRODUCT_CATALOG } = require('../db');
const uploadsDir = require('../storage');
const { requireAuth } = require('../middleware/auth');

// Multer storage for photos
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(uploadsDir, 'photos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'audit-proof-' + uniqueSuffix + ext);
  }
});

const uploadPhoto = multer({
  storage: photoStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are permitted'));
    }
  }
});

// POST /api/audits/upload-photo - Upload item photo
router.post('/upload-photo', requireAuth, uploadPhoto.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const fileUrl = `/uploads/photos/${req.file.filename}`;
  res.json({
    url: fileUrl,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
});

// GET /api/audits/sku-lookup/:sku - Quick barcode lookup helper
router.get('/sku-lookup/:sku', requireAuth, (req, res) => {
  const query = req.params.sku.trim();
  const found = PRODUCT_CATALOG.find(p => p.sku_id === query || p.sku_id.endsWith(query));
  if (found) {
    return res.json({ product: found });
  }
  return res.json({ product: null });
});

// GET /api/audits/catalog - List all demo catalog products for easy testing
router.get('/catalog', requireAuth, (req, res) => {
  res.json({ catalog: PRODUCT_CATALOG });
});

// POST /api/audits - Submit a new rack audit
router.post('/', requireAuth, (req, res) => {
  const { location, items } = req.body;

  if (!location) {
    return res.status(400).json({ error: 'Warehouse location is required' });
  }

  const { floor, aisle, rack, bin } = location;
  if (!floor || !aisle || !rack || !bin) {
    return res.status(400).json({ error: 'Incomplete location coordinates. Select Floor, Aisle, Rack, and Bin.' });
  }

  // Verify against Location Master
  const locRecord = db.prepare(`
    SELECT * FROM location_master
    WHERE floor = ? AND aisle = ? AND rack = ? AND bin = ? AND is_active = 1
  `).get(floor, aisle, rack, bin);

  if (!locRecord) {
    return res.status(400).json({
      error: `Invalid location ${floor}-${aisle}-${rack}-${bin}. Location must exist in the uploaded Location Master.`
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'At least one SKU item must be added to the audit.' });
  }

  // Validate items
  const validatedItems = [];
  let negativeCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const skuId = (item.sku_id || '').trim();
    const qty = parseInt(item.quantity, 10);
    const status = (item.status || '').trim();
    const remarks = (item.remarks || '').trim();
    const photoUrl = item.photo_url || null;

    if (!skuId) {
      return res.status(400).json({ error: `Item #${i + 1}: SKU ID is mandatory.` });
    }

    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({ error: `Item #${i + 1} (${skuId}): Valid quantity is mandatory.` });
    }

    const validStatuses = ['Available', 'Negative/Missing', 'Damaged', 'Mismatch'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Item #${i + 1} (${skuId}): Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Negative/Missing validation rules
    if (status === 'Negative/Missing') {
      if (!remarks) {
        return res.status(400).json({
          error: `Item #${i + 1} (${skuId}): Remarks are mandatory for Negative/Missing items.`
        });
      }
      negativeCount++;
    }

    // Try finding product name from catalog or fallback
    const matchedProduct = PRODUCT_CATALOG.find(p => p.sku_id === skuId);
    const skuName = item.sku_name || (matchedProduct ? matchedProduct.name : `SKU #${skuId}`);

    validatedItems.push({
      sku_id: skuId,
      sku_name: skuName,
      quantity: qty,
      status,
      remarks,
      photo_url: photoUrl
    });
  }

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const auditId = `AUD-${dateStr}-${randomSuffix}`;
  const nowIso = now.toISOString();

  const overallStatus = negativeCount > 0 ? 'FLAGGED' : 'COMPLETED';

  try {
    const transaction = db.transaction(() => {
      // 1. Insert audit record
      db.prepare(`
        INSERT INTO audits (
          audit_id, user_id, picker_id, picker_name, floor, aisle, rack, bin, location_id,
          rank, zone_type, primary_fc_operation_type, rack_type, space_type, storage_type,
          total_skus, negative_items_count, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        auditId,
        req.user.id,
        req.user.picker_id,
        req.user.name,
        locRecord.floor,
        locRecord.aisle,
        locRecord.rack,
        locRecord.bin,
        locRecord.location_id,
        locRecord.rank || '',
        locRecord.zone_type || '',
        locRecord.primary_fc_operation_type || '',
        locRecord.rack_type || '',
        locRecord.space_type || '',
        locRecord.storage_type || '',
        validatedItems.length,
        negativeCount,
        overallStatus,
        nowIso
      );

      // 2. Insert audit items and negative items
      const insertAuditItem = db.prepare(`
        INSERT INTO audit_items (
          audit_id, sku_id, sku_name, quantity, status, remarks, photo_url, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertNegativeItem = db.prepare(`
        INSERT INTO negative_items (
          audit_id, audit_item_id, sku_id, sku_name, quantity, picker_id, picker_name,
          floor, aisle, rack, bin, location_id, zone_type, remarks, photo_url,
          resolution_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', ?)
      `);

      const insertPhoto = db.prepare(`
        INSERT INTO photos (audit_id, sku_id, file_path, file_name, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const item of validatedItems) {
        const itemRes = insertAuditItem.run(
          auditId,
          item.sku_id,
          item.sku_name,
          item.quantity,
          item.status,
          item.remarks,
          item.photo_url,
          nowIso
        );

        if (item.status === 'Negative/Missing') {
          insertNegativeItem.run(
            auditId,
            itemRes.lastInsertRowid,
            item.sku_id,
            item.sku_name,
            item.quantity,
            req.user.picker_id,
            req.user.name,
            locRecord.floor,
            locRecord.aisle,
            locRecord.rack,
            locRecord.bin,
            locRecord.location_id,
            locRecord.zone_type || '',
            item.remarks,
            item.photo_url,
            nowIso
          );
        }

        if (item.photo_url) {
          const fileName = path.basename(item.photo_url);
          insertPhoto.run(auditId, item.sku_id, item.photo_url, fileName, nowIso);
        }
      }

      // 3. Insert activity log
      db.prepare(`
        INSERT INTO activity_logs (user_id, picker_id, picker_name, action, details, created_at)
        VALUES (?, ?, ?, 'AUDIT_SUBMITTED', ?, ?)
      `).run(
        req.user.id,
        req.user.picker_id,
        req.user.name,
        `Submitted audit ${auditId} at ${locRecord.location_id} with ${validatedItems.length} SKUs (${negativeCount} negative)`,
        nowIso
      );
    });

    transaction();

    return res.status(201).json({
      message: 'Rack audit submitted successfully',
      audit_id: auditId,
      location_id: locRecord.location_id,
      total_skus: validatedItems.length,
      negative_items_count: negativeCount,
      status: overallStatus,
      created_at: nowIso
    });

  } catch (err) {
    console.error('Error saving audit:', err);
    return res.status(500).json({ error: 'Failed to record rack audit: ' + err.message });
  }
});

// GET /api/audits - List audits with role filtering and search
router.get('/', requireAuth, (req, res) => {
  const { date_from, date_to, rack, sku_id, status, picker_id } = req.query;

  let query = 'SELECT * FROM audits WHERE 1=1';
  const params = [];

  // Role check: Picker sees only their own audits
  if (req.user.role === 'picker') {
    query += ' AND picker_id = ?';
    params.push(req.user.picker_id);
  } else if (picker_id) {
    // Admin filtering by specific picker
    query += ' AND UPPER(picker_id) = UPPER(?)';
    params.push(picker_id);
  }

  if (date_from) {
    query += ' AND created_at >= ?';
    params.push(date_from);
  }

  if (date_to) {
    query += ' AND created_at <= ?';
    params.push(date_to + 'T23:59:59.999Z');
  }

  if (rack) {
    query += ' AND rack = ?';
    params.push(rack);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (sku_id) {
    query += ` AND audit_id IN (SELECT audit_id FROM audit_items WHERE sku_id LIKE ?)`;
    params.push(`%${sku_id}%`);
  }

  query += ' ORDER BY created_at DESC LIMIT 200';

  try {
    const audits = db.prepare(query).all(...params);
    res.json({ audits });
  } catch (err) {
    console.error('Error fetching audits:', err);
    res.status(500).json({ error: 'Failed to load audits' });
  }
});

// GET /api/audits/:audit_id - Audit details with items
router.get('/:audit_id', requireAuth, (req, res) => {
  const { audit_id } = req.params;

  try {
    const audit = db.prepare('SELECT * FROM audits WHERE audit_id = ?').get(audit_id);
    if (!audit) {
      return res.status(404).json({ error: 'Audit record not found' });
    }

    // Ensure picker can only view their own
    if (req.user.role === 'picker' && audit.picker_id !== req.user.picker_id) {
      return res.status(403).json({ error: 'Unauthorized to view this audit' });
    }

    const items = db.prepare('SELECT * FROM audit_items WHERE audit_id = ?').all(audit_id);
    const photos = db.prepare('SELECT * FROM photos WHERE audit_id = ?').all(audit_id);

    res.json({
      audit,
      items,
      photos
    });
  } catch (err) {
    console.error('Error fetching audit details:', err);
    res.status(500).json({ error: 'Failed to load audit details' });
  }
});

module.exports = router;
