/**
 * Entity analysis utilities
 * Extracted from duplicated entity extraction logic across processors
 */

import {
  EntityExtractor,
  ExtractionContext,
  ExtractionResult,
  _EnhancedEntity,
} from "../../entity-extractor";
import { DictionaryService } from "../../dictionary-service";
import { ExtractedEntity, EntityRelationship } from "../../utils";

export interface EntityAnalysisResult {
  entities: ExtractedEntity[];
  relationships: EntityRelationship[];
  entityClusters?: EntityCluster[];
  topicSummary?: TopicSummary;
  confidence: number;
}

export interface EntityCluster {
  id: string;
  entities: ExtractedEntity[];
  centralEntity: ExtractedEntity;
  coherenceScore: number;
  topic?: string;
}

export interface TopicSummary {
  primaryTopics: string[];
  secondaryTopics: string[];
  confidence: number;
  coverage: number; // Percentage of entities that relate to identified topics
}

export class EntityAnalyzer {
  private entityExtractor: EntityExtractor;
  private dictionaryService: DictionaryService;

  constructor(dictionaryService?: DictionaryService) {
    this.entityExtractor = new EntityExtractor(null); // Mock database for now
    this.dictionaryService = dictionaryService || new DictionaryService();
  }

  /**
   * Perform comprehensive entity analysis using enhanced NLP techniques
   */
  async analyzeEntitiesComprehensive(
    text: string,
    documentId: string = "unknown",
    domain: string = "general"
  ): Promise<EntityAnalysisResult> {
    console.log(
      `🔍 Performing enhanced entity analysis for document: ${documentId}`
    );

    // Create extraction context
    const context: ExtractionContext = {
      documentId,
      documentType: "text",
      domain,
      language: "en",
      processingStage: "initial",
      previousEntities: [],
      constraints: {
        maxEntities: 500,
        minConfidence: 0.6,
        allowedTypes: [
          { primary: "person", secondary: [], semantic: [], domain },
          { primary: "organization", secondary: [], semantic: [], domain },
          { primary: "location", secondary: [], semantic: [], domain },
          { primary: "concept", secondary: [], semantic: [], domain },
        ],
        forbiddenTypes: [],
        contextWindow: 100,
        overlapThreshold: 0.8,
      },
    };

    try {
      // Use comprehensive entity extraction
      const result: ExtractionResult =
        await this.entityExtractor.extractEntities(text, context);

      // Convert entities to legacy format for backward compatibility
      const entities: ExtractedEntity[] = result.entities.map((entity) => ({
        text: entity.text,
        type: this.mapEnhancedTypeToLegacy(entity.type.primary),
        confidence: entity.confidence,
        position: {
          start: entity.position.start,
          end: entity.position.end,
        },
        label: entity.text, // Use text as label
        aliases: [],
        canonicalForm: undefined,
        dictionaryDB: false, // TODO: Rename to follow purpose-first naming
        dictionarySource: undefined,
        dictionaryConfidence: undefined,
        dictionaryReasoning: undefined,
      }));

      // Convert enhanced relationships to legacy format
      const relationships: EntityRelationship[] = result.relationships.map(
        (rel) => ({
          source: rel.sourceEntity,
          target: rel.targetEntity,
          type: rel.type.category,
          confidence: rel.confidence,
          context: rel.context,
          strength: rel.strength || 0.5,
          evidence: rel.evidence || [],
          id: rel.id,
        })
      );

      // Convert clusters to legacy format
      const entityClusters: EntityCluster[] = result.clusters.map(
        (cluster) => ({
          id: cluster.id,
          entities: cluster.entities.map((enhanced) => ({
            text: enhanced.text,
            type: this.mapEnhancedTypeToLegacy(enhanced.type.primary),
            confidence: enhanced.confidence,
            position: {
              start: enhanced.position.start,
              end: enhanced.position.end,
            },
            label: enhanced.text,
          })),
          centralEntity: cluster.entities[0]
            ? {
                text: cluster.entities[0].text,
                type: this.mapEnhancedTypeToLegacy(
                  cluster.entities[0].type.primary
                ),
                confidence: cluster.entities[0].confidence,
                position: {
                  start: cluster.entities[0].position.start,
                  end: cluster.entities[0].position.end,
                },
                label: cluster.entities[0].text,
              }
            : {
                text: "unknown",
                type: "other",
                confidence: 0,
                position: { start: 0, end: 0 },
                label: "unknown",
              },
          coherenceScore: cluster.cohesion,
          topic: cluster.metadata.domain,
        })
      );

      // Generate topic summary
      const topicSummary: TopicSummary = {
        primaryTopics: this.extractPrimaryTopics(result.entities),
        secondaryTopics: this.extractSecondaryTopics(result.entities),
        confidence: result.quality.entityAccuracy,
        coverage: this.calculateTopicCoverage(result.entities, result.clusters),
      };

      const overallConfidence = result.quality.f1Score;

      console.log(
        `✅ Enhanced entity analysis completed: ${entities.length} entities, ${relationships.length} relationships, ${entityClusters.length} clusters`
      );

      return {
        entities,
        relationships,
        entityClusters,
        topicSummary,
        confidence: overallConfidence,
      };
    } catch (error) {
      console.error("❌ Enhanced entity analysis failed:", error);
      // Fallback to legacy analysis
      return this.analyzeEntities(text, {
        includeRelationships: true,
        includeClustering: true,
        includeTopicSummary: true,
        minConfidence: 0.6,
        domain,
      });
    }
  }

