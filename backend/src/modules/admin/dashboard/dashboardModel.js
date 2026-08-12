const pool = require("../../../config/db");

// Total Users
const getTotalUsers = async () => {
  const [rows] = await pool.execute(`SELECT COUNT(*) AS total FROM users`);
  return rows[0].total;
};

// Total Courses
const getTotalCourses = async () => {
  const [rows] = await pool.execute(`SELECT COUNT(*) AS total FROM courses`);
  return rows[0].total;
};

// Total Exams
const getTotalExams = async () => {
  const [rows] = await pool.execute(`SELECT COUNT(*) AS total FROM exams`);
  return rows[0].total;
};

// Total Questions
const getTotalQuestions = async () => {
  const [rows] = await pool.execute(`SELECT COUNT(*) AS total FROM questions`);
  return rows[0].total;
};

// Total Attempts
const getTotalAttempts = async () => {
  const [rows] = await pool.execute(`SELECT COUNT(*) AS total FROM results`);
  return rows[0].total;
};

// Average Score Across All Results
const getAverageScore = async () => {
  const [rows] = await pool.execute(
    `SELECT ROUND(AVG(score), 2) AS avg_score FROM results`
  );
  return rows[0].avg_score || 0;
};

// Top Performing Students
const getTopPerformingStudents = async (limit = 5) => {
  const [rows] = await pool.query(
    `SELECT u.user_id, u.user_name, u.email,
            ROUND(AVG(r.score), 2) AS avg_score,
            COUNT(r.result_id)    AS total_attempts,
            SUM(CASE WHEN r.is_passed = 1 THEN 1 ELSE 0 END) AS total_passed
     FROM results r
     JOIN users u ON r.user_id = u.user_id
     GROUP BY r.user_id, u.user_id, u.user_name, u.email
     ORDER BY avg_score DESC
     LIMIT ?`,
    [limit]
  );

  return rows;
};

// Recent Activities (latest exam attempts)
const getRecentActivities = async (limit = 10) => {
  const [rows] = await pool.query(
    `SELECT r.result_id, r.score, r.is_passed, r.attempted_at,
            u.user_name, u.email,
            e.title AS exam_title
     FROM results r
     JOIN users u ON r.user_id = u.user_id
     JOIN exams e ON r.exam_id = e.exam_id
     ORDER BY r.attempted_at DESC
     LIMIT ?`,
    [limit]
  );

  return rows;
};

module.exports = {
  getTotalUsers,
  getTotalCourses,
  getTotalExams,
  getTotalQuestions,
  getTotalAttempts,
  getAverageScore,
  getTopPerformingStudents,
  getRecentActivities,
};
