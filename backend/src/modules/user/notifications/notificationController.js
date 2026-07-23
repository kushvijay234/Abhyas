const NotificationService = require("./notificationService");

// Get All Notifications
const getNotifications = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const result = await NotificationService.getNotifications(user_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark Single Notification as Read
const markRead = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;
    const result = await NotificationService.markRead(user_id, id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// Mark All Notifications as Read
const markAllRead = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const result = await NotificationService.markAllRead(user_id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a Notification
const deleteNotification = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;
    const result = await NotificationService.deleteNotification(user_id, id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
};
