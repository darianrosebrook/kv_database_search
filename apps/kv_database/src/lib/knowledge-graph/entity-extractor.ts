import { ObsidianContentType as ContentType } from "../types/obsidian-constants";
import {
  EntityExtractor,
  ProcessedEntity,
  EntityRelationship,
  ExtractionContext,
} from "../entity-extractor.js";
import { ExtractedEntity } from "../utils.js";

// Entity types aligned with database schema
export enum EntityType {
  PERSON = "PERSON",
  ORGANIZATION = "ORGANIZATION",
  LOCATION = "LOCATION",
  CONCEPT = "CONCEPT",
  TECHNOLOGY = "TECHNOLOGY",
  PRODUCT = "PRODUCT",
  EVENT = "EVENT",
  DATE = "DATE",
  MONEY = "MONEY",
  OTHER = "OTHER",
}

export enum RelationshipType {
  WORKS_FOR = "WORKS_FOR",
  PART_OF = "PART_OF",
  RELATED_TO = "RELATED_TO",
  MENTIONS = "MENTIONS",
  LOCATED_IN = "LOCATED_IN",
  CREATED_BY = "CREATED_BY",
  USED_BY = "USED_BY",
  SIMILAR_TO = "SIMILAR_TO",
  DEPENDS_ON = "DEPENDS_ON",
  COLLABORATES_WITH = "COLLABORATES_WITH",
  COMPETES_WITH = "COMPETES_WITH",
  INFLUENCES = "INFLUENCES",
  OTHER = "OTHER",
}

export enum ExtractionMethod {
  TEXT_EXTRACTION = "text_extraction",
  OCR = "ocr",
  SPEECH_TO_TEXT = "speech_to_text",
  MANUAL = "manual",
  NLP_PIPELINE = "nlp_pipeline",
  LLM_EXTRACTION = "llm_extraction",
}

// Entity with knowledge graph metadata
export interface KnowledgeGraphEntity {
  id?: string; // UUID, generated if not provided
  name: string;
  canonicalName: string;
  type: EntityType;
  aliases: string[];
  confidence: number;
  extractionConfidence: number;
  validationStatus: "validated" | "unvalidated" | "rejected";

  // Vector embedding for similarity search
  embedding?: number[];

  // Occurrence and frequency data
  occurrenceCount: number;
  documentFrequency: number;

  // Source tracking
  sourceFiles: string[];
  extractionMethods: ExtractionMethod[];

  // Temporal information
  firstSeen: Date;
  lastUpdated: Date;
  lastOccurrence: Date;

  // Metadata
  metadata: Record<string, unknown>;

  // Context information
  mentionContexts: EntityMention[];
}

export interface EntityMention {
  chunkId: string;
  mentionText: string;
  mentionContext: string;
  startPosition?: number;
  endPosition?: number;
  extractionMethod: ExtractionMethod;
  extractionConfidence: number;
}

// Enhanced relationship with evidence and confidence
export interface KnowledgeGraphRelationship {
  id?: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: RelationshipType;
  isDirectional: boolean;

  // Confidence and strength metrics
  confidence: number;
  strength: number;

  // Evidence and support
  cooccurrenceCount: number;
  mutualInformation?: number;
  pointwiseMutualInformation?: number;

  // Source evidence
  sourceChunkIds: string[];
  extractionContext?: string;
  supportingText: string[];

  // Temporal information
  createdAt: Date;
  updatedAt: Date;
  lastObserved: Date;

  // Metadata
  metadata: Record<string, unknown>;
}

// Extraction result from multi-modal content
export interface EntityExtractionResult {
  entities: KnowledgeGraphEntity[];
  relationships: KnowledgeGraphRelationship[];
  extractionMetadata: {
    contentType: ContentType;
    sourceFile: string;
    chunkId: string;
    extractionMethod: ExtractionMethod;
    processingTime: number;
    confidence: number;
  };
}

// Configuration for entity extraction
export interface EntityExtractionConfig {
  minEntityConfidence: number;
  minRelationshipConfidence: number;
  enableRelationshipInference: boolean;
  maxEntitiesPerChunk: number;
  enableEntityLinking: boolean;
  enableCooccurrenceAnalysis: boolean;
  contextWindowSize: number;
}

/**
 * Entity extractor for knowledge graph construction
 * Integrates with existing multi-modal processors to extract entities and relationships
 */
export class KnowledgeGraphEntityExtractor {
  private baseExtractor: EntityExtractor;
  private config: EntityExtractionConfig;

