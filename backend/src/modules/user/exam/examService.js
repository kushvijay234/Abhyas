const ExamModel = require("./examModel");
const QuestionModel = require("../question/questionModel");

// Get All Published Exams
const getExams = async(search, course_id) => {
    const data = await ExamModel.getPublishedExams(search, course_id);
    return {
        success: true,
        count: data.length,
        data,
    };
};

// Start Exam — creates a new attempt (or resumes in-progress)
const startExam = async(user_id, exam_id) => {
    const exam = await ExamModel.findById(exam_id);
    if (!exam) throw new Error("Exam not found or not published");

    // Resume existing in-progress attempt
    const existing = await ExamModel.findActiveAttempt(user_id, exam_id);
    if (existing) {
        return {
            success: true,
            message: "Resuming in-progress exam",
            attempt_id: existing.attempt_id,
            exam,
        };
    }

    const result = await ExamModel.createAttempt(user_id, exam_id);
    return {
        success: true,
        message: "Exam started successfully",
        attempt_id: result.insertId,
        exam,
    };
};

module.exports = {
    getExams,
    startExam,
};