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

// Submit Exam — auto-grades based on correct_option
const submitExam = async(user_id, attempt_id, answers) => {
    if (!Array.isArray(answers)) throw new Error("answers must be an array");

    const attempt = await ExamModel.getAttemptById(attempt_id, user_id);
    if (!attempt) throw new Error("Attempt not found");
    if (attempt.status === "completed") throw new Error("Exam already submitted");

    // Fetch questions with correct answers for grading
    const questions = await QuestionModel.getQuestionsWithAnswers(attempt.exam_id);

    let score = 0;
    let total_marks = 0;

    questions.forEach((q) => {
        total_marks += q.marks || 1;
        const userAnswer = answers.find((a) => a.question_id === q.question_id);
        if (userAnswer && userAnswer.selected_option === q.correct_option) {
            score += q.marks || 1;
        }
    });

    const percentage =
        total_marks > 0 ? parseFloat(((score / total_marks) * 100).toFixed(2)) : 0;

    await ExamModel.submitAttempt(attempt_id, score, total_marks, percentage);

    const passed = percentage >= (attempt.passing_marks || 0);

    return {
        success: true,
        message: "Exam submitted successfully",
        data: {
            attempt_id,
            score,
            total_marks,
            percentage,
            passed,
        },
    };
};

// View Result for a specific attempt
const viewResult = async(user_id, attempt_id) => {
    const result = await ExamModel.getAttemptById(attempt_id, user_id);
    if (!result) throw new Error("Result not found");
    if (result.status !== "completed") throw new Error("Exam not yet submitted");
    return {
        success: true,
        data: result,
    };
};

module.exports = {
    getExams,
    startExam,
    submitExam,
    viewResult,
};