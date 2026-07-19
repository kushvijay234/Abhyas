const express = require("express");
const router = express.Router();

const QuestionController = require("./questionController");
const authMiddleware     = require("../../../middleware/authMiddleware");
const adminMiddleware    = require("../../../middleware/adminMiddleware");

// Add Single Question
router.post("/", authMiddleware, adminMiddleware, QuestionController.addQuestion);

// Bulk Upload Questions  (body: { questions: [...] })
router.post("/bulk", authMiddleware, adminMiddleware, QuestionController.bulkUploadQuestions);

// Update Question
router.put("/:id", authMiddleware, adminMiddleware, QuestionController.updateQuestion);

// Delete Question
router.delete("/:id", authMiddleware, adminMiddleware, QuestionController.deleteQuestion);

module.exports = router;
