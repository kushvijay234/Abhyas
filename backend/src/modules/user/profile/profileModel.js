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

  