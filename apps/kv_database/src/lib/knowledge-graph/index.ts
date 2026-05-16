/**
 * Knowledge Graph Module — server-layer wiring
 *
 * Re-exports the tool-neutral knowledge graph primitives from @kv/knowledge-graph
 * and adds the server-layer integration (HybridSearchEngine, MonitoringSystem,
 * GraphQL API, pipeline, integration) that depends on this app's database and
 * embedding service.
 */

// Re-export everything from the extracted package
export {
  KnowledgeGraphEntityExtractor,
  EntityType,
  RelationshipType,
  ExtractionMethod,
  type KnowledgeGraphEntity,
  type KnowledgeGraphRelationship,
  type EntityExtractionResult,
  type EntityExtractionConfig,
  type EntityMention,
  KnowledgeGraph,
  type EntitySimilarity,
  type GraphStatistics,
  type EntityDeduplicationResult,
  MultiHopReasoningEngine,
  type ReasoningQuery,
  type ReasoningResult,
  type ReasoningPath,
  ProvenanceTracker,
  type ProvenanceRecord,
  QueryOptimizer,
  ResultRankingEngine,
  type RankedSearchResult,
  type RankingConfig,
  type SearchQuery,
  type SearchResult,
  type SearchResultMetadata,
  type EntityReference,
  type RelationshipReference,
  type SearchExplanation,
  type TraversalPath,
  type ReasoningStep,
  type HybridSearchConfig,
  type SearchMetrics,
} from "@kv/knowledge-graph";

// Server-layer pieces that depend on this app's embeddings/database/ingestion
export { HybridSearchEngine } from "./hybrid-search-engine.js";
export { MonitoringSystem } from "./monitoring-system.js";
export {
  KnowledgeGraphPipeline,
  type KnowledgeGraphPipelineConfig,
  type PipelineProcessingResult,
  type ChunkProcessingInput,
} from "./knowledge-graph-pipeline.js";
export { KnowledgeGraphIntegration } from "./integration.js";
export {
  createGraphQLSchema,
  createGraphQLContext,
  setupGraphQLServer,
  type GraphQLContext,
} from "./graphql-api.js";

/**
 * Quick start factory function for knowledge graph integration
 */
import type { KnowledgeGraphPipelineConfig } from "./knowledge-graph-pipeline.js";
import { KnowledgeGraphPipeline } from "./knowledge-graph-pipeline.js";
import { KnowledgeGraph } from "@kv/knowledge-graph";

