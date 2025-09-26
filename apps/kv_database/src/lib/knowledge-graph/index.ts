/**
 * Knowledge Graph Module for Graph RAG-Enhanced Semantic Search
 *
 * This module provides comprehensive knowledge graph construction and management
 * capabilities for multi-modal content, enabling hybrid vector + graph search
 * with explainable results and relationship provenance.
 */

// Core entity extraction and relationship inference
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
} from "./entity-extractor.js";

// Knowledge graph management and persistence
export {
  KnowledgeGraph,
  type EntitySimilarity,
  type GraphStatistics,
  type EntityDeduplicationResult,
} from "./knowledge-graph-manager.js";

// Processing pipeline for batch and real-time processing
export {
  KnowledgeGraphPipeline,
  type KnowledgeGraphPipelineConfig,
  type PipelineProcessingResult,
  type ChunkProcessingInput,
} from "./knowledge-graph-pipeline.js";

// Integration with existing multi-modal ingestion
export {
  KnowledgeGraphIntegration,
  // createIngestionPipeline,
  // bootstrapKnowledgeGraphFromExistingData,
  // type KnowledgeGraphIntegrationConfig,
} from "./integration.js";

// Phase 2: Search and Reasoning Components
export { HybridSearchEngine } from "./hybrid-search-engine.js";
export { MultiHopReasoningEngine } from "./multi-hop-reasoning.js";
export { ResultRankingEngine } from "./result-ranking.js";

// Phase 3: Advanced Features
export { ProvenanceTracker } from "./provenance-tracker.js";
export { QueryOptimizer } from "./query-optimizer.js";
export { MonitoringSystem } from "./monitoring-system.js";

// API Layers
export { GraphRagApiServer } from "./graph-rag-api.js";
export {
  createGraphQLSchema,
  createGraphQLContext,
  setupGraphQLServer,
  type GraphQLContext,
} from "./graphql-api.js";

// Database schema and migrations
export { default as knowledgeGraphSchema } from "./schema.sql";
export { default as knowledgeGraphMigration } from "./migrations/001_create_knowledge_graph_schema.sql";
export { default as provenanceMigration } from "./migrations/002_create_provenance_schema.sql";

/**
 * Quick start factory function for knowledge graph integration
 *
 * @example
 * ```typescript
 * import { createKnowledgeGraphSystem } from './knowledge-graph';
 *
 * const system = await createKnowledgeGraphSystem(database, embeddings, {
 *   enableRealTimeProcessing: true,
 *   entityExtraction: {
 *     minEntityConfidence: 0.8,
 *     enableCooccurrenceAnalysis: true
 *   }
 * });
 *
 * // Use enhanced pipeline for ingestion
 * const result = await system.pipeline.ingestFiles(['document.pdf']);
 *
 * // Get knowledge graph statistics
 * const stats = await system.knowledgeGraph.getKnowledgeGraphStatistics();
 * ```
 */
export async function createKnowledgeGraphSystem(
  database, // ObsidianDatabase
  embeddings, // ObsidianEmbeddingService
  _config = {}
) {
  // TODO: Implement proper ingestion pipeline creation
  // For now, return a basic structure
  const pipeline = {};
  const knowledgeGraph = {};

  return {
    pipeline,
    knowledgeGraph,

    // Convenience methods
    async processAllUnprocessed() {
      return await knowledgeGraph.processAllUnprocessedChunks();
    },

    async getStatistics() {
      return await knowledgeGraph.getKnowledgeGraphStatistics();
    },

    async validateConsistency() {
      return await knowledgeGraph.validateKnowledgeGraphConsistency();
    },

    async bootstrap(_options = {}) {
      // TODO: Implement bootstrap functionality
      // return await bootstrapKnowledgeGraphFromExistingData(
      //   database,
      //   embeddings,
      //   options
      // );
      console.log("Bootstrap functionality not yet implemented");
      return { success: false, message: "Not implemented" };
    },
  };
}

/**
 * Configuration presets for different use cases
 */
export const KnowledgeGraphPresets = {
  /**
   * High accuracy preset - prioritizes precision over recall
   */
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

  /**
   * Balanced preset - good balance of accuracy and coverage
   */
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

  /**
   * High coverage preset - prioritizes recall over precision
   */
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

  /**
   * Performance preset - optimized for speed
   */
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

/**
 * Utility functions for knowledge graph operations
 */
export const KnowledgeGraphUtils = {
  /**
   * Validate entity extraction configuration
   */
  validateEntityConfig(
    config: Partial<import("./entity-extractor.js").EntityExtractionConfig>
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

  /**
   * Calculate recommended batch size based on system resources
   */
  calculateOptimalBatchSize(
    availableMemoryMB: number,
    _avgChunkSizeKB: number
  ): number {
    // Conservative estimate: 10MB per chunk processing
    const memoryPerChunk = 10;
    const maxConcurrentChunks = Math.floor(
      (availableMemoryMB * 0.3) / memoryPerChunk
    );
    return Math.max(5, Math.min(50, maxConcurrentChunks));
  },

  /**
   * Estimate processing time for given number of chunks
   */
  estimateProcessingTime(
    chunkCount: number,
    avgChunkSize: number
  ): {
    estimatedMinutes: number;
    confidence: "low" | "medium" | "high";
  } {
    // Rough estimates based on chunk size and complexity
    const baseTimePerChunk =
      avgChunkSize < 1000 ? 0.5 : avgChunkSize < 5000 ? 2 : 5; // seconds
    const totalSeconds = chunkCount * baseTimePerChunk;

    return {
      estimatedMinutes: Math.ceil(totalSeconds / 60),
      confidence:
        chunkCount < 100 ? "high" : chunkCount < 1000 ? "medium" : "low",
    };
  },
};

// Re-export types for convenience
export type {
  // KnowledgeGraphIntegrationConfig,
  // EntityExtractionConfig,
  KnowledgeGraphPipelineConfig,
  PipelineProcessingResult,
  ChunkProcessingInput,
  EntitySimilarity,
  GraphStatistics,
  EntityDeduplicationResult,
} from "./entity-extractor.js";

/**
 * Version information
 */
export const KNOWLEDGE_GRAPH_VERSION = "1.0.0";
export const SCHEMA_VERSION = "001";

/**
 * Feature flags for experimental features
 */
export const EXPERIMENTAL_FEATURES = {
  ADVANCED_RELATIONSHIP_INFERENCE: false,
  GRAPH_NEURAL_NETWORKS: false,
  TEMPORAL_RELATIONSHIPS: false,
  MULTI_LANGUAGE_ENTITIES: false,
} as const;
