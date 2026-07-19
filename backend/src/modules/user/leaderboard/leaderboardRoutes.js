const express = require("express");
const router = express.Router();

const LeaderboardController = require("./leaderboardController");
const authMiddleware = require("../../../middleware/authMiddleware");

// Global Ranking 
router.get("/global", authMiddleware, LeaderboardController.getGlobal);

// Get Ranking for a Specific Exam
router.get("/exam/:exam_id", authMiddleware, LeaderboardController.getByExam);

module.exports = router;