const db = require("../../config/db");

const UserModel = {
  createUser: async (userData) => {
    const { user_name, email, password, role = "student" } = userData;

    const [result] = await db.execute(
      `INSERT INTO users (user_name, email, password, role)
       VALUES (?, ?, ?, ?)`,
      [user_name, email, password, role]
    );

    return result;
  },

  findByEmail: async (email) => {
    const [rows] = await db.execute(
      `SELECT * FROM users WHERE email = ?`,
      [email]
    );

    return rows[0];
  },

  findById: async (user_id) => {
    const [rows] = await db.execute(
      `SELECT 
        user_id,
        user_name,
        email,
        role,
        created_at
       FROM users
       WHERE user_id = ?`,
      [user_id]
    );

    return rows[0];
  },

  getAllUsers: async () => {
    const [rows] = await db.execute(
      `SELECT
        user_id,
        user_name,
        email,
        role,
        created_at
       FROM users`
    );

    return rows;
  },

  deleteUser: async (user_id) => {
    const [result] = await db.execute(
      `DELETE FROM users WHERE user_id = ?`,
      [user_id]
    );

    return result;
  },
};

module.exports = UserModel;