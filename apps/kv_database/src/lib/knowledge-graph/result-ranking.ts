import { Pool, PoolClient } from "pg";
import { ContentType } from "../types/index.js";
// Removed unused imports
import {
  type SearchResult,
  type EntityReference,
  type RelationshipReference,
} from "./hybrid-search-engine.js";

export interface RankingConfig {
  weights: RankingWeights;
  boosts: RankingBoosts;
  penalties: RankingPenalties;
  normalization: NormalizationConfig;
  diversification: DiversificationConfig;
}

export interface RankingWeights {
  vectorSimilarity: number; // Weight for vector similarity score
  entityRelevance: number; // Weight for entity relevance
  relationshipStrength: number; // Weight for relationship strength
  contentFreshness: number; // Weight for content recency
  contentQuality: number; // Weight for content quality indicators
  userPreference: number; // Weight for user preferences/history
  contextualRelevance: number; // Weight for contextual relevance
  diversityScore: number; // Weight for result diversity
}

export interface RankingBoosts {
  exactEntityMatch: number; // Boost for exact entity name matches
  multipleEntityMatch: number; // Boost for multiple entity matches
  highConfidenceEntity: number; // Boost for high-confidence entities
  strongRelationship: number; // Boost for strong relationships
  recentContent: number; // Boost for recent content
  authoritySource: number; // Boost for authoritative sources
  comprehensiveContent: number; // Boost for comprehensive content
  userInteraction: number; // Boost based on user interaction history
}

export interface RankingPenalties {
  lowConfidenceEntity: number; // Penalty for low-confidence entities
  weakRelationship: number; // Penalty for weak relationships
  outdatedContent: number; // Penalty for outdated content
  duplicateContent: number; // Penalty for duplicate/similar content
  incompleteContent: number; // Penalty for incomplete content
  lowQualitySource: number; // Penalty for low-quality sources
}

export interface NormalizationConfig {
  method: "min-max" | "z-score" | "sigmoid" | "rank";
  scaleRange: [number, number]; // Target range for normalized scores
  outlierHandling: "clip" | "remove" | "transform";
  smoothingFactor: number; // For sigmoid normalization
}

export interface DiversificationConfig {
  enabled: boolean;
  diversityThreshold: number; // Minimum diversity score
  maxSimilarResults: number; // Maximum similar results to include
  diversityMetrics: DiversityMetric[];
  reRankingStrategy: "mmr" | "clustering" | "topic-based";
}

export interface DiversityMetric {
  name: string;
  weight: number;
  type: "content" | "entity" | "source" | "temporal";
  threshold: number;
}

export interface RankingFeatures {
  vectorSimilarity: number;
  entityRelevanceScore: number;
  relationshipStrengthScore: number;
  contentFreshnessScore: number;
  contentQualityScore: number;
  contextualRelevanceScore: number;
  diversityScore: number;
  authorityScore: number;
  userPreferenceScore: number;
  comprehensivenessScore: number;
}

export interface RankingExplanation {
  computedScore: number;
  featureScores: RankingFeatures;
  appliedBoosts: Array<{ name: string; value: number; reason: string }>;
  appliedPenalties: Array<{ name: string; value: number; reason: string }>;
  rankingFactors: Array<{
    factor: string;
    contribution: number;
    explanation: string;
  }>;
  diversityImpact?: {
    originalRank: number;
    diversityAdjustedRank: number;
    diversityScore: number;
  };
}

export interface RankedSearchResult extends SearchResult {
  rankingScore: number;
  rankingFeatures: RankingFeatures;
  rankingExplanation?: RankingExplanation;
  originalRank: number;
  diversityAdjustedRank?: number;
}

/**
 * Advanced result ranking algorithm that considers multiple factors
 * including entity relevance, relationship strength, content quality, and diversity
 */
export class ResultRankingEngine {
  private pool: Pool;
  private config: RankingConfig;

