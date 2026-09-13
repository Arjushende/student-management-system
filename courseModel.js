// models/courseModel.js
const pool = require('../config/db');

async function findAll() {
  const [rows] = await pool.query('SELECT * FROM courses ORDER BY name ASC');
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM courses WHERE id = :id', { id });
  return rows[0] || null;
}

module.exports = { findAll, findById };
