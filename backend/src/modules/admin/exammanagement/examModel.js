const pool = require("../../../config/db");

// Create Exam
const createExam = async(examData) => {
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
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
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
const getAllExams = async(search = "", is_published = null) => {
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

    query += ` ORDER BY e.created_at DESC`;

    const [rows] = await pool.query(query, params);
    return rows;
};

module.exports = {
    createExam,
    getAllExams,
};