  constructor(pool: Pool, config: Partial<RankingConfig> = {}) {
    this.pool = pool;
    this.config = {
      weights: {
        vectorSimilarity: 0.25,
        entityRelevance: 0.2,
        relationshipStrength: 0.15,
        contentFreshness: 0.1,
        contentQuality: 0.1,
        userPreference: 0.05,
        contextualRelevance: 0.1,
        diversityScore: 0.05,
        ...config.weights,
      },
      boosts: {
        exactEntityMatch: 1.2,
        multipleEntityMatch: 1.15,
        highConfidenceEntity: 1.1,
        strongRelationship: 1.1,
        recentContent: 1.05,
        authoritySource: 1.1,
        comprehensiveContent: 1.05,
        userInteraction: 1.1,
        ...config.boosts,
      },
      penalties: {
        lowConfidenceEntity: 0.9,
        weakRelationship: 0.95,
        outdatedContent: 0.9,
        duplicateContent: 0.8,
        incompleteContent: 0.95,
        lowQualitySource: 0.9,
        ...config.penalties,
      },
      normalization: {
        method: "sigmoid",
        scaleRange: [0, 1],
        outlierHandling: "clip",
        smoothingFactor: 1.0,
        ...config.normalization,
      },
      diversification: {
        enabled: true,
        diversityThreshold: 0.7,
        maxSimilarResults: 3,
        diversityMetrics: [
          {
            name: "content_similarity",
            weight: 0.4,
            type: "content",
            threshold: 0.8,
          },
          {
            name: "entity_overlap",
            weight: 0.3,
            type: "entity",
            threshold: 0.6,
          },
          {
            name: "source_diversity",
            weight: 0.2,
            type: "source",
            threshold: 0.5,
          },
          {
            name: "temporal_diversity",
            weight: 0.1,
            type: "temporal",
            threshold: 0.3,
          },
        ],
        reRankingStrategy: "mmr",
        ...config.diversification,
      },
    };

    this.validateConfig();
  }

  /**
   * Rank search results using multiple ranking factors
   */
  async rankResults(
    results: SearchResult[],
    query: string,
    queryEntities: EntityReference[] = [],
    options: {
      includeExplanation?: boolean;
      userContext?: Record<string, unknown>;
      diversify?: boolean;
    } = {}
  ): Promise<RankedSearchResult[]> {
    if (results.length === 0) return [];

    console.log(`📊 Ranking ${results.length} search results...`);

    try {
      // Phase 1: Calculate ranking features for each result
      const resultsWithFeatures = await this.calculateRankingFeatures(
        results,
        query,
        queryEntities,
        options.userContext
      );

      // Phase 2: Apply ranking algorithm
      const rankedResults = await this.applyRankingAlgorithm(
        resultsWithFeatures,
        query,
        queryEntities,
        options.includeExplanation
      );

      // Phase 3: Apply diversification (if enabled)
      const finalRankedResults =
        options.diversify && this.config.diversification.enabled
          ? await this.applyDiversification(rankedResults, query)
          : rankedResults;

      console.log(
        `✅ Ranking complete: ${finalRankedResults.length} results ranked`
      );

      return finalRankedResults;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ Result ranking failed:", errorMessage);
      throw new Error(`Ranking failed: ${errorMessage}`);
    }
  }

  /**
   * Calculate ranking features for each result
   */
  private async calculateRankingFeatures(
    results: SearchResult[],
    query: string,
    queryEntities: EntityReference[],
    userContext?: Record<string, unknown>
  ): Promise<Array<SearchResult & { features: RankingFeatures }>> {
    const client = await this.pool.connect();

    try {
      const resultsWithFeatures: Array<
        SearchResult & { features: RankingFeatures }
      > = [];

      for (const result of results) {
        const features = await this.calculateFeatures(
          result,
          query,
          queryEntities,
          userContext,
          client
        );

        resultsWithFeatures.push({
          ...result,
          features,
        });
      }

      return resultsWithFeatures;
    } finally {
      client.release();
    }
  }

