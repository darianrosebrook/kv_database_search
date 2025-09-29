/**
 * Graph RAG Client
 *
 * HTTP client for communicating with the Graph RAG microservice.
 * Provides a clean interface for proxying Graph RAG requests.
 */

import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { Logger } from "./logger.js";
import type { GraphRagConfig } from "./config.js";

export interface GraphRagSearchRequest {
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

export interface GraphRagSearchResponse {
  results: Array<{
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
    entities: Array<{
      id: string;
      name: string;
      type: string;
      confidence: number;
      mentionCount: number;
      aliases: string[];
    }>;
    relationships: Array<{
      id: string;
      sourceEntityId: string;
      targetEntityId: string;
      type: string;
      confidence: number;
      strength: number;
      isDirectional: boolean;
    }>;
    explanation?: {
      rankingReason: string;
      confidence: number;
    };
  }>;
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
    queryEntities: string[];
    searchStrategy: string;
    reasoningSteps: string[];
    qualityMetrics: {
      completeness: number;
      accuracy: number;
      consistency: number;
      freshness: number;
      relevance: number;
    };
  };
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Client for Graph RAG microservice
 */
export class GraphRagClient {
  private client: AxiosInstance;
  private logger: Logger;
  private config: GraphRagConfig;

  constructor(config: GraphRagConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;

    this.client = axios.create({
      baseURL: `http://${config.host}:${config.port}`,
      timeout: config.requestTimeout,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug(
          `Graph RAG Request: ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => {
        this.logger.error("Graph RAG Request Error", error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(
          `Graph RAG Response: ${response.status} ${response.config.url}`
        );
        return response;
      },
      (error) => {
        this.logger.error("Graph RAG Response Error", error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Search using Graph RAG
   */
  async search(
    request: GraphRagSearchRequest
  ): Promise<GraphRagSearchResponse> {
    try {
      const response = await this.client.post("/api/graph-rag/search", request);
      return response.data;
    } catch (error) {
      this.logger.error("Graph RAG search failed", error);
      throw new Error(
        `Graph RAG search failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Multi-hop reasoning
   */
  async reason(request: any): Promise<any> {
    try {
      const response = await this.client.post(
        "/api/graph-rag/reasoning",
        request
      );
      return response.data;
    } catch (error) {
      this.logger.error("Graph RAG reasoning failed", error);
      throw new Error(
        `Graph RAG reasoning failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get entities
   */
  async getEntities(query?: any): Promise<any> {
    try {
      const response = await this.client.get("/api/graph-rag/entities", {
        params: query,
      });
      return response.data;
    } catch (error) {
      this.logger.error("Graph RAG get entities failed", error);
      throw new Error(
        `Graph RAG get entities failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get relationships
   */
  async getRelationships(query?: any): Promise<any> {
    try {
      const response = await this.client.get("/api/graph-rag/relationships", {
        params: query,
      });
      return response.data;
    } catch (error) {
      this.logger.error("Graph RAG get relationships failed", error);
      throw new Error(
        `Graph RAG get relationships failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<any> {
    try {
      const response = await this.client.get("/api/graph-rag/statistics");
      return response.data;
    } catch (error) {
      this.logger.error("Graph RAG get statistics failed", error);
      throw new Error(
        `Graph RAG get statistics failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Get provenance trail
   */
  async getProvenanceTrail(entityId: string, sessionId: string): Promise<any> {
    try {
      const response = await this.client.get("/api/graph-rag/provenance", {
        params: { entityId, sessionId },
      });
      return response.data;
    } catch (error) {
      this.logger.error("Graph RAG get provenance failed", error);
      throw new Error(
        `Graph RAG get provenance failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Find similar entities
   */
  async findSimilarEntities(
    nodeId: string,
    threshold?: number,
    limit?: number
  ): Promise<any> {
    try {
      const response = await this.client.get(
        "/api/graph-rag/entities/similar",
        {
          params: { nodeId, threshold, limit },
        }
      );
      return response.data;
    } catch (error) {
      this.logger.error("Graph RAG find similar entities failed", error);
      throw new Error(
        `Graph RAG find similar entities failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Find shortest path between entities
   */
  async findShortestPath(
    startNodeId: string,
    endNodeId: string,
    maxDepth?: number
  ): Promise<any> {
    try {
      const response = await this.client.get(
        "/api/graph-rag/entities/shortest-path",
        {
          params: { startNodeId, endNodeId, maxDepth },
        }
      );
      return response.data;
    } catch (error) {
      this.logger.error("Graph RAG find shortest path failed", error);
      throw new Error(
        `Graph RAG find shortest path failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Health check
   */
  async health(): Promise<any> {
    try {
      const response = await this.client.get("/health");
      return response.data;
    } catch (error) {
      this.logger.error("Graph RAG health check failed", error);
      throw new Error(
        `Graph RAG health check failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Check if Graph RAG service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.health();
      return true;
    } catch {
      return false;
    }
  }
}
