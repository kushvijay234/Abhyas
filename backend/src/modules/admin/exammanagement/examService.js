const ExamModel = require("./examModel");

// Create Exam
const createExam = async(examData) => {
    if (!examData.title || examData.title.trim() === "") {
        throw new Error("Exam title is required");
    }

    const result = await ExamModel.createExam(examData);

    if (!result.insertId) {
        throw new Error("Failed to create exam");
    }

    return {
        success: true,
        message: "Exam created successfully",
        data: { exam_id: result.insertId },
    };
};

// Get All Exams
const getAllExams = async(search, is_published) => {
    const exams = await ExamModel.getAllExams(search, is_published);

    return {
        success: true,
        count: exams.length,
        data: exams,
    };
};

// Get Exam By ID
const getExamById = async(exam_id) => {
    const exam = await ExamModel.getExamById(exam_id);

    if (!exam) {
        throw new Error("Exam not found");
    }

    return {
        success: true,
        data: exam,
    };
};

// Update Exam
const updateExam = async(exam_id, examData) => {
    const existing = await ExamModel.getExamById(exam_id);

    if (!existing) {
        throw new Error("Exam not found");
    }

    const result = await ExamModel.updateExam(exam_id, examData);

    if (result.affectedRows === 0) {
        throw new Error("Exam update failed");
    }

    return {
        success: true,
        message: "Exam updated successfully",
    };
};

module.exports = {
    createExam,
    getAllExams,
    getExamById,
    updateExam,
};