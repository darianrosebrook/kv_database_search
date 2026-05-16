/**
 * Stub interfaces for entity-extractor and dictionary-service.
 *
 * entity-analyzer.ts in this package depends on EntityExtractor and
 * DictionaryService classes that live in @kv/database (slated for
 * extraction to @kv/entities in Phase 6a). To avoid dragging those
 * classes — and their database/NLP dependencies — into @kv/processors,
 * we redeclare the minimal shapes that entity-analyzer.ts touches.
 *
 * When @kv/entities lands, swap these for the real imports.
 */

import type { ExtractedEntity, EntityRelationship } from "@kv/utils";

// EntityExtractor stub — class shape entity-analyzer.ts constructs and calls.
// The real class accepts a database parameter; entity-analyzer passes null.
export class EntityExtractor {
  constructor(_database: unknown) {}
  async extractEntitiesAsync(
    _text: string,
    _context: ExtractionContext
  ): Promise<ExtractionResult> {
    throw new Error("EntityExtractor stub — implementation lives in @kv/database");
  }
  extractEntities(_text: string): ExtractedEntity[] {
    throw new Error("EntityExtractor stub — implementation lives in @kv/database");
  }
  async extractRelationships(
    _entities: ExtractedEntity[],
    _text: string,
    _context: ExtractionContext
  ): Promise<EntityRelationship[]> {
    throw new Error("EntityExtractor stub — implementation lives in @kv/database");
  }
}

export interface ExtractionContext {
  documentId: string;
  documentType: string;
  domain: string;
  language: string;
  processingStage: "initial" | "refinement" | "validation";
  previousEntities: unknown[];
  constraints: {
    maxEntities: number;
    minConfidence: number;
    allowedTypes: Array<{ primary: string; secondary: string[]; semantic: string[]; domain: string }>;
    forbiddenTypes: Array<{ primary: string; secondary: string[]; semantic: string[]; domain: string }>;
    contextWindow: number;
    overlapThreshold: number;
  };
}

export interface ExtractionResult {
  entities: Array<{
    text: string;
    type: { primary: string };
    confidence: number;
    position: { start: number; end: number };
  }>;
  relationships: Array<{
    id: string;
    sourceEntity: string;
    targetEntity: string;
    type: { category: string };
    confidence: number;
    context: string;
    strength?: number;
    evidence?: string[];
  }>;
  clusters: Array<{
    id: string;
    entities: Array<{
      text: string;
      type: { primary: string };
      confidence: number;
      position: { start: number; end: number };
    }>;
    cohesion: number;
    metadata: { domain: string };
  }>;
  quality: {
    entityAccuracy: number;
    f1Score: number;
  };
}

// DictionaryService stub — class shape with the two methods entity-analyzer.ts calls.
export class DictionaryService {
  async canonicalizeEntities(
    _request: { entities: Array<{ name: string; type: unknown; context?: string; aliases?: string[] }> }
  ): Promise<Array<{
    confidence: number;
    canonicalName: string;
    source: string;
    reasoning: string;
  }>> {
    throw new Error("DictionaryService stub — implementation lives in @kv/database");
  }
  async expandSearchTerms(
    _request: { queryTerms: string[]; expansionTypes?: string[]; maxExpansionsPerTerm?: number }
  ): Promise<Array<{
    expandedTerms: Array<{ term: string; expansionType: string }>;
  }>> {
    throw new Error("DictionaryService stub — implementation lives in @kv/database");
  }
}
