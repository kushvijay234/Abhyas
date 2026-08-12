const express = require("express");
const router = express.Router();

const NotificationController = require("./notificationController");
const authMiddleware = require("../../../middleware/authMiddleware");

// GET    /api/users/notifications              → Get All Notifications
router.get("/", authMiddleware, NotificationController.getNotifications);

// PATCH  /api/users/notifications/read-all     → Mark All Notifications as Read
router.patch("/read-all", authMiddleware, NotificationController.markAllRead);

// PATCH  /api/users/notifications/:id/read     → Mark Single Notification as Read
router.patch("/:id/read", authMiddleware, NotificationController.markRead);

// DELETE /api/users/notifications/:id          → Delete a Notification
router.delete("/:id", authMiddleware, NotificationController.deleteNotification);

module.exports = router;
