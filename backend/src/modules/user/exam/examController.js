const ExamService = require("./examService");

// Get All Published Exams  
const getExams = async(req, res) => {
    try {
        const { search, course_id } = req.query;
        const result = await ExamService.getExams(search, course_id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


module.exports = {
    getExams,
};