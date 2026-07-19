const db = require("../../../config/db");

const CategoryModel = {
  getAll: async () => {
    const query = `
      SELECT cat.category_id, cat.name, cat.created_at, COUNT(c.course_id) AS course_count
      FROM categories cat
      LEFT JOIN courses c ON cat.category_id = c.category_id
      GROUP BY cat.category_id
      ORDER BY cat.name ASC
    `;
    const [rows] = await db.execute(query);
    return rows;
  },

  create: async (name) => {
    const [result] = await db.execute(
      `INSERT INTO categories (name) VALUES (?)`,
      [name]
    );
    return result;
  },

  update: async (id, name) => {
    const [result] = await db.execute(
      `UPDATE categories SET name = ? WHERE category_id = ?`,
      [name, id]
    );
    return result;
  },

  delete: async (id) => {
    const [result] = await db.execute(
      `DELETE FROM categories WHERE category_id = ?`,
      [id]
    );
    return result;
  },

  findByName: async (name) => {
    const [rows] = await db.execute(
      `SELECT * FROM categories WHERE name = ?`,
      [name]
    );
    return rows[0];
  },

  findById: async (id) => {
    const [rows] = await db.execute(
      `SELECT * FROM categories WHERE category_id = ?`,
      [id]
    );
    return rows[0];
  }
};

module.exports = CategoryModel;
