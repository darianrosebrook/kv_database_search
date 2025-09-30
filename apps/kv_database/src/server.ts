#!/usr/bin/env tsx

/**
 * Obsidian RAG API Server - Entry Point
 *
 * Fastify-based API server implementing the OpenAPI specification for
 * semantic search and knowledge graph functionality.
 *
 * @author @darianrosebrook
 */

// Import the full bootstrap server
import {
  createServer,
  initializeServer,
  startServer,
} from "./server/bootstrap";

async function main() {
  try {
    const server = await createServer();
    await initializeServer(server);
    await startServer(server);
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);
