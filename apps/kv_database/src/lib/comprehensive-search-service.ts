/**
 * Comprehensive Search Service
 *
 * Main entry point for all search operations, combining:
 * - Traditional Obsidian search
 * - Advanced semantic search
 * - Multi-modal intelligence
 * - Graph-based retrieval
 */

import { ObsidianSearchService } from "./obsidian-search";
import { SemanticSearchEngine, SearchQuery } from "./semantic-search";
import { SearchResult } from "../types/index";
import { ObsidianDatabase } from "./database";
import { ObsidianEmbeddingService } from "./embeddings";
import {
  ObsidianSearchOptions,
  ObsidianSearchResponse,
  type SearchResult as BasicSearchResult,
  type DocumentMetadata,
} from "../types/index";

export interface ComprehensiveSearchQuery {
  /** Search text */
  text: string;

  /** Search mode */
  mode: "basic" | "advanced" | "graph" | "multi_modal" | "comprehensive";

  /** Options for the search */
  options?: ComprehensiveSearchOptions;
}

export interface ComprehensiveSearchOptions extends ObsidianSearchOptions {
  /** Enable experimental features */
  experimental?: {
    /** Use graph retrieval */
    graphRetrieval: boolean;
    /** Use cross-modal search */
    crossModalSearch: boolean;
    /** Use advanced entity linking */
    entityLinking: boolean;
    /** Use query expansion */
    queryExpansion: boolean;
  };

  /** Performance preferences */
  performance?: {
    /** Maximum search time in milliseconds */
    maxSearchTime: number;
    /** Use caching for repeated queries */
    useCache: boolean;
    /** Parallel search execution */
    parallel: boolean;
  };

  /** Result customization */
  resultFormat?: {
    /** Include detailed scoring breakdown */
    includeScoring: boolean;
    /** Include graph visualization data */
    includeGraphData: boolean;
    /** Include multi-modal insights */
    includeMultiModalInsights: boolean;
    /** Include query analysis */
    includeQueryAnalysis: boolean;
  };
}

export interface ComprehensiveSearchResponse extends ObsidianSearchResponse {
  /** Advanced results with additional insights */
  advancedResults?: SearchResult[];

  /** Search analytics */
  analytics: {
    /** Total search time */
    totalTime: number;
    /** Time breakdown by component */
    timeBreakdown: {
      queryAnalysis: number;
      vectorSearch: number;
      graphSearch: number;
      multiModalSearch: number;
      resultFusion: number;
      reranking: number;
    };
    /** Strategy effectiveness scores */
    strategyScores: {
      vector: number;
      graph: number;
      entity: number;
      multiModal: number;
    };
  };

  /** Knowledge graph insights */
  knowledgeInsights?: {
    /** Key entities discovered */
    keyEntities: Array<{
      text: string;
      type: string;
      frequency: number;
      centrality: number;
    }>;
    /** Important relationships */
    keyRelationships: Array<{
      subject: string;
      predicate: string;
      object: string;
      strength: number;
    }>;
    /** Content clusters */
    clusters: Array<{
      id: string;
      theme: string;
      resultIds: string[];
      coherence: number;
    }>;
  };

  /** Multi-modal analysis */
  multiModalAnalysis?: {
    /** Content type distribution */
    contentDistribution: { [contentType: string]: number };
    /** Quality distribution */
    qualityDistribution: {
      high: number; // > 0.8
      medium: number; // 0.4-0.8
      low: number; // < 0.4
    };
    /** Cross-modal correlations found */
    correlations: number;
  };

  /** Query understanding */
  queryAnalysis?: {
    /** Detected intent */
    intent: string;
    /** Extracted entities */
    entities: Array<{
      text: string;
      type: string;
      confidence: number;
    }>;
    /** Query complexity score */
    complexity: number;
    /** Suggested refinements */
    refinements: string[];
  };
}

export class ComprehensiveSearchService {
  private obsidianSearch: ObsidianSearchService;
  private advancedSearch: SemanticSearchEngine;
  private db: ObsidianDatabase;
  private embeddings: ObsidianEmbeddingService;

