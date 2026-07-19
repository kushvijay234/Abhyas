const express = require("express");
const router = express.Router();

const AdminController = require("./adminController");
const authMiddleware = require("../../../middleware/authMiddleware");

// Get All Users
router.get("/users", authMiddleware, AdminController.getAllUsers);

// Get User By ID
router.get("/users/:id", authMiddleware, AdminController.getUserById);

// Delete User
router.delete("/users/:id", authMiddleware, AdminController.deleteUser);

// Update User Status
router.patch("/users/:id/status", authMiddleware, AdminController.updateUserStatus);

module.exports = router;