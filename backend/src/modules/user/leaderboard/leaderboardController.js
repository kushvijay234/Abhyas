const LeaderboardService = require("./leaderboardService");

// Global Ranking  
const getGlobal = async(req, res) => {
    try {
        const { limit } = req.query;
        const result = await LeaderboardService.getGlobal(limit);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Ranking for a Specific Exam  
const getByExam = async(req, res) => {
    try {
        const { exam_id } = req.params;
        const { limit } = req.query;
        const result = await LeaderboardService.getByExam(exam_id, limit);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
    getGlobal,
    getByExam,
};