  // Cache for repeated queries
  private queryCache = new Map<string, ComprehensiveSearchResponse>();

  constructor(
    database: ObsidianDatabase,
    embeddingService: ObsidianEmbeddingService
  ) {
    this.db = database;
    this.embeddings = embeddingService;
    this.obsidianSearch = new ObsidianSearchService(database, embeddingService);
    this.advancedSearch = new SemanticSearchEngine(database, embeddingService);
  }

  /**
   * Main search entry point with comprehensive capabilities
   */
  async search(
    query: ComprehensiveSearchQuery
  ): Promise<ComprehensiveSearchResponse> {
    const startTime = Date.now();
    console.log(
      `🚀 Comprehensive search: "${query.text}" (mode: ${query.mode})`
    );

    // Check cache first
    const cacheKey = this.generateCacheKey(query);
    if (query.options?.performance?.useCache && this.queryCache.has(cacheKey)) {
      console.log("⚡ Returning cached result");
      return this.queryCache.get(cacheKey)!;
    }

    try {
      let response: ComprehensiveSearchResponse;

      switch (query.mode) {
        case "basic":
          response = await this.basicSearch(query);
          break;
        case "advanced":
          response = await this.advancedSearch_(query);
          break;
        case "graph":
          response = await this.graphSearch(query);
          break;
        case "multi_modal":
          response = await this.multiModalSearch(query);
          break;
        case "comprehensive":
          response = await this.comprehensiveSearch(query);
          break;
        default:
          throw new Error(`Unknown search mode: ${query.mode}`);
      }

      // Add analytics
      const totalTime = Date.now() - startTime;
      response.analytics.totalTime = totalTime;

      // Cache result if enabled
      if (query.options?.performance?.useCache) {
        this.queryCache.set(cacheKey, response);
      }

      console.log(`✅ Comprehensive search completed in ${totalTime}ms`);
      return response;
    } catch (error) {
      console.error("❌ Comprehensive search failed:", error);
      throw error;
    }
  }

  /**
   * Basic search using existing Obsidian search
   */
  private async basicSearch(
    query: ComprehensiveSearchQuery
  ): Promise<ComprehensiveSearchResponse> {
    const queryAnalysisStart = Date.now();
    const obsidianResponse = await this.obsidianSearch.search(
      query.text,
      query.options
    );
    const queryAnalysisTime = Date.now() - queryAnalysisStart;

    return {
      ...obsidianResponse,
      analytics: {
        totalTime: 0, // Will be set by caller
        timeBreakdown: {
          queryAnalysis: queryAnalysisTime,
          vectorSearch: queryAnalysisTime, // Approximate
          graphSearch: 0,
          multiModalSearch: 0,
          resultFusion: 0,
          reranking: 0,
        },
        strategyScores: {
          vector: 1.0,
          graph: 0,
          entity: 0,
          multiModal: 0,
        },
      },
    };
  }

  /**
   * Advanced semantic search
   */
  private async advancedSearch_(
    query: ComprehensiveSearchQuery
  ): Promise<ComprehensiveSearchResponse> {
    const _startTime = Date.now();
    const timeBreakdown = {
      queryAnalysis: 0,
      vectorSearch: 0,
      graphSearch: 0,
      multiModalSearch: 0,
      resultFusion: 0,
      reranking: 0,
    };

    // Build advanced query
    const advancedQuery: SearchQuery = {
      text: query.text,
      strategy: "hybrid",
      expansion: {
        semantic: query.options?.experimental?.queryExpansion || false,
        entity: query.options?.experimental?.entityLinking || false,
        graph: false,
      },
      options: query.options,
    };

    const start = Date.now();
    const advancedResults = await this.advancedSearch.search(advancedQuery);
    timeBreakdown.vectorSearch = Date.now() - start;

    // Convert to standard format
    const results = advancedResults;

    return {
      query: query.text,
      totalFound: results.length,
      latencyMs: Date.now() - start,
      results: this.convertToObsidianSearchResults(results),
      advancedResults,
      facets: await this.generateBasicFacets(results),
      graphInsights: this.generateBasicGraphInsights(results),
      analytics: {
        totalTime: 0,
        timeBreakdown,
        strategyScores: {
          vector: 0.8,
          graph: 0.2,
          entity: 0.5,
          multiModal: 0,
        },
      },
    };
  }

