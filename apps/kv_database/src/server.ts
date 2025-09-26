#!/usr/bin/env tsx

/**
 * Obsidian RAG API Server
 *
 * Fastify-based API server implementing the OpenAPI specification for
 * semantic search and knowledge graph functionality.
 *
 * @author @darianrosebrook
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import { config as dotenvConfig } from "dotenv";
import ollama from "ollama";
import * as fs from "fs";
import * as path from "path";
import WebSocket from "ws";
import { WebSocketServer } from "ws";
import { ObsidianDatabase } from "./lib/database";
import { ObsidianEmbeddingService } from "./lib/embeddings";
import { ObsidianSearchService } from "./lib/obsidian-search";
import { ObsidianIngestionPipeline } from "./lib/obsidian-ingest";
import { WebSearchService } from "./lib/web-search";
import { ContextManager } from "./lib/context-manager";
import { DictionaryAPI } from "./lib/dictionary-api";
import { MLEntityAPI } from "./lib/ml-entity-api";
import { TemporalReasoningAPI } from "./lib/temporal-reasoning-api";
import { FederatedSearchAPI } from "./lib/federated-search-api";
import { WorkspaceAPI } from "./lib/workspace-api";
import { ChatSession } from "./types/index";
import type {
  HealthResponse,
  SearchRequest,
  SearchResponse,
  IngestRequest,
  IngestResponse,
  GraphResponse,
  StatsResponse,
} from "./types/index";

// Chat-related types
interface ChatRequest {
  message: string;
  model?: string;
  context?: Array<{ role: string; content: string }>;
  searchResults?: Array<any>;
  originalQuery?: string;
  searchMetadata?: {
    totalResults: number;
    searchTime: number;
    filters?: any;
  };
}

interface ChatResponse {
  response: string;
  context: Array<{ role: string; content: string }>;
  suggestedActions?: Array<{
    type: "refine_search" | "new_search" | "filter" | "explore";
    label: string;
    query?: string;
    filters?: any;
  }>;
  timestamp: string;
  model?: string;
}

interface ModelsResponse {
  models: Array<{
    name: string;
    size: number;
    modified_at: string;
    details?: {
      format?: string;
      family?: string;
      parameter_size?: string;
      quantization_level?: string;
    };
  }>;
  error?: string;
}

interface ServerChatSession {
  id: string;
  title: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
    model?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  model?: string;
  messageCount: number;
}

interface ChatHistoryResponse {
  sessions: ServerChatSession[];
  error?: string;
}

interface SaveChatRequest {
  title?: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
    model?: string;
  }>;
  model?: string;
}

interface WebSearchRequest {
  query: string;
  maxResults?: number;
  includeSnippets?: boolean;
  minRelevanceScore?: number;
  sources?: string[];
  timeRange?: "day" | "week" | "month" | "year" | "all";
  context?: string[]; // Additional context for better search
}

interface WebSearchResponse {
  query: string;
  results: Array<{
    title: string;
    url: string;
    snippet: string;
    publishedDate?: string;
    source: string;
    relevanceScore: number;
  }>;
  totalFound: number;
  searchTime: number;
  error?: string;
}

// Load environment variables
dotenvConfig();

const DEFAULT_PORT = parseInt(process.env.PORT || "3001");
const HOST = process.env.HOST || "0.0.0.0";
const DATABASE_URL = process.env.DATABASE_URL;
const MAX_PORT_ATTEMPTS = 10; // Maximum number of ports to try

/**
 * Find an available port starting from the default port
 */
async function findAvailablePort(startPort: number): Promise<number> {
  const net = await import("net");

  for (let port = startPort; port < startPort + MAX_PORT_ATTEMPTS; port++) {
    const isPortAvailable = await new Promise<boolean>((resolve) => {
      const server = net.createServer();

      server.listen(port, HOST, () => {
        server.once("close", () => {
          resolve(true);
        });
        server.close();
      });

      server.on("error", () => {
        resolve(false);
      });
    });

    if (isPortAvailable) {
      console.log(`✅ Port ${port} is available`);
      return port;
    } else {
      console.log(`⚠️  Port ${port} is in use, trying ${port + 1}...`);
    }
  }

  throw new Error(
    `❌ No available ports found in range ${startPort}-${
      startPort + MAX_PORT_ATTEMPTS - 1
    }`
  );
}
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "embeddinggemma";
const EMBEDDING_DIMENSION = parseInt(process.env.EMBEDDING_DIMENSION || "768");
const LLM_MODEL = process.env.LLM_MODEL || "llama3.2:3b";
const OBSIDIAN_VAULT_PATH =
  process.env.OBSIDIAN_VAULT_PATH ||
  "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault";

// Create Fastify server instance
const server = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
    },
  },
});

let database: ObsidianDatabase | null = null;
let embeddingService: ObsidianEmbeddingService | null = null;
let searchService: ObsidianSearchService | null = null;
let ingestionPipeline: ObsidianIngestionPipeline | null = null;
let webSearchService: WebSearchService | null = null;
let contextManager: ContextManager | null = null;
let dictionaryAPI: DictionaryAPI | null = null;
let mlEntityAPI: MLEntityAPI | null = null;
let temporalReasoningAPI: TemporalReasoningAPI | null = null;
let federatedSearchAPI: FederatedSearchAPI | null = null;
let workspaceAPI: WorkspaceAPI | null = null;

/**
 * Initialize all services
 */
async function initializeServices() {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  console.log("🚀 Initializing Obsidian RAG services...");

  // Initialize database with better error handling
  try {
    database = new ObsidianDatabase(DATABASE_URL);
    await database.initialize();
    console.log("✅ Database initialized");
  } catch (error: any) {
    console.error("❌ Database initialization failed:", error.message);
    console.error(
      "💡 Make sure PostgreSQL is running and DATABASE_URL is correct"
    );
    console.error(
      "💡 Example: postgresql://username:password@localhost:5432/obsidian_rag"
    );
    throw error;
  }

  // Initialize embedding service with better error handling
  try {
    embeddingService = new ObsidianEmbeddingService({
      model: EMBEDDING_MODEL,
      dimension: EMBEDDING_DIMENSION,
    });

    const embeddingTest = await embeddingService.testConnection();
    if (!embeddingTest.success) {
      throw new Error("Embedding service connection failed");
    }
    console.log(`✅ Embedding service ready (${embeddingTest.dimension}d)`);
  } catch (error: any) {
    console.error("❌ Embedding service initialization failed:", error.message);
    console.error("💡 Make sure Ollama is running and the model is available");
    console.error("💡 Install Ollama: https://ollama.com");
    console.error("💡 Pull model: ollama pull embeddinggemma");
    throw error;
  }

  // Initialize search service
  try {
    searchService = new ObsidianSearchService(database, embeddingService);
    console.log("✅ Search service initialized");
  } catch (error: any) {
    console.error("❌ Search service initialization failed:", error.message);
    throw error;
  }

  // Initialize ingestion pipeline
  try {
    ingestionPipeline = new ObsidianIngestionPipeline(
      database,
      embeddingService,
      OBSIDIAN_VAULT_PATH
    );
    console.log("✅ Ingestion pipeline initialized");
  } catch (error: any) {
    console.error(
      "❌ Ingestion pipeline initialization failed:",
      error.message
    );
    console.error(
      "💡 Make sure OBSIDIAN_VAULT_PATH points to a valid Obsidian vault"
    );
    throw error;
  }

  // Initialize web search service
  try {
    webSearchService = new WebSearchService(embeddingService);
    console.log("✅ Web search service initialized");
  } catch (error: any) {
    console.error(
      "❌ Web search service initialization failed:",
      error.message
    );
    console.error("💡 Web search will use mock data");
    // Don't throw - web search can work with mock data
  }

  // Initialize context manager
  try {
    contextManager = new ContextManager(database, embeddingService);
    console.log("✅ Context manager initialized");
  } catch (error: any) {
    console.error("❌ Context manager initialization failed:", error.message);
    console.error("💡 Context management features will be limited");
    // Don't throw - context manager can work with limited functionality
  }

  // Initialize dictionary service
  try {
    dictionaryAPI = new DictionaryAPI(database);
    console.log("✅ Dictionary service initialized");
  } catch (error: any) {
    console.error(
      "❌ Dictionary service initialization failed:",
      error.message
    );
    console.error("💡 Dictionary features will be limited");
    // Don't throw - dictionary service can work with limited functionality
  }

  // Initialize ML entity service
  try {
    mlEntityAPI = new MLEntityAPI(database);
    console.log("✅ ML entity service initialized");
  } catch (error: any) {
    console.error("❌ ML entity service initialization failed:", error.message);
    console.error("💡 ML entity features will be limited");
    // Don't throw - ML entity service can work with limited functionality
  }

  // Initialize temporal reasoning service
  try {
    temporalReasoningAPI = new TemporalReasoningAPI(database);
    console.log("✅ Temporal reasoning service initialized");
  } catch (error: any) {
    console.error(
      "❌ Temporal reasoning service initialization failed:",
      error.message
    );
    console.error("💡 Temporal reasoning features will be limited");
    // Don't throw - temporal reasoning service can work with limited functionality
  }

  // Initialize federated search service
  try {
    federatedSearchAPI = new FederatedSearchAPI(database);
    console.log("✅ Federated search service initialized");
  } catch (error: any) {
    console.error(
      "❌ Federated search service initialization failed:",
      error.message
    );
    console.error("💡 Federated search features will be limited");
    // Don't throw - federated search service can work with limited functionality
  }

  // Initialize workspace manager service
  try {
    workspaceAPI = new WorkspaceAPI(database);
    console.log("✅ Workspace manager service initialized");
  } catch (error: any) {
    console.error(
      "❌ Workspace manager service initialization failed:",
      error.message
    );
    console.error("💡 Workspace management features will be limited");
    // Don't throw - workspace service can work with limited functionality
  }

  // Initialize web search providers based on environment variables
  if (process.env.ENABLE_SEARXNG === "true") {
    const searxngUrl = process.env.SEARXNG_URL || "http://localhost:8888";
    webSearchService.enableSearXNG(searxngUrl);
    console.log("🔍 SearXNG web search enabled");
  }

  if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX) {
    webSearchService.enableGoogleSearch(
      process.env.GOOGLE_SEARCH_API_KEY,
      process.env.GOOGLE_SEARCH_CX
    );
    console.log("🔍 Google Custom Search enabled");
  }

  if (process.env.SERPER_API_KEY) {
    webSearchService.enableSerper(process.env.SERPER_API_KEY);
    console.log("🔍 Serper web search enabled");
  }
}

