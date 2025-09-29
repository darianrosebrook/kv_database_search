// Dictionary Client Service for RAG Editor
// Frontend client for calling the backend dictionary API

const DICTIONARY_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ============================================================================
// TYPE DEFINITIONS (Matching backend types)
// ============================================================================

export interface DictionarySourceType {
  name: string;
  version: string;
  language: string;
  status: "available" | "updating" | "unavailable";
  capabilities: string[];
  entryCount: number;
  lastUpdated?: string;
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
  source: string;
  synsetId?: string;
  definition: string;
  partOfSpeech?: string;
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
  type: string;
  target: string;
  confidence: number;
  sourceSynset?: string;
  targetSynset?: string;
}

export interface EntityCanonicalizationResult {
  originalName: string;
  canonicalName: string;
  confidence: number;
  source: string;
  reasoning: string;
}

export interface SearchExpansionResult {
  originalTerm: string;
  expandedTerms: ExpandedTerm[];
}

export interface ExpandedTerm {
  term: string;
  expansionType: string;
  relevanceScore: number;
  source: string;
}

// ============================================================================
// REQUEST INTERFACES
// ============================================================================

export interface DictionaryLookupRequest {
  terms: string[];
  sources?: string[];
  context?: string;
  includeRelationships?: boolean;
  maxSynonyms?: number;
  language?: string;
}

export interface EntityCanonicalizationRequest {
  entities: Array<{
    name: string;
    type: string;
    context?: string;
    aliases?: string[];
  }>;
}

export interface SearchExpansionRequest {
  queryTerms: string[];
  expansionTypes?: string[];
  maxExpansionsPerTerm?: number;
}

export interface DictionaryHealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: Record<
    string,
    {
      status: "up" | "down" | "degraded";
      responseTimeMs?: number;
      lastCheck: string;
    }
  >;
}

// ============================================================================
// DICTIONARY CLIENT CLASS
// ============================================================================

export class DictionaryClient {
  private static instance: DictionaryClient;
  private baseUrl: string;

  private constructor(baseUrl: string = DICTIONARY_API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  static getInstance(): DictionaryClient {
    if (!DictionaryClient.instance) {
      DictionaryClient.instance = new DictionaryClient();
    }
    return DictionaryClient.instance;
  }

  // ============================================================================
  // LOOKUP METHODS
  // ============================================================================

  /**
   * Look up dictionary information for terms
   */
  async lookupTerms(
    request: DictionaryLookupRequest
  ): Promise<DictionaryLookupResult[]> {
    try {
      console.log(
        `🔍 Dictionary lookup for terms: ${request.terms.join(", ")}`
      );

      const response = await fetch(`${this.baseUrl}/api/dictionary/lookup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Dictionary lookup failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("❌ Dictionary lookup failed:", error);
      return [];
    }
  }

  /**
   * Get definition for a single term
   */
  async getDefinition(term: string, context?: string): Promise<string | null> {
    const results = await this.lookupTerms({
      terms: [term],
      context,
      maxSynonyms: 1,
    });

    if (results.length > 0 && results[0].sources.length > 0) {
      return results[0].sources[0].definition;
    }

    return null;
  }

  /**
   * Get synonyms for a term
   */
  async getSynonyms(term: string, maxSynonyms: number = 5): Promise<string[]> {
    const results = await this.lookupTerms({
      terms: [term],
      maxSynonyms,
    });

    if (results.length > 0 && results[0].sources.length > 0) {
      return results[0].sources[0].synonyms.slice(0, maxSynonyms);
    }

    return [];
  }

  // ============================================================================
  // CANONICALIZATION METHODS
  // ============================================================================

  /**
   * Canonicalize entity names using dictionary data
   */
  async canonicalizeEntities(
    request: EntityCanonicalizationRequest
  ): Promise<EntityCanonicalizationResult[]> {
    try {
      console.log(`🔄 Canonicalizing ${request.entities.length} entities`);

      const response = await fetch(
        `${this.baseUrl}/api/dictionary/canonicalize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Entity canonicalization failed: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("❌ Entity canonicalization failed:", error);
      return [];
    }
  }

  /**
   * Canonicalize a single entity
   */
  async canonicalizeEntity(
    name: string,
    type: string,
    context?: string
  ): Promise<EntityCanonicalizationResult | null> {
    const results = await this.canonicalizeEntities({
      entities: [{ name, type, context }],
    });

    return results.length > 0 ? results[0] : null;
  }

  // ============================================================================
  // SEARCH EXPANSION METHODS
  // ============================================================================

  /**
   * Expand search terms with synonyms and related terms
   */
  async expandSearchTerms(
    request: SearchExpansionRequest
  ): Promise<SearchExpansionResult[]> {
    try {
      console.log(
        `🔍 Expanding search terms: ${request.queryTerms.join(", ")}`
      );

      const response = await fetch(`${this.baseUrl}/api/dictionary/expand`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Search expansion failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error("❌ Search expansion failed:", error);
      return [];
    }
  }

  /**
   * Expand a single search term
   */
  async expandTerm(term: string, expansionTypes?: string[]): Promise<string[]> {
    const results = await this.expandSearchTerms({
      queryTerms: [term],
      expansionTypes,
      maxExpansionsPerTerm: 5,
    });

    if (results.length > 0) {
      return results[0].expandedTerms.map((et: ExpandedTerm) => et.term);
    }

    return [];
  }

  // ============================================================================
  // RELATIONSHIPS METHODS
  // ============================================================================

  /**
   * Get semantic relationships for a term
   */
  async getRelationships(
    term: string,
    relationshipTypes?: string[],
    maxRelationships: number = 10
  ): Promise<SemanticRelationship[]> {
    try {
      const params = new URLSearchParams();
      params.append("term", term);
      if (relationshipTypes) {
        relationshipTypes.forEach((type) =>
          params.append("relationshipTypes", type)
        );
      }
      params.append("maxRelationships", maxRelationships.toString());

      const response = await fetch(
        `${this.baseUrl}/api/dictionary/relationships?${params}`
      );

      if (!response.ok) {
        throw new Error(`Relationships query failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.relationships || [];
    } catch (error) {
      console.error("❌ Relationships query failed:", error);
      return [];
    }
  }

  // ============================================================================
  // SOURCES AND HEALTH METHODS
  // ============================================================================

  /**
   * Get available dictionary sources
   */
  async getSources(): Promise<DictionarySourceType[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/dictionary/sources`);

      if (!response.ok) {
        throw new Error(`Sources query failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.sources || [];
    } catch (error) {
      console.error("❌ Sources query failed:", error);
      return [];
    }
  }

  /**
   * Check dictionary service health
   */
  async getHealth(): Promise<DictionaryHealthResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/dictionary/health`);

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("❌ Health check failed:", error);
      return null;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if dictionary service is available
   */
  async isAvailable(): Promise<boolean> {
    const health = await this.getHealth();
    return health?.status === "healthy";
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(): Promise<string[]> {
    const sources = await this.getSources();
    const languages = new Set(sources.map((source) => source.language));
    return Array.from(languages);
  }

  /**
   * Get capabilities for a specific source
   */
  async getSourceCapabilities(sourceName: string): Promise<string[]> {
    const sources = await this.getSources();
    const source = sources.find((s) => s.name === sourceName);
    return source?.capabilities || [];
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const dictionaryClient = DictionaryClient.getInstance();
