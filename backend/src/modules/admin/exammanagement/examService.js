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




module.exports = {
    createExam,
    getAllExams,
};