import express from 'express';
import { pool } from '../server.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get all groups
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM groups ORDER BY created_at');
    res.json(result.rows);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add group
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, leader, accessCode, hasRemoteTeacher } = req.body;

    const result = await pool.query(
      'INSERT INTO groups (name, leader, access_code, has_remote_teacher) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, leader, accessCode, hasRemoteTeacher || false]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Add group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update group
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, leader, hasRemoteTeacher } = req.body;

    const result = await pool.query(
      'UPDATE groups SET name = $1, leader = $2, has_remote_teacher = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [name, leader, hasRemoteTeacher, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete group
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM groups WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get group by access code
router.get('/access/:accessCode', async (req, res) => {
  try {
    const { accessCode } = req.params;
    const result = await pool.query('SELECT * FROM groups WHERE access_code = $1', [accessCode]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get group by access code error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
