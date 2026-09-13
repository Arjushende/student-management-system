# Student Management System

A full CRUD Student Management System.

- **Frontend:** HTML, CSS, vanilla JavaScript (no framework/build step needed)
- **Backend:** Node.js + Express, layered/MVC architecture (routes → controllers → models)
- **Database:** MySQL, with real foreign-key relationships

## Architecture

```
backend/
  config/db.js            MySQL connection pool
  models/                 Raw SQL, parameterized queries only
  controllers/             Request/response handling, calls models
  routes/                  URL → controller wiring + validation rules
  middleware/validate.js  express-validator rules + error formatter
  server.js               App entry point, mounts routes, error handler
  schema.sql               Tables, foreign keys, seed data

frontend/
  index.html               Page structure + modal form
  style.css                 Styling
  app.js                    Fetch calls to the API, rendering, client validation
```

**Why layered?** Each layer has one job: routes decide *what* validation runs,
controllers decide *what happens* on a request, models are the *only* place
that touches SQL. This means you can change the database (or swap MySQL for
Postgres) by only touching `models/`, or add a mobile app by only reusing
`routes/` + `controllers/`.

## Database schema

- `departments` (1) → (many) `students` — `students.department_id` is a
  foreign key with `ON DELETE SET NULL` (deleting a department doesn't
  delete its students).
- `students` (many) ↔ (many) `courses` via the `enrollments` join table,
  with a `UNIQUE(student_id, course_id)` constraint so a student can't be
  double-enrolled, and `ON DELETE CASCADE` so deleting a student cleans up
  their enrollments automatically.
- `students.email` is `UNIQUE` at the database level — this is the final
  backstop against duplicate emails, even if application-level checks are
  bypassed by a race condition.

## Setup

### 1. Prerequisites
- Node.js 18+
- MySQL 8.0+ running locally (or a remote instance)

### 2. Create the database
```bash
mysql -u root -p < backend/schema.sql
```
This creates the `student_management` database, all tables, and seeds a
few departments and courses.

### 3. Configure environment variables
```bash
cd backend
cp .env.example .env
```
Edit `.env` and set `DB_PASSWORD` (and `DB_USER`/`DB_HOST` if different from
defaults).

### 4. Install dependencies and run
```bash
npm install
npm run dev        # requires nodemon (installed as a devDependency)
# or: npm start
```

The server starts on `http://localhost:5000` and serves the frontend
directly — just open that URL in your browser. No separate frontend server
needed.

## API reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/students?search=&departmentId=&status=&sortBy=&order=&page=&limit=` | Search, filter, sort, paginate |
| GET | `/api/students/:id` | Get one student (with their enrolled courses) |
| POST | `/api/students` | Create a student |
| PUT | `/api/students/:id` | Update a student |
| DELETE | `/api/students/:id` | Delete a student |
| POST | `/api/students/:id/courses` | Enroll a student in a course (`{ courseId }`) |
| DELETE | `/api/students/:id/courses/:courseId` | Unenroll |
| GET | `/api/departments` | List departments |
| GET | `/api/courses` | List courses |

All list/detail responses are shaped `{ success, data, meta? }`; errors are
`{ success: false, message }` or `{ success: false, errors: [{field, message}] }`
for validation failures (HTTP 422).

## Security notes

- **SQL injection:** every query uses `mysql2` named placeholders
  (`:paramName`) — user input is never concatenated into SQL strings.
  Sortable columns are matched against a whitelist (`SORTABLE_COLUMNS`)
  since column names can't be parameterized.
- **Validation:** `express-validator` re-validates every field server-side,
  regardless of what the frontend already checked — the frontend checks
  are a UX convenience only, never the security boundary.
- **Duplicate emails:** checked at the application level *and* enforced by
  a `UNIQUE` constraint in the schema, so a race condition can't slip a
  duplicate through.

## Extending this

- Add authentication (e.g. JWT) and protect write routes with middleware.
- Add a `teachers` table and a `course_teacher` relationship.
- Add server-side CSV export for the filtered list.
- Add automated tests (Jest + supertest) against the controllers.
