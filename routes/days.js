import express from 'express';
import { pool } from '../server.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get all days
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM days ORDER BY date ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get days error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add day
router.post('/', verifyToken, async (req, res) => {
  try {
    const { date } = req.body;

    // Check max 10 days limit
    const countResult = await pool.query('SELECT COUNT(*) FROM days');
    if (parseInt(countResult.rows[0].count) >= 10) {
      return res.status(400).json({ error: 'Maximum 10 days allowed' });
    }

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    const result = await pool.query(
      'INSERT INTO days (date, day_of_week) VALUES ($1, $2) RETURNING *',
      [date, dayOfWeek]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Add day error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Day already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete day
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM days WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete day error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