/**
 * Health check endpoint
 */
server.get("/health", async (request, reply): Promise<HealthResponse> => {
  const health: HealthResponse = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    services: {
      database: false,
      embeddings: false,
      search: false,
      ingestion: false,
    },
  };

  try {
    // Check database connectivity
    if (database) {
      const stats = await database.getStats();
      health.services.database = true;
      health.database = {
        totalChunks: stats.totalChunks,
        lastUpdate: (stats as any).lastUpdate,
      };
    }

    // Check embedding service
    if (embeddingService) {
      const test = await embeddingService.testConnection();
      health.services.embeddings = test.success;
      health.embeddings = {
        model: EMBEDDING_MODEL,
        dimension: EMBEDDING_DIMENSION,
        available: test.success,
      };
    }

    // Check search service
    if (searchService) {
      health.services.search = true;
    }

    // Check ingestion pipeline
    if (ingestionPipeline) {
      health.services.ingestion = true;
    }

    // Overall health status
    const allServicesHealthy = Object.values(health.services).every(
      (status) => status
    );
    health.status = allServicesHealthy ? "healthy" : "degraded";

    reply.code(allServicesHealthy ? 200 : 503);
    return health;
  } catch (error) {
    console.error("Health check failed:", error);
    health.status = "unhealthy";
    reply.code(503);
    return health;
  }
});

/**
 * Search endpoint
 */
server.post("/search", async (request, reply): Promise<SearchResponse> => {
  if (!searchService) {
    reply.code(503);
    return {
      query: (request.body as SearchRequest).query,
      results: [],
      totalFound: 0,
      facets: {},
      graphInsights: {
        queryConcepts: [],
        relatedConcepts: [],
        knowledgeClusters: [],
      },
      error: "Search service not available",
    };
  }

  const searchRequest = request.body as SearchRequest;

  try {
    const searchResponse = await searchService.search(searchRequest.query, {
      limit: searchRequest.limit || 10,
      searchMode: searchRequest.searchMode || "comprehensive",
      includeRelated: searchRequest.includeRelated !== false,
      maxRelated: searchRequest.maxRelated || 3,
      fileTypes: searchRequest.fileTypes,
      tags: searchRequest.tags,
      folders: searchRequest.folders,
      minSimilarity: searchRequest.minSimilarity || 0.1,
      dateRange: searchRequest.dateRange
        ? {
            start: searchRequest.dateRange.start
              ? new Date(searchRequest.dateRange.start)
              : undefined,
            end: searchRequest.dateRange.end
              ? new Date(searchRequest.dateRange.end)
              : undefined,
          }
        : undefined,
    });

    reply.code(200);
    return searchResponse;
  } catch (error: any) {
    console.error("Search failed:", error);
    reply.code(500);
    return {
      query: searchRequest.query,
      results: [],
      totalFound: 0,
      facets: {},
      graphInsights: {
        queryConcepts: [],
        relatedConcepts: [],
        knowledgeClusters: [],
      },
      error: error.message,
    };
  }
});

/**
 * Strategic search endpoint (alias for search)
 */
server.post(
  "/search/strategic",
  async (request, reply): Promise<SearchResponse> => {
    if (!searchService) {
      reply.code(503);
      return {
        query: (request.body as SearchRequest).query,
        results: [],
        totalFound: 0,
        facets: {},
        graphInsights: {
          queryConcepts: [],
          relatedConcepts: [],
          knowledgeClusters: [],
        },
        error: "Search service not available",
      };
    }

    const searchRequest = request.body as SearchRequest;

    try {
      const searchResponse = await searchService.search(searchRequest.query, {
        limit: searchRequest.limit || 10,
        searchMode: searchRequest.searchMode || "comprehensive",
        includeRelated: searchRequest.includeRelated !== false,
        maxRelated: searchRequest.maxRelated || 3,
        fileTypes: searchRequest.fileTypes,
        tags: searchRequest.tags,
        folders: searchRequest.folders,
        minSimilarity: searchRequest.minSimilarity || 0.1,
        dateRange: searchRequest.dateRange
          ? {
              start: searchRequest.dateRange.start
                ? new Date(searchRequest.dateRange.start)
                : undefined,
              end: searchRequest.dateRange.end
                ? new Date(searchRequest.dateRange.end)
                : undefined,
            }
          : undefined,
      });

      reply.code(200);
      return searchResponse;
    } catch (error: any) {
      console.error("Strategic search failed:", error);
      reply.code(500);
      return {
        query: searchRequest.query,
        results: [],
        totalFound: 0,
        facets: {},
        graphInsights: {
          queryConcepts: [],
          relatedConcepts: [],
          knowledgeClusters: [],
        },
        error: error.message,
      };
    }
  }
);

/**
 * Search with rationales endpoint
 */
server.post(
  "/search/with-rationales",
  async (request, reply): Promise<SearchResponse> => {
    if (!searchService) {
      reply.code(503);
      return {
        query: (request.body as SearchRequest).query,
        results: [],
        totalFound: 0,
        facets: {},
        graphInsights: {
          queryConcepts: [],
          relatedConcepts: [],
          knowledgeClusters: [],
        },
        error: "Search service not available",
      };
    }

    const searchRequest = request.body as SearchRequest;

    try {
      const searchResponse = await searchService.search(searchRequest.query, {
        limit: searchRequest.limit || 10,
        searchMode: searchRequest.searchMode || "comprehensive",
        includeRelated: searchRequest.includeRelated !== false,
        maxRelated: searchRequest.maxRelated || 3,
        fileTypes: searchRequest.fileTypes,
        tags: searchRequest.tags,
        folders: searchRequest.folders,
        minSimilarity: searchRequest.minSimilarity || 0.1,
        dateRange: searchRequest.dateRange
          ? {
              start: searchRequest.dateRange.start
                ? new Date(searchRequest.dateRange.start)
                : undefined,
              end: searchRequest.dateRange.end
                ? new Date(searchRequest.dateRange.end)
                : undefined,
            }
          : undefined,
      });

      reply.code(200);
      return searchResponse;
    } catch (error: any) {
      console.error("Search with rationales failed:", error);
      reply.code(500);
      return {
        query: searchRequest.query,
        results: [],
        totalFound: 0,
        facets: {},
        graphInsights: {
          queryConcepts: [],
          relatedConcepts: [],
          knowledgeClusters: [],
        },
        error: error.message,
      };
    }
  }
);

/**
 * Rationale generation endpoint
 */
