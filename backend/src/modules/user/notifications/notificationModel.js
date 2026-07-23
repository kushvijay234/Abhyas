const db = require("../../../config/db");

const NotificationModel = {
  getAll: async (user_id) => {
    const [rows] = await db.execute(
      `SELECT notification_id, title, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [user_id]
    );
    return rows;
  },

  markRead: async (notification_id, user_id) => {
    const [result] = await db.execute(
      `UPDATE notifications SET is_read = 1
       WHERE notification_id = ? AND user_id = ?`,
      [notification_id, user_id]
    );
    return result;
  },

  markAllRead: async (user_id) => {
    const [result] = await db.execute(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
      [user_id]
    );
    return result;
  },

  delete: async (notification_id, user_id) => {
    const [result] = await db.execute(
      `DELETE FROM notifications
       WHERE notification_id = ? AND user_id = ?`,
      [notification_id, user_id]
    );
    return result;
  },
};

module.exports = NotificationModel;
