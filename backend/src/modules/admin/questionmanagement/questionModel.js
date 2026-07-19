const pool = require("../../../config/db");

// Add Single Question
const addQuestion = async (questionData) => {
  const {
    exam_id,
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_option,
    marks = 1,
    explanation = null,
  } = questionData;

  const [result] = await pool.execute(
    `INSERT INTO questions
       (exam_id, question_text, option_a, option_b, option_c, option_d,
        correct_option, marks, explanation)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, explanation]
  );

  return result;
};

