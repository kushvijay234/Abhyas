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



module.exports = {
    createExam,
};