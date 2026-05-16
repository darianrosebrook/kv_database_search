/**
 * Structural stubs for external services that this package collaborates with
 * but does not depend on directly. Real implementations live in @kv/entities
 * (EntityExtractor) and @kv/database (DocumentEmbeddingService).
 *
 * These shapes capture only the methods actually invoked from within this
 * package. When @kv/entities lands, swap EntityExtractorLike for the real
 * import.
 */

export interface DocumentEmbeddingServiceLike {
  embed(text: string): Promise<number[]>;
  embedBatch?(texts: string[], batchSize?: number): Promise<number[][]>;
  embedWithStrategy(
    text: string,
    contentType?: string,
    domainHint?: string
  ): Promise<{ embedding: number[]; [key: string]: unknown }>;
}

export interface ExtractionContextLike {
  documentId: string;
  documentType: string;
  domain: string;
  language: string;
  processingStage: string;
  previousEntities: unknown[];
  constraints: {
    maxEntities: number;
    minConfidence: number;
    allowedTypes: string[];
    forbiddenTypes: string[];
    contextWindow: number;
    overlapThreshold: number;
  };
}

export interface ProcessedEntityLike {
  id: string;
  text: string;
  type: { primary: string; confidence: number };
  confidence: number;
  position: { start: number; end: number };
  metadata: Record<string, unknown>;
  relationships: EntityRelationshipLike[];
  hierarchical: Record<string, unknown>;
  context: Record<string, unknown>;
  provenance: Record<string, unknown>;
}

export interface EntityRelationshipLike {
  id: string;
  sourceEntity: string;
  targetEntity: string;
  type: { primary: string; confidence: number };
  strength: number;
  confidence: number;
  context: string;
  evidence: string[];
}

export interface ExtractionResultLike {
  entities: ProcessedEntityLike[];
  relationships: EntityRelationshipLike[];
}

export interface EntityExtractorLike {
  extractEntitiesAsync(
    text: string,
    context: ExtractionContextLike
  ): Promise<ExtractionResultLike>;
}

/**
 * Minimal entity extractor stub for use when no real EntityExtractor is wired.
 * Returns empty results; useful for tests and contexts where extraction is
 * disabled or deferred.
 */
export class StubEntityExtractor implements EntityExtractorLike {
  async extractEntitiesAsync(
    _text: string,
    _context: ExtractionContextLike
  ): Promise<ExtractionResultLike> {
    return { entities: [], relationships: [] };
  }
}
