const express = require("express");
const router = express.Router();

const ExamController = require("./examController");
const authMiddleware = require("../../../middleware/authMiddleware");

//  Get All Published Exams 
router.get("/", authMiddleware, ExamController.getExams);



module.exports = router;