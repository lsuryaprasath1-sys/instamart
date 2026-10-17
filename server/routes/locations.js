const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const { db } = require('../db');
const uploadsDir = require('../storage');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const upload = multer({ dest: uploadsDir });

// GET /api/locations/query - supports stepwise dependent dropdown queries
router.get('/query', requireAuth, (req, res) => {
  const { floor, aisle, rack, bin } = req.query;

  try {
    // Step 5: Bin selected -> Return full location details
    if (floor !== undefined && aisle !== undefined && rack !== undefined && bin !== undefined) {
      const loc = db.prepare(`
        SELECT * FROM location_master
        WHERE floor = ? AND aisle = ? AND rack = ? AND bin = ? AND is_active = 1
      `).get(floor, aisle, rack, bin);

      if (!loc) {
        return res.status(404).json({ error: 'Location not found in Location Master' });
      }
      return res.json({ location: loc });
    }

    // Step 4: Floor, Aisle, Rack selected -> Return available Bins
    if (floor !== undefined && aisle !== undefined && rack !== undefined) {
      const bins = db.prepare(`
        SELECT DISTINCT bin FROM location_master
        WHERE floor = ? AND aisle = ? AND rack = ? AND is_active = 1
        ORDER BY bin ASC
      `).all(floor, aisle, rack).map(r => r.bin);
      return res.json({ bins });
    }

    // Step 3: Floor, Aisle selected -> Return available Racks
    if (floor !== undefined && aisle !== undefined) {
      const racks = db.prepare(`
        SELECT DISTINCT rack FROM location_master
        WHERE floor = ? AND aisle = ? AND is_active = 1
        ORDER BY CAST(rack AS INTEGER), rack ASC
      `).all(floor, aisle).map(r => r.rack);
      return res.json({ racks });
    }

    // Step 2: Floor selected -> Return available Aisles
    if (floor !== undefined) {
      const aisles = db.prepare(`
        SELECT DISTINCT aisle FROM location_master
        WHERE floor = ? AND is_active = 1
        ORDER BY aisle ASC
      `).all(floor).map(r => r.aisle);
      return res.json({ aisles });
    }

    // Step 1: Return available Floors
    const floors = db.prepare(`
      SELECT DISTINCT floor FROM location_master
      WHERE is_active = 1
      ORDER BY CAST(floor AS INTEGER), floor ASC
    `).all().map(r => r.floor);
    return res.json({ floors });
  } catch (err) {
    console.error('Error querying locations:', err);
    return res.status(500).json({ error: 'Failed to query locations' });
  }
});

