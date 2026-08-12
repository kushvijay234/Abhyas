const express = require("express");
const router = express.Router();

const UserController = require("../user/userController");
const authMiddleware = require("../../middleware/authMiddleware");


// Public API
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.post("/forgot-password", UserController.forgotPassword);
router.put("/reset-password", UserController.resetPassword);

// Private / Sub-module routes
router.use("/profile", require("./profile/profileRoutes"));
router.use("/badges", require("./badge/badgeRoutes"));
router.use("/courses", require("./course/courseRoutes"));
router.use("/exams", require("./exam/examRoutes"));
router.use("/questions", require("./question/questionRoutes"));
router.use("/results", require("./result/resultRoutes"));
router.use("/dashboard", require("./dashboard/dashboardRoutes"));
router.use("/notifications", require("./notifications/notificationRoutes"));
router.use("/leaderboard", require("./leaderboard/leaderboardRoutes"));

module.exports = router;