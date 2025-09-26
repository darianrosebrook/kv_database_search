/**
 * Entity analysis utilities
 * Extracted from duplicated entity extraction logic across processors
 */

import {
  EnhancedEntityExtractor,
  ExtractedEntity,
  EntityRelationship,
} from "../../utils";

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
  private entityExtractor: EnhancedEntityExtractor;

  constructor() {
    this.entityExtractor = new EnhancedEntityExtractor();
  }

  /**
   * Perform comprehensive entity analysis on text
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
      relationships = this.entityExtractor.extractRelationships(text, entities);
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
    relationships: EntityRelationship[]
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
}
