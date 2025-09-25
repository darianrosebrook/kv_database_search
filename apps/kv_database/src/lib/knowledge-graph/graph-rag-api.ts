import express, { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import { ObsidianEmbeddingService } from "../embeddings.js";
import { ContentType } from "../types/index.js";
import {
  HybridSearchEngine,
  type SearchQuery,
  type SearchResult,
  type SearchMetrics,
  type SearchExplanation,
} from "./hybrid-search-engine.js";
import {
  MultiHopReasoningEngine,
  type ReasoningQuery,
  type ReasoningResult,
} from "./multi-hop-reasoning.js";
import {
  ResultRankingEngine,
  type RankedSearchResult,
} from "./result-ranking.js";
import { KnowledgeGraphManager } from "./knowledge-graph-manager.js";

// API Request/Response Types following OpenAPI contract
export interface SearchRequest {
  query: string;
  filters?: {
    contentTypes?: string[];
    entityTypes?: string[];
    relationshipTypes?: string[];
    sourceFiles?: string[];
    minConfidence?: number;
    dateRange?: {
      start: string;
      end: string;
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

export interface SearchResponse {
  results: SearchResultResponse[];
  metrics: SearchMetricsResponse;
  explanation?: SearchExplanationResponse;
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface SearchResultResponse {
  id: string;
  text: string;
  score: number;
  similarity: number;
  relevanceScore: number;
  metadata: {
    contentType: string;
    sourceFile: string;
    chunkId: string;
    extractionMethod: string;
    processingTime: string;
    wordCount: number;
    characterCount: number;
  };
  entities: EntityResponse[];
  relationships: RelationshipResponse[];
  explanation?: RankingExplanationResponse;
}

export interface EntityResponse {
  id: string;
  name: string;
  type: string;
  confidence: number;
  mentionCount: number;
  aliases: string[];
}

export interface RelationshipResponse {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: string;
  confidence: number;
  strength: number;
  isDirectional: boolean;
}

export interface SearchMetricsResponse {
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
}

export interface SearchExplanationResponse {
  queryEntities: EntityResponse[];
  reasoningSteps: ReasoningStepResponse[];
  searchStrategy: string;
  totalExecutionTime: number;
  vectorSearchTime: number;
  graphTraversalTime: number;
  resultFusionTime: number;
}

export interface ReasoningStepResponse {
  step: number;
  description: string;
  confidence: number;
  evidence: string[];
  entitiesInvolved: string[];
}

export interface RankingExplanationResponse {
  finalScore: number;
  featureScores: Record<string, number>;
  appliedBoosts: Array<{ name: string; value: number; reason: string }>;
  appliedPenalties: Array<{ name: string; value: number; reason: string }>;
  rankingFactors: Array<{
    factor: string;
    contribution: number;
    explanation: string;
  }>;
}

export interface ReasoningRequest {
  startEntities: string[];
  targetEntities?: string[];
  question: string;
  maxDepth?: number;
  minConfidence?: number;
  reasoningType: "exploratory" | "targeted" | "comparative" | "causal";
}

export interface ReasoningResponse {
  query: ReasoningRequest;
  paths: ReasoningPathResponse[];
  bestPath?: ReasoningPathResponse;
  confidence: number;
  explanation: string;
  alternativeHypotheses: AlternativeHypothesisResponse[];
  contradictions: ContradictionResponse[];
  metrics: ReasoningMetricsResponse;
}

export interface ReasoningPathResponse {
  id: string;
  entities: ReasoningEntityResponse[];
  relationships: ReasoningRelationshipResponse[];
  confidence: number;
  strength: number;
  depth: number;
  explanation: string;
  evidence: EvidenceResponse[];
  logicalSteps: LogicalStepResponse[];
}

export interface ReasoningEntityResponse {
  id: string;
  name: string;
  type: string;
  confidence: number;
  role: string;
  contextualRelevance: number;
}

export interface ReasoningRelationshipResponse {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: string;
  confidence: number;
  strength: number;
  isDirectional: boolean;
  contextualImportance: number;
  logicalRole: string;
}

export interface EvidenceResponse {
  id: string;
  type: string;
  content: string;
  confidence: number;
  sourceChunkIds: string[];
  supportingEntities: string[];
}

export interface LogicalStepResponse {
  step: number;
  type: string;
  description: string;
  confidence: number;
  premises: string[];
  conclusion: string;
  logicalRule: string;
}

export interface AlternativeHypothesisResponse {
  hypothesis: string;
  confidence: number;
  supportingPaths: ReasoningPathResponse[];
  evidence: EvidenceResponse[];
}

export interface ContradictionResponse {
  description: string;
  conflictingPaths: ReasoningPathResponse[];
  severity: string;
  resolution?: string;
}

export interface ReasoningMetricsResponse {
  totalPaths: number;
  averageDepth: number;
  averageConfidence: number;
  exploredNodes: number;
  exploredRelationships: number;
  processingTime: number;
}

export interface EntityListResponse {
  entities: EntityDetailResponse[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface EntityDetailResponse {
  id: string;
  name: string;
  canonicalName: string;
  type: string;
  aliases: string[];
  confidence: number;
  occurrenceCount: number;
  documentFrequency: number;
  sourceFiles: string[];
  extractionMethods: string[];
  firstSeen: string;
  lastUpdated: string;
  relationships: RelationshipSummaryResponse[];
}

export interface RelationshipSummaryResponse {
  id: string;
  relatedEntityId: string;
  relatedEntityName: string;
  type: string;
  confidence: number;
  strength: number;
  isDirectional: boolean;
}

export interface RelationshipListResponse {
  relationships: RelationshipDetailResponse[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface RelationshipDetailResponse {
  id: string;
  sourceEntity: EntitySummaryResponse;
  targetEntity: EntitySummaryResponse;
  type: string;
  confidence: number;
  strength: number;
  isDirectional: boolean;
  cooccurrenceCount: number;
  supportingText: string[];
  sourceChunkIds: string[];
  createdAt: string;
  lastObserved: string;
}

export interface EntitySummaryResponse {
  id: string;
  name: string;
  type: string;
  confidence: number;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
  requestId: string;
}

/**
 * Graph RAG API Router implementing the OpenAPI specification
 */
export class GraphRAGAPIRouter {
  private router: express.Router;
  private searchEngine: HybridSearchEngine;
  private reasoningEngine: MultiHopReasoningEngine;
  private rankingEngine: ResultRankingEngine;
  private graphManager: KnowledgeGraphManager;

  constructor(
    pool: Pool,
    embeddings: ObsidianEmbeddingService,
    options: {
      enableRateLimit?: boolean;
      enableCaching?: boolean;
      enableMetrics?: boolean;
    } = {}
  ) {
    this.router = express.Router();

    // Initialize engines
    this.searchEngine = new HybridSearchEngine(pool, embeddings);
    this.reasoningEngine = new MultiHopReasoningEngine(pool);
    this.rankingEngine = new ResultRankingEngine(pool);
    this.graphManager = new KnowledgeGraphManager(pool, embeddings);

    // Setup middleware
    this.setupMiddleware();

    // Setup routes
    this.setupRoutes();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // Request logging
    this.router.use((req: Request, res: Response, next: NextFunction) => {
      const requestId = Math.random().toString(36).substring(7);
      req.headers["x-request-id"] = requestId;
      console.log(`📨 ${req.method} ${req.path} [${requestId}]`);
      next();
    });

    // JSON parsing
    this.router.use(express.json({ limit: "10mb" }));

    // CORS headers
    this.router.use((req: Request, res: Response, next: NextFunction) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );

      if (req.method === "OPTIONS") {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Error handling
    this.router.use(
      (error: Error, req: Request, res: Response, next: NextFunction) => {
        const requestId = req.headers["x-request-id"] as string;
        console.error(
          `❌ Error in ${req.method} ${req.path} [${requestId}]:`,
          error
        );

        const errorResponse: ErrorResponse = {
          error: {
            code: "INTERNAL_ERROR",
            message: error.message,
            details:
              process.env.NODE_ENV === "development"
                ? { stack: error.stack }
                : undefined,
          },
          timestamp: new Date().toISOString(),
          requestId,
        };

        res.status(500).json(errorResponse);
      }
    );
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Search endpoints
    this.router.post("/search", this.handleSearch.bind(this));
    this.router.post("/reasoning", this.handleReasoning.bind(this));

    // Entity endpoints
    this.router.get("/entities", this.handleGetEntities.bind(this));
    this.router.get("/entities/:id", this.handleGetEntity.bind(this));
    this.router.get(
      "/entities/:id/relationships",
      this.handleGetEntityRelationships.bind(this)
    );

    // Relationship endpoints
    this.router.get("/relationships", this.handleGetRelationships.bind(this));
    this.router.get(
      "/relationships/:id",
      this.handleGetRelationship.bind(this)
    );

    // Graph statistics
    this.router.get("/statistics", this.handleGetStatistics.bind(this));

    // Health check
    this.router.get("/health", this.handleHealthCheck.bind(this));
  }

  /**
   * Handle search requests
   */
  private async handleSearch(req: Request, res: Response): Promise<void> {
    try {
      const searchRequest: SearchRequest = req.body;

      // Validate request
      if (!searchRequest.query || searchRequest.query.trim().length === 0) {
        res.status(400).json({
          error: {
            code: "INVALID_REQUEST",
            message: "Query is required and cannot be empty",
          },
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        });
        return;
      }

      // Convert request to internal format
      const searchQuery: SearchQuery = {
        text: searchRequest.query,
        filters: searchRequest.filters
          ? {
              contentTypes: searchRequest.filters.contentTypes?.map(
                (ct) => ct as ContentType
              ),
              entityTypes: searchRequest.filters.entityTypes?.map(
                (et) => et as any
              ),
              relationshipTypes: searchRequest.filters.relationshipTypes?.map(
                (rt) => rt as any
              ),
              sourceFiles: searchRequest.filters.sourceFiles,
              minConfidence: searchRequest.filters.minConfidence,
              dateRange: searchRequest.filters.dateRange
                ? {
                    start: new Date(searchRequest.filters.dateRange.start),
                    end: new Date(searchRequest.filters.dateRange.end),
                  }
                : undefined,
            }
          : undefined,
        options: searchRequest.options,
      };

      // Perform search
      const searchResult = await this.searchEngine.search(searchQuery);

      // Rank results
      const rankedResults = await this.rankingEngine.rankResults(
        searchResult.results,
        searchQuery.text,
        searchResult.explanation?.queryEntities || [],
        {
          includeExplanation: searchQuery.options?.includeExplanation,
          diversify: true,
        }
      );

      // Convert to response format
      const response: SearchResponse = {
        results: rankedResults.map(this.convertSearchResult),
        metrics: this.convertSearchMetrics(searchResult.metrics),
        explanation: searchResult.explanation
          ? this.convertSearchExplanation(searchResult.explanation)
          : undefined,
      };

      res.json(response);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({
        error: {
          code: "SEARCH_ERROR",
          message: error instanceof Error ? error.message : "Search failed",
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"],
      });
    }
  }

  /**
   * Handle reasoning requests
   */
  private async handleReasoning(req: Request, res: Response): Promise<void> {
    try {
      const reasoningRequest: ReasoningRequest = req.body;

      // Validate request
      if (
        !reasoningRequest.startEntities ||
        reasoningRequest.startEntities.length === 0
      ) {
        res.status(400).json({
          error: {
            code: "INVALID_REQUEST",
            message: "Start entities are required",
          },
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"],
        });
        return;
      }

      // Convert to internal format
      const reasoningQuery: ReasoningQuery = {
        startEntities: reasoningRequest.startEntities,
        targetEntities: reasoningRequest.targetEntities,
        question: reasoningRequest.question,
        maxDepth: reasoningRequest.maxDepth || 3,
        minConfidence: reasoningRequest.minConfidence || 0.5,
        reasoningType: reasoningRequest.reasoningType,
      };

      // Perform reasoning
      const reasoningResult = await this.reasoningEngine.reason(reasoningQuery);

      // Convert to response format
      const response: ReasoningResponse =
        this.convertReasoningResult(reasoningResult);

      res.json(response);
    } catch (error) {
      console.error("Reasoning error:", error);
      res.status(500).json({
        error: {
          code: "REASONING_ERROR",
          message: error instanceof Error ? error.message : "Reasoning failed",
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"],
      });
    }
  }

  /**
   * Handle get entities request
   */
  private async handleGetEntities(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(
        parseInt(req.query.pageSize as string) || 20,
        100
      );
      const entityType = req.query.type as string;
      const search = req.query.search as string;

      // This would typically query the database for entities
      // For now, return a placeholder response
      const response: EntityListResponse = {
        entities: [],
        pagination: {
          total: 0,
          page,
          pageSize,
          hasNext: false,
          hasPrevious: page > 1,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("Get entities error:", error);
      res.status(500).json({
        error: {
          code: "ENTITIES_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to get entities",
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"],
      });
    }
  }

  /**
   * Handle get entity by ID request
   */
  private async handleGetEntity(req: Request, res: Response): Promise<void> {
    try {
      const entityId = req.params.id;

      // This would query the database for the specific entity
      // For now, return a 404
      res.status(404).json({
        error: {
          code: "ENTITY_NOT_FOUND",
          message: `Entity with ID ${entityId} not found`,
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"],
      });
    } catch (error) {
      console.error("Get entity error:", error);
      res.status(500).json({
        error: {
          code: "ENTITY_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to get entity",
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"],
      });
    }
  }

  /**
   * Handle get entity relationships request
   */
  private async handleGetEntityRelationships(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const entityId = req.params.id;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(
        parseInt(req.query.pageSize as string) || 20,
        100
      );

      // This would query the database for entity relationships
      const response: RelationshipListResponse = {
        relationships: [],
        pagination: {
          total: 0,
          page,
          pageSize,
          hasNext: false,
          hasPrevious: page > 1,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("Get entity relationships error:", error);
      res.status(500).json({
        error: {
          code: "RELATIONSHIPS_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get entity relationships",
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"],
      });
    }
  }

  /**
   * Handle get relationships request
   */
  private async handleGetRelationships(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(
        parseInt(req.query.pageSize as string) || 20,
        100
      );
      const relationshipType = req.query.type as string;

      const response: RelationshipListResponse = {
        relationships: [],
        pagination: {
          total: 0,
          page,
          pageSize,
          hasNext: false,
          hasPrevious: page > 1,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("Get relationships error:", error);
      res.status(500).json({
        error: {
          code: "RELATIONSHIPS_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get relationships",
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"],
      });
    }
  }

  /**
   * Handle get relationship by ID request
   */
  private async handleGetRelationship(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const relationshipId = req.params.id;

      res.status(404).json({
        error: {
          code: "RELATIONSHIP_NOT_FOUND",
          message: `Relationship with ID ${relationshipId} not found`,
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"],
      });
    } catch (error) {
      console.error("Get relationship error:", error);
      res.status(500).json({
        error: {
          code: "RELATIONSHIP_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get relationship",
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"],
      });
    }
  }

  /**
   * Handle get statistics request
   */
  private async handleGetStatistics(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const statistics = await this.graphManager.getGraphStatistics();
      res.json(statistics);
    } catch (error) {
      console.error("Get statistics error:", error);
      res.status(500).json({
        error: {
          code: "STATISTICS_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to get statistics",
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"],
      });
    }
  }

  /**
   * Handle health check request
   */
  private async handleHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Perform basic health checks
      const health = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        services: {
          database: "healthy", // Would check database connection
          search: "healthy",
          reasoning: "healthy",
          ranking: "healthy",
        },
      };

      res.json(health);
    } catch (error) {
      console.error("Health check error:", error);
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Health check failed",
      });
    }
  }

  /**
   * Convert internal search result to API response format
   */
  private convertSearchResult(
    result: RankedSearchResult
  ): SearchResultResponse {
    return {
      id: result.id,
      text: result.text,
      score: result.rankingScore,
      similarity: result.similarity,
      relevanceScore: result.relevanceScore,
      metadata: {
        contentType: result.metadata.contentType,
        sourceFile: result.metadata.sourceFile,
        chunkId: result.metadata.chunkId,
        extractionMethod: result.metadata.extractionMethod,
        processingTime: result.metadata.processingTime.toISOString(),
        wordCount: result.metadata.wordCount,
        characterCount: result.metadata.characterCount,
      },
      entities: result.entities.map((entity) => ({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        confidence: entity.confidence,
        mentionCount: entity.mentionCount,
        aliases: entity.aliases,
      })),
      relationships: result.relationships.map((rel) => ({
        id: rel.id,
        sourceEntityId: rel.sourceEntityId,
        targetEntityId: rel.targetEntityId,
        type: rel.type,
        confidence: rel.confidence,
        strength: rel.strength,
        isDirectional: rel.isDirectional,
      })),
      explanation: result.rankingExplanation
        ? {
            finalScore: result.rankingExplanation.finalScore,
            featureScores: result.rankingExplanation.featureScores,
            appliedBoosts: result.rankingExplanation.appliedBoosts,
            appliedPenalties: result.rankingExplanation.appliedPenalties,
            rankingFactors: result.rankingExplanation.rankingFactors,
          }
        : undefined,
    };
  }

  /**
   * Convert internal search metrics to API response format
   */
  private convertSearchMetrics(metrics: SearchMetrics): SearchMetricsResponse {
    return {
      totalResults: metrics.totalResults,
      vectorResults: metrics.vectorResults,
      graphResults: metrics.graphResults,
      fusedResults: metrics.fusedResults,
      executionTime: metrics.executionTime,
      vectorSearchTime: metrics.vectorSearchTime,
      graphTraversalTime: metrics.graphTraversalTime,
      resultFusionTime: metrics.resultFusionTime,
      entitiesFound: metrics.entitiesFound,
      relationshipsTraversed: metrics.relationshipsTraversed,
      maxHopsReached: metrics.maxHopsReached,
    };
  }

  /**
   * Convert internal search explanation to API response format
   */
  private convertSearchExplanation(
    explanation: SearchExplanation
  ): SearchExplanationResponse {
    return {
      queryEntities: explanation.queryEntities.map((entity) => ({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        confidence: entity.confidence,
        mentionCount: entity.mentionCount,
        aliases: entity.aliases,
      })),
      reasoningSteps: explanation.reasoningSteps.map((step) => ({
        step: step.step,
        description: step.description,
        confidence: step.confidence,
        evidence: step.evidence,
        entitiesInvolved: step.entitiesInvolved,
      })),
      searchStrategy: explanation.searchStrategy,
      totalExecutionTime: explanation.totalExecutionTime,
      vectorSearchTime: explanation.vectorSearchTime,
      graphTraversalTime: explanation.graphTraversalTime,
      resultFusionTime: explanation.resultFusionTime,
    };
  }

  /**
   * Convert internal reasoning result to API response format
   */
  private convertReasoningResult(result: ReasoningResult): ReasoningResponse {
    return {
      query: {
        startEntities: result.query.startEntities,
        targetEntities: result.query.targetEntities,
        question: result.query.question,
        maxDepth: result.query.maxDepth,
        minConfidence: result.query.minConfidence,
        reasoningType: result.query.reasoningType,
      },
      paths: result.paths.map((path) => ({
        id: path.id,
        entities: path.entities.map((entity) => ({
          id: entity.id,
          name: entity.name,
          type: entity.type,
          confidence: entity.confidence,
          role: entity.role,
          contextualRelevance: entity.contextualRelevance,
        })),
        relationships: path.relationships.map((rel) => ({
          id: rel.id,
          sourceEntityId: rel.sourceEntityId,
          targetEntityId: rel.targetEntityId,
          type: rel.type,
          confidence: rel.confidence,
          strength: rel.strength,
          isDirectional: rel.isDirectional,
          contextualImportance: rel.contextualImportance,
          logicalRole: rel.logicalRole,
        })),
        confidence: path.confidence,
        strength: path.strength,
        depth: path.depth,
        explanation: path.explanation,
        evidence: path.evidence.map((evidence) => ({
          id: evidence.id,
          type: evidence.type,
          content: evidence.content,
          confidence: evidence.confidence,
          sourceChunkIds: evidence.sourceChunkIds,
          supportingEntities: evidence.supportingEntities,
        })),
        logicalSteps: path.logicalSteps.map((step) => ({
          step: step.step,
          type: step.type,
          description: step.description,
          confidence: step.confidence,
          premises: step.premises,
          conclusion: step.conclusion,
          logicalRule: step.logicalRule,
        })),
      })),
      bestPath: result.bestPath
        ? {
            id: result.bestPath.id,
            entities: result.bestPath.entities.map((entity) => ({
              id: entity.id,
              name: entity.name,
              type: entity.type,
              confidence: entity.confidence,
              role: entity.role,
              contextualRelevance: entity.contextualRelevance,
            })),
            relationships: result.bestPath.relationships.map((rel) => ({
              id: rel.id,
              sourceEntityId: rel.sourceEntityId,
              targetEntityId: rel.targetEntityId,
              type: rel.type,
              confidence: rel.confidence,
              strength: rel.strength,
              isDirectional: rel.isDirectional,
              contextualImportance: rel.contextualImportance,
              logicalRole: rel.logicalRole,
            })),
            confidence: result.bestPath.confidence,
            strength: result.bestPath.strength,
            depth: result.bestPath.depth,
            explanation: result.bestPath.explanation,
            evidence: result.bestPath.evidence.map((evidence) => ({
              id: evidence.id,
              type: evidence.type,
              content: evidence.content,
              confidence: evidence.confidence,
              sourceChunkIds: evidence.sourceChunkIds,
              supportingEntities: evidence.supportingEntities,
            })),
            logicalSteps: result.bestPath.logicalSteps.map((step) => ({
              step: step.step,
              type: step.type,
              description: step.description,
              confidence: step.confidence,
              premises: step.premises,
              conclusion: step.conclusion,
              logicalRule: step.logicalRule,
            })),
          }
        : undefined,
      confidence: result.confidence,
      explanation: result.explanation,
      alternativeHypotheses: result.alternativeHypotheses.map((hyp) => ({
        hypothesis: hyp.hypothesis,
        confidence: hyp.confidence,
        supportingPaths: [], // Would convert paths
        evidence: [], // Would convert evidence
      })),
      contradictions: result.contradictions.map((contradiction) => ({
        description: contradiction.description,
        conflictingPaths: [], // Would convert paths
        severity: contradiction.severity,
        resolution: contradiction.resolution,
      })),
      metrics: {
        totalPaths: result.metrics.totalPaths,
        averageDepth: result.metrics.averageDepth,
        averageConfidence: result.metrics.averageConfidence,
        exploredNodes: result.metrics.exploredNodes,
        exploredRelationships: result.metrics.exploredRelationships,
        processingTime: result.metrics.processingTime,
      },
    };
  }

  /**
   * Get the Express router
   */
  getRouter(): express.Router {
    return this.router;
  }
}
