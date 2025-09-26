/**
 * Enhanced Semantic Search Engine
 *
 * Comprehensive search system that combines:
 * - Vector similarity search
 * - Graph-based entity relationships
 * - Multi-modal content understanding
 * - Advanced ranking and fusion
 * - Knowledge graph construction
 */

import { ObsidianDatabase } from "./database";
import { ObsidianEmbeddingService } from "./embeddings";
import {
  // detectLanguage, // Not used
  EnhancedEntityExtractor,
  ExtractedEntity,
  EntityRelationship,
  // EntityCluster, // Not used
} from "./utils";
import {
  SearchResult,
  ObsidianSearchOptions,
  ObsidianSearchResult,
  // ObsidianSearchResponse, // Not used
  ContentType,
  Wikilink,
} from "../types/index";

// Search interfaces
export interface SearchQuery {
  /** Primary search text */
  text: string;

  /** Search strategy */
  strategy: "vector" | "graph" | "hybrid" | "multi_modal" | "comprehensive";

  /** Query expansion settings */
  expansion?: {
    /** Use synonyms and related terms */
    semantic: boolean;
    /** Include entity-related queries */
    entity: boolean;
    /** Use graph relationships */
    graph: boolean;
  };

  /** Advanced options */
  options?: SearchOptions;
}

export interface SearchOptions extends ObsidianSearchOptions {
  /** Cross-modal search settings */
  crossModal?: {
    /** Weight for text-based results */
    textWeight: number;
    /** Weight for image/OCR results */
    imageWeight: number;
    /** Weight for audio transcription results */
    audioWeight: number;
    /** Weight for video content results */
    videoWeight: number;
  };

  /** Graph traversal settings */
  graphTraversal?: {
    /** Maximum graph hops for related content */
    maxHops: number;
    /** Minimum relationship strength */
    minRelationshipStrength: number;
    /** Entity types to include in traversal */
    entityTypes: string[];
  };

  /** Result fusion settings */
  fusion?: {
    /** Algorithm for combining multiple result sets */
    algorithm: "rrf" | "weighted" | "rank_fusion" | "borda_count";
    /** Weights for different search components */
    componentWeights: {
      vector: number;
      graph: number;
      entity: number;
      temporal: number;
    };
  };

  /** Intelligent re-ranking */
  reranking?: {
    /** Enable cross-encoder re-ranking */
    enabled: boolean;
    /** Re-rank top K results */
    topK: number;
    /** Context window for re-ranking */
    contextWindow: number;
  };

  /** Content quality filters */
  qualityFilters?: {
    /** Minimum content completeness (0-1) */
    minCompleteness: number;
    /** Minimum entity density */
    minEntityDensity: number;
    /** Require specific metadata fields */
    requiredFields: string[];
  };
}

export interface SearchResult extends ObsidianSearchResult {
  /** Enhanced scoring breakdown */
  scoring: {
    vector: number;
    graph: number;
    entity: number;
    temporal: number;
    quality: number;
    combined: number;
  };

  /** Graph context */
  graphContext?: {
    /** Direct entity relationships */
    entityConnections: EntityRelationship[];
    /** Graph distance from query entities */
    graphDistance: number;
    /** Centrality measures */
    centrality: {
      betweenness: number;
      closeness: number;
      pagerank: number;
    };
  };

  /** Multi-modal insights */
  multiModalInsights?: {
    /** Content extraction confidence */
    extractionConfidence: number;
    /** Cross-modal correlations */
    correlations: Array<{
      modality: string;
      confidence: number;
      evidence: string;
    }>;
    /** Semantic consistency across modalities */
    consistency: number;
  };

  /** Knowledge graph segment */
  knowledgeSegment?: {
    /** Key concepts from this result */
    concepts: string[];
    /** Relationships to other results */
    interResultConnections: Array<{
      targetResultId: string;
      relationshipType: string;
      strength: number;
    }>;
  };
}

export class SemanticSearchEngine {
  private db: ObsidianDatabase;
  private embeddings: ObsidianEmbeddingService;
  private entityExtractor: EntityExtractor;

  constructor(
    database: ObsidianDatabase,
    embeddingService: ObsidianEmbeddingService
  ) {
    this.db = database;
    this.embeddings = embeddingService;
    this.entityExtractor = new EntityExtractor();
  }

