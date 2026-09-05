-- =============================================================================
-- ABHYAS DATABASE SCHEMA
-- This script initializes the database for the Abhyas learning platform.
-- It demonstrates and applies all 6 major SQL constraints:
-- 1. PRIMARY KEY   - Uniquely identifies each record in a table.
-- 2. FOREIGN KEY   - Enforces referential integrity between tables.
-- 3. UNIQUE        - Ensures all values in a column are distinct.
-- 4. NOT NULL      - Prevents NULL values from being stored in a column.
-- 5. CHECK         - Validates that values meet specific conditions.
-- 6. DEFAULT       - Provides fallback values when no value is specified.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS abhyastest;
USE abhyastest;

-- Disable Foreign Key checks for clean teardown of existing schema
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing views and tables
DROP VIEW IF EXISTS results;
DROP VIEW IF EXISTS course_categories;
DROP VIEW IF EXISTS users;
DROP TABLE IF EXISTS course_categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS attempt_answers;
DROP TABLE IF EXISTS exam_recommended_courses;
DROP TABLE IF EXISTS exam_attempts;
DROP TABLE IF EXISTS user_enrollments;
DROP TABLE IF EXISTS exam_questions;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS exams;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users_base;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. USERS TABLE
-- Contains core user registration and profile details.
-- =============================================================================
CREATE TABLE users (
    -- PRIMARY KEY & AUTO_INCREMENT Constraints
    user_id INT AUTO_INCREMENT,
    
    -- UNIQUE & NOT NULL Constraints
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    
    -- NOT NULL Constraints
    user_name VARCHAR(100) NOT NULL,
    
    -- DEFAULT Constraint
    phone VARCHAR(20) DEFAULT NULL,
    avatar VARCHAR(500) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    
    -- ENUM, NOT NULL & DEFAULT Constraints
    role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    
    -- OTP-based forgot password details
    otp_code VARCHAR(6) DEFAULT NULL,
    otp_expiry TIMESTAMP NULL DEFAULT NULL,
    
    -- DEFAULT Constraints for Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Table-level PRIMARY KEY and UNIQUE Constraints
    CONSTRAINT pk_users PRIMARY KEY (user_id),
    CONSTRAINT uq_users_email UNIQUE (email),
    
    -- CHECK Constraints (MySQL 8.0+ supported)
    -- Enforces email formatting and phone length bounds
    CONSTRAINT chk_users_email_format CHECK (email LIKE '%_@__%.__%'),
    CONSTRAINT chk_users_phone CHECK (phone IS NULL OR LENGTH(phone) >= 10)
);


-- =============================================================================
-- 2. CATEGORIES TABLE
-- Stores subject categories for courses and exams.
-- =============================================================================
CREATE TABLE categories (
    -- PRIMARY KEY & AUTO_INCREMENT Constraints
    category_id INT AUTO_INCREMENT,
    
    -- UNIQUE & NOT NULL Constraints
    name VARCHAR(100) NOT NULL,
    
    -- DEFAULT Constraint
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_categories PRIMARY KEY (category_id),
    CONSTRAINT uq_categories_name UNIQUE (name),
    
    -- CHECK Constraint to prevent empty spaces as category name
    CONSTRAINT chk_categories_name CHECK (LENGTH(TRIM(name)) > 0)
);


-- =============================================================================
-- 3. COURSE_CATEGORIES COMPATIBILITY VIEW
-- Maps categories lookup queries interchangeably to satisfy all backend modules.
-- =============================================================================
CREATE OR REPLACE VIEW course_categories AS
SELECT 
    category_id,
    name,
    created_at
FROM categories;


