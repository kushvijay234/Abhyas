const express = require("express");
const router = express.Router();

const ExamController = require("./examController");
const authMiddleware = require("../../../middleware/authMiddleware");

//  Get All Published Exams 
router.get("/", authMiddleware, ExamController.getExams);

// Exam History
router.get("/history", authMiddleware, ExamController.getHistory);

// Start Exam
router.post("/:exam_id/start", authMiddleware, ExamController.startExam);

// Submit Exam
router.post("/:attempt_id/submit", authMiddleware, ExamController.submitExam);



module.exports = router;