  /**
   * Graph-focused search
   */
  private async graphSearch(
    query: ComprehensiveSearchQuery
  ): Promise<ComprehensiveSearchResponse> {
    const timeBreakdown = {
      queryAnalysis: 0,
      vectorSearch: 0,
      graphSearch: 0,
      multiModalSearch: 0,
      resultFusion: 0,
      reranking: 0,
    };

    // Build graph-focused query
    const advancedQuery: SearchQuery = {
      text: query.text,
      strategy: "graph",
      expansion: {
        semantic: true,
        entity: true,
        graph: true,
      },
      options: {
        ...query.options,
        graphTraversal: {
          maxHops: 3,
          minRelationshipStrength: 0.3,
          entityTypes: ["person", "organization", "concept", "location"],
        },
      },
    };

    const start = Date.now();
    const advancedResults = await this.advancedSearch.search(advancedQuery);
    timeBreakdown.graphSearch = Date.now() - start;

    const results = advancedResults;

    // Generate comprehensive knowledge insights
    const knowledgeInsights = await this.generateKnowledgeInsights(
      advancedResults
    );

    return {
      results: this.convertToObsidianSearchResults(results),
      advancedResults,
      facets: await this.generateBasicFacets(results),
      graphInsights: this.generateAdvancedGraphInsights(advancedResults),
      knowledgeInsights,
      analytics: {
        totalTime: 0,
        timeBreakdown,
        strategyScores: {
          vector: 0.3,
          graph: 1.0,
          entity: 0.8,
          multiModal: 0,
        },
      },
    };
  }

  /**
   * Multi-modal focused search
   */
  private async multiModalSearch(
    query: ComprehensiveSearchQuery
  ): Promise<ComprehensiveSearchResponse> {
    const _startTime = Date.now();
    const timeBreakdown = {
      queryAnalysis: 0,
      vectorSearch: 0,
      graphSearch: 0,
      multiModalSearch: 0,
      resultFusion: 0,
      reranking: 0,
    };

    // Build multi-modal query
    const advancedQuery: SearchQuery = {
      text: query.text,
      strategy: "multi_modal",
      expansion: {
        semantic: true,
        entity: false,
        graph: false,
      },
      options: {
        ...query.options,
        crossModal: {
          textWeight: 0.4,
          imageWeight: 0.3,
          audioWeight: 0.2,
          videoWeight: 0.1,
        },
      },
    };

    const start = Date.now();
    const advancedResults = await this.advancedSearch.search(advancedQuery);
    timeBreakdown.multiModalSearch = Date.now() - start;

    const results = advancedResults;

    // Generate multi-modal analysis
    const multiModalAnalysis = this.generateMultiModalAnalysis(advancedResults);

    return {
      query: query.text,
      totalFound: results.length,
      latencyMs: Date.now() - start,
      results: this.convertToObsidianSearchResults(results),
      advancedResults,
      facets: await this.generateBasicFacets(results),
      graphInsights: this.generateBasicGraphInsights(results),
      multiModalAnalysis,
      analytics: {
        totalTime: 0,
        timeBreakdown,
        strategyScores: {
          vector: 0.5,
          graph: 0,
          entity: 0.3,
          multiModal: 1.0,
        },
      },
    };
  }

