const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Verify user exists in database (handles cases where DB was re-seeded and token is stale)
    const [userRows] = await pool.execute(
      "SELECT 1 FROM users WHERE user_id = ? AND status = 'active'",
      [decoded.user_id]
    );

    if (userRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User session is invalid. Please log in again.",
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;