// Unified Search Service - Consolidates traditional and Graph RAG search functionality
// This service eliminates duplication between different search approaches

import { apiService } from "../lib/api";
import { graphRagApiService } from "../lib/graph-rag-api";
import { EnhancedChatService } from "../lib/enhanced-chat";
import { GraphRagChatService } from "../lib/graph-rag-chat";
import type {
  SearchResult,
  EnhancedMessage,
  SuggestedAction,
  SearchOptions,
  ChatContext,
} from "../types";
import type {
  GraphRagSearchResult,
  GraphRagEntity,
  ReasoningResult,
} from "../lib/graph-rag-api";
import {
  transformApiToSearchResult,
  transformGraphRagToSearchResult,
  generateUniqueId,
} from "../utils";

// ============================================================================
// SEARCH RESPONSE TYPES
// ============================================================================

export interface UnifiedSearchResponse {
  results: SearchResult[];
  graphRagResults?: GraphRagSearchResult[];
  entities?: GraphRagEntity[];
  reasoningResults?: ReasoningResult;
  metrics: {
    totalResults: number;
    executionTime: number;
    searchStrategy: string;
  };
  explanation?: {
    searchStrategy: string;
    confidenceScore: number;
    entitiesFound: number;
    relationshipsTraversed: number;
  };
}

export interface UnifiedChatResponse {
  response: string;
  context: ChatContext[];
  searchResults?: SearchResult[];
  graphRagResults?: GraphRagSearchResult[];
  entities?: GraphRagEntity[];
  reasoningResults?: ReasoningResult;
  suggestedActions: SuggestedAction[];
  explanation?: {
    searchStrategy: string;
    reasoningApplied: boolean;
    confidenceScore: number;
  };
}

// ============================================================================
// SEARCH SERVICE CLASS
// ============================================================================

export class SearchService {
  private static instance: SearchService;

  private constructor() {}

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  // ============================================================================
  // UNIFIED SEARCH METHODS
  // ============================================================================

