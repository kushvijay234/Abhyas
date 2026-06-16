const express = require("express");
const router = express.Router();

const UserController = require("../user/userController");
const authMiddleware = require("../../middleware/authMiddleware");


// Public API
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.put("/reset-password", UserController.resetPassword);

//Private API
router.put("/profile", authMiddleware, UserController.updateProfile);   



module.exports = router;