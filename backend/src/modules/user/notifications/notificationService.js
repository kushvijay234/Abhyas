const NotificationModel = require("./notificationModel");

// Get All Notifications
const getNotifications = async (user_id) => {
  const data = await NotificationModel.getAll(user_id);
  const unread_count = data.filter((n) => !n.is_read).length;

  return {
    success: true,
    unread_count,
    count: data.length,
    data,
  };
};

// Mark Single Notification as Read
const markRead = async (user_id, notification_id) => {
  if (!notification_id) throw new Error("notification_id is required");

  const result = await NotificationModel.markRead(notification_id, user_id);
  if (result.affectedRows === 0) {
    throw new Error("Notification not found or already read");
  }

  return {
    success: true,
    message: "Notification marked as read",
  };
};

// Mark All Notifications as Read
const markAllRead = async (user_id) => {
  await NotificationModel.markAllRead(user_id);
  return {
    success: true,
    message: "All notifications marked as read",
  };
};

// Delete a Notification
const deleteNotification = async (user_id, notification_id) => {
  if (!notification_id) throw new Error("notification_id is required");

  const result = await NotificationModel.delete(notification_id, user_id);
  if (result.affectedRows === 0) {
    throw new Error("Notification not found");
  }

  return {
    success: true,
    message: "Notification deleted successfully",
  };
};

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
};
