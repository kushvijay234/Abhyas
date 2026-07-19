const express = require("express");
const router = express.Router();

const LeaderboardController = require("./leaderboardController");
const authMiddleware = require("../../../middleware/authMiddleware");

// Get Global Ranking 
router.get("/global", authMiddleware, LeaderboardController.getGlobal);

// Get Ranking for a Specific Exam
router.get("/exam/:exam_id", authMiddleware, LeaderboardController.getByExam);

// Get Ranking for a Specific Course 
router.get("/course/:course_id", authMiddleware, LeaderboardController.getByCourse);
module.exports = router;