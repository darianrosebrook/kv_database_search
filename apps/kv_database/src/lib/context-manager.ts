/**
 * Context Manager Service
 *
 * Manages relationships between documents and maintains context for
 * better search results and knowledge graph functionality.
 *
 * @author @darianrosebrook
 */

import { ObsidianDatabase } from "./database";
import { ObsidianEmbeddingService } from "./embeddings";

export interface DocumentRelationship {
  sourceId: string;
  targetId: string;
  relationshipType:
    | "references"
    | "similar"
    | "parent"
    | "child"
    | "related"
    | "wikilink";
  strength: number; // 0-1, how strong the relationship is
  metadata?: {
    context?: string; // Context where the relationship was found
    section?: string; // Section in the document
    linkType?: string; // Type of link (e.g., '[[wikilink]]', 'http', etc.)
  };
}

export interface DocumentContext {
  documentId: string;
  relatedDocuments: Array<{
    documentId: string;
    relationshipType: string;
    strength: number;
    context?: string;
  }>;
  topics: string[];
  importance: number; // How important this document is in the knowledge base
  lastAccessed?: string;
  accessCount: number;
}

export interface ContextQuery {
  documentIds: string[];
  maxRelated: number;
  relationshipTypes?: string[];
  minStrength?: number;
  includeIndirect?: boolean; // Include documents related to related documents
}

export class ContextManager {
  private database: ObsidianDatabase;
  private embeddingService: ObsidianEmbeddingService;
  private relationships: Map<string, DocumentRelationship[]> = new Map();
  private contexts: Map<string, DocumentContext> = new Map();

  constructor(
    database: ObsidianDatabase,
    embeddingService: ObsidianEmbeddingService
  ) {
    this.database = database;
    this.embeddingService = embeddingService;
  }

  /**
   * Add a relationship between two documents
   */
  async addRelationship(relationship: DocumentRelationship): Promise<void> {
    const key = `${relationship.sourceId}->${relationship.targetId}`;

    if (!this.relationships.has(key)) {
      this.relationships.set(key, []);
    }

    // Check if relationship already exists
    const existing = this.relationships.get(key)!;
    const existingRel = existing.find(
      (r) =>
        r.relationshipType === relationship.relationshipType &&
        r.strength === relationship.strength
    );

    if (!existingRel) {
      existing.push(relationship);
      console.log(
        `📊 Added relationship: ${relationship.sourceId} -> ${relationship.targetId} (${relationship.relationshipType})`
      );
    }
  }

  /**
   * Get relationships for a document
   */
  getRelationships(documentId: string): DocumentRelationship[] {
    const outgoing = this.relationships.get(`${documentId}->*`) || [];
    const incoming = this.relationships.get(`*->${documentId}`) || [];

    // Deduplicate by target ID and relationship type
    const combined = [...outgoing, ...incoming];
    const unique = new Map<string, DocumentRelationship>();

    combined.forEach((rel) => {
      const key = `${rel.targetId}-${rel.relationshipType}`;
      if (!unique.has(key) || unique.get(key)!.strength < rel.strength) {
        unique.set(key, rel);
      }
    });

    return Array.from(unique.values());
  }

  /**
   * Get context for a set of documents
   */
  async getDocumentContext(query: ContextQuery): Promise<DocumentContext[]> {
    const contexts: DocumentContext[] = [];

    for (const docId of query.documentIds) {
      const context = await this.buildDocumentContext(docId, query);
      if (context) {
        contexts.push(context);
      }
    }

    return contexts;
  }

