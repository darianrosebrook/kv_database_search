/**
 * @kv/entities — entity extraction and ML-based entity linking
 *
 * Provides:
 * - Rule-based entity extraction (EntityExtractor) with NER pipeline
 * - ML-based entity linking (MLEntityLinker) with knowledge base integration
 * - Type vocabulary for processed entities, relationships, and extraction
 *   context shared with @kv/processors and @kv/knowledge-graph
 *
 * Storage interface is left abstract — callers wishing to enable persistence
 * pass a database-like object to the EntityExtractor constructor.
 */

export {
  EntityExtractor,
  type ProcessedEntity,
  type EntityType,
  type TextPosition,
  type EntityMetadata,
  type HierarchicalInfo,
  type ContextualInfo,
  type ProvenanceInfo,
  type EntityRelationship,
  type RelationshipType,
  type TemporalRelation,
  type SemanticRelation,
  type ExtractionContext,
  type ExtractionConstraints,
  type ExtractionResult,
  type EntityCluster,
  type ExtractedEntity,
  type LegacyEntityRelationship,
} from "./entity-extractor";

export {
  MLEntityLinker,
  type MLEntity,
  type MLEntityType,
  type MLEntityMetadata,
  type LinkedEntity,
  type MLRelationship,
  type AlternativeEntity,
  type RelationshipMetadata,
  type ExtractionOptions,
  type ModelPreferences,
  type ModelPerformance,
  type UserFeedback,
  type ModelUpdate,
  type TrainingExample,
  type ValidationResults,
  type EntityExtractionStatus,
  type ModelStatus,
  type LearningStatus,
} from "./ml-entity-linker";
