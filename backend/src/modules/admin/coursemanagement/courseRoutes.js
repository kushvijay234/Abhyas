const express = require("express");
const router = express.Router();

const CourseController = require("./courseController");
const authMiddleware = require("../../../middleware/authMiddleware");
const adminMiddleware = require("../../../middleware/adminMiddleware");

router.post("/", authMiddleware, adminMiddleware, CourseController.createCourse);

router.get("/", authMiddleware, adminMiddleware, CourseController.getAllCourses);



module.exports = router;