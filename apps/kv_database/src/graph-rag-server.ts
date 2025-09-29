/**
 * Graph RAG API Server - Microservice Entry Point
 *
 * Bootstraps the Graph RAG microservice using dependency injection
 * and shared utilities for clean, maintainable code.
 */

import { createGraphRagServer } from "./graph-rag-server/index.js";

/**
 * Start the Graph RAG microservice
 */
async function startServer() {
  try {
    await createGraphRagServer();
  } catch (error) {
    console.error("❌ Failed to start Graph RAG server:", error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer().catch(console.error);
}
