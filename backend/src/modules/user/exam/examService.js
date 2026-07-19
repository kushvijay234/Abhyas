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

module.exports = {
    getExams,
};