export async function createKnowledgeGraphSystem(
  database: any, // DocumentDatabase
  embeddings: any, // DocumentEmbeddingService
  config: Partial<KnowledgeGraphPipelineConfig> = {}
) {
  try {
    const pipeline = new KnowledgeGraphPipeline(
      database.pool || database,
      embeddings,
      config
    );

    const knowledgeGraph = new KnowledgeGraph(
      database.pool || database,
      embeddings,
      config.knowledgeGraph || {}
    );

    console.log("✅ Knowledge Graph System initialized successfully");

    return {
      pipeline,
      knowledgeGraph,

      async processAllUnprocessed() {
        return await pipeline.processExistingChunks();
      },

      async getStatistics() {
        return await pipeline.getStatistics();
      },

      async validateConsistency() {
        return await pipeline.validateConsistency();
      },

      async bootstrap(_options = {}) {
        try {
          console.log("🔄 Bootstrapping knowledge graph from existing data...");
          const result = await pipeline.processExistingChunks();
          console.log(
            `✅ Bootstrap completed: ${result.processedChunks} chunks processed`
          );
          return {
            success: true,
            processedChunks: result.processedChunks,
            entitiesCreated: result.entitiesCreated || 0,
            relationshipsCreated: result.relationshipsCreated || 0,
            message: "Bootstrap completed successfully",
          };
        } catch (error) {
          console.error("❌ Bootstrap failed:", error);
          return {
            success: false,
            message: `Bootstrap failed: ${error}`,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },

      async getEntityExtractor() {
        return pipeline.entityExtractor;
      },

      async getGraphManager() {
        return knowledgeGraph;
      },

      async getConfig() {
        return pipeline.config;
      },
    };
  } catch (error) {
    console.error("❌ Failed to create Knowledge Graph System:", error);
    throw new Error(`Knowledge Graph System initialization failed: ${error}`);
  }
}

/**
 * Configuration presets for different use cases
 */
export const KnowledgeGraphPresets = {
  HIGH_ACCURACY: {
    entityExtraction: {
      minEntityConfidence: 0.85,
      minRelationshipConfidence: 0.7,
      enableCooccurrenceAnalysis: true,
      contextWindowSize: 300,
    },
    knowledgeGraph: {
      similarityThreshold: 0.9,
      enableAutoMerge: false,
    },
    processing: {
      batchSize: 5,
      maxConcurrentExtractions: 2,
    },
  },
  BALANCED: {
    entityExtraction: {
      minEntityConfidence: 0.7,
      minRelationshipConfidence: 0.5,
      enableCooccurrenceAnalysis: true,
      contextWindowSize: 200,
    },
    knowledgeGraph: {
      similarityThreshold: 0.8,
      enableAutoMerge: false,
    },
    processing: {
      batchSize: 10,
      maxConcurrentExtractions: 3,
    },
  },
  HIGH_COVERAGE: {
    entityExtraction: {
      minEntityConfidence: 0.6,
      minRelationshipConfidence: 0.4,
      enableCooccurrenceAnalysis: true,
      contextWindowSize: 150,
      maxEntitiesPerChunk: 100,
    },
    knowledgeGraph: {
      similarityThreshold: 0.7,
      enableAutoMerge: true,
    },
    processing: {
      batchSize: 20,
      maxConcurrentExtractions: 5,
    },
  },
  PERFORMANCE: {
    entityExtraction: {
      minEntityConfidence: 0.75,
      minRelationshipConfidence: 0.6,
      enableCooccurrenceAnalysis: false,
      contextWindowSize: 100,
      maxEntitiesPerChunk: 25,
    },
    knowledgeGraph: {
      similarityThreshold: 0.85,
      enableAutoMerge: true,
    },
    processing: {
      batchSize: 50,
      maxConcurrentExtractions: 10,
    },
  },
};

export const KnowledgeGraphUtils = {
  validateEntityConfig(
    config: Partial<
      import("@kv/knowledge-graph").EntityExtractionConfig
    >
  ): boolean {
    if (
      config.minEntityConfidence &&
      (config.minEntityConfidence < 0 || config.minEntityConfidence > 1)
    ) {
      return false;
    }
    if (
      config.minRelationshipConfidence &&
      (config.minRelationshipConfidence < 0 ||
        config.minRelationshipConfidence > 1)
    ) {
      return false;
    }
    return true;
  },

  calculateOptimalBatchSize(
    availableMemoryMB: number,
    _avgChunkSizeKB: number
  ): number {
    const memoryPerChunk = 10;
    const maxConcurrentChunks = Math.floor(
      (availableMemoryMB * 0.3) / memoryPerChunk
    );
    return Math.max(5, Math.min(50, maxConcurrentChunks));
  },

  estimateProcessingTime(
    chunkCount: number,
    avgChunkSize: number
  ): {
    estimatedMinutes: number;
    confidence: "low" | "medium" | "high";
  } {
    const baseTimePerChunk =
      avgChunkSize < 1000 ? 0.5 : avgChunkSize < 5000 ? 2 : 5;
    const totalSeconds = chunkCount * baseTimePerChunk;

    return {
      estimatedMinutes: Math.ceil(totalSeconds / 60),
      confidence:
        chunkCount < 100 ? "high" : chunkCount < 1000 ? "medium" : "low",
    };
  },
};

export const KNOWLEDGE_GRAPH_VERSION = "1.0.0";
export const SCHEMA_VERSION = "001";

export const EXPERIMENTAL_FEATURES = {
  ADVANCED_RELATIONSHIP_INFERENCE: false,
  GRAPH_NEURAL_NETWORKS: false,
  TEMPORAL_RELATIONSHIPS: false,
  MULTI_LANGUAGE_ENTITIES: false,
} as const;
