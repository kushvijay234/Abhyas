const express = require("express");
const router = express.Router();

const ExamController = require("./examController");
const authMiddleware = require("../../../middleware/authMiddleware");

// GET  /api/users/exams                        → Get All Published Exams (?search=&course_id=)
router.get("/", authMiddleware, ExamController.getExams);

// GET  /api/users/exams/history                → Exam History
router.get("/history", authMiddleware, ExamController.getHistory);

// POST /api/users/exams/:exam_id/start         → Start Exam
router.post("/:exam_id/start", authMiddleware, ExamController.startExam);

// POST /api/users/exams/:attempt_id/submit     → Submit Exam
router.post("/:attempt_id/submit", authMiddleware, ExamController.submitExam);

// GET  /api/users/exams/:attempt_id/result     → View Result
router.get("/:attempt_id/result", authMiddleware, ExamController.viewResult);

module.exports = router;
