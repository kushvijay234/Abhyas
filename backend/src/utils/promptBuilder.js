const PromptBuilder = {
  /**
   * Generates the system instructions specifying constraints, response schema, and personality.
   */
  getSystemInstruction: () => {
    return `You are ABHYAS AI Tutor, a premium educational SaaS learning engine for Computer Science exams.
Your objective is to provide high-quality tutoring.
You must return your output strictly in JSON format. Do not wrap the JSON in markdown code blocks (e.g. do not use \`\`\`json).
Your response must strictly match this JSON schema:
{
  "text": "The primary response text in conversational tone.",
  "confidence": "Estimation score (e.g., '98%').",
  "sources": ["Specify exact academic or standard references used"],
  "difficulty": "Question difficulty level ('Easy', 'Medium', 'Hard').",
  "studyTime": "Suggested revision duration (e.g., '15 mins').",
  "language": "ISO code (e.g., 'en').",
  "structuredData": {
    "answer": "Direct concise answer summary.",
    "explanation": "Detailed pedagogical explanation with Markdown highlights.",
    "example": "Practical code snippet, query example or Gantt chart diagram.",
    "keyPoints": ["3-5 vital summary bullet points for revisions"],
    "formula": "Mathematical equations or rules in LaTeX format (e.g., 'T(n) = O(log n)')",
    "relatedConcepts": ["3 related topics to explore further"]
  }
}`;
  },

  /**
   * Constructs the final user prompt incorporating retrieved database context,
   * student recommendations, chat history, and the new query.
   */
  buildPrompt: (query, ragMatches = [], recommendations = {}, chatHistory = []) => {
    // 1. Format Chat History
    const formattedHistory = chatHistory
      .map((msg) => `${msg.sender.toUpperCase()}: ${msg.text}`)
      .join("\n");

    // 2. Format RAG Context Chunks
    const formattedRag = ragMatches
      .map((match, i) => `[Context ${i + 1}] Source Type: ${match.content_type}. Content: ${match.text_content}`)
      .join("\n\n");

    // 3. Format Recommendations
    const courseRecs = (recommendations.courses || [])
      .map((c) => `- Course: ${c.title} (Duration: ${c.duration || "N/A"}, Subject: ${c.category_name})`)
      .join("\n");

    const examRecs = (recommendations.exams || [])
      .map((e) => `- Practice Exam: ${e.title} (${e.duration_minutes} mins, Course: ${e.course_name})`)
      .join("\n");

    const formattedRecs = `
Recommended Enrollments for this Student:
${courseRecs || "- No unenrolled courses available."}

Recommended Exams for this Student:
${examRecs || "- No remaining practice exams available."}
`;

    // 4. Combine everything
    return `
=== STUDY PLATFORM CONTEXT ===
${formattedRag ? formattedRag : "No context matches found in the study database."}

=== STUDENT RECOMMENDATION DATA ===
${formattedRecs}

=== CONVERSATION HISTORY ===
${formattedHistory ? formattedHistory : "No previous conversation history."}

=== CURRENT USER QUERY ===
USER: ${query}

Provide your response in the requested JSON structure. If the user asks about non-technical topics or requests general chats, maintain your helpful CS tutor persona and guide them back to exam prep topics.
`;
  },
};

module.exports = PromptBuilder;
