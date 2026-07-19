const express = require("express");
const router = express.Router();

const DashboardController = require("./dashboardController");
const authMiddleware = require("../../../middleware/authMiddleware");

router.get("/summary", authMiddleware, DashboardController.getSummary);

router.get("/performance", authMiddleware, DashboardController.getPerformance);