  /**
   * Map enhanced entity type to legacy type
   */
  private mapEnhancedTypeToLegacy(
    type: string
  ): "person" | "organization" | "location" | "concept" | "term" | "other" {
    switch (type) {
      case "person":
        return "person";
      case "organization":
        return "organization";
      case "location":
        return "location";
      case "concept":
        return "concept";
      case "event":
        return "concept";
      case "product":
        return "concept";
      case "technology":
        return "concept";
      default:
        return "other";
    }
  }

  /**
   * Extract primary topics from entities
   */
  private extractPrimaryTopics(entities: ExtractedEntity[]): string[] {
    const topics = new Map<string, number>();

    entities.forEach((entity) => {
      if (entity.type.primary === "concept") {
        const topic = entity.text.toLowerCase();
        topics.set(topic, (topics.get(topic) || 0) + 1);
      }
    });

    return Array.from(topics.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  /**
   * Extract secondary topics from entities
   */
  private extractSecondaryTopics(entities: ExtractedEntity[]): string[] {
    const topics = new Map<string, number>();

    entities.forEach((entity) => {
      if (entity.type.primary !== "concept") {
        const topic = entity.type.primary;
        topics.set(topic, (topics.get(topic) || 0) + 1);
      }
    });

    return Array.from(topics.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);
  }

  /**
   * Calculate topic coverage
   */
  private calculateTopicCoverage(
    entities: ExtractedEntity[],
    clusters
  ): number {
    const clusteredEntities = clusters.reduce(
      (sum, cluster) => sum + cluster.entities.length,
      0
    );
    return entities.length > 0
      ? (clusteredEntities / entities.length) * 100
      : 0;
  }

  /**
   * Perform comprehensive entity analysis on text (legacy method)
   */
  async analyzeEntities(
    text: string,
    options: {
      includeRelationships?: boolean;
      includeClustering?: boolean;
      includeTopicSummary?: boolean;
      minConfidence?: number;
    } = {}
  ): Promise<EntityAnalysisResult> {
    const {
      includeRelationships = true,
      includeClustering = false,
      includeTopicSummary = false,
      minConfidence = 0.5,
    } = options;

    if (!text || text.trim().length === 0) {
      return {
        entities: [],
        relationships: [],
        confidence: 0,
      };
    }

    // Extract entities
    const entities = this.entityExtractor
      .extractEntities(text)
      .filter((entity) => entity.confidence >= minConfidence);

    let relationships: EntityRelationship[] = [];
    let entityClusters: EntityCluster[] | undefined;
    let topicSummary: TopicSummary | undefined;

    // Extract relationships if requested
    if (includeRelationships && entities.length > 1) {
      // Use enhanced relationship extraction
      const processedEntities: ExtractedEntity[] = entities.map((entity) => ({
        id: `entity_${entity.text}`,
        text: entity.text,
        type: {
          primary: entity.type,
          secondary: [],
          semantic: [],
          domain: options.domain || "general",
        },
        subtype: "general",
        confidence: entity.confidence,
        position: {
          start: entity.position.start,
          end: entity.position.end,
          line: 0,
          column: 0,
          contextWindow: "",
          documentId: "unknown",
          section: "",
        },
        metadata: {
          frequency: 1,
          tfIdf: 0.5,
          centrality: 0.5,
          sentiment: {
            polarity: 0,
            subjectivity: 0,
            intensity: 0,
            emotions: {
              joy: 0,
              anger: 0,
              fear: 0,
              sadness: 0,
              surprise: 0,
              disgust: 0,
            },
          },
          importance: 0.7,
          novelty: 0.6,
        },
        relationships: [],
        hierarchical: {
          level: 0,
          parent: null,
          children: [],
          siblings: [],
          root: entity.text,
          path: [entity.text],
          depth: 0,
        },
        context: {
          documentContext: "unknown",
          sectionContext: "",
          sentenceContext: "",
          topicContext: [],
          coOccurrences: [],
          discourseRole: "subject",
        },
        provenance: {
          extractor: "entity_analyzer",
          extractionMethod: "ml-based",
          confidence: entity.confidence,
          validationStatus: "unvalidated",
          validationSources: [],
          lastUpdated: new Date(),
          version: 1,
        },
      }));

      const processedRelationships = this.entityExtractor.extractRelationships(
        processedEntities,
        text,
        {
          documentId: "unknown",
          documentType: "text",
          domain: options.domain || "general",
          language: "en",
          processingStage: "initial",
          previousEntities: [],
          constraints: {
            maxEntities: 100,
            minConfidence: 0.6,
            allowedTypes: [],
            forbiddenTypes: [],
            contextWindow: 100,
            overlapThreshold: 0.8,
          },
        }
      );

      relationships = processedRelationships.map((rel) => ({
        source: rel.sourceEntity,
        target: rel.targetEntity,
        type: rel.type.category,
        confidence: rel.confidence,
        context: rel.context,
        strength: rel.strength || 0.5,
        evidence: rel.evidence || [],
        id: rel.id,
      }));
    }

    // Perform entity clustering if requested
    if (includeClustering && entities.length > 3) {
      entityClusters = this.clusterEntities(entities, relationships);
    }

    // Generate topic summary if requested
    if (includeTopicSummary && entities.length > 0) {
      topicSummary = this.generateTopicSummary(entities, relationships);
    }

    // Calculate overall confidence
    const confidence = this.calculateAnalysisConfidence(
      entities,
      relationships,
      text.length
    );

    return {
      entities,
      relationships,
      entityClusters,
      topicSummary,
      confidence,
    };
  }

  /**
   * Cluster related entities together
   */
  private clusterEntities(
    entities: ExtractedEntity[],
    relationships: EntityRelationship[]
  ): EntityCluster[] {
    const clusters: EntityCluster[] = [];
    const processed = new Set<string>();

    // Build adjacency map from relationships
    const adjacencyMap = new Map<string, Set<string>>();
    for (const rel of relationships) {
      if (!adjacencyMap.has(rel.source)) {
        adjacencyMap.set(rel.source, new Set());
      }
      if (!adjacencyMap.has(rel.target)) {
        adjacencyMap.set(rel.target, new Set());
      }
      adjacencyMap.get(rel.source)!.add(rel.target);
      adjacencyMap.get(rel.target)!.add(rel.source);
    }

    // Find connected components (clusters)
    for (const entity of entities) {
      if (processed.has(entity.text)) continue;

      const cluster = this.findConnectedEntities(
        entity,
        entities,
        adjacencyMap,
        processed
      );
      if (cluster.length > 1) {
        // Only create clusters with multiple entities
        const centralEntity = this.findCentralEntity(cluster, adjacencyMap);
        const coherenceScore = this.calculateClusterCoherence(
          cluster,
          adjacencyMap
        );

        clusters.push({
          id: `cluster_${clusters.length + 1}`,
          entities: cluster,
          centralEntity,
          coherenceScore,
          topic: this.inferClusterTopic(cluster),
        });
      }
    }

    return clusters;
  }

  /**
   * Find all entities connected to a given entity
   */
  private findConnectedEntities(
    startEntity: ExtractedEntity,
    allEntities: ExtractedEntity[],
    adjacencyMap: Map<string, Set<string>>,
    processed: Set<string>
  ): ExtractedEntity[] {
    const cluster: ExtractedEntity[] = [];
    const queue = [startEntity];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.text)) continue;

      visited.add(current.text);
      processed.add(current.text);
      cluster.push(current);

      // Add connected entities to queue
      const connections = adjacencyMap.get(current.text);
      if (connections) {
        for (const connectedText of connections) {
          if (!visited.has(connectedText)) {
            const connectedEntity = allEntities.find(
              (e) => e.text === connectedText
            );
            if (connectedEntity) {
              queue.push(connectedEntity);
            }
          }
        }
      }
    }

