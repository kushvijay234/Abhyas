const express = require("express");
const router = express.Router();

const QuestionController = require("./questionController");
const authMiddleware = require("../../../middleware/authMiddleware");

router.get("/", authMiddleware, QuestionController.getQuestions);

router.post("/answer", authMiddleware, QuestionController.saveAnswer);

router.post("/review", authMiddleware, QuestionController.markReview);

router.get("/:attempt_id/status", authMiddleware, QuestionController.getAnswerStatus);

module.exports = router;
