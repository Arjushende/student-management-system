// models/studentModel.js
// Data-access layer for students. No business logic or HTTP here —
// only SQL, always parameterized (never string-concatenated).

const pool = require('../config/db');

// Columns allowed to be used for sorting.
// Whitelisting like this stops SQL injection via the sort param,
// since column/direction names can't be parameterized with `?`.
const SORTABLE_COLUMNS = new Set([
  'first_name', 'last_name', 'email', 'enrollment_date', 'status', 'created_at'
]);

/**
 * Search + sort + paginate students.
 * @param {Object} opts
 * @param {string} [opts.search] - matches first name, last name, or email
 * @param {number} [opts.departmentId] - filter by department
 * @param {string} [opts.status] - filter by status
 * @param {string} [opts.sortBy] - column to sort by
 * @param {string} [opts.order] - 'asc' | 'desc'
 * @param {number} [opts.page]
 * @param {number} [opts.limit]
 */
async function findAll({
  search = '',
  departmentId = null,
  status = null,
  sortBy = 'created_at',
  order = 'desc',
  page = 1,
  limit = 10
}) {
  const conditions = [];
  const params = {};

  if (search) {
    conditions.push(
      '(s.first_name LIKE :search OR s.last_name LIKE :search OR s.email LIKE :search)'
    );
    params.search = `%${search}%`;
  }
  if (departmentId) {
    conditions.push('s.department_id = :departmentId');
    params.departmentId = departmentId;
  }
  if (status) {
    conditions.push('s.status = :status');
    params.status = status;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Whitelist sortBy/order since MySQL placeholders can't bind identifiers.
  const safeSortBy = SORTABLE_COLUMNS.has(sortBy) ? sortBy : 'created_at';
  const safeOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const offset = (Math.max(1, page) - 1) * limit;

  const [rows] = await pool.query(
    `SELECT s.id, s.first_name, s.last_name, s.email, s.phone, s.date_of_birth,
            s.enrollment_date, s.status, s.department_id, d.name AS department_name
     FROM students s
     LEFT JOIN departments d ON d.id = s.department_id
     ${whereClause}
     ORDER BY s.${safeSortBy} ${safeOrder}
     LIMIT :limit OFFSET :offset`,
    { ...params, limit: Number(limit), offset: Number(offset) }
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM students s ${whereClause}`,
    params
  );

  return { rows, total, page: Number(page), limit: Number(limit) };
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT s.*, d.name AS department_name
     FROM students s
     LEFT JOIN departments d ON d.id = s.department_id
     WHERE s.id = :id`,
    { id }
  );
  return rows[0] || null;
}

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT id FROM students WHERE email = :email', { email });
  return rows[0] || null;
}

async function create(data) {
  const [result] = await pool.query(
    `INSERT INTO students
      (first_name, last_name, email, phone, date_of_birth, department_id, enrollment_date, status)
     VALUES
      (:first_name, :last_name, :email, :phone, :date_of_birth, :department_id, :enrollment_date, :status)`,
    data
  );
  return findById(result.insertId);
}

async function update(id, data) {
  const [result] = await pool.query(
    `UPDATE students SET
       first_name = :first_name,
       last_name = :last_name,
       email = :email,
       phone = :phone,
       date_of_birth = :date_of_birth,
       department_id = :department_id,
       status = :status
     WHERE id = :id`,
    { ...data, id }
  );
  if (result.affectedRows === 0) return null;
  return findById(id);
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM students WHERE id = :id', { id });
  return result.affectedRows > 0;
}

// --- Enrollment helpers (student <-> course, many-to-many) ---

async function getCourses(studentId) {
  const [rows] = await pool.query(
    `SELECT c.id, c.name, c.code, c.credits, e.enrolled_at
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     WHERE e.student_id = :studentId`,
    { studentId }
  );
  return rows;
}

async function enrollInCourse(studentId, courseId) {
  await pool.query(
    'INSERT INTO enrollments (student_id, course_id) VALUES (:studentId, :courseId)',
    { studentId, courseId }
  );
}

async function unenrollFromCourse(studentId, courseId) {
  const [result] = await pool.query(
    'DELETE FROM enrollments WHERE student_id = :studentId AND course_id = :courseId',
    { studentId, courseId }
  );
  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  findById,
  findByEmail,
  create,
  update,
  remove,
  getCourses,
  enrollInCourse,
  unenrollFromCourse
};
