/**
 * Shared Utilities Module
 *
 * Common utilities, factories, and services used across multiple
 * microservices in the knowledge graph search system.
 */

export * from "./config.js";
export * from "./logger.js";
export * from "./dependency-container.js";
export * from "./database-factory.js";
export * from "./graph-rag-factory.js";
export * from "./graph-rag-client.js";

// Re-export commonly used types
export type {
  DatabaseConfig,
  EmbeddingConfig,
  GraphRagConfig,
  MainServerConfig,
  AppConfig,
} from "./config.js";

export type { Logger } from "./logger.js";

export type {
  ServiceFactory,
  AsyncServiceFactory,
} from "./dependency-container.js";

export type { DatabaseServices } from "./database-factory.js";

export type { GraphRagServices } from "./graph-rag-factory.js";

export type {
  GraphRagSearchRequest,
  GraphRagSearchResponse,
} from "./graph-rag-client.js";