  /**
   * Calculate individual ranking features for a result
   */
  private async calculateFeatures(
    result: SearchResult,
    query: string,
    queryEntities: EntityReference[],
    userContext: Record<string, unknown> = {},
    client: PoolClient
  ): Promise<RankingFeatures> {
    // 1. Vector similarity (already available)
    const vectorSimilarity = result.similarity;

    // 2. Entity relevance score
    const entityRelevanceScore = this.calculateEntityRelevance(
      result.entities,
      queryEntities
    );

    // 3. Relationship strength score
    const relationshipStrengthScore = this.calculateRelationshipStrength(
      result.relationships
    );

    // 4. Content freshness score
    const contentFreshnessScore = this.calculateContentFreshness(
      result.metadata.processingTime
    );

    // 5. Content quality score
    const contentQualityScore = await this.calculateContentQuality(
      result,
      client
    );

    // 6. Contextual relevance score
    const contextualRelevanceScore = this.calculateContextualRelevance(
      result,
      query,
      queryEntities
    );

    // 7. Diversity score (calculated later during diversification)
    const diversityScore = 1.0; // Placeholder

    // 8. Authority score
    const authorityScore = await this.calculateAuthorityScore(
      result.metadata.sourceFile,
      client
    );

    // 9. User preference score
    const userPreferenceScore = this.calculateUserPreferenceScore(
      result,
      userContext
    );

    // 10. Comprehensiveness score
    const comprehensivenessScore = this.calculateComprehensivenessScore(result);

    return {
      vectorSimilarity,
      entityRelevanceScore,
      relationshipStrengthScore,
      contentFreshnessScore,
      contentQualityScore,
      contextualRelevanceScore,
      diversityScore,
      authorityScore,
      userPreferenceScore,
      comprehensivenessScore,
    };
  }

  /**
   * Calculate entity relevance score
   */
  private calculateEntityRelevance(
    resultEntities: EntityReference[],
    queryEntities: EntityReference[]
  ): number {
    if (queryEntities.length === 0) return 0.5; // Neutral score if no query entities

    let totalRelevance = 0;
    let matchCount = 0;

    for (const queryEntity of queryEntities) {
      // Find exact matches
      const exactMatch = resultEntities.find(
        (re) => re.name.toLowerCase() === queryEntity.name.toLowerCase()
      );

      if (exactMatch) {
        totalRelevance += exactMatch.confidence * 1.0; // Full relevance for exact match
        matchCount++;
        continue;
      }

      // Find alias matches
      const aliasMatch = resultEntities.find((re) =>
        re.aliases.some((alias) =>
          alias.toLowerCase().includes(queryEntity.name.toLowerCase())
        )
      );

      if (aliasMatch) {
        totalRelevance += aliasMatch.confidence * 0.8; // Reduced relevance for alias match
        matchCount++;
        continue;
      }

      // Find type matches (same entity type)
      const typeMatches = resultEntities.filter(
        (re) => re.type === queryEntity.type
      );
      if (typeMatches.length > 0) {
        const avgConfidence =
          typeMatches.reduce((sum, re) => sum + re.confidence, 0) /
          typeMatches.length;
        totalRelevance += avgConfidence * 0.3; // Low relevance for type match
        matchCount++;
      }
    }

    return matchCount > 0 ? totalRelevance / queryEntities.length : 0;
  }

  /**
   * Calculate relationship strength score
   */
  private calculateRelationshipStrength(
    relationships: RelationshipReference[]
  ): number {
    if (relationships.length === 0) return 0;

    const totalStrength = relationships.reduce(
      (sum, rel) => sum + rel.strength * rel.confidence,
      0
    );

    return totalStrength / relationships.length;
  }

  /**
   * Calculate content freshness score
   */
  private calculateContentFreshness(processingTime: Date): number {
    const now = new Date();
    const ageInDays =
      (now.getTime() - processingTime.getTime()) / (1000 * 60 * 60 * 24);

    // Exponential decay: newer content gets higher scores
    return Math.exp(-ageInDays / 365); // Half-life of 1 year
  }

  /**
   * Calculate content quality score
   */
  private async calculateContentQuality(
    result: SearchResult,
    _client: PoolClient
  ): Promise<number> {
    let qualityScore = 0.5; // Base score

    // Length-based quality (optimal length gets higher score)
    const textLength = result.text.length;
    if (textLength >= 100 && textLength <= 2000) {
      qualityScore += 0.2; // Good length
    } else if (textLength < 50) {
      qualityScore -= 0.2; // Too short
    } else if (textLength > 5000) {
      qualityScore -= 0.1; // Too long
    }

    // Entity density (more entities might indicate richer content)
    const entityDensity =
      result.entities.length / Math.max(textLength / 100, 1);
    qualityScore += Math.min(entityDensity * 0.1, 0.2);

    // Relationship density
    const relationshipDensity =
      result.relationships.length / Math.max(result.entities.length, 1);
    qualityScore += Math.min(relationshipDensity * 0.1, 0.1);

    // Content type bonus
    const contentTypeBonus = this.getContentTypeQualityBonus(
      result.metadata.contentType
    );
    qualityScore += contentTypeBonus;

    return Math.min(Math.max(qualityScore, 0), 1);
  }

