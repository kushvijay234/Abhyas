const IndexingService = require("../features/rag/indexing.service");

/**
 * Initializes a simulated cron interval to sync vector database embeddings
 * with new and edited courses, exams, or questions periodically.
 */
const setupEmbeddingsSync = () => {
  console.log("Embeddings Sync Cron initialized (scheduled for every 12 hours).");

  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
  
  setInterval(async () => {
    console.log("Cron execution: Re-syncing database embeddings into VectorDB...");
    try {
      const result = await IndexingService.runIndexing();
      if (result && result.success) {
        console.log(`Cron execution: Successfully indexed ${result.count} total items.`);
      } else {
        console.warn("Cron execution: Semantic indexing finished with errors.");
      }
    } catch (err) {
      console.error("Cron execution: Failed to sync vector embeddings:", err.message);
    }
  }, TWELVE_HOURS_MS);
};

module.exports = { setupEmbeddingsSync };
