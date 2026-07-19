const express = require("express");
const router = express.Router();

const DashboardController = require("./dashboardController");
const authMiddleware = require("../../../middleware/authMiddleware");

router.get("/summary", authMiddleware, DashboardController.getSummary);

router.get("/performance", authMiddleware, DashboardController.getPerformance);

router.get("/recent-exams", authMiddleware, DashboardController.getRecentExams);

router.get("/upcoming-exams", authMiddleware, DashboardController.getUpcomingExams);

module.exports = router;