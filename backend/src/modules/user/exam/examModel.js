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


};

module.exports = ExamModel;