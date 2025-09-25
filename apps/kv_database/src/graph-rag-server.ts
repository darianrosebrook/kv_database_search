// Graph RAG API Server - Integration with existing backend
import express from "express";
import cors from "cors";
import { Pool } from "pg";
import {
  HybridSearchEngine,
  MultiHopReasoningEngine,
  ResultRankingService,
  KnowledgeGraphManager,
  EntityExtractor,
  ProvenanceTracker,
  QueryOptimizer,
  MonitoringSystem,
  GraphRagApiServer,
} from "./lib/knowledge-graph/index.js";
import { EmbeddingService } from "./lib/embeddings.js";
import { DatabaseService } from "./lib/database.js";

const app = express();
const port = process.env.GRAPH_RAG_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "obsidian_rag",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
});

// Initialize services
let hybridSearchEngine: HybridSearchEngine;
let reasoningEngine: MultiHopReasoningEngine;
let rankingService: ResultRankingService;
let knowledgeGraphManager: KnowledgeGraphManager;
let entityExtractor: EntityExtractor;
let provenanceTracker: ProvenanceTracker;
let queryOptimizer: QueryOptimizer;
let monitoringSystem: MonitoringSystem;
let graphRagApiServer: GraphRagApiServer;
let embeddingService: EmbeddingService;
let databaseService: DatabaseService;

async function initializeServices() {
  try {
    console.log("🚀 Initializing Graph RAG services...");

    // Initialize core services
    embeddingService = new EmbeddingService();
    databaseService = new DatabaseService(pool);

    // Initialize Graph RAG components
    knowledgeGraphManager = new KnowledgeGraphManager(pool, embeddingService);
    entityExtractor = new EntityExtractor();
    hybridSearchEngine = new HybridSearchEngine(
      pool,
      embeddingService,
      knowledgeGraphManager
    );
    reasoningEngine = new MultiHopReasoningEngine(knowledgeGraphManager);
    rankingService = new ResultRankingService();
    provenanceTracker = new ProvenanceTracker(pool);
    queryOptimizer = new QueryOptimizer(pool, knowledgeGraphManager);
    monitoringSystem = new MonitoringSystem(pool);

    // Initialize Graph RAG API server
    graphRagApiServer = new GraphRagApiServer(
      hybridSearchEngine,
      reasoningEngine,
      rankingService,
      knowledgeGraphManager,
      provenanceTracker,
      queryOptimizer,
      monitoringSystem
    );

    console.log("✅ Graph RAG services initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Graph RAG services:", error);
    throw error;
  }
}

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const health = (await monitoringSystem?.checkHealth()) || {
      status: "unknown",
      checks: {},
      summary: { total: 0, healthy: 0, degraded: 0, unhealthy: 1 },
    };

    res.json({
      status: health.summary.unhealthy === 0 ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        database: health.checks.database?.status || "unknown",
        knowledgeGraph: health.checks.knowledge_graph?.status || "unknown",
        graphRagSearch: health.checks.graph_rag_search?.status || "unknown",
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Graph RAG API endpoints
app.post("/api/graph-rag/search", async (req, res) => {
  try {
    if (!graphRagApiServer) {
      throw new Error("Graph RAG services not initialized");
    }

    const result = await graphRagApiServer.search(req.body);
    res.json(result);
  } catch (error) {
    console.error("Graph RAG search error:", error);
    res.status(500).json({
      error: "Search failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/api/graph-rag/reasoning", async (req, res) => {
  try {
    if (!graphRagApiServer) {
      throw new Error("Graph RAG services not initialized");
    }

    const result = await graphRagApiServer.reason(req.body);
    res.json(result);
  } catch (error) {
    console.error("Graph RAG reasoning error:", error);
    res.status(500).json({
      error: "Reasoning failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/api/graph-rag/entities", async (req, res) => {
  try {
    if (!graphRagApiServer) {
      throw new Error("Graph RAG services not initialized");
    }

    const result = await graphRagApiServer.getEntities(req.query);
    res.json(result);
  } catch (error) {
    console.error("Get entities error:", error);
    res.status(500).json({
      error: "Failed to get entities",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/api/graph-rag/relationships", async (req, res) => {
  try {
    if (!graphRagApiServer) {
      throw new Error("Graph RAG services not initialized");
    }

    const result = await graphRagApiServer.getRelationships(req.query);
    res.json(result);
  } catch (error) {
    console.error("Get relationships error:", error);
    res.status(500).json({
      error: "Failed to get relationships",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/api/graph-rag/statistics", async (req, res) => {
  try {
    if (!graphRagApiServer) {
      throw new Error("Graph RAG services not initialized");
    }

    const result = await graphRagApiServer.getStatistics();
    res.json(result);
  } catch (error) {
    console.error("Get statistics error:", error);
    res.status(500).json({
      error: "Failed to get statistics",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/api/graph-rag/provenance", async (req, res) => {
  try {
    if (!provenanceTracker) {
      throw new Error("Provenance tracker not initialized");
    }

    const result = await provenanceTracker.getProvenanceTrail(
      req.query.entityId as string,
      req.query.sessionId as string
    );
    res.json({ records: result });
  } catch (error) {
    console.error("Get provenance error:", error);
    res.status(500).json({
      error: "Failed to get provenance",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/api/graph-rag/entities/similar", async (req, res) => {
  try {
    if (!knowledgeGraphManager) {
      throw new Error("Knowledge graph manager not initialized");
    }

    const nodeId = req.query.nodeId as string;
    const threshold = parseFloat(req.query.threshold as string) || 0.7;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!nodeId) {
      return res.status(400).json({ error: "nodeId parameter is required" });
    }

    const similarNodes = await knowledgeGraphManager.findSimilarNodes(
      nodeId,
      threshold
    );
    const entities = similarNodes.slice(0, limit);

    res.json({ entities });
  } catch (error) {
    console.error("Find similar entities error:", error);
    res.status(500).json({
      error: "Failed to find similar entities",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/api/graph-rag/entities/shortest-path", async (req, res) => {
  try {
    if (!reasoningEngine) {
      throw new Error("Reasoning engine not initialized");
    }

    const startNodeId = req.query.startNodeId as string;
    const endNodeId = req.query.endNodeId as string;
    const maxDepth = parseInt(req.query.maxDepth as string) || 6;

    if (!startNodeId || !endNodeId) {
      return res.status(400).json({
        error: "Both startNodeId and endNodeId parameters are required",
      });
    }

    // Use reasoning engine to find path
    const reasoningResult = await reasoningEngine.reason({
      startEntities: [startNodeId],
      targetEntities: [endNodeId],
      question: `Find the shortest path between these entities`,
      maxDepth,
      minConfidence: 0.1,
      reasoningType: "targeted",
    });

    const shortestPath = reasoningResult.bestPath || null;
    res.json(shortestPath);
  } catch (error) {
    console.error("Find shortest path error:", error);
    res.status(500).json({
      error: "Failed to find shortest path",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Error handling middleware
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
);

// Start server
async function startServer() {
  try {
    await initializeServices();

    app.listen(port, () => {
      console.log(`🚀 Graph RAG API server running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(
        `🔍 Search API: http://localhost:${port}/api/graph-rag/search`
      );
      console.log(
        `🧠 Reasoning API: http://localhost:${port}/api/graph-rag/reasoning`
      );
    });
  } catch (error) {
    console.error("❌ Failed to start Graph RAG server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Shutting down Graph RAG server...");
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("🛑 Shutting down Graph RAG server...");
  await pool.end();
  process.exit(0);
});

// Start the server
if (require.main === module) {
  startServer().catch(console.error);
}

export { app, startServer };
