const pool = require("../../../config/db");

// Get Results By User
const getUserResults = async (user_id) => {
  const [rows] = await pool.execute(
    `SELECT r.result_id, r.exam_id, r.score, r.total_marks, r.is_passed,
            r.time_taken_minutes, r.attempted_at,
            e.title AS exam_title
     FROM results r
     JOIN exams e ON r.exam_id = e.exam_id
     WHERE r.user_id = ?
     ORDER BY r.attempted_at DESC`,
    [user_id]
  );

  return rows;
};

// Get Results By Exam
const getExamResults = async (exam_id) => {
  const [rows] = await pool.execute(
    `SELECT r.result_id, r.user_id, r.score, r.total_marks, r.is_passed,
            r.time_taken_minutes, r.attempted_at,
            u.user_name, u.email
     FROM results r
     JOIN users u ON r.user_id = u.user_id
     WHERE r.exam_id = ?
     ORDER BY r.score DESC`,
    [exam_id]
  );

  return rows;
};

// Generate Report (filterable)
const generateReport = async (filters = {}) => {
  const { exam_id, user_id, from_date, to_date } = filters;

  let query = `
    SELECT r.result_id, r.score, r.total_marks, r.is_passed,
           r.time_taken_minutes, r.attempted_at,
           u.user_name, u.email,
           e.title AS exam_title
    FROM results r
    JOIN users u ON r.user_id = u.user_id
    JOIN exams e ON r.exam_id = e.exam_id
    WHERE 1=1
  `;

  const params = [];

  if (exam_id) {
    query += ` AND r.exam_id = ?`;
    params.push(exam_id);
  }

  if (user_id) {
    query += ` AND r.user_id = ?`;
    params.push(user_id);
  }

  if (from_date) {
    query += ` AND r.attempted_at >= ?`;
    params.push(from_date);
  }

  if (to_date) {
    query += ` AND r.attempted_at <= ?`;
    params.push(to_date);
  }

  query += ` ORDER BY r.attempted_at DESC`;

  const [rows] = await pool.query(query, params);
  return rows;
};

module.exports = {
  getUserResults,
  getExamResults,
  generateReport,
};