  /**
   * Main search entry point
   */
  async search(query: SearchQuery): Promise<SearchResult[]> {
    console.log(`🧠 Search: "${query.text}" (strategy: ${query.strategy})`);
    const startTime = Date.now();

    try {
      // Step 1: Query Analysis and Expansion
      const analyzedQuery = await this.analyzeQuery(query);

      // Step 2: Multi-Strategy Search Execution
      const rawResults = await this.executeMultiStrategySearch(analyzedQuery);

      // Step 3: Result Fusion
      const fusedResults = await this.fuseResults(rawResults, analyzedQuery);

      // Step 4: Graph Augmentation
      const graphAugmentedResults = await this.augmentWithGraph(
        fusedResults,
        analyzedQuery
      );

      // Step 5: Multi-Modal Analysis
      const multiModalResults = await this.analyzeMultiModal(
        graphAugmentedResults,
        analyzedQuery
      );

      // Step 6: Advanced Re-ranking
      const rerankedResults = await this.rerankResults(
        multiModalResults,
        analyzedQuery
      );

      // Step 7: Knowledge Graph Construction
      const finalResults = await this.constructKnowledgeGraph(
        rerankedResults,
        analyzedQuery
      );

      const endTime = Date.now();
      console.log(`✅ Enhanced search completed in ${endTime - startTime}ms`);
      console.log(
        `📊 Results: ${finalResults.length} total, strategy: ${query.strategy}`
      );

      return finalResults;
    } catch (error) {
      console.error("❌ Enhanced search failed:", error);
      throw error;
    }
  }

  /**
   * Analyze and expand the query for better search
   */
  private async analyzeQuery(query: EnhancedSearchQuery) {
    const entities = this.entityExtractor.extractEntities(query.text);
    const relationships = this.entityExtractor.extractRelationships(
      query.text,
      entities
    );

    let expandedTerms: string[] = [query.text];

    if (query.expansion?.semantic) {
      // Add semantic expansions (synonyms, related terms)
      expandedTerms = await this.expandSemanticTerms(query.text, entities);
    }

    if (query.expansion?.entity) {
      // Add entity-based expansions
      const entityTerms = entities.map((e) => e.text);
      expandedTerms.push(...entityTerms);
    }

    return {
      original: query,
      entities,
      relationships,
      expandedTerms,
      queryEmbedding: await this.embeddings.embed(query.text),
    };
  }

  /**
   * Execute search using multiple strategies
   */
  private async executeMultiStrategySearch(analyzedQuery: any) {
    const results: { [strategy: string]: SearchResult[] } = {};

    // Vector similarity search
    results.vector = await this.vectorSearch(analyzedQuery);

    // Entity-based search
    results.entity = await this.entitySearch(analyzedQuery);

    // Graph traversal search
    if (
      analyzedQuery.original.strategy === "graph" ||
      analyzedQuery.original.strategy === "comprehensive"
    ) {
      results.graph = await this.graphSearch(analyzedQuery);
    }

    // Multi-modal search
    if (
      analyzedQuery.original.strategy === "multi_modal" ||
      analyzedQuery.original.strategy === "comprehensive"
    ) {
      results.multiModal = await this.multiModalSearch(analyzedQuery);
    }

    return results;
  }

  /**
   * Vector-based similarity search
   */
  private async vectorSearch(analyzedQuery: any): Promise<SearchResult[]> {
    const options = analyzedQuery.original.options || {};

    return await this.db.search(
      analyzedQuery.queryEmbedding.embedding,
      options.limit || 50,
      {
        fileTypes: options.fileTypes,
        tags: options.tags,
        folders: options.folders,
        hasWikilinks: options.hasWikilinks,
        dateRange: options.dateRange,
        minSimilarity: options.minSimilarity || 0.3,
      }
    );
  }

  /**
   * Entity-focused search
   */
  private async entitySearch(analyzedQuery: any): Promise<SearchResult[]> {
    const entityResults: SearchResult[] = [];

    for (const entity of analyzedQuery.entities) {
      // Search for documents containing this entity
      const entityEmbedding = await this.embeddings.embed(entity.text);
      const results = await this.db.search(entityEmbedding.embedding, 20, {
        minSimilarity: 0.25,
      });
      entityResults.push(...results);
    }

    return this.deduplicateResults(entityResults);
  }

  /**
   * Graph traversal search using entity relationships
   */
  private async graphSearch(analyzedQuery: any): Promise<SearchResult[]> {
    // This is a simplified implementation
    // In a full Graph RAG system, this would query a graph database
    const graphResults: SearchResult[] = [];

    // For each entity, find related entities and search for those
    for (const entity of analyzedQuery.entities) {
      // Simulate graph traversal by searching for related terms
      const relatedTerms = this.findRelatedTerms(
        entity,
        analyzedQuery.relationships
      );

      for (const term of relatedTerms) {
        const termEmbedding = await this.embeddings.embed(term);
        const results = await this.db.search(termEmbedding.embedding, 10, {
          minSimilarity: 0.2,
        });
        graphResults.push(...results);
      }
    }

    return this.deduplicateResults(graphResults);
  }

