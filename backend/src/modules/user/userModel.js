const db = require("../../config/db");

const UserModel = {
  createUser: async (userData) => {
    const { full_name, email, password } = userData;

    const [result] = await db.execute(
      `INSERT INTO users (full_name,email,password)
       VALUES (?,?,?)`,
      [full_name, email, password]
    );

    return result;
  },

  findByEmail: async (email) => {
    const [rows] = await db.execute(
      `SELECT * FROM users WHERE email=?`,
      [email]
    );

    return rows[0];
  },

  findById: async (id) => {
    const [rows] = await db.execute(
      `SELECT id,full_name,email,role,created_at
       FROM users WHERE id=?`,
      [id]
    );

    return rows[0];
  },

  getAllUsers: async () => {
    const [rows] = await db.execute(
      `SELECT id,full_name,email,role,created_at
       FROM users`
    );

    return rows;
  },
};

module.exports = UserModel;