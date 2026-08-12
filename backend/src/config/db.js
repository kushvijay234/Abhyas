const mysql = require("mysql2/promise");

let pool;

if (process.env.DATABASE_URL || process.env.DB_URL) {
  const connectionUri = process.env.DATABASE_URL || process.env.DB_URL;
  try {
    const url = new URL(connectionUri);
    const config = {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: decodeURIComponent(url.password || ""),
      database: url.pathname.replace(/^\//, ""),
      waitForConnections: true,
      connectionLimit: 10,
    };

    const isLocalhost = config.host === "localhost" || config.host === "127.0.0.1";
    if (process.env.DB_SSL === "true" || (!isLocalhost && process.env.DB_SSL !== "false")) {
      config.ssl = {
        rejectUnauthorized: false
      };
    }
    pool = mysql.createPool(config);
  } catch (err) {
    console.error("Failed to parse database connection URI, trying direct connection string...");
    pool = mysql.createPool(connectionUri);
  }
} else {
  const config = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "abhyastest",
    waitForConnections: true,
    connectionLimit: 10,
  };

  const isLocalhost = config.host === "localhost" || config.host === "127.0.0.1";
  if (process.env.DB_SSL === "true" || (!isLocalhost && process.env.DB_SSL !== "false")) {
    config.ssl = {
      rejectUnauthorized: false
    };
  }
  pool = mysql.createPool(config);
}

module.exports = pool;