  /**
   * Get quality bonus based on content type
   */
  private getContentTypeQualityBonus(contentType: ContentType): number {
    const bonuses: Record<ContentType, number> = {
      [ContentType.MARKDOWN]: 0.1,
      [ContentType.PDF]: 0.05,
      [ContentType.HTML]: 0.05,
      [ContentType.PLAIN_TEXT]: 0.0,
      [ContentType.RICH_TEXT]: 0.05,
      [ContentType.OFFICE_DOC]: 0.05,
      [ContentType.OFFICE_SHEET]: 0.0,
      [ContentType.OFFICE_PRESENTATION]: 0.05,
      [ContentType.CSV]: -0.05,
      [ContentType.JSON]: 0.0,
      [ContentType.XML]: 0.0,
      [ContentType.RASTER_IMAGE]: -0.1,
      [ContentType.VECTOR_IMAGE]: -0.1,
      [ContentType.DOCUMENT_IMAGE]: -0.05,
      [ContentType.VIDEO]: 0.05,
      [ContentType.AUDIO]: 0.0,
      [ContentType.BINARY]: -0.2,
      [ContentType.UNKNOWN]: -0.1,
    };

    return bonuses[contentType] || 0;
  }

  /**
   * Calculate contextual relevance score
   */
  private calculateContextualRelevance(
    result: SearchResult,
    query: string,
    _queryEntities: EntityReference[]
  ): number {
    let relevanceScore = 0;

    // Query term frequency in content
    const queryTerms = query.toLowerCase().split(/\s+/);
    const contentLower = result.text.toLowerCase();

    let termMatches = 0;
    for (const term of queryTerms) {
      if (contentLower.includes(term)) {
        termMatches++;
      }
    }

    relevanceScore += (termMatches / queryTerms.length) * 0.5;

    // Entity context relevance
    for (const entity of result.entities) {
      const entityContext = contentLower.substring(
        Math.max(0, contentLower.indexOf(entity.name.toLowerCase()) - 100),
        Math.min(
          contentLower.length,
          contentLower.indexOf(entity.name.toLowerCase()) +
            entity.name.length +
            100
        )
      );

      // Check if query terms appear near entities
      let contextMatches = 0;
      for (const term of queryTerms) {
        if (entityContext.includes(term)) {
          contextMatches++;
        }
      }

      relevanceScore += (contextMatches / queryTerms.length) * 0.1;
    }

    return Math.min(relevanceScore, 1);
  }

  /**
   * Calculate authority score based on source
   */
  private async calculateAuthorityScore(
    sourceFile: string,
    _client: PoolClient
  ): Promise<number> {
    // This would typically involve checking source reputation, citation count, etc.
    // For now, we'll use simple heuristics based on file type and name

    let authorityScore = 0.5; // Base score

    // File type authority
    if (sourceFile.endsWith(".pdf")) {
      authorityScore += 0.1; // PDFs often more authoritative
    } else if (sourceFile.endsWith(".md")) {
      authorityScore += 0.05; // Markdown documentation
    }

    // File name indicators
    const fileName = sourceFile.toLowerCase();
    if (fileName.includes("official") || fileName.includes("documentation")) {
      authorityScore += 0.2;
    } else if (fileName.includes("draft") || fileName.includes("temp")) {
      authorityScore -= 0.1;
    }

    return Math.min(Math.max(authorityScore, 0), 1);
  }

