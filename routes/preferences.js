import express from 'express';
import { pool } from '../server.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get preferences for a group
router.get('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;

    const result = await pool.query(
      `SELECT day_id, points FROM preferences WHERE group_id = $1 ORDER BY day_id`,
      [groupId]
    );

    const preferences = {};
    result.rows.forEach(row => {
      preferences[`day_${row.day_id}`] = row.points;
    });

    res.json(preferences);
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit preferences (for group)
router.post('/:groupId/submit', async (req, res) => {
  try {
    const { groupId } = req.params;
    const preferences = req.body;

    // Check if group exists
    const groupResult = await pool.query('SELECT id FROM groups WHERE id = $1', [groupId]);
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Delete existing preferences (allow resubmission)
    await pool.query('DELETE FROM preferences WHERE group_id = $1', [groupId]);

    // Insert new preferences
    for (const [key, points] of Object.entries(preferences)) {
      if (key.startsWith('day_')) {
        const dayId = key.replace('day_', '');
        await pool.query(
          'INSERT INTO preferences (group_id, day_id, points) VALUES ($1, $2, $3)',
          [groupId, dayId, points]
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Submit preferences error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update preferences (admin)
router.put('/:groupId', verifyToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const preferences = req.body;

    // Delete existing preferences
    await pool.query('DELETE FROM preferences WHERE group_id = $1', [groupId]);

    // Insert new preferences
    for (const [key, points] of Object.entries(preferences)) {
      if (key.startsWith('day_')) {
        const dayId = key.replace('day_', '');
        await pool.query(
          `INSERT INTO preferences (group_id, day_id, points, edited_by_admin, edited_at)
           VALUES ($1, $2, $3, true, NOW())`,
          [groupId, dayId, points]
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all preferences with group info
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.id, g.name, g.leader, COUNT(DISTINCT p.day_id) as submitted_days,
             (SELECT COUNT(*) FROM days) as total_days
      FROM groups g
      LEFT JOIN preferences p ON g.id = p.group_id
      GROUP BY g.id, g.name, g.leader
      ORDER BY g.created_at
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get all preferences error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
