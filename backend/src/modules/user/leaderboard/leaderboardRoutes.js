const express = require("express");
const router = express.Router();

const LeaderboardController = require("./leaderboardController");
const authMiddleware = require("../../../middleware/authMiddleware");

// GET  /api/users/leaderboard/global          → Global Ranking (?limit=)
router.get("/global", authMiddleware, LeaderboardController.getGlobal);

// GET  /api/users/leaderboard/exam/:exam_id   → Ranking for a Specific Exam (?limit=)
router.get("/exam/:exam_id", authMiddleware, LeaderboardController.getByExam);

// GET  /api/users/leaderboard/course/:course_id → Ranking for a Specific Course (?limit=)
router.get("/course/:course_id", authMiddleware, LeaderboardController.getByCourse);

module.exports = router;
