const express = require("express");
const router = express.Router();

const UserController = require("../user/userController");

router.post("/register", UserController.register);

router.post("/login", UserController.login);

router.get("/", UserController.getUsers);

router.put("/reset-password", UserController.resetPassword);

module.exports = router;