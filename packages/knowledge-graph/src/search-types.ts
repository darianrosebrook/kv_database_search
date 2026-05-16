import { ContentType } from "@kv/types";
import { EntityType, RelationshipType } from "./entity-extractor";

export interface SearchQuery {
  text: string;
  filters?: {
    contentTypes?: ContentType[];
    entityTypes?: EntityType[];
    relationshipTypes?: RelationshipType[];
    sourceFiles?: string[];
    minConfidence?: number;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  options?: {
    maxResults?: number;
    maxHops?: number;
    minSimilarity?: number;
    includeExplanation?: boolean;
    searchType?: "vector" | "graph" | "hybrid";
    enableSemanticExpansion?: boolean;
    boostRecentContent?: boolean;
  };
}

export interface SearchResult {
  id: string;
  text: string;
  score: number;
  similarity: number;
  relevanceScore: number;
  metadata: SearchResultMetadata;
  entities: EntityReference[];
  relationships: RelationshipReference[];
  explanation?: SearchExplanation;
}

export interface SearchResultMetadata {
  contentType: ContentType;
  sourceFile: string;
  chunkId: string;
  extractionMethod: string;
  processingTime: Date;
  wordCount: number;
  characterCount: number;
}

export interface EntityReference {
  id: string;
  name: string;
  type: EntityType;
  confidence: number;
  mentionCount: number;
  aliases: string[];
}

export interface RelationshipReference {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: RelationshipType;
  confidence: number;
  strength: number;
  isDirectional: boolean;
}

export interface SearchExplanation {
  queryEntities: EntityReference[];
  traversalPaths: TraversalPath[];
  reasoningSteps: ReasoningStep[];
  searchStrategy: string;
  totalExecutionTime: number;
  vectorSearchTime: number;
  graphTraversalTime: number;
  resultFusionTime: number;
}

export interface TraversalPath {
  entities: EntityReference[];
  relationships: RelationshipReference[];
  confidence: number;
  hopCount: number;
  pathStrength: number;
  explanation: string;
}

export interface ReasoningStep {
  step: number;
  description: string;
  confidence: number;
  evidence: string[];
  entitiesInvolved: string[];
}

export interface HybridSearchConfig {
  vectorWeight: number;
  graphWeight: number;
  maxHops: number;
  minEntityConfidence: number;
  minRelationshipConfidence: number;
  enableQueryExpansion: boolean;
  expansionDepth: number;
  resultFusionStrategy: "weighted" | "rank" | "hybrid";
  performanceMode: "accuracy" | "speed" | "balanced";
}

export interface SearchMetrics {
  totalResults: number;
  vectorResults: number;
  graphResults: number;
  fusedResults: number;
  executionTime: number;
  vectorSearchTime: number;
  graphTraversalTime: number;
  resultFusionTime: number;
  entitiesFound: number;
  relationshipsTraversed: number;
  maxHopsReached: number;
  cacheHitRate?: number;
}
