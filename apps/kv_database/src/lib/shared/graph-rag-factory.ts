/**
 * Graph RAG Service Factory
 *
 * Provides centralized creation and initialization of Graph RAG services
 * with proper dependency injection and error handling.
 */

import { Pool } from "pg";
import { ObsidianEmbeddingService } from "../embeddings.js";
import {
  HybridSearchEngine,
  MultiHopReasoningEngine,
  ResultRankingEngine,
  KnowledgeGraph,
  ProvenanceTracker,
  QueryOptimizer,
  MonitoringSystem,
  // GraphRagApiServer, // Not implemented yet
} from "../knowledge-graph/index.js";
import { DependencyContainer, SERVICE_TOKENS } from "./dependency-container.js";
import { Logger } from "./logger.js";
import type { DatabaseConfig, EmbeddingConfig } from "./config.js";

export interface GraphRagServices {
  hybridSearchEngine: HybridSearchEngine;
  reasoningEngine: MultiHopReasoningEngine;
  rankingService: ResultRankingEngine;
  knowledgeGraph: KnowledgeGraph;
  provenanceTracker: ProvenanceTracker;
  queryOptimizer: QueryOptimizer;
  monitoringSystem: MonitoringSystem;
  // graphRagApiServer: GraphRagApiServer; // Not implemented yet
}

/**
 * Factory for creating and initializing Graph RAG services
 */
export class GraphRagServiceFactory {
  private container: DependencyContainer;
  private logger: Logger;

  constructor(container: DependencyContainer, logger: Logger) {
    this.container = container;
    this.logger = logger;
  }

  /**
   * Initialize all Graph RAG services with proper dependencies
   */
  async initializeServices(
    pool: Pool,
    embeddingService: ObsidianEmbeddingService,
    _dbConfig: DatabaseConfig,
    _embeddingConfig: EmbeddingConfig
  ): Promise<GraphRagServices> {
    try {
      this.logger.info("🚀 Initializing Graph RAG services...");

      // Initialize core services
      const knowledgeGraph = await this.createKnowledgeGraph(
        pool,
        embeddingService
      );
      const hybridSearchEngine = await this.createHybridSearchEngine(
        pool,
        embeddingService,
        knowledgeGraph
      );
      const reasoningEngine = await this.createReasoningEngine(pool);
      const rankingService = await this.createRankingService(pool);
      const provenanceTracker = await this.createProvenanceTracker(pool);
      const queryOptimizer = await this.createQueryOptimizer(pool);
      const monitoringSystem = await this.createMonitoringSystem(pool);

      // Initialize Graph RAG API server
      // const graphRagApiServer = await this.createGraphRagApiServer( // Not implemented yet
      //   hybridSearchEngine,
      //   reasoningEngine,
      //   rankingService,
      //   knowledgeGraph,
      //   provenanceTracker,
      //   queryOptimizer,
      //   monitoringSystem
      // );

      // Register services in container
      this.registerServices({
        hybridSearchEngine,
        reasoningEngine,
        rankingService,
        knowledgeGraph,
        provenanceTracker,
        queryOptimizer,
        monitoringSystem,
        // graphRagApiServer, // Not implemented yet
      });

      this.logger.info("✅ Graph RAG services initialized successfully");
      return {
        hybridSearchEngine,
        reasoningEngine,
        rankingService,
        knowledgeGraph,
        provenanceTracker,
        queryOptimizer,
        monitoringSystem,
        // graphRagApiServer, // Not implemented yet
      };
    } catch (error) {
      this.logger.error("❌ Failed to initialize Graph RAG services", error);
      throw new Error(`Graph RAG services initialization failed: ${error}`);
    }
  }

  private async createKnowledgeGraph(
    pool: Pool,
    embeddingService: ObsidianEmbeddingService
  ): Promise<KnowledgeGraph> {
    try {
      this.logger.info("📊 Creating Knowledge Graph...");
      const knowledgeGraph = new KnowledgeGraph(pool, embeddingService);
      await knowledgeGraph.initialize();
      this.logger.info("✅ Knowledge Graph created");
      return knowledgeGraph;
    } catch (error) {
      this.logger.error("❌ Failed to create Knowledge Graph", error);
      throw error;
    }
  }

  private async createHybridSearchEngine(
    pool: Pool,
    embeddingService: ObsidianEmbeddingService,
    knowledgeGraph: KnowledgeGraph
  ): Promise<HybridSearchEngine> {
    try {
      this.logger.info("🔍 Creating Hybrid Search Engine...");
      const hybridSearchEngine = new HybridSearchEngine(
        pool,
        embeddingService,
        {
          knowledgeGraph,
          enableSemanticExpansion: true,
          maxHops: 3,
        }
      );
      await hybridSearchEngine.initialize();
      this.logger.info("✅ Hybrid Search Engine created");
      return hybridSearchEngine;
    } catch (error) {
      this.logger.error("❌ Failed to create Hybrid Search Engine", error);
      throw error;
    }
  }