  /**
   * Calculate user preference score
   */
  private calculateUserPreferenceScore(
    result: SearchResult,
    userContext: Record<string, unknown>
  ): number {
    if (!userContext || Object.keys(userContext).length === 0) {
      return 0.5; // Neutral score if no user context
    }

    let preferenceScore = 0.5;

    // Preferred content types
    if (
      userContext.preferredContentTypes?.includes(result.metadata.contentType)
    ) {
      preferenceScore += 0.2;
    }

    // Preferred sources
    if (
      userContext.preferredSources?.some((source: string) =>
        result.metadata.sourceFile.includes(source)
      )
    ) {
      preferenceScore += 0.2;
    }

    // Recently accessed content
    if (userContext.recentlyAccessed?.includes(result.id)) {
      preferenceScore += 0.1;
    }

    return Math.min(Math.max(preferenceScore, 0), 1);
  }

  /**
   * Calculate comprehensiveness score
   */
  private calculateComprehensivenessScore(result: SearchResult): number {
    let comprehensivenessScore = 0;

    // Text length (longer content might be more comprehensive)
    const textLength = result.text.length;
    if (textLength > 500) {
      comprehensivenessScore += 0.3;
    } else if (textLength > 200) {
      comprehensivenessScore += 0.2;
    } else {
      comprehensivenessScore += 0.1;
    }

    // Entity coverage (more entities might indicate comprehensive coverage)
    const entityCount = result.entities.length;
    comprehensivenessScore += Math.min(entityCount * 0.1, 0.4);

    // Relationship coverage
    const relationshipCount = result.relationships.length;
    comprehensivenessScore += Math.min(relationshipCount * 0.05, 0.3);

    return Math.min(comprehensivenessScore, 1);
  }

  /**
   * Apply ranking algorithm to calculate final scores
   */
  private async applyRankingAlgorithm(
    resultsWithFeatures: Array<SearchResult & { features: RankingFeatures }>,
    query: string,
    queryEntities: EntityReference[],
    includeExplanation: boolean = false
  ): Promise<RankedSearchResult[]> {
    const rankedResults: RankedSearchResult[] = [];

    for (let i = 0; i < resultsWithFeatures.length; i++) {
      const result = resultsWithFeatures[i];
      const features = result.features;

      // Calculate weighted score
      let computedScore = 0;
      computedScore +=
        features.vectorSimilarity * this.config.weights.vectorSimilarity;
      computedScore +=
        features.entityRelevanceScore * this.config.weights.entityRelevance;
      computedScore +=
        features.relationshipStrengthScore *
        this.config.weights.relationshipStrength;
      computedScore +=
        features.contentFreshnessScore * this.config.weights.contentFreshness;
      computedScore +=
        features.contentQualityScore * this.config.weights.contentQuality;
      computedScore +=
        features.userPreferenceScore * this.config.weights.userPreference;
      computedScore +=
        features.contextualRelevanceScore *
        this.config.weights.contextualRelevance;
      computedScore +=
        features.diversityScore * this.config.weights.diversityScore;

      // Apply boosts and penalties
      const { boostedScore, appliedBoosts, appliedPenalties } =
        this.applyBoostsAndPenalties(computedScore, result, queryEntities);

      // Normalize score
      const normalizedScore = this.normalizeScore(boostedScore);

      // Create ranking explanation if requested
      let rankingExplanation: RankingExplanation | undefined;
      if (includeExplanation) {
        rankingExplanation = this.createRankingExplanation(
          normalizedScore,
          features,
          appliedBoosts,
          appliedPenalties
        );
      }

      rankedResults.push({
        ...result,
        rankingScore: normalizedScore,
        rankingFeatures: features,
        rankingExplanation,
        originalRank: i,
      });
    }

    // Sort by ranking score
    return rankedResults.sort((a, b) => b.rankingScore - a.rankingScore);
  }

