const express = require("express");
const router = express.Router();

const LeaderboardController = require("./leaderboardController");
const authMiddleware = require("../../../middleware/authMiddleware");

// Global Ranking 
router.get("/global", authMiddleware, LeaderboardController.getGlobal);

module.exports = router;