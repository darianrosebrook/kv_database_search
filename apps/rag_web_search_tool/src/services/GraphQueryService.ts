// Graph Query Engine Service - UI integration for natural language graph queries
const GRAPH_QUERY_API_BASE = "http://localhost:3001/graph";

export interface GraphQuery {
  id: string;
  naturalLanguage: string;
  intent: {
    primary:
      | "relationship_discovery"
      | "path_finding"
      | "pattern_matching"
      | "similarity_search"
      | "recommendation"
      | "analysis";
    secondary: string[];
    confidence: number;
    parameters: Record<string, unknown>;
    domain: string;
  };
  graphPatterns: Array<{
    nodes: Array<{
      id: string;
      type: string;
      properties: Record<string, unknown>;
      constraints: Record<string, unknown>;
    }>;
    edges: Array<{
      source: string;
      target: string;
      type: string;
      properties: Record<string, unknown>;
      direction: "unidirectional" | "bidirectional";
    }>;
    constraints: {
      maxDepth?: number;
      maxEntities?: number;
      requiredTypes?: string[];
      forbiddenTypes?: string[];
    };
  }>;
  traversalStrategy: {
    algorithm:
      | "dfs"
      | "bfs"
      | "dijkstra"
      | "astar"
      | "random_walk"
      | "pagerank";
    maxDepth: number;
    maxNodes: number;
    maxEdges: number;
    direction: "outbound" | "inbound" | "bidirectional";
    weights: Record<string, number>;
  };
  constraints: {
    maxExecutionTime: number;
    maxMemoryUsage: number;
    maxResults: number;
    minConfidence: number;
    enableCaching: boolean;
    timeout: number;
  };
  context: {
    workspaceName?: string;
    userId?: string;
    sessionId?: string;
    previousQueries?: string[];
    userPreferences?: Record<string, unknown>;
    domainContext?: Record<string, unknown>;
  };
  metadata: {
    createdAt: string;
    complexity: "low" | "medium" | "high";
    estimatedCost: number;
    priority: "low" | "medium" | "high" | "critical";
    tags: string[];
    notes: string;
  };
}

