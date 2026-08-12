const runMigrations = async (connection) => {
  try {
    console.log("Running database migrations...");
    // Retrieve columns from the users table
    const [columns] = await connection.query("SHOW COLUMNS FROM users");
    const hasOtpCode = columns.some(col => col.Field === 'otp_code');
    const hasOtpExpiry = columns.some(col => col.Field === 'otp_expiry');

    if (!hasOtpCode) {
      console.log("Adding 'otp_code' column to users table...");
      await connection.query("ALTER TABLE users ADD COLUMN otp_code VARCHAR(6) DEFAULT NULL");
    }
    
    if (!hasOtpExpiry) {
      console.log("Adding 'otp_expiry' column to users table...");
      await connection.query("ALTER TABLE users ADD COLUMN otp_expiry TIMESTAMP NULL DEFAULT NULL");
    }

    // Create user_badges table if not exists
    console.log("Checking for 'user_badges' table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        user_id INT NOT NULL,
        badge_type VARCHAR(50) NOT NULL,
        earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, badge_type),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    // Create tutor_chats table if not exists
    console.log("Checking for 'tutor_chats' table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tutor_chats (
        chat_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'today',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    // Create tutor_messages table if not exists
    console.log("Checking for 'tutor_messages' table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tutor_messages (
        message_id INT AUTO_INCREMENT PRIMARY KEY,
        chat_id INT NOT NULL,
        sender ENUM('user', 'ai') NOT NULL,
        text TEXT NOT NULL,
        confidence VARCHAR(10) DEFAULT NULL,
        sources TEXT DEFAULT NULL,
        difficulty VARCHAR(20) DEFAULT NULL,
        study_time VARCHAR(20) DEFAULT NULL,
        language VARCHAR(5) DEFAULT 'en',
        structured_data TEXT DEFAULT NULL,
        quiz TEXT DEFAULT NULL,
        user_answer INT DEFAULT NULL,
        quiz_score TINYINT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES tutor_chats(chat_id) ON DELETE CASCADE
      )
    `);

    try {
      await connection.query("ALTER TABLE tutor_messages ADD COLUMN user_answer INT DEFAULT NULL");
    } catch (e) {}
    try {
      await connection.query("ALTER TABLE tutor_messages ADD COLUMN quiz_score TINYINT DEFAULT NULL");
    } catch (e) {}

    // Create tutor_goals table if not exists
    console.log("Checking for 'tutor_goals' table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tutor_goals (
        goal_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        text VARCHAR(255) NOT NULL,
        is_checked TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    // Create tutor_bookmarks table if not exists
    console.log("Checking for 'tutor_bookmarks' table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tutor_bookmarks (
        bookmark_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    // Create vector_embeddings table if not exists
    console.log("Checking for 'vector_embeddings' table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vector_embeddings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content_id INT NOT NULL,
        content_type VARCHAR(50) NOT NULL,
        text_content TEXT NOT NULL,
        embedding TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error.message);
  }
};

module.exports = runMigrations;
