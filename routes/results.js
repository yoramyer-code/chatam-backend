import express from 'express';
import { pool } from '../server.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Calculate schedule
router.post('/calculate', verifyToken, async (req, res) => {
  try {
    // Get all days
    const daysResult = await pool.query('SELECT * FROM days ORDER BY date ASC');
    const days = daysResult.rows;

    if (days.length === 0) {
      return res.status(400).json({ error: 'No days defined' });
    }

    // Get all groups
    const groupsResult = await pool.query('SELECT * FROM groups');
    const groups = groupsResult.rows;

    // Get all preferences
    const prefsResult = await pool.query(`
      SELECT group_id, day_id, points FROM preferences
    `);
    const preferences = {};
    prefsResult.rows.forEach(row => {
      if (!preferences[row.group_id]) {
        preferences[row.group_id] = {};
      }
      preferences[row.group_id][row.day_id] = row.points;
    });

    // Check all groups submitted
    for (const group of groups) {
      const groupPrefs = preferences[group.id];
      if (!groupPrefs || Object.keys(groupPrefs).length !== days.length) {
        return res.status(400).json({
          error: `Not all groups submitted preferences. Missing: ${group.name}`
        });
      }
    }

    // Calculate schedule for each day
    const results = [];
    for (const day of days) {
      const scores = groups.map(group => {
        let score = preferences[group.id][day.id] || 0;

        // Add bonus for remote teacher
        if (group.has_remote_teacher) {
          score += 20;
        }

        // Add randomness
        score += Math.random();

        return {
          groupId: group.id,
          groupName: group.name,
          score: score
        };
      });

      // Sort by score descending
      const sorted = scores.sort((a, b) => b.score - a.score);
      const order = sorted.map(s => s.groupId);

      // Save result
      await pool.query(
        'INSERT INTO results (day_id, group_order) VALUES ($1, $2) ON CONFLICT (day_id) DO UPDATE SET group_order = $2',
        [day.id, JSON.stringify(order)]
      );

      results.push({
        dayId: day.id,
        dayDate: day.date,
        dayOfWeek: day.day_of_week,
        order: order
      });
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Calculate schedule error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get schedule
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.day_id, r.group_order, d.date, d.day_of_week
      FROM results r
      JOIN days d ON r.day_id = d.id
      ORDER BY d.date ASC
    `);

    const results = result.rows.map(row => ({
      dayId: row.day_id,
      dayDate: row.date,
      dayOfWeek: row.day_of_week,
      order: JSON.parse(row.group_order)
    }));

    res.json(results);
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Clear results
router.delete('/', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM results');
    res.json({ success: true });
  } catch (error) {
    console.error('Clear results error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
