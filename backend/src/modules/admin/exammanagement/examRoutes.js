const express = require("express");
const router = express.Router();

const ExamController = require("./examController");
const authMiddleware = require("../../../middleware/authMiddleware");
const adminMiddleware = require("../../../middleware/adminMiddleware");

// Create Exam
router.post("/", authMiddleware, adminMiddleware, ExamController.createExam);

// Get All Exams  (?search=&is_published=1|0)
router.get("/", authMiddleware, adminMiddleware, ExamController.getAllExams);

// Get Exam By ID
router.get("/:id", authMiddleware, adminMiddleware, ExamController.getExamById);

// Update Exam
router.put("/:id", authMiddleware, adminMiddleware, ExamController.updateExam);

// Delete Exam
router.delete("/:id", authMiddleware, adminMiddleware, ExamController.deleteExam);

module.exports = router;