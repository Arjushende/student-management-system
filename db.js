// config/db.js
// Centralized MySQL connection pool.
// A pool (not a single connection) lets multiple requests query concurrently
// without waiting on each other, and auto-reconnects dropped connections.

require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'student_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true
});

// Quick startup check so a bad DB config fails loudly instead of silently.
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL pool connected');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
  }
})();

module.exports = pool;
