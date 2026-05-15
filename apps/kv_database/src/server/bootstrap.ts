/**
 * Server Bootstrap
 *
 * Handles service initialization and Fastify server setup.
 * Uses dependency injection for clean service management.
 */

import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { config as dotenvConfig } from "dotenv";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import { config, LoggerFactory } from "../lib/shared";
import { ObsidianDatabase } from "../lib/database";
import { ObsidianEmbeddingService } from "../lib/embeddings";
import { ObsidianSearchService } from "../lib/obsidian-search";
import { ObsidianIngestionPipeline } from "../lib/obsidian-ingest";
import { WebSearchService } from "../lib/web-search";
import { ContextManager } from "../lib/context-manager";
import { DictionaryAPI } from "../lib/dictionary-api";
import { DictionaryService } from "../lib/dictionary-service";
import { MLEntityAPI } from "../lib/ml-entity-api";
import { TemporalReasoningAPI } from "../lib/temporal-reasoning-api";
import { FederatedSearchAPI } from "../lib/federated-search-api";
import { WorkspaceAPI } from "../lib/workspace-api";
import { WorkspaceManager as WorkspaceManagerService } from "../lib/workspace-manager";
import { GraphQueryAPI } from "../lib/graph-query-api";
import { GraphRagClient } from "../lib/shared/graph-rag-client";
import { ComprehensiveSearchService } from "../lib/comprehensive-search-service";

// Load environment variables
dotenvConfig();

// Environment variables
const {
  DATABASE_URL,
  EMBEDDING_MODEL = "embeddinggemma",
  EMBEDDING_DIMENSION = 768,
  LLM_MODEL = "llama3.1",
  OBSIDIAN_VAULT_PATH,
  HOST = "localhost",
  DEFAULT_PORT = 3001,
} = process.env;

// Use PORT environment variable if provided, otherwise use DEFAULT_PORT
const TARGET_PORT = process.env.PORT
  ? parseInt(process.env.PORT)
  : DEFAULT_PORT;

// Service container interface
interface AppServices {
  database: ObsidianDatabase;
  embeddingService: ObsidianEmbeddingService;
  searchService: ObsidianSearchService;
  comprehensiveSearchService?: ComprehensiveSearchService;
  // ingestionPipeline: ObsidianIngestionPipeline;
  webSearchService?: WebSearchService;
  contextManager?: ContextManager;
  dictionaryAPI?: DictionaryAPI;
  mlEntityAPI?: MLEntityAPI;
  temporalReasoningAPI?: TemporalReasoningAPI;
  federatedSearchAPI?: FederatedSearchAPI;
  workspaceAPI?: WorkspaceAPI;
  workspaceManager?: WorkspaceManagerService;
  graphQueryAPI?: GraphQueryAPI;
  graphRagClient?: GraphRagClient;
}

// Extend Fastify instance with services
declare module "fastify" {
  interface FastifyInstance {
    services: AppServices;
  }
}

/**
 * Error handling helper
 */
const asError = (e: unknown): Error =>
  e instanceof Error ? e : new Error(String(e));

/**
 * Find an available port dynamically
 */
async function _findAvailablePort(startPort: number): Promise<number> {
  const { createServer } = await import("net");

  return new Promise((resolve) => {
    const server = createServer();

    server.listen(startPort, () => {
      const address = server.address() as { port: number };
      const port = address.port;
      server.close(() => resolve(port));
    });

    server.on("error", () => {
      // Port is in use, try next one
      resolve(_findAvailablePort(startPort + 1));
    });
  });
}

/**
 * Build all services and return a typed container
 */