  /**
   * Comprehensive search using all capabilities
   */
  private async comprehensiveSearch(
    query: ComprehensiveSearchQuery
  ): Promise<ComprehensiveSearchResponse> {
    const timeBreakdown = {
      queryAnalysis: 0,
      vectorSearch: 0,
      graphSearch: 0,
      multiModalSearch: 0,
      resultFusion: 0,
      reranking: 0,
    };

    // Query analysis
    const queryAnalysisStart = Date.now();
    const queryAnalysis = await this.analyzeQuery(query.text);
    timeBreakdown.queryAnalysis = Date.now() - queryAnalysisStart;

    // Build comprehensive query
    const advancedQuery: SearchQuery = {
      text: query.text,
      strategy: "comprehensive",
      expansion: {
        semantic: true,
        entity: true,
        graph: true,
      },
      options: {
        ...query.options,
        crossModal: {
          textWeight: 0.4,
          imageWeight: 0.25,
          audioWeight: 0.25,
          videoWeight: 0.1,
        },
        graphTraversal: {
          maxHops: 2,
          minRelationshipStrength: 0.2,
          entityTypes: [
            "person",
            "organization",
            "concept",
            "location",
            "term",
          ],
        },
        fusion: {
          algorithm: "rrf",
          componentWeights: {
            vector: 0.3,
            graph: 0.2,
            entity: 0.2,
            temporal: 0.1,
          },
        },
        reranking: {
          enabled: true,
          topK: 20,
          contextWindow: 512,
        },
      },
    };

    // Execute advanced search
    const searchStart = Date.now();
    const advancedResults = await this.advancedSearch.search(advancedQuery);
    const searchTime = Date.now() - searchStart;

    // Distribute search time across components (estimated)
    timeBreakdown.vectorSearch = searchTime * 0.4;
    timeBreakdown.graphSearch = searchTime * 0.2;
    timeBreakdown.multiModalSearch = searchTime * 0.2;
    timeBreakdown.resultFusion = searchTime * 0.1;
    timeBreakdown.reranking = searchTime * 0.1;

    const results = advancedResults;

    // Generate all insights
    const knowledgeInsights = await this.generateKnowledgeInsights(
      advancedResults
    );
    const multiModalAnalysis = this.generateMultiModalAnalysis(advancedResults);

    return {
      results: this.convertToObsidianSearchResults(results),
      advancedResults,
      facets: await this.generateBasicFacets(results),
      graphInsights: this.generateAdvancedGraphInsights(advancedResults),
      knowledgeInsights,
      multiModalAnalysis,
      queryAnalysis,
      analytics: {
        totalTime: 0,
        timeBreakdown,
        strategyScores: {
          vector: 0.8,
          graph: 0.7,
          entity: 0.6,
          multiModal: 0.5,
        },
      },
    };
  }

  // Helper methods

  private generateCacheKey(query: ComprehensiveSearchQuery): string {
    return `${query.mode}:${query.text}:${JSON.stringify(query.options)}`;
  }

  private convertAdvancedToStandard(advanced: SearchResult) {
    return {
      ...advanced,
      // Maintain compatibility with existing result format
    };
  }

  private async generateBasicFacets(results) {
    // Generate basic facets from results
    const contentTypes = new Map<string, number>();
    const tags = new Map<string, number>();

    results.forEach((result) => {
      // Content type facet
      const contentType = result.meta?.contentType || "unknown";
      contentTypes.set(contentType, (contentTypes.get(contentType) || 0) + 1);

      // Tags facet
      const resultTags = result.meta?.obsidianFile?.tags || [];
      resultTags.forEach((tag: string) => {
        tags.set(tag, (tags.get(tag) || 0) + 1);
      });
    });

    return {
      contentTypes: Array.from(contentTypes.entries()).map(([type, count]) => ({
        type,
        count,
      })),
      tags: Array.from(tags.entries()).map(([tag, count]) => ({ tag, count })),
    };
  }

