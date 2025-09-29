/**
 * Graph RAG Server Bootstrap
 *
 * Initializes all services and starts the Graph RAG microservice.
 * Uses dependency injection for clean service management.
 */

import express from "express";
import cors from "cors";
import { DependencyContainer } from "../lib/shared";
import { DatabaseFactory } from "../lib/shared/database-factory";
import { GraphRagServiceFactory } from "../lib/shared/graph-rag-factory";
import { config, LoggerFactory } from "../lib/shared";
import { createRoutes } from "./routes";

export class GraphRagServerBootstrap {
  private container: DependencyContainer;
  private logger = LoggerFactory.createConsole("GraphRagServer", "info");
  private app: express.Application;

  constructor() {
    this.container = new DependencyContainer();
    this.app = express();
  }

  /**
   * Initialize all services
   */
  async initializeServices(): Promise<void> {
    try {
      this.logger.info("🚀 Initializing Graph RAG services...");

      // Get configuration
      const dbConfig = config.getDatabaseConfig();
      const embeddingConfig = config.getEmbeddingConfig();
      const graphRagConfig = config.getGraphRagConfig();

      // Initialize database services
      const databaseFactory = new DatabaseFactory(this.container, this.logger);
      const { pool } = await databaseFactory.createDatabaseServices(dbConfig);

      // Initialize embedding service
      const { ObsidianEmbeddingService } = await import("../lib/embeddings");
      const embeddingService = new ObsidianEmbeddingService({
        model: embeddingConfig.model,
        dimension: embeddingConfig.dimension,
        baseUrl: embeddingConfig.baseUrl,
      });

      // Initialize Graph RAG services
      const graphRagFactory = new GraphRagServiceFactory(
        this.container,
        this.logger
      );
      await graphRagFactory.initializeServices(
        pool,
        embeddingService,
        dbConfig,
        embeddingConfig
      );

      this.logger.info("✅ Graph RAG services initialized successfully");
    } catch (error) {
      this.logger.error("❌ Failed to initialize Graph RAG services", error);
      throw error;
    }
  }

  /**
   * Configure Express middleware
   */
  private configureMiddleware(): void {
    const graphRagConfig = config.getGraphRagConfig();

    // CORS configuration
    this.app.use(
      cors({
        origin: graphRagConfig.corsOrigins,
        credentials: true,
      })
    );

    // Body parsing
    this.app.use(express.json({ limit: graphRagConfig.maxRequestSize }));

    // Request logging
    this.app.use((req, res, next) => {
      this.logger.debug(`${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Configure routes
   */
  private configureRoutes(): void {
    // Create and mount routes
    const routes = createRoutes(this.container);
    this.app.use("/", routes);

    // Error handling middleware
    this.app.use(
      (
        error: Error | unknown,
        req: express.Request,
        res: express.Response,
        _: express.NextFunction
      ) => {
        this.logger.error("Unhandled error:", error);
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    );
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      const graphRagConfig = config.getGraphRagConfig();

      // Initialize services
      await this.initializeServices();

      // Configure middleware and routes
      this.configureMiddleware();
      this.configureRoutes();

      // Start server
      const server = this.app.listen(
        graphRagConfig.port,
        graphRagConfig.host,
        () => {
          this.logger.info(
            `🚀 Graph RAG API server running on port ${graphRagConfig.port}`
          );
          this.logger.info(
            `📊 Health check: http://${graphRagConfig.host}:${graphRagConfig.port}/health`
          );
          this.logger.info(
            `🔍 Search API: http://${graphRagConfig.host}:${graphRagConfig.port}/api/graph-rag/search`
          );
          this.logger.info(
            `🧠 Reasoning API: http://${graphRagConfig.host}:${graphRagConfig.port}/api/graph-rag/reasoning`
          );
        }
      );

      // Graceful shutdown
      this.setupGracefulShutdown(server);
    } catch (error) {
      this.logger.error("❌ Failed to start Graph RAG server", error);
      throw error;
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(server: any): void {
    const shutdown = async () => {
      this.logger.info("🛑 Shutting down Graph RAG server...");

      // Close database connections
      try {
        const databaseFactory = new DatabaseFactory(
          this.container,
          this.logger
        );
        await databaseFactory.closeConnections();
      } catch (error) {
        this.logger.error("Error during database shutdown", error);
      }

      server.close(() => {
        this.logger.info("✅ Graph RAG server shut down gracefully");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }

  /**
   * Get the Express app instance
   */
  getApp(): express.Application {
    return this.app;
  }

  /**
   * Get the dependency container
   */
  getContainer(): DependencyContainer {
    return this.container;
  }
}

/**
 * Factory function to create and start the server
 */
export async function createGraphRagServer(): Promise<GraphRagServerBootstrap> {
  const bootstrap = new GraphRagServerBootstrap();
  await bootstrap.start();
  return bootstrap;
}
