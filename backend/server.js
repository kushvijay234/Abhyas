require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// Database Connection Test
const pool = require("./src/config/db");

// Routes
const userRoutes = require("./src/modules/user/user.routes");

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




// Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("MySQL Connected Successfully");
    connection.release();

    app.listen(PORT, () => {
      console.log(
        `🚀 Server running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Database Connection Failed");
    console.error(error.message);
    process.exit(1);
  }
};

startServer();