  async search(
    query: string,
    options: {
      useGraphRag?: boolean;
      maxResults?: number;
      includeReasoning?: boolean;
      searchStrategy?: "vector_only" | "graph_only" | "hybrid" | "adaptive";
    } = {}
  ): Promise<UnifiedSearchResponse> {
    const startTime = Date.now();
    const {
      useGraphRag = false,
      maxResults = 10,
      includeReasoning = false,
      searchStrategy = "hybrid",
    } = options;

    try {
      if (useGraphRag) {
        return await this.performGraphRagSearch(query, {
          maxResults,
          includeReasoning,
          searchStrategy,
        });
      } else {
        return await this.performTraditionalSearch(query, { maxResults });
      }
    } catch (error) {
      console.error("Search failed:", error);
      throw new Error(
        `Search failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async performGraphRagSearch(
    query: string,
    options: {
      maxResults: number;
      includeReasoning: boolean;
      searchStrategy: string;
    }
  ): Promise<UnifiedSearchResponse> {
    const startTime = Date.now();

    const searchResponse = await graphRagApiService.search(query, {
      maxResults: options.maxResults,
      includeExplanation: true,
      strategy: options.searchStrategy as any,
      enableRanking: true,
      enableProvenance: false,
    });

    // Transform Graph RAG results to unified format
    const results = searchResponse.results.map((result) =>
      transformGraphRagToSearchResult(result, { includeMetadata: true })
    );

    // Extract entities
    const entities = searchResponse.results.flatMap((r) => r.entities);

    // Perform reasoning if requested and entities are available
    let reasoningResults: ReasoningResult | undefined;
    if (options.includeReasoning && entities.length >= 2) {
      try {
        const topEntities = entities
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 3)
          .map((e) => e.id);

        reasoningResults = await graphRagApiService.reason(
          topEntities,
          `What are the relationships and connections in the context of: ${query}`,
          {
            maxDepth: 3,
            reasoningType: "exploratory",
            enableExplanation: true,
          }
        );
      } catch (error) {
        console.warn("Reasoning failed:", error);
      }
    }

    return {
      results,
      graphRagResults: searchResponse.results,
      entities,
      reasoningResults,
      metrics: {
        totalResults: searchResponse.results.length,
        executionTime: Date.now() - startTime,
        searchStrategy: options.searchStrategy,
      },
      explanation: {
        searchStrategy: searchResponse.explanation?.searchStrategy || "hybrid",
        confidenceScore:
          searchResponse.explanation?.qualityMetrics.accuracy || 0.8,
        entitiesFound: entities.length,
        relationshipsTraversed: searchResponse.metrics.relationshipsTraversed,
      },
    };
  }

  private async performTraditionalSearch(
    query: string,
    options: { maxResults: number }
  ): Promise<UnifiedSearchResponse> {
    const startTime = Date.now();

    const searchResponse = await apiService.search(query, {
      limit: options.maxResults,
      rerank: true,
      minSimilarity: 0.1,
    });

    // Transform API results to unified format
    const results = searchResponse.results.map((result) =>
      transformApiToSearchResult(result, { includeMetadata: true })
    );

    return {
      results,
      metrics: {
        totalResults: searchResponse.results.length,
        executionTime: Date.now() - startTime,
        searchStrategy: "vector_only",
      },
    };
  }

  // ============================================================================
  // UNIFIED CHAT METHODS
  // ============================================================================

  async chat(
    message: string,
    options: {
      useGraphRag?: boolean;
      context?: ChatContext[];
      model?: string;
      searchOptions?: SearchOptions;
    } = {}
  ): Promise<UnifiedChatResponse> {
    const {
      useGraphRag = false,
      context = [],
      model = "llama3.1",
      searchOptions,
    } = options;

    try {
      if (useGraphRag) {
        return await this.performGraphRagChat(message, {
          context,
          model,
          searchOptions,
        });
      } else {
        return await this.performTraditionalChat(message, {
          context,
          model,
          searchOptions,
        });
      }
    } catch (error) {
      console.error("Chat failed:", error);
      throw new Error(
        `Chat failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async performGraphRagChat(
    message: string,
    options: {
      context: ChatContext[];
      model: string;
      searchOptions?: SearchOptions;
    }
  ): Promise<UnifiedChatResponse> {
    const chatResponse = await GraphRagChatService.chat(message, {
      pastedContent: options.searchOptions?.pastedContent,
      queryType: options.searchOptions?.queryType,
      autoSearch: options.searchOptions?.autoSearch ?? true,
      context: options.context,
      model: options.model,
      enableReasoning: options.searchOptions?.enableReasoning ?? true,
      includeProvenance: false,
    });

    // Transform search results if present
    let results: SearchResult[] = [];
    if (chatResponse.searchResults) {
      results = chatResponse.searchResults.map((result) =>
        transformGraphRagToSearchResult(result, { includeMetadata: true })
      );
    }

    return {
      response: chatResponse.response,
      context: chatResponse.context,
      searchResults: results,
      graphRagResults: chatResponse.searchResults,
      entities: chatResponse.entities,
      reasoningResults: chatResponse.reasoningResults,
      suggestedActions: chatResponse.suggestedActions || [],
      explanation: {
        searchStrategy: chatResponse.explanation?.searchStrategy || "hybrid",
        reasoningApplied: !!chatResponse.reasoningResults,
        confidenceScore: chatResponse.explanation?.confidenceScore || 0.8,
      },
    };
  }

  private async performTraditionalChat(
    message: string,
    options: {
      context: ChatContext[];
      model: string;
      searchOptions?: SearchOptions;
    }
  ): Promise<UnifiedChatResponse> {
    const chatResponse = await EnhancedChatService.chat(message, {
      pastedContent: options.searchOptions?.pastedContent,
      queryType: options.searchOptions?.queryType,
      autoSearch: options.searchOptions?.autoSearch ?? true,
      context: options.context,
      model: options.model,
    });

    // Transform search results if present
    let results: SearchResult[] = [];
    if (chatResponse.searchResults) {
      results = chatResponse.searchResults.map((result) =>
        transformApiToSearchResult(result, { includeMetadata: true })
      );
    }

    return {
      response: chatResponse.response,
      context: chatResponse.context,
      searchResults: results,
      suggestedActions: chatResponse.suggestedActions || [],
      explanation: {
        searchStrategy: "vector_only",
        reasoningApplied: false,
        confidenceScore: 0.8,
      },
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async exploreEntity(entity: GraphRagEntity): Promise<UnifiedSearchResponse> {
    return this.search(`Tell me more about ${entity.name}`, {
      useGraphRag: true,
      includeReasoning: true,
    });
  }

  async findRelationships(
    entities: GraphRagEntity[]
  ): Promise<ReasoningResult | null> {
    if (entities.length < 2) return null;

    try {
      return await graphRagApiService.reason(
        entities.map((e) => e.id),
        `What are the relationships between ${entities
          .map((e) => e.name)
          .join(", ")}?`,
        {
          maxDepth: 3,
          reasoningType: "exploratory",
          enableExplanation: true,
        }
      );
    } catch (error) {
      console.error("Relationship finding failed:", error);
      return null;
    }
  }

  async findSimilarEntities(
    entityId: string,
    threshold: number = 0.7
  ): Promise<GraphRagEntity[]> {
    try {
      return await graphRagApiService.findSimilar(entityId, {
        threshold,
        limit: 10,
      });
    } catch (error) {
      console.error("Similar entity search failed:", error);
      return [];
    }
  }

  createErrorMessage(error: string): EnhancedMessage {
    return {
      id: generateUniqueId(),
      type: "assistant",
      content: `Sorry, I encountered an error: ${error}. Please try again.`,
      timestamp: new Date(),
    };
  }

  createSystemMessage(content: string): EnhancedMessage {
    return {
      id: generateUniqueId(),
      type: "system",
      content,
      timestamp: new Date(),
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const searchService = SearchService.getInstance();
