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

};

module.exports = CourseModel;