  private generateBasicGraphInsights(results: BasicSearchResult[]) {
    // Basic graph insights - simplified for basic SearchResult type
    const entities = new Map<string, number>();
    const relationships = new Map<string, number>();

    results.forEach((result) => {
      // Extract basic entities from content (simplified approach)
      const content = result.content || "";
      const words = content.split(/\s+/).filter((word) => word.length > 3);
      words.forEach((word) => {
        entities.set(
          word.toLowerCase(),
          (entities.get(word.toLowerCase()) || 0) + 1
        );
      });
    });

    return {
      queryConcepts: Array.from(entities.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([entity, _count]) => entity),
      relatedConcepts: Array.from(relationships.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([key, _count]) => key),
      knowledgeClusters: Array.from(entities.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, centrality]) => ({
          name,
          files: [`concept-${name}`],
          centrality,
        })),
      totalEntities: entities.size,
      totalRelationships: relationships.size,
      topEntities: Array.from(entities.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([_entity, count]) => ({ entity: _entity, count })),
    };
  }

  private generateAdvancedGraphInsights(results: SearchResult[]) {
    // Convert to basic format for graph insights
    const basicResults: BasicSearchResult[] = results.map((result) => ({
      documentId: result.id,
      score: result.scoring?.combined || 0,
      title: result.title || "Untitled",
      path: result.path || "",
      content: result.text,
      matches: result.matches || [],
      meta: result.meta || ({} as DocumentMetadata),
    }));
    const basicInsights = this.generateBasicGraphInsights(basicResults);

    // Add centrality analysis - simplified since SearchResult doesn't have graphContext
    const centralityScores = new Map<string, number>();
    results.forEach((result) => {
      // Use basic scoring as a proxy for centrality
      const centrality = result.scoring?.combined || 0;

      // Extract entities from text content
      const entities = this.extractEntitiesFromText(result.text);
      entities.forEach((entity: string) => {
        centralityScores.set(
          entity,
          Math.max(centralityScores.get(entity) || 0, centrality)
        );
      });
    });

    return {
      ...basicInsights,
      centralityAnalysis: {
        topCentralEntities: Array.from(centralityScores.entries())
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([entity, score]) => ({ entity, score })),
      },
    };
  }

  private extractEntitiesFromText(text: string): string[] {
    // Simple entity extraction from text
    const words = text.split(/\s+/);
    return words
      .filter((word) => word.length > 3 && /^[A-Z]/.test(word))
      .map((word) => word.toLowerCase());
  }

  private convertToObsidianSearchResults(
    results: SearchResult[]
  ): BasicSearchResult[] {
    return results.map((result) => ({
      documentId: result.id,
      score: result.scoring?.combined || 0,
      title: result.title || "Untitled",
      path: result.path || "",
      content: result.text,
      matches: result.matches || [],
      meta: result.meta || ({} as DocumentMetadata),
    }));
  }

  private async generateKnowledgeInsights(results: SearchResult[]) {
    // Extract key entities across all results using text analysis
    const entityFrequency = new Map<
      string,
      { count: number; type: string; totalCentrality: number }
    >();
    const relationshipStrength = new Map<string, number>();

    results.forEach((result) => {
      // Extract entities from text content
      const entities = this.extractEntitiesFromText(result.text);
      const centrality = result.scoring?.combined || 0;

      entities.forEach((entity) => {
        const key = entity;
        const existing = entityFrequency.get(key) || {
          count: 0,
          type: "concept",
          totalCentrality: 0,
        };

        entityFrequency.set(key, {
          count: existing.count + 1,
          type: existing.type,
          totalCentrality: existing.totalCentrality + centrality,
        });
      });

      // Extract basic relationships from text
      const relationships = this.extractRelationshipsFromText(result.text);
      relationships.forEach((rel) => {
        const key = `${rel.subject}|${rel.predicate}|${rel.object}`;
        relationshipStrength.set(
          key,
          (relationshipStrength.get(key) || 0) + centrality
        );
      });
    });

    // Generate clusters (simplified)
    const clusters = this.generateContentClusters(results);

    return {
      keyEntities: Array.from(entityFrequency.entries())
        .map(([text, data]) => ({
          text,
          type: data.type,
          frequency: data.count,
          centrality: data.totalCentrality / data.count,
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 20),

      keyRelationships: Array.from(relationshipStrength.entries())
        .map(([key, strength]) => {
          const [subject, predicate, object] = key.split("|");
          return { subject, predicate, object, strength };
        })
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 15),

      clusters,
    };
  }

  private extractRelationshipsFromText(
    text: string
  ): Array<{ subject: string; predicate: string; object: string }> {
    // Simple relationship extraction - this is a basic implementation
    const relationships: Array<{
      subject: string;
      predicate: string;
      object: string;
    }> = [];

    // Look for patterns like "A is B", "A has B", etc.
    const patterns = [
      { regex: /(\w+) is (\w+)/i, predicate: "is" },
      { regex: /(\w+) has (\w+)/i, predicate: "has" },
      { regex: /(\w+) contains (\w+)/i, predicate: "contains" },
    ];

    patterns.forEach(({ regex, predicate }) => {
      const matches = text.match(regex);
      if (matches) {
        relationships.push({
          subject: matches[1],
          predicate,
          object: matches[2],
        });
      }
    });

    return relationships;
  }

  private generateContentClusters(results: SearchResult[]) {
    // Simplified clustering based on shared content themes
    const clusters: Array<{
      id: string;
      theme: string;
      resultIds: string[];
      coherence: number;
    }> = [];

    // Group results by first word of title (simplified approach)
    const titleWordGroups = new Map<string, string[]>();

    results.forEach((result) => {
      const titleWords = (result.title || "").split(/\s+/);
      if (titleWords.length > 0) {
        const firstWord = titleWords[0].toLowerCase();

        if (!titleWordGroups.has(firstWord)) {
          titleWordGroups.set(firstWord, []);
        }
        titleWordGroups.get(firstWord)!.push(result.id);
      }
    });

    // Create clusters from groups
    titleWordGroups.forEach((resultIds, firstWord) => {
      if (resultIds.length >= 2) {
        // Only create clusters with 2+ results
        clusters.push({
          id: `cluster_${firstWord}`,
          theme: `${firstWord.charAt(0).toUpperCase()}${firstWord.slice(
            1
          )} Focus`,
          resultIds,
          coherence: Math.min(1, resultIds.length / 5), // Coherence based on cluster size
        });
      }
    });

    return clusters;
  }

  private generateMultiModalAnalysis(results: SearchResult[]) {
    const contentDistribution: { [contentType: string]: number } = {};
    const qualityDistribution = { high: 0, medium: 0, low: 0 };
    let totalCorrelations = 0;

    results.forEach((result) => {
      // Content type distribution - simplified approach
      const contentType = "text"; // All SearchResult are text-based
      contentDistribution[contentType] =
        (contentDistribution[contentType] || 0) + 1;

      // Quality distribution based on scoring
      const qualityScore = result.scoring?.combined || 0.5;

      if (qualityScore > 0.8) {
        qualityDistribution.high++;
      } else if (qualityScore > 0.4) {
        qualityDistribution.medium++;
      } else {
        qualityDistribution.low++;
      }

      // Correlations count - simplified
      totalCorrelations += Math.floor(qualityScore * 3); // Estimate based on quality
    });

    return {
      contentDistribution,
      qualityDistribution,
      correlations: totalCorrelations,
    };
  }

  private async analyzeQuery(text: string) {
    // Simplified query analysis
    // In production, this would use NLP models for intent classification and entity extraction

    const wordCount = text.split(/\s+/).length;
    const hasQuestionWords = /\b(what|who|where|when|why|how)\b/i.test(text);
    const hasTimeReferences =
      /\b(today|yesterday|last week|recent|latest)\b/i.test(text);

    let intent = "search";
    if (hasQuestionWords) {
      intent = "question";
    } else if (hasTimeReferences) {
      intent = "temporal_search";
    }

    const complexity = Math.min(1, wordCount / 20); // Normalize to 0-1

    return {
      intent,
      entities: [], // Would be populated by NER
      complexity,
      refinements: [
        "Try adding more specific terms",
        "Consider filtering by content type",
        "Use date range filters for temporal queries",
      ].slice(0, Math.max(1, Math.floor(complexity * 3))),
    };
  }

  /**
   * Clear the query cache
   */
  clearCache(): void {
    this.queryCache.clear();
    console.log("🧹 Query cache cleared");
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.queryCache.size,
      keys: Array.from(this.queryCache.keys()),
    };
  }
}
