// routes/departmentRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/departmentController');

router.get('/', controller.list);

module.exports = router;
