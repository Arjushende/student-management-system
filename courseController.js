// controllers/courseController.js
const Course = require('../models/courseModel');

async function list(req, res, next) {
  try {
    const courses = await Course.findAll();
    res.json({ success: true, data: courses });
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
