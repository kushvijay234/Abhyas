const db = require("../../../config/db");

const DashboardModel = {
  getSummary: async (user_id) => {
    const [rows] = await db.execute(
      `SELECT
         (SELECT COUNT(*) FROM exam_attempts
          WHERE user_id = ? AND status = 'completed')          AS total_exams_taken,
         (SELECT ROUND(AVG(percentage), 2) FROM exam_attempts
          WHERE user_id = ? AND status = 'completed')          AS avg_score,
         (SELECT COUNT(*) FROM user_enrollments
          WHERE user_id = ?)                                   AS enrolled_courses,
         (SELECT COUNT(*) FROM exam_attempts
          WHERE user_id = ? AND status = 'in_progress')        AS ongoing_exams,
         (SELECT COUNT(*) FROM exam_attempts ea
          JOIN exams e ON ea.exam_id = e.exam_id
          WHERE ea.user_id = ? AND ea.status = 'completed'
            AND ea.percentage >= e.passing_marks)              AS exams_passed,
         COALESCE((
           SELECT ROUND(SUM(TIMESTAMPDIFF(SECOND, started_at, submitted_at)) / 3600.0, 1)
           FROM exam_attempts
           WHERE user_id = ? AND status = 'completed'
         ), 0)                                                 AS study_hours,
         (SELECT COUNT(*) FROM users WHERE role = 'student')   AS total_students,
         COALESCE((
           WITH user_averages AS (
             SELECT user_id, AVG(percentage) as avg_pct
             FROM exam_attempts
             WHERE status = 'completed'
             GROUP BY user_id
           ),
           ranked_users AS (
             SELECT user_id, RANK() OVER (ORDER BY avg_pct DESC) as \`rank\`
             FROM user_averages
           )
           SELECT \`rank\` FROM ranked_users WHERE user_id = ?
         ), (
           SELECT COUNT(*) + 1 
           FROM (
             SELECT DISTINCT user_id FROM exam_attempts WHERE status = 'completed'
           ) tmp
         ))                                                    AS \`rank\``,
      [user_id, user_id, user_id, user_id, user_id, user_id, user_id]
    );
    return rows[0];
  },

  getPerformance: async (user_id) => {
    const [rows] = await db.execute(
      `SELECT e.title AS exam_title, ea.score, ea.total_marks,
              ea.percentage, ea.submitted_at
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       WHERE ea.user_id = ? AND ea.status = 'completed'
       ORDER BY ea.submitted_at DESC
       LIMIT 10`,
      [user_id]
    );
    return rows;
  },

  getRecentExams: async (user_id) => {
    const [rows] = await db.execute(
      `SELECT ea.attempt_id, ea.score, ea.percentage, ea.status,
              ea.started_at, ea.submitted_at,
              e.title AS exam_title
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       WHERE ea.user_id = ?
       ORDER BY ea.started_at DESC
       LIMIT 5`,
      [user_id]
    );
    return rows;
  },

};

module.exports = DashboardModel;