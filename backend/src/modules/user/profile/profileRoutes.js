const express = require("express");
const router = express.Router();

const ProfileController = require("./profileController");
const authMiddleware = require("../../../middleware/authMiddleware");

router.get("/", authMiddleware, ProfileController.getProfile);

router.put("/", authMiddleware, ProfileController.updateProfile);

router.put("/change-password", authMiddleware, ProfileController.changePassword);

router.delete("/", authMiddleware, ProfileController.deleteAccount);

module.exports = router;
