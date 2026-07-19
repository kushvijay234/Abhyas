const express = require("express");
const router = express.Router();

const ResultController = require("./resultController");
const authMiddleware = require("../../../middleware/authMiddleware");

router.get("/", authMiddleware, ResultController.getResults);

router.get("/analytics", authMiddleware, ResultController.getAnalytics);

router.get("/exam/:exam_id", authMiddleware, ResultController.getExamResult);

router.get("/:id/review", authMiddleware, ResultController.getAnswerReview);

router.get("/:id", authMiddleware, ResultController.getResultById);

module.exports = router;