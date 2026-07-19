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

// Bulk Insert Questions
const bulkInsertQuestions = async (questions) => {
  const values = questions.map((q) => [
    q.exam_id,
    q.question_text,
    q.option_a,
    q.option_b,
    q.option_c,
    q.option_d,
    q.correct_option,
    q.marks || 1,
    q.explanation || null,
  ]);

  const [result] = await pool.query(
    `INSERT INTO questions
       (exam_id, question_text, option_a, option_b, option_c, option_d,
        correct_option, marks, explanation)
     VALUES ?`,
    [values]
  );

  return result;
};


// Update Question
const updateQuestion = async (question_id, questionData) => {
  const {
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_option,
    marks,
    explanation,
  } = questionData;

  const [result] = await pool.execute(
    `UPDATE questions
     SET question_text = ?, option_a = ?, option_b = ?, option_c = ?,
         option_d = ?, correct_option = ?, marks = ?, explanation = ?
     WHERE question_id = ?`,
    [question_text, option_a, option_b, option_c, option_d, correct_option, marks, explanation, question_id]
  );

  return result;
};

// Delete Question
const deleteQuestion = async (question_id) => {
  const [result] = await pool.execute(
    `DELETE FROM questions WHERE question_id = ?`,
    [question_id]
  );

  return result;
};

// Find Question By ID
const findQuestionById = async (question_id) => {
  const [rows] = await pool.execute(
    `SELECT * FROM questions WHERE question_id = ?`,
    [question_id]
  );

  return rows[0];
};

// Assign Questions to Exam
const assignQuestionsToExam = async (exam_id, question_ids) => {
  const placeholders = question_ids.map(() => "?").join(", ");

  const [result] = await pool.execute(
    `UPDATE questions SET exam_id = ? WHERE question_id IN (${placeholders})`,
    [exam_id, ...question_ids]
  );

  return result;
};

module.exports = {
  addQuestion,
  bulkInsertQuestions,
  updateQuestion,
  deleteQuestion,
  findQuestionById,
  assignQuestionsToExam,
};
