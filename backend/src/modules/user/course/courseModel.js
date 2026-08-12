const db = require("../../../config/db");

const CourseModel = {
  getAllPublished: async (search, category_id) => {
    let query = `SELECT c.*, cat.name AS category_name
                 FROM courses c
                 LEFT JOIN categories cat ON c.category_id = cat.category_id
                 WHERE c.status = 'active'`;
    const params = [];

    if (search) {
      query += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category_id) {
      query += ` AND c.category_id = ?`;
      params.push(category_id);
    }

    query += ` ORDER BY c.created_at DESC`;
    const [rows] = await db.execute(query, params);
    return rows;
  },

  findById: async (course_id) => {
    const [rows] = await db.execute(
      `SELECT c.*, cat.name AS category_name
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.category_id
       WHERE c.course_id = ? AND c.status = 'active'`,
      [course_id]
    );
    return rows[0];
  },

  getCategories: async () => {
    const [rows] = await db.execute(
      `SELECT * FROM categories ORDER BY name ASC`
    );
    return rows;
  },

  getMyCourses: async (user_id) => {
    const [rows] = await db.execute(
      `SELECT c.course_id, c.title, c.description, c.thumbnail, c.duration, c.category_id,
              cat.name AS category_name, ue.enrolled_at
       FROM user_enrollments ue
       JOIN courses c ON ue.course_id = c.course_id
       LEFT JOIN categories cat ON c.category_id = cat.category_id
       WHERE ue.user_id = ?
       ORDER BY ue.enrolled_at DESC`,
      [user_id]
    );
    return rows;
  },

  checkEnrollment: async (user_id, course_id) => {
    const [rows] = await db.execute(
      `SELECT 1 FROM user_enrollments WHERE user_id = ? AND course_id = ?`,
      [user_id, course_id]
    );
    return rows.length > 0;
  },

  enroll: async (user_id, course_id) => {
    const [result] = await db.execute(
      `INSERT INTO user_enrollments (user_id, course_id) VALUES (?, ?)`,
      [user_id, course_id]
    );
    return result;
  },

  getCurriculum: async (course_id) => {
    const [sections] = await db.execute(
      `SELECT * FROM course_sections WHERE course_id = ? ORDER BY sort_order ASC`,
      [course_id]
    );

    if (sections.length === 0) return [];

    const sectionIds = sections.map(s => s.section_id);
    const placeHolders = sectionIds.map(() => '?').join(',');
    const [items] = await db.execute(
      `SELECT ci.*, e.title AS exam_title, e.duration_minutes AS exam_duration_minutes, e.total_marks AS exam_total_marks, e.passing_marks AS exam_passing_marks
       FROM curriculum_items ci
       LEFT JOIN exams e ON ci.exam_id = e.exam_id
       WHERE ci.section_id IN (${placeHolders})
       ORDER BY ci.sort_order ASC`,
      sectionIds
    );

    const itemsBySection = {};
    items.forEach(item => {
      if (!itemsBySection[item.section_id]) {
        itemsBySection[item.section_id] = [];
      }
      if (item.type === 'exam' && item.exam_id) {
        item.examData = {
          exam_id: item.exam_id,
          title: item.exam_title,
          duration_minutes: item.exam_duration_minutes,
          total_marks: item.exam_total_marks,
          passing_marks: item.exam_passing_marks
        };
      }
      itemsBySection[item.section_id].push(item);
    });

    return sections.map(sec => ({
      ...sec,
      items: itemsBySection[sec.section_id] || []
    }));
  },
};

module.exports = CourseModel;
