const pool = require("../../../config/db");

// Create Exam
const createExam = async (examData) => {
  const {
    title,
    description,
    course_id = null,
    duration_minutes = 60,
    total_marks = 100,
    passing_marks = 40,
    max_attempts = 1,
    is_published = false,
    start_time = null,
    end_time = null,
    instructions = null,
    negative_marking = 0,
  } = examData;

  const [result] = await pool.execute(
    `INSERT INTO exams
       (title, description, course_id, duration_minutes, total_marks, passing_marks,
        max_attempts, is_published, start_time, end_time, instructions, negative_marking)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      description,
      course_id,
      duration_minutes,
      total_marks,
      passing_marks,
      max_attempts,
      is_published ? 1 : 0,
      start_time,
      end_time,
      instructions,
      negative_marking,
    ]
  );

  return result;
};

// Get All Exams
const getAllExams = async (search = "", is_published = null, is_independent = null) => {
  let query = `
    SELECT e.exam_id, e.title, e.description, e.duration_minutes,
           e.total_marks, e.passing_marks, e.max_attempts,
           e.is_published, e.start_time, e.end_time, e.created_at,
           c.title AS course_title
    FROM exams e
    LEFT JOIN courses c ON e.course_id = c.course_id
    WHERE 1=1
  `;

  const params = [];

  if (search) {
    query += ` AND (e.title LIKE ? OR e.description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (is_published !== null && is_published !== undefined && is_published !== "") {
    query += ` AND e.is_published = ?`;
    params.push(Number(is_published));
  }

  if (is_independent === "true" || is_independent === true) {
    query += ` AND e.course_id IS NULL`;
  } else if (is_independent === "false" || is_independent === false) {
    query += ` AND e.course_id IS NOT NULL`;
  }

  query += ` ORDER BY e.created_at DESC`;

  const [rows] = await pool.query(query, params);
  return rows;
};

// Get Exam By ID
const getExamById = async (exam_id) => {
  const [rows] = await pool.execute(
    `SELECT e.*, c.title AS course_title
     FROM exams e
     LEFT JOIN courses c ON e.course_id = c.course_id
     WHERE e.exam_id = ?`,
    [exam_id]
  );

  if (rows[0]) {
    const [recs] = await pool.execute(
      `SELECT course_id FROM exam_recommended_courses WHERE exam_id = ?`,
      [exam_id]
    );
    rows[0].recommended_courses = recs.map(r => r.course_id);
  }

  return rows[0];
};

// Update Exam
const updateExam = async (exam_id, examData) => {
  const {
    title,
    description = null,
    course_id = null,
    total_marks = 100,
    passing_marks = 40,
    max_attempts = 1,
    start_time = null,
    end_time = null,
  } = examData;

  const [result] = await pool.execute(
    `UPDATE exams
     SET title = ?, description = ?, course_id = ?, total_marks = ?,
         passing_marks = ?, max_attempts = ?, start_time = ?, end_time = ?
     WHERE exam_id = ?`,
    [title, description, course_id, total_marks, passing_marks, max_attempts, start_time, end_time, exam_id]
  );

  return result;
};

// Delete Exam
const deleteExam = async (exam_id) => {
  const [result] = await pool.execute(
    `DELETE FROM exams WHERE exam_id = ?`,
    [exam_id]
  );

  return result;
};

// Toggle Publish / Unpublish
const togglePublish = async (exam_id, is_published) => {
  const [result] = await pool.execute(
    `UPDATE exams SET is_published = ? WHERE exam_id = ?`,
    [is_published ? 1 : 0, exam_id]
  );

  return result;
};

// Set Exam Duration & Rules
const setExamSettings = async (exam_id, settings) => {
  const {
    duration_minutes,
    instructions,
    negative_marking,
    max_attempts,
    passing_marks,
  } = settings;

  const [result] = await pool.execute(
    `UPDATE exams
     SET duration_minutes = ?, instructions = ?, negative_marking = ?,
         max_attempts = ?, passing_marks = ?
     WHERE exam_id = ?`,
    [duration_minutes, instructions, negative_marking, max_attempts, passing_marks, exam_id]
  );

  return result;
};

const setRecommendedCourses = async (exam_id, course_ids) => {
  // Clear existing
  await pool.execute(
    `DELETE FROM exam_recommended_courses WHERE exam_id = ?`,
    [exam_id]
  );

  if (!course_ids || course_ids.length === 0) return;

  // Insert new
  const placeholders = course_ids.map(() => '(?, ?)').join(', ');
  const params = [];
  course_ids.forEach(course_id => {
    params.push(exam_id, course_id);
  });

  await pool.execute(
    `INSERT INTO exam_recommended_courses (exam_id, course_id) VALUES ${placeholders}`,
    params
  );
};

module.exports = {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  deleteExam,
  togglePublish,
  setExamSettings,
  setRecommendedCourses,
};
