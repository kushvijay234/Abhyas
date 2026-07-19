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

module.exports = {
  getTotalUsers,
  getTotalCourses,
  getTotalExams,
  getTotalQuestions,
  getTotalAttempts,
};