const express = require("express");
const router = express.Router();

const ExamController = require("./examController");
const authMiddleware = require("../../../middleware/authMiddleware");
const adminMiddleware = require("../../../middleware/adminMiddleware");

// Create Exam
router.post("/", authMiddleware, adminMiddleware, ExamController.createExam);

// Get All Exams  (?search=&is_published=1|0)
router.get("/", authMiddleware, adminMiddleware, ExamController.getAllExams);
module.exports = router;