export interface GraphQueryResult {
  query: GraphQuery;
  results: {
    nodes: Array<{
      id: string;
      text: string;
      type: string;
      confidence: number;
      metadata: Record<string, unknown>;
      position: {
        start: number;
        end: number;
        line: number;
        column: number;
        contextWindow: string;
        documentId: string;
        section: string;
      };
      relationships: Array<{
        id: string;
        sourceEntity: string;
        targetEntity: string;
        type: {
          category: string;
          subcategory: string;
          confidence: number;
        };
        context: string;
        strength: number;
        evidence: string[];
      }>;
      hierarchical: {
        level: number;
        parent: string | null;
        children: string[];
        siblings: string[];
        root: string;
        path: string[];
        depth: number;
      };
      context: {
        documentContext: string;
        sectionContext: string;
        sentenceContext: string;
        topicContext: string[];
        coOccurrences: string[];
        discourseRole: string;
      };
      provenance: {
        extractor: string;
        extractionMethod: string;
        confidence: number;
        validationStatus: string;
        validationSources: string[];
        lastUpdated: string;
        version: number;
      };
    }>;
    edges: Array<{
      source: string;
      target: string;
      type: string;
      confidence: number;
      context: string;
      strength: number;
      evidence: string[];
      id: string;
    }>;
    clusters: Array<{
      id: string;
      entities: Array<{
        text: string;
        type: string;
        confidence: number;
        position: {
          start: number;
          end: number;
          line: number;
          column: number;
          contextWindow: string;
          documentId: string;
          section: string;
        };
        metadata: {
          frequency: number;
          tfIdf: number;
          centrality: number;
          sentiment: {
            polarity: number;
            subjectivity: number;
            intensity: number;
            emotions: {
              joy: number;
              anger: number;
              fear: number;
              sadness: number;
              surprise: number;
              disgust: number;
            };
          };
          importance: number;
          novelty: number;
        };
        relationships: Array<{
          id: string;
          sourceEntity: string;
          targetEntity: string;
          type: {
            category: string;
            subcategory: string;
            confidence: number;
          };
          context: string;
          strength: number;
          evidence: string[];
        }>;
        hierarchical: {
          level: number;
          parent: string | null;
          children: string[];
          siblings: string[];
          root: string;
          path: string[];
          depth: number;
        };
        context: {
          documentContext: string;
          sectionContext: string;
          sentenceContext: string;
          topicContext: string[];
          coOccurrences: string[];
          discourseRole: string;
        };
        provenance: {
          extractor: string;
          extractionMethod: string;
          confidence: number;
          validationStatus: string;
          validationSources: string[];
          lastUpdated: string;
          version: number;
        };
      }>;
      centralEntity: {
        text: string;
        type: string;
        confidence: number;
        position: {
          start: number;
          end: number;
          line: number;
          column: number;
          contextWindow: string;
          documentId: string;
          section: string;
        };
        metadata: {
          frequency: number;
          tfIdf: number;
          centrality: number;
          sentiment: {
            polarity: number;
            subjectivity: number;
            intensity: number;
            emotions: {
              joy: number;
              anger: number;
              fear: number;
              sadness: number;
              surprise: number;
              disgust: number;
            };
          };
          importance: number;
          novelty: number;
        };
        relationships: Array<{
          id: string;
          sourceEntity: string;
          targetEntity: string;
          type: {
            category: string;
            subcategory: string;
            confidence: number;
          };
          context: string;
          strength: number;
          evidence: string[];
        }>;
        hierarchical: {
          level: number;
          parent: string | null;
          children: string[];
          siblings: string[];
          root: string;
          path: string[];
          depth: number;
        };
        context: {
          documentContext: string;
          sectionContext: string;
          sentenceContext: string;
          topicContext: string[];
          coOccurrences: string[];
          discourseRole: string;
        };
        provenance: {
          extractor: string;
          extractionMethod: string;
          confidence: number;
          validationStatus: string;
          validationSources: string[];
          lastUpdated: string;
          version: number;
        };
      };
      coherenceScore: number;
      topic: string;
    }>;
    metadata: {
      processingTime: number;
      entitiesExtracted: number;
      relationshipsFound: number;
      clustersCreated: number;
      averageConfidence: number;
      processingStages: string[];
    };
    quality: {
      entityCoverage: number;
      relationshipDensity: number;
      clusterCohesion: number;
      topicCoverage: number;
    };
  };
  performance: {
    totalTime: number;
    intentClassificationTime: number;
    patternGenerationTime: number;
    optimizationTime: number;
    executionTime: number;
    rankingTime: number;
  };
  metadata: {
    queryId: string;
    success: boolean;
    warnings: string[];
    suggestions: Array<{
      type:
        | "query_refinement"
        | "entity_expansion"
        | "relationship_exploration";
      suggestion: string;
      confidence: number;
    }>;
  };
}

export interface PathFindingOptions {
  startEntity: string;
  endEntity: string;
  maxDepth?: number;
  algorithm?: "dfs" | "bfs" | "dijkstra" | "astar";
  relationshipTypes?: string[];
  direction?: "outbound" | "inbound" | "bidirectional";
  maxPaths?: number;
  includeWeights?: boolean;
}

export interface PathFindingResult {
  paths: Array<{
    nodes: string[];
    edges: Array<{
      source: string;
      target: string;
      type: string;
      weight: number;
    }>;
    totalWeight: number;
    length: number;
    confidence: number;
  }>;
  metadata: {
    totalPathsFound: number;
    maxPathLength: number;
    averagePathLength: number;
    executionTime: number;
  };
  suggestions: Array<{
    type: "alternative_path" | "relationship_expansion" | "entity_suggestion";
    suggestion: string;
    confidence: number;
  }>;
}

