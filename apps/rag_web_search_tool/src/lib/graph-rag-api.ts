// Enhanced API service for Graph RAG integration
const GRAPH_RAG_API_BASE_URL = "http://localhost:3001/api/graph-rag";

export interface GraphRagEntity {
  id: string;
  name: string;
  type:
    | "PERSON"
    | "ORGANIZATION"
    | "CONCEPT"
    | "DOCUMENT"
    | "EVENT"
    | "LOCATION"
    | "TECHNOLOGY"
    | "PROCESS"
    | "METRIC"
    | "PRODUCT";
  confidence: number;
  aliases?: string[];
  properties?: Record<string, unknown>;
  contextualRelevance?: number;
}

export interface GraphRagRelationship {
  id: string;
  type:
    | "MENTIONS"
    | "CONTAINS"
    | "RELATES_TO"
    | "DEPENDS_ON"
    | "CAUSES"
    | "PART_OF"
    | "SIMILAR_TO"
    | "OPPOSITE_OF"
    | "TEMPORAL_BEFORE"
    | "TEMPORAL_AFTER";
  sourceEntityId: string;
  targetEntityId: string;
  confidence: number;
  strength: number;
  isDirectional: boolean;
  contextualImportance?: number;
  sourceNode?: GraphRagEntity;
  targetNode?: GraphRagEntity;
}

export interface GraphRagSearchResult {
  id: string;
  text: string;
  score: number;
  similarity: number;
  rankingScore?: number;
  metadata: {
    chunkId: string;
    sourceFile: string;
    contentType: string;
    processingTime: string;
    characterCount: number;
    section?: string;
    breadcrumbs?: string[];
    uri?: string;
    url?: string;
    updatedAt?: string;
    createdAt?: string;
  };
  entities: GraphRagEntity[];
  relationships: GraphRagRelationship[];
  explanation?: string;
  provenance?: {
    searchStrategy: string;
    vectorSearchTime: number;
    graphTraversalTime: number;
    resultFusionTime: number;
    totalExecutionTime: number;
  };
}

export interface GraphRagSearchResponse {
  results: GraphRagSearchResult[];
  metrics: {
    totalResults: number;
    executionTime: number;
    vectorResults: number;
    graphResults: number;
    entitiesFound: number;
    relationshipsTraversed: number;
    vectorSearchTime: number;
    graphTraversalTime: number;
    resultFusionTime: number;
  };
  explanation?: {
    queryEntities: GraphRagEntity[];
    searchStrategy: string;
    reasoningSteps: Array<{
      step: number;
      description: string;
      confidence: number;
      evidence: string[];
      entitiesInvolved: string[];
    }>;
    qualityMetrics: {
      completeness: number;
      accuracy: number;
      consistency: number;
      freshness: number;
      relevance: number;
    };
  };
}

export interface ReasoningPath {
  id: string;
  entities: GraphRagEntity[];
  relationships: GraphRagRelationship[];
  confidence: number;
  strength: number;
  depth: number;
  explanation: string;
  evidence: Array<{
    id: string;
    type: string;
    content: string;
    confidence: number;
    sourceChunkIds: string[];
    supportingEntities: string[];
  }>;
  logicalSteps: Array<{
    step: number;
    type: string;
    description: string;
    confidence: number;
    premises: string[];
    conclusion: string;
    logicalRule: string;
  }>;
}

export interface ReasoningResult {
  paths: ReasoningPath[];
  bestPath?: ReasoningPath;
  confidence: number;
  explanation: string;
  metrics: {
    totalPaths: number;
    averageDepth: number;
    processingTime: number;
    exploredNodes: number;
    exploredRelationships: number;
  };
  alternativeHypotheses: Array<{
    hypothesis: string;
    confidence: number;
    supportingPaths: string[];
    evidence: string[];
  }>;
  contradictions: Array<{
    description: string;
    conflictingPaths: string[];
    evidence: string[];
  }>;
}

export interface GraphRagSearchOptions {
  maxResults?: number;
  maxHops?: number;
  includeExplanation?: boolean;
  strategy?: "vector_only" | "graph_only" | "hybrid" | "adaptive";
  enableRanking?: boolean;
  enableProvenance?: boolean;
  filters?: {
    entityTypes?: string[];
    relationshipTypes?: string[];
    sourceFiles?: string[];
    minConfidence?: number;
    dateRange?: {
      start: string;
      end: string;
    };
  };
}

export interface ReasoningOptions {
  maxDepth?: number;
  minConfidence?: number;
  reasoningType?: "exploratory" | "targeted" | "comparative" | "causal";
  enableExplanation?: boolean;
  enableProvenance?: boolean;
}

export interface GraphStatistics {
  nodeCount: number;
  relationshipCount: number;
  entityTypeDistribution: Record<string, number>;
  relationshipTypeDistribution: Record<string, number>;
  averageNodeDegree: number;
  clusteringCoefficient: number;
  connectedComponents: number;
  diameter: number;
  lastUpdated: string;
}

export interface ProvenanceRecord {
  id: string;
  sessionId: string;
  userId?: string;
  timestamp: string;
  operation: {
    type: string;
    subtype?: string;
    version: string;
    configuration: Record<string, unknown>;
  };
  inputData: {
    query?: string;
    entities?: string[];
    filters?: Record<string, unknown>;
    options?: Record<string, unknown>;
  };
  outputData: {
    results;
    metrics: Record<string, number>;
    confidence: number;
    explanation?: string;
  };
  qualityMetrics: {
    completeness: number;
    accuracy: number;
    consistency: number;
    freshness: number;
    relevance: number;
    coverage: number;
    reliability: number;
  };
  explanation?: string;
}

