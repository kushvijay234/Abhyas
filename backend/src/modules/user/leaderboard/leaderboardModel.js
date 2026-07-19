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

};

module.exports = LeaderboardModel;