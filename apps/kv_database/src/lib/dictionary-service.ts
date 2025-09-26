/**
 * Dictionary Service for Lexical Data Integration
 *
 * Provides entity canonicalization, synonym expansion, and semantic relationship detection
 * using WordNet, Wiktionary, OpenThesaurus, and FreeDict data sources.
 *
 * Author: @darianrosebrook
 * Date: 2025-01-25
 */

import { ObsidianDatabase } from "./database";
import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DictionarySource {
  name: DictionarySourceType;
  version: string;
  language: string;
  status: DictionarySourceStatus;
  capabilities: DictionaryCapability[];
  entryCount: number;
  lastSync?: Date;
}

export interface DictionaryLookupRequest {
  terms: string[];
  sources?: DictionarySourceType[];
  context?: string;
  includeRelationships?: boolean;
  maxSynonyms?: number;
  language?: string;
}

export interface DictionaryLookupResult {
  term: string;
  canonicalForm: string;
  confidence: number;
  sources: SourceResult[];
  disambiguationContext?: string;
  alternatives?: AlternativeResult[];
}

export interface SourceResult {
  source: DictionarySourceType;
  synsetId?: string;
  definition: string;
  partOfSpeech?: PartOfSpeech;
  synonyms: string[];
  antonyms?: string[];
  relationships?: SemanticRelationship[];
  examples?: string[];
  etymology?: string;
  pronunciation?: string;
}

export interface AlternativeResult {
  canonicalForm: string;
  confidence: number;
  context: string;
}

export interface SemanticRelationship {
  type: RelationshipType;
  target: string;
  confidence: number;
  sourceSynset?: string;
  targetSynset?: string;
}

export interface EntityCanonicalizationRequest {
  entities: EntityToCanonicalize[];
}

export interface EntityToCanonicalize {
  name: string;
  type: EntityType;
  context?: string;
  aliases?: string[];
}

export interface EntityCanonicalizationResult {
  originalName: string;
  canonicalName: string;
  confidence: number;
  source: DictionarySourceType;
  reasoning: string;
}

export interface SearchExpansionRequest {
  queryTerms: string[];
  expansionTypes?: ExpansionType[];
  maxExpansionsPerTerm?: number;
}

export interface SearchExpansionResult {
  originalTerm: string;
  expandedTerms: ExpandedTerm[];
}

export interface ExpandedTerm {
  term: string;
  expansionType: ExpansionType;
  relevanceScore: number;
  source: DictionarySourceType;
}

export interface DictionarySourceInfo {
  name: DictionarySourceType;
  version: string;
  language: string;
  status: DictionarySourceStatus;
  capabilities: DictionaryCapability[];
  lastUpdated?: Date;
  entryCount: number;
}

export interface DictionaryServiceHealth {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: Date;
  services: Record<
    DictionarySourceType,
    {
      status: "up" | "down" | "degraded";
      responseTimeMs?: number;
      lastCheck: Date;
    }
  >;
}

// ============================================================================
// ENUM DEFINITIONS
// ============================================================================

export type DictionarySourceType =
  | "wordnet"
  | "wiktionary"
  | "openthesaurus"
  | "freedict"
  | "custom";

export type DictionarySourceStatus =
  | "available"
  | "updating"
  | "unavailable"
  | "deprecated";

export type DictionaryCapability =
  | "definitions"
  | "synonyms"
  | "relationships"
  | "etymology"
  | "pronunciation";

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "preposition"
  | "conjunction"
  | "interjection"
  | "other";

export type RelationshipType =
  | "hypernym"
  | "hyponym"
  | "meronym"
  | "holonym"
  | "synonym"
  | "antonym"
  | "similar_to"
  | "also"
  | "entails"
  | "causes"
  | "derived_from"
  | "related_to";

export type EntityType =
  | "PERSON"
  | "ORGANIZATION"
  | "LOCATION"
  | "CONCEPT"
  | "TECHNOLOGY"
  | "PRODUCT"
  | "EVENT"
  | "DATE"
  | "MONEY"
  | "OTHER";

export type ExpansionType =
  | "synonyms"
  | "hypernyms"
  | "hyponyms"
  | "related_terms"
  | "similar_terms";

// ============================================================================
// MAIN DICTIONARY SERVICE CLASS
// ============================================================================

