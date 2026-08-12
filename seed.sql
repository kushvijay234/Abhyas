-- =============================================================================
-- ABHYAS PLATFORM DUMMY DATA SEED SCRIPT
-- This script populates the Abhyas database with realistic mock data for testing.
-- It inserts records for users (admins/students), categories, courses,
-- enrollments, exams, questions, attempts, answers, and notifications.
-- =============================================================================

USE abhyastest;

-- Temporarily disable foreign key checks to allow clearing of tables
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE attempt_answers;
TRUNCATE TABLE exam_attempts;
TRUNCATE TABLE user_enrollments;
TRUNCATE TABLE exam_questions;
TRUNCATE TABLE notifications;
TRUNCATE TABLE questions;
TRUNCATE TABLE exams;
TRUNCATE TABLE courses;
TRUNCATE TABLE categories;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. SEED USERS
-- Password Hashes:
-- admin123   -> $2b$10$cwMMGOQRlSFlV/dsxNYUYesq2ignpNix9mj..DZk.zIna1.c26MGe
-- student123 -> $2b$10$1n25FyIkHmJwIU2Kl0527uEP/M4SVT8m.PAr4RkH0yTZncm612706
-- password123 -> $2b$10$NQvLZWU9OsSDkityjYYAserg0gZeMQmUoEIMJ9iwQ5VjAqbIs038u
-- =============================================================================
INSERT INTO users (user_id, user_name, email, password, role, status, phone, avatar, bio) VALUES
(1, 'Admin User', 'admin@abhyas.com', '$2b$10$cwMMGOQRlSFlV/dsxNYUYesq2ignpNix9mj..DZk.zIna1.c26MGe', 'admin', 'active', NULL, NULL, 'System Administrator'),
(2, 'Alice Smith', 'student1@abhyas.com', '$2b$10$1n25FyIkHmJwIU2Kl0527uEP/M4SVT8m.PAr4RkH0yTZncm612706', 'student', 'active', '9876543210', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alice', 'Enthusiastic computer science student.'),
(3, 'Bob Jones', 'student2@abhyas.com', '$2b$10$NQvLZWU9OsSDkityjYYAserg0gZeMQmUoEIMJ9iwQ5VjAqbIs038u', 'student', 'active', '8765432109', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Bob', 'Self-taught coder trying to learn algorithms.');

-- =============================================================================
-- 2. SEED CATEGORIES
-- =============================================================================
INSERT INTO categories (category_id, name) VALUES
(1, 'Computer Science'),
(2, 'Mathematics'),
(3, 'Physics');

-- =============================================================================
-- 3. SEED COURSES
-- =============================================================================
INSERT INTO courses (course_id, title, description, thumbnail, duration, status, category_id) VALUES
(1, 'Introduction to SQL', 'Learn the basics of SQL, databases, and relational schema mapping.', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=400', '4 weeks', 'active', 1),
(2, 'Data Structures & Algorithms', 'Master linked lists, trees, graphs, sorting, searching, and complexity analysis.', 'https://images.unsplash.com/photo-1605379399642-870262d3d051?q=80&w=400', '8 weeks', 'active', 1),
(3, 'Linear Algebra', 'Vector spaces, matrices, determinants, eigenvalues, and linear maps.', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400', '6 weeks', 'active', 2);

-- =============================================================================
-- 4. SEED USER ENROLLMENTS (Many-to-Many)
-- =============================================================================
INSERT INTO user_enrollments (user_id, course_id, enrolled_at) VALUES
(2, 1, NOW() - INTERVAL 5 DAY), -- Alice enrolled in SQL
(2, 2, NOW() - INTERVAL 3 DAY), -- Alice enrolled in DSA
(3, 1, NOW() - INTERVAL 4 DAY), -- Bob enrolled in SQL
(3, 3, NOW() - INTERVAL 2 DAY); -- Bob enrolled in Math

-- =============================================================================
-- 5. SEED EXAMS
-- =============================================================================
INSERT INTO exams (exam_id, title, description, course_id, duration_minutes, total_marks, passing_marks, max_attempts, negative_marking, is_published, start_time, end_time, instructions) VALUES
(1, 'SQL Basics Quiz', 'Basic SELECT queries, WHERE clauses, and sorting.', 1, 30, 20, 10, 3, 0.00, 1, NOW() - INTERVAL 2 DAY, NOW() + INTERVAL 30 DAY, 'Attempt all questions. No negative marks.'),
(2, 'Advanced SQL Exam', 'Complex JOINs, Aggregate functions, and Subqueries.', 1, 45, 50, 25, 2, 0.25, 1, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 15 DAY, 'Warning: Negative marking applies to incorrect options.'),
(3, 'DSA Arrays Quiz', 'Array representation, indexing, and time complexities.', 2, 15, 10, 5, 5, 0.00, 1, NOW() - INTERVAL 2 DAY, NOW() + INTERVAL 20 DAY, 'Complete within the 15-minute time window.'),
(4, 'General Aptitude Mock Exam', 'Logical reasoning, pattern recognition, and basic mathematics quantitative analysis.', NULL, 20, 10, 5, 3, 0.00, 1, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 30 DAY, 'Attempt all questions. No negative marking.');

-- =============================================================================
-- 6. SEED QUESTIONS
-- =============================================================================
INSERT INTO questions (question_id, exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, explanation) VALUES
-- Exam 1: SQL Basics Quiz
(1, 1, 'Which SQL keyword is used to extract data from a database?', 'GET', 'EXTRACT', 'SELECT', 'OPEN', 'c', 10, 'The SELECT statement is used to retrieve data from a database.'),
(2, 1, 'Which SQL constraint uniquely identifies each record in a database table?', 'FOREIGN KEY', 'UNIQUE', 'CHECK', 'PRIMARY KEY', 'd', 10, 'A PRIMARY KEY constraint uniquely identifies each record and must contain unique, non-null values.'),

-- Exam 2: Advanced SQL Exam
(3, 2, 'Which JOIN returns all records when there is a match in either left or right table?', 'INNER JOIN', 'FULL OUTER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'b', 25, 'FULL OUTER JOIN returns all matching and non-matching records from both tables.'),
(4, 2, 'Which aggregate function returns the total number of rows in a query?', 'SUM()', 'COUNT()', 'TOTAL()', 'MAX()', 'b', 25, 'COUNT() returns the number of rows matching the query criteria.'),

-- Exam 3: DSA Arrays Quiz
(5, 3, 'What is the time complexity of accessing an element in an array by its index?', 'O(1)', 'O(n)', 'O(log n)', 'O(n log n)', 'a', 10, 'Array elements can be accessed directly in constant time O(1) via index lookup.'),

-- Exam 4: General Aptitude Mock Exam
(6, 4, 'Complete the series: 2, 6, 12, 20, 30, ?', '36', '40', '42', '46', 'c', 10, 'The difference between consecutive numbers increases by 2: 4, 6, 8, 10, 12. So the next number is 30 + 12 = 42.');

-- =============================================================================
-- 7. SEED EXAM QUESTIONS (Many-to-Many mapping)
-- =============================================================================
INSERT INTO exam_questions (exam_id, question_id, order_no) VALUES
(1, 1, 1),
(1, 2, 2),
(2, 3, 1),
(2, 4, 2),
(3, 5, 1),
(4, 6, 1);

-- =============================================================================
-- 8. SEED EXAM ATTEMPTS
-- =============================================================================
INSERT INTO exam_attempts (attempt_id, user_id, exam_id, status, score, total_marks, percentage, started_at, submitted_at) VALUES
-- Alice attempted and completed SQL Basics (Score: 20/20 - 100%)
(1, 2, 1, 'completed', 20, 20, 100.00, NOW() - INTERVAL 4 HOUR, NOW() - INTERVAL 3 HOUR - INTERVAL 45 MINUTE),
-- Bob attempted and completed SQL Basics (Score: 10/20 - 50% - Passed)
(2, 3, 1, 'completed', 10, 20, 50.00, NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 1 HOUR - INTERVAL 35 MINUTE),
-- Alice started Advanced SQL Exam (Currently In Progress)
(3, 2, 2, 'in_progress', NULL, NULL, NULL, NOW() - INTERVAL 10 MINUTE, NULL);

-- =============================================================================
-- 9. SEED ATTEMPT ANSWERS
-- =============================================================================
INSERT INTO attempt_answers (attempt_id, question_id, selected_option, is_marked) VALUES
-- Alice (Attempt 1): Correct on both
(1, 1, 'c', 0),
(1, 2, 'd', 0),
-- Bob (Attempt 2): Correct on first, incorrect on second
(2, 1, 'c', 0),
(2, 2, 'b', 1), -- Marked for review and selected incorrect option
-- Alice (Attempt 3): In progress answers
(3, 3, 'b', 0);

-- =============================================================================
-- 10. SEED NOTIFICATIONS
-- =============================================================================
INSERT INTO notifications (notification_id, user_id, title, message, type, is_read) VALUES
(1, 2, 'Welcome to Abhyas!', 'Hi Alice! Welcome to the Abhyas learning portal. Check out your enrolled courses.', 'info', 1),
(2, 3, 'Course Confirmed', 'Hi Bob! Your enrollment in Introduction to SQL has been processed.', 'success', 0),
(3, 2, 'Exam Attempt Completed', 'You have successfully submitted your attempt for SQL Basics Quiz.', 'success', 0);

-- =============================================================================
-- SEED DATA POPULATED SUCCESSFULLY
-- =============================================================================
