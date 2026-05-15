/**
 * Health and Monitoring Routes
 *
 * Handles health checks, statistics, and monitoring endpoints.
 */

import { FastifyInstance } from "fastify";
import ollama from "ollama";
import type {
  HealthResponse,
  StatsResponse,
  ModelsResponse,
} from "../../types/index";

/**
 * Register health and monitoring routes
 */
export function registerHealthRoutes(server: FastifyInstance): void {
  /**
   * Health check endpoint
   */
  server.get("/health", async (request, reply): Promise<HealthResponse> => {
    const { database, embeddingService } = request.server.services;

    const health: HealthResponse = {
      status: "unknown",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      server: (() => {
        const addr = request.server.server.address();
        const info = typeof addr === "object" && addr !== null ? addr : null;
        return {
          port: info?.port ?? 3001,
          host: info?.address ?? "localhost",
        };
      })(),
      services: {
        database: "unknown",
        embeddings: "unknown",
        search: "unknown",
        ingestion: "unknown",
      },
    };

    try {
      // Check database connection
      try {
        await database.healthCheck();
        health.services.database = "healthy";
      } catch {
        health.services.database = "unhealthy";
      }

      // Check embedding service
      try {
        const embeddingTest = await embeddingService.testConnection();
        health.services.embeddings = embeddingTest.success
          ? "healthy"
          : "unhealthy";
      } catch {
        health.services.embeddings = "unhealthy";
      }

      // Check search service
      try {
        const { searchService } = request.server.services;
        if (searchService) {
          health.services.search = "healthy";
        } else {
          health.services.search = "unhealthy";
        }
      } catch {
        health.services.search = "unhealthy";
      }

      // Check ingestion pipeline
      try {
        const { ingestionPipeline } = request.server.services;
        if (ingestionPipeline) {
          health.services.ingestion = "healthy";
        } else {
          health.services.ingestion = "unhealthy";
        }
      } catch {
        health.services.ingestion = "unhealthy";
      }

      // Overall status
      const unhealthyServices = Object.values(health.services).filter(
        (status) => status === "unhealthy"
      );
      health.status = unhealthyServices.length === 0 ? "healthy" : "degraded";

      reply.code(200);
      return health;
    } catch (error) {
      console.error("Health check failed:", error);
      health.status = "unhealthy";
      reply.code(503);
      return health;
    }
  });

  /**
   * Statistics endpoint
   */
  server.get("/stats", async (request, reply): Promise<StatsResponse> => {
    const { database, searchService } = request.server.services;

    try {
      const stats: StatsResponse = {
        totalDocuments: 0,
        totalChunks: 0,
        totalEmbeddings: 0,
        indexSize: 0,
        lastUpdate: new Date().toISOString(),
        performance: {
          avgQueryTime: 0,
          totalQueries: 0,
          cacheHitRate: 0,
        },
        storage: {
          totalSize: 0,
          databaseSize: 0,
          indexSize: 0,
        },
      };

      // Get database statistics
      try {
        const dbStats = await database.getStats();
        stats.totalDocuments = dbStats.totalDocuments || 0;
        stats.totalChunks = dbStats.totalChunks || 0;
        stats.totalEmbeddings = dbStats.totalEmbeddings || 0;
        stats.indexSize = dbStats.indexSize || 0;
        stats.storage.databaseSize = dbStats.databaseSize || 0;
        stats.storage.totalSize = dbStats.totalSize || 0;
        if (dbStats.lastUpdated) {
          stats.lastUpdate = dbStats.lastUpdated;
        }
      } catch (error) {
        console.warn("Could not get database stats:", error);
      }

      // Get search performance stats
      try {
        if (searchService && typeof searchService.getStats === "function") {
          const searchStats = await searchService.getStats();
          stats.performance.avgQueryTime = searchStats.avgQueryTime || 0;
          stats.performance.totalQueries = searchStats.totalQueries || 0;
          stats.performance.cacheHitRate = searchStats.cacheHitRate || 0;
        }
      } catch (error) {
        console.warn("Could not get search stats:", error);
      }

      reply.code(200);
      return stats;
    } catch (e) {
      const error = e as Error;
      console.error("Stats failed:", error);
      reply.code(500);
      return {
        totalDocuments: 0,
        totalChunks: 0,
        totalEmbeddings: 0,
        indexSize: 0,
        lastUpdated: new Date().toISOString(),
        performance: {
          avgQueryTime: 0,
          totalQueries: 0,
          cacheHitRate: 0,
        },
        storage: {
          totalSize: 0,
          databaseSize: 0,
          indexSize: 0,
        },
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

      const response: ModelsResponse = {
        models: models.models.map((model) => ({
          name: model.name,
          size: model.size,
          modified: model.modified_at,
          digest: model.digest,
        })),
        total: models.models.length,
      };

      reply.code(200);
      return response;
    } catch (e) {
      const error = e as Error;
      console.error("Models endpoint failed:", error);
      reply.code(500);
      return {
        models: [],
        total: 0,
        error: error.message,
      };
    }
  });
}
