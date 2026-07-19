const db = require("../../../config/db");

const LeaderboardModel = {
    getGlobal: async(limit) => {
        const [rows] = await db.query(
            `SELECT u.user_id, u.user_name,
         COUNT(ea.attempt_id)                                       AS total_attempts,
         ROUND(AVG(ea.percentage), 2)                               AS avg_score,
         MAX(ea.percentage)                                         AS best_score,
         RANK() OVER (ORDER BY AVG(ea.percentage) DESC)             AS \`rank\`
       FROM exam_attempts ea
       JOIN users u ON ea.user_id = u.user_id
       WHERE ea.status = 'completed'
       GROUP BY u.user_id, u.user_name
       ORDER BY avg_score DESC
       LIMIT ?`, [limit]
        );
        return rows;
    },


    getByExam: async(exam_id, limit) => {
        const [rows] = await db.query(
            `SELECT u.user_id, u.user_name,
              ea.score, ea.total_marks, ea.percentage, ea.submitted_at,
              RANK() OVER (ORDER BY ea.percentage DESC) AS \`rank\`
       FROM exam_attempts ea
       JOIN users u ON ea.user_id = u.user_id
       WHERE ea.exam_id = ? AND ea.status = 'completed'
       ORDER BY ea.percentage DESC
       LIMIT ?`, [exam_id, limit]
        );
        return rows;
    },


};

module.exports = LeaderboardModel;