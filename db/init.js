export async function initializeDatabase(pool) {
  try {
    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        leader VARCHAR(255) NOT NULL,
        access_code VARCHAR(20) UNIQUE NOT NULL,
        has_remote_teacher BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS days (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        day_of_week INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS preferences (
        id SERIAL PRIMARY KEY,
        group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        day_id INT NOT NULL REFERENCES days(id) ON DELETE CASCADE,
        points INT NOT NULL DEFAULT 0,
        edited_by_admin BOOLEAN DEFAULT FALSE,
        edited_at TIMESTAMP,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(group_id, day_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS results (
        id SERIAL PRIMARY KEY,
        day_id INT NOT NULL REFERENCES days(id) ON DELETE CASCADE,
        group_order TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(day_id)
      );
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}