/**
 * Dictionary Service for lexical data integration
 *
 * Provides comprehensive dictionary functionality including:
 * - Entity canonicalization and disambiguation
 * - Synonym expansion for search enhancement
 * - Semantic relationship detection
 * - Multi-source dictionary integration
 * - Caching and performance optimization
 */
export class DictionaryService {
  private db: ObsidianDatabase;
  private cache: Map<string, DictionaryLookupResult> = new Map();
  private cacheTTL: number = 3600 * 1000; // 1 hour default
  private maxCacheSize: number = 10000;

  constructor(database: ObsidianDatabase) {
    this.db = database;
    this.initializeService();
  }

  /**
   * Initialize the dictionary service
   * Load configuration, set up caching, initialize data sources
   */
  private async initializeService(): Promise<void> {
    console.log("🚀 Initializing Dictionary Service...");

    // Load configuration
    await this.loadConfiguration();

    // Initialize cache settings
    await this.initializeCache();

    // Set up dictionary sources
    await this.initializeDictionarySources();

    console.log("✅ Dictionary Service initialized successfully");
  }

  /**
   * Load service configuration from database
   */
  private async loadConfiguration(): Promise<void> {
    try {
      // Load configuration from dictionary_config table
      const configResult = await this.db.query(`
        SELECT key, value
        FROM dictionary_config
        WHERE key IN ('cache_ttl_seconds', 'max_synonyms_per_entity', 'min_confidence_threshold')
      `);

      // Apply configuration
      for (const row of configResult.rows) {
        switch (row.key) {
          case "cache_ttl_seconds":
            this.cacheTTL = parseInt(row.value) * 1000;
            break;
          case "max_synonyms_per_entity":
            // Store for use in entity processing
            break;
          case "min_confidence_threshold":
            // Store for use in quality filtering
            break;
        }
      }

      console.log(
        `📊 Dictionary service configured with TTL: ${this.cacheTTL}ms`
      );
    } catch (error) {
      console.warn(`⚠️ Failed to load dictionary configuration: ${error}`);
      // Use defaults
    }
  }

  /**
   * Initialize caching system
   */
  private async initializeCache(): Promise<void> {
    // Set up cache cleanup interval
    setInterval(() => {
      this.cleanupCache();
    }, this.cacheTTL / 2); // Clean up every 30 minutes
  }

  /**
   * Initialize available dictionary sources
   */
  private async initializeDictionarySources(): Promise<void> {
    try {
      // Check existing sources
      const sourcesResult = await this.db.query(`
        SELECT name, version, language, status, capabilities, entry_count
        FROM dictionary_sources
        WHERE status = 'available'
      `);

      console.log(
        `📚 Found ${sourcesResult.rows.length} available dictionary sources`
      );
    } catch (error) {
      console.warn(`⚠️ Failed to load dictionary sources: ${error}`);
    }
  }

  // ============================================================================
  // CORE LOOKUP FUNCTIONALITY
  // ============================================================================

  /**
   * Look up dictionary information for terms
   */
  async lookupTerms(
    request: DictionaryLookupRequest
  ): Promise<DictionaryLookupResult[]> {
    const {
      terms,
      sources,
      context,
      includeRelationships = false,
      maxSynonyms = 10,
      language = "en",
    } = request;

    console.log(`🔍 Looking up ${terms.length} terms in dictionary sources`);

    const results: DictionaryLookupResult[] = [];

    for (const term of terms) {
      const cacheKey = this.generateCacheKey(term, sources, language);

      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        console.log(`💾 Cache hit for term: ${term}`);
        results.push(cachedResult);
        continue;
      }

      // Perform lookup
      const result = await this.performLookup(
        term,
        sources,
        context,
        includeRelationships,
        maxSynonyms,
        language
      );

      // Cache result
      this.cache.set(cacheKey, result);
      this.enforceCacheSizeLimit();

      results.push(result);
    }

