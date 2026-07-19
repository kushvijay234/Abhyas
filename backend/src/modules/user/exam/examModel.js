const db = require("../../../config/db");

const ExamModel = {
    getPublishedExams: async(search, course_id) => {
        let query = `SELECT e.*, c.title AS course_name
                 FROM exams e
                 LEFT JOIN courses c ON e.course_id = c.course_id
                 WHERE e.is_published = 1`;
        const params = [];

        if (search) {
            query += ` AND e.title LIKE ?`;
            params.push(`%${search}%`);
        }
        if (course_id) {
            query += ` AND e.course_id = ?`;
            params.push(course_id);
        }

        query += ` ORDER BY e.created_at DESC`;
        const [rows] = await db.execute(query, params);
        return rows;
    },

    findById: async(exam_id) => {
        const [rows] = await db.execute(
            `SELECT e.*, c.title AS course_name
       FROM exams e
       LEFT JOIN courses c ON e.course_id = c.course_id
       WHERE e.exam_id = ? AND e.is_published = 1`, [exam_id]
        );
        return rows[0];
    },

    findActiveAttempt: async(user_id, exam_id) => {
        const [rows] = await db.execute(
            `SELECT * FROM exam_attempts
       WHERE user_id = ? AND exam_id = ? AND status = 'in_progress'`, [user_id, exam_id]
        );
        return rows[0];
    },
    createAttempt: async(user_id, exam_id) => {
        const [result] = await db.execute(
            `INSERT INTO exam_attempts (user_id, exam_id, status, started_at)
       VALUES (?, ?, 'in_progress', NOW())`, [user_id, exam_id]
        );
        return result;
    },

    getAttemptById: async(attempt_id, user_id) => {
        const [rows] = await db.execute(
            `SELECT ea.*, e.passing_marks, e.total_marks AS exam_total_marks,
              e.title AS exam_title, e.exam_id, e.duration_minutes
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       WHERE ea.attempt_id = ? AND ea.user_id = ?`, [attempt_id, user_id]
        );
        return rows[0];
    },

    submitAttempt: async(attempt_id, score, total_marks, percentage) => {
        const [result] = await db.execute(
            `UPDATE exam_attempts
       SET status = 'completed', score = ?, total_marks = ?,
           percentage = ?, submitted_at = NOW()
       WHERE attempt_id = ?`, [score, total_marks, percentage, attempt_id]
        );
        return result;
    },
};

module.exports = ExamModel;