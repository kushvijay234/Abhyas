const db = require("../../../config/db");

const ResultModel = {
  getMyResults: async (user_id) => {
    const [rows] = await db.execute(
      `SELECT ea.attempt_id, ea.score, ea.total_marks, ea.percentage,
              ea.status, ea.submitted_at,
              e.title AS exam_title, e.passing_marks
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       WHERE ea.user_id = ? AND ea.status = 'completed'
       ORDER BY ea.submitted_at DESC`,
      [user_id]
    );
    return rows;
  },

