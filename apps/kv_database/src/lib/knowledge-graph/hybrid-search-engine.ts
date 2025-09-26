import { Pool, PoolClient } from "pg";
import { ObsidianEmbeddingService } from "../embeddings.js";
import { ContentType } from "../../types/index.js";
import { EntityType, RelationshipType } from "./entity-extractor.js";

export interface SearchQuery {
  text: string;
  filters?: {
    contentTypes?: ContentType[];
    entityTypes?: EntityType[];
    relationshipTypes?: RelationshipType[];
    sourceFiles?: string[];
    minConfidence?: number;
    dateRange?: {
      start: Date;
      end: Date;
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

export interface SearchResult {
  id: string;
  text: string;
  score: number;
  similarity: number;
  relevanceScore: number;
  metadata: SearchResultMetadata;
  entities: EntityReference[];
  relationships: RelationshipReference[];
  explanation?: SearchExplanation;
}

export interface SearchResultMetadata {
  contentType: ContentType;
  sourceFile: string;
  chunkId: string;
  extractionMethod: string;
  processingTime: Date;
  wordCount: number;
  characterCount: number;
}

export interface EntityReference {
  id: string;
  name: string;
  type: EntityType;
  confidence: number;
  mentionCount: number;
  aliases: string[];
}

export interface RelationshipReference {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: RelationshipType;
  confidence: number;
  strength: number;
  isDirectional: boolean;
}

export interface SearchExplanation {
  queryEntities: EntityReference[];
  traversalPaths: TraversalPath[];
  reasoningSteps: ReasoningStep[];
  searchStrategy: string;
  totalExecutionTime: number;
  vectorSearchTime: number;
  graphTraversalTime: number;
  resultFusionTime: number;
}

export interface TraversalPath {
  entities: EntityReference[];
  relationships: RelationshipReference[];
  confidence: number;
  hopCount: number;
  pathStrength: number;
  explanation: string;
}

export interface ReasoningStep {
  step: number;
  description: string;
  confidence: number;
  evidence: string[];
  entitiesInvolved: string[];
}

export interface HybridSearchConfig {
  vectorWeight: number; // 0-1, weight for vector similarity
  graphWeight: number; // 0-1, weight for graph traversal
  maxHops: number; // Maximum hops for graph traversal
  minEntityConfidence: number; // Minimum confidence for entity matching
  minRelationshipConfidence: number; // Minimum confidence for relationship traversal
  enableQueryExpansion: boolean; // Whether to expand queries using entity relationships
  expansionDepth: number; // How many hops to use for query expansion
  resultFusionStrategy: "weighted" | "rank" | "hybrid"; // How to combine vector and graph results
  performanceMode: "accuracy" | "speed" | "balanced"; // Performance vs accuracy trade-off
}

export interface SearchMetrics {
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
  cacheHitRate?: number;
}

/**
 * Hybrid search engine that combines vector similarity with knowledge graph traversal
 * for enhanced semantic search with explainable results
 */
export class HybridSearchEngine {
  private pool: Pool;
  private embeddings: ObsidianEmbeddingService;
  private config: HybridSearchConfig;

  constructor(
    pool: Pool,
    embeddings: ObsidianEmbeddingService,
    config: Partial<HybridSearchConfig> = {}
  ) {
    this.pool = pool;
    this.embeddings = embeddings;

    this.config = {
      vectorWeight: 0.6,
      graphWeight: 0.4,
      maxHops: 3,
      minEntityConfidence: 0.7,
      minRelationshipConfidence: 0.5,
      enableQueryExpansion: true,
      expansionDepth: 2,
      resultFusionStrategy: "hybrid",
      performanceMode: "balanced",
      ...config,
    };

    // Validate configuration
    this.validateConfig();
  }

  /**
   * Main search method that combines vector and graph search
   */
  async search(query: SearchQuery): Promise<{
    results: SearchResult[];
    metrics: SearchMetrics;
    explanation?: SearchExplanation;
  }> {
    const startTime = performance.now();
    console.log(`🔍 Starting hybrid search: "${query.text}"`);

    try {
      // Phase 1: Query Analysis and Entity Extraction
      const queryAnalysis = await this.analyzeQuery(query);

      // Phase 2: Vector Search
      const vectorSearchStart = performance.now();
      const vectorResults = await this.performVectorSearch(
        query,
        queryAnalysis
      );
      const vectorSearchTime = performance.now() - vectorSearchStart;

      // Phase 3: Graph Traversal Search
      const graphSearchStart = performance.now();
      const graphResults = await this.performGraphSearch(query, queryAnalysis);
      const graphSearchTime = performance.now() - graphSearchStart;

      // Phase 4: Result Fusion and Ranking
      const fusionStart = performance.now();
      const fusedResults = await this.fuseAndRankResults(
        vectorResults,
        graphResults,
        query,
        queryAnalysis
      );
      const fusionTime = performance.now() - fusionStart;

      // Phase 5: Generate Explanation (if requested)
      let explanation: SearchExplanation | undefined;
      if (query.options?.includeExplanation) {
        explanation = await this.generateExplanation(
          query,
          queryAnalysis,
          vectorResults,
          graphResults,
          fusedResults,
          {
            vectorSearchTime,
            graphSearchTime,
            fusionTime,
          }
        );
      }

      const totalTime = performance.now() - startTime;

      const metrics: SearchMetrics = {
        totalResults: fusedResults.length,
        vectorResults: vectorResults.length,
        graphResults: graphResults.length,
        fusedResults: fusedResults.length,
        executionTime: totalTime,
        vectorSearchTime,
        graphTraversalTime: graphSearchTime,
        resultFusionTime: fusionTime,
        entitiesFound: queryAnalysis.entities.length,
        relationshipsTraversed: queryAnalysis.relationshipsTraversed || 0,
        maxHopsReached: queryAnalysis.maxHopsReached || 0,
      };

      console.log(
        `✅ Hybrid search complete: ${
          fusedResults.length
        } results in ${totalTime.toFixed(1)}ms`
      );

      return {
        results: fusedResults,
        metrics,
        explanation,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ Hybrid search failed:", errorMessage);
      throw new Error(`Hybrid search failed: ${errorMessage}`);
    }
  }

  /**
   * Analyze query to extract entities and determine search strategy
   */
  private async analyzeQuery(query: SearchQuery): Promise<{
    entities: EntityReference[];
    expandedTerms: string[];
    searchStrategy: "vector" | "graph" | "hybrid";
    relationshipsTraversed?: number;
    maxHopsReached?: number;
  }> {
    console.log("🔍 Analyzing query for entities and relationships...");

    const client = await this.pool.connect();
    try {
      // Extract entities from query text
      const entities = await this.extractQueryEntities(query.text, client);

      // Determine optimal search strategy
      const searchStrategy = this.determineSearchStrategy(query, entities);

      // Expand query terms using entity relationships (if enabled)
      let expandedTerms: string[] = [query.text];
      if (
        this.config.enableQueryExpansion &&
        entities.length > 0 &&
        searchStrategy !== "vector"
      ) {
        expandedTerms = await this.expandQueryTerms(
          query.text,
          entities,
          client
        );
      }

      console.log(
        `📊 Query analysis: ${entities.length} entities found, strategy: ${searchStrategy}`
      );

      return {
        entities,
        expandedTerms,
        searchStrategy,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Extract entities mentioned in the query text
   */
  private async extractQueryEntities(
    queryText: string,
    client: PoolClient
  ): Promise<EntityReference[]> {
    // Use fuzzy matching to find entities that might be mentioned in the query
    const entityQuery = `
      SELECT 
        e.id,
        e.name,
        e.type,
        e.confidence,
        e.aliases,
        similarity(e.name, $1) as name_similarity,
        similarity(array_to_string(e.aliases, ' '), $1) as alias_similarity
      FROM knowledge_graph_entities e
      WHERE 
        similarity(e.name, $1) > 0.3 OR
        similarity(array_to_string(e.aliases, ' '), $1) > 0.3 OR
        e.search_vector @@ plainto_tsquery('english', $1)
      ORDER BY 
        GREATEST(
          similarity(e.name, $1),
          similarity(array_to_string(e.aliases, ' '), $1)
        ) DESC
      LIMIT 10
    `;

    const result = await client.query(entityQuery, [queryText]);

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type as EntityType,
      confidence: parseFloat(row.confidence),
      mentionCount: 1, // Query mention
      aliases: row.aliases || [],
    }));
  }

  /**
   * Determine optimal search strategy based on query and entities
   */
  private determineSearchStrategy(
    query: SearchQuery,
    entities: EntityReference[]
  ): "vector" | "graph" | "hybrid" {
    // Use explicit search type if specified
    if (query.options?.searchType) {
      return query.options.searchType;
    }

    // Use performance mode to determine strategy
    if (this.config.performanceMode === "speed") {
      return entities.length > 0 ? "hybrid" : "vector";
    }

    if (this.config.performanceMode === "accuracy") {
      return entities.length > 2 ? "graph" : "hybrid";
    }

    // Balanced mode: use hybrid if entities found, otherwise vector
    return entities.length > 0 ? "hybrid" : "vector";
  }

  /**
   * Expand query terms using entity relationships
   */
  private async expandQueryTerms(
    originalQuery: string,
    entities: EntityReference[],
    client: PoolClient
  ): Promise<string[]> {
    const expandedTerms = new Set([originalQuery]);

    for (const entity of entities) {
      // Find related entities within expansion depth
      const relatedEntitiesQuery = `
        WITH RECURSIVE entity_traversal AS (
          -- Base case: start with the query entity
          SELECT 
            e.id,
            e.name,
            0 as hop_count,
            1.0 as path_confidence
          FROM knowledge_graph_entities e
          WHERE e.id = $1
          
          UNION ALL
          
          -- Recursive case: traverse relationships
          SELECT 
            target_e.id,
            target_e.name,
            et.hop_count + 1,
            et.path_confidence * r.confidence * r.strength
          FROM entity_traversal et
          JOIN knowledge_graph_relationships r ON (
            r.source_entity_id = et.id OR 
            (NOT r.is_directional AND r.target_entity_id = et.id)
          )
          JOIN knowledge_graph_entities target_e ON (
            target_e.id = CASE 
              WHEN r.source_entity_id = et.id THEN r.target_entity_id
              ELSE r.source_entity_id
            END
          )
          WHERE 
            et.hop_count < $2 AND
            r.confidence >= $3 AND
            et.path_confidence > 0.1
        )
        SELECT DISTINCT name, path_confidence
        FROM entity_traversal
        WHERE hop_count > 0 AND path_confidence > 0.3
        ORDER BY path_confidence DESC
        LIMIT 5
      `;

      const relatedResult = await client.query(relatedEntitiesQuery, [
        entity.id,
        this.config.expansionDepth,
        this.config.minRelationshipConfidence,
      ]);

      // Add related entity names as expanded terms
      for (const row of relatedResult.rows) {
        expandedTerms.add(row.name);
      }
    }

    return Array.from(expandedTerms);
  }

  /**
   * Perform vector similarity search
   */
  private async performVectorSearch(
    query: SearchQuery,
    _queryAnalysis
  ): Promise<SearchResult[]> {
    console.log("🔍 Performing vector similarity search...");

    // Generate embedding for the query
    const queryEmbedding = await this.embeddings.embedWithStrategy(query.text);

    const client = await this.pool.connect();
    try {
      // Build vector search query with filters
      let vectorQuery = `
        SELECT 
          c.id,
          c.content,
          c.meta,
          (c.embedding <=> $1::vector) as distance,
          (1 - (c.embedding <=> $1::vector)) as similarity
        FROM obsidian_chunks c
        WHERE c.embedding IS NOT NULL
      `;

      const queryParams: string[] = [`[${queryEmbedding.embedding.join(",")}]`];
      let paramIndex = 2;

      // Add content type filter
      if (query.filters?.contentTypes?.length) {
        vectorQuery += ` AND c.meta->>'contentType' = ANY($${paramIndex})`;
        queryParams.push(query.filters.contentTypes.join(","));
        paramIndex++;
      }

      // Add source file filter
      if (query.filters?.sourceFiles?.length) {
        vectorQuery += ` AND c.meta->>'sourceFile' = ANY($${paramIndex})`;
        queryParams.push(query.filters.sourceFiles.join(","));
        paramIndex++;
      }

      // Add similarity threshold
      const minSimilarity = query.options?.minSimilarity || 0.1;
      vectorQuery += ` AND (1 - (c.embedding <=> $1::vector)) >= ${minSimilarity}`;

      // Order by similarity and limit results
      const maxResults = query.options?.maxResults || 20;
      vectorQuery += ` ORDER BY c.embedding <=> $1::vector LIMIT ${
        maxResults * 2
      }`; // Get more for fusion

      const result = await client.query(vectorQuery, queryParams);

      return result.rows.map((row, _index) => ({
        id: row.id,
        text: row.content,
        score: parseFloat(row.similarity),
        similarity: parseFloat(row.similarity),
        relevanceScore: parseFloat(row.similarity), // Will be adjusted in fusion
        metadata: {
          contentType: row.meta.contentType as ContentType,
          sourceFile: row.meta.sourceFile,
          chunkId: row.id,
          extractionMethod: row.meta.extractionMethod || "unknown",
          processingTime: new Date(row.meta.processingTime || Date.now()),
          wordCount: row.meta.wordCount || 0,
          characterCount: row.content?.length || 0,
        },
        entities: [], // Will be populated in fusion
        relationships: [], // Will be populated in fusion
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Perform graph traversal search
   */
  private async performGraphSearch(
    query: SearchQuery,
    queryAnalysis: {
      entities: EntityReference[];
    }
  ): Promise<SearchResult[]> {
    if (queryAnalysis.entities.length === 0) {
      console.log("⚠️ No entities found for graph search, skipping...");
      return [];
    }

    console.log(
      `🕸️ Performing graph traversal search with ${queryAnalysis.entities.length} entities...`
    );

    const client = await this.pool.connect();
    try {
      const graphResults: SearchResult[] = [];

      // For each query entity, traverse the graph to find related content
      for (const entity of queryAnalysis.entities) {
        const entityResults = await this.traverseFromEntity(
          entity,
          query,
          client
        );
        graphResults.push(...entityResults);
      }

      // Remove duplicates and sort by relevance
      const uniqueResults = this.deduplicateResults(graphResults);
      return uniqueResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } finally {
      client.release();
    }
  }

  /**
   * Traverse graph from a specific entity to find related content
   */
  private async traverseFromEntity(
    startEntity: EntityReference,
    query: SearchQuery,
    client: PoolClient
  ): Promise<SearchResult[]> {
    const maxHops = query.options?.maxHops || this.config.maxHops;
    const results: SearchResult[] = [];

    // Multi-hop graph traversal query
    const traversalQuery = `
      WITH RECURSIVE graph_traversal AS (
        -- Base case: start with the entity and its direct chunks
        SELECT 
          e.id as entity_id,
          e.name as entity_name,
          e.type as entity_type,
          e.confidence as entity_confidence,
          ecm.chunk_id,
          0 as hop_count,
          1.0 as path_confidence,
          ARRAY[e.id] as entity_path,
          ARRAY[]::uuid[] as relationship_path
        FROM knowledge_graph_entities e
        JOIN entity_chunk_mappings ecm ON ecm.entity_id = e.id
        WHERE e.id = $1
        
        UNION ALL
        
        -- Recursive case: traverse relationships
        SELECT 
          target_e.id as entity_id,
          target_e.name as entity_name,
          target_e.type as entity_type,
          target_e.confidence as entity_confidence,
          ecm.chunk_id,
          gt.hop_count + 1,
          gt.path_confidence * r.confidence * r.strength,
          gt.entity_path || target_e.id,
          gt.relationship_path || r.id
        FROM graph_traversal gt
        JOIN knowledge_graph_relationships r ON (
          r.source_entity_id = gt.entity_id OR 
          (NOT r.is_directional AND r.target_entity_id = gt.entity_id)
        )
        JOIN knowledge_graph_entities target_e ON (
          target_e.id = CASE 
            WHEN r.source_entity_id = gt.entity_id THEN r.target_entity_id
            ELSE r.source_entity_id
          END
        )
        JOIN entity_chunk_mappings ecm ON ecm.entity_id = target_e.id
        WHERE 
          gt.hop_count < $2 AND
          r.confidence >= $3 AND
          gt.path_confidence > 0.1 AND
          NOT target_e.id = ANY(gt.entity_path) -- Prevent cycles
      )
      SELECT DISTINCT
        gt.chunk_id,
        gt.hop_count,
        gt.path_confidence,
        c.content,
        c.meta,
        array_agg(DISTINCT gt.entity_name) as related_entities,
        max(gt.path_confidence) as max_confidence
      FROM graph_traversal gt
      JOIN obsidian_chunks c ON c.id = gt.chunk_id
      GROUP BY gt.chunk_id, gt.hop_count, gt.path_confidence, c.content, c.meta
      ORDER BY max_confidence DESC, hop_count ASC
      LIMIT 50
    `;

    const traversalResult = await client.query(traversalQuery, [
      startEntity.id,
      maxHops,
      this.config.minRelationshipConfidence,
    ]);

    for (const row of traversalResult.rows) {
      // Calculate relevance score based on path confidence and hop distance
      const hopPenalty = Math.pow(0.8, row.hop_count); // Reduce score for each hop
      const relevanceScore = row.max_confidence * hopPenalty;

      results.push({
        id: row.chunk_id,
        text: row.content,
        score: relevanceScore,
        similarity: 0, // No direct similarity for graph results
        relevanceScore,
        metadata: {
          contentType: row.meta.contentType as ContentType,
          sourceFile: row.meta.sourceFile,
          chunkId: row.chunk_id,
          extractionMethod: row.meta.extractionMethod || "graph_traversal",
          processingTime: new Date(row.meta.processingTime || Date.now()),
          wordCount: row.meta.wordCount || 0,
          characterCount: row.content?.length || 0,
        },
        entities: [], // Will be populated later
        relationships: [], // Will be populated later
      });
    }

    return results;
  }

  /**
   * Fuse and rank results from vector and graph search
   */
  private async fuseAndRankResults(
    vectorResults: SearchResult[],
    graphResults: SearchResult[],
    _query: SearchQuery,
    _queryAnalysis: {
      entities: EntityReference[];
    }
  ): Promise<SearchResult[]> {
    console.log(
      `🔗 Fusing results: ${vectorResults.length} vector + ${graphResults.length} graph`
    );

    // Combine results and remove duplicates
    const allResults = [...vectorResults, ...graphResults];
    const uniqueResults = this.deduplicateResults(allResults);

    // Apply fusion strategy
    const fusedResults = await this.applyFusionStrategy(
      uniqueResults,
      vectorResults,
      graphResults,
      _query,
      _queryAnalysis
    );

    // Populate entities and relationships for each result
    await this.populateResultMetadata(fusedResults);

    // Apply final ranking and limit results
    const maxResults = _query.options?.maxResults || 10;
    return fusedResults
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);
  }

  /**
   * Apply the configured fusion strategy
   */
  private async applyFusionStrategy(
    uniqueResults: SearchResult[],
    vectorResults: SearchResult[],
    graphResults: SearchResult[],
    _query: SearchQuery,
    _queryAnalysis: {
      entities: EntityReference[];
    }
  ): Promise<SearchResult[]> {
    const strategy = this.config.resultFusionStrategy;

    for (const result of uniqueResults) {
      const isVectorResult = vectorResults.some((vr) => vr.id === result.id);
      const isGraphResult = graphResults.some((gr) => gr.id === result.id);

      switch (strategy) {
        case "weighted":
          // Weighted combination of vector and graph scores
          if (isVectorResult && isGraphResult) {
            const vectorScore =
              vectorResults.find((vr) => vr.id === result.id)?.score || 0;
            const graphScore =
              graphResults.find((gr) => gr.id === result.id)?.score || 0;
            result.relevanceScore =
              vectorScore * this.config.vectorWeight +
              graphScore * this.config.graphWeight;
          } else if (isVectorResult) {
            result.relevanceScore = result.score * this.config.vectorWeight;
          } else {
            result.relevanceScore = result.score * this.config.graphWeight;
          }
          break;

        case "rank": {
          // Rank-based fusion (Reciprocal Rank Fusion)
          const vectorRank = vectorResults.findIndex(
            (vr) => vr.id === result.id
          );
          const graphRank = graphResults.findIndex((gr) => gr.id === result.id);

          let rrfScore = 0;
          if (vectorRank >= 0) rrfScore += 1 / (vectorRank + 60);
          if (graphRank >= 0) rrfScore += 1 / (graphRank + 60);

          result.relevanceScore = rrfScore;
          break;
        }

        case "hybrid":
        default:
          // Hybrid approach: boost results that appear in both
          if (isVectorResult && isGraphResult) {
            // Boost for appearing in both search types
            result.relevanceScore = result.score * 1.2;
          } else {
            result.relevanceScore = result.score;
          }
          break;
      }
    }

    return uniqueResults;
  }

  /**
   * Populate entities and relationships for search results
   */
  private async populateResultMetadata(results: SearchResult[]): Promise<void> {
    if (results.length === 0) return;

    const client = await this.pool.connect();
    try {
      const chunkIds = results.map((r) => r.id);

      // Get entities for all chunks
      const entitiesQuery = `
        SELECT 
          ecm.chunk_id,
          e.id,
          e.name,
          e.type,
          e.confidence,
          e.aliases,
          COUNT(ecm.id) as mention_count
        FROM entity_chunk_mappings ecm
        JOIN knowledge_graph_entities e ON e.id = ecm.entity_id
        WHERE ecm.chunk_id = ANY($1)
        GROUP BY ecm.chunk_id, e.id, e.name, e.type, e.confidence, e.aliases
      `;

      const entitiesResult = await client.query(entitiesQuery, [chunkIds]);

      // Get relationships for all chunks
      const relationshipsQuery = `
        SELECT DISTINCT
          ecm1.chunk_id,
          r.id,
          r.source_entity_id,
          r.target_entity_id,
          r.type,
          r.confidence,
          r.strength,
          r.is_directional
        FROM entity_chunk_mappings ecm1
        JOIN entity_chunk_mappings ecm2 ON ecm1.chunk_id = ecm2.chunk_id
        JOIN knowledge_graph_relationships r ON (
          (r.source_entity_id = ecm1.entity_id AND r.target_entity_id = ecm2.entity_id) OR
          (r.source_entity_id = ecm2.entity_id AND r.target_entity_id = ecm1.entity_id)
        )
        WHERE ecm1.chunk_id = ANY($1)
      `;

      const relationshipsResult = await client.query(relationshipsQuery, [
        chunkIds,
      ]);

      // Group results by chunk ID
      const entitiesByChunk = new Map<string, EntityReference[]>();
      const relationshipsByChunk = new Map<string, RelationshipReference[]>();

      for (const row of entitiesResult.rows) {
        if (!entitiesByChunk.has(row.chunk_id)) {
          entitiesByChunk.set(row.chunk_id, []);
        }
        entitiesByChunk.get(row.chunk_id)!.push({
          id: row.id,
          name: row.name,
          type: row.type as EntityType,
          confidence: parseFloat(row.confidence),
          mentionCount: parseInt(row.mention_count),
          aliases: row.aliases || [],
        });
      }

      for (const row of relationshipsResult.rows) {
        if (!relationshipsByChunk.has(row.chunk_id)) {
          relationshipsByChunk.set(row.chunk_id, []);
        }
        relationshipsByChunk.get(row.chunk_id)!.push({
          id: row.id,
          sourceEntityId: row.source_entity_id,
          targetEntityId: row.target_entity_id,
          type: row.type as RelationshipType,
          confidence: parseFloat(row.confidence),
          strength: parseFloat(row.strength),
          isDirectional: row.is_directional,
        });
      }

      // Populate results
      for (const result of results) {
        result.entities = entitiesByChunk.get(result.id) || [];
        result.relationships = relationshipsByChunk.get(result.id) || [];
      }
    } finally {
      client.release();
    }
  }

  /**
   * Generate explanation for search results
   */
  private async generateExplanation(
    query: SearchQuery,
    queryAnalysis: {
      entities: EntityReference[];
    },
    vectorResults: SearchResult[],
    graphResults: SearchResult[],
    rankedResults: SearchResult[],
    timings: {
      vectorSearchTime: number;
      graphSearchTime: number;
      fusionTime: number;
    }
  ): Promise<SearchExplanation> {
    // Generate reasoning steps
    const reasoningSteps: ReasoningStep[] = [];
    let stepCounter = 1;

    // Step 1: Query analysis
    reasoningSteps.push({
      step: stepCounter++,
      description: `Analyzed query "${query.text}" and found ${queryAnalysis.entities.length} relevant entities`,
      confidence: queryAnalysis.entities.length > 0 ? 0.9 : 0.3,
      evidence: queryAnalysis.entities.map((e: EntityReference) => e.name),
      entitiesInvolved: queryAnalysis.entities.map(
        (e: EntityReference) => e.id
      ),
    });

    // Step 2: Vector search
    if (vectorResults.length > 0) {
      reasoningSteps.push({
        step: stepCounter++,
        description: `Performed vector similarity search and found ${vectorResults.length} semantically similar results`,
        confidence: 0.8,
        evidence: [
          `Top similarity: ${vectorResults[0]?.similarity.toFixed(3)}`,
        ],
        entitiesInvolved: [],
      });
    }

    // Step 3: Graph traversal
    if (graphResults.length > 0) {
      reasoningSteps.push({
        step: stepCounter++,
        description: `Traversed knowledge graph and found ${graphResults.length} contextually related results`,
        confidence: 0.85,
        evidence: [`Max hops: ${this.config.maxHops}`],
        entitiesInvolved: queryAnalysis.entities.map(
          (e: EntityReference) => e.id
        ),
      });
    }

    // Step 4: Result fusion
    reasoningSteps.push({
      step: stepCounter++,
      description: `Applied ${this.config.resultFusionStrategy} fusion strategy to combine and rank ${rankedResults.length} results`,
      confidence: 0.9,
      evidence: [
        `Vector weight: ${this.config.vectorWeight}`,
        `Graph weight: ${this.config.graphWeight}`,
      ],
      entitiesInvolved: [],
    });

    return {
      queryEntities: queryAnalysis.entities,
      traversalPaths: [], // Would need more complex tracking to populate
      reasoningSteps,
      searchStrategy: queryAnalysis.searchStrategy,
      totalExecutionTime:
        timings.vectorSearchTime + timings.graphSearchTime + timings.fusionTime,
      vectorSearchTime: timings.vectorSearchTime,
      graphTraversalTime: timings.graphSearchTime,
      resultFusionTime: timings.fusionTime,
    };
  }

  /**
   * Remove duplicate results based on chunk ID
   */
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

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (this.config.vectorWeight + this.config.graphWeight !== 1.0) {
      console.warn(
        "⚠️ Vector and graph weights should sum to 1.0 for optimal results"
      );
    }

    if (this.config.maxHops > 5) {
      console.warn("⚠️ High maxHops value may impact performance");
    }

    if (
      this.config.minEntityConfidence < 0 ||
      this.config.minEntityConfidence > 1
    ) {
      throw new Error("minEntityConfidence must be between 0 and 1");
    }

    if (
      this.config.minRelationshipConfidence < 0 ||
      this.config.minRelationshipConfidence > 1
    ) {
      throw new Error("minRelationshipConfidence must be between 0 and 1");
    }
  }

  /**
   * Update search configuration
   */
  updateConfig(configUpdates: Partial<HybridSearchConfig>): void {
    this.config = { ...this.config, ...configUpdates };
    this.validateConfig();
    console.log("⚙️ Updated hybrid search configuration");
  }

  /**
   * Get current configuration
   */
  getConfig(): HybridSearchConfig {
    return { ...this.config };
  }
}