  /**
   * Apply boosts and penalties to the base score
   */
  private applyBoostsAndPenalties(
    baseScore: number,
    result: SearchResult,
    queryEntities: EntityReference[]
  ): {
    boostedScore: number;
    appliedBoosts: Array<{ name: string; value: number; reason: string }>;
    appliedPenalties: Array<{ name: string; value: number; reason: string }>;
  } {
    let score = baseScore;
    const appliedBoosts: Array<{
      name: string;
      value: number;
      reason: string;
    }> = [];
    const appliedPenalties: Array<{
      name: string;
      value: number;
      reason: string;
    }> = [];

    // Apply boosts
    const exactMatches = result.entities.filter((entity) =>
      queryEntities.some(
        (qe) => qe.name.toLowerCase() === entity.name.toLowerCase()
      )
    );

    if (exactMatches.length > 0) {
      const boost = this.config.boosts.exactEntityMatch;
      score *= boost;
      appliedBoosts.push({
        name: "exactEntityMatch",
        value: boost,
        reason: `Found ${exactMatches.length} exact entity matches`,
      });
    }

    if (result.entities.length > 3) {
      const boost = this.config.boosts.multipleEntityMatch;
      score *= boost;
      appliedBoosts.push({
        name: "multipleEntityMatch",
        value: boost,
        reason: `Content contains ${result.entities.length} entities`,
      });
    }

    // Apply penalties
    const lowConfidenceEntities = result.entities.filter(
      (e) => e.confidence < 0.5
    );
    if (lowConfidenceEntities.length > 0) {
      const penalty = this.config.penalties.lowConfidenceEntity;
      score *= penalty;
      appliedPenalties.push({
        name: "lowConfidenceEntity",
        value: penalty,
        reason: `Found ${lowConfidenceEntities.length} low-confidence entities`,
      });
    }

    return { boostedScore: score, appliedBoosts, appliedPenalties };
  }

  /**
   * Normalize score using configured method
   */
  private normalizeScore(score: number): number {
    switch (this.config.normalization.method) {
      case "sigmoid":
        return (
          1 / (1 + Math.exp(-score * this.config.normalization.smoothingFactor))
        );
      case "min-max":
        // Would need min/max values from all scores
        return Math.min(
          Math.max(score, this.config.normalization.scaleRange[0]),
          this.config.normalization.scaleRange[1]
        );
      default:
        return Math.min(Math.max(score, 0), 1);
    }
  }

  /**
   * Create ranking explanation
   */
  private createRankingExplanation(
    computedScore: number,
    features: RankingFeatures,
    appliedBoosts: Array<{ name: string; value: number; reason: string }>,
    appliedPenalties: Array<{ name: string; value: number; reason: string }>
  ): RankingExplanation {
    const rankingFactors = [
      {
        factor: "Vector Similarity",
        contribution:
          features.vectorSimilarity * this.config.weights.vectorSimilarity,
        explanation: `Semantic similarity to query: ${features.vectorSimilarity.toFixed(
          3
        )}`,
      },
      {
        factor: "Entity Relevance",
        contribution:
          features.entityRelevanceScore * this.config.weights.entityRelevance,
        explanation: `Entity matching score: ${features.entityRelevanceScore.toFixed(
          3
        )}`,
      },
      {
        factor: "Relationship Strength",
        contribution:
          features.relationshipStrengthScore *
          this.config.weights.relationshipStrength,
        explanation: `Average relationship strength: ${features.relationshipStrengthScore.toFixed(
          3
        )}`,
      },
      {
        factor: "Content Quality",
        contribution:
          features.contentQualityScore * this.config.weights.contentQuality,
        explanation: `Content quality indicators: ${features.contentQualityScore.toFixed(
          3
        )}`,
      },
    ];

    return {
      computedScore,
      featureScores: features,
      appliedBoosts,
      appliedPenalties,
      rankingFactors,
    };
  }

  /**
   * Apply diversification to avoid similar results
   */
  private async applyDiversification(
    rankedResults: RankedSearchResult[],
    _query: string
  ): Promise<RankedSearchResult[]> {
    if (!this.config.diversification.enabled || rankedResults.length <= 1) {
      return rankedResults;
    }

    console.log("🎯 Applying result diversification...");

    switch (this.config.diversification.reRankingStrategy) {
      case "mmr":
        return this.applyMMRDiversification(rankedResults);
      case "clustering":
        return this.applyClusteringDiversification(rankedResults);
      case "topic-based":
        return this.applyTopicBasedDiversification(rankedResults);
      default:
        return rankedResults;
    }
  }

