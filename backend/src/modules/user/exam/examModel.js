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
};

module.exports = ExamModel;