const db = require("../../../config/db");

const ProfileModel = {
  findById: async (user_id) => {
    const [rows] = await db.execute(
      `SELECT user_id, user_name, email, role, phone, avatar, bio, created_at
       FROM users WHERE user_id = ?`,
      [user_id]
    );
    return rows[0];
  },

  updateProfile: async (user_id, data) => {
    const { user_name, phone, bio, avatar } = data;
    const [result] = await db.execute(
      `UPDATE users SET user_name = ?, phone = ?, bio = ?, avatar = ?
       WHERE user_id = ?`,
      [user_name, phone, bio, avatar, user_id]
    );
    return result;
  },

  updatePassword: async (user_id, hashedPassword) => {
    const [result] = await db.execute(
      `UPDATE users SET password = ? WHERE user_id = ?`,
      [hashedPassword, user_id]
    );
    return result;
  },

  findPasswordById: async (user_id) => {
    const [rows] = await db.execute(
      `SELECT password FROM users WHERE user_id = ?`,
      [user_id]
    );
    return rows[0];
  },

  deleteUser: async (user_id) => {
    const [result] = await db.execute(
      `DELETE FROM users WHERE user_id = ?`,
      [user_id]
    );
    return result;
  },
};

module.exports = ProfileModel;