  private async buildDocumentContext(
    documentId: string,
    query: ContextQuery
  ): Promise<DocumentContext | null> {
    // Check cache first
    if (this.contexts.has(documentId)) {
      return this.contexts.get(documentId)!;
    }

    const relationships = this.getRelationships(documentId);
    let filteredRelationships = relationships;

    // Apply filters
    if (query.relationshipTypes && query.relationshipTypes.length > 0) {
      filteredRelationships = filteredRelationships.filter((r) =>
        query.relationshipTypes!.includes(r.relationshipType)
      );
    }

    if (query.minStrength) {
      filteredRelationships = filteredRelationships.filter(
        (r) => r.strength >= query.minStrength!
      );
    }

    // Sort by strength and limit
    filteredRelationships.sort((a, b) => b.strength - a.strength);
    const topRelationships = filteredRelationships.slice(0, query.maxRelated);

    // Build related documents list
    const relatedDocuments = topRelationships.map((rel) => ({
      documentId: rel.targetId,
      relationshipType: rel.relationshipType,
      strength: rel.strength,
      context: rel.metadata?.context,
    }));

    // Extract topics from the document (simplified)
    const topics = await this.extractTopics(documentId);

    // Calculate importance based on relationships and access patterns
    const importance = this.calculateImportance(documentId, topRelationships);

    const context: DocumentContext = {
      documentId,
      relatedDocuments,
      topics,
      importance,
      accessCount: 0, // TODO: Track access patterns
    };

    // Cache the context
    this.contexts.set(documentId, context);

    return context;
  }

  private async extractTopics(documentId: string): Promise<string[]> {
    // This would extract topics from the document content
    // For now, return mock topics based on common patterns
    const topics: string[] = [];

    try {
      // TODO: Implement actual topic extraction from document content
      // For now, return some default topics
      const commonTopics = [
        "documentation",
        "tutorial",
        "reference",
        "guide",
        "api",
        "component",
        "system",
        "architecture",
        "database",
        "security",
      ];

      // Mock topic extraction
      if (documentId.includes("api") || documentId.includes("endpoint")) {
        topics.push("api", "documentation");
      } else if (
        documentId.includes("component") ||
        documentId.includes("ui")
      ) {
        topics.push("component", "frontend");
      } else {
        topics.push(...commonTopics.slice(0, 2));
      }
    } catch (error) {
      console.warn("Failed to extract topics:", error);
    }

    return topics;
  }

  private calculateImportance(
    documentId: string,
    relationships: DocumentRelationship[]
  ): number {
    // Calculate document importance based on:
    // 1. Number of incoming relationships
    // 2. Strength of relationships
    // 3. Diversity of relationship types

    const incomingRels = relationships.filter((r) => r.targetId === documentId);
    const outgoingRels = relationships.filter((r) => r.sourceId === documentId);

    const relationshipScore = incomingRels.reduce(
      (sum, rel) => sum + rel.strength,
      0
    );
    const diversityScore = new Set(relationships.map((r) => r.relationshipType))
      .size;
    const connectivityScore = (incomingRels.length + outgoingRels.length) / 10; // Normalize

    // Weighted importance score
    const importance =
      relationshipScore * 0.5 + // 50% from relationship strength
      diversityScore * 0.3 + // 30% from relationship diversity
      connectivityScore * 0.2; // 20% from connectivity

    return Math.min(1.0, importance); // Cap at 1.0
  }

  /**
   * Find related documents using semantic similarity
   */
  async findSimilarDocuments(
    documentId: string,
    limit = 5,
    threshold = 0.7
  ): Promise<
    Array<{ documentId: string; similarity: number; relationshipType: string }>
  > {
    try {
      // This would search for semantically similar documents
      // For now, return mock results
      const mockSimilarDocs = [
        {
          documentId: `${documentId}_similar_1`,
          similarity: 0.85,
          relationshipType: "similar",
        },
        {
          documentId: `${documentId}_similar_2`,
          similarity: 0.78,
          relationshipType: "similar",
        },
        {
          documentId: `${documentId}_similar_3`,
          similarity: 0.72,
          relationshipType: "related",
        },
      ];

      return mockSimilarDocs
        .filter((doc) => doc.similarity >= threshold)
        .slice(0, limit);
    } catch (error) {
      console.error("Failed to find similar documents:", error);
      return [];
    }
  }

