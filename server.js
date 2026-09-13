// server.js
// Application entry point: wires up middleware, routes, and error handling.

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const studentRoutes = require('./routes/studentRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const courseRoutes = require('./routes/courseRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the static frontend (index.html, style.css, app.js)
app.use(express.static('../frontend'));

// API routes
app.use('/api/students', studentRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/courses', courseRoutes);

app.get('/api/health', (req, res) => res.json({ success: true, message: 'API is running' }));

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Centralized error handler — every controller's catch(err) => next(err) lands here.
// Keeps error formatting consistent and stack traces out of client responses.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { detail: err.message })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
