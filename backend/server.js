require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// Database Connection Test
const pool = require("./src/config/db");

// Routes
const userRoutes = require("./src/modules/user/userRouter");
const adminRoutes = require("./src/modules/admin/adminRouter");
const aiRoutes = require("./src/features/ai/ai.routes");

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Abhyas Backend API Running Successfully 🚀",
  });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);



// Start Server
const PORT = process.env.PORT || 5000;
const runMigrations = require("./src/config/migrate");

const startServer = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("MySQL Connected Successfully");

    // Run database migrations
    await runMigrations(connection);

    connection.release();

    // Trigger semantic indexing in the background
    const IndexingService = require("./src/features/rag/indexing.service");
    IndexingService.runIndexing().then(result => {
      if (result && result.success) {
        console.log(`Initial indexing completed. Indexed ${result.count} documents.`);
      }
    }).catch(err => {
      console.error("Startup RAG indexing failed:", err.message);
    });

    // Start background sync cron
    const { setupEmbeddingsSync } = require("./src/cron/syncEmbeddings");
    setupEmbeddingsSync();

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Database Connection Failed");
    console.error(error.message);
    process.exit(1);
  }
};

startServer();