const db = require("../../config/db");

const RecommendationService = {
  /**
   * Evaluates student exam performance to identify weak subjects,
   * then pulls relevant courses/exams not yet enrolled/completed.
   */
  getStudentRecommendations: async (userId) => {
    try {
      // 1. Find categories where student scores under 70% average
      const [performanceRows] = await db.execute(`
        SELECT c.category_id, cat.name AS category_name, ROUND(AVG(ea.percentage), 2) AS avg_score
        FROM exam_attempts ea
        JOIN exams e ON ea.exam_id = e.exam_id
        JOIN courses c ON e.course_id = c.course_id
        JOIN categories cat ON c.category_id = cat.category_id
        WHERE ea.user_id = ? AND ea.status = 'completed'
        GROUP BY c.category_id, cat.name
        ORDER BY avg_score ASC
      `, [userId]);

      let weakCategories = performanceRows.filter(row => parseFloat(row.avg_score) < 70).map(row => row.category_id);

      // 2. Recommend unenrolled courses matching weak categories first
      let recommendedCourses = [];
      if (weakCategories.length > 0) {
        const placeholders = weakCategories.map(() => '?').join(',');
        const queryParams = [...weakCategories, userId];
        const [rows] = await db.execute(`
          SELECT c.course_id, c.title, c.description, c.duration, cat.name AS category_name
          FROM courses c
          JOIN categories cat ON c.category_id = cat.category_id
          WHERE c.status = 'active'
            AND c.category_id IN (${placeholders})
            AND c.course_id NOT IN (SELECT course_id FROM user_enrollments WHERE user_id = ?)
          LIMIT 3
        `, queryParams);
        recommendedCourses = rows;
      }

      // Fill remaining recommendations with generic unenrolled active courses
      if (recommendedCourses.length < 3) {
        const excludeIds = recommendedCourses.map(c => c.course_id);
        const queryParams = [userId];
        let queryCondition = "";
        
        if (excludeIds.length > 0) {
          queryCondition = `AND c.course_id NOT IN (${excludeIds.map(() => '?').join(',')})`;
          queryParams.push(...excludeIds);
        }

        const limitVal = parseInt(3 - recommendedCourses.length, 10);

        const [rows] = await db.execute(`
          SELECT c.course_id, c.title, c.description, c.duration, cat.name AS category_name
          FROM courses c
          JOIN categories cat ON c.category_id = cat.category_id
          WHERE c.status = 'active'
            AND c.course_id NOT IN (SELECT course_id FROM user_enrollments WHERE user_id = ?)
            ${queryCondition}
          LIMIT ${limitVal}
        `, queryParams);
        recommendedCourses = [...recommendedCourses, ...rows];
      }

      // 3. Recommend exams that the student has not yet taken/completed
      const [recommendedExams] = await db.execute(`
        SELECT e.exam_id, e.title, e.duration_minutes, e.total_marks, c.title AS course_name
        FROM exams e
        JOIN courses c ON e.course_id = c.course_id
        WHERE e.is_published = 1
          AND e.exam_id NOT IN (SELECT exam_id FROM exam_attempts WHERE user_id = ? AND status = 'completed')
        ORDER BY RAND()
        LIMIT 3
      `, [userId]);

      return {
        success: true,
        courses: recommendedCourses,
        exams: recommendedExams
      };
    } catch (error) {
      console.error("Failed to generate student recommendations:", error.message);
      return { success: false, courses: [], exams: [] };
    }
  }
};

module.exports = RecommendationService;
