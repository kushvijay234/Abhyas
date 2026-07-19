const ExamService = require("./examService");

// Create Exam
const createExam = async(req, res) => {
    try {
        const result = await ExamService.createExam(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// Get All Exams
const getAllExams = async(req, res) => {
    try {
        const { search, is_published } = req.query;
        const result = await ExamService.getAllExams(search, is_published);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
module.exports = {
    createExam,
    getAllExams,
};