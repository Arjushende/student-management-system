// controllers/departmentController.js
const Department = require('../models/departmentModel');

async function list(req, res, next) {
  try {
    const departments = await Department.findAll();
    res.json({ success: true, data: departments });
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
