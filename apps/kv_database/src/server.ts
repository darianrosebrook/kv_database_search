#!/usr/bin/env tsx

/**
 * Obsidian RAG API Server - Entry Point
 *
 * Fastify-based API server implementing the OpenAPI specification for
 * semantic search and knowledge graph functionality.
 *
 * @author @darianrosebrook
 */

// Import and run the server initialization logic
import { startMainServer } from "./server/index.js";

// Start the server
startMainServer().catch(console.error);
