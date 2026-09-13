// models/departmentModel.js
const pool = require('../config/db');

async function findAll() {
  const [rows] = await pool.query('SELECT * FROM departments ORDER BY name ASC');
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM departments WHERE id = :id', { id });
  return rows[0] || null;
}

module.exports = { findAll, findById };
