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

getResultById: async (attempt_id, user_id) => {
    const [rows] = await db.execute(
      `SELECT ea.*, e.title AS exam_title, e.passing_marks,
              e.total_marks AS exam_total_marks, e.duration_minutes
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       WHERE ea.attempt_id = ? AND ea.user_id = ?`,
      [attempt_id, user_id]
    );
    return rows[0];
  },

  getExamResult: async (exam_id, user_id) => {
    const [rows] = await db.execute(
      `SELECT ea.*, e.title AS exam_title, e.passing_marks
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       WHERE ea.exam_id = ? AND ea.user_id = ? AND ea.status = 'completed'
       ORDER BY ea.submitted_at DESC
       LIMIT 1`,
      [exam_id, user_id]
    );
    return rows[0];
  },
  
   getAnalytics: async (user_id) => {
    const [rows] = await db.execute(
      `SELECT
         COUNT(*)                                                        AS total_attempts,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)          AS completed_exams,
         ROUND(AVG(CASE WHEN status = 'completed' THEN percentage END), 2) AS avg_percentage,
         MAX(CASE WHEN status = 'completed' THEN percentage END)         AS highest_score,
         MIN(CASE WHEN status = 'completed' THEN percentage END)         AS lowest_score,
         SUM(CASE WHEN status = 'completed'
                   AND percentage >= (
                     SELECT passing_marks FROM exams WHERE exam_id = ea.exam_id
                   ) THEN 1 ELSE 0 END)                                 AS passed_exams
       FROM exam_attempts ea
       WHERE user_id = ?`,
      [user_id]
    );
    return rows[0];
  },

   // Full answer review: questions + correct answers + student's selections in one query.
  // Used by the Assessment Report page only (after exam is completed).
  getAnswerReview: async (attempt_id, user_id) => {
    const [rows] = await db.execute(
      `SELECT q.question_id, q.question_text,
              q.option_a, q.option_b, q.option_c, q.option_d,
              q.correct_option, q.marks,
              eq.order_no,
              aa.selected_option,
              CASE WHEN aa.selected_option = q.correct_option THEN 1 ELSE 0 END AS is_correct
       FROM exam_attempts ea
       JOIN exam_questions eq ON ea.exam_id = eq.exam_id
       JOIN questions q ON eq.question_id = q.question_id
       LEFT JOIN attempt_answers aa
              ON aa.attempt_id = ea.attempt_id
             AND aa.question_id = q.question_id
       WHERE ea.attempt_id = ? AND ea.user_id = ?
       ORDER BY eq.order_no ASC`,
      [attempt_id, user_id]
    );
    return rows;
  },
};

module.exports = ResultModel;

