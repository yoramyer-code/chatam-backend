import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../server.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin
    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    const admin = result.rows[0];

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ success: true, token, username: admin.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Initialize admins (run once)
router.post('/init-admins', async (req, res) => {
  try {
    const adminAccounts = [
      { username: 'admin1', password: 'password1' },
      { username: 'admin2', password: 'password2' },
      { username: 'admin3', password: 'password3' }
    ];

    for (const account of adminAccounts) {
      const passwordHash = await bcrypt.hash(account.password, 10);
      await pool.query(
        'INSERT INTO admins (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING',
        [account.username, passwordHash]
      );
    }

    res.json({ success: true, message: 'Admins initialized' });
  } catch (error) {
    console.error('Init admins error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