async function buildServices(): Promise<AppServices> {
  console.log("🚀 Initializing Obsidian RAG services...");

  // Initialize database with better error handling
  let database: ObsidianDatabase;
  try {
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    database = new ObsidianDatabase(DATABASE_URL);
    await database.initialize();
    console.log("✅ Database initialized");
  } catch (e) {
    const error = asError(e);
    console.error("❌ Database initialization failed:", error.message);

    // Extract connection details for diagnostics
    let dbHost = "localhost";
    let dbPort = "5432";
    if (DATABASE_URL) {
      try {
        // eslint-disable-next-line no-undef
        const url = new URL(DATABASE_URL);
        dbHost = url.hostname;
        dbPort = url.port || "5432";
      } catch {
        const match = DATABASE_URL.match(/@([^:]+):(\d+)/);
        if (match) {
          dbHost = match[1];
          dbPort = match[2];
        }
      }
    }

    // Check if it's a connection refused error (handle AggregateError cases)
    const isConnectionRefused =
      error.message.includes("ECONNREFUSED") ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).code === "ECONNREFUSED" ||
      (e instanceof AggregateError &&
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       e.errors.some((err: any) => err.code === "ECONNREFUSED"));

    if (isConnectionRefused) {
      console.error(`\n🔍 Connection Diagnostics:`);
      console.error(`   Attempting to connect to: ${dbHost}:${dbPort}`);
      console.error(`   Error: Connection refused`);
      console.error(`\n💡 Troubleshooting steps:`);
      console.error(`   1. Check if PostgreSQL is running:`);
      console.error(`      pg_isready -h ${dbHost} -p ${dbPort}`);
      console.error(`   2. Verify the port in DATABASE_URL matches your PostgreSQL port`);
      console.error(`   3. Check PostgreSQL is listening on the correct port:`);
      console.error(`      lsof -i :${dbPort}`);
      if (dbPort !== "5432") {
        console.error(`\n⚠️  Note: You're using port ${dbPort}, but PostgreSQL default is 5432`);
        console.error(`   If PostgreSQL is running on 5432, update DATABASE_URL:`);
        console.error(`   DATABASE_URL=postgresql://user:pass@${dbHost}:5432/dbname`);
      }
    } else {
      console.error(
        "💡 Make sure PostgreSQL is running and DATABASE_URL is correct"
      );
      console.error(
        "💡 Example: postgresql://username:password@localhost:5432/obsidian_rag"
      );
    }
    throw error;
  }

  // Initialize embedding service with better error handling
  let embeddingService: ObsidianEmbeddingService;
  try {
    embeddingService = new ObsidianEmbeddingService({
      model: EMBEDDING_MODEL,
      dimension: parseInt(EMBEDDING_DIMENSION.toString()),
    });

    const embeddingTest = await embeddingService.testConnection();
    if (!embeddingTest.success) {
      throw new Error("Embedding service connection failed");
    }
    console.log(`✅ Embedding service ready (${embeddingTest.dimension}d)`);
  } catch (e) {
    const error = asError(e);
    console.error("❌ Embedding service initialization failed:", error.message);
    console.error("💡 Make sure Ollama is running and the model is available");
    console.error("💡 Install Ollama: https://ollama.com");
    console.error("💡 Pull model: ollama pull embeddinggemma");
    throw error;
  }

  // Initialize search service
  let searchService: ObsidianSearchService;
  try {
    searchService = new ObsidianSearchService(database, embeddingService);
    console.log("✅ Search service initialized");
  } catch (e) {
    const error = asError(e);
    console.error("❌ Search service initialization failed:", error.message);
    throw error;
  }

  // Initialize comprehensive search service (after dictionary service)
  let comprehensiveSearchService: ComprehensiveSearchService | undefined;
  try {
    comprehensiveSearchService = new ComprehensiveSearchService(
      database,
      embeddingService,
      dictionaryService
    );
    console.log("✅ Comprehensive search service initialized");
  } catch (e) {
    const error = asError(e);
    console.error(
      "❌ Comprehensive search service initialization failed:",
      error.message
    );
    console.error("💡 Dictionary-enhanced search features will be limited");
  }

  // Initialize ingestion pipeline
  let _ingestionPipeline: ObsidianIngestionPipeline;
  try {
    _ingestionPipeline = new ObsidianIngestionPipeline(
      database,
      embeddingService,
      OBSIDIAN_VAULT_PATH
    );
    console.log("✅ Ingestion pipeline initialized");
  } catch (e) {
    const error = asError(e);
    console.error(
      "❌ Ingestion pipeline initialization failed:",
      error.message
    );
    console.error(
      "💡 Make sure OBSIDIAN_VAULT_PATH points to a valid Obsidian vault"
    );
    // Don't throw - allow server to start with limited functionality
    ingestionPipeline = undefined;
  }

  // Initialize optional services
  let webSearchService: WebSearchService | undefined;
  let contextManager: ContextManager | undefined;
  let dictionaryAPI: DictionaryAPI | undefined;
  let dictionaryService: DictionaryService | undefined;
  let ingestionPipeline: ObsidianIngestionPipeline | undefined;
  let mlEntityAPI: MLEntityAPI | undefined;
  let temporalReasoningAPI: TemporalReasoningAPI | undefined;
  let federatedSearchAPI: FederatedSearchAPI | undefined;
  let workspaceAPI: WorkspaceAPI | undefined;
  let graphQueryAPI: GraphQueryAPI | undefined;
  let graphRagClient: GraphRagClient | undefined;

  // Initialize web search service
  try {
    webSearchService = new WebSearchService(embeddingService);
    console.log("✅ Web search service initialized");
  } catch (e) {
    const error = asError(e);
    console.error(
      "❌ Web search service initialization failed:",
      error.message
    );
    console.error("💡 Web search will use mock data");
  }

  // Initialize context manager
  try {
    contextManager = new ContextManager(database, embeddingService);
    console.log("✅ Context manager initialized");
  } catch (e) {
    const error = asError(e);
    console.error("❌ Context manager initialization failed:", error.message);
    console.error("💡 Context management features will be limited");
  }

  // Initialize dictionary service
  try {
    dictionaryAPI = new DictionaryAPI(database);
    await dictionaryAPI.initialize();
    dictionaryService = dictionaryAPI.getDictionaryService();
    console.log("✅ Dictionary service initialized");
  } catch (e) {
    const error = asError(e);
    console.error(
      "❌ Dictionary service initialization failed:",
      error.message
    );
    console.error("💡 Dictionary features will be limited");
  }

  // Initialize ML entity service
  try {
    mlEntityAPI = new MLEntityAPI(database);
    console.log("✅ ML entity service initialized");
  } catch (e) {
    const error = asError(e);
    console.error("❌ ML entity service initialization failed:", error.message);
    console.error("💡 ML entity features will be limited");
  }

  // Initialize temporal reasoning service
  try {
    temporalReasoningAPI = new TemporalReasoningAPI(database);
    console.log("✅ Temporal reasoning service initialized");
  } catch (e) {
    const error = asError(e);
    console.error(
      "❌ Temporal reasoning service initialization failed:",
      error.message
    );
    console.error("💡 Temporal reasoning features will be limited");
  }

  // Initialize federated search service
  try {
    federatedSearchAPI = new FederatedSearchAPI(database);
    console.log("✅ Federated search service initialized");
  } catch (e) {
    const error = asError(e);
    console.error(
      "❌ Federated search service initialization failed:",
      error.message
    );
    console.error("💡 Federated search features will be limited");
  }

  // Initialize workspace manager service
  try {
    workspaceAPI = new WorkspaceAPI(database);
    console.log("✅ Workspace manager service initialized");
  } catch (e) {
    const error = asError(e);
    console.error(
      "❌ Workspace manager service initialization failed:",
      error.message
    );
    console.error("💡 Workspace management features will be limited");
  }

  // Initialize workspace manager for Fastify routes
  let workspaceManager: WorkspaceManagerService | undefined;
  try {
    workspaceManager = new WorkspaceManagerService(database);
    console.log("✅ Workspace manager initialized");
  } catch (e) {
    const error = asError(e);
    console.error(
      "❌ Workspace manager initialization failed:",
      error.message
    );
  }

  // Initialize graph query engine service
  try {
    graphQueryAPI = new GraphQueryAPI(database);
    console.log("✅ Graph Query Engine service initialized");
  } catch (e) {
    const error = asError(e);
    console.error(
      "❌ Graph Query Engine service initialization failed:",
      error.message
    );
    console.error("💡 Graph query features will be limited");
  }

  // Initialize Graph RAG client
  try {
    const logger = LoggerFactory.createConsole("GraphRagClient", "info");
    graphRagClient = new GraphRagClient(config.getGraphRagConfig(), logger);
    console.log("✅ Graph RAG client initialized");
  } catch (e) {
    const error = asError(e);
    console.error("❌ Graph RAG client initialization failed:", error.message);
    console.error("💡 Graph RAG features will be limited");
  }

  // Initialize web search providers based on environment variables
  if (process.env.ENABLE_SEARXNG === "true") {
    const searxngUrl = process.env.SEARXNG_URL || "http://localhost:8888";
    if (webSearchService) {
      webSearchService.enableSearXNG(searxngUrl);
      console.log("🔍 SearXNG web search enabled");
    }
  }

  if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX) {
    if (webSearchService) {
      webSearchService.enableGoogleSearch(
        process.env.GOOGLE_SEARCH_API_KEY,
        process.env.GOOGLE_SEARCH_CX
      );
      console.log("🔍 Google Custom Search enabled");
    }
  }

  if (
    process.env.SERPER_API_KEY &&
    process.env.SERPER_API_KEY !== "YOUR_SERPER_API_KEY_HERE"
  ) {
    if (webSearchService) {
      webSearchService.enableSerper(process.env.SERPER_API_KEY);
      console.log("🔍 Serper web search enabled");
    }
  } else {
    console.log(
      "⚠️ Serper API key not configured. Web search will return empty results."
    );
  }

  return {
    database,
    embeddingService,
    searchService,
    comprehensiveSearchService,
    ingestionPipeline,
    webSearchService,
    contextManager,
    dictionaryAPI,
    mlEntityAPI,
    temporalReasoningAPI,
    federatedSearchAPI,
    workspaceAPI,
    workspaceManager,
    graphQueryAPI,
    graphRagClient,
  };
}

