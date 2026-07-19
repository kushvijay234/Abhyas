const express = require("express");
const router = express.Router();

const CourseController = require("./courseController");
const authMiddleware = require("../../../middleware/authMiddleware");

// GET /api/users/courses                  → Get All Published Courses (?search=&category_id=)
router.get("/", authMiddleware, CourseController.getCourses);

// GET /api/users/courses/categories       → Get All Categories
router.get("/categories", authMiddleware, CourseController.getCategories);

// GET /api/users/courses/my              → My Enrolled Courses
router.get("/my", authMiddleware, CourseController.getMyCourses);