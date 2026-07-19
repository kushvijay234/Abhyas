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

// Delete Exam
const deleteExam = async(exam_id) => {
    const existing = await ExamModel.getExamById(exam_id);

    if (!existing) {
        throw new Error("Exam not found");
    }

    const result = await ExamModel.deleteExam(exam_id);

    if (result.affectedRows === 0) {
        throw new Error("Exam deletion failed");
    }

    return {
        success: true,
        message: "Exam deleted successfully",
    };
};

// Publish / Unpublish Exam (toggle)
const togglePublish = async(exam_id) => {
    const existing = await ExamModel.getExamById(exam_id);

    if (!existing) {
        throw new Error("Exam not found");
    }

    const newStatus = !existing.is_published;
    const result = await ExamModel.togglePublish(exam_id, newStatus);

    if (result.affectedRows === 0) {
        throw new Error("Failed to update publish status");
    }

    return {
        success: true,
        message: `Exam ${newStatus ? "published" : "unpublished"} successfully`,
        data: { is_published: newStatus },
    };
};

// Set Exam Duration & Rules
const setExamSettings = async(exam_id, settings) => {
    const existing = await ExamModel.getExamById(exam_id);

    if (!existing) {
        throw new Error("Exam not found");
    }

    if (!settings.duration_minutes || Number(settings.duration_minutes) <= 0) {
        throw new Error("A valid duration (in minutes) is required");
    }

    const result = await ExamModel.setExamSettings(exam_id, settings);

    if (result.affectedRows === 0) {
        throw new Error("Failed to update exam settings");
    }

    return {
        success: true,
        message: "Exam duration and rules updated successfully",
    };
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