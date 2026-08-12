const VectorDB = require("../../config/vectorDB");
const EmbeddingService = require("./embedding.service");

const RetrievalService = {
  /**
   * Retrieves top-K semantically relevant database chunks matching a query.
   */
  retrieveContext: async (query, limit = 4) => {
    try {
      if (!query || typeof query !== "string") {
        return [];
      }
      
      const queryEmbedding = await EmbeddingService.generateEmbedding(query);
      const matches = await VectorDB.searchSimilar(queryEmbedding, limit);
      
      return matches;
    } catch (err) {
      console.error("Failed to retrieve context vectors for query:", err.message);
      return [];
    }
  }
};

module.exports = RetrievalService;
