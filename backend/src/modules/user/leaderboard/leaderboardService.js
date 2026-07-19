const LeaderboardModel = require("./leaderboardModel");

const getGlobal = async(limit) => {
    const parsedLimit = Math.min(parseInt(limit) || 10, 100); // cap at 100
    const data = await LeaderboardModel.getGlobal(parsedLimit);

    // Map SQL output keys to frontend expected properties
    const mapped = data.map(item => ({
        ...item,
        completed_exams: item.total_attempts,
        avg_percentage: item.avg_score
    }));

    return {
        success: true,
        count: mapped.length,
        data: mapped,
    };
};

module.exports = {
    getGlobal,
};