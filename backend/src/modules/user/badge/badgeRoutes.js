const express = require("express");
const router = express.Router();
const badgeService = require("./badgeService");
const authMiddleware = require("../../../middleware/authMiddleware");

// 1. Get logged in student's own badges
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const data = await badgeService.getUserBadges(user_id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 2. Get badges for a specific student (Admin only)
router.get("/admin/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }
    const data = await badgeService.getUserBadges(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 3. Award a badge manually to a student (Admin only)
router.post("/admin/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }
    const result = await badgeService.adminAwardBadge(req.params.id, req.body.badge_type);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// 4. Revoke a badge manually from a student (Admin only)
router.delete("/admin/:id/:badge_type", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }
    const result = await badgeService.adminRevokeBadge(req.params.id, req.params.badge_type);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
