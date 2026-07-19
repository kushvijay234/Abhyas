const express = require("express");
const router = express.Router();

const DashboardController = require("./dashboardController");
const authMiddleware      = require("../../../middleware/authMiddleware");
const adminMiddleware     = require("../../../middleware/adminMiddleware");

// Dashboard Analytics (overview + top students + recent activities)
router.get("/", authMiddleware, adminMiddleware, DashboardController.getDashboard);

module.exports = router;
