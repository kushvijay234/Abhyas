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

// Get Exam By ID
const getExamById = async(req, res) => {
    try {
        const { id } = req.params;
        const result = await ExamService.getExamById(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};

// Update Exam
const updateExam = async(req, res) => {
    try {
        const { id } = req.params;
        const result = await ExamService.updateExam(id, req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// Delete Exam
const deleteExam = async(req, res) => {
    try {
        const { id } = req.params;
        const result = await ExamService.deleteExam(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};

// Publish / Unpublish Exam
const togglePublish = async(req, res) => {
    try {
        const { id } = req.params;
        const result = await ExamService.togglePublish(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

// Set Exam Duration & Rules
const setExamSettings = async(req, res) => {
    try {
        const { id } = req.params;
        const result = await ExamService.setExamSettings(id, req.body);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createExam,
    getAllExams,
    getExamById,
    updateExam,
    deleteExam,
    togglePublish,
    setExamSettings,
};