// controllers/studentController.js
// Handles HTTP req/res. Delegates all data access to the model layer
// and never writes raw SQL itself (keeps layers separated).

const Student = require('../models/studentModel');

async function list(req, res, next) {
  try {
    const { search, departmentId, status, sortBy, order, page, limit } = req.query;
    const result = await Student.findAll({
      search,
      departmentId: departmentId ? Number(departmentId) : null,
      status,
      sortBy,
      order,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10
    });
    res.json({
      success: true,
      data: result.rows,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    const courses = await Student.getCourses(req.params.id);
    res.json({ success: true, data: { ...student, courses } });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const existing = await Student.findByEmail(req.body.email);
    if (existing) {
      return res.status(409).json({
        success: false,
        errors: [{ field: 'email', message: 'A student with this email already exists' }]
      });
    }

    const payload = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      phone: req.body.phone || null,
      date_of_birth: req.body.date_of_birth || null,
      department_id: req.body.department_id || null,
      enrollment_date: req.body.enrollment_date || new Date().toISOString().slice(0, 10),
      status: req.body.status || 'active'
    };

    const student = await Student.create(payload);
    res.status(201).json({ success: true, data: student });
  } catch (err) {
    // Catches race-condition duplicate emails / FK violations MySQL rejects
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ success: false, message: 'Invalid department_id' });
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const existing = await Student.findByEmail(req.body.email);
    if (existing && String(existing.id) !== String(req.params.id)) {
      return res.status(409).json({
        success: false,
        errors: [{ field: 'email', message: 'Another student already uses this email' }]
      });
    }

    const payload = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      phone: req.body.phone || null,
      date_of_birth: req.body.date_of_birth || null,
      department_id: req.body.department_id || null,
      status: req.body.status || 'active'
    };

    const student = await Student.update(req.params.id, payload);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const deleted = await Student.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, message: 'Student deleted' });
  } catch (err) {
    next(err);
  }
}

async function enroll(req, res, next) {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(422).json({ success: false, message: 'courseId is required' });
    }
    await Student.enrollInCourse(req.params.id, courseId);
    const courses = await Student.getCourses(req.params.id);
    res.status(201).json({ success: true, data: courses });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Student is already enrolled in that course' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ success: false, message: 'Invalid student or course id' });
    }
    next(err);
  }
}

async function unenroll(req, res, next) {
  try {
    const removed = await Student.unenrollFromCourse(req.params.id, req.params.courseId);
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' });
    }
    res.json({ success: true, message: 'Unenrolled' });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove, enroll, unenroll };