  private async createReasoningEngine(
    pool: Pool
  ): Promise<MultiHopReasoningEngine> {
    try {
      this.logger.info("🧠 Creating Multi-Hop Reasoning Engine...");
      const reasoningEngine = new MultiHopReasoningEngine(pool);
      await reasoningEngine.initialize();
      this.logger.info("✅ Multi-Hop Reasoning Engine created");
      return reasoningEngine;
    } catch (error) {
      this.logger.error(
        "❌ Failed to create Multi-Hop Reasoning Engine",
        error
      );
      throw error;
    }
  }

  private async createRankingService(pool: Pool): Promise<ResultRankingEngine> {
    try {
      this.logger.info("📊 Creating Result Ranking Engine...");
      const rankingService = new ResultRankingEngine(pool);
      await rankingService.initialize();
      this.logger.info("✅ Result Ranking Engine created");
      return rankingService;
    } catch (error) {
      this.logger.error("❌ Failed to create Result Ranking Engine", error);
      throw error;
    }
  }

  private async createProvenanceTracker(
    pool: Pool
  ): Promise<ProvenanceTracker> {
    try {
      this.logger.info("📋 Creating Provenance Tracker...");
      const provenanceTracker = new ProvenanceTracker(pool);
      await provenanceTracker.initialize();
      this.logger.info("✅ Provenance Tracker created");
      return provenanceTracker;
    } catch (error) {
      this.logger.error("❌ Failed to create Provenance Tracker", error);
      throw error;
    }
  }

  private async createQueryOptimizer(pool: Pool): Promise<QueryOptimizer> {
    try {
      this.logger.info("⚡ Creating Query Optimizer...");
      const queryOptimizer = new QueryOptimizer(pool);
      await queryOptimizer.initialize();
      this.logger.info("✅ Query Optimizer created");
      return queryOptimizer;
    } catch (error) {
      this.logger.error("❌ Failed to create Query Optimizer", error);
      throw error;
    }
  }

  private async createMonitoringSystem(pool: Pool): Promise<MonitoringSystem> {
    try {
      this.logger.info("📈 Creating Monitoring System...");
      const monitoringSystem = new MonitoringSystem(pool);
      await monitoringSystem.initialize();
      this.logger.info("✅ Monitoring System created");
      return monitoringSystem;
    } catch (error) {
      this.logger.error("❌ Failed to create Monitoring System", error);
      throw error;
    }
  }

  // private async createGraphRagApiServer( // Not implemented yet
  //   hybridSearchEngine: HybridSearchEngine,
  //   reasoningEngine: MultiHopReasoningEngine,
  //   rankingService: ResultRankingEngine,
  //   knowledgeGraph: KnowledgeGraph,
  //   provenanceTracker: ProvenanceTracker,
  //   queryOptimizer: QueryOptimizer,
  //   monitoringSystem: MonitoringSystem
  // ): Promise<GraphRagApiServer> {
  //   try {
  //     this.logger.info("🌐 Creating Graph RAG API Server...");
  //     const graphRagApiServer = new GraphRagApiServer(
  //       hybridSearchEngine,
  //       reasoningEngine,
  //       rankingService,
  //       knowledgeGraph,
  //       provenanceTracker,
  //       queryOptimizer,
  //       monitoringSystem
  //     );
  //     await graphRagApiServer.initialize();
  //     this.logger.info("✅ Graph RAG API Server created");
  //     return graphRagApiServer;
  //   } catch (error) {
  //     this.logger.error("❌ Failed to create Graph RAG API Server", error);
  //     throw error;
  //   }
  // }

  private registerServices(services: GraphRagServices): void {
    this.container.register(
      SERVICE_TOKENS.HYBRID_SEARCH_ENGINE,
      services.hybridSearchEngine
    );
    this.container.register(
      SERVICE_TOKENS.MULTI_HOP_REASONING_ENGINE,
      services.reasoningEngine
    );
    this.container.register(
      SERVICE_TOKENS.RESULT_RANKING_ENGINE,
      services.rankingService
    );
    this.container.register(
      SERVICE_TOKENS.KNOWLEDGE_GRAPH,
      services.knowledgeGraph
    );
    this.container.register(
      SERVICE_TOKENS.PROVENANCE_TRACKER,
      services.provenanceTracker
    );
    this.container.register(
      SERVICE_TOKENS.QUERY_OPTIMIZER,
      services.queryOptimizer
    );
    this.container.register(
      SERVICE_TOKENS.MONITORING_SYSTEM,
      services.monitoringSystem
    );
    this.container.register(
      SERVICE_TOKENS.GRAPH_RAG_API_SERVER,
      services.graphRagApiServer
    );
  }

  /**
   * Get a service from the container
   */
  getService<T>(token: string): T {
    return this.container.get<T>(token);
  }

  /**
   * Check if a service is available
   */
  hasService(token: string): boolean {
    return this.container.has(token);
  }
}
