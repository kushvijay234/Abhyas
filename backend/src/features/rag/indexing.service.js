const db = require("../../config/db");
const VectorDB = require("../../config/vectorDB");
const EmbeddingService = require("./embedding.service");

const IndexingService = {
  /**
   * Re-indexes all database courses, exams, and questions into vector embeddings.
   */
  runIndexing: async () => {
    console.log("Starting semantic indexing process for RAG search...");
    let indexCount = 0;

    try {
      // 1. Index Courses
      const [courses] = await db.execute(
        "SELECT course_id, title, description FROM courses WHERE status = 'active'"
      );
      for (const course of courses) {
        const text = `Course: ${course.title}. Description: ${course.description || "No description available"}.`;
        const embedding = await EmbeddingService.generateEmbedding(text);
        await VectorDB.saveEmbedding(course.course_id, "course", text, embedding);
        indexCount++;
      }

      // 2. Index Exams
      const [exams] = await db.execute(
        "SELECT exam_id, title, description, instructions FROM exams WHERE is_published = 1"
      );
      for (const exam of exams) {
        const text = `Assessment Exam: ${exam.title}. Details: ${exam.description || ""}. Instructions: ${exam.instructions || ""}.`;
        const embedding = await EmbeddingService.generateEmbedding(text);
        await VectorDB.saveEmbedding(exam.exam_id, "exam", text, embedding);
        indexCount++;
      }

      // 3. Index Questions
      const [questions] = await db.execute(
        "SELECT question_id, question_text, option_a, option_b, option_c, option_d, explanation FROM questions"
      );
      for (const q of questions) {
        const text = `Practice Question: ${q.question_text}. Options: A) ${q.option_a}, B) ${q.option_b}, C) ${q.option_c}, D) ${q.option_d}. Answer Explanation: ${q.explanation || "No explanation provided"}.`;
        const embedding = await EmbeddingService.generateEmbedding(text);
        await VectorDB.saveEmbedding(q.question_id, "question", text, embedding);
        indexCount++;
      }

      console.log(`Semantic indexing completed! Created/updated ${indexCount} vector records.`);
      return { success: true, count: indexCount };
    } catch (error) {
      console.error("Error during semantic indexing execution:", error.message);
      return { success: false, error: error.message };
    }
  }
};

module.exports = IndexingService;