    return cluster;
  }

  /**
   * Find the most central entity in a cluster
   */
  private findCentralEntity(
    cluster: ExtractedEntity[],
    adjacencyMap: Map<string, Set<string>>
  ): ExtractedEntity {
    let maxConnections = -1;
    let centralEntity = cluster[0];

    for (const entity of cluster) {
      const connections = adjacencyMap.get(entity.text)?.size || 0;
      if (connections > maxConnections) {
        maxConnections = connections;
        centralEntity = entity;
      }
    }

    return centralEntity;
  }

  /**
   * Calculate coherence score for a cluster
   */
  private calculateClusterCoherence(
    cluster: ExtractedEntity[],
    adjacencyMap: Map<string, Set<string>>
  ): number {
    if (cluster.length < 2) return 1.0;

    const maxPossibleConnections = (cluster.length * (cluster.length - 1)) / 2;
    let actualConnections = 0;

    for (const entity of cluster) {
      const connections = adjacencyMap.get(entity.text);
      if (connections) {
        for (const other of cluster) {
          if (entity !== other && connections.has(other.text)) {
            actualConnections++;
          }
        }
      }
    }

    // Avoid double counting
    actualConnections = actualConnections / 2;

    return actualConnections / maxPossibleConnections;
  }

  /**
   * Infer topic for a cluster based on entity types and names
   */
  private inferClusterTopic(cluster: ExtractedEntity[]): string | undefined {
    // Group entities by type
    const typeGroups = new Map<string, ExtractedEntity[]>();
    for (const entity of cluster) {
      if (!typeGroups.has(entity.type)) {
        typeGroups.set(entity.type, []);
      }
      typeGroups.get(entity.type)!.push(entity);
    }

    // Find dominant type
    let dominantType = "";
    let maxCount = 0;
    for (const [type, entities] of typeGroups) {
      if (entities.length > maxCount) {
        maxCount = entities.length;
        dominantType = type;
      }
    }

    // Generate topic based on dominant type and entities
    if (dominantType === "PERSON" && maxCount >= 2) {
      return "People & Organizations";
    } else if (dominantType === "LOCATION" && maxCount >= 2) {
      return "Geography & Places";
    } else if (dominantType === "ORG" && maxCount >= 2) {
      return "Organizations & Companies";
    } else if (dominantType === "DATE" && maxCount >= 2) {
      return "Timeline & Events";
    }

    return undefined;
  }

  /**
   * Generate topic summary from entities and relationships
   */
  private generateTopicSummary(
    entities: ExtractedEntity[],
    _relationships: EntityRelationship[]
  ): TopicSummary {
    // Count entity types
    const typeCounts = new Map<string, number>();
    for (const entity of entities) {
      typeCounts.set(entity.type, (typeCounts.get(entity.type) || 0) + 1);
    }

    // Identify primary topics (types with most entities)
    const sortedTypes = Array.from(typeCounts.entries()).sort(
      ([, a], [, b]) => b - a
    );

    const primaryTopics = sortedTypes
      .slice(0, 2)
      .map(([type]) => this.typeToTopic(type));
    const secondaryTopics = sortedTypes
      .slice(2, 5)
      .map(([type]) => this.typeToTopic(type));

    // Calculate confidence based on entity distribution
    const totalEntities = entities.length;
    const primaryCount = sortedTypes
      .slice(0, 2)
      .reduce((sum, [, count]) => sum + count, 0);
    const confidence = totalEntities > 0 ? primaryCount / totalEntities : 0;

    // Calculate coverage (how many entities relate to identified topics)
    const coverage =
      totalEntities > 0
        ? (primaryCount +
            sortedTypes
              .slice(2, 5)
              .reduce((sum, [, count]) => sum + count, 0)) /
          totalEntities
        : 0;

    return {
      primaryTopics,
      secondaryTopics,
      confidence,
      coverage,
    };
  }

  /**
   * Convert entity type to human-readable topic
   */
  private typeToTopic(type: string): string {
    const topicMap: Record<string, string> = {
      PERSON: "People",
      ORG: "Organizations",
      LOCATION: "Places",
      DATE: "Timeline",
      MONEY: "Financial",
      PERCENT: "Statistics",
      PRODUCT: "Products",
      EVENT: "Events",
      WORK_OF_ART: "Creative Works",
      LAW: "Legal",
      LANGUAGE: "Languages",
    };

    return topicMap[type] || type.toLowerCase();
  }

  /**
   * Calculate confidence in the analysis
   */
  private calculateAnalysisConfidence(
    entities: ExtractedEntity[],
    relationships: EntityRelationship[],
    textLength: number
  ): number {
    if (entities.length === 0) return 0;

    // Base confidence on entity confidence scores
    const avgEntityConfidence =
      entities.reduce((sum, e) => sum + e.confidence, 0) / entities.length;

    // Adjust based on entity density
    const entityDensity = entities.length / Math.max(textLength / 100, 1); // Entities per 100 characters
    const densityBonus = Math.min(0.2, entityDensity * 0.1);

    // Adjust based on relationship richness
    const relationshipRatio =
      relationships.length / Math.max(entities.length, 1);
    const relationshipBonus = Math.min(0.1, relationshipRatio * 0.2);

    return Math.min(1, avgEntityConfidence + densityBonus + relationshipBonus);
  }

  /**
   * Enhance entities with dictionary data using the DictionaryService
   */
  static async enhanceEntitiesWithDictionary(
    entities: ExtractedEntity[],
    dictionaryService: DictionaryService,
    context?: string
  ): Promise<ExtractedEntity[]> {
    console.log(
      `🔍 Enhancing ${entities.length} entities with dictionary data`
    );

    const processedEntities = [...entities];

    for (const entity of processedEntities) {
      try {
        // Create canonicalization request
        const canonicalizationRequest = {
          entities: [
            {
              name: entity.label,
              type: entity.type, // Type mapping may need adjustment
              context,
              aliases: entity.aliases,
            },
          ],
        };

        // Get canonicalization results
        const results = await dictionaryService.canonicalizeEntities(
          canonicalizationRequest
        );

        if (results.length > 0) {
          const result = results[0];

          // Update entity with dictionary data
          if (result.confidence >= 0.7) {
            entity.canonicalForm = result.canonicalName;
            entity.dictionaryDB = true;
            entity.dictionarySource = result.source;
            entity.dictionaryConfidence = result.confidence;
            entity.dictionaryReasoning = result.reasoning;

            // Add synonyms as additional aliases
            const synonymResults = await dictionaryService.expandSearchTerms({
              queryTerms: [result.canonicalName],
              expansionTypes: ["synonyms"],
              maxExpansionsPerTerm: 5,
            });

            if (synonymResults.length > 0) {
              const synonyms = synonymResults[0].expandedTerms
                .filter((term) => term.expansionType === "synonyms")
                .map((term) => term.term);

              entity.aliases = [...(entity.aliases || []), ...synonyms];
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to enhance entity "${entity.label}": ${error}`);
        // Continue with original entity
      }
    }

    console.log(
      `✅ Enhanced ${
        processedEntities.filter((e) => e.dictionaryDB).length
      } entities with dictionary data`
    );
    return processedEntities;
  }
}
