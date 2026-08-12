const db = require("../../config/db");

const UserModel = {
  createUser: async (userData) => {
    const { user_name, email, password, role = "student" } = userData;

    const [result] = await db.execute(
      `INSERT INTO users (user_name, email, password, role)
       VALUES (?, ?, ?, ?)`,
      [user_name, email, password, role],
    );

    return result;
  },

  findByEmail: async (email) => {
    const [rows] = await db.execute(`SELECT * FROM users WHERE email = ?`, [
      email,
    ]);

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
      [user_id],
    );

    return rows[0];
  },

  deleteUser: async (user_id) => {
    const [result] = await db.execute(`DELETE FROM users WHERE user_id = ?`, [
      user_id,
    ]);

    return result;
  },

  // rest password
  updatePassword: async (email, password) => {
    const [result] = await db.execute(
      `UPDATE users
     SET password = ?
     WHERE email = ?`,
      [password, email],
    );

    return result;
  },

  updateUserProfile: async (user_id, user_name) => {
    const [result] = await db.execute(
      `UPDATE users
     SET user_name = ?
     WHERE user_id = ?`,
      [user_name, user_id],
    );

    return result;
  },

  updateOTP: async (email, otp, expiry) => {
    const [result] = await db.execute(
      `UPDATE users
       SET otp_code = ?, otp_expiry = ?
       WHERE email = ?`,
      [otp, expiry, email]
    );
    return result;
  },

  verifyOTP: async (email, otp) => {
    const [rows] = await db.execute(
      `SELECT * FROM users
       WHERE email = ? AND otp_code = ? AND otp_expiry > NOW()`,
      [email, otp]
    );
    return rows[0];
  },

  clearOTP: async (email) => {
    const [result] = await db.execute(
      `UPDATE users
       SET otp_code = NULL, otp_expiry = NULL
       WHERE email = ?`,
      [email]
    );
    return result;
  },
};

module.exports = UserModel;
