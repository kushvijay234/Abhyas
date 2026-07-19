const pool = require("../../../config/db");

// Total Users
const getTotalUsers = async () => {
  const [rows] = await pool.execute(`SELECT COUNT(*) AS total FROM users`);
  return rows[0].total;
};

module.exports = {
  getTotalUsers,
};