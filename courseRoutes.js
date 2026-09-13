// routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/courseController');

router.get('/', controller.list);

module.exports = router;