/**
 * Create and configure Fastify server
 */
export async function createServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: true,
  }).withTypeProvider<TypeBoxTypeProvider>();

  // Register CORS
  await server.register(cors, {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3005",
    ],
    credentials: true,
  });

  return server;
}

/**
 * Initialize server with services
 */
export async function initializeServer(server: FastifyInstance): Promise<void> {
  // Build services and decorate Fastify instance
  const services = await buildServices();
  server.decorate("services", services);
}

/**
 * Start the server
 */
export async function startServer(server: FastifyInstance): Promise<void> {
  try {
    console.log("🔧 Starting Obsidian RAG Server...");
    console.log(`🌐 Host: ${HOST}`);
    console.log(
      `🗄️ Database: ${DATABASE_URL ? "Configured" : "NOT CONFIGURED"}`
    );
    console.log(`🤖 Embedding: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSION}d)`);
    console.log(`🧠 LLM: ${LLM_MODEL}`);
    console.log(`📁 Obsidian Vault: ${OBSIDIAN_VAULT_PATH}`);

    // Use the target port (from PORT env var or default)
    const PORT = TARGET_PORT;
    console.log(`📡 Starting on port: ${PORT}`);

    await server.listen({ port: PORT, host: HOST });

    console.log("\n" + "=".repeat(60));
    console.log("🚀 Obsidian RAG API server is running!");
    console.log("=".repeat(60));
    console.log(`📡 Server: http://${HOST}:${PORT}`);
    console.log(`📡 WebSocket: ws://${HOST}:${PORT}`);
    console.log(`📚 API Documentation: http://${HOST}:${PORT}/docs`);

    // Log available endpoints
    console.log(`🔍 Health check: http://${HOST}:${PORT}/health`);
    console.log(`🔍 Search endpoint: http://${HOST}:${PORT}/search`);
    console.log(`📥 Ingestion endpoint: http://${HOST}:${PORT}/ingest`);
    console.log(`📁 Vault files: http://${HOST}:${PORT}/api/vault/files`);
    console.log(`📊 Statistics: http://${HOST}:${PORT}/stats`);
    console.log(`🧠 Models endpoint: http://${HOST}:${PORT}/models`);

    console.log("=".repeat(60));
    console.log(`🔍 Health check: http://${HOST}:${PORT}/health`);
    console.log(`🔍 Search endpoint: http://${HOST}:${PORT}/search`);

    if (!DATABASE_URL) {
      console.log("\n⚠️ Setup Required:");
      console.log("  1. Set DATABASE_URL in .env file");
      console.log("  2. Ensure PostgreSQL is running");
      console.log("  3. Run: npm run setup");
    }
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    throw error;
  }
}
