const express = require("express");
const router = express.Router();

const QuestionController = require("./questionController");
const authMiddleware     = require("../../../middleware/authMiddleware");
const adminMiddleware    = require("../../../middleware/adminMiddleware");

// Add Single Question
router.post("/", authMiddleware, adminMiddleware, QuestionController.addQuestion);