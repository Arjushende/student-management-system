// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/studentController');
const { studentRules, idParamRule, listQueryRules, handleValidation } = require('../middleware/validate');

// GET /api/students?search=&departmentId=&status=&sortBy=&order=&page=&limit=
router.get('/', listQueryRules, handleValidation, controller.list);

// GET /api/students/:id
router.get('/:id', idParamRule, handleValidation, controller.getOne);

// POST /api/students
router.post('/', studentRules, handleValidation, controller.create);

// PUT /api/students/:id
router.put('/:id', idParamRule, studentRules, handleValidation, controller.update);

// DELETE /api/students/:id
router.delete('/:id', idParamRule, handleValidation, controller.remove);

// POST /api/students/:id/courses  { courseId }
router.post('/:id/courses', idParamRule, handleValidation, controller.enroll);

// DELETE /api/students/:id/courses/:courseId
router.delete('/:id/courses/:courseId', idParamRule, handleValidation, controller.unenroll);

module.exports = router;
