const db = require("../../../config/db");

const QuestionModel = {
  // Fetch questions for an exam (excludes correct_option — shown during attempt)
  getQuestionsByExam: async (exam_id) => {
    const [rows] = await db.execute(
      `SELECT q.question_id, q.question_text,
              q.option_a, q.option_b, q.option_c, q.option_d,
              q.marks, eq.order_no
       FROM questions q
       JOIN exam_questions eq ON q.question_id = eq.question_id
       WHERE eq.exam_id = ?
       ORDER BY eq.order_no ASC`,
      [exam_id]
    );
    return rows;
  },

  // Used internally by exam service to calculate score
  getQuestionsWithAnswers: async (exam_id) => {
    const [rows] = await db.execute(
      `SELECT q.question_id, q.correct_option, q.marks
       FROM questions q
       JOIN exam_questions eq ON q.question_id = eq.question_id
       WHERE eq.exam_id = ?`,
      [exam_id]
    );
    return rows;
  },

  // Save / update a single answer (upsert)
  saveAnswer: async (attempt_id, question_id, selected_option) => {
    const [result] = await db.execute(
      `INSERT INTO attempt_answers (attempt_id, question_id, selected_option)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE selected_option = VALUES(selected_option)`,
      [attempt_id, question_id, selected_option]
    );
    return result;
  },

  // Mark / unmark a question for review
  markForReview: async (attempt_id, question_id, is_marked) => {
    const [result] = await db.execute(
      `INSERT INTO attempt_answers (attempt_id, question_id, is_marked)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_marked = VALUES(is_marked)`,
      [attempt_id, question_id, is_marked]
    );
    return result;
  },

  // Get answer status for all questions in an attempt
  getAnswerStatus: async (attempt_id) => {
    const [rows] = await db.execute(
      `SELECT question_id, selected_option, is_marked
       FROM attempt_answers
       WHERE attempt_id = ?`,
      [attempt_id]
    );
    return rows;
  },
};

module.exports = QuestionModel;
