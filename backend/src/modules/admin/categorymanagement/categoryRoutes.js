const express = require("express");
const router = express.Router();
const CategoryController = require("./categoryController");
const authMiddleware = require("../../../middleware/authMiddleware");
const adminMiddleware = require("../../../middleware/adminMiddleware");

router.get("/", authMiddleware, adminMiddleware, CategoryController.getAllCategories);
router.post("/", authMiddleware, adminMiddleware, CategoryController.createCategory);
router.put("/:id", authMiddleware, adminMiddleware, CategoryController.updateCategory);
router.delete("/:id", authMiddleware, adminMiddleware, CategoryController.deleteCategory);

module.exports = router;
