const pool = require("../../../config/db");

const getAllUsers = async (search = "", status = "") => {
  let query = `
        SELECT user_id AS id, user_id, user_name AS name, user_name, email, phone, avatar, role, status, created_at
        FROM users
        WHERE 1=1
    `;

  const params = [];

  if (search) {
    query += ` AND (user_name LIKE ? OR email LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }

  const [rows] = await pool.query(query, params);
  return rows;
};

const getUserById = async (id) => {
  const [rows] = await pool.query(
    `SELECT user_id AS id, user_id, user_name AS name, user_name, email, phone, avatar, role, status, created_at
         FROM users
         WHERE user_id = ?`,
    [id],
  );

  return rows[0];
};

const deleteUser = async (id) => {
    const [result] = await pool.query(
        `DELETE FROM users
         WHERE user_id = ?`,
        [id]
    );

    return result;
};

const updateUserStatus = async (id, status) => {
    const [result] = await pool.query(
        `UPDATE users
         SET status = ?
         WHERE user_id = ?`,
        [status, id]
    );

    return result;
};

module.exports = {
    getAllUsers,
    getUserById,
    deleteUser,
    updateUserStatus,
};