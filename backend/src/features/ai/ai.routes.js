const express = require("express");
const router = express.Router();
const AiController = require("./ai.controller");
const authMiddleware = require("../../middleware/authMiddleware");

// Ensure authentication for all AI / Tutor API calls
router.use(authMiddleware);

// Chats
router.get("/chats", AiController.getChats);
router.post("/chats", AiController.createChat);
router.put("/chats/:id", AiController.renameChat);
router.delete("/chats/:id", AiController.deleteChat);

// Messages & AI generation
router.get("/chats/:id/messages", AiController.getMessages);
router.post("/chats/:id/messages", AiController.sendMessage);
router.post("/chats/:id/quiz", AiController.generateQuiz);
router.post("/messages/:id/answer", AiController.submitQuizAnswer);

// Personal Goals Checklist
router.get("/goals", AiController.getGoals);
router.post("/goals", AiController.createGoal);
router.patch("/goals/:id", AiController.toggleGoal);
router.delete("/goals/:id", AiController.deleteGoal);

// Notes Bookmarks
router.get("/bookmarks", AiController.getBookmarks);
router.post("/bookmarks", AiController.createBookmark);
router.delete("/bookmarks/:id", AiController.deleteBookmark);

module.exports = router;
