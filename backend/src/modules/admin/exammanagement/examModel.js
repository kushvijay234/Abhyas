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

module.exports = {
    createExam,
};