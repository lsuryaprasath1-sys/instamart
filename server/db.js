const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'audit_database.sqlite');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      picker_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'picker', -- 'admin' or 'picker'
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      is_used INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS login_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      picker_id TEXT NOT NULL,
      name TEXT NOT NULL,
      login_time TEXT NOT NULL,
      logout_time TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE' or 'INACTIVE'
      last_activity TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT
    );

    CREATE TABLE IF NOT EXISTS location_master (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      floor TEXT NOT NULL,
      aisle TEXT NOT NULL,
      rack TEXT NOT NULL,
      bin TEXT NOT NULL,
      location_id TEXT NOT NULL,
      rank TEXT,
      zone_type TEXT,
      primary_fc_operation_type TEXT,
      rack_type TEXT,
      space_type TEXT,
      storage_type TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      UNIQUE(floor, aisle, rack, bin)
    );

    CREATE TABLE IF NOT EXISTS audits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_id TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      picker_id TEXT NOT NULL,
      picker_name TEXT NOT NULL,
      floor TEXT NOT NULL,
      aisle TEXT NOT NULL,
      rack TEXT NOT NULL,
      bin TEXT NOT NULL,
      location_id TEXT NOT NULL,
      rank TEXT,
      zone_type TEXT,
      primary_fc_operation_type TEXT,
      rack_type TEXT,
      space_type TEXT,
      storage_type TEXT,
      total_skus INTEGER DEFAULT 0,
      negative_items_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'COMPLETED', -- 'COMPLETED', 'FLAGGED', 'UNDER_REVIEW'
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_id TEXT NOT NULL,
      sku_id TEXT NOT NULL,
      sku_name TEXT,
      quantity INTEGER NOT NULL,
      status TEXT NOT NULL, -- 'Available', 'Negative/Missing', 'Damaged', 'Mismatch'
      remarks TEXT,
      photo_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS negative_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_id TEXT NOT NULL,
      audit_item_id INTEGER,
      sku_id TEXT NOT NULL,
      sku_name TEXT,
      quantity INTEGER NOT NULL,
      picker_id TEXT NOT NULL,
      picker_name TEXT NOT NULL,
      floor TEXT NOT NULL,
      aisle TEXT NOT NULL,
      rack TEXT NOT NULL,
      bin TEXT NOT NULL,
      location_id TEXT NOT NULL,
      zone_type TEXT,
      remarks TEXT NOT NULL,
      photo_url TEXT,
      resolution_status TEXT DEFAULT 'Open', -- 'Open', 'Under Review', 'Resolved'
      resolution_notes TEXT,
      resolved_by TEXT,
      resolved_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_id TEXT,
      sku_id TEXT,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      picker_id TEXT,
      picker_name TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_loc_floor_aisle_rack ON location_master(floor, aisle, rack);
    CREATE INDEX IF NOT EXISTS idx_audits_picker ON audits(picker_id);
    CREATE INDEX IF NOT EXISTS idx_audits_created ON audits(created_at);
    CREATE INDEX IF NOT EXISTS idx_negative_picker ON negative_items(picker_id);
    CREATE INDEX IF NOT EXISTS idx_negative_status ON negative_items(resolution_status);
  `);

  seedInitialData();
}

function seedInitialData() {
  const now = new Date().toISOString();

  // Migration: ensure phone column exists in users
  try {
    const tableInfo = db.prepare("PRAGMA table_info(users)").all();
    const hasPhone = tableInfo.some(col => col.name === 'phone');
    if (!hasPhone) {
      db.prepare("ALTER TABLE users ADD COLUMN phone TEXT").run();
      console.log("Added 'phone' column to users table.");
    }
  } catch (e) {
    console.warn("Phone column migration check:", e.message);
  }

  // Ensure active Admin accounts have a phone number for OTP login.
  try {
    db.prepare("UPDATE users SET phone = '9876543210' WHERE role = 'admin' AND is_active = 1 AND (phone IS NULL OR phone = '')").run();
  } catch (e) {}
  
  // 1. Seed Users if empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    console.log('Seeding initial users...');
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('6382', salt);
    const pickerHash = bcrypt.hashSync('picker123', salt);

    const insertUser = db.prepare(`
      INSERT INTO users (picker_id, name, phone, password_hash, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('SURYA', 'Surya', '9876543210', adminHash, 'admin', 1, now, now);
    insertUser.run('PKR-101', 'Ramesh Kumar (Zone A Picker)', '', pickerHash, 'picker', 1, now, now);
    insertUser.run('PKR-102', 'Priya Sharma (Zone B Picker)', '', pickerHash, 'picker', 1, now, now);
    insertUser.run('PKR-103', 'Amit Verma (Cold Room Picker)', '', pickerHash, 'picker', 1, now, now);
    insertUser.run('PKR-104', 'Kavita Nair (High-Value Picker)', '', pickerHash, 'picker', 0, now, now); // Inactive test account

    db.prepare(`
      INSERT INTO activity_logs (picker_id, picker_name, action, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run('SYSTEM', 'System Initializer', 'USER_CREATED', 'Seeded initial Admin and Picker accounts', now);
  }

  const customUser = db.prepare('SELECT id FROM users WHERE UPPER(picker_id) = UPPER(?)').get('638279');
  if (!customUser) {
    const salt = bcrypt.genSaltSync(10);
    const customHash = bcrypt.hashSync('638279', salt);
    db.prepare(`
      INSERT INTO users (picker_id, name, phone, password_hash, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('638279', 'User 638279', '638279', customHash, 'picker', 1, now, now);

    db.prepare(`
      INSERT INTO activity_logs (picker_id, picker_name, action, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run('SYSTEM', 'System Initializer', 'USER_CREATED', 'Created custom login account for 638279', now);
  }

  // 2. Seed Location Master if empty
  const locCount = db.prepare('SELECT COUNT(*) as count FROM location_master').get().count;
  if (locCount === 0) {
    console.log('Seeding Location Master...');
    const insertLoc = db.prepare(`
      INSERT INTO location_master (
        floor, aisle, rack, bin, location_id, rank, zone_type,
        primary_fc_operation_type, rack_type, space_type, storage_type, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    const locations = [
      // Floor 0 - Ground Floor Ambient (Aisles A, B)
      { floor: '0', aisle: 'A', rack: '1', bin: 'S', rank: '1', zone_type: 'Ambient', primary_fc_operation_type: 'Pick', rack_type: 'Standard', space_type: 'Shelf', storage_type: 'Pallet' },
      { floor: '0', aisle: 'A', rack: '1', bin: 'M', rank: '2', zone_type: 'Ambient', primary_fc_operation_type: 'Pick', rack_type: 'Standard', space_type: 'Shelf', storage_type: 'Bin' },
      { floor: '0', aisle: 'A', rack: '1', bin: 'L', rank: '3', zone_type: 'Ambient', primary_fc_operation_type: 'Pick', rack_type: 'Standard', space_type: 'Shelf', storage_type: 'Carton' },
      { floor: '0', aisle: 'A', rack: '2', bin: 'S', rank: '1', zone_type: 'Ambient', primary_fc_operation_type: 'Pick', rack_type: 'Standard', space_type: 'Shelf', storage_type: 'Bin' },
      { floor: '0', aisle: 'A', rack: '2', bin: 'M', rank: '2', zone_type: 'Ambient', primary_fc_operation_type: 'Pick', rack_type: 'Standard', space_type: 'Shelf', storage_type: 'Bin' },
      { floor: '0', aisle: 'A', rack: '3', bin: 'A1', rank: '1', zone_type: 'Ambient', primary_fc_operation_type: 'Pick', rack_type: 'GravityFlow', space_type: 'Shelf', storage_type: 'Tote' },
      { floor: '0', aisle: 'A', rack: '3', bin: 'B1', rank: '2', zone_type: 'Ambient', primary_fc_operation_type: 'Pick', rack_type: 'GravityFlow', space_type: 'Shelf', storage_type: 'Tote' },
      
      { floor: '0', aisle: 'B', rack: '1', bin: 'S', rank: '1', zone_type: 'FMCG', primary_fc_operation_type: 'Pick', rack_type: 'Standard', space_type: 'Shelf', storage_type: 'Carton' },
      { floor: '0', aisle: 'B', rack: '1', bin: 'M', rank: '2', zone_type: 'FMCG', primary_fc_operation_type: 'Pick', rack_type: 'Standard', space_type: 'Shelf', storage_type: 'Carton' },
      { floor: '0', aisle: 'B', rack: '2', bin: 'S', rank: '1', zone_type: 'FMCG', primary_fc_operation_type: 'Pick', rack_type: 'Standard', space_type: 'Shelf', storage_type: 'Bin' },
      { floor: '0', aisle: 'B', rack: '2', bin: 'L', rank: '2', zone_type: 'FMCG', primary_fc_operation_type: 'Replenish', rack_type: 'HeavyDuty', space_type: 'Floor', storage_type: 'Pallet' },

      // Floor 0 - Chilled & Cold Rooms (Aisle C)
      { floor: '0', aisle: 'C', rack: '1', bin: 'S', rank: '1', zone_type: 'Chilled', primary_fc_operation_type: 'Pick', rack_type: 'Cooler', space_type: 'Drawer', storage_type: 'ColdBin' },
      { floor: '0', aisle: 'C', rack: '1', bin: 'M', rank: '2', zone_type: 'Chilled', primary_fc_operation_type: 'Pick', rack_type: 'Cooler', space_type: 'Drawer', storage_type: 'ColdBin' },
      { floor: '0', aisle: 'C', rack: '2', bin: 'S', rank: '1', zone_type: 'Frozen', primary_fc_operation_type: 'Pick', rack_type: 'DeepFreezer', space_type: 'Floor', storage_type: 'Tote' },
      { floor: '0', aisle: 'C', rack: '2', bin: 'M', rank: '2', zone_type: 'Frozen', primary_fc_operation_type: 'Pick', rack_type: 'DeepFreezer', space_type: 'Floor', storage_type: 'Tote' },

      // Floor 1 - Mezzanine High-Value & Bulky (Aisles D, E)
      { floor: '1', aisle: 'D', rack: '1', bin: 'S', rank: '1', zone_type: 'High-Value', primary_fc_operation_type: 'Pick', rack_type: 'SecureCage', space_type: 'Shelf', storage_type: 'Bin' },
      { floor: '1', aisle: 'D', rack: '1', bin: 'M', rank: '2', zone_type: 'High-Value', primary_fc_operation_type: 'Pick', rack_type: 'SecureCage', space_type: 'Shelf', storage_type: 'Bin' },
      { floor: '1', aisle: 'D', rack: '2', bin: 'S', rank: '1', zone_type: 'Personal Care', primary_fc_operation_type: 'Pick', rack_type: 'Standard', space_type: 'Shelf', storage_type: 'Carton' },
      { floor: '1', aisle: 'D', rack: '2', bin: 'M', rank: '2', zone_type: 'Personal Care', primary_fc_operation_type: 'Pick', rack_type: 'Standard', space_type: 'Shelf', storage_type: 'Carton' },

      { floor: '1', aisle: 'E', rack: '1', bin: 'L', rank: '1', zone_type: 'Bulky', primary_fc_operation_type: 'Replenish', rack_type: 'Cantilever', space_type: 'Floor', storage_type: 'Pallet' },
      { floor: '1', aisle: 'E', rack: '1', bin: 'XL', rank: '2', zone_type: 'Bulky', primary_fc_operation_type: 'Replenish', rack_type: 'Cantilever', space_type: 'Floor', storage_type: 'Pallet' },
      { floor: '1', aisle: 'E', rack: '2', bin: 'L', rank: '1', zone_type: 'Beverages', primary_fc_operation_type: 'Pick', rack_type: 'HeavyDuty', space_type: 'Shelf', storage_type: 'Carton' },
      { floor: '1', aisle: 'E', rack: '2', bin: 'XL', rank: '2', zone_type: 'Beverages', primary_fc_operation_type: 'Pick', rack_type: 'HeavyDuty', space_type: 'Shelf', storage_type: 'Carton' },
    ];

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        const locationId = `${item.floor}-${item.aisle}-${item.rack}-${item.bin}`;
        insertLoc.run(
          item.floor,
          item.aisle,
          item.rack,
          item.bin,
          locationId,
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

    insertMany(locations);
    console.log(`Seeded ${locations.length} warehouse locations into LocationMaster.`);
  }

  // 3. Seed Sample Audits and Negative Items if empty
  const auditCount = db.prepare('SELECT COUNT(*) as count FROM audits').get().count;
  if (auditCount === 0) {
    console.log('Seeding sample audits and negative items...');
    
    // Sample Audit 1 by PKR-101
    const auditId1 = 'AUD-20261009-1001';
    db.prepare(`
      INSERT INTO audits (
        audit_id, user_id, picker_id, picker_name, floor, aisle, rack, bin, location_id,
        rank, zone_type, primary_fc_operation_type, rack_type, space_type, storage_type,
        total_skus, negative_items_count, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditId1, 2, 'PKR-101', 'Ramesh Kumar (Zone A Picker)', '0', 'A', '1', 'S', '0-A-1-S',
      '1', 'Ambient', 'Pick', 'Standard', 'Shelf', 'Pallet',
      3, 1, 'FLAGGED', '2026-10-09T09:15:00.000Z'
    );

    // Items for Audit 1
    const item1 = db.prepare(`
      INSERT INTO audit_items (audit_id, sku_id, sku_name, quantity, status, remarks, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(auditId1, '8901030383756', 'Maggi 2-Minute Noodles 70g Pack of 4', 24, 'Available', 'Stock verified on top rack shelf', '2026-10-09T09:15:00.000Z');

    const item2 = db.prepare(`
      INSERT INTO audit_items (audit_id, sku_id, sku_name, quantity, status, remarks, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(auditId1, '8901491101837', 'Amul Salted Butter 500g', 3, 'Negative/Missing', 'Physical stock shows 3 units missing from bin inventory', '2026-10-09T09:15:00.000Z');

    const item3 = db.prepare(`
      INSERT INTO audit_items (audit_id, sku_id, sku_name, quantity, status, remarks, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(auditId1, '8901233024018', 'Tata Salt Iodized 1kg', 12, 'Available', 'Intact bags counted', '2026-10-09T09:15:00.000Z');

    // Negative item entry
    db.prepare(`
      INSERT INTO negative_items (
        audit_id, audit_item_id, sku_id, sku_name, quantity, picker_id, picker_name,
        floor, aisle, rack, bin, location_id, zone_type, remarks, resolution_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditId1, item2.lastInsertRowid, '8901491101837', 'Amul Salted Butter 500g', 3, 'PKR-101', 'Ramesh Kumar (Zone A Picker)',
      '0', 'A', '1', 'S', '0-A-1-S', 'Ambient', 'Physical stock shows 3 units missing from bin inventory', 'Open', '2026-10-09T09:15:00.000Z'
    );

    // Sample Audit 2 by PKR-102
    const auditId2 = 'AUD-20261009-1002';
    db.prepare(`
      INSERT INTO audits (
        audit_id, user_id, picker_id, picker_name, floor, aisle, rack, bin, location_id,
        rank, zone_type, primary_fc_operation_type, rack_type, space_type, storage_type,
        total_skus, negative_items_count, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditId2, 3, 'PKR-102', 'Priya Sharma (Zone B Picker)', '0', 'B', '1', 'S', '0-B-1-S',
      '1', 'FMCG', 'Pick', 'Standard', 'Shelf', 'Carton',
      2, 1, 'FLAGGED', '2026-10-09T14:30:00.000Z'
    );

    const item4 = db.prepare(`
      INSERT INTO audit_items (audit_id, sku_id, sku_name, quantity, status, remarks, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(auditId2, '8901725181222', 'Colgate Total Toothpaste 150g', 15, 'Available', 'Full shelf count matched', '2026-10-09T14:30:00.000Z');

    const item5 = db.prepare(`
      INSERT INTO audit_items (audit_id, sku_id, sku_name, quantity, status, remarks, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(auditId2, '8902579100201', 'Aashirvaad Superior MP Sharbati Atta 5kg', 2, 'Negative/Missing', 'Missing 2 bags, shelf seal broken', '2026-10-09T14:30:00.000Z');

    db.prepare(`
      INSERT INTO negative_items (
        audit_id, audit_item_id, sku_id, sku_name, quantity, picker_id, picker_name,
        floor, aisle, rack, bin, location_id, zone_type, remarks, resolution_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditId2, item5.lastInsertRowid, '8902579100201', 'Aashirvaad Superior MP Sharbati Atta 5kg', 2, 'PKR-102', 'Priya Sharma (Zone B Picker)',
      '0', 'B', '1', 'S', '0-B-1-S', 'FMCG', 'Missing 2 bags, shelf seal broken', 'Under Review', '2026-10-09T14:30:00.000Z'
    );

    // Sample Audit 3 by PKR-103
    const auditId3 = 'AUD-20261010-1003';
    db.prepare(`
      INSERT INTO audits (
        audit_id, user_id, picker_id, picker_name, floor, aisle, rack, bin, location_id,
        rank, zone_type, primary_fc_operation_type, rack_type, space_type, storage_type,
        total_skus, negative_items_count, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditId3, 4, 'PKR-103', 'Amit Verma (Cold Room Picker)', '0', 'C', '1', 'S', '0-C-1-S',
      '1', 'Chilled', 'Pick', 'Cooler', 'Drawer', 'ColdBin',
      3, 0, 'COMPLETED', now
    );

    db.prepare(`
      INSERT INTO audit_items (audit_id, sku_id, sku_name, quantity, status, remarks, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(auditId3, '8901262010012', 'Amul Taaza Homogenised Toned Milk 1L', 30, 'Available', 'Chilled temp 4C verified', now);

    // Initial Login History records
    db.prepare(`
      INSERT INTO login_history (user_id, picker_id, name, login_time, logout_time, status, last_activity, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(2, 'PKR-101', 'Ramesh Kumar (Zone A Picker)', '2026-10-09T08:00:00.000Z', '2026-10-09T16:30:00.000Z', 'INACTIVE', '2026-10-09T16:30:00.000Z', '127.0.0.1', 'Mozilla/5.0 Handheld RF Scanner');

    db.prepare(`
      INSERT INTO login_history (user_id, picker_id, name, login_time, logout_time, status, last_activity, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(3, 'PKR-102', 'Priya Sharma (Zone B Picker)', '2026-10-09T08:30:00.000Z', '2026-10-09T17:00:00.000Z', 'INACTIVE', '2026-10-09T17:00:00.000Z', '127.0.0.1', 'Mozilla/5.0 Handheld RF Scanner');

    db.prepare(`
      INSERT INTO login_history (user_id, picker_id, name, login_time, logout_time, status, last_activity, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(4, 'PKR-103', 'Amit Verma (Cold Room Picker)', now, null, 'ACTIVE', now, '127.0.0.1', 'Mozilla/5.0 Mobile PWA');
  }
}

// Product catalog helper for barcode simulation and auto-completion
const PRODUCT_CATALOG = [
  { sku_id: '8901030383756', name: 'Maggi 2-Minute Noodles 70g Pack of 4', category: 'Instant Food', price: 56 },
  { sku_id: '8901491101837', name: 'Amul Salted Butter 500g', category: 'Dairy', price: 275 },
  { sku_id: '8901233024018', name: 'Tata Salt Vacuum Evaporated Iodized 1kg', category: 'Staples', price: 28 },
  { sku_id: '8901725181222', name: 'Colgate Total 12H Anti-Germ Toothpaste 150g', category: 'Personal Care', price: 140 },
  { sku_id: '8902579100201', name: 'Aashirvaad Superior MP Sharbati Atta 5kg', category: 'Atta & Flours', price: 310 },
  { sku_id: '8901262010012', name: 'Amul Taaza Homogenised Toned Milk 1L Tetra', category: 'Dairy', price: 74 },
  { sku_id: '8901058852999', name: 'Lay\'s India\'s Magic Masala Potato Chips 50g', category: 'Snacks', price: 20 },
  { sku_id: '8901030025403', name: 'Bru Instant Coffee Powder Jar 100g', category: 'Beverages', price: 215 },
  { sku_id: '8901030341824', name: 'Surf Excel Quick Wash Detergent Powder 1kg', category: 'Cleaning', price: 145 },
  { sku_id: '8901719114144', name: 'Dettol Original Germ Protection Bathing Soap 125g', category: 'Personal Care', price: 68 }
];

module.exports = {
  db,
  initDatabase,
  PRODUCT_CATALOG
};