  /**
   * Multi-modal content search
   */
  private async multiModalSearch(analyzedQuery: any): Promise<SearchResult[]> {
    const multiModalResults: SearchResult[] = [];
    const options = analyzedQuery.original.options || {};

    // Search across different content types with type-specific strategies
    const contentTypes = [
      ContentType.VIDEO,
      ContentType.AUDIO,
      ContentType.RASTER_IMAGE,
      ContentType.PDF,
      ContentType.OFFICE_DOCUMENT,
    ];

    for (const contentType of contentTypes) {
      const typeResults = await this.db.search(
        analyzedQuery.queryEmbedding.embedding,
        15,
        {
          fileTypes: [contentType],
          minSimilarity: 0.1, // Lower threshold for multi-modal content
        }
      );
      multiModalResults.push(...typeResults);
    }

    return multiModalResults;
  }

  /**
   * Fuse results from multiple search strategies
   */
  private async fuseResults(
    results: { [strategy: string]: SearchResult[] },
    analyzedQuery: any
  ): Promise<SearchResult[]> {
    const fusionOptions = analyzedQuery.original.options?.fusion || {
      algorithm: "weighted",
      componentWeights: {
        vector: 0.4,
        graph: 0.2,
        entity: 0.2,
        temporal: 0.1,
        multiModal: 0.1,
      },
    };

    switch (fusionOptions.algorithm) {
      case "rrf":
        return this.reciprocalRankFusion(results);
      case "weighted":
        return this.weightedFusion(results, fusionOptions.componentWeights);
      default:
        // Simple concatenation with deduplication
        const allResults = Object.values(results).flat();
        return this.deduplicateResults(allResults);
    }
  }

  /**
   * Augment results with graph-based insights
   */
  private async augmentWithGraph(
    results: SearchResult[],
    analyzedQuery: any
  ): Promise<EnhancedSearchResult[]> {
    return results.map((result) => {
      // Extract entities from result content
      const resultEntities = this.entityExtractor.extractEntities(result.text);
      const resultRelationships = this.entityExtractor.extractRelationships(
        result.text,
        resultEntities
      );

      // Calculate graph context
      const graphContext = this.calculateGraphContext(
        resultEntities,
        resultRelationships,
        analyzedQuery.entities
      );

      return {
        ...result,
        scoring: this.calculateEnhancedScoring(result, analyzedQuery),
        graphContext,
      } as EnhancedSearchResult;
    });
  }

  /**
   * Analyze multi-modal content correlations
   */
  private async analyzeMultiModal(
    results: EnhancedSearchResult[],
    analyzedQuery: any
  ): Promise<EnhancedSearchResult[]> {
    return results.map((result) => {
      const multiModalMeta = result.meta.multiModalFile;

      if (!multiModalMeta) {
        return result;
      }

      // Analyze cross-modal correlations
      const correlations = this.findCrossModalCorrelations(
        result,
        analyzedQuery
      );

      // Calculate semantic consistency
      const consistency = this.calculateSemanticConsistency(result);

      result.multiModalInsights = {
        extractionConfidence: multiModalMeta.quality?.overallScore || 0,
        correlations,
        consistency,
      };

      return result;
    });
  }

  /**
   * Advanced re-ranking using multiple signals
   */
  private async rerankResults(
    results: EnhancedSearchResult[],
    analyzedQuery: any
  ): Promise<EnhancedSearchResult[]> {
    // Sort by combined score
    return results.sort((a, b) => b.scoring.combined - a.scoring.combined);
  }

  /**
   * Construct knowledge graph from results
   */
  private async constructKnowledgeGraph(
    results: EnhancedSearchResult[],
    analyzedQuery: any
  ): Promise<EnhancedSearchResult[]> {
    // Build inter-result connections
    for (let i = 0; i < results.length; i++) {
      const currentResult = results[i];
      const connections: Array<{
        targetResultId: string;
        relationshipType: string;
        strength: number;
      }> = [];

      for (let j = i + 1; j < results.length; j++) {
        const otherResult = results[j];
        const connection = this.findInterResultConnection(
          currentResult,
          otherResult
        );

        if (connection) {
          connections.push({
            targetResultId: otherResult.id,
            relationshipType: connection.type,
            strength: connection.strength,
          });
        }
      }

      currentResult.knowledgeSegment = {
        concepts: this.extractKeyConcepts(currentResult),
        interResultConnections: connections,
      };
    }

    return results;
  }

  // Helper methods

