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

  getRecommendationsForAttempt: async (attempt_id, user_id) => {
    // 1. Get the exam's course_id, category_id, and if user is enrolled in that course
    const [examInfoRows] = await db.execute(
      `SELECT e.exam_id, e.course_id, c.category_id, c.title AS course_title, cat.name AS category_name
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       LEFT JOIN courses c ON e.course_id = c.course_id
       LEFT JOIN categories cat ON c.category_id = cat.category_id
       WHERE ea.attempt_id = ? AND ea.user_id = ?`,
      [attempt_id, user_id]
    );

    if (examInfoRows.length === 0) return [];
    const { exam_id, course_id, category_id, category_name } = examInfoRows[0];

    const recommendations = [];

    // --- STEP A: Fetch Explicitly Recommended Courses (Set by Admin) that the user is NOT enrolled in ---
    const [explicitCourses] = await db.query(
      `SELECT c.*, cat.name AS category_name
       FROM exam_recommended_courses erc
       JOIN courses c ON erc.course_id = c.course_id
       LEFT JOIN categories cat ON c.category_id = cat.category_id
       WHERE erc.exam_id = ?
         AND c.status = 'active'
         AND c.course_id NOT IN (
           SELECT course_id FROM user_enrollments WHERE user_id = ?
         )
       LIMIT 3`,
      [exam_id, user_id]
    );

    explicitCourses.forEach(course => {
      recommendations.push({
        ...course,
        recommendation_reason: "Hand-picked by our instructors to help you master this exam's core learning modules.",
        is_associated: true
      });
    });

    // --- STEP B: Fallbacks (Dynamic Logic) if we have fewer than 3 recommendations ---
    // B1: Check directly associated course of the exam
    if (recommendations.length < 3 && course_id) {
      const isAlreadyInRecs = recommendations.some(r => r.course_id === course_id);
      if (!isAlreadyInRecs) {
        const [enrollment] = await db.execute(
          `SELECT 1 FROM user_enrollments WHERE user_id = ? AND course_id = ?`,
          [user_id, course_id]
        );
        
        if (enrollment.length === 0) {
          const [courseDetails] = await db.execute(
            `SELECT c.*, cat.name AS category_name
             FROM courses c
             LEFT JOIN categories cat ON c.category_id = cat.category_id
             WHERE c.course_id = ? AND c.status = 'active'`,
            [course_id]
          );
          if (courseDetails.length > 0) {
            recommendations.push({
              ...courseDetails[0],
              recommendation_reason: "Directly relates to the exam you just took. Highly recommended for mastering this specific topic.",
              is_associated: true
            });
          }
        }
      }
    }

    // B2: Recommend other courses in the same category
    if (recommendations.length < 3 && category_id) {
      const excludeIds = recommendations.map(r => r.course_id);
      if (course_id) excludeIds.push(course_id);
      
      const placeHolders = excludeIds.length > 0 ? excludeIds.map(() => '?').join(',') : '';
      const [categoryCourses] = await db.query(
        `SELECT c.*, cat.name AS category_name
         FROM courses c
         LEFT JOIN categories cat ON c.category_id = cat.category_id
         WHERE c.category_id = ?
           AND c.status = 'active'
           ${excludeIds.length > 0 ? `AND c.course_id NOT IN (${placeHolders})` : ''}
           AND c.course_id NOT IN (
             SELECT course_id FROM user_enrollments WHERE user_id = ?
           )
         LIMIT ?`,
        excludeIds.length > 0 ? [category_id, ...excludeIds, user_id, 3 - recommendations.length] : [category_id, user_id, 3 - recommendations.length]
      );
      
      categoryCourses.forEach(course => {
        recommendations.push({
          ...course,
          recommendation_reason: `Top course in the same track: ${category_name || 'General'}. Expand your skills in this field.`,
          is_associated: false
        });
      });
    }

    // B3: Fallback general courses
    if (recommendations.length < 3) {
      const excludeIds = recommendations.map(r => r.course_id);
      if (course_id) excludeIds.push(course_id);
      
      const placeHolders = excludeIds.length > 0 ? excludeIds.map(() => '?').join(',') : '';
      const query = `SELECT c.*, cat.name AS category_name
                     FROM courses c
                     LEFT JOIN categories cat ON c.category_id = cat.category_id
                     WHERE c.status = 'active'
                       AND c.course_id NOT IN (
                         SELECT course_id FROM user_enrollments WHERE user_id = ?
                       )
                       ${excludeIds.length > 0 ? `AND c.course_id NOT IN (${placeHolders})` : ''}
                     LIMIT ?`;
      
      const params = [user_id, ...excludeIds, 3 - recommendations.length];
      const [fallbackCourses] = await db.query(query, params);
      
      fallbackCourses.forEach(course => {
        recommendations.push({
          ...course,
          recommendation_reason: "Recommended based on general popularity to broaden your learning path.",
          is_associated: false
        });
      });
    }

    return recommendations;
  },
};

module.exports = ResultModel;
