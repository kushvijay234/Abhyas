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

};

module.exports = CourseModel;