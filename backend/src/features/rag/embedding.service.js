const GeminiConfig = require("../../config/gemini");

const EmbeddingService = {
  /**
   * Generates a numerical vector embedding for a given text chunk
   */
  generateEmbedding: async (text) => {
    if (!text || typeof text !== "string") {
      throw new Error("Text parameter must be a non-empty string");
    }
    return await GeminiConfig.getEmbedding(text);
  }
};

module.exports = EmbeddingService;
