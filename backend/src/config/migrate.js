const fs = require("fs");
const path = require("path");

const executeSqlFile = async (connection, sqlText) => {
  const lines = sqlText.split(/\r?\n/);
  let cleanSql = "";
  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("--") || trimmed.startsWith("#") || trimmed === "") {
      continue;
    }
    const commentIdx = line.indexOf("--");
    if (commentIdx !== -1) {
      line = line.substring(0, commentIdx);
    }
    cleanSql += line + "\n";
  }

  const statements = cleanSql
    .split(";")
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  for (const statement of statements) {
    const upperStmt = statement.toUpperCase();
    if (upperStmt.startsWith("USE ") || upperStmt.startsWith("CREATE DATABASE ")) {
      continue;
    }
    
    try {
      await connection.query(statement);
    } catch (err) {
      if (!upperStmt.startsWith("DROP ")) {
        console.error(`Error executing statement: ${statement.substring(0, 100)}...`);
        console.error(`Reason: ${err.message}`);
        throw err;
      }
    }
  }
};

const runMigrations = async (connection) => {
  try {
    console.log("Running database migrations...");

    // Check if the 'users' table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'users'");
    const usersTableExists = tables.length > 0;

    if (!usersTableExists) {
      console.log("Database tables do not exist. Initializing schema...");
      
      const schemaPaths = [
        path.join(__dirname, "schema.sql"),
        path.join(__dirname, "../schema.sql"),
        path.join(__dirname, "../../schema.sql"),
        path.join(__dirname, "../../../schema.sql")
      ];
      
      let schemaSql = "";
      for (const p of schemaPaths) {
        if (fs.existsSync(p)) {
          console.log(`Found schema.sql at: ${p}`);
          schemaSql = fs.readFileSync(p, "utf8");
          break;
        }
      }
      
      if (schemaSql) {
        await executeSqlFile(connection, schemaSql);
        console.log("Database schema initialized successfully.");
        
        const seedPaths = [
          path.join(__dirname, "seed.sql"),
          path.join(__dirname, "../seed.sql"),
          path.join(__dirname, "../../seed.sql"),
          path.join(__dirname, "../../../seed.sql")
        ];
        
        let seedSql = "";
        for (const p of seedPaths) {
          if (fs.existsSync(p)) {
            console.log(`Found seed.sql at: ${p}`);
            seedSql = fs.readFileSync(p, "utf8");
            break;
          }
        }
        
        if (seedSql) {
          console.log("Seeding initial database data...");
          await executeSqlFile(connection, seedSql);
          console.log("Database seeded successfully.");
        } else {
          console.log("Warning: seed.sql not found. Skipping seeding.");
        }
      } else {
        throw new Error("schema.sql not found! Cannot initialize database schema.");
      }
    }

    // Retrieve columns from the users table to run any dynamic migrations
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

    // Course curriculum tables are required by both student and admin course APIs.
    await connection.query(`
      CREATE TABLE IF NOT EXISTS course_sections (
        section_id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        sort_order INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(course_id)
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS curriculum_items (
        curriculum_item_id INT AUTO_INCREMENT PRIMARY KEY,
        section_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        type ENUM('article', 'video', 'exam') NOT NULL DEFAULT 'article',
        duration VARCHAR(50) DEFAULT NULL,
        video_url VARCHAR(500) DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        exam_id INT DEFAULT NULL,
        sort_order INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES course_sections(section_id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (exam_id) REFERENCES exams(exam_id)
          ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);

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