  constructor(config: Partial<EntityExtractionConfig> = {}) {
    this.baseExtractor = new EntityExtractor(null); // No database dependency for now
    this.config = {
      minEntityConfidence: 0.7,
      minRelationshipConfidence: 0.5,
      enableRelationshipInference: true,
      maxEntitiesPerChunk: 50,
      enableEntityLinking: true,
      enableCooccurrenceAnalysis: true,
      contextWindowSize: 200,
      ...config,
    };
  }

  /**
   * Extract entities and relationships from text content
   */
  async extractFromText(
    text: string,
    metadata: {
      contentType: ContentType;
      sourceFile: string;
      chunkId: string;
      extractionMethod: ExtractionMethod;
    }
  ): Promise<EntityExtractionResult> {
    const startTime = performance.now();

    try {
      console.log(
        `🔍 Extracting entities from ${metadata.contentType} content...`
      );

      // Use base extractor for initial entity detection
      const extractionContext: ExtractionContext = {
        documentId: metadata.chunkId,
        documentType: metadata.contentType,
        domain: metadata.contentType,
        language: "en",
        processingStage: "initial",
        previousEntities: [],
        constraints: {
          maxEntities: this.config.maxEntitiesPerChunk,
          minConfidence: this.config.minEntityConfidence,
          allowedTypes: [],
          forbiddenTypes: [],
          contextWindow: this.config.contextWindowSize,
          overlapThreshold: 0.5,
        },
      };

      const extractionResult = await this.baseExtractor.extractEntitiesAsync(
        text,
        extractionContext
      );
      const baseEntities = this.convertProcessedToExtracted(
        extractionResult.entities
      );
      const baseRelationships = extractionResult.relationships;

      // Enhance entities with knowledge graph metadata
      const processedEntities = await this.enhanceEntities(
        baseEntities,
        text,
        metadata
      );

      // Enhance relationships with evidence and confidence
      const processedRelationships = await this.enhanceRelationships(
        baseRelationships,
        processedEntities,
        text,
        metadata
      );

      // Filter by confidence thresholds
      const filteredEntities = processedEntities.filter(
        (entity) => entity.confidence >= this.config.minEntityConfidence
      );

      const filteredRelationships = processedRelationships.filter(
        (rel) => rel.confidence >= this.config.minRelationshipConfidence
      );

      // Infer additional relationships from co-occurrence
      const inferredRelationships = this.config.enableCooccurrenceAnalysis
        ? await this.inferCooccurrenceRelationships(
            filteredEntities,
            text,
            metadata
          )
        : [];

      const allRelationships = [
        ...filteredRelationships,
        ...inferredRelationships,
      ];

      const processingTime = performance.now() - startTime;

      console.log(
        `✅ Entity extraction complete: ${filteredEntities.length} entities, ${allRelationships.length} relationships`
      );

      return {
        entities: filteredEntities,
        relationships: allRelationships,
        extractionMetadata: {
          ...metadata,
          processingTime,
          confidence: this.calculateOverallConfidence(
            filteredEntities,
            allRelationships
          ),
        },
      };
    } catch (error) {
      const processingTime = performance.now() - startTime;
      console.error(`❌ Entity extraction failed:`, error);

      return {
        entities: [],
        relationships: [],
        extractionMetadata: {
          ...metadata,
          processingTime,
          confidence: 0,
        },
      };
    }
  }

  /**
   * Enhance base entities with knowledge graph metadata
   */
  private async enhanceEntities(
    baseEntities: ExtractedEntity[],
    text: string,
    metadata
  ): Promise<KnowledgeGraphEntity[]> {
    const processedEntities: KnowledgeGraphEntity[] = [];

    for (const entity of baseEntities) {
      // Map entity type to knowledge graph enum
      const entityType = this.mapEntityType(entity.type);

      // Generate canonical name
      const canonicalName = this.generateCanonicalName(entity.text);

      // Extract aliases and variations
      const aliases = this.extractAliases(entity.text, text);

      // Find mention contexts
      const mentionContexts = this.findMentionContexts(
        entity.text,
        text,
        metadata
      );

      // Calculate document frequency (simplified - would need global context in real implementation)
      const documentFrequency = 1; // Single document for now

      const processedEntity: KnowledgeGraphEntity = {
        name: entity.text,
        canonicalName,
        type: entityType,
        aliases,
        confidence: entity.confidence,
        extractionConfidence: entity.confidence,
        validationStatus: "unvalidated",
        occurrenceCount: mentionContexts.length,
        documentFrequency,
        sourceFiles: [metadata.sourceFile],
        extractionMethods: [metadata.extractionMethod],
        firstSeen: new Date(),
        lastUpdated: new Date(),
        lastOccurrence: new Date(),
        metadata: {
          originalType: entity.type,
          label: entity.label,
          startPosition: entity.position.start,
          endPosition: entity.position.end,
        },
        mentionContexts,
      };

      processedEntities.push(processedEntity);
    }

    return processedEntities;
  }