// GET /api/locations/hierarchy - Full tree for instant client caching
router.get('/hierarchy', requireAuth, (req, res) => {
  try {
    const allLocations = db.prepare(`
      SELECT * FROM location_master
      WHERE is_active = 1
      ORDER BY floor, aisle, CAST(rack AS INTEGER), rack, bin
    `).all();

    res.json({ locations: allLocations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch location hierarchy' });
  }
});

// GET /api/locations/stats
router.get('/stats', requireAuth, (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM location_master WHERE is_active = 1').get().count;
    const floors = db.prepare('SELECT COUNT(DISTINCT floor) as count FROM location_master WHERE is_active = 1').get().count;
    const aisles = db.prepare('SELECT COUNT(DISTINCT aisle) as count FROM location_master WHERE is_active = 1').get().count;
    const racks = db.prepare('SELECT COUNT(DISTINCT rack) as count FROM location_master WHERE is_active = 1').get().count;
    const bins = db.prepare('SELECT COUNT(DISTINCT bin) as count FROM location_master WHERE is_active = 1').get().count;
    const zones = db.prepare('SELECT DISTINCT zone_type FROM location_master WHERE is_active = 1 AND zone_type IS NOT NULL').all().map(z => z.zone_type);

    res.json({
      total_locations: total,
      total_floors: floors,
      total_aisles: aisles,
      total_racks: racks,
      total_bins: bins,
      zones
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch location stats' });
  }
});

// GET /api/locations/sample-csv - Download template CSV
router.get('/sample-csv', (req, res) => {
  const sampleCsv = `Floor,Aisle,Rack,Bin,Rank,ZoneType,PrimaryFcOperationType,RackType,SpaceType,StorageType
0,A,1,S,1,Ambient,Pick,Standard,Shelf,Pallet
0,A,1,M,2,Ambient,Pick,Standard,Shelf,Bin
0,A,2,S,1,Ambient,Pick,Standard,Shelf,Bin
0,B,1,S,1,FMCG,Pick,Standard,Shelf,Carton
0,C,1,S,1,Chilled,Pick,Cooler,Drawer,ColdBin
0,C,2,M,1,Frozen,Pick,DeepFreezer,Floor,Tote
1,D,1,S,1,High-Value,Pick,SecureCage,Shelf,Bin
1,E,1,L,1,Bulky,Replenish,Cantilever,Floor,Pallet
1,E,2,XL,2,Beverages,Pick,HeavyDuty,Shelf,Carton`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="Location_Master_Template.csv"');
  return res.send(sampleCsv);
});

// POST /api/locations/upload-csv - Admin upload & replace/append Location Master
router.post('/upload-csv', requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded' });
  }

  const mode = req.body.mode || 'replace'; // 'replace' or 'append'
  const filePath = req.file.path;
  const rows = [];
  const errors = [];
  let lineCount = 0;

  try {
    const stream = fs.createReadStream(filePath).pipe(csvParser());

    for await (const row of stream) {
      lineCount++;
      // Clean headers & values (trim whitespace and handle case)
      const cleanRow = {};
      for (const [key, val] of Object.entries(row)) {
        cleanRow[key.trim().toLowerCase()] = (val || '').trim();
      }

      const floor = cleanRow['floor'];
      const aisle = cleanRow['aisle'];
      const rack = cleanRow['rack'];
      const bin = cleanRow['bin'];
      const rank = cleanRow['rank'] || '';
      const zoneType = cleanRow['zonetype'] || cleanRow['zone_type'] || cleanRow['zone'] || 'Ambient';
      const primaryFcOp = cleanRow['primaryfcoperationtype'] || cleanRow['primary_fc_operation_type'] || 'Pick';
      const rackType = cleanRow['racktype'] || cleanRow['rack_type'] || 'Standard';
      const spaceType = cleanRow['spacetype'] || cleanRow['space_type'] || 'Shelf';
      const storageType = cleanRow['storagetype'] || cleanRow['storage_type'] || 'Bin';

      if (!floor || !aisle || !rack || !bin) {
        errors.push(`Row ${lineCount}: Missing required location coordinates (Floor, Aisle, Rack, or Bin)`);
        continue;
      }

      rows.push({
        floor,
        aisle,
        rack,
        bin,
        location_id: `${floor}-${aisle}-${rack}-${bin}`,
        rank,
        zone_type: zoneType,
        primary_fc_operation_type: primaryFcOp,
        rack_type: rackType,
        space_type: spaceType,
        storage_type: storageType
      });
    }

    if (rows.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'The uploaded CSV contained no valid location rows.', errors });
    }

    const now = new Date().toISOString();

    const insertOrReplace = db.transaction(() => {
      if (mode === 'replace') {
        db.prepare('DELETE FROM location_master').run();
      }

      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO location_master (
          floor, aisle, rack, bin, location_id, rank, zone_type,
          primary_fc_operation_type, rack_type, space_type, storage_type, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `);

      for (const item of rows) {
        insertStmt.run(
          item.floor,
          item.aisle,
          item.rack,
          item.bin,
          item.location_id,
          item.rank,
          item.zone_type,
          item.primary_fc_operation_type,
          item.rack_type,
          item.space_type,
          item.storage_type,
          now
        );
      }
    });

    insertOrReplace();

    // Log action
    db.prepare(`
      INSERT INTO activity_logs (user_id, picker_id, picker_name, action, details, created_at)
      VALUES (?, ?, ?, 'LOCATION_MASTER_UPLOADED', ?, ?)
    `).run(
      req.user.id,
      req.user.picker_id,
      req.user.name,
      `Uploaded Location Master CSV: ${rows.length} rows processed (${mode} mode)`,
      now
    );

    // Clean up temp file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const totalLocations = db.prepare('SELECT COUNT(*) as count FROM location_master WHERE is_active = 1').get().count;

    return res.json({
      message: `Successfully uploaded ${rows.length} locations. Total active warehouse locations: ${totalLocations}.`,
      inserted_count: rows.length,
      total_locations: totalLocations,
      mode,
      errors: errors.slice(0, 5) // return first 5 if any
    });

  } catch (err) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error('Error processing Location Master CSV:', err);
    return res.status(500).json({ error: 'Failed to parse and import Location Master CSV: ' + err.message });
  }
});

module.exports = router;
