const AiService = require("./ai.service");

const AiController = {
  getChats: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const data = await AiService.getChats(userId);
      res.status(200).json({ success: true, status: 200, message: "Chats loaded successfully", data });
    } catch (error) {
      res.status(500).json({ success: false, status: 500, message: error.message, error: error.message });
    }
  },

  createChat: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { title, category } = req.body;
      const data = await AiService.createChat(userId, title, category);
      res.status(201).json({ success: true, status: 201, message: "Chat created successfully", data });
    } catch (error) {
      res.status(500).json({ success: false, status: 500, message: error.message, error: error.message });
    }
  },

  renameChat: async (req, res) => {
    try {
      const chatId = req.params.id;
      const { title } = req.body;
      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, status: 400, message: "Title is required" });
      }
      const data = await AiService.renameChat(chatId, title.trim());
      res.status(200).json({ success: true, status: 200, message: "Chat renamed successfully", data });
    } catch (error) {
      res.status(500).json({ success: false, status: 500, message: error.message, error: error.message });
    }
  },

  deleteChat: async (req, res) => {
    try {
      const chatId = req.params.id;
      await AiService.deleteChat(chatId);
      res.status(200).json({ success: true, status: 200, message: "Chat deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, status: 500, message: error.message, error: error.message });
    }
  },

  getMessages: async (req, res) => {
    try {
      const chatId = req.params.id;
      const data = await AiService.getMessages(chatId);
      res.status(200).json({ success: true, status: 200, message: "Messages loaded successfully", data });
    } catch (error) {
      res.status(500).json({ success: false, status: 500, message: error.message, error: error.message });
    }
  },

  sendMessage: async (req, res) => {
    try {
      const chatId = req.params.id;
      const userId = req.user.user_id;
      const { text } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, status: 400, message: "Message text is required" });
      }
      const data = await AiService.sendMessage(chatId, userId, text.trim());
      res.status(200).json({ success: true, status: 200, message: "Message sent successfully", data });
    } catch (error) {
      res.status(500).json({ success: false, status: 500, message: error.message, error: error.message });
    }
  },

  generateQuiz: async (req, res) => {
    try {
      const chatId = req.params.id;
      const data = await AiService.generateQuiz(chatId);
      res.status(201).json({ success: true, status: 201, message: "Quiz generated successfully", data });
    } catch (error) {
      res.status(500).json({ success: false, status: 500, message: error.message, error: error.message });
    }
  },

  submitQuizAnswer: async (req, res) => {
    try {
      const messageId = req.params.id;
      const { answerIdx, isCorrect } = req.body;
      const data = await AiService.submitQuizAnswer(messageId, answerIdx, isCorrect);
      res.status(200).json({ success: true, status: 200, message: "Quiz answer submitted successfully", data });
    } catch (error) {
      res.status(500).json({ success: false, status: 500, message: error.message, error: error.message });
    }
  },

  getGoals: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const data = await AiService.getGoals(userId);
      res.status(200).json({ success: true, status: 200, message: "Goals loaded successfully", data });
    } catch (error) {
      res.status(500).json({ success: false, status: 500, message: error.message, error: error.message });
    }
  },

  createGoal: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { text } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, status: 400, message: "Goal text is required" });
      }
      const data = await AiService.createGoal(userId, text.trim());
      res.status(201).json({ success: true, status: 201, message: "Goal created successfully", data });
    } catch (error) {
      res.status(500).json({ success: false, status: 500, message: error.message, error: error.message });
    }
  },

  toggleGoal: async (req, res) => {
    try {
      const goalId = req.params.id;
      const { isChecked } = req.body;
      await AiService.toggleGoal(goalId, !!isChecked);
      res.status(200).json({ success: true, status: 200, message: "Goal updated successfully" });
    } catch (error) {
      res.status(500).json({ success: false, status: 500, message: error.message, error: error.message });
    }
  },

  deleteGoal: async (req, res) => {
    try {
      const goalId = req.params.id;
      await AiService.deleteGoal(goalId);
      res.status(200).json({ success: true, status: 200, message: "Goal deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, status: 500, message: error.message, error: error.message });
    }
  },

  getBookmarks: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const data = await AiService.getBookmarks(userId);
      res.status(200).json({ success: true, status: 200, message: "Bookmarks loaded successfully", data });
    } catch (error) {
      res.status(500).json({ success: false, status: 500, message: error.message, error: error.message });
    }
  },

  createBookmark: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { title } = req.body;
      if (!title || !title.trim()) {
        return res.status(400).json({ success: false, status: 400, message: "Bookmark title is required" });
      }
      const data = await AiService.createBookmark(userId, title.trim());
      res.status(201).json({ success: true, status: 201, message: "Bookmark created successfully", data });
    } catch (error) {
      res.status(500).json({ success: false, status: 500, message: error.message, error: error.message });
    }
  },

  deleteBookmark: async (req, res) => {
    try {
      const bookmarkId = req.params.id;
      await AiService.deleteBookmark(bookmarkId);
      res.status(200).json({ success: true, status: 200, message: "Bookmark deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, status: 500, message: error.message, error: error.message });
    }
  }
};

module.exports = AiController;
