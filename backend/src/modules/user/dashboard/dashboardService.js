const DashboardModel = require("./dashboardModel");

const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Dashboard Summary Stats
const getSummary = async (user_id) => {
  const data = await DashboardModel.getSummary(user_id);
  const attemptDates = await DashboardModel.getAttemptDates(user_id);
  const courseProgress = await DashboardModel.getCourseProgress(user_id);

  // Calculate consecutive days streak
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

  const summaryData = {
    ...data,
    streak,
    attempt_dates: attemptDates,
    course_progress: courseProgress,
  };

  return {
    success: true,
    data: summaryData,
  };
};