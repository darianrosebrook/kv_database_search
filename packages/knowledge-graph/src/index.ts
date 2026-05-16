/**
 * @kv/knowledge-graph — entity extraction, graph storage, multi-hop reasoning,
 * provenance tracking, query optimization, and ranking primitives for the kv
 * platform.
 *
 * Server-layer wiring (Express/GraphQL routes, integration with embedding and
 * ingestion services) lives in the consuming app rather than this package.
 */

// Entity extraction and KG-aligned entity/relationship types
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
} from "./entity-extractor";

// Persistence and graph management
export {
  KnowledgeGraph,
  type EntitySimilarity,
  type GraphStatistics,
  type EntityDeduplicationResult,
} from "./knowledge-graph-manager";

// Multi-hop reasoning
export {
  MultiHopReasoningEngine,
  type ReasoningQuery,
  type ReasoningResult,
  type ReasoningPath,
  type ReasoningEntity,
  type ReasoningRelationship,
  type Evidence,
  type LogicalStep,
  type AlternativeHypothesis,
  type Contradiction,
  type ReasoningMetrics,
} from "./multi-hop-reasoning";

// Provenance tracking
export {
  ProvenanceTracker,
  type ProvenanceRecord,
  type ProvenanceOperation,
  type ProvenanceInput,
  type ProvenanceOutput,
  type ProcessingStep,
  type DataLineage,
  type QualityMetrics,
} from "./provenance-tracker";

// Query optimization
export { QueryOptimizer } from "./query-optimizer";

// Result ranking
export {
  ResultRankingEngine,
  type RankedSearchResult,
  type RankingConfig,
  type RankingWeights,
  type RankingBoosts,
  type RankingPenalties,
  type NormalizationConfig,
  type DiversificationConfig,
} from "./result-ranking";

// Shared search/result type vocabulary (consumed by hybrid-search-engine in
// @kv/database; lives here so result-ranking and provenance can reference it
// without depending on the embedding-coupled engine)
export type {
  SearchQuery,
  SearchResult,
  SearchResultMetadata,
  EntityReference,
  RelationshipReference,
  SearchExplanation,
  TraversalPath,
  ReasoningStep,
  HybridSearchConfig,
  SearchMetrics,
} from "./search-types";

// Temporal reasoning (causality detection, trend analysis, change-point detection)
export * from "./temporal-reasoning";

// Structural stub for the embedding service (real impl lives in @kv/database)
export type { DocumentEmbeddingServiceLike } from "./external-types";
