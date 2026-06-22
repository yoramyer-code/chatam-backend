import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import daysRoutes from './routes/days.js';
import preferencesRoutes from './routes/preferences.js';
import resultsRoutes from './routes/results.js';
import { initializeDatabase } from './db/init.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize database on startup
await initializeDatabase(pool);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/days', daysRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/results', resultsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