-- =============================================================================
-- 4. COURSES TABLE
-- Holds course information containing lectures and assessments.
-- =============================================================================
CREATE TABLE courses (
    -- PRIMARY KEY & AUTO_INCREMENT Constraints
    course_id INT AUTO_INCREMENT,
    
    -- NOT NULL & UNIQUE Constraints
    title VARCHAR(255) NOT NULL,
    
    -- DEFAULT Constraint
    description TEXT DEFAULT NULL,
    thumbnail VARCHAR(500) DEFAULT NULL,
    duration VARCHAR(50) DEFAULT NULL,
    
    -- ENUM, NOT NULL & DEFAULT Constraints
    status ENUM('active', 'inactive', 'draft') NOT NULL DEFAULT 'draft',
    
    -- Foreign Key field mapping to Categories lookup
    category_id INT DEFAULT NULL,
    
    -- DEFAULT Constraints
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_courses PRIMARY KEY (course_id),
    CONSTRAINT uq_courses_title UNIQUE (title),
    
    -- FOREIGN KEY Constraint (Sets NULL on delete, Cascades on update)
    CONSTRAINT fk_courses_category 
        FOREIGN KEY (category_id) 
        REFERENCES categories(category_id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
        
    -- CHECK Constraint
    CONSTRAINT chk_courses_title CHECK (LENGTH(TRIM(title)) > 0)
);


-- =============================================================================
-- 5. EXAMS TABLE
-- Holds tests and assignments linked to courses.
-- =============================================================================
CREATE TABLE exams (
    -- PRIMARY KEY & AUTO_INCREMENT Constraints
    exam_id INT AUTO_INCREMENT,
    
    -- NOT NULL Constraint
    title VARCHAR(255) NOT NULL,
    
    -- DEFAULT Constraint
    description TEXT DEFAULT NULL,
    
    -- Foreign Key field mapping to Courses
    course_id INT DEFAULT NULL,
    
    -- Numeric fields with DEFAULT and NOT NULL Constraints
    duration_minutes INT NOT NULL DEFAULT 60,
    total_marks INT NOT NULL DEFAULT 100,
    passing_marks INT NOT NULL DEFAULT 40,
    max_attempts INT NOT NULL DEFAULT 1,
    negative_marking DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    
    -- Status & Date bounds
    is_published TINYINT(1) NOT NULL DEFAULT 0,
    start_time DATETIME DEFAULT NULL,
    end_time DATETIME DEFAULT NULL,
    instructions TEXT DEFAULT NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_exams PRIMARY KEY (exam_id),
    
    -- FOREIGN KEY Constraint (Cascades on delete/update)
    CONSTRAINT fk_exams_course 
        FOREIGN KEY (course_id) 
        REFERENCES courses(course_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
        
    -- CHECK Constraints (Ensuring valid data ranges and logic relations)
    CONSTRAINT chk_exams_duration CHECK (duration_minutes > 0),
    CONSTRAINT chk_exams_total_marks CHECK (total_marks > 0),
    CONSTRAINT chk_exams_passing_marks CHECK (passing_marks >= 0 AND passing_marks <= total_marks),
    CONSTRAINT chk_exams_max_attempts CHECK (max_attempts > 0),
    CONSTRAINT chk_exams_negative_marking CHECK (negative_marking >= 0.00),
    CONSTRAINT chk_exams_published CHECK (is_published IN (0, 1)),
    CONSTRAINT chk_exams_time_range CHECK (start_time IS NULL OR end_time IS NULL OR start_time <= end_time)
);


-- =============================================================================
-- 5A. COURSE CURRICULUM TABLES
-- Stores ordered sections and learning items belonging to a course.
-- =============================================================================
CREATE TABLE course_sections (
    section_id INT AUTO_INCREMENT,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_course_sections PRIMARY KEY (section_id),
    CONSTRAINT fk_course_sections_course
        FOREIGN KEY (course_id)
        REFERENCES courses(course_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE curriculum_items (
    curriculum_item_id INT AUTO_INCREMENT,
    section_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    type ENUM('article', 'video', 'exam') NOT NULL DEFAULT 'article',
    duration VARCHAR(50) DEFAULT NULL,
    video_url VARCHAR(500) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    exam_id INT DEFAULT NULL,
    sort_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_curriculum_items PRIMARY KEY (curriculum_item_id),
    CONSTRAINT fk_curriculum_items_section
        FOREIGN KEY (section_id)
        REFERENCES course_sections(section_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_curriculum_items_exam
        FOREIGN KEY (exam_id)
        REFERENCES exams(exam_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);


-- =============================================================================
-- 6. QUESTIONS TABLE
-- Stores multiple choice questions mapped to exams.
-- =============================================================================
CREATE TABLE questions (
    -- PRIMARY KEY & AUTO_INCREMENT Constraints
    question_id INT AUTO_INCREMENT,
    
    -- Foreign Key for direct relation
    exam_id INT DEFAULT NULL,
    
    -- NOT NULL Constraints for text fields
    question_text TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    
    -- Answer option validator
    correct_option CHAR(1) NOT NULL,
    
    -- DEFAULT Constraint
    marks INT NOT NULL DEFAULT 1,
    explanation TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_questions PRIMARY KEY (question_id),
    
    -- FOREIGN KEY Constraint (Sets NULL on delete, Cascades on update)
    CONSTRAINT fk_questions_exam 
        FOREIGN KEY (exam_id) 
        REFERENCES exams(exam_id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
        
    -- CHECK Constraints (Correct option domain check, marks value check)
    CONSTRAINT chk_questions_correct_option CHECK (correct_option IN ('a', 'b', 'c', 'd', 'A', 'B', 'C', 'D')),
    CONSTRAINT chk_questions_marks CHECK (marks > 0)
);


-- =============================================================================
-- 7. EXAM_QUESTIONS TABLE
-- Join table representing a many-to-many relationship between exams and questions.
-- Contains custom order sequencing.
-- =============================================================================
CREATE TABLE exam_questions (
    exam_id INT NOT NULL,
    question_id INT NOT NULL,
    order_no INT NOT NULL DEFAULT 1,

    -- COMPOSITE PRIMARY KEY Constraint
    CONSTRAINT pk_exam_questions PRIMARY KEY (exam_id, question_id),
    
    -- COMPOSITE FOREIGN KEY Constraints (Cascade on deletion and updates)
    CONSTRAINT fk_eq_exam 
        FOREIGN KEY (exam_id) 
        REFERENCES exams(exam_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
        
    CONSTRAINT fk_eq_question 
        FOREIGN KEY (question_id) 
        REFERENCES questions(question_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
        
    -- CHECK Constraint to enforce ordering sequence integrity
    CONSTRAINT chk_eq_order CHECK (order_no > 0)
);


-- =============================================================================
-- 8. USER_ENROLLMENTS TABLE
-- Join table linking users and courses (Many-to-Many).
-- =============================================================================
CREATE TABLE user_enrollments (
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- COMPOSITE PRIMARY KEY Constraint
    CONSTRAINT pk_user_enrollments PRIMARY KEY (user_id, course_id),
    
    -- FOREIGN KEY Constraints
    CONSTRAINT fk_ue_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
        
    CONSTRAINT fk_ue_course 
        FOREIGN KEY (course_id) 
        REFERENCES courses(course_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);


-- =============================================================================
-- 9. EXAM_ATTEMPTS TABLE
-- Tracks student attempts on specific assessments and records overall results.
-- =============================================================================
CREATE TABLE exam_attempts (
    -- PRIMARY KEY & AUTO_INCREMENT Constraints
    attempt_id INT AUTO_INCREMENT,
    
    -- NOT NULL Constraints
    user_id INT NOT NULL,
    exam_id INT NOT NULL,
    
    -- ENUM, NOT NULL & DEFAULT Constraints
    status ENUM('in_progress', 'completed') NOT NULL DEFAULT 'in_progress',
    
    -- DEFAULT Constraints (NULL initially, populated when complete)
    score INT DEFAULT NULL,
    total_marks INT DEFAULT NULL,
    percentage DECIMAL(5,2) DEFAULT NULL,
    
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL DEFAULT NULL,

    CONSTRAINT pk_exam_attempts PRIMARY KEY (attempt_id),
    
    -- FOREIGN KEY Constraints (Cascades on student/exam deletion or modification)
    CONSTRAINT fk_attempts_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
        
    CONSTRAINT fk_attempts_exam 
        FOREIGN KEY (exam_id) 
        REFERENCES exams(exam_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
        
    -- CHECK Constraints
    CONSTRAINT chk_attempts_score CHECK (score IS NULL OR score >= 0),
    CONSTRAINT chk_attempts_percentage CHECK (percentage IS NULL OR (percentage >= 0.00 AND percentage <= 100.00))
);


-- =============================================================================
-- 10. ATTEMPT_ANSWERS TABLE
-- Records responses submitted by users for specific questions during exam attempts.
-- =============================================================================
CREATE TABLE attempt_answers (
    -- NOT NULL Constraints
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    
    -- DEFAULT Constraint
    selected_option CHAR(1) DEFAULT NULL,
    is_marked TINYINT(1) NOT NULL DEFAULT 0,

    -- COMPOSITE PRIMARY KEY Constraint
    CONSTRAINT pk_attempt_answers PRIMARY KEY (attempt_id, question_id),
    
    -- FOREIGN KEY Constraints
    CONSTRAINT fk_answers_attempt 
        FOREIGN KEY (attempt_id) 
        REFERENCES exam_attempts(attempt_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
        
    CONSTRAINT fk_answers_question 
        FOREIGN KEY (question_id) 
        REFERENCES questions(question_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
        
    -- CHECK Constraints
    CONSTRAINT chk_answers_selected_option CHECK (selected_option IS NULL OR selected_option IN ('a', 'b', 'c', 'd', 'A', 'B', 'C', 'D')),
    CONSTRAINT chk_answers_marked CHECK (is_marked IN (0, 1))
);


-- =============================================================================
-- 11. NOTIFICATIONS TABLE
-- Stores administrative and automated updates triggered for users.
-- =============================================================================
CREATE TABLE notifications (
    -- PRIMARY KEY & AUTO_INCREMENT Constraints
    notification_id INT AUTO_INCREMENT,
    
    -- NOT NULL Constraint
    user_id INT NOT NULL,
    
    -- NOT NULL Constraints
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- DEFAULT Constraints
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_notifications PRIMARY KEY (notification_id),
    
    -- FOREIGN KEY Constraint (Deletes notification if user is removed)
    CONSTRAINT fk_notifications_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
        
    -- CHECK Constraints
    CONSTRAINT chk_notifications_is_read CHECK (is_read IN (0, 1)),
    CONSTRAINT chk_notifications_title CHECK (LENGTH(TRIM(title)) > 0)
);


-- =============================================================================
-- 12. RESULTS COMPATIBILITY VIEW
-- Bridges structural difference between exam_attempts and results for admin panels.
-- =============================================================================
CREATE OR REPLACE VIEW results AS
SELECT 
    ea.attempt_id AS result_id,
    ea.user_id,
    ea.exam_id,
    ea.score,
    ea.total_marks,
    ea.percentage,
    ea.status,
    CASE 
        WHEN ea.percentage >= e.passing_marks THEN 1 
        ELSE 0 
    END AS is_passed,
    COALESCE(TIMESTAMPDIFF(MINUTE, ea.started_at, ea.submitted_at), 0) AS time_taken_minutes,
    ea.submitted_at AS attempted_at
FROM exam_attempts ea
JOIN exams e ON ea.exam_id = e.exam_id;


-- =============================================================================
-- 13. EXAM_RECOMMENDED_COURSES TABLE
-- Stores explicitly recommended courses for exams.
-- =============================================================================
CREATE TABLE exam_recommended_courses (
    exam_id INT NOT NULL,
    course_id INT NOT NULL,
    CONSTRAINT pk_exam_recommended_courses PRIMARY KEY (exam_id, course_id),
    CONSTRAINT fk_erc_exam FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_erc_course FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE ON UPDATE CASCADE
);


-- =============================================================================
-- END OF SCHEMA SCRIPT
-- =============================================================================