  /**
   * Get context-aware search suggestions
   */
  async getContextualSuggestions(
    query: string,
    currentContext: string[] = []
  ): Promise<
    Array<{ suggestion: string; confidence: number; context?: string }>
  > {
    const suggestions: Array<{
      suggestion: string;
      confidence: number;
      context?: string;
    }> = [];

    try {
      // Analyze current context to provide better suggestions
      const contextDocs = await this.getDocumentContext({
        documentIds: currentContext,
        maxRelated: 10,
        includeIndirect: true,
      });

      // Extract topics from context
      const contextTopics = new Set<string>();
      contextDocs.forEach((ctx) => {
        ctx.topics.forEach((topic) => contextTopics.add(topic));
      });

      // Generate suggestions based on context topics
      const topicsArray = Array.from(contextTopics);
      if (topicsArray.length > 0) {
        suggestions.push({
          suggestion: `${query} ${topicsArray[0]}`,
          confidence: 0.8,
          context: `Based on your current context (${topicsArray[0]})`,
        });

        if (topicsArray.length > 1) {
          suggestions.push({
            suggestion: `${query} ${topicsArray[1]}`,
            confidence: 0.6,
            context: `Related topic: ${topicsArray[1]}`,
          });
        }
      }

      // Add general suggestions
      suggestions.push({
        suggestion: `${query} tutorial`,
        confidence: 0.7,
        context: "Looking for learning materials",
      });

      suggestions.push({
        suggestion: `${query} examples`,
        confidence: 0.6,
        context: "Finding practical examples",
      });
    } catch (error) {
      console.warn("Failed to generate contextual suggestions:", error);
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  /**
   * Update document access patterns for better context
   */
  async updateAccessPattern(documentId: string): Promise<void> {
    // This would track document access patterns for better recommendations
    // For now, just log the access
    console.log(`📖 Document accessed: ${documentId}`);
  }

  /**
   * Get knowledge graph data for visualization
   */
  async getKnowledgeGraphData(
    centerDocumentId?: string,
    maxNodes = 50
  ): Promise<{
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      importance: number;
    }>;
    edges: Array<{
      source: string;
      target: string;
      type: string;
      strength: number;
    }>;
  }> {
    const nodes: Array<{
      id: string;
      label: string;
      type: string;
      importance: number;
    }> = [];
    const edges: Array<{
      source: string;
      target: string;
      type: string;
      strength: number;
    }> = [];

    try {
      // Get all relationships
      const allRelationships = Array.from(this.relationships.values()).flat();

      // Build nodes
      const nodeSet = new Set<string>();
      allRelationships.forEach((rel) => {
        nodeSet.add(rel.sourceId);
        nodeSet.add(rel.targetId);
      });

      // Add center node if specified
      if (centerDocumentId) {
        nodeSet.add(centerDocumentId);
      }

      // Limit nodes for performance
      const nodeIds = Array.from(nodeSet).slice(0, maxNodes);

      nodes.push(
        ...nodeIds.map((id) => ({
          id,
          label: id.split("_").slice(-1)[0] || id, // Use last part as label
          type: "document",
          importance: this.calculateImportance(id, this.getRelationships(id)),
        }))
      );

      // Build edges
      allRelationships.forEach((rel) => {
        if (nodeIds.includes(rel.sourceId) && nodeIds.includes(rel.targetId)) {
          edges.push({
            source: rel.sourceId,
            target: rel.targetId,
            type: rel.relationshipType,
            strength: rel.strength,
          });
        }
      });
    } catch (error) {
      console.error("Failed to build knowledge graph:", error);
    }

    return { nodes, edges };
  }

  /**
   * Clear context cache
   */
  clearCache(): void {
    this.contexts.clear();
    this.relationships.clear();
    console.log("🧹 Context manager cache cleared");
  }

  /**
   * Get context statistics
   */
  getContextStats(): {
    totalRelationships: number;
    totalContexts: number;
    averageRelationshipsPerDocument: number;
  } {
    const totalRelationships = Array.from(this.relationships.values()).flat()
      .length;
    const totalContexts = this.contexts.size;
    const averageRelationshipsPerDocument =
      totalContexts > 0 ? totalRelationships / totalContexts : 0;

    return {
      totalRelationships,
      totalContexts,
      averageRelationshipsPerDocument,
    };
  }
}

export default ContextManager;