    return results;
  }

  /**
   * Perform actual dictionary lookup for a single term
   */
  private async performLookup(
    term: string,
    sources?: DictionarySourceType[],
    context?: string,
    includeRelationships: boolean = false,
    maxSynonyms: number = 10,
    language: string = "en"
  ): Promise<DictionaryLookupResult> {
    // Determine sources to query
    const sourcesToQuery = sources || (await this.getAvailableSources());

    console.log(
      `🔍 Performing lookup for: "${term}" using sources: ${sourcesToQuery.join(
        ", "
      )}`
    );

    const sourceResults: SourceResult[] = [];
    let canonicalForm = term;
    let maxConfidence = 0;

    // Query each source
    for (const source of sourcesToQuery) {
      try {
        const sourceResult = await this.querySource(
          term,
          source,
          includeRelationships,
          maxSynonyms,
          language
        );

        if (sourceResult) {
          sourceResults.push(sourceResult);

          // Update canonical form based on confidence
          if (
            sourceResult.synonyms.length > 0 &&
            !sourceResults.some((r) => r.source === source)
          ) {
            // Use context to determine best canonical form
            if (context && this.matchesContext(term, context, source)) {
              canonicalForm = this.determineCanonicalForm(term, sourceResult);
              maxConfidence = Math.max(
                maxConfidence,
                sourceResult.synonyms.length / 10
              ); // Simple confidence calculation
            }
          }
        }
      } catch (error) {
        console.warn(
          `⚠️ Failed to query source ${source} for term "${term}": ${error}`
        );
      }
    }

    // Determine disambiguation context if needed
    const disambiguationContext =
      context || this.generateDisambiguationContext(term, sourceResults);

    return {
      term,
      canonicalForm,
      confidence: Math.min(maxConfidence, 1.0),
      sources: sourceResults,
      disambiguationContext,
    };
  }

  /**
   * Query a specific dictionary source
   */
  private async querySource(
    term: string,
    source: DictionarySourceType,
    includeRelationships: boolean,
    maxSynonyms: number,
    language: string
  ): Promise<SourceResult | null> {
    try {
      // Query database for cached results first
      const cachedResult = await this.db.query(
        `
        SELECT
          s.synset_id, s.definition, s.part_of_speech,
          ARRAY_AGG(DISTINCT le.word_form) FILTER (WHERE le.word_form != $1) as synonyms,
          ARRAY_AGG(DISTINCT lr.target_synset_id) as related_synsets
        FROM synsets s
        JOIN lexical_entries le ON s.id = le.synset_id
        LEFT JOIN lexical_relationships lr ON s.id = lr.source_synset_id
        WHERE le.word_form ILIKE $1
        AND s.source_id = (SELECT id FROM dictionary_sources WHERE name = $2 AND language = $3)
        GROUP BY s.id, s.synset_id, s.definition, s.part_of_speech
        LIMIT 1
      `,
        [term, source, language]
      );

      if (cachedResult.rows.length === 0) {
        return null;
      }

      const row = cachedResult.rows[0];

      return {
        source,
        synsetId: row.synset_id,
        definition: row.definition,
        partOfSpeech: row.part_of_speech,
        synonyms: row.synonyms?.slice(0, maxSynonyms) || [],
        relationships: includeRelationships
          ? await this.getRelationships(row.id)
          : [],
      };
    } catch (error) {
      console.warn(`⚠️ Database query failed for source ${source}: ${error}`);
      return null;
    }
  }

  /**
   * Get semantic relationships for a synset
   */
  private async getRelationships(
    synsetId: string
  ): Promise<SemanticRelationship[]> {
    try {
      const result = await this.db.query(
        `
        SELECT
          lr.relationship_type,
          s2.lemma as target,
          lr.confidence
        FROM lexical_relationships lr
        JOIN synsets s2 ON lr.target_synset_id = s2.id
        WHERE lr.source_synset_id = $1
        AND lr.confidence >= 0.5
        LIMIT 10
      `,
        [synsetId]
      );

      return result.rows.map((row) => ({
        type: row.relationship_type,
        target: row.target,
        confidence: parseFloat(row.confidence),
      }));
    } catch (error) {
      console.warn(`⚠️ Failed to get relationships: ${error}`);
      return [];
    }
  }

  // ============================================================================
  // ENTITY CANONICALIZATION
  // ============================================================================

  /**
   * Canonicalize entity names using dictionary data
   */
  async canonicalizeEntities(
    request: EntityCanonicalizationRequest
  ): Promise<EntityCanonicalizationResult[]> {
    console.log(`🔄 Canonicalizing ${request.entities.length} entities`);

    const results: EntityCanonicalizationResult[] = [];

    for (const entity of request.entities) {
      const result = await this.canonicalizeEntity(entity);
      results.push(result);
    }

    return results;
  }

  /**
   * Canonicalize a single entity
   */
  private async canonicalizeEntity(
    entity: EntityToCanonicalize
  ): Promise<EntityCanonicalizationResult> {
    const { name, type, context, aliases = [] } = entity;

    console.log(`🔄 Canonicalizing entity: "${name}" (${type})`);

    // Try exact matches first
    const exactMatch = await this.findExactMatch(name, type, context);
    if (exactMatch) {
      return exactMatch;
    }

    // Try fuzzy matching with context
    const fuzzyMatch = await this.findFuzzyMatch(name, aliases, type, context);
    if (fuzzyMatch) {
      return fuzzyMatch;
    }

    // Fallback to original name with low confidence
    return {
      originalName: name,
      canonicalName: name,
      confidence: 0.1,
      source: "wordnet",
      reasoning: "No dictionary matches found, using original name",
    };
  }

  /**
   * Find exact match in dictionary
   */
  private async findExactMatch(
    name: string,
    type: EntityType,
    context?: string
  ): Promise<EntityCanonicalizationResult | null> {
    try {
      const result = await this.db.query(
        `
        SELECT
          s.lemma as canonical_name,
          s.confidence,
          ds.name as source,
          s.definition
        FROM synsets s
        JOIN dictionary_sources ds ON s.source_id = ds.id
        WHERE s.lemma = $1
        AND ds.status = 'available'
        ORDER BY s.confidence DESC
        LIMIT 1
      `,
        [name]
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          originalName: name,
          canonicalName: row.canonical_name,
          confidence: parseFloat(row.confidence),
          source: row.source,
          reasoning: `Exact match found in ${row.source}: ${row.definition}`,
        };
      }
    } catch (error) {
      console.warn(`⚠️ Exact match query failed: ${error}`);
    }

    return null;
  }

  /**
   * Find fuzzy match with context consideration
   */
  private async findFuzzyMatch(
    name: string,
    aliases: string[],
    type: EntityType,
    context?: string
  ): Promise<EntityCanonicalizationResult | null> {
    const searchTerms = [name, ...aliases];

    try {
      const result = await this.db.query(
        `
        SELECT
          s.lemma as canonical_name,
          s.confidence,
          ds.name as source,
          s.definition,
          similarity(s.lemma, $1) as similarity_score
        FROM synsets s
        JOIN dictionary_sources ds ON s.source_id = ds.id
        WHERE ds.status = 'available'
        AND (s.lemma ILIKE '%' || $1 || '%' OR $1 ILIKE '%' || s.lemma || '%')
        ORDER BY
          similarity_score DESC,
          s.confidence DESC
        LIMIT 5
      `,
        [name]
      );

      if (result.rows.length > 0) {
        const bestMatch = result.rows[0];
        return {
          originalName: name,
          canonicalName: bestMatch.canonical_name,
          confidence: Math.min(
            parseFloat(bestMatch.similarity_score) *
              parseFloat(bestMatch.confidence),
            1.0
          ),
          source: bestMatch.source,
          reasoning: `Fuzzy match found in ${
            bestMatch.source
          } with similarity ${parseFloat(bestMatch.similarity_score).toFixed(
            2
          )}`,
        };
      }
    } catch (error) {
      console.warn(`⚠️ Fuzzy match query failed: ${error}`);
    }

    return null;
  }

  // ============================================================================
  // SEARCH EXPANSION
  // ============================================================================

  /**
   * Expand search terms with synonyms and related terms
   */
  async expandSearchTerms(
    request: SearchExpansionRequest
  ): Promise<SearchExpansionResult[]> {
    const {
      queryTerms,
      expansionTypes = ["synonyms", "hypernyms"],
      maxExpansionsPerTerm = 5,
    } = request;

    console.log(
      `🔍 Expanding ${
        queryTerms.length
      } search terms with types: ${expansionTypes.join(", ")}`
    );

    const results: SearchExpansionResult[] = [];

    for (const term of queryTerms) {
      const expansions = await this.getTermExpansions(
        term,
        expansionTypes,
        maxExpansionsPerTerm
      );
      results.push({
        originalTerm: term,
        expandedTerms: expansions,
      });
    }

    return results;
  }

  /**
   * Get expansions for a single term
   */
  private async getTermExpansions(
    term: string,
    expansionTypes: ExpansionType[],
    maxExpansions: number
  ): Promise<ExpandedTerm[]> {
    const expansions: ExpandedTerm[] = [];

    try {
      // Get synonyms
      if (expansionTypes.includes("synonyms")) {
        const synonyms = await this.getSynonyms(term, maxExpansions);
        expansions.push(...synonyms);
      }

      // Get hypernyms (broader terms)
      if (expansionTypes.includes("hypernyms")) {
        const hypernyms = await this.getHypernyms(term, maxExpansions);
        expansions.push(...hypernyms);
      }

      // Get hyponyms (narrower terms)
      if (expansionTypes.includes("hyponyms")) {
        const hyponyms = await this.getHyponyms(term, maxExpansions);
        expansions.push(...hyponyms);
      }

      // Get related terms
      if (expansionTypes.includes("related_terms")) {
        const related = await this.getRelatedTerms(term, maxExpansions);
        expansions.push(...related);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to get expansions for term "${term}": ${error}`);
    }

    return expansions.slice(0, maxExpansions);
  }

  /**
   * Get synonyms for a term
   */
  private async getSynonyms(
    term: string,
    limit: number
  ): Promise<ExpandedTerm[]> {
    try {
      const result = await this.db.query(
        `
        SELECT DISTINCT
          le.word_form as synonym,
          s.confidence
        FROM lexical_entries le
        JOIN synsets s ON le.synset_id = s.id
        WHERE le.word_form != $1
        AND s.source_id IN (SELECT id FROM dictionary_sources WHERE name IN ('wordnet', 'openthesaurus') AND status = 'available')
        ORDER BY s.confidence DESC
        LIMIT $2
      `,
        [term, limit]
      );

      return result.rows.map((row) => ({
        term: row.synonym,
        expansionType: "synonyms",
        relevanceScore: parseFloat(row.confidence),
        source: "wordnet",
      }));
    } catch (error) {
      console.warn(`⚠️ Failed to get synonyms: ${error}`);
      return [];
    }
  }

  /**
   * Get hypernyms (broader terms) for a term
   */
  private async getHypernyms(
    term: string,
    limit: number
  ): Promise<ExpandedTerm[]> {
    try {
      const result = await this.db.query(
        `
        SELECT DISTINCT
          s2.lemma as hypernym,
          lr.confidence
        FROM lexical_relationships lr
        JOIN synsets s1 ON lr.source_synset_id = s1.id
        JOIN synsets s2 ON lr.target_synset_id = s2.id
        JOIN lexical_entries le ON s1.id = le.synset_id
        WHERE le.word_form = $1
        AND lr.relationship_type = 'hypernym'
        AND lr.confidence >= 0.5
        ORDER BY lr.confidence DESC
        LIMIT $2
      `,
        [term, limit]
      );

      return result.rows.map((row) => ({
        term: row.hypernym,
        expansionType: "hypernyms",
        relevanceScore: parseFloat(row.confidence),
        source: "wordnet",
      }));
    } catch (error) {
      console.warn(`⚠️ Failed to get hypernyms: ${error}`);
      return [];
    }
  }

  /**
   * Get hyponyms (narrower terms) for a term
   */
  private async getHyponyms(
    term: string,
    limit: number
  ): Promise<ExpandedTerm[]> {
    try {
      const result = await this.db.query(
        `
        SELECT DISTINCT
          s2.lemma as hyponym,
          lr.confidence
        FROM lexical_relationships lr
        JOIN synsets s1 ON lr.target_synset_id = s1.id
        JOIN synsets s2 ON lr.source_synset_id = s2.id
        JOIN lexical_entries le ON s1.id = le.synset_id
        WHERE le.word_form = $1
        AND lr.relationship_type = 'hyponym'
        AND lr.confidence >= 0.5
        ORDER BY lr.confidence DESC
        LIMIT $2
      `,
        [term, limit]
      );

      return result.rows.map((row) => ({
        term: row.hyponym,
        expansionType: "hyponyms",
        relevanceScore: parseFloat(row.confidence),
        source: "wordnet",
      }));
    } catch (error) {
      console.warn(`⚠️ Failed to get hyponyms: ${error}`);
      return [];
    }
  }

  /**
   * Get related terms for a term
   */
  private async getRelatedTerms(
    term: string,
    limit: number
  ): Promise<ExpandedTerm[]> {
    try {
      const result = await this.db.query(
        `
        SELECT DISTINCT
          s2.lemma as related_term,
          lr.confidence,
          lr.relationship_type
        FROM lexical_relationships lr
        JOIN synsets s1 ON (lr.source_synset_id = s1.id OR lr.target_synset_id = s1.id)
        JOIN synsets s2 ON (lr.source_synset_id = s2.id OR lr.target_synset_id = s2.id)
        JOIN lexical_entries le ON s1.id = le.synset_id
        WHERE le.word_form = $1
        AND lr.relationship_type IN ('similar_to', 'related_to')
        AND lr.confidence >= 0.3
        ORDER BY lr.confidence DESC
        LIMIT $2
      `,
        [term, limit]
      );

      return result.rows.map((row) => ({
        term: row.related_term,
        expansionType: "related_terms",
        relevanceScore: parseFloat(row.confidence),
        source: "wordnet",
      }));
    } catch (error) {
      console.warn(`⚠️ Failed to get related terms: ${error}`);
      return [];
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get available dictionary sources
   */
  private async getAvailableSources(): Promise<DictionarySourceType[]> {
    try {
      const result = await this.db.query(`
        SELECT name
        FROM dictionary_sources
        WHERE status = 'available'
        ORDER BY name
      `);

      return result.rows.map((row) => row.name);
    } catch (error) {
      console.warn(`⚠️ Failed to get available sources: ${error}`);
      return ["wordnet", "wiktionary"];
    }
  }

  /**
   * Generate cache key for lookup results
   */
  private generateCacheKey(
    term: string,
    sources?: DictionarySourceType[],
    language: string = "en"
  ): string {
    const sourcesStr = sources ? sources.sort().join(",") : "all";
    const key = `${term}:${sourcesStr}:${language}`;
    return createHash("md5").update(key).digest("hex");
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    let cleanupCount = 0;

    for (const [key, result] of this.cache.entries()) {
      // Simple expiration check - could be enhanced with timestamps
      if (this.cache.size > this.maxCacheSize * 0.8) {
        this.cache.delete(key);
        cleanupCount++;
      }
    }

    if (cleanupCount > 0) {
      console.log(`🧹 Cleaned up ${cleanupCount} cache entries`);
    }
  }

  /**
   * Enforce cache size limit
   */
  private enforceCacheSizeLimit(): void {
    if (this.cache.size > this.maxCacheSize) {
      const entriesToRemove = this.cache.size - this.maxCacheSize;
      const keys = Array.from(this.cache.keys()).slice(0, entriesToRemove);

      for (const key of keys) {
        this.cache.delete(key);
      }

      console.log(
        `📏 Enforced cache size limit, removed ${entriesToRemove} entries`
      );
    }
  }

  /**
   * Determine canonical form from source result
   */
  private determineCanonicalForm(
    originalTerm: string,
    sourceResult: SourceResult
  ): string {
    // Simple canonicalization logic - could be enhanced
    if (sourceResult.synonyms.length > 0) {
      // Use first synonym as canonical form if it's more common
      return sourceResult.synonyms[0];
    }

    return originalTerm;
  }

  /**
   * Check if term matches context
   */
  private matchesContext(
    term: string,
    context: string,
    source: DictionarySourceType
  ): boolean {
    // Simple context matching - could be enhanced with NLP
    const lowerTerm = term.toLowerCase();
    const lowerContext = context.toLowerCase();

    return lowerContext.includes(lowerTerm);
  }

  /**
   * Generate disambiguation context
   */
  private generateDisambiguationContext(
    term: string,
    sourceResults: SourceResult[]
  ): string {
    if (sourceResults.length === 0) {
      return "No dictionary context available";
    }

    const definitions = sourceResults.map((r) => r.definition).filter(Boolean);
    if (definitions.length > 0) {
      return definitions.slice(0, 2).join("; ");
    }

    return "Dictionary data available but no definitions";
  }
}
