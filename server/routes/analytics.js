const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAdmin } = require('../middleware/auth');

// GET /api/analytics/dashboard - All Admin Dashboard metrics & charts data
router.get('/dashboard', requireAdmin, (req, res) => {
  const { date_from, date_to, picker_id, floor, aisle, rack, zone_type } = req.query;

  try {
    const todayStr = new Date().toISOString().slice(0, 10);

    // 1. Summary Cards
    const totalPickers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'picker'").get().count;
    
    // Active pickers: logged in and status = 'ACTIVE' within last 24h
    const activePickers = db.prepare(`
      SELECT COUNT(DISTINCT picker_id) as count 
      FROM login_history 
      WHERE status = 'ACTIVE'
    `).get().count;

    const totalAudits = db.prepare('SELECT COUNT(*) as count FROM audits').get().count;
    const totalNegativeItems = db.prepare('SELECT COUNT(*) as count FROM negative_items').get().count;
    const openNegativeItems = db.prepare("SELECT COUNT(*) as count FROM negative_items WHERE resolution_status = 'Open'").get().count;
    const resolvedNegativeItems = db.prepare("SELECT COUNT(*) as count FROM negative_items WHERE resolution_status = 'Resolved'").get().count;
    const underReviewNegativeItems = db.prepare("SELECT COUNT(*) as count FROM negative_items WHERE resolution_status = 'Under Review'").get().count;

    const todayAudits = db.prepare('SELECT COUNT(*) as count FROM audits WHERE created_at LIKE ?').get(`${todayStr}%`).count;
    const todayNegativeItems = db.prepare('SELECT COUNT(*) as count FROM negative_items WHERE created_at LIKE ?').get(`${todayStr}%`).count;

    // 2. Currently Logged-in Pickers
    const currentlyLoggedIn = db.prepare(`
      SELECT lh.*, u.role
      FROM login_history lh
      JOIN users u ON lh.user_id = u.id
      WHERE lh.status = 'ACTIVE'
      ORDER BY lh.login_time DESC
    `).all();

    // 3. Picker-wise Audit Count
    const pickerAuditCounts = db.prepare(`
      SELECT picker_name, picker_id, COUNT(*) as audit_count
      FROM audits
      GROUP BY picker_id
      ORDER BY audit_count DESC
    `).all();

    // 4. Picker-wise Negative Item Count
    const pickerNegativeCounts = db.prepare(`
      SELECT picker_name, picker_id, COUNT(*) as negative_count
      FROM negative_items
      GROUP BY picker_id
      ORDER BY negative_count DESC
    `).all();

    // 5. Daily, Weekly, Monthly Audits & Negative Items trends
    // Last 14 days daily
    const dailyAudits = db.prepare(`
      SELECT substr(created_at, 1, 10) as date, COUNT(*) as count
      FROM audits
      GROUP BY date
      ORDER BY date DESC
      LIMIT 14
    `).all().reverse();

    const dailyNegatives = db.prepare(`
      SELECT substr(created_at, 1, 10) as date, COUNT(*) as count
      FROM negative_items
      GROUP BY date
      ORDER BY date DESC
      LIMIT 14
    `).all().reverse();

    // 6. Negative items breakdown by Floor, Aisle, Rack, Bin, ZoneType
    const negativesByFloor = db.prepare(`
      SELECT floor, COUNT(*) as count
      FROM negative_items
      GROUP BY floor
      ORDER BY count DESC
    `).all();

    const negativesByAisle = db.prepare(`
      SELECT aisle, COUNT(*) as count
      FROM negative_items
      GROUP BY aisle
      ORDER BY count DESC
    `).all();

    const negativesByRack = db.prepare(`
      SELECT rack, COUNT(*) as count
      FROM negative_items
      GROUP BY rack
      ORDER BY count DESC
      LIMIT 10
    `).all();

    const negativesByBin = db.prepare(`
      SELECT bin, COUNT(*) as count
      FROM negative_items
      GROUP BY bin
      ORDER BY count DESC
      LIMIT 10
    `).all();

    const negativesByZoneType = db.prepare(`
      SELECT COALESCE(zone_type, 'Unspecified') as zone_type, COUNT(*) as count
      FROM negative_items
      GROUP BY zone_type
      ORDER BY count DESC
    `).all();

    // 7. Most frequently audited racks
    const frequentRacks = db.prepare(`
      SELECT floor, aisle, rack, (floor || '-' || aisle || '-' || rack) as rack_code, COUNT(*) as audit_count
      FROM audits
      GROUP BY floor, aisle, rack
      ORDER BY audit_count DESC
      LIMIT 10
    `).all();

    // 8. Recently submitted audits
    const recentAudits = db.prepare(`
      SELECT * FROM audits
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    res.json({
      summary: {
        total_pickers: totalPickers,
        active_pickers: activePickers,
        total_audits: totalAudits,
        total_negative_items: totalNegativeItems,
        open_negative_items: openNegativeItems,
        under_review_negative_items: underReviewNegativeItems,
        resolved_negative_items: resolvedNegativeItems,
        today_audits: todayAudits,
        today_negative_items: todayNegativeItems
      },
      charts: {
        picker_audit_counts: pickerAuditCounts,
        picker_negative_counts: pickerNegativeCounts,
        daily_audits: dailyAudits,
        daily_negatives: dailyNegatives,
        negatives_by_floor: negativesByFloor,
        negatives_by_aisle: negativesByAisle,
        negatives_by_rack: negativesByRack,
        negatives_by_bin: negativesByBin,
        negatives_by_zone_type: negativesByZoneType,
        frequent_racks: frequentRacks
      },
      currently_logged_in: currentlyLoggedIn,
      recent_audits: recentAudits
    });
  } catch (err) {
    console.error('Error compiling analytics:', err);
    res.status(500).json({ error: 'Failed to compile dashboard metrics' });
  }
});

// GET /api/analytics/picker-performance - Deep picker leaderboard & individual tracker
router.get('/picker-performance', requireAdmin, (req, res) => {
  const { picker_id, time_range = 'all' } = req.query;

  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const oneWeekAgoStr = new Date(Date.now() - 7 * 86400000).toISOString();

    const pickers = db.prepare(`
      SELECT id, picker_id, name, is_active, created_at
      FROM users
      WHERE role = 'picker'
      ORDER BY name ASC
    `).all();

    const pickerStats = pickers.map((p) => {
      const totalAudits = db.prepare('SELECT COUNT(*) as count FROM audits WHERE picker_id = ?').get(p.picker_id).count;
      const todayAudits = db.prepare('SELECT COUNT(*) as count FROM audits WHERE picker_id = ? AND created_at LIKE ?').get(p.picker_id, `${todayStr}%`).count;
      const weeklyAudits = db.prepare('SELECT COUNT(*) as count FROM audits WHERE picker_id = ? AND created_at >= ?').get(p.picker_id, oneWeekAgoStr).count;
      
      const totalSkus = db.prepare('SELECT COALESCE(SUM(total_skus), 0) as total FROM audits WHERE picker_id = ?').get(p.picker_id).total;
      const negativeFound = db.prepare('SELECT COUNT(*) as count FROM negative_items WHERE picker_id = ?').get(p.picker_id).count;
      const cleanAudits = db.prepare('SELECT COUNT(*) as count FROM audits WHERE picker_id = ? AND negative_items_count = 0').get(p.picker_id).count;
      
      const session = db.prepare('SELECT status, login_time, last_activity FROM login_history WHERE picker_id = ? ORDER BY id DESC LIMIT 1').get(p.picker_id);

      const accuracy = totalAudits > 0 ? Math.round((cleanAudits / totalAudits) * 100) : 100;
      const avgSkusPerAudit = totalAudits > 0 ? (totalSkus / totalAudits).toFixed(1) : '0';

      let tier = 'Bronze Picker';
      if (totalAudits >= 10 && accuracy >= 90) tier = 'Elite Master';
      else if (totalAudits >= 5) tier = 'Silver Pro';

      return {
        ...p,
        total_audits: totalAudits,
        today_audits: todayAudits,
        weekly_audits: weeklyAudits,
        total_skus_scanned: totalSkus,
        avg_skus_per_audit: avgSkusPerAudit,
        negative_items_found: negativeFound,
        clean_audits_count: cleanAudits,
        accuracy_rate: accuracy,
        status: session?.status || 'INACTIVE',
        last_login: session?.login_time || null,
        last_activity: session?.last_activity || null,
        tier
      };
    });

    // Sort by total audits DESC for leaderboard
    pickerStats.sort((a, b) => b.total_audits - a.total_audits);
    pickerStats.forEach((p, index) => {
      p.rank = index + 1;
    });

    // If specific picker requested, return their detailed breakdown
    let selectedPickerDetails = null;
    if (picker_id) {
      const target = pickerStats.find(p => p.picker_id.toUpperCase() === picker_id.toUpperCase());
      if (target) {
        const recentAudits = db.prepare('SELECT * FROM audits WHERE picker_id = ? ORDER BY created_at DESC LIMIT 30').all(target.picker_id);
        const negatives = db.prepare('SELECT * FROM negative_items WHERE picker_id = ? ORDER BY created_at DESC LIMIT 30').all(target.picker_id);
        const auditsByFloor = db.prepare('SELECT floor, COUNT(*) as count FROM audits WHERE picker_id = ? GROUP BY floor').all(target.picker_id);
        const auditsByZone = db.prepare('SELECT zone_type, COUNT(*) as count FROM audits WHERE picker_id = ? GROUP BY zone_type').all(target.picker_id);
        const dailyTrend = db.prepare(`
          SELECT substr(created_at, 1, 10) as date, COUNT(*) as audits_count, SUM(negative_items_count) as negatives_count
          FROM audits
          WHERE picker_id = ?
          GROUP BY date
          ORDER BY date DESC
          LIMIT 14
        `).all(target.picker_id).reverse();

        selectedPickerDetails = {
          picker: target,
          recent_audits: recentAudits,
          negatives_found: negatives,
          floor_distribution: auditsByFloor,
          zone_distribution: auditsByZone,
          daily_trend: dailyTrend
        };
      }
    }

    res.json({
      leaderboard: pickerStats,
      selected_picker: selectedPickerDetails
    });
  } catch (err) {
    console.error('Error fetching picker performance:', err);
    res.status(500).json({ error: 'Failed to compile picker performance' });
  }
});

// GET /api/analytics/my-performance - Self performance tracking for logged-in picker
router.get('/my-performance', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { requireAuth } = require('../middleware/auth');
    requireAuth(req, res, () => {
      const pickerId = req.user.picker_id;
      const todayStr = new Date().toISOString().slice(0, 10);
      const oneWeekAgoStr = new Date(Date.now() - 7 * 86400000).toISOString();

      const totalAudits = db.prepare('SELECT COUNT(*) as count FROM audits WHERE picker_id = ?').get(pickerId).count;
      const todayAudits = db.prepare('SELECT COUNT(*) as count FROM audits WHERE picker_id = ? AND created_at LIKE ?').get(pickerId, `${todayStr}%`).count;
      const weeklyAudits = db.prepare('SELECT COUNT(*) as count FROM audits WHERE picker_id = ? AND created_at >= ?').get(pickerId, oneWeekAgoStr).count;
      const totalSkus = db.prepare('SELECT COALESCE(SUM(total_skus), 0) as total FROM audits WHERE picker_id = ?').get(pickerId).total;
      const negativeFound = db.prepare('SELECT COUNT(*) as count FROM negative_items WHERE picker_id = ?').get(pickerId).count;
      const cleanAudits = db.prepare('SELECT COUNT(*) as count FROM audits WHERE picker_id = ? AND negative_items_count = 0').get(pickerId).count;

      const accuracy = totalAudits > 0 ? Math.round((cleanAudits / totalAudits) * 100) : 100;
      const recentAudits = db.prepare('SELECT * FROM audits WHERE picker_id = ? ORDER BY created_at DESC LIMIT 10').all(pickerId);

      const dailyTrend = db.prepare(`
        SELECT substr(created_at, 1, 10) as date, COUNT(*) as count
        FROM audits
        WHERE picker_id = ?
        GROUP BY date
        ORDER BY date DESC
        LIMIT 7
      `).all(pickerId).reverse();

      res.json({
        metrics: {
          total_audits: totalAudits,
          today_audits: todayAudits,
          weekly_audits: weeklyAudits,
          today_goal: 20, // 20 audits standard target per picker shift
          total_skus_scanned: totalSkus,
          negative_items_found: negativeFound,
          clean_audits_count: cleanAudits,
          accuracy_rate: accuracy,
          tier: totalAudits >= 10 && accuracy >= 90 ? 'Elite Master' : totalAudits >= 5 ? 'Silver Pro' : 'Active Picker'
        },
        recent_audits: recentAudits,
        daily_trend: dailyTrend
      });
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load picker performance' });
  }
});

module.exports = router;

