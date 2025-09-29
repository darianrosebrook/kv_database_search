// Unified Search Service - Consolidates traditional, Graph RAG, and enhanced search functionality
// This service eliminates duplication between different search approaches

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
} from "../types";
import {
  transformApiToSearchResult,
  transformGraphRagToSearchResult,
  generateUniqueId,
} from "../utils";
import { dictionaryClient } from "./dictionary-client";

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

export interface EnhancedSearchOptions {
  useDictionary?: boolean;
  expandSynonyms?: boolean;
  canonicalizeEntities?: boolean;
  maxExpansionsPerTerm?: number;
  expansionTypes?: string[];
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

  /**
   * Perform enhanced search with dictionary integration
   */
  async enhancedSearch(
    query: string,
    options: EnhancedSearchOptions & {
      useGraphRag?: boolean;
      maxResults?: number;
      includeReasoning?: boolean;
      searchStrategy?: "vector_only" | "graph_only" | "hybrid" | "adaptive";
    } = {}
  ): Promise<UnifiedSearchResponse> {
    const {
      useDictionary = true,
      expandSynonyms = true,
      canonicalizeEntities = false,
      maxExpansionsPerTerm = 3,
      expansionTypes = ["synonyms", "hypernyms"],
      ...searchOptions
    } = options;

    console.log(
      `🔍 Enhanced search for: "${query}" with dictionary integration`
    );

    // Check if dictionary service is available
    const dictionaryAvailable =
      useDictionary && (await dictionaryClient.isAvailable());

    if (!dictionaryAvailable) {
      console.log(
        "📚 Dictionary service not available, falling back to standard search"
      );
      return this.search(query, searchOptions);
    }

    // Expand query terms if requested
    let expandedQuery = query;
    if (expandSynonyms) {
      const expandedTerms = await this.expandQueryTerms(query, {
        expansionTypes,
        maxExpansionsPerTerm,
      });

      if (expandedTerms.length > 0) {
        expandedQuery = `${query} ${expandedTerms.join(" ")}`;
        console.log(`🔄 Expanded query: "${query}" → "${expandedQuery}"`);
      }
    }

    // Perform the actual search
    const searchResponse = await this.search(expandedQuery, searchOptions);

    // Enhance results with dictionary data if requested
    if (canonicalizeEntities) {
      searchResponse.results = await this.enhanceResultsWithDictionary(
        searchResponse.results
      );
    }

    return searchResponse;
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

    try {
      // Import graphRagApiService dynamically to avoid circular imports
      const { graphRagApiService } = await import("../graph-rag-api");

      // Perform Graph RAG search
      const graphRagResponse = await graphRagApiService.search(query, {
        maxResults: options.maxResults,
        includeExplanation: true,
        strategy: options.searchStrategy as
          | "vector_only"
          | "graph_only"
          | "hybrid"
          | "adaptive",
        enableRanking: true,
        enableProvenance: true,
      });

      // Transform Graph RAG results to unified format
      const results = graphRagResponse.results.map((result) =>
        transformGraphRagToSearchResult(result, { includeMetadata: true })
      );

      // Extract entities and relationships
      const entities = graphRagResponse.results.flatMap((r) => r.entities);
      const relationships = graphRagResponse.results.flatMap(
        (r) => r.relationships
      );

      // Perform reasoning if requested and we have entities
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
        graphRagResults: graphRagResponse.results,
        entities,
        reasoningResults,
        metrics: {
          totalResults: graphRagResponse.results.length,
          executionTime: Date.now() - startTime,
          searchStrategy: options.searchStrategy,
        },
        explanation: graphRagResponse.explanation
          ? {
              searchStrategy: graphRagResponse.explanation.searchStrategy,
              confidenceScore:
                graphRagResponse.explanation.reasoningSteps?.[0]?.confidence ||
                0.8,
              entitiesFound:
                graphRagResponse.explanation.queryEntities?.length ||
                entities.length,
              relationshipsTraversed: relationships.length,
            }
          : {
              searchStrategy: options.searchStrategy,
              confidenceScore: 0.8,
              entitiesFound: entities.length,
              relationshipsTraversed: relationships.length,
            },
      };
    } catch (error) {
      console.warn(
        "Graph RAG search failed, falling back to traditional search:",
        error
      );

      // Fallback to traditional search
      return this.performTraditionalSearch(query, {
        maxResults: options.maxResults,
      });
    }
  }

  private async performTraditionalSearch(
    query: string,
    options: { maxResults: number }
  ): Promise<UnifiedSearchResponse> {
    const startTime = Date.now();

    // Call the existing API service
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
    const response = await fetch(`${apiUrl}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit: options.maxResults,
        rerank: true,
        minSimilarity: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Search request failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform API results to unified format
    const results =
      data.results?.map((result: any) =>
        transformApiToSearchResult(result, { includeMetadata: true })
      ) || [];

    return {
      results,
      metrics: {
        totalResults: results.length,
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

  /**
   * Enhanced chat with dictionary context
   */
  async enhancedChat(
    message: string,
    options: {
      useDictionary?: boolean;
      context?: ChatContext[];
      model?: string;
      enhanceWithDictionary?: boolean;
      useGraphRag?: boolean;
      searchOptions?: SearchOptions;
    } = {}
  ): Promise<UnifiedChatResponse> {
    const {
      useDictionary = true,
      enhanceWithDictionary = true,
      ...chatOptions
    } = options;

    // Check if dictionary service is available
    const dictionaryAvailable =
      useDictionary && (await dictionaryClient.isAvailable());

    let enhancedContext = chatOptions.context || [];

    // Enhance context with dictionary information if available
    if (dictionaryAvailable && enhanceWithDictionary) {
      const dictionaryContext = await this.buildDictionaryContext(message);
      if (dictionaryContext) {
        enhancedContext = [
          ...enhancedContext,
          {
            role: "system",
            content: `Dictionary Context: ${dictionaryContext}`,
          },
        ];
      }
    }

    // Perform the chat
    return this.chat(message, {
      ...chatOptions,
      context: enhancedContext,
    });
  }

  private async performGraphRagChat(
    message: string,
    options: {
      context: ChatContext[];
      model: string;
      searchOptions?: SearchOptions;
    }
  ): Promise<UnifiedChatResponse> {
    // Use the traditional API service for chat functionality with Graph RAG context
    const chatResponse = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        model: options.model,
        context: options.context.map((ctx) => ({
          role: ctx.role,
          content: ctx.content,
        })),
        searchResults: [], // Will be populated by search if needed
        originalQuery: message,
      }),
    });

    if (!chatResponse.ok) {
      throw new Error(`Chat request failed: ${chatResponse.statusText}`);
    }

    const data = await chatResponse.json();

    // Transform context back to ChatContext format
    const transformedContext: ChatContext[] =
      data.context?.map((ctx: any) => ({
        role: ctx.role as "user" | "assistant" | "system",
        content: ctx.content,
      })) || [];

    return {
      response: data.response,
      context: transformedContext,
      searchResults: [],
      graphRagResults: [],
      entities: [],
      reasoningResults: undefined,
      suggestedActions: data.suggestedActions || [],
      explanation: {
        searchStrategy: "hybrid",
        reasoningApplied: false,
        confidenceScore: 0.8,
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
    // Use the traditional API service for chat functionality
    const chatResponse = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        model: options.model,
        context: options.context.map((ctx) => ({
          role: ctx.role,
          content: ctx.content,
        })),
        searchResults: [], // Will be populated by search if needed
        originalQuery: message,
      }),
    });

    if (!chatResponse.ok) {
      throw new Error(`Chat request failed: ${chatResponse.statusText}`);
    }

    const data = await chatResponse.json();

    // Transform context back to ChatContext format
    const transformedContext: ChatContext[] =
      data.context?.map((ctx: any) => ({
        role: ctx.role as "user" | "assistant" | "system",
        content: ctx.content,
      })) || [];

    return {
      response: data.response,
      context: transformedContext,
      searchResults: [],
      suggestedActions: data.suggestedActions || [],
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
      const { graphRagApiService } = await import("../graph-rag-api");

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
      console.warn("Relationship finding failed:", error);
      return null;
    }
  }

  async findSimilarEntities(
    entityId: string,
    threshold: number = 0.7
  ): Promise<GraphRagEntity[]> {
    try {
      const { graphRagApiService } = await import("../graph-rag-api");

      return await graphRagApiService.findSimilar(entityId, {
        threshold,
        limit: 10,
      });
    } catch (error) {
      console.warn("Similar entity search failed:", error);
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

  // ============================================================================
  // ENHANCED SEARCH UTILITY METHODS
  // ============================================================================

  /**
   * Expand query terms using dictionary services
   */
  private async expandQueryTerms(
    query: string,
    options: {
      expansionTypes: string[];
      maxExpansionsPerTerm: number;
    }
  ): Promise<string[]> {
    try {
      // Extract key terms from query (simple extraction)
      const terms = this.extractKeyTerms(query);

      if (terms.length === 0) return [];

      // Expand each term
      const allExpansions: string[] = [];

      for (const term of terms) {
        try {
          const expansions = await dictionaryClient.expandTerm(
            term,
            options.expansionTypes
          );

          // Filter and limit expansions
          const filteredExpansions = expansions
            .filter(
              (expansion) =>
                expansion.length > 2 && // Not too short
                expansion !== term && // Not the same as original
                !query.toLowerCase().includes(expansion.toLowerCase()) // Not already in query
            )
            .slice(0, options.maxExpansionsPerTerm);

          allExpansions.push(...filteredExpansions);
        } catch (error) {
          console.warn(`⚠️ Failed to expand term "${term}":`, error);
        }
      }

      return [...new Set(allExpansions)]; // Remove duplicates
    } catch (error) {
      console.warn("⚠️ Query expansion failed:", error);
      return [];
    }
  }

  /**
   * Enhance search results with dictionary data
   */
  private async enhanceResultsWithDictionary(
    results: SearchResult[]
  ): Promise<SearchResult[]> {
    try {
      // Extract potential entities from results
      const entitiesToCanonicalize: Array<{
        name: string;
        type: string;
        context?: string;
      }> = [];

      for (const result of results) {
        // Extract entities from title and content
        const titleEntities = this.extractEntitiesFromText(result.title);
        const contentEntities = result.text
          ? this.extractEntitiesFromText(result.text)
          : [];

        entitiesToCanonicalize.push(...titleEntities, ...contentEntities);
      }

      if (entitiesToCanonicalize.length === 0) return results;

      // Canonicalize entities
      const canonicalizedEntities = await dictionaryClient.canonicalizeEntities(
        {
          entities: entitiesToCanonicalize,
        }
      );

      // Apply canonicalization to results (simplified - could be more sophisticated)
      return results.map((result) => ({
        ...result,
        // Add any enhancements here
        tags: result.tags || [],
      }));
    } catch (error) {
      console.warn("⚠️ Result enhancement failed:", error);
      return results;
    }
  }

  /**
   * Build dictionary context for a message
   */
  private async buildDictionaryContext(
    message: string
  ): Promise<string | null> {
    try {
      const terms = this.extractKeyTerms(message);
      if (terms.length === 0) return null;

      const dictionaryInfo: string[] = [];

      // Get definitions for key terms
      for (const term of terms.slice(0, 3)) {
        // Limit to first 3 terms
        try {
          const definition = await dictionaryClient.getDefinition(
            term,
            message
          );
          if (definition) {
            dictionaryInfo.push(`${term}: ${definition}`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to get definition for "${term}":`, error);
        }
      }

      return dictionaryInfo.length > 0 ? dictionaryInfo.join("; ") : null;
    } catch (error) {
      console.warn("⚠️ Dictionary context building failed:", error);
      return null;
    }
  }

  /**
   * Extract key terms from text for dictionary lookup
   */
  private extractKeyTerms(text: string): string[] {
    // Simple term extraction - remove common words and punctuation
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 3 && // Longer than 3 chars
          !this.isStopWord(word) // Not a stop word
      );

    // Remove duplicates and return top terms
    return [...new Set(words)].slice(0, 5);
  }

  /**
   * Extract potential named entities from text
   */
  private extractEntitiesFromText(
    text: string
  ): Array<{ name: string; type: string; context?: string }> {
    // Simple entity extraction - look for capitalized words
    const words = text.split(/\s+/);
    const entities: Array<{ name: string; type: string; context?: string }> =
      [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      // Simple heuristic: words that start with capital letters
      if (
        word.length > 1 &&
        word[0] === word[0].toUpperCase() &&
        word[0] !== word[0].toLowerCase()
      ) {
        entities.push({
          name: word.replace(/[^\w]/g, ""), // Clean punctuation
          type: "OTHER", // Default type
          context: text,
        });
      }
    }

    return entities.slice(0, 3); // Limit to 3 entities
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      "the",
      "and",
      "for",
      "are",
      "but",
      "not",
      "you",
      "all",
      "can",
      "how",
      "what",
      "when",
      "where",
      "why",
      "this",
      "that",
      "with",
      "have",
      "will",
      "from",
      "they",
      "been",
      "were",
      "does",
      "would",
      "could",
      "should",
      "about",
      "which",
      "their",
      "there",
      "these",
      "those",
      "then",
      "than",
    ]);

    return stopWords.has(word.toLowerCase());
  }

  // ============================================================================
  // DICTIONARY HEALTH CHECKS
  // ============================================================================

  /**
   * Check if dictionary services are available
   */
  async isDictionaryAvailable(): Promise<boolean> {
    return dictionaryClient.isAvailable();
  }

  /**
   * Get dictionary service health status
   */
  async getDictionaryHealth() {
    return dictionaryClient.getHealth();
  }

  /**
   * Get available dictionary sources
   */
  async getDictionarySources() {
    return dictionaryClient.getSources();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const searchService = SearchService.getInstance();
