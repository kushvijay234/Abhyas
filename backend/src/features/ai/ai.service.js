const db = require("../../config/db");
const GeminiConfig = require("../../config/gemini");
const VectorDB = require("../../config/vectorDB");
const RetrievalService = require("../rag/retrieval.service");
const RecommendationService = require("../recommendation/recommendation.service");
const PromptBuilder = require("../../utils/promptBuilder");

const AiService = {
  /**
   * Loads chats for user. Auto-seeds default ones if none exist.
   */
  getChats: async (userId) => {
    const [rows] = await db.execute(
      "SELECT chat_id, title, category, created_at FROM tutor_chats WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    return rows;
  },

  /**
   * Creates a new chat.
   */
  createChat: async (userId, title = "New Conversation", category = "today") => {
    const [res] = await db.execute(
      "INSERT INTO tutor_chats (user_id, title, category) VALUES (?, ?, ?)",
      [userId, title, category]
    );
    return { chat_id: res.insertId, title, category };
  },

  /**
   * Renames a chat conversation.
   */
  renameChat: async (chatId, title) => {
    await db.execute(
      "UPDATE tutor_chats SET title = ? WHERE chat_id = ?",
      [title, chatId]
    );
    return { chat_id: chatId, title };
  },

  /**
   * Deletes a chat session.
   */
  deleteChat: async (chatId) => {
    await db.execute(
      "DELETE FROM tutor_chats WHERE chat_id = ?",
      [chatId]
    );
    return { success: true };
  },

  /**
   * Retrieves message history for a chat.
   */
  getMessages: async (chatId) => {
    const [rows] = await db.execute(
      "SELECT message_id, chat_id, sender, text, confidence, sources, difficulty, study_time, language, structured_data, quiz, user_answer, quiz_score, created_at FROM tutor_messages WHERE chat_id = ? ORDER BY created_at ASC",
      [chatId]
    );
    return rows.map((row) => ({
      id: row.message_id,
      sender: row.sender,
      text: row.text,
      confidence: row.confidence,
      sources: row.sources ? JSON.parse(row.sources) : [],
      difficulty: row.difficulty,
      studyTime: row.study_time,
      language: row.language,
      structuredData: row.structured_data ? JSON.parse(row.structured_data) : null,
      quiz: row.quiz ? JSON.parse(row.quiz) : null,
      userAnswer: row.user_answer,
      quizScore: row.quiz_score !== null ? row.quiz_score === 1 : null,
      created_at: row.created_at
    }));
  },

  /**
   * Sends user message, triggers RAG matching + Recommendations + Gemini, and saves both to database.
   */
  sendMessage: async (chatId, userId, text) => {
    // 1. Save user message to database
    await db.execute(
      "INSERT INTO tutor_messages (chat_id, sender, text) VALUES (?, 'user', ?)",
      [chatId, text]
    );

    // 2. Fetch context via RAG
    const ragMatches = await RetrievalService.retrieveContext(text);

    // 3. Fetch user recommendations
    const recommendations = await RecommendationService.getStudentRecommendations(userId);

    // 4. Fetch last 5 messages for chat history context
    const history = await AiService.getMessages(chatId);
    const lastHistory = history.slice(-6, -1); // exclude current user message from history array to avoid duplicate

    // 5. Compile Prompt
    const prompt = PromptBuilder.buildPrompt(text, ragMatches, recommendations, lastHistory);
    const system = PromptBuilder.getSystemInstruction();

    // 6. Generate Response from Gemini
    const aiResponse = await GeminiConfig.generateResponse(prompt, system);

    // 7. Save AI response message to database
    const sourcesStr = aiResponse.sources ? JSON.stringify(aiResponse.sources) : null;
    const structuredStr = aiResponse.structuredData ? JSON.stringify(aiResponse.structuredData) : null;
    const quizStr = aiResponse.quiz ? JSON.stringify(aiResponse.quiz) : null;

    const [res] = await db.execute(
      "INSERT INTO tutor_messages (chat_id, sender, text, confidence, sources, difficulty, study_time, language, structured_data, quiz) VALUES (?, 'ai', ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        chatId,
        aiResponse.text || "Here is what I formulated.",
        aiResponse.confidence || "95%",
        sourcesStr,
        aiResponse.difficulty || "Medium",
        aiResponse.studyTime || "15 mins",
        aiResponse.language || "en",
        structuredStr,
        quizStr
      ]
    );

    // 8. Auto-rename default chat title if it's "New Conversation"
    const [chatRows] = await db.execute("SELECT title FROM tutor_chats WHERE chat_id = ?", [chatId]);
    if (chatRows.length > 0 && chatRows[0].title === "New Conversation") {
      const newTitle = text.length > 20 ? text.substring(0, 20) + "..." : text;
      await db.execute("UPDATE tutor_chats SET title = ? WHERE chat_id = ?", [newTitle, chatId]);
    }

    return {
      id: res.insertId,
      sender: "ai",
      text: aiResponse.text,
      confidence: aiResponse.confidence,
      sources: aiResponse.sources || [],
      difficulty: aiResponse.difficulty,
      studyTime: aiResponse.studyTime,
      language: aiResponse.language,
      structuredData: aiResponse.structuredData || null,
      quiz: aiResponse.quiz || null
    };
  },

  /**
   * Generates a context practice quiz.
   */
  generateQuiz: async (chatId) => {
    // 1. Fetch recent messages in this chat to extract the topic context
    const [messages] = await db.execute(
      "SELECT sender, text FROM tutor_messages WHERE chat_id = ? ORDER BY created_at ASC LIMIT 15",
      [chatId]
    );

    // 2. Build conversation history summary
    let topicContext = "computer science competitive exams";
    if (messages.length > 0) {
      const chatSummary = messages.map(m => `${m.sender}: ${m.text}`).join("\n");
      topicContext = `the following conversation history and topic:\n${chatSummary}\n\nMake sure the practice question tests the user's understanding of the specific concepts discussed above.`;
    }

    // 3. Customize prompt with topicContext
    const prompt = `Generate a single multiple-choice practice question based on ${topicContext}. Respond STRICTLY with a JSON object matching this schema: { "text": "Introductory chat text e.g. Here is a quick practice question based on your current focus:", "quiz": { "question": "Question text", "options": [ { "key": "A", "text": "option description" }, { "key": "B", "text": "option description" }, { "key": "C", "text": "option description", "isCorrect": true }, { "key": "D", "text": "option description" } ] } }`;
    const system = "You are a CS exam examiner. Respond strictly in JSON format without backticks.";
    
    let aiResponse;
    try {
      aiResponse = await GeminiConfig.generateResponse(prompt, system);
    } catch (err) {
      console.error("Gemini failed to generate quiz:", err.message);
    }

    if (!aiResponse || !aiResponse.quiz) {
      // Analyze text of messages to select a mock question matching the topic
      const textLower = messages.map(m => m.text.toLowerCase()).join(" ");
      
      let fallbackQuiz = {
        question: "Which of the following traversal algorithms visits the root node last?",
        options: [
          { key: "A", text: "Preorder traversal" },
          { key: "B", text: "Inorder traversal" },
          { key: "C", text: "Postorder traversal", isCorrect: true },
          { key: "D", text: "Level order traversal" }
        ]
      };

      if (textLower.includes("dbms") || textLower.includes("transaction") || textLower.includes("sql") || textLower.includes("acid")) {
        fallbackQuiz = {
          question: "Which ACID property guarantees that all database updates in a transaction are committed or all are rolled back?",
          options: [
            { key: "A", text: "Consistency" },
            { key: "B", text: "Isolation" },
            { key: "C", text: "Durability" },
            { key: "D", text: "Atomicity", isCorrect: true }
          ]
        };
      } else if (textLower.includes("schedule") || textLower.includes("process") || textLower.includes("starvation") || textLower.includes("quantum")) {
        fallbackQuiz = {
          question: "Which CPU scheduling algorithm can suffer from process starvation?",
          options: [
            { key: "A", text: "Round Robin (RR)" },
            { key: "B", text: "First Come First Served (FCFS)" },
            { key: "C", text: "Shortest Job First (SJF)", isCorrect: true },
            { key: "D", text: "Multilevel Queue without feedback" }
          ]
        };
      } else if (textLower.includes("network") || textLower.includes("osi") || textLower.includes("ip") || textLower.includes("tcp")) {
        fallbackQuiz = {
          question: "At which layer of the OSI model does an IP router operate?",
          options: [
            { key: "A", text: "Layer 2 - Data Link Layer" },
            { key: "B", text: "Layer 3 - Network Layer", isCorrect: true },
            { key: "C", text: "Layer 4 - Transport Layer" },
            { key: "D", text: "Layer 7 - Application Layer" }
          ]
        };
      }

      aiResponse = {
        text: "Here is your quick practice question based on your current focus:",
        quiz: fallbackQuiz
      };
    }

    const quizStr = JSON.stringify(aiResponse.quiz);
    const [res] = await db.execute(
      "INSERT INTO tutor_messages (chat_id, sender, text, quiz) VALUES (?, 'ai', ?, ?)",
      [chatId, aiResponse.text || "Here is a quick question for you:", quizStr]
    );

    return {
      id: res.insertId,
      sender: "ai",
      text: aiResponse.text || "Here is a quick question for you:",
      quiz: aiResponse.quiz
    };
  },

  /**
   * Loads today's goals. Seeds defaults if empty.
   */
  getGoals: async (userId) => {
    const [rows] = await db.execute(
      "SELECT goal_id, text, is_checked FROM tutor_goals WHERE user_id = ? ORDER BY created_at ASC",
      [userId]
    );

    if (rows.length > 0) {
      return rows.map(r => ({ id: r.goal_id, text: r.text, checked: !!r.is_checked }));
    }

    // Seed default goals
    const defaultGoals = [
      { text: "Finish Trees concept explanation", is_checked: 1 },
      { text: "Complete Mock Quiz: DBMS normalization", is_checked: 0 },
      { text: "Revise Operating System Scheduling notes", is_checked: 0 }
    ];

    const seeded = [];
    for (const g of defaultGoals) {
      const [res] = await db.execute(
        "INSERT INTO tutor_goals (user_id, text, is_checked) VALUES (?, ?, ?)",
        [userId, g.text, g.is_checked]
      );
      seeded.push({ id: res.insertId, text: g.text, checked: !!g.is_checked });
    }
    return seeded;
  },

  createGoal: async (userId, text) => {
    const [res] = await db.execute(
      "INSERT INTO tutor_goals (user_id, text, is_checked) VALUES (?, ?, 0)",
      [userId, text]
    );
    return { id: res.insertId, text, checked: false };
  },

  toggleGoal: async (goalId, isChecked) => {
    await db.execute(
      "UPDATE tutor_goals SET is_checked = ? WHERE goal_id = ?",
      [isChecked ? 1 : 0, goalId]
    );
    return { success: true };
  },

  deleteGoal: async (goalId) => {
    await db.execute(
      "DELETE FROM tutor_goals WHERE goal_id = ?",
      [goalId]
    );
    return { success: true };
  },

  /**
   * Loads bookmarks. Seeds defaults if empty.
   */
  getBookmarks: async (userId) => {
    const [rows] = await db.execute(
      "SELECT bookmark_id, title FROM tutor_bookmarks WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    if (rows.length > 0) {
      return rows.map(r => ({ id: r.bookmark_id, title: r.title }));
    }

    // Seed default bookmarks
    const defaultBookmarks = [
      "Binary Tree Traversals (Inorder/Preorder)",
      "ACID Properties in Transactions"
    ];

    const seeded = [];
    for (const title of defaultBookmarks) {
      const [res] = await db.execute(
        "INSERT INTO tutor_bookmarks (user_id, title) VALUES (?, ?)",
        [userId, title]
      );
      seeded.push({ id: res.insertId, title });
    }
    return seeded;
  },

  createBookmark: async (userId, title) => {
    const [res] = await db.execute(
      "INSERT INTO tutor_bookmarks (user_id, title) VALUES (?, ?)",
      [userId, title]
    );
    return { id: res.insertId, title };
  },

  deleteBookmark: async (bookmarkId) => {
    await db.execute(
      "DELETE FROM tutor_bookmarks WHERE bookmark_id = ?",
      [bookmarkId]
    );
    return { success: true };
  },

  submitQuizAnswer: async (messageId, answerIdx, isCorrect) => {
    await db.execute(
      "UPDATE tutor_messages SET user_answer = ?, quiz_score = ? WHERE message_id = ?",
      [answerIdx, isCorrect ? 1 : 0, messageId]
    );
    return { success: true };
  }
};

module.exports = AiService;
