const db = require("./db");

const dotProduct = (vecA, vecB) => {
  let sum = 0;
  const len = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < len; i++) {
    sum += vecA[i] * vecB[i];
  }
  return sum;
};

const magnitude = (vec) => {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) {
    sum += vec[i] * vec[i];
  }
  return Math.sqrt(sum);
};

const cosineSimilarity = (vecA, vecB) => {
  const magA = magnitude(vecA);
  const magB = magnitude(vecB);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(vecA, vecB) / (magA * magB);
};

const VectorDB = {
  /**
   * Inserts or updates an embedding for a specific content piece.
   */
  saveEmbedding: async (contentId, contentType, textContent, embedding) => {
    // Delete existing entry if any
    await db.execute(
      "DELETE FROM vector_embeddings WHERE content_id = ? AND content_type = ?",
      [contentId, contentType]
    );

    // Insert new embedding vector
    const embeddingStr = JSON.stringify(embedding);
    await db.execute(
      "INSERT INTO vector_embeddings (content_id, content_type, text_content, embedding) VALUES (?, ?, ?, ?)",
      [contentId, contentType, textContent, embeddingStr]
    );
  },

  /**
   * Retrieves all embeddings, calculates cosine similarity with the query vector in JS,
   * and returns top matches.
   */
  searchSimilar: async (queryEmbedding, limit = 5) => {
    const [rows] = await db.execute(
      "SELECT content_id, content_type, text_content, embedding FROM vector_embeddings"
    );

    const matches = rows.map((row) => {
      let vec;
      try {
        vec = JSON.parse(row.embedding);
      } catch (err) {
        vec = [];
      }

      const score = cosineSimilarity(queryEmbedding, vec);
      return {
        content_id: row.content_id,
        content_type: row.content_type,
        text_content: row.text_content,
        score: score,
      };
    });

    // Sort by descending similarity score and filter out zero scores
    return matches
      .filter((m) => m.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },
};

module.exports = VectorDB;