  private async expandSemanticTerms(
    text: string,
    entities: ExtractedEntity[]
  ): Promise<string[]> {
    // Simplified semantic expansion
    // In production, this would use a thesaurus, word embeddings, or language models
    const expanded = [text];

    // Add entity texts as expansion terms
    entities.forEach((entity) => {
      if (!expanded.includes(entity.text)) {
        expanded.push(entity.text);
      }
    });

    return expanded;
  }

  private findRelatedTerms(
    entity: ExtractedEntity,
    relationships: EntityRelationship[]
  ): string[] {
    const related: string[] = [];

    relationships.forEach((rel) => {
      if (rel.subject === entity.text && !related.includes(rel.object)) {
        related.push(rel.object);
      }
      if (rel.object === entity.text && !related.includes(rel.subject)) {
        related.push(rel.subject);
      }
    });

    return related;
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter((result) => {
      if (seen.has(result.id)) {
        return false;
      }
      seen.add(result.id);
      return true;
    });
  }

  private reciprocalRankFusion(results: {
    [strategy: string]: SearchResult[];
  }): SearchResult[] {
    const scores = new Map<string, number>();
    const k = 60; // RRF parameter

    Object.entries(results).forEach(([strategy, strategyResults]) => {
      strategyResults.forEach((result, index) => {
        const currentScore = scores.get(result.id) || 0;
        const rrfScore = 1 / (k + index + 1);
        scores.set(result.id, currentScore + rrfScore);
      });
    });

    // Collect unique results and sort by RRF score
    const uniqueResults = new Map<string, SearchResult>();
    Object.values(results)
      .flat()
      .forEach((result) => {
        if (!uniqueResults.has(result.id)) {
          uniqueResults.set(result.id, result);
        }
      });

    return Array.from(uniqueResults.values()).sort(
      (a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0)
    );
  }

  private weightedFusion(
    results: { [strategy: string]: SearchResult[] },
    weights: { [strategy: string]: number }
  ): SearchResult[] {
    const scores = new Map<string, number>();

    Object.entries(results).forEach(([strategy, strategyResults]) => {
      const weight = weights[strategy] || 0.1;
      strategyResults.forEach((result, index) => {
        const currentScore = scores.get(result.id) || 0;
        const normalizedRank = 1 / (index + 1);
        const weightedScore =
          weight * normalizedRank * (result.cosineSimilarity || 0.5);
        scores.set(result.id, currentScore + weightedScore);
      });
    });

    const uniqueResults = new Map<string, SearchResult>();
    Object.values(results)
      .flat()
      .forEach((result) => {
        if (!uniqueResults.has(result.id)) {
          uniqueResults.set(result.id, result);
        }
      });

    return Array.from(uniqueResults.values()).sort(
      (a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0)
    );
  }

  private calculateEnhancedScoring(result: SearchResult, analyzedQuery: any) {
    const vectorScore = result.cosineSimilarity || 0;

    // Entity overlap score
    const resultEntities = this.entityExtractor.extractEntities(result.text);
    const entityOverlap = this.calculateEntityOverlap(
      resultEntities,
      analyzedQuery.entities
    );

    // Temporal relevance (recency)
    const temporalScore = this.calculateTemporalScore(result);

    // Content quality score
    const qualityScore = this.calculateQualityScore(result);

    // Graph centrality (simplified)
    const graphScore = this.calculateGraphScore(result);

    // Combined score using weighted average
    const combined =
      vectorScore * 0.4 +
      entityOverlap * 0.2 +
      temporalScore * 0.1 +
      qualityScore * 0.2 +
      graphScore * 0.1;

    return {
      vector: vectorScore,
      graph: graphScore,
      entity: entityOverlap,
      temporal: temporalScore,
      quality: qualityScore,
      combined,
    };
  }

  private calculateEntityOverlap(
    entities1: ExtractedEntity[],
    entities2: ExtractedEntity[]
  ): number {
    if (entities1.length === 0 || entities2.length === 0) return 0;

    const set1 = new Set(entities1.map((e) => e.text.toLowerCase()));
    const set2 = new Set(entities2.map((e) => e.text.toLowerCase()));

    const intersection = Array.from(set1).filter((x) => set2.has(x));
    const union = new Set([...set1, ...set2]);

    return intersection.length / union.size; // Jaccard similarity
  }

  private calculateTemporalScore(result: SearchResult): number {
    const updatedAt = result.meta.updatedAt;
    if (!updatedAt) return 0.5;

    const now = new Date();
    const daysDiff =
      (now.getTime() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);

    // Exponential decay: more recent = higher score
    return Math.exp(-daysDiff / 365); // Decay over a year
  }

