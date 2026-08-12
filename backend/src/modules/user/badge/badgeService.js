const BadgeModel = require("./badgeModel");
const DashboardModel = require("../dashboard/dashboardModel");

const ALL_BADGES = {
  streak_master: {
    badge_type: "streak_master",
    title: "Streak Master",
    description: "Earned for a 5+ day streak",
    icon: "🔥",
    color: "#F47920",
  },
  exam_ace: {
    badge_type: "exam_ace",
    title: "Exam Ace",
    description: "Scored 100% on any exam attempt",
    icon: "🏅",
    color: "#16A34A",
  },
  consistent_learner: {
    badge_type: "consistent_learner",
    title: "Consistent Learner",
    description: "Completed 5+ exam attempts",
    icon: "📚",
    color: "#0284C7",
  },
  sql_guru: {
    badge_type: "sql_guru",
    title: "SQL Guru",
    description: "Scored 90%+ on any DBMS/SQL assessment",
    icon: "🐳",
    color: "#1A2D6B",
  },
  custom_badge: {
    badge_type: "custom_badge",
    title: "Custom Achievement",
    description: "Awarded manually by administrators",
    icon: "🏆",
    color: "#D97706",
  }
};

const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Calculate streak count
const calculateStreak = (attemptDates) => {
  let streak = 0;
  if (attemptDates.length > 0) {
    const todayStr = getLocalDateString(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    const mostRecentDate = attemptDates[0];
    if (mostRecentDate === todayStr || mostRecentDate === yesterdayStr) {
      streak = 1;
      let checkDate = new Date(mostRecentDate);

      for (let i = 1; i < attemptDates.length; i++) {
        const nextExpectedDate = new Date(checkDate);
        nextExpectedDate.setDate(nextExpectedDate.getDate() - 1);
        const nextExpectedStr = getLocalDateString(nextExpectedDate);

        if (attemptDates[i] === nextExpectedStr) {
          streak++;
          checkDate = nextExpectedDate;
        } else if (attemptDates[i] === getLocalDateString(checkDate)) {
          continue;
        } else {
          break;
        }
      }
    }
  }
  return streak;
};

const badgeService = {
  // Check student stats and automatically award qualifying badges
  checkAndAwardBadges: async (user_id) => {
    try {
      // 1. Check Streak
      const attemptDates = await DashboardModel.getAttemptDates(user_id);
      const streak = calculateStreak(attemptDates);
      if (streak >= 5) {
        await BadgeModel.awardBadge(user_id, "streak_master");
      }

      // 2. Check exam metrics
      const stats = await BadgeModel.getUserStatsForBadges(user_id);
      
      if (stats.total_completed >= 5) {
        await BadgeModel.awardBadge(user_id, "consistent_learner");
      }
      if (stats.perfect_attempts > 0) {
        await BadgeModel.awardBadge(user_id, "exam_ace");
      }
      if (stats.sql_guru_attempts > 0) {
        await BadgeModel.awardBadge(user_id, "sql_guru");
      }
    } catch (error) {
      console.error(`Error auto-awarding badges for user ${user_id}:`, error.message);
    }
  },

  // Get all badges with their earned state for a student
  getUserBadges: async (user_id) => {
    // Refresh automated achievements first
    await badgeService.checkAndAwardBadges(user_id);

    // Retrieve earned badges
    const earnedList = await BadgeModel.findBadgesByUser(user_id);
    const earnedTypes = earnedList.map(b => b.badge_type);

    // Combine metadata list with user earned status
    const badgesWithStatus = Object.keys(ALL_BADGES).map(key => {
      const isEarned = earnedTypes.includes(key);
      const earnedInfo = earnedList.find(b => b.badge_type === key);
      return {
        ...ALL_BADGES[key],
        isEarned,
        earned_at: isEarned ? earnedInfo.earned_at : null
      };
    });

    return badgesWithStatus;
  },

  // Admin manually awards a badge
  adminAwardBadge: async (user_id, badge_type) => {
    if (!ALL_BADGES[badge_type]) {
      throw new Error("Invalid badge type");
    }
    await BadgeModel.awardBadge(user_id, badge_type);
    return { success: true, message: `Badge ${ALL_BADGES[badge_type].title} awarded successfully.` };
  },

  // Admin manually revokes a badge
  adminRevokeBadge: async (user_id, badge_type) => {
    await BadgeModel.revokeBadge(user_id, badge_type);
    return { success: true, message: "Badge revoked successfully." };
  }
};

module.exports = badgeService;
