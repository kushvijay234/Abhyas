const express = require("express");
const router = express.Router();
const AdminController = require("./usermangement/adminController");
const authMiddleware = require("../../middleware/authMiddleware");


router.get("/users", authMiddleware, AdminController.getAllUsers);

router.get("/users/:id", authMiddleware, AdminController.getUserById);

router.delete("/users/:id", authMiddleware, AdminController.deleteUser);
router.patch("/users/:id/status", authMiddleware, AdminController.updateUserStatus);
router.use("/courses", require("./coursemanagement/courseRoutes"));
router.use("/categories", require("./categorymanagement/categoryRoutes"));
router.use("/exams", require("./exammanagement/examRoutes"));
router.use("/questions", require("./questionmanagement/questionRoutes"));
router.use("/results", require("./resultmanagement/resultRoutes"));
router.use("/dashboard", require("./dashboard/dashboardRoutes"));
module.exports = router;