  /**
   * Enhance base relationships with evidence and confidence
   */
  private async enhanceRelationships(
    baseRelationships: EntityRelationship[],
    entities: KnowledgeGraphEntity[],
    text: string,
    metadata
  ): Promise<KnowledgeGraphRelationship[]> {
    const processedRelationships: KnowledgeGraphRelationship[] = [];

    for (const relationship of baseRelationships) {
      // Find source and target entities
      const sourceEntity = entities.find(
        (e) => e.name === relationship.sourceEntity
      );
      const targetEntity = entities.find(
        (e) => e.name === relationship.targetEntity
      );

      if (!sourceEntity || !targetEntity) {
        continue; // Skip if entities not found
      }

      // Map relationship type
      const relationshipType = this.mapRelationshipType(
        relationship.type.toString()
      );

      // Extract supporting evidence
      const supportingText = this.extractSupportingText(
        relationship.sourceEntity,
        relationship.targetEntity,
        text
      );

      // Calculate co-occurrence metrics
      const cooccurrenceCount = this.calculateCooccurrence(
        sourceEntity.name,
        targetEntity.name,
        text
      );

      const processedRelationship: KnowledgeGraphRelationship = {
        sourceEntityId: sourceEntity.id || "", // Will be set when entities are persisted
        targetEntityId: targetEntity.id || "",
        type: relationshipType,
        isDirectional: this.isDirectionalRelationship(relationshipType),
        confidence: relationship.confidence,
        strength: this.calculateRelationshipStrength(
          relationship,
          cooccurrenceCount
        ),
        cooccurrenceCount,
        sourceChunkIds: [metadata.chunkId],
        extractionContext: relationship.context,
        supportingText,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastObserved: new Date(),
        metadata: {
          originalType: relationship.type,
          extractionMethod: metadata.extractionMethod,
        },
      };

      processedRelationships.push(processedRelationship);
    }

    return processedRelationships;
  }

  /**
   * Infer relationships from entity co-occurrence patterns
   */
  private async inferCooccurrenceRelationships(
    entities: KnowledgeGraphEntity[],
    text: string,
    metadata
  ): Promise<KnowledgeGraphRelationship[]> {
    const inferredRelationships: KnowledgeGraphRelationship[] = [];
    const sentences = this.splitIntoSentences(text);

    // Analyze entity co-occurrence within sentences
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i];
        const entity2 = entities[j];

        // Count co-occurrences in sentences
        let cooccurrenceCount = 0;
        const supportingText: string[] = [];

        for (const sentence of sentences) {
          if (
            this.mentionsEntity(sentence, entity1.name) &&
            this.mentionsEntity(sentence, entity2.name)
          ) {
            cooccurrenceCount++;
            supportingText.push(sentence.trim());
          }
        }

        // Only create relationship if entities co-occur frequently enough
        if (cooccurrenceCount >= 2) {
          const relationshipType = this.inferRelationshipType(
            entity1,
            entity2,
            supportingText
          );
          const confidence = this.calculateCooccurrenceConfidence(
            cooccurrenceCount,
            entities.length,
            supportingText
          );

          if (confidence >= this.config.minRelationshipConfidence) {
            const relationship: KnowledgeGraphRelationship = {
              sourceEntityId: entity1.id || "",
              targetEntityId: entity2.id || "",
              type: relationshipType,
              isDirectional: false, // Co-occurrence relationships are typically bidirectional
              confidence,
              strength: Math.min(1.0, cooccurrenceCount / 5), // Normalize strength
              cooccurrenceCount,
              sourceChunkIds: [metadata.chunkId],
              extractionContext: "co-occurrence analysis",
              supportingText,
              createdAt: new Date(),
              updatedAt: new Date(),
              lastObserved: new Date(),
              metadata: {
                inferenceMethod: "cooccurrence",
                extractionMethod: metadata.extractionMethod,
              },
            };

            inferredRelationships.push(relationship);
          }
        }
      }
    }

    return inferredRelationships;
  }

  /**
   * Map base entity types to knowledge graph entity types
   */
  private mapEntityType(baseType: string): EntityType {
    const typeMapping: Record<string, EntityType> = {
      PERSON: EntityType.PERSON,
      ORG: EntityType.ORGANIZATION,
      ORGANIZATION: EntityType.ORGANIZATION,
      GPE: EntityType.LOCATION, // Geopolitical entity
      LOCATION: EntityType.LOCATION,
      PRODUCT: EntityType.PRODUCT,
      EVENT: EntityType.EVENT,
      DATE: EntityType.DATE,
      MONEY: EntityType.MONEY,
      TECHNOLOGY: EntityType.TECHNOLOGY,
      CONCEPT: EntityType.CONCEPT,
    };

    return typeMapping[baseType.toUpperCase()] || EntityType.OTHER;
  }

  /**
   * Map base relationship types to knowledge graph relationship types
   */
  private mapRelationshipType(baseType: string): RelationshipType {
    const typeMapping: Record<string, RelationshipType> = {
      WORKS_FOR: RelationshipType.WORKS_FOR,
      PART_OF: RelationshipType.PART_OF,
      LOCATED_IN: RelationshipType.LOCATED_IN,
      CREATED_BY: RelationshipType.CREATED_BY,
      USED_BY: RelationshipType.USED_BY,
      MENTIONS: RelationshipType.MENTIONS,
      SIMILAR_TO: RelationshipType.SIMILAR_TO,
      DEPENDS_ON: RelationshipType.DEPENDS_ON,
      COLLABORATES_WITH: RelationshipType.COLLABORATES_WITH,
      COMPETES_WITH: RelationshipType.COMPETES_WITH,
      INFLUENCES: RelationshipType.INFLUENCES,
    };

    return typeMapping[baseType.toUpperCase()] || RelationshipType.RELATED_TO;
  }

  /**
   * Generate canonical name for entity
   */
  private generateCanonicalName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[^\w\s-]/g, ""); // Remove special characters except hyphens
  }

  /**
   * Extract aliases and variations of entity name
   */
  private extractAliases(entityName: string, text: string): string[] {
    const aliases: Set<string> = new Set();

    // Look for variations in parentheses: "Entity Name (Alias)"
    const parenthesesRegex = new RegExp(
      `${this.escapeRegex(entityName)}\\s*\\(([^)]+)\\)`,
      "gi"
    );
    let match;
    while ((match = parenthesesRegex.exec(text)) !== null) {
      aliases.add(match[1].trim());
    }

    // Look for "also known as" patterns
    const akaRegex = new RegExp(
      `${this.escapeRegex(
        entityName
      )}[^.]*?(?:also known as|aka|a\\.k\\.a\\.)\\s+([^,.;]+)`,
      "gi"
    );
    while ((match = akaRegex.exec(text)) !== null) {
      aliases.add(match[1].trim());
    }

    // Add common abbreviations if entity is an organization
    if (entityName.includes(" ")) {
      const words = entityName.split(" ");
      if (words.length >= 2) {
        const abbreviation = words
          .map((w) => w[0])
          .join("")
          .toUpperCase();
        if (abbreviation.length >= 2 && abbreviation.length <= 6) {
          aliases.add(abbreviation);
        }
      }
    }

    return Array.from(aliases);
  }

  /**
   * Find mention contexts for entity in text
   */
  private findMentionContexts(
    entityName: string,
    text: string,
    metadata
  ): EntityMention[] {
    const mentions: EntityMention[] = [];
    const regex = new RegExp(this.escapeRegex(entityName), "gi");
    let match;

    while ((match = regex.exec(text)) !== null) {
      const startPos = match.index;
      const endPos = startPos + match[0].length;

      // Extract context around the mention
      const contextStart = Math.max(
        0,
        startPos - this.config.contextWindowSize
      );
      const contextEnd = Math.min(
        text.length,
        endPos + this.config.contextWindowSize
      );
      const context = text.substring(contextStart, contextEnd);

      mentions.push({
        chunkId: metadata.chunkId,
        mentionText: match[0],
        mentionContext: context,
        startPosition: startPos,
        endPosition: endPos,
        extractionMethod: metadata.extractionMethod,
        extractionConfidence: 0.9, // High confidence for exact text matches
      });
    }

    return mentions;
  }

  /**
   * Extract supporting text for relationships
   */
  private extractSupportingText(
    sourceEntity: string,
    targetEntity: string,
    text: string
  ): string[] {
    const supportingText: string[] = [];
    const sentences = this.splitIntoSentences(text);

    for (const sentence of sentences) {
      if (
        this.mentionsEntity(sentence, sourceEntity) &&
        this.mentionsEntity(sentence, targetEntity)
      ) {
        supportingText.push(sentence.trim());
      }
    }

    return supportingText;
  }

  /**
   * Calculate co-occurrence count between entities
   */
  private calculateCooccurrence(
    entity1: string,
    entity2: string,
    text: string
  ): number {
    const sentences = this.splitIntoSentences(text);
    let count = 0;

    for (const sentence of sentences) {
      if (
        this.mentionsEntity(sentence, entity1) &&
        this.mentionsEntity(sentence, entity2)
      ) {
        count++;
      }
    }

    return count;
  }

  /**
   * Calculate relationship strength based on various factors
   */
  private calculateRelationshipStrength(
    relationship: EntityRelationship,
    cooccurrenceCount: number
  ): number {
    // Base strength from relationship confidence
    let strength = relationship.confidence;

    // Boost strength based on co-occurrence frequency
    const cooccurrenceBoost = Math.min(0.3, cooccurrenceCount * 0.1);
    strength += cooccurrenceBoost;

    // Ensure strength is within valid range
    return Math.min(1.0, Math.max(0.0, strength));
  }

  /**
   * Determine if relationship type is directional
   */
  private isDirectionalRelationship(type: RelationshipType): boolean {
    const directionalTypes = new Set([
      RelationshipType.WORKS_FOR,
      RelationshipType.CREATED_BY,
      RelationshipType.USED_BY,
      RelationshipType.DEPENDS_ON,
      RelationshipType.INFLUENCES,
    ]);

    return directionalTypes.has(type);
  }

  /**
   * Infer relationship type from entity types and context
   */
  private inferRelationshipType(
    entity1: KnowledgeGraphEntity,
    entity2: KnowledgeGraphEntity,
    _supportingText: string[]
  ): RelationshipType {
    // Simple heuristics for relationship type inference
    // In a production system, this would use more sophisticated NLP

    if (
      entity1.type === EntityType.PERSON &&
      entity2.type === EntityType.ORGANIZATION
    ) {
      return RelationshipType.WORKS_FOR;
    }

    if (
      entity1.type === EntityType.TECHNOLOGY &&
      entity2.type === EntityType.TECHNOLOGY
    ) {
      return RelationshipType.SIMILAR_TO;
    }

    if (
      entity1.type === EntityType.PRODUCT &&
      entity2.type === EntityType.ORGANIZATION
    ) {
      return RelationshipType.CREATED_BY;
    }

    // Default to generic relationship
    return RelationshipType.RELATED_TO;
  }

  /**
   * Calculate confidence for co-occurrence relationships
   */
  private calculateCooccurrenceConfidence(
    cooccurrenceCount: number,
    totalEntities: number,
    supportingText: string[]
  ): number {
    // Base confidence from co-occurrence frequency
    let confidence = Math.min(0.9, cooccurrenceCount * 0.2);

    // Boost confidence if supporting text contains relationship indicators
    const relationshipIndicators = [
      "works for",
      "part of",
      "created by",
      "used by",
      "similar to",
      "depends on",
      "collaborates with",
      "competes with",
      "influences",
    ];

    const hasIndicators = supportingText.some((text) =>
      relationshipIndicators.some((indicator) =>
        text.toLowerCase().includes(indicator)
      )
    );

    if (hasIndicators) {
      confidence += 0.2;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Calculate overall confidence for extraction result
   */
  private calculateOverallConfidence(
    entities: KnowledgeGraphEntity[],
    relationships: KnowledgeGraphRelationship[]
  ): number {
    if (entities.length === 0) return 0;

    const entityConfidence =
      entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;

    if (relationships.length === 0) return entityConfidence;

    const relationshipConfidence =
      relationships.reduce((sum, r) => sum + r.confidence, 0) /
      relationships.length;

    // Weighted average favoring entities slightly
    return entityConfidence * 0.6 + relationshipConfidence * 0.4;
  }

  /**
   * Utility methods
   */
  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  }

  private mentionsEntity(text: string, entityName: string): boolean {
    return text.toLowerCase().includes(entityName.toLowerCase());
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
      dictionaryDB: false,
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
