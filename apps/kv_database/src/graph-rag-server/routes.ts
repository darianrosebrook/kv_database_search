/**
 * Graph RAG API Routes
 *
 * Defines all HTTP routes for the Graph RAG microservice.
 * Uses dependency injection to access services.
 */

import express, { Request, Response, NextFunction } from "express";
import { DependencyContainer, SERVICE_TOKENS } from "../lib/shared";
import type { GraphRagApiServer } from "../lib/knowledge-graph/graph-rag-api";
import type { KnowledgeGraph } from "../lib/knowledge-graph/knowledge-graph-manager";
import type { MultiHopReasoningEngine } from "../lib/knowledge-graph/multi-hop-reasoning";
import type { ProvenanceTracker } from "../lib/knowledge-graph/provenance-tracker";

/**
 * Middleware to get services from container
 */
function getServices(container: DependencyContainer) {
  return {
    graphRagApiServer: container.get<GraphRagApiServer>(
      SERVICE_TOKENS.GRAPH_RAG_API_SERVER
    ),
    knowledgeGraph: container.get<KnowledgeGraph>(
      SERVICE_TOKENS.KNOWLEDGE_GRAPH
    ),
    reasoningEngine: container.get<MultiHopReasoningEngine>(
      SERVICE_TOKENS.MULTI_HOP_REASONING_ENGINE
    ),
    provenanceTracker: container.get<ProvenanceTracker>(
      SERVICE_TOKENS.PROVENANCE_TRACKER
    ),
  };
}

/**
 * Error handler middleware
 */
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Health check endpoint
 */
export function createHealthRoutes(container: DependencyContainer) {
  const healthRouter = express.Router();

  healthRouter.get("/health", async (req: Request, res: Response) => {
    try {
      const monitoringSystem = container.get(SERVICE_TOKENS.MONITORING_SYSTEM);
      const health = await monitoringSystem?.checkHealth();

      const response = {
        status: health?.summary.unhealthy === 0 ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        services: {
          database: health?.checks.database?.status || "unknown",
          knowledgeGraph: health?.checks.knowledge_graph?.status || "unknown",
          graphRagSearch: health?.checks.graph_rag_search?.status || "unknown",
        },
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return healthRouter;
}

/**
 * Graph RAG API routes
 */
export function createGraphRagRoutes(container: DependencyContainer) {
  const graphRagRouter = express.Router();
  const services = getServices(container);

  // Graph RAG search endpoint
  graphRagRouter.post(
    "/search",
    asyncHandler(async (req: Request, res: Response) => {
      if (!services.graphRagApiServer) {
        throw new Error("Graph RAG services not initialized");
      }

      const result = await services.graphRagApiServer.search(req.body);
      res.json(result);
    })
  );

  // Graph RAG reasoning endpoint
  graphRagRouter.post(
    "/reasoning",
    asyncHandler(async (req: Request, res: Response) => {
      if (!services.graphRagApiServer) {
        throw new Error("Graph RAG services not initialized");
      }

      const result = await services.graphRagApiServer.reason(req.body);
      res.json(result);
    })
  );

  // Get entities endpoint
  graphRagRouter.get(
    "/entities",
    asyncHandler(async (req: Request, res: Response) => {
      if (!services.graphRagApiServer) {
        throw new Error("Graph RAG services not initialized");
      }

      const result = await services.graphRagApiServer.getEntities(req.query);
      res.json(result);
    })
  );

  // Get relationships endpoint
  graphRagRouter.get(
    "/relationships",
    asyncHandler(async (req: Request, res: Response) => {
      if (!services.graphRagApiServer) {
        throw new Error("Graph RAG services not initialized");
      }

      const result = await services.graphRagApiServer.getRelationships(
        req.query
      );
      res.json(result);
    })
  );

  // Get statistics endpoint
  graphRagRouter.get(
    "/statistics",
    asyncHandler(async (req: Request, res: Response) => {
      if (!services.graphRagApiServer) {
        throw new Error("Graph RAG services not initialized");
      }

      const result = await services.graphRagApiServer.getStatistics();
      res.json(result);
    })
  );

  // Get provenance endpoint
  graphRagRouter.get(
    "/provenance",
    asyncHandler(async (req: Request, res: Response) => {
      if (!services.provenanceTracker) {
        throw new Error("Provenance tracker not initialized");
      }

      const result = await services.provenanceTracker.getProvenanceTrail(
        req.query.entityId as string,
        req.query.sessionId as string
      );
      res.json({ records: result });
    })
  );

  // Find similar entities endpoint
  graphRagRouter.get(
    "/entities/similar",
    asyncHandler(async (req: Request, res: Response) => {
      if (!services.knowledgeGraph) {
        throw new Error("Knowledge graph manager not initialized");
      }

      const nodeId = req.query.nodeId as string;
      const threshold = parseFloat(req.query.threshold as string) || 0.7;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!nodeId) {
        return res.status(400).json({ error: "nodeId parameter is required" });
      }

      const similarNodes = await services.knowledgeGraph.findSimilarNodes(
        nodeId,
        threshold
      );
      const entities = similarNodes.slice(0, limit);

      res.json({ entities });
    })
  );

  // Find shortest path endpoint
  graphRagRouter.get(
    "/entities/shortest-path",
    asyncHandler(async (req: Request, res: Response) => {
      if (!services.reasoningEngine) {
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
      const reasoningResult = await services.reasoningEngine.reason({
        startEntities: [startNodeId],
        targetEntities: [endNodeId],
        question: `Find the shortest path between these entities`,
        maxDepth,
        minConfidence: 0.1,
        reasoningType: "targeted",
      });

      const shortestPath = reasoningResult.bestPath || null;
      res.json(shortestPath);
    })
  );

  return graphRagRouter;
}

/**
 * Create all routes
 */
export function createRoutes(container: DependencyContainer) {
  const apiRouter = express.Router();

  // Mount health routes
  apiRouter.use("/", createHealthRoutes(container));

  // Mount Graph RAG API routes
  apiRouter.use("/api/graph-rag", createGraphRagRoutes(container));

  return apiRouter;
}