  /**
   * Apply Maximal Marginal Relevance (MMR) diversification
   */
  private applyMMRDiversification(
    rankedResults: RankedSearchResult[]
  ): RankedSearchResult[] {
    const lambda = 0.7; // Balance between relevance and diversity
    const diversifiedResults: RankedSearchResult[] = [];
    const remaining = [...rankedResults];

    // Always include the top result
    if (remaining.length > 0) {
      const topResult = remaining.shift()!;
      topResult.diversityAdjustedRank = 0;
      diversifiedResults.push(topResult);
    }

    // Select remaining results using MMR
    while (
      remaining.length > 0 &&
      diversifiedResults.length < rankedResults.length
    ) {
      let bestResult: RankedSearchResult | null = null;
      let bestMMRScore = -Infinity;
      let bestIndex = -1;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];

        // Calculate maximum similarity to already selected results
        let maxSimilarity = 0;
        for (const selected of diversifiedResults) {
          const similarity = this.calculateResultSimilarity(
            candidate,
            selected
          );
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }

        // Calculate MMR score
        const mmrScore =
          lambda * candidate.rankingScore - (1 - lambda) * maxSimilarity;

        if (mmrScore > bestMMRScore) {
          bestMMRScore = mmrScore;
          bestResult = candidate;
          bestIndex = i;
        }
      }

      if (bestResult) {
        bestResult.diversityAdjustedRank = diversifiedResults.length;
        diversifiedResults.push(bestResult);
        remaining.splice(bestIndex, 1);
      } else {
        break;
      }
    }

    return diversifiedResults;
  }

  /**
   * Calculate similarity between two results for diversification
   */
  private calculateResultSimilarity(
    result1: RankedSearchResult,
    result2: RankedSearchResult
  ): number {
    let similarity = 0;
    let factors = 0;

    // Content similarity (simple Jaccard similarity on words)
    const words1 = new Set(result1.text.toLowerCase().split(/\s+/));
    const words2 = new Set(result2.text.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    if (union.size > 0) {
      similarity += (intersection.size / union.size) * 0.4;
      factors += 0.4;
    }

    // Entity overlap
    const entities1 = new Set(
      result1.entities.map((e) => e.name.toLowerCase())
    );
    const entities2 = new Set(
      result2.entities.map((e) => e.name.toLowerCase())
    );
    const entityIntersection = new Set(
      [...entities1].filter((x) => entities2.has(x))
    );
    const entityUnion = new Set([...entities1, ...entities2]);

    if (entityUnion.size > 0) {
      similarity += (entityIntersection.size / entityUnion.size) * 0.3;
      factors += 0.3;
    }

    // Source similarity
    if (result1.metadata.sourceFile === result2.metadata.sourceFile) {
      similarity += 0.2;
      factors += 0.2;
    }

    // Content type similarity
    if (result1.metadata.contentType === result2.metadata.contentType) {
      similarity += 0.1;
      factors += 0.1;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Placeholder methods for other diversification strategies
   */
  private applyClusteringDiversification(
    rankedResults: RankedSearchResult[]
  ): RankedSearchResult[] {
    // Implementation would cluster results and select representatives
    return rankedResults;
  }

  private applyTopicBasedDiversification(
    rankedResults: RankedSearchResult[]
  ): RankedSearchResult[] {
    // Implementation would identify topics and ensure topic diversity
    return rankedResults;
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    const totalWeight = Object.values(this.config.weights).reduce(
      (sum, weight) => sum + weight,
      0
    );
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      console.warn(
        `⚠️ Ranking weights sum to ${totalWeight.toFixed(3)}, should sum to 1.0`
      );
    }

    if (
      this.config.diversification.diversityThreshold < 0 ||
      this.config.diversification.diversityThreshold > 1
    ) {
      throw new Error("Diversity threshold must be between 0 and 1");
    }
  }

  /**
   * Update ranking configuration
   */
  updateConfig(newConfig: Partial<RankingConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      weights: { ...this.config.weights, ...newConfig.weights },
      boosts: { ...this.config.boosts, ...newConfig.boosts },
      penalties: { ...this.config.penalties, ...newConfig.penalties },
    };
    this.validateConfig();
    console.log("⚙️ Updated result ranking configuration");
  }

  /**
   * Get current configuration
   */
  getConfig(): RankingConfig {
    return JSON.parse(JSON.stringify(this.config));
  }
}
