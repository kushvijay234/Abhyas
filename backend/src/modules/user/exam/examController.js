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

// Start Exam
const startExam = async(req, res) => {
    try {
        const user_id = req.user.user_id;
        const { exam_id } = req.params;
        const result = await ExamService.startExam(user_id, exam_id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};


module.exports = {
    getExams,
    startExam,
};