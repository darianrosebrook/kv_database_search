/**
 * Unified Entity Extractor Interface
 *
 * Provides a unified interface for entity extraction across the system.
 * This consolidates the different entity extractor implementations into
 * a single, consistent API.
 *
 * Author: @darianrosebrook
 * Date: 2025-01-25
 */

import {
  EntityExtractor as AdvancedEntityExtractor,
  ProcessedEntity,
  EntityRelationship,
  ExtractionContext,
  // ExtractionResult,
} from "./advanced-entity-extractor.js";
import { ExtractedEntity } from "./utils.js";

/**
 * Unified entity extraction result that can work with both legacy and new systems
 */
export interface UnifiedExtractionResult {
  entities: ExtractedEntity[];
  relationships: EntityRelationship[];
  metadata: {
    processingTime: number;
    entitiesExtracted: number;
    relationshipsFound: number;
    averageConfidence: number;
    extractionMethod: "unified";
  };
}

/**
 * Unified Entity Extractor that provides backward compatibility
 * while using the advanced ProcessedEntityExtractor internally
 */
export class UnifiedEntityExtractor {
  private advancedExtractor: AdvancedEntityExtractor;

  constructor(database = null) {
    this.advancedExtractor = new AdvancedEntityExtractor(database);
  }

  /**
   * Extract entities from text - unified interface
   * Provides backward compatibility with the simple extractEntities(text) signature
   */
  async extractEntities(
    text: string,
    context?: Partial<ExtractionContext>
  ): Promise<UnifiedExtractionResult> {
    const startTime = Date.now();

    // Create extraction context with defaults
    const extractionContext: ExtractionContext = {
      documentId: `doc-${Date.now()}`,
      documentType: "text",
      domain: "general",
      language: "en",
      processingStage: "initial",
      previousEntities: [],
      constraints: {
        maxEntities: 100,
        minConfidence: 0.6,
        allowedTypes: [],
        forbiddenTypes: [],
        contextWindow: 100,
        overlapThreshold: 0.5,
      },
      ...context,
    };

    // Use the advanced extractor
    const result = await this.advancedExtractor.extractEntities(
      text,
      extractionContext
    );

    // Convert to unified format
    const entities = this.convertProcessedToExtracted(result.entities);

    const processingTime = Date.now() - startTime;

    return {
      entities,
      relationships: result.relationships,
      metadata: {
        processingTime,
        entitiesExtracted: entities.length,
        relationshipsFound: result.relationships.length,
        averageConfidence:
          entities.length > 0
            ? entities.reduce((sum, e) => sum + e.confidence, 0) /
              entities.length
            : 0,
        extractionMethod: "unified",
      },
    };
  }

  /**
   * Extract relationships between entities - unified interface
   */
  async extractRelationships(
    _text: string,
    _entities: ExtractedEntity[]
  ): Promise<EntityRelationship[]> {
    // For now, return empty relationships as the advanced extractor
    // handles relationships internally
    return [];
  }

  /**
   * Convert ProcessedEntity[] to ExtractedEntity[] for backward compatibility
   */
  private convertProcessedToExtracted(
    processedEntities: ProcessedEntity[]
  ): ExtractedEntity[] {
    return processedEntities.map((entity) => ({
      text: entity.text,
      type: this.mapProcessedTypeToExtractedType(entity.type.primary),
      confidence: entity.confidence,
      position: entity.position,
      label: entity.text,
      aliases: [],
      canonicalForm: entity.text,
      dictionaryEnhanced: false,
    }));
  }

  /**
   * Map ProcessedEntity type to ExtractedEntity type
   */
  private mapProcessedTypeToExtractedType(
    processedType: string
  ): "person" | "organization" | "location" | "concept" | "term" | "other" {
    const typeMap: Record<
      string,
      "person" | "organization" | "location" | "concept" | "term" | "other"
    > = {
      PERSON: "person",
      ORGANIZATION: "organization",
      LOCATION: "location",
      CONCEPT: "concept",
      TECHNOLOGY: "concept",
      PRODUCT: "concept",
      EVENT: "concept",
      DATE: "term",
      MONEY: "term",
    };
    return typeMap[processedType] || "other";
  }
}

/**
 * Factory function to create a unified entity extractor
 */
export function createUnifiedEntityExtractor(
  database = null
): UnifiedEntityExtractor {
  return new UnifiedEntityExtractor(database);
}

/**
 * Legacy compatibility - export as EntityExtractor for backward compatibility
 */
export { UnifiedEntityExtractor as EntityExtractor };