export interface PatternAnalysisResult {
  patterns: Array<{
    pattern: string;
    frequency: number;
    confidence: number;
    examples: string[];
    significance: number;
  }>;
  insights: Array<{
    type: "trend" | "anomaly" | "correlation" | "causality";
    description: string;
    confidence: number;
    entities: string[];
    relationships: string[];
  }>;
  statistics: {
    totalPatterns: number;
    averageFrequency: number;
    averageConfidence: number;
    mostFrequentPattern: string;
    leastFrequentPattern: string;
  };
}

export interface QueryContext {
  workspaceName?: string;
  userId?: string;
  sessionId?: string;
  previousQueries?: string[];
  userPreferences?: Record<string, unknown>;
  domainContext?: Record<string, unknown>;
  temporalContext?: {
    timeRange?: {
      start: string;
      end: string;
    };
    granularity?:
      | "second"
      | "minute"
      | "hour"
      | "day"
      | "week"
      | "month"
      | "year";
    referenceTime?: string;
  };
  spatialContext?: {
    location?: string;
    radius?: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

export class GraphQueryService {
  private static instance: GraphQueryService;
  private baseUrl: string;

  private constructor(baseUrl: string = GRAPH_QUERY_API_BASE) {
    this.baseUrl = baseUrl;
  }

  static getInstance(): GraphQueryService {
    if (!GraphQueryService.instance) {
      GraphQueryService.instance = new GraphQueryService();
    }
    return GraphQueryService.instance;
  }

  // ============================================================================
  // NATURAL LANGUAGE QUERY PROCESSING
  // ============================================================================

  async processNaturalLanguageQuery(
    queryText: string,
    context: QueryContext = {}
  ): Promise<GraphQueryResult> {
    try {
      const response = await fetch(`${this.baseUrl}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          queryText,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`Query processing failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error("Natural language query failed:", error);
      throw new Error(
        `Failed to process natural language query: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // ============================================================================
  // PATH FINDING
  // ============================================================================

  async findPaths(options: PathFindingOptions): Promise<PathFindingResult> {
    try {
      const response = await fetch(`${this.baseUrl}/paths/find`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error(`Path finding failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error("Path finding failed:", error);
      throw new Error(
        `Failed to find paths: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getPaths(
    startEntity: string,
    endEntity: string,
    options: Partial<PathFindingOptions> = {}
  ): Promise<PathFindingResult> {
    return this.findPaths({
      startEntity,
      endEntity,
      maxDepth: 3,
      algorithm: "astar",
      ...options,
    });
  }

  // ============================================================================
  // PATTERN ANALYSIS
  // ============================================================================

  async analyzePatterns(
    entities: string[],
    context?: QueryContext
  ): Promise<PatternAnalysisResult> {
    try {
      const response = await fetch(`${this.baseUrl}/patterns/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entities,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`Pattern analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error("Pattern analysis failed:", error);
      throw new Error(
        `Failed to analyze patterns: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async suggestPatterns(
    partialQuery: string,
    limit: number = 10
  ): Promise<
    Array<{
      pattern: string;
      confidence: number;
      description: string;
    }>
  > {
    try {
      const response = await fetch(`${this.baseUrl}/patterns/suggest`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          partialQuery,
          limit,
        }),
      });

      if (!response.ok) {
        throw new Error(`Pattern suggestions failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.suggestions;
    } catch (error) {
      console.error("Pattern suggestions failed:", error);
      return [];
    }
  }

  // ============================================================================
  // GRAPH TRAVERSAL
  // ============================================================================

  async traverseGraph(
    startEntity: string,
    options: {
      maxDepth?: number;
      maxNodes?: number;
      relationshipTypes?: string[];
      direction?: "outbound" | "inbound" | "bidirectional";
      filterTypes?: string[];
    } = {}
  ): Promise<{
    nodes: Array<{
      id: string;
      text: string;
      type: string;
      confidence: number;
      distance: number;
    }>;
    edges: Array<{
      source: string;
      target: string;
      type: string;
      distance: number;
    }>;
    metadata: {
      totalNodes: number;
      totalEdges: number;
      maxDistance: number;
      executionTime: number;
    };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/traverse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startEntity,
          ...options,
        }),
      });

      if (!response.ok) {
        throw new Error(`Graph traversal failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error("Graph traversal failed:", error);
      throw new Error(
        `Failed to traverse graph: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // ============================================================================
  // NEIGHBOR DISCOVERY
  // ============================================================================

  async getNeighbors(
    entityId: string,
    options: {
      maxNeighbors?: number;
      relationshipTypes?: string[];
      direction?: "outbound" | "inbound" | "bidirectional";
      includeMetadata?: boolean;
    } = {}
  ): Promise<
    Array<{
      id: string;
      text: string;
      type: string;
      confidence: number;
      relationship: {
        type: string;
        direction: "outbound" | "inbound";
        confidence: number;
      };
      distance: number;
      metadata?: Record<string, unknown>;
    }>
  > {
    try {
      const response = await fetch(`${this.baseUrl}/neighbors/${entityId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error(`Neighbor discovery failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.neighbors;
    } catch (error) {
      console.error("Neighbor discovery failed:", error);
      return [];
    }
  }

  // ============================================================================
  // QUERY OPTIMIZATION
  // ============================================================================

  async optimizeQuery(query: Partial<GraphQuery>): Promise<{
    optimizedQuery: GraphQuery;
    optimizations: Array<{
      type:
        | "cost_reduction"
        | "performance_improvement"
        | "accuracy_enhancement";
      description: string;
      impact: number;
      applied: boolean;
    }>;
    estimatedPerformance: {
      executionTime: number;
      memoryUsage: number;
      resultCount: number;
      confidence: number;
    };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/optimize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(query),
      });

      if (!response.ok) {
        throw new Error(`Query optimization failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error("Query optimization failed:", error);
      throw new Error(
        `Failed to optimize query: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // ============================================================================
  // QUERY SUGGESTIONS
  // ============================================================================

  async suggestQueries(
    partialQuery: string,
    context?: QueryContext
  ): Promise<
    Array<{
      query: string;
      confidence: number;
      type: "completion" | "expansion" | "refinement" | "alternative";
      description: string;
      estimatedComplexity: "low" | "medium" | "high";
    }>
  > {
    try {
      const response = await fetch(
        `${this.baseUrl}/suggest/${encodeURIComponent(partialQuery)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ context }),
        }
      );

      if (!response.ok) {
        throw new Error(`Query suggestions failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.suggestions;
    } catch (error) {
      console.error("Query suggestions failed:", error);
      return [];
    }
  }

  // ============================================================================
  // HEALTH & STATUS
  // ============================================================================

  async getHealthStatus(): Promise<{
    status: string;
    message: string;
    timestamp: string;
    components: Record<
      string,
      {
        status: string;
        message: string;
        lastCheck: string;
      }
    >;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Health check failed:", error);
      return {
        status: "error",
        message: "Graph Query Engine unavailable",
        timestamp: new Date().toISOString(),
        components: {},
      };
    }
  }

  async getSystemStatus(): Promise<{
    status: string;
    message: string;
    timestamp: string;
    metrics: {
      totalQueries: number;
      activeQueries: number;
      averageResponseTime: number;
      errorRate: number;
      cacheHitRate: number;
      memoryUsage: number;
      cpuUsage: number;
    };
    recentActivity: Array<{
      timestamp: string;
      operation: string;
      status: string;
      duration: number;
    }>;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/status`);

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Status check failed:", error);
      throw new Error(
        `Failed to get system status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

// Export singleton instance
export const graphQueryService = GraphQueryService.getInstance();