  private calculateQualityScore(result: SearchResult): number {
    const multiModalMeta = result.meta.multiModalFile;

    if (multiModalMeta?.quality?.overallScore) {
      return multiModalMeta.quality.overallScore;
    }

    // For text content, use simple heuristics
    const textLength = result.text.length;
    const wordCount = result.text.split(/\s+/).length;

    // Prefer content with reasonable length and word density
    const lengthScore = Math.min(1, textLength / 1000); // Cap at 1000 chars
    const densityScore = Math.min(1, wordCount / 100); // Cap at 100 words

    return (lengthScore + densityScore) / 2;
  }

  private calculateGraphScore(result: SearchResult): number {
    // Simplified graph scoring based on entity count and relationships
    const entities = this.entityExtractor.extractEntities(result.text);
    const relationships = this.entityExtractor.extractRelationships(
      result.text,
      entities
    );

    const entityScore = Math.min(1, entities.length / 10); // Cap at 10 entities
    const relationshipScore = Math.min(1, relationships.length / 5); // Cap at 5 relationships

    return (entityScore + relationshipScore) / 2;
  }

  private calculateGraphContext(
    resultEntities: ExtractedEntity[],
    resultRelationships: EntityRelationship[],
    queryEntities: ExtractedEntity[]
  ) {
    // Calculate entity connections
    const entityConnections = resultRelationships.filter((rel) =>
      queryEntities.some(
        (qe) => qe.text === rel.subject || qe.text === rel.object
      )
    );

    // Simplified graph distance (would be more complex in a real graph DB)
    const graphDistance = entityConnections.length > 0 ? 1 : 2;

    // Simplified centrality measures
    const centrality = {
      betweenness: Math.min(1, entityConnections.length / 5),
      closeness: Math.min(1, resultEntities.length / 10),
      pagerank: Math.min(1, resultRelationships.length / 8),
    };

    return {
      entityConnections,
      graphDistance,
      centrality,
    };
  }

  private findCrossModalCorrelations(
    result: EnhancedSearchResult,
    analyzedQuery: any
  ) {
    const correlations: Array<{
      modality: string;
      confidence: number;
      evidence: string;
    }> = [];

    const multiModalMeta = result.meta.multiModalFile;
    if (!multiModalMeta) return correlations;

    // Check for text-visual correlations (OCR)
    if (multiModalMeta.contentType === ContentType.RASTER_IMAGE) {
      correlations.push({
        modality: "text-visual",
        confidence: multiModalMeta.quality?.overallScore || 0.5,
        evidence: "OCR text extraction from image",
      });
    }

    // Check for audio-text correlations (speech-to-text)
    if (multiModalMeta.contentType === ContentType.AUDIO) {
      correlations.push({
        modality: "audio-text",
        confidence: multiModalMeta.quality?.overallScore || 0.5,
        evidence: "Speech transcription",
      });
    }

    return correlations;
  }

  private calculateSemanticConsistency(result: EnhancedSearchResult): number {
    // Simplified consistency calculation
    // In production, this would analyze semantic similarity across extracted content from different modalities
    const multiModalMeta = result.meta.multiModalFile;

    if (!multiModalMeta) return 1.0;

    // Use quality score as a proxy for consistency
    return multiModalMeta.quality?.overallScore || 0.5;
  }

  private findInterResultConnection(
    result1: EnhancedSearchResult,
    result2: EnhancedSearchResult
  ): { type: string; strength: number } | null {
    // Extract entities from both results
    const entities1 = this.entityExtractor.extractEntities(result1.text);
    const entities2 = this.entityExtractor.extractEntities(result2.text);

    // Find shared entities
    const sharedEntities = entities1.filter((e1) =>
      entities2.some((e2) => e1.text.toLowerCase() === e2.text.toLowerCase())
    );

    if (sharedEntities.length > 0) {
      return {
        type: "shared_entities",
        strength: Math.min(1, sharedEntities.length / 3), // Cap at 3 shared entities
      };
    }

    // Check for semantic similarity
    const similarity =
      result1.cosineSimilarity && result2.cosineSimilarity
        ? Math.abs(result1.cosineSimilarity - result2.cosineSimilarity)
        : 0;

    if (similarity > 0.7) {
      return {
        type: "semantic_similarity",
        strength: similarity,
      };
    }

    return null;
  }

  private extractKeyConcepts(result: EnhancedSearchResult): string[] {
    const entities = this.entityExtractor.extractEntities(result.text);
    return entities
      .filter((e) => e.type === "concept" || e.type === "term")
      .map((e) => e.text)
      .slice(0, 5); // Top 5 concepts
  }
}
