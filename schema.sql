-- =====================================================
-- Student Management System - Database Schema
-- MySQL 8.0+
-- =====================================================

CREATE DATABASE IF NOT EXISTS student_management
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE student_management;

-- ---------------------------------------------------
-- Departments (1 department -> many students)
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  code        VARCHAR(10)  NOT NULL UNIQUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- Students (core entity)
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  first_name       VARCHAR(50)  NOT NULL,
  last_name        VARCHAR(50)  NOT NULL,
  email            VARCHAR(120) NOT NULL UNIQUE,
  phone            VARCHAR(20),
  date_of_birth    DATE,
  department_id    INT,
  enrollment_date  DATE NOT NULL DEFAULT (CURRENT_DATE),
  status           ENUM('active', 'inactive', 'graduated') NOT NULL DEFAULT 'active',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_student_department
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  INDEX idx_student_lastname (last_name),
  INDEX idx_student_email (email),
  INDEX idx_student_status (status)
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- Courses
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  code        VARCHAR(20)  NOT NULL UNIQUE,
  credits     TINYINT UNSIGNED NOT NULL DEFAULT 3,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- Enrollments (many-to-many: students <-> courses)
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS enrollments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT NOT NULL,
  course_id   INT NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_enrollment_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_enrollment_course
    FOREIGN KEY (course_id) REFERENCES courses(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  UNIQUE KEY uq_student_course (student_id, course_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- Seed data
-- ---------------------------------------------------
INSERT INTO departments (name, code) VALUES
  ('Computer Science', 'CS'),
  ('Electrical Engineering', 'EE'),
  ('Business Administration', 'BA')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO courses (name, code, credits) VALUES
  ('Data Structures', 'CS201', 4),
  ('Database Systems', 'CS301', 3),
  ('Circuit Analysis', 'EE210', 4),
  ('Marketing Principles', 'BA110', 3)
ON DUPLICATE KEY UPDATE name = VALUES(name);
