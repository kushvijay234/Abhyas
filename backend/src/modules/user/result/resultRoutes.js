const express = require("express");
const router = express.Router();

const ResultController = require("./resultController");
const authMiddleware = require("../../../middleware/authMiddleware");

router.get("/", authMiddleware, ResultController.getResults);

router.get("/analytics", authMiddleware, ResultController.getAnalytics);