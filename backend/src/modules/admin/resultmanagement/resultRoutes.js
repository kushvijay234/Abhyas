const express = require("express");
const router = express.Router();

const ResultController = require("./resultController");
const authMiddleware   = require("../../../middleware/authMiddleware");
const adminMiddleware  = require("../../../middleware/adminMiddleware");

// View User Results
router.get("/user/:user_id", authMiddleware, adminMiddleware, ResultController.getUserResults);

// View Exam Results (includes pass-rate stats)
router.get("/exam/:exam_id", authMiddleware, adminMiddleware, ResultController.getExamResults);

// Generate Report  (?exam_id=&user_id=&from_date=&to_date=)
router.get("/report", authMiddleware, adminMiddleware, ResultController.generateReport);

// Export Results  (?format=csv  for CSV download, default is JSON)
router.get("/export", authMiddleware, adminMiddleware, ResultController.exportResults);

module.exports = router;
