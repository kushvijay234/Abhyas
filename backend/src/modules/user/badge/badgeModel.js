const db = require("../../../config/db");

const BadgeModel = {
  // Get all earned badges for a specific user
  findBadgesByUser: async (user_id) => {
    const [rows] = await db.execute(
      `SELECT badge_type, earned_at 
       FROM user_badges 
       WHERE user_id = ? 
       ORDER BY earned_at DESC`,
      [user_id]
    );
    return rows;
  },

  // Award a badge to a user (ignore duplicates)
  awardBadge: async (user_id, badge_type) => {
    const [result] = await db.execute(
      `INSERT IGNORE INTO user_badges (user_id, badge_type) 
       VALUES (?, ?)`,
      [user_id, badge_type]
    );
    return result;
  },

  // Revoke/remove a badge from a user
  revokeBadge: async (user_id, badge_type) => {
    const [result] = await db.execute(
      `DELETE FROM user_badges 
       WHERE user_id = ? AND badge_type = ?`,
      [user_id, badge_type]
    );
    return result;
  },

  // Get metrics for badge calculations
  getUserStatsForBadges: async (user_id) => {
    // 1. Count completed exams
    const [[{ total_completed }]] = await db.execute(
      `SELECT COUNT(*) AS total_completed 
       FROM exam_attempts 
       WHERE user_id = ? AND status = 'completed'`,
      [user_id]
    );

    // 2. Count perfect score (100%) attempts
    const [[{ perfect_attempts }]] = await db.execute(
      `SELECT COUNT(*) AS perfect_attempts 
       FROM exam_attempts 
       WHERE user_id = ? AND status = 'completed' AND percentage = 100`,
      [user_id]
    );

    // 3. Count 90%+ scores in DBMS/SQL quizzes
    const [[{ sql_guru_attempts }]] = await db.execute(
      `SELECT COUNT(*) AS sql_guru_attempts 
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       WHERE ea.user_id = ? 
         AND ea.status = 'completed' 
         AND ea.percentage >= 90
         AND (e.title LIKE '%dbms%' OR e.title LIKE '%sql%' OR e.title LIKE '%database%')`,
      [user_id]
    );

    return {
      total_completed,
      perfect_attempts,
      sql_guru_attempts,
    };
  },
};

module.exports = BadgeModel;