class GraphRagApiService {
  private baseUrl: string;

  constructor(baseUrl: string = GRAPH_RAG_API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Perform hybrid search using Graph RAG system
   */
  async search(
    query: string,
    options: GraphRagSearchOptions = {}
  ): Promise<GraphRagSearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          filters: options.filters,
          options: {
            maxResults: options.maxResults || 20,
            maxHops: options.maxHops || 2,
            includeExplanation: options.includeExplanation ?? true,
            strategy: options.strategy || "hybrid",
            enableRanking: options.enableRanking ?? true,
            enableProvenance: options.enableProvenance ?? false,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Graph RAG search failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Graph RAG search error:", error);
      throw error;
    }
  }

  /**
   * Perform multi-hop reasoning
   */
  async reason(
    startEntities: string[],
    question: string,
    options: ReasoningOptions = {}
  ): Promise<ReasoningResult> {
    try {
      const response = await fetch(`${this.baseUrl}/reasoning`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startEntities,
          question,
          maxDepth: options.maxDepth || 3,
          minConfidence: options.minConfidence || 0.3,
          reasoningType: options.reasoningType || "exploratory",
          enableExplanation: options.enableExplanation ?? true,
          enableProvenance: options.enableProvenance ?? false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Graph RAG reasoning failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Graph RAG reasoning error:", error);
      throw error;
    }
  }

  /**
   * Get entities by type or search
   */
  async getEntities(
    options: {
      type?: string;
      search?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    entities: GraphRagEntity[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const params = new URLSearchParams();
      if (options.type) params.append("type", options.type);
      if (options.search) params.append("search", options.search);
      if (options.limit) params.append("limit", options.limit.toString());
      if (options.offset) params.append("offset", options.offset.toString());

      const response = await fetch(`${this.baseUrl}/entities?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to get entities: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Get entities error:", error);
      throw error;
    }
  }

  /**
   * Get relationships by type or entities
   */
  async getRelationships(
    options: {
      type?: string;
      sourceNodeId?: string;
      targetNodeId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    relationships: GraphRagRelationship[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const params = new URLSearchParams();
      if (options.type) params.append("type", options.type);
      if (options.sourceNodeId)
        params.append("sourceNodeId", options.sourceNodeId);
      if (options.targetNodeId)
        params.append("targetNodeId", options.targetNodeId);
      if (options.limit) params.append("limit", options.limit.toString());
      if (options.offset) params.append("offset", options.offset.toString());

      const response = await fetch(`${this.baseUrl}/relationships?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to get relationships: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Get relationships error:", error);
      throw error;
    }
  }

  /**
   * Get knowledge graph statistics
   */
  async getStatistics(): Promise<GraphStatistics> {
    try {
      const response = await fetch(`${this.baseUrl}/statistics`);

      if (!response.ok) {
        throw new Error(`Failed to get statistics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Get statistics error:", error);
      throw error;
    }
  }

  /**
   * Get provenance records
   */
  async getProvenance(
    options: {
      sessionId?: string;
      userId?: string;
      operationType?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    records: ProvenanceRecord[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const params = new URLSearchParams();
      if (options.sessionId) params.append("sessionId", options.sessionId);
      if (options.userId) params.append("userId", options.userId);
      if (options.operationType)
        params.append("operationType", options.operationType);
      if (options.limit) params.append("limit", options.limit.toString());
      if (options.offset) params.append("offset", options.offset.toString());

      const response = await fetch(`${this.baseUrl}/provenance?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to get provenance: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Get provenance error:", error);
      throw error;
    }
  }

  /**
   * Find similar entities
   */
  async findSimilar(
    entityId: string,
    options: {
      threshold?: number;
      limit?: number;
    } = {}
  ): Promise<GraphRagEntity[]> {
    try {
      const params = new URLSearchParams();
      params.append("nodeId", entityId);
      if (options.threshold)
        params.append("threshold", options.threshold.toString());
      if (options.limit) params.append("limit", options.limit.toString());

      const response = await fetch(
        `${this.baseUrl}/entities/similar?${params}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to find similar entities: ${response.statusText}`
        );
      }

      const result = await response.json();
      return result.entities || [];
    } catch (error) {
      console.error("Find similar entities error:", error);
      throw error;
    }
  }

  /**
   * Find shortest path between entities
   */
  async findShortestPath(
    startEntityId: string,
    endEntityId: string,
    maxDepth: number = 6
  ): Promise<ReasoningPath | null> {
    try {
      const params = new URLSearchParams();
      params.append("startNodeId", startEntityId);
      params.append("endNodeId", endEntityId);
      params.append("maxDepth", maxDepth.toString());

      const response = await fetch(
        `${this.baseUrl}/entities/shortest-path?${params}`
      );

      if (!response.ok) {
        throw new Error(`Failed to find shortest path: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Find shortest path error:", error);
      throw error;
    }
  }

  /**
   * Health check for Graph RAG system
   */
  async healthCheck(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    version: string;
    services: Record<string, string>;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Health check error:", error);
      throw error;
    }
  }
}

// Create singleton instance
export const graphRagApiService = new GraphRagApiService();

// Export the class for custom instances
export { GraphRagApiService };