server.post("/search/rationale", async (request, reply) => {
  const { query, resultId } = request.body as {
    query: string;
    resultId: string;
  };

  try {
    // Generate a rationale using the LLM
    const rationale = await ollama.chat({
      model: LLM_MODEL,
      messages: [
        {
          role: "user",
          content: `Please explain why this search result is relevant to the query "${query}". Provide a brief rationale (2-3 sentences).`,
        },
      ],
      options: {
        temperature: 0.3,
        num_predict: 200,
      },
    });

    reply.code(200);
    return {
      query,
      resultId,
      rationale: rationale.message.content,
      model: LLM_MODEL,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Rationale generation failed:", error);
    reply.code(500);
    return {
      query,
      resultId,
      error: error.message,
    };
  }
});

/**
 * Explain endpoint
 */
server.post("/search/explain", async (request, reply) => {
  const { query, resultId } = request.body as {
    query: string;
    resultId: string;
  };

  try {
    // Generate an explanation using the LLM
    const explanation = await ollama.chat({
      model: LLM_MODEL,
      messages: [
        {
          role: "user",
          content: `Please explain how this search result relates to the query "${query}". Provide a detailed explanation of the connection and why it was returned.`,
        },
      ],
      options: {
        temperature: 0.3,
        num_predict: 300,
      },
    });

    reply.code(200);
    return {
      query,
      resultId,
      explanation: explanation.message.content,
      model: LLM_MODEL,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Explanation generation failed:", error);
    reply.code(500);
    return {
      query,
      resultId,
      error: error.message,
    };
  }
});

/**
 * Ingestion endpoint
 */
server.post("/ingest", async (request, reply): Promise<IngestResponse> => {
  if (!ingestionPipeline) {
    reply.code(503);
    return {
      success: false,
      message: "Ingestion pipeline not available",
      processedFiles: 0,
      totalChunks: 0,
      errors: ["Ingestion service not initialized"],
    };
  }

  const ingestRequest = request.body as IngestRequest;

  try {
    const result = await ingestionPipeline.ingestVault({
      batchSize: 50,
      rateLimitMs: 100,
      skipExisting: !ingestRequest.forceRefresh,
      includePatterns: ingestRequest.fileTypes,
      excludePatterns: ingestRequest.folders,
      chunkingOptions: {
        maxChunkSize: 1000,
        chunkOverlap: 200,
        preserveStructure: true,
        includeContext: true,
        cleanContent: true,
      },
    });

    reply.code(200);
    return {
      success: (result as any).success || true,
      message: (result as any).message || "Ingestion completed successfully",
      processedFiles: result.processedFiles,
      totalChunks: result.totalChunks,
      errors: result.errors,
      performance: (result as any).performance,
    };
  } catch (error: any) {
    console.error("Ingestion failed:", error);
    reply.code(500);
    return {
      success: false,
      message: "Ingestion failed",
      processedFiles: 0,
      totalChunks: 0,
      errors: [error.message],
    };
  }
});

/**
 * Graph data endpoint
 */
server.get("/graph", async (request, reply): Promise<GraphResponse> => {
  if (!database) {
    reply.code(503);
    return {
      nodes: [],
      edges: [],
      clusters: [],
      error: "Database not available",
    };
  }

  try {
    const stats = await database.getStats();

    // Convert stats to graph format
    const nodes = [];
    const edges = [];
    const clusters = [];

    // Create nodes for content types
    const contentTypes = stats.byContentType || {};
    for (const [type, count] of Object.entries(contentTypes)) {
      nodes.push({
        id: `type_${type}`,
        label: type,
        type: "contentType",
        count: count as number,
      });
    }

    // Create nodes for folders
    const folders = stats.byFolder || {};
    for (const [folder, count] of Object.entries(folders)) {
      nodes.push({
        id: `folder_${folder}`,
        label: folder,
        type: "folder",
        count: count as number,
      });
    }

    reply.code(200);
    return {
      nodes,
      edges,
      clusters,
      metadata: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Graph data retrieval failed:", error);
    reply.code(500);
    return {
      nodes: [],
      edges: [],
      clusters: [],
      error: error.message,
    };
  }
});

/**
 * Statistics endpoint
 */
server.get("/stats", async (request, reply): Promise<StatsResponse> => {
  if (!database) {
    reply.code(503);
    return {
      totalChunks: 0,
      byContentType: {},
      byFolder: {},
      lastUpdate: null,
      error: "Database not available",
    };
  }

  try {
    const stats = await database.getStats();

    reply.code(200);
    return {
      totalChunks: stats.totalChunks,
      byContentType: stats.byContentType || {},
      byFolder: stats.byFolder || {},
      lastUpdate: (stats as any).lastUpdate,
      performance: database.getPerformanceMetrics(),
    };
  } catch (error: any) {
    console.error("Stats retrieval failed:", error);
    reply.code(500);
    return {
      totalChunks: 0,
      byContentType: {},
      byFolder: {},
      lastUpdate: null,
      error: error.message,
    };
  }
});

/**
 * Models endpoint - List available Ollama models
 */
server.get("/models", async (request, reply): Promise<ModelsResponse> => {
  try {
    const models = await ollama.list();
    reply.code(200);
    return {
      models: models.models.map((model) => ({
        ...model,
        modified_at:
          model.modified_at instanceof Date
            ? model.modified_at.toISOString()
            : model.modified_at,
      })),
    };
  } catch (error: any) {
    console.error("Failed to list models:", error);
    reply.code(500);
    return {
      models: [],
      error: error.message,
    };
  }
});

/**
 * Chat endpoint - Generate LLM responses
 */
server.post("/chat", async (request, reply): Promise<ChatResponse> => {
  const chatRequest = request.body as ChatRequest;

  try {
    // Use the specified model or default to LLM_MODEL
    const model = chatRequest.model || LLM_MODEL;

    // Prepare context from conversation history
    const context = chatRequest.context || [];
    const messages = [
      ...context,
      { role: "user", content: chatRequest.message },
    ];

    // Add search results context if available
    if (chatRequest.searchResults && chatRequest.searchResults.length > 0) {
      const searchContext = chatRequest.searchResults
        .slice(0, 3) // Limit to top 3 results for context
        .map(
          (result, index) =>
            `Context ${index + 1}: ${result.text.substring(0, 500)}${
              result.text.length > 500 ? "..." : ""
            }`
        )
        .join("\n\n");

      messages.unshift({
        role: "system",
        content: `You have access to the user's knowledge base. Use this context to provide accurate, helpful responses:\n\n${searchContext}`,
      });
    }

    // Generate response using Ollama
    const response = await ollama.chat({
      model: model,
      messages: messages,
      options: {
        temperature: 0.7,
        num_predict: 1000, // Limit response length
      },
    });

    const aiResponse = response.message.content;

    // Generate suggested actions based on the response
    const suggestedActions = generateSuggestedActions(
      chatRequest.message,
      aiResponse,
      chatRequest.searchResults
    );

    reply.code(200);
    return {
      response: aiResponse,
      context: [
        ...context,
        { role: "user", content: chatRequest.message },
        { role: "assistant", content: aiResponse },
      ],
      suggestedActions,
      timestamp: new Date().toISOString(),
      model: model,
    };
  } catch (error: any) {
    console.error("Chat failed:", error);
    reply.code(500);
    return {
      response: `Sorry, I encountered an error while processing your message: ${error.message}`,
      context: chatRequest.context || [],
      timestamp: new Date().toISOString(),
      model: chatRequest.model || LLM_MODEL,
    };
  }
});

/**
 * Generate suggested actions based on user message and AI response
 */
function generateSuggestedActions(
  userMessage: string,
  aiResponse: string,
  searchResults?: Array<any>
): Array<{
  type: "refine_search" | "new_search" | "filter" | "explore";
  label: string;
  query?: string;
  filters?: any;
}> {
  const actions: Array<{
    type: "refine_search" | "new_search" | "filter" | "explore";
    label: string;
    query?: string;
    filters?: any;
  }> = [];

  // If we have search results, suggest refinements
  if (searchResults && searchResults.length > 0) {
    actions.push({
      type: "refine_search",
      label: "Show more results",
      query: userMessage,
      filters: { limit: 20 },
    });

    actions.push({
      type: "filter",
      label: "Filter by content type",
      filters: { contentTypes: ["code", "text"] },
    });
  }

  // Suggest exploring related topics
  const exploreTopics = extractExploreTopics(userMessage, aiResponse);
  exploreTopics.forEach((topic) => {
    actions.push({
      type: "explore",
      label: `Learn about ${topic}`,
      query: topic,
    });
  });

  return actions.slice(0, 4); // Limit to 4 suggestions
}

/**
 * Extract potential topics to explore from messages
 */
function extractExploreTopics(
  userMessage: string,
  aiResponse: string
): string[] {
  const topics: string[] = [];

  // Look for technical terms, concepts, or questions in the response
  const sentences = aiResponse.split(/[.!?]+/);
  sentences.forEach((sentence) => {
    const trimmed = sentence.trim().toLowerCase();
    if (
      trimmed.includes("component") ||
      trimmed.includes("pattern") ||
      trimmed.includes("best practice") ||
      trimmed.includes("example") ||
      trimmed.includes("tutorial")
    ) {
      const words = trimmed.split(/\s+/).slice(0, 3); // Take first few words
      if (words.length > 1) {
        topics.push(words.join(" "));
      }
    }
  });

  return Array.from(new Set(topics)); // Remove duplicates
}

/**
 * Chat history endpoint - Get all chat sessions
 */
server.get(
  "/chat/history",
  async (request, reply): Promise<ChatHistoryResponse> => {
    try {
      const sessions = await database.getChatSessions(undefined, 50);

      reply.code(200);
      return { sessions };
    } catch (error: any) {
      console.error("Failed to get chat history:", error);
      reply.code(500);
      return {
        sessions: [],
        error: error.message,
      };
    }
  }
);

/**
 * Save chat session endpoint
 */
server.post(
  "/chat/save",
  async (
    request,
    reply
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> => {
    const saveRequest = request.body as SaveChatRequest;

    try {
      // Generate a title from the first user message if not provided
      const title =
        saveRequest.title || generateChatTitle(saveRequest.messages);

      // Generate embedding for chat session (but don't include in main document search)
      let sessionEmbedding: number[] | undefined;
      try {
        const conversationText = saveRequest.messages
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join("\n");

        // Use a special marker to distinguish chat embeddings
        const chatContent = `[CHAT_SESSION] ${title}\n\n${conversationText}`;
        sessionEmbedding = await embeddingService.embed(chatContent);
      } catch (error) {
        console.warn("Failed to generate chat session embedding:", error);
      }

      // Create chat session object
      const session = {
        id: `session_${Date.now()}`,
        title,
        messages: saveRequest.messages.map((msg) => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
          timestamp: msg.timestamp,
          model: msg.model,
        })),
        model: saveRequest.model || LLM_MODEL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: saveRequest.messages.length,
        topics: extractTopicsFromMessages(saveRequest.messages),
        summary: await generateSessionSummary(saveRequest.messages),
        embedding: sessionEmbedding,
      };

      // Save to database
      await database.saveChatSession(session);

      reply.code(200);
      return {
        success: true,
        sessionId: session.id,
      };
    } catch (error: any) {
      console.error("Failed to save chat session:", error);
      reply.code(500);
      return {
        success: false,
        error: error.message,
      };
    }
  }
);

/**
 * Load chat session endpoint
 */
server.get(
  "/chat/session/:id",
  async (request, reply): Promise<{ session?: any; error?: string }> => {
    const { id } = request.params as { id: string };

    try {
      const session = await database.getChatSessionById(id);

      if (!session) {
        reply.code(404);
        return {
          error: "Chat session not found",
        };
      }

      reply.code(200);
      return { session };
    } catch (error: any) {
      console.error("Failed to load chat session:", error);
      reply.code(500);
      return {
        error: error.message,
      };
    }
  }
);

/**
 * Generate a title for a chat session based on messages
 */
function generateChatTitle(
  messages: Array<{ role: string; content: string }>
): string {
  // Find the first user message
  const firstUserMessage = messages.find((msg) => msg.role === "user");

  if (!firstUserMessage) {
    return "New Chat";
  }

  // Truncate to first 50 characters for title
  const content = firstUserMessage.content;
  const title =
    content.length > 50 ? content.substring(0, 50) + "..." : content;

  return title;
}

/**
 * Generate a summary for a chat session using LLM
 */
async function generateSessionSummary(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    // Create a summary prompt
    const conversationText = messages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const summaryPrompt = `Please provide a brief summary of this conversation (max 100 words):\n\n${conversationText}`;

    const response = await ollama.chat({
      model: LLM_MODEL,
      messages: [
        {
          role: "user",
          content: summaryPrompt,
        },
      ],
      options: {
        temperature: 0.3,
        num_predict: 200, // Limit summary length
      },
    });

    return response.message.content.trim();
  } catch (error) {
    console.warn("Failed to generate session summary:", error);
    // Fallback: generate a simple summary from the first few messages
    const userMessages = messages.filter((msg) => msg.role === "user");
    if (userMessages.length > 0) {
      const firstMessage = userMessages[0].content;
      return firstMessage.length > 100
        ? firstMessage.substring(0, 100) + "..."
        : firstMessage;
    }
    return "Chat session";
  }
}

/**
 * Extract topics from chat messages for better organization
 */
function extractTopicsFromMessages(
  messages: Array<{ role: string; content: string }>
): string[] {
  const topics: string[] = [];
  const userMessages = messages.filter((msg) => msg.role === "user");

  // Simple keyword extraction
  const commonKeywords = [
    "design",
    "component",
    "system",
    "api",
    "database",
    "search",
    "code",
    "function",
    "class",
    "method",
    "variable",
    "algorithm",
    "project",
    "feature",
    "bug",
    "error",
    "documentation",
    "tutorial",
    "performance",
    "optimization",
    "security",
    "testing",
    "deployment",
  ];

  userMessages.forEach((msg) => {
    const content = msg.content.toLowerCase();
    commonKeywords.forEach((keyword) => {
      if (content.includes(keyword) && !topics.includes(keyword)) {
        topics.push(keyword);
      }
    });
  });

  // Extract technical terms (words starting with capital letters)
  userMessages.forEach((msg) => {
    const words = msg.content.split(/\s+/);
    words.forEach((word) => {
      if (
        word.length > 3 &&
        word[0] === word[0].toUpperCase() &&
        !topics.includes(word) &&
        !commonKeywords.includes(word.toLowerCase())
      ) {
        topics.push(word);
      }
    });
  });

  return topics.slice(0, 10); // Limit to 10 topics
}

/**
 * Delete chat session endpoint
 */
server.delete(
  "/chat/session/:id",
  async (request, reply): Promise<{ success: boolean; error?: string }> => {
    const { id } = request.params as { id: string };

    try {
      await database.deleteChatSession(id);

      reply.code(200);
      return { success: true };
    } catch (error: any) {
      console.error("Failed to delete chat session:", error);
      reply.code(500);
      return {
        success: false,
        error: error.message,
      };
    }
  }
);

/**
 * Web search endpoint
 */
server.post(
  "/search/web",
  async (request, reply): Promise<WebSearchResponse> => {
    if (!webSearchService) {
      reply.code(503);
      return {
        query: (request.body as WebSearchRequest).query,
        results: [],
        totalFound: 0,
        searchTime: 0,
        error: "Web search service not available",
      };
    }

    const searchRequest = request.body as WebSearchRequest;
    const startTime = Date.now();

    try {
      const results = await webSearchService.search(searchRequest.query, {
        maxResults: searchRequest.maxResults || 10,
        includeSnippets: searchRequest.includeSnippets !== false,
        minRelevanceScore: searchRequest.minRelevanceScore || 0.1,
        sources: searchRequest.sources,
        timeRange: searchRequest.timeRange,
      });

      const searchTime = Date.now() - startTime;

      reply.code(200);
      return {
        query: searchRequest.query,
        results: results.map((result) => ({
          title: result.title,
          url: result.url,
          snippet: result.snippet,
          publishedDate: result.publishedDate,
          source: result.source,
          relevanceScore: result.relevanceScore,
        })),
        totalFound: results.length,
        searchTime,
      };
    } catch (error: any) {
      console.error("Web search failed:", error);
      reply.code(500);
      return {
        query: searchRequest.query,
        results: [],
        totalFound: 0,
        searchTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }
);

/**
 * Enhanced search endpoint with web search integration
 */
server.post(
  "/search/enhanced",
  async (request, reply): Promise<SearchResponse> => {
    if (!searchService) {
      reply.code(503);
      return {
        query: (request.body as SearchRequest).query,
        results: [],
        totalFound: 0,
        facets: {},
        graphInsights: {
          queryConcepts: [],
          relatedConcepts: [],
          knowledgeClusters: [],
        },
        error: "Search service not available",
      };
    }

    const searchRequest = request.body as SearchRequest;
    const startTime = Date.now();

    try {
      // Perform regular knowledge base search
      const kbResults = await searchService.search(searchRequest.query, {
        limit: Math.floor((searchRequest.limit || 10) * 0.7), // Reserve 30% for web results
        searchMode: searchRequest.searchMode || "comprehensive",
        includeRelated: searchRequest.includeRelated !== false,
        maxRelated: searchRequest.maxRelated || 3,
        fileTypes: searchRequest.fileTypes,
        tags: searchRequest.tags,
        folders: searchRequest.folders,
        minSimilarity: searchRequest.minSimilarity || 0.1,
        dateRange: searchRequest.dateRange
          ? {
              start: searchRequest.dateRange.start
                ? new Date(searchRequest.dateRange.start)
                : undefined,
              end: searchRequest.dateRange.end
                ? new Date(searchRequest.dateRange.end)
                : undefined,
            }
          : undefined,
      });

      let allResults = [...kbResults.results];
      let webResults: any[] = [];

      // Add web search results if requested and web search is available
      if (webSearchService && (searchRequest as any).includeWebResults) {
        try {
          const webSearchResults = await webSearchService.search(
            searchRequest.query,
            {
              maxResults: Math.floor((searchRequest.limit || 10) * 0.3),
              includeSnippets: true,
              minRelevanceScore: 0.3,
            }
          );

          webResults = webSearchResults.map((result, index) => ({
            id: `web_${Date.now()}_${index}`,
            text: `${result.title}\n\n${result.snippet}`,
            meta: {
              contentType: "web",
              section: result.title,
              breadcrumbs: [result.source],
              uri: result.url,
              url: result.url,
              updatedAt: result.publishedDate,
              createdAt: result.publishedDate,
              sourceType: "web",
              webSource: result.source,
            },
            source: {
              type: "web",
              path: result.url,
              url: result.url,
            },
            cosineSimilarity: result.relevanceScore,
            rank: kbResults.results.length + index + 1,
          }));

          allResults.push(...webResults);
        } catch (webError) {
          console.warn(
            "Web search failed, continuing with knowledge base results:",
            webError
          );
        }
      }

      const searchTime = Date.now() - startTime;

      reply.code(200);
      return {
        query: searchRequest.query,
        results: allResults.slice(0, searchRequest.limit || 10),
        totalFound: allResults.length,
        facets: kbResults.facets,
        graphInsights: {
          ...kbResults.graphInsights,
          webResults: webResults.length,
        },
      };
    } catch (error: any) {
      console.error("Enhanced search failed:", error);
      reply.code(500);
      return {
        query: searchRequest.query,
        results: [],
        totalFound: 0,
        facets: {},
        graphInsights: {
          queryConcepts: [],
          relatedConcepts: [],
          knowledgeClusters: [],
        },
        error: error.message,
      };
    }
  }
);

/**
 * Context-aware search endpoint
 */
server.post(
  "/search/context",
  async (request, reply): Promise<SearchResponse> => {
    if (!searchService || !contextManager) {
      reply.code(503);
      return {
        query: (request.body as SearchRequest).query,
        results: [],
        totalFound: 0,
        facets: {},
        graphInsights: {
          queryConcepts: [],
          relatedConcepts: [],
          knowledgeClusters: [],
        },
        error: "Search or context services not available",
      };
    }

    const searchRequest = request.body as SearchRequest;

    try {
      // Get context for related documents
      const contextQuery = {
        documentIds: searchRequest.folders || [], // Use folders as context
        maxRelated: searchRequest.maxRelated || 5,
        relationshipTypes: ["references", "similar", "related"],
        minStrength: 0.3,
        includeIndirect: true,
      };

      const documentContexts = await contextManager.getDocumentContext(
        contextQuery
      );

      // Extract related document IDs for enhanced search
      const relatedDocIds = documentContexts.flatMap((ctx) =>
        ctx.relatedDocuments.map((rel) => rel.documentId)
      );

      // Perform enhanced search with context
      const enhancedSearchRequest = {
        ...searchRequest,
        // Include related documents in search
        additionalContext: relatedDocIds,
      };

      const searchResults = await searchService.search(searchRequest.query, {
        limit: searchRequest.limit || 10,
        searchMode: searchRequest.searchMode || "comprehensive",
        includeRelated: true,
        maxRelated: searchRequest.maxRelated || 3,
        fileTypes: searchRequest.fileTypes,
        tags: searchRequest.tags,
        folders: [...(searchRequest.folders || []), ...relatedDocIds],
        minSimilarity: searchRequest.minSimilarity || 0.1,
        dateRange: searchRequest.dateRange
          ? {
              start: searchRequest.dateRange.start
                ? new Date(searchRequest.dateRange.start)
                : undefined,
              end: searchRequest.dateRange.end
                ? new Date(searchRequest.dateRange.end)
                : undefined,
            }
          : undefined,
      });

      // Add context information to results
      const enhancedResults = searchResults.results.map((result) => ({
        ...result,
        contextInfo: {
          relatedDocuments: relatedDocIds.length,
          contextStrength:
            documentContexts.length > 0
              ? documentContexts.reduce((sum, ctx) => sum + ctx.importance, 0) /
                documentContexts.length
              : 0,
        },
      }));

      reply.code(200);
      return {
        query: searchRequest.query,
        results: enhancedResults,
        totalFound: searchResults.totalFound,
        facets: searchResults.facets,
        graphInsights: {
          ...searchResults.graphInsights,
          contextDocuments: documentContexts.length,
          relatedDocuments: relatedDocIds.length,
        },
      };
    } catch (error: any) {
      console.error("Context search failed:", error);
      reply.code(500);
      return {
        query: searchRequest.query,
        results: [],
        totalFound: 0,
        facets: {},
        graphInsights: {
          queryConcepts: [],
          relatedConcepts: [],
          knowledgeClusters: [],
        },
        error: error.message,
      };
    }
  }
);

/**
 * Knowledge graph endpoint
 */
server.get(
  "/graph/context",
  async (
    request,
    reply
  ): Promise<{
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      importance: number;
      topics?: string[];
    }>;
    edges: Array<{
      source: string;
      target: string;
      type: string;
      strength: number;
    }>;
    context?: {
      centerDocument?: string;
      relatedTopics: string[];
      relationshipStats: Record<string, number>;
    };
    error?: string;
  }> => {
    if (!contextManager) {
      reply.code(503);
      return {
        nodes: [],
        edges: [],
        error: "Context manager not available",
      };
    }

    const { centerDocument, maxNodes = 50 } = request.query as {
      centerDocument?: string;
      maxNodes?: number;
    };

    try {
      const graphData = await contextManager.getKnowledgeGraphData(
        centerDocument,
        maxNodes
      );
      const context = contextManager.getContextStats();

      // Get related topics
      const topics = new Set<string>();
      graphData.nodes.forEach((node) => {
        // Mock topics extraction - in real implementation, get from document metadata
        if (node.id.includes("api")) topics.add("API");
        if (node.id.includes("component")) topics.add("Components");
        if (node.id.includes("database")) topics.add("Database");
      });

      reply.code(200);
      return {
        ...graphData,
        context: {
          centerDocument,
          relatedTopics: Array.from(topics),
          relationshipStats: {
            totalRelationships: context.totalRelationships,
            averagePerDocument: context.averageRelationshipsPerDocument,
          },
        },
      };
    } catch (error: any) {
      console.error("Knowledge graph retrieval failed:", error);
      reply.code(500);
      return {
        nodes: [],
        edges: [],
        error: error.message,
      };
    }
  }
);

/**
 * Context suggestions endpoint
 */
server.post(
  "/context/suggestions",
  async (
    request,
    reply
  ): Promise<{
    suggestions: Array<{
      suggestion: string;
      confidence: number;
      context?: string;
    }>;
    error?: string;
  }> => {
    if (!contextManager) {
      reply.code(503);
      return {
        suggestions: [],
        error: "Context manager not available",
      };
    }

    const { query, context = [] } = request.body as {
      query: string;
      context?: string[];
    };

    try {
      const suggestions = await contextManager.getContextualSuggestions(
        query,
        context
      );

      reply.code(200);
      return { suggestions };
    } catch (error: any) {
      console.error("Context suggestions failed:", error);
      reply.code(500);
      return {
        suggestions: [],
        error: error.message,
      };
    }
  }
);

/**
 * Chat session search endpoint - searches only chat sessions, not regular documents
 */
server.post(
  "/search/chat-sessions",
  async (
    request,
    reply
  ): Promise<{
    query: string;
    results: Array<any>;
    totalFound: number;
    error?: string;
  }> => {
    if (!database) {
      reply.code(503);
      return {
        query: (request.body as { query: string }).query,
        results: [],
        totalFound: 0,
        error: "Database not available",
      };
    }

    const { query, limit = 10 } = request.body as {
      query: string;
      limit?: number;
    };

    try {
      // Generate embedding for the query
      const queryEmbedding = await embeddingService.embed(
        `[CHAT_SEARCH] ${query}`
      );

      // Search chat sessions using their embeddings
      const chatResults = await database.searchChatSessions(
        query,
        queryEmbedding,
        limit
      );

      reply.code(200);
      return {
        query,
        results: chatResults,
        totalFound: chatResults.length,
      };
    } catch (error: any) {
      console.error("Chat session search failed:", error);
      reply.code(500);
      return {
        query,
        results: [],
        totalFound: 0,
        error: error.message,
      };
    }
  }
);

/**
 * Combined search that includes both documents and chat sessions
 * with safeguards to prevent recursion
 */
server.post(
  "/search/combined",
  async (request, reply): Promise<SearchResponse> => {
    if (!searchService || !database) {
      reply.code(503);
      return {
        query: (request.body as SearchRequest).query,
        results: [],
        totalFound: 0,
        facets: {},
        graphInsights: {
          queryConcepts: [],
          relatedConcepts: [],
          knowledgeClusters: [],
        },
        error: "Search services not available",
      };
    }

    const searchRequest = request.body as SearchRequest;

    try {
      // Perform regular document search
      const docResults = await searchService.search(searchRequest.query, {
        limit: Math.floor((searchRequest.limit || 10) * 0.8), // Reserve 20% for chat results
        searchMode: searchRequest.searchMode || "comprehensive",
        includeRelated: searchRequest.includeRelated !== false,
        maxRelated: searchRequest.maxRelated || 3,
        fileTypes: searchRequest.fileTypes,
        tags: searchRequest.tags,
        folders: searchRequest.folders,
        minSimilarity: searchRequest.minSimilarity || 0.1,
        dateRange: searchRequest.dateRange
          ? {
              start: searchRequest.dateRange.start
                ? new Date(searchRequest.dateRange.start)
                : undefined,
              end: searchRequest.dateRange.end
                ? new Date(searchRequest.dateRange.end)
                : undefined,
            }
          : undefined,
      });

      let allResults = [...docResults.results];
      let chatResults: Array<any> = [];

      // Only search chat sessions if explicitly requested and not searching within chat context
      if (
        (searchRequest as any).includeChatSessions &&
        !searchRequest.query.includes("[CHAT_SESSION]")
      ) {
        try {
          const queryEmbedding = await embeddingService.embed(
            `[CHAT_SEARCH] ${searchRequest.query}`
          );
          const chatSearchResults = await database.searchChatSessions(
            searchRequest.query,
            queryEmbedding,
            Math.floor((searchRequest.limit || 10) * 0.2)
          );

          chatResults = chatSearchResults.map((session, index) => ({
            id: `chat_${session.id}`,
            text: `[CHAT SESSION] ${session.title}\n\n${
              session.summary || "No summary available"
            }`,
            meta: {
              contentType: "chat_session",
              section: session.title,
              breadcrumbs: [`Chat Session`, session.model],
              uri: `chat://${session.id}`,
              updatedAt: session.updatedAt,
              createdAt: session.createdAt,
              sourceType: "chat",
              model: session.model,
              messageCount: session.messageCount,
              topics: session.topics,
            },
            source: {
              type: "chat",
              path: session.title,
              url: `chat://${session.id}`,
            },
            cosineSimilarity: session.similarity,
            rank: docResults.results.length + index + 1,
          }));

          allResults.push(...chatResults);
        } catch (chatError) {
          console.warn(
            "Chat session search failed, continuing with document results:",
            chatError
          );
        }
      }

      reply.code(200);
      return {
        query: searchRequest.query,
        results: allResults.slice(0, searchRequest.limit || 10),
        totalFound: allResults.length,
        facets: docResults.facets,
        graphInsights: {
          ...docResults.graphInsights,
          chatSessions: chatResults.length,
          hasChatResults: chatResults.length > 0,
        },
      };
    } catch (error: any) {
      console.error("Combined search failed:", error);
      reply.code(500);
      return {
        query: searchRequest.query,
        results: [],
        totalFound: 0,
        facets: {},
        graphInsights: {
          queryConcepts: [],
          relatedConcepts: [],
          knowledgeClusters: [],
        },
        error: error.message,
      };
    }
  }
);

// =============================================================================
// ROLLBACK ENDPOINTS
// =============================================================================

server.post(
  "/files/rollback/:path",
  async (
    request,
    reply
  ): Promise<{ status: string; message: string; error?: string }> => {
    const { path: filePath } = request.params as { path: string };
    const { versionId, force } = request.body as {
      versionId?: string;
      force?: boolean;
    };

    try {
      // Get available versions for the file
      const versions = await database.getDocumentVersions(filePath);

      if (versions.length === 0) {
        return {
          status: "error",
          message: "No versions found for file",
          error: "File has no version history",
        };
      }

      // If no version specified, rollback to the most recent version
      const targetVersion = versionId
        ? versions.find((v) => v.versionId === versionId)
        : versions[0];

      if (!targetVersion) {
        return {
          status: "error",
          message: "Version not found",
          error: `Version ${versionId} not found`,
        };
      }

      // Check if file exists on disk
      if (!fs.existsSync(filePath)) {
        if (!force) {
          return {
            status: "error",
            message: "File does not exist on disk",
            error: "Use force=true to create file from version",
          };
        }

        // Create file from version content
        const versionData = await database.getVersionContent(
          targetVersion.versionId
        );
        if (!versionData) {
          return {
            status: "error",
            message: "Version content not found",
            error: "Cannot retrieve content for this version",
          };
        }

        await fs.promises.writeFile(filePath, versionData.content);
      }

      // Restore the version
      const result = await rollbackFileToVersion(filePath, targetVersion, {
        force: force || false,
      });

      // Broadcast rollback event
      if (wsManager) {
        wsManager.broadcast({
          type: "rollbackComplete",
          data: {
            filePath,
            versionId: targetVersion.versionId,
            changeSummary: targetVersion.changeSummary,
            result,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return {
        status: "success",
        message: `Successfully rolled back ${filePath} to version ${targetVersion.versionId}`,
      };
    } catch (error) {
      return {
        status: "error",
        message: "Rollback failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

server.get(
  "/files/versions/:path",
  async (
    request,
    reply
  ): Promise<{ status: string; versions: any[]; error?: string }> => {
    const { path: filePath } = request.params as { path: string };

    try {
      const versions = await database.getDocumentVersions(filePath);

      return {
        status: "success",
        versions: versions.map((v) => ({
          versionId: v.versionId,
          contentHash: v.contentHash,
          embeddingHash: v.embeddingHash,
          createdAt: v.createdAt,
          changeSummary: v.changeSummary,
          changeType: v.changeType,
          chunks: v.chunks,
        })),
      };
    } catch (error) {
      return {
        status: "error",
        versions: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

server.get(
  "/files/conflicts",
  async (request, reply): Promise<{ conflicts: any[]; error?: string }> => {
    try {
      // This would return information about recent conflicts
      // For now, return empty array as conflicts are handled in real-time
      return {
        conflicts: [],
      };
    } catch (error) {
      return {
        conflicts: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

// =============================================================================
// WEBSOCKET NOTIFICATIONS
// =============================================================================

// WebSocket event types
interface WebSocketEvent {
  type:
    | "fileChange"
    | "batchStart"
    | "batchComplete"
    | "fileProcessed"
    | "fileDeleted"
    | "error"
    | "systemStatus"
    | "conflictDetected"
    | "rollbackComplete";
  data: any;
  timestamp: string;
}

interface WebSocketClient {
  ws: WebSocket;
  subscriptions: string[];
  lastActivity: Date;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocketClient> = new Map();

  initialize(server: any) {
    this.wss = new WebSocketServer({ server });

    this.wss.on("connection", (ws: WebSocket, request) => {
      const clientId = this.generateClientId();
      const client: WebSocketClient = {
        ws,
        subscriptions: ["*"], // Subscribe to all events by default
        lastActivity: new Date(),
      };

      this.clients.set(clientId, client);

      console.log(`📡 WebSocket client connected: ${clientId}`);

      // Send welcome message
      this.sendToClient(clientId, {
        type: "systemStatus",
        data: { message: "Connected to Obsidian RAG WebSocket", clientId },
        timestamp: new Date().toISOString(),
      });

      // Handle messages from client
      ws.on("message", (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(clientId, data);
        } catch (error) {
          this.sendToClient(clientId, {
            type: "error",
            data: { message: "Invalid message format" },
            timestamp: new Date().toISOString(),
          });
        }
      });

      // Handle client disconnect
      ws.on("close", () => {
        this.clients.delete(clientId);
        console.log(`📡 WebSocket client disconnected: ${clientId}`);
      });

      // Handle ping/pong for keepalive
      ws.on("pong", () => {
        client.lastActivity = new Date();
      });
    });

    // Set up heartbeat to keep connections alive
    setInterval(() => {
      this.wss?.clients.forEach((ws: WebSocket) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      });
    }, 30000); // Ping every 30 seconds

    // Clean up inactive clients
    setInterval(() => {
      const now = new Date();
      for (const [clientId, client] of this.clients.entries()) {
        const inactiveTime = now.getTime() - client.lastActivity.getTime();
        if (inactiveTime > 300000) {
          // 5 minutes
          client.ws.terminate();
          this.clients.delete(clientId);
          console.log(`📡 Cleaned up inactive client: ${clientId}`);
        }
      }
    }, 60000); // Check every minute
  }

  private generateClientId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleClientMessage(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case "subscribe":
        client.subscriptions = message.subscriptions || ["*"];
        this.sendToClient(clientId, {
          type: "systemStatus",
          data: {
            message: `Subscribed to: ${client.subscriptions.join(", ")}`,
          },
          timestamp: new Date().toISOString(),
        });
        break;

      case "unsubscribe":
        client.subscriptions = client.subscriptions.filter(
          (sub) => !message.subscriptions?.includes(sub)
        );
        this.sendToClient(clientId, {
          type: "systemStatus",
          data: {
            message: `Unsubscribed from: ${message.subscriptions?.join(", ")}`,
          },
          timestamp: new Date().toISOString(),
        });
        break;

      case "ping":
        this.sendToClient(clientId, {
          type: "pong",
          data: { timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString(),
        });
        break;
    }
  }

  broadcast(event: WebSocketEvent): void {
    const message = JSON.stringify(event);

    for (const [clientId, client] of this.clients.entries()) {
      if (this.shouldReceiveEvent(client.subscriptions, event.type)) {
        try {
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(message);
          }
        } catch (error) {
          console.error(
            `Failed to send WebSocket message to ${clientId}:`,
            error
          );
        }
      }
    }
  }

  private shouldReceiveEvent(
    subscriptions: string[],
    eventType: string
  ): boolean {
    return subscriptions.includes("*") || subscriptions.includes(eventType);
  }

  sendToClient(clientId: string, event: WebSocketEvent): void {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(event));
      } catch (error) {
        console.error(
          `Failed to send WebSocket message to ${clientId}:`,
          error
        );
      }
    }
  }

  getStats(): { totalClients: number; activeClients: number } {
    const totalClients = this.clients.size;
    const activeClients = Array.from(this.clients.values()).filter(
      (client) => client.ws.readyState === WebSocket.OPEN
    ).length;

    return { totalClients, activeClients };
  }
}

// Global WebSocket manager instance
const wsManager = new WebSocketManager();

// =============================================================================
// INCREMENTAL UPDATE ENDPOINTS
// =============================================================================

server.get(
  "/files/status/:path",
  async (
    request,
    reply
  ): Promise<{ status: string; fileInfo?: any; error?: string }> => {
    const { path: filePath } = request.params as { path: string };

    try {
      // Check if file exists in database
      const chunks = await database.getChunksByFile(filePath);
      const stats = fs.statSync(filePath);

      return {
        status: "success",
        fileInfo: {
          path: filePath,
          existsInDb: chunks.length > 0,
          lastModified: stats.mtime,
          size: stats.size,
          chunks: chunks.length,
        },
      };
    } catch (error) {
      return {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

server.post(
  "/ingest/incremental",
  async (request, reply): Promise<IngestResponse> => {
    if (!ingestionPipeline) {
      reply.code(503);
      return {
        message: "Ingestion pipeline unavailable",
        totalFiles: 0,
        processedFiles: 0,
        skippedFiles: 0,
        failedFiles: 0,
        totalChunks: 0,
        processedChunks: 0,
        errors: ["Ingestion pipeline not initialized"],
      };
    }

    const { since, force, patterns } = request.body as {
      since?: string; // ISO timestamp
      force?: boolean;
      patterns?: string[];
    };

    try {
      // Find files modified since the given timestamp
      const sinceDate = since
        ? new Date(since)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const changedFiles = await findChangedFiles(sinceDate, patterns);

      if (changedFiles.length === 0) {
        return {
          message: "No files changed since specified time",
          totalFiles: 0,
          processedFiles: 0,
          skippedFiles: 0,
          failedFiles: 0,
          totalChunks: 0,
          processedChunks: 0,
          errors: [],
        };
      }

      // Process the changed files
      const result = await ingestionPipeline.ingestFiles(changedFiles, {
        skipExisting: !force,
        batchSize: 5,
        rateLimitMs: 100,
      });

      return {
        message: `Processed ${result.processedFiles} files incrementally`,
        totalFiles: changedFiles.length,
        processedFiles: result.processedFiles,
        skippedFiles: result.skippedFiles,
        failedFiles: result.failedFiles,
        totalChunks: result.totalChunks,
        processedChunks: result.processedChunks,
        errors: result.errors,
      };
    } catch (error) {
      reply.code(500);
      return {
        message: "Incremental ingestion failed",
        totalFiles: 0,
        processedFiles: 0,
        skippedFiles: 0,
        failedFiles: 0,
        totalChunks: 0,
        processedChunks: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }
);

server.post(
  "/ingest/file/:path",
  async (request, reply): Promise<IngestResponse> => {
    if (!ingestionPipeline) {
      reply.code(503);
      return {
        message: "Ingestion pipeline unavailable",
        totalFiles: 0,
        processedFiles: 0,
        skippedFiles: 0,
        failedFiles: 0,
        totalChunks: 0,
        processedChunks: 0,
        errors: ["Ingestion pipeline not initialized"],
      };
    }

    const { path: filePath } = request.params as { path: string };
    const { force } = request.body as { force?: boolean };

    try {
      const filePaths = [filePath];
      const result = await ingestionPipeline.ingestFiles(filePaths, {
        skipExisting: !force,
        batchSize: 1,
      });

      return {
        message: `Processed file: ${filePath}`,
        totalFiles: 1,
        processedFiles: result.processedFiles,
        skippedFiles: result.skippedFiles,
        failedFiles: result.failedFiles,
        totalChunks: result.totalChunks,
        processedChunks: result.processedChunks,
        errors: result.errors,
      };
    } catch (error) {
      reply.code(500);
      return {
        message: "File ingestion failed",
        totalFiles: 0,
        processedFiles: 0,
        skippedFiles: 0,
        failedFiles: 0,
        totalChunks: 0,
        processedChunks: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }
);

server.get(
  "/files/changed",
  async (
    request,
    reply
  ): Promise<{ files: string[]; since: string; error?: string }> => {
    const { since, patterns } = request.query as {
      since?: string;
      patterns?: string;
    };

    try {
      const sinceDate = since
        ? new Date(since)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const patternArray = patterns ? patterns.split(",") : undefined;
      const changedFiles = await findChangedFiles(sinceDate, patternArray);

      return {
        files: changedFiles,
        since: sinceDate.toISOString(),
      };
    } catch (error) {
      return {
        files: [],
        since: since || new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

/**
 * Find files that have changed since a given timestamp
 */
async function findChangedFiles(
  since: Date,
  patterns?: string[]
): Promise<string[]> {
  const vaultPath =
    process.env.OBSIDIAN_VAULT_PATH ||
    "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault";
  const changedFiles: string[] = [];

  async function scanDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await fs.promises.readdir(dirPath, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        // Skip hidden files and directories
        if (entry.name.startsWith(".")) continue;

        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(vaultPath, fullPath);

        // Check if file matches patterns
        if (patterns && patterns.length > 0) {
          const matchesPattern = patterns.some((pattern) => {
            const regex = new RegExp(
              pattern.replace(/\*/g, ".*").replace(/\?/g, ".")
            );
            return regex.test(relativePath);
          });

          if (!matchesPattern) continue;
        }

        if (entry.isDirectory()) {
          // Recursively scan subdirectory
          await scanDirectory(fullPath);
        } else if (entry.isFile()) {
          try {
            const stats = await fs.promises.stat(fullPath);

            // Check if file was modified since the given timestamp
            if (stats.mtime > since) {
              changedFiles.push(relativePath);
            }
          } catch (error) {
            // Skip files that can't be accessed
            continue;
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be accessed
      return;
    }
  }

  await scanDirectory(vaultPath);
  return changedFiles;
}

/**
 * Rollback file to a specific version
 */
async function rollbackFileToVersion(
  filePath: string,
  version: any,
  options: { force?: boolean } = {}
): Promise<{ success: boolean; message: string; changes?: any }> {
  try {
    // Get version content from database
    const versionData = await database.getVersionContent(version.versionId);
    if (!versionData) {
      throw new Error(`Version content not found for ${version.versionId}`);
    }

    // Backup current file if it exists and force is false
    if (fs.existsSync(filePath) && !options.force) {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      await fs.promises.copyFile(filePath, backupPath);
      console.log(`📋 Created backup: ${backupPath}`);
    }

    // Write version content to file
    await fs.promises.writeFile(filePath, versionData.content);

    // Update file modification time to match version
    const versionTime = new Date(version.createdAt);
    await fs.promises.utimes(filePath, versionTime, versionTime);

    // Update database with rollback information
    await database.updateDocumentVersion(filePath, {
      versionId: generateVersionId(),
      contentHash: versionData.contentHash,
      embeddingHash: versionData.embeddingHash,
      createdAt: new Date(),
      changeSummary: `Rolled back to version ${version.versionId}`,
      changeType: "modified",
      metadata: {
        rolledBackFrom: version.versionId,
        rollbackTime: new Date().toISOString(),
      },
    });

    return {
      success: true,
      message: `Successfully rolled back to version ${version.versionId}`,
      changes: {
        filePath,
        versionId: version.versionId,
        changeType: "rollback",
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    throw new Error(
      `Rollback failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Generate a unique version ID
 */
function generateVersionId(): string {
  return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Graceful shutdown
 */
async function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received, shutting down gracefully...`);

  try {
    // Close WebSocket connections
    if (wsManager) {
      console.log("✅ WebSocket connections closed");
    }

    if (database) {
      await database.close();
      console.log("✅ Database connection closed");
    }

    await server.close();
    console.log("✅ Server closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Register CORS plugin
(async () => {
  await server.register(cors, {
    origin: true, // Allow all origins in development
    credentials: true,
  });
})();

// Register dictionary API routes
if (dictionaryAPI) {
  server.register(dictionaryAPI.getRouter(), { prefix: "/dictionary" });
  console.log("📚 Dictionary API routes registered");
}

// Register ML entity API routes
if (mlEntityAPI) {
  server.register(mlEntityAPI.getRouter(), { prefix: "/ml/entities" });
  console.log("🤖 ML Entity API routes registered");
}

// Register temporal reasoning API routes
if (temporalReasoningAPI) {
  server.register(temporalReasoningAPI.getRouter(), { prefix: "/temporal" });
  console.log("⏰ Temporal Reasoning API routes registered");
}

// Register federated search API routes
if (federatedSearchAPI) {
  server.register(federatedSearchAPI.getRouter(), { prefix: "/federated" });
  console.log("🔍 Federated Search API routes registered");
}

// Register workspace API routes
if (workspaceAPI) {
  server.register(workspaceAPI.getRouter(), { prefix: "/workspaces" });
  console.log("📁 Workspace Manager API routes registered");
}

// Start server
async function start() {
  try {
    console.log("🔧 Starting Obsidian RAG Server...");
    console.log(`🌐 Host: ${HOST}`);
    console.log(
      `🗄️  Database: ${DATABASE_URL ? "Configured" : "NOT CONFIGURED"}`
    );
    console.log(`🤖 Embedding: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSION}d)`);
    console.log(`🧠 LLM: ${LLM_MODEL}`);
    console.log(`📁 Obsidian Vault: ${OBSIDIAN_VAULT_PATH}`);

    await initializeServices();

    // Find an available port dynamically
    const PORT = await findAvailablePort(DEFAULT_PORT);
    console.log(`📡 Starting on port: ${PORT}`);

    await server.listen({ port: PORT, host: HOST });

    // Initialize WebSocket server
    wsManager.initialize(server.server);

    console.log("\n" + "=".repeat(60));
    console.log("🚀 Obsidian RAG API server is running!");
    console.log("=".repeat(60));
    console.log(`📡 Server: http://${HOST}:${PORT}`);
    console.log(`📡 WebSocket: ws://${HOST}:${PORT}`);
    console.log(`📚 API Documentation: http://${HOST}:${PORT}/docs`);
    console.log(`🔍 Health check: http://${HOST}:${PORT}/health`);
    console.log(`🔍 Search endpoint: http://${HOST}:${PORT}/search`);
    console.log(`💬 Chat endpoint: http://${HOST}:${PORT}/chat`);
    console.log(`💬 Chat history: http://${HOST}:${PORT}/chat/history`);
    console.log(`💬 Save chat: http://${HOST}:${PORT}/chat/save`);
    console.log(`💬 Load chat: http://${HOST}:${PORT}/chat/session/:id`);
    console.log(`💬 Delete chat: http://${HOST}:${PORT}/chat/session/:id`);
    console.log(`🌐 Web search: http://${HOST}:${PORT}/search/web`);
    console.log(`🔍 Enhanced search: http://${HOST}:${PORT}/search/enhanced`);
    console.log(`🔍 Context search: http://${HOST}:${PORT}/search/context`);
    console.log(
      `🔍 Chat sessions search: http://${HOST}:${PORT}/search/chat-sessions`
    );
    console.log(`🔍 Combined search: http://${HOST}:${PORT}/search/combined`);
    console.log(`🕸️  Context graph: http://${HOST}:${PORT}/graph/context`);
    console.log(
      `💡 Context suggestions: http://${HOST}:${PORT}/context/suggestions`
    );
    console.log(`🧠 Models endpoint: http://${HOST}:${PORT}/models`);
    console.log(`📥 Ingestion endpoint: http://${HOST}:${PORT}/ingest`);
    console.log(
      `📥 Incremental ingestion: http://${HOST}:${PORT}/ingest/incremental`
    );
    console.log(`📄 File status: http://${HOST}:${PORT}/files/status/:path`);
    console.log(`📄 Changed files: http://${HOST}:${PORT}/files/changed`);
    console.log(
      `📄 File versions: http://${HOST}:${PORT}/files/versions/:path`
    );
    console.log(
      `📄 Rollback file: http://${HOST}:${PORT}/files/rollback/:path`
    );
    console.log(`📄 Conflict status: http://${HOST}:${PORT}/files/conflicts`);
    console.log(`📊 Statistics: http://${HOST}:${PORT}/stats`);
    console.log(`🕸️  Graph data: http://${HOST}:${PORT}/graph`);
    console.log(`📚 Dictionary API: http://${HOST}:${PORT}/dictionary`);
    console.log(
      `📚 Dictionary Health: http://${HOST}:${PORT}/dictionary/health`
    );
    console.log(
      `📚 Dictionary Lookup: http://${HOST}:${PORT}/dictionary/lookup`
    );
    console.log(
      `📚 Entity Canonicalization: http://${HOST}:${PORT}/dictionary/canonicalize`
    );
    console.log(
      `📚 Search Expansion: http://${HOST}:${PORT}/dictionary/expand`
    );
    console.log(
      `🤖 ML Entity Extraction: http://${HOST}:${PORT}/ml/entities/extract`
    );
    console.log(
      `🤖 ML Entity Linking: http://${HOST}:${PORT}/ml/entities/link`
    );
    console.log(
      `🤖 ML Relationships: http://${HOST}:${PORT}/ml/entities/relationships`
    );
    console.log(
      `🤖 ML Health Check: http://${HOST}:${PORT}/ml/entities/health`
    );
    console.log(`🤖 ML Metrics: http://${HOST}:${PORT}/ml/entities/metrics`);
    console.log(`🤖 ML Models: http://${HOST}:${PORT}/ml/entities/models`);
    console.log(
      `⏰ Causality Analysis: http://${HOST}:${PORT}/temporal/causality/analyze`
    );
    console.log(
      `⏰ Trend Analysis: http://${HOST}:${PORT}/temporal/trends/analyze`
    );
    console.log(
      `⏰ Change Detection: http://${HOST}:${PORT}/temporal/changes/detect`
    );
    console.log(`⏰ Temporal Queries: http://${HOST}:${PORT}/temporal/query`);
    console.log(`⏰ Temporal Health: http://${HOST}:${PORT}/temporal/health`);
    console.log(`⏰ Temporal Status: http://${HOST}:${PORT}/temporal/status`);
    console.log(`🔍 Federated Search: http://${HOST}:${PORT}/federated/search`);
    console.log(
      `🔍 System Management: http://${HOST}:${PORT}/federated/systems`
    );
    console.log(`🔍 System Health: http://${HOST}:${PORT}/federated/health`);
    console.log(`🔍 System Status: http://${HOST}:${PORT}/federated/status`);
    console.log(`📁 Workspace Management: http://${HOST}:${PORT}/workspaces/workspaces`);
    console.log(`📁 Data Sources: http://${HOST}:${PORT}/workspaces/:workspace/datasources`);
    console.log(`📁 Entity Resolution: http://${HOST}:${PORT}/workspaces/:workspace/resolve/:entity`);
    console.log(`📁 Cross-Workspace Search: http://${HOST}:${PORT}/workspaces/search`);
    console.log(`📁 Workspace Health: http://${HOST}:${PORT}/workspaces/health`);
    console.log(`📁 Workspace Status: http://${HOST}:${PORT}/workspaces/status`);
    console.log("=".repeat(60));

    // Log helpful setup instructions if needed
    if (!DATABASE_URL) {
      console.log("\n⚠️  Setup Required:");
      console.log("   1. Set DATABASE_URL in .env file");
      console.log("   2. Ensure PostgreSQL is running");
      console.log("   3. Run: npm run setup");
    }
  } catch (error: any) {
    console.error("\n❌ Failed to start server:", error.message);

    if (error.message.includes("DATABASE_URL")) {
      console.error("\n💡 Fix: Set DATABASE_URL in .env file");
      console.error(
        "   Example: DATABASE_URL=postgresql://user:pass@localhost:5432/obsidian_rag"
      );
    } else if (error.message.includes("PostgreSQL")) {
      console.error("\n💡 Fix: Make sure PostgreSQL is running");
      console.error("   1. Install PostgreSQL");
      console.error("   2. Start PostgreSQL service");
      console.error("   3. Create database: obsidian_rag");
    } else if (error.message.includes("Ollama")) {
      console.error("\n💡 Fix: Set up Ollama embedding service");
      console.error("   1. Install Ollama: https://ollama.com");
      console.error("   2. Start Ollama: ollama serve");
      console.error("   3. Pull model: ollama pull embeddinggemma");
    } else if (error.message.includes("Obsidian Vault")) {
      console.error(
        "\n💡 Fix: Set OBSIDIAN_VAULT_PATH to a valid Obsidian vault directory"
      );
    }

    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start the server
start();
