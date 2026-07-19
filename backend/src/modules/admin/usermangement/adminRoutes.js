const express = require("express");
const router = express.Router();

const AdminController = require("./adminController");
const authMiddleware = require("../../../middleware/authMiddleware");

// Get All Users
router.get("/users", authMiddleware, AdminController.getAllUsers);
