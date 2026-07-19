const express = require("express");
const router = express.Router();

const ProfileController = require("./profileController");
const authMiddleware = require("../../../middleware/authMiddleware");

router.get("/", authMiddleware, ProfileController.getProfile);

router.put("/", authMiddleware, ProfileController.updateProfile);

