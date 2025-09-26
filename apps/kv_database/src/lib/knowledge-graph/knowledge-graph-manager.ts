import { Pool, PoolClient } from "pg";
import {
  KnowledgeGraphEntity,
  KnowledgeGraphRelationship,
  EntityExtractionResult,
  EntityType,
  RelationshipType,
  ExtractionMethod,
  EntityMention,
} from "./entity-extractor.js";
import { ObsidianEmbeddingService } from "../embeddings.js";

export interface EntitySimilarity {
  entity: KnowledgeGraphEntity;
  similarity: number;
  method: "cosine" | "semantic" | "fuzzy";
}

export interface GraphStatistics {
  entityCount: number;
  relationshipCount: number;
  entityTypeDistribution: Record<string, number>;
  relationshipTypeDistribution: Record<string, number>;
  averageConnectivity: number;
  lastUpdated: Date;
}

export interface EntityDeduplicationResult {
  mergedEntity: KnowledgeGraphEntity;
  duplicateIds: string[];
  confidence: number;
}

/**
 * Manages knowledge graph construction, entity deduplication, and persistence
 */
export class KnowledgeGraph {
  private pool: Pool;
  private embeddings: ObsidianEmbeddingService;
  private similarityThreshold: number;
  private enableAutoMerge: boolean;

  constructor(
    pool: Pool,
    embeddings: ObsidianEmbeddingService,
    options: {
      similarityThreshold?: number;
      enableAutoMerge?: boolean;
    } = {}
  ) {
    this.pool = pool;
    this.embeddings = embeddings;
    this.similarityThreshold = options.similarityThreshold || 0.8;
    this.enableAutoMerge = options.enableAutoMerge || false;
  }

  /**
   * Process extraction results and update knowledge graph
   */
  async processExtractionResult(result: EntityExtractionResult): Promise<{
    entitiesCreated: number;
    entitiesUpdated: number;
    relationshipsCreated: number;
    relationshipsUpdated: number;
    duplicatesFound: number;
  }> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      console.log(
        `🔄 Processing extraction result: ${result.entities.length} entities, ${result.relationships.length} relationships`
      );

      let entitiesCreated = 0;
      let entitiesUpdated = 0;
      let duplicatesFound = 0;

      // Process entities with deduplication
      const processedEntities: KnowledgeGraphEntity[] = [];

      for (const entity of result.entities) {
        // Generate embedding if not present
        if (!entity.embedding) {
          entity.embedding = await this.generateEntityEmbedding(entity);
        }

        // Check for duplicates
        const duplicates = await this.findDuplicateEntities(entity, client);

        if (duplicates.length > 0) {
          duplicatesFound += duplicates.length;

          if (this.enableAutoMerge) {
            // Merge with best match
            const bestMatch = duplicates[0];
            const mergedEntity = await this.mergeEntities(
              entity,
              bestMatch.entity,
              client
            );
            processedEntities.push(mergedEntity);
            entitiesUpdated++;
          } else {
            // Update existing entity with new information
            const existingEntity = duplicates[0].entity;
            const updatedEntity = await this.updateExistingEntity(
              existingEntity,
              entity,
              client
            );
            processedEntities.push(updatedEntity);
            entitiesUpdated++;
          }
        } else {
          // Create new entity
          const createdEntity = await this.createEntity(entity, client);
          processedEntities.push(createdEntity);
          entitiesCreated++;
        }
      }

      // Process relationships
      let relationshipsCreated = 0;
      let relationshipsUpdated = 0;

      for (const relationship of result.relationships) {
        // Find entity IDs for source and target
        const sourceEntity = processedEntities.find(
          (e) =>
            e.name === relationship.sourceEntityId ||
            e.id === relationship.sourceEntityId
        );
        const targetEntity = processedEntities.find(
          (e) =>
            e.name === relationship.targetEntityId ||
            e.id === relationship.targetEntityId
        );

        if (
          sourceEntity &&
          targetEntity &&
          sourceEntity.id &&
          targetEntity.id
        ) {
          relationship.sourceEntityId = sourceEntity.id;
          relationship.targetEntityId = targetEntity.id;

          // Check if relationship already exists
          const existingRelationship = await this.findExistingRelationship(
            relationship.sourceEntityId,
            relationship.targetEntityId,
            relationship.type,
            client
          );

          if (existingRelationship) {
            // Update existing relationship
            await this.updateRelationship(
              existingRelationship.id!,
              relationship,
              client
            );
            relationshipsUpdated++;
          } else {
            // Create new relationship
            await this.createRelationship(relationship, client);
            relationshipsCreated++;
          }
        }
      }

      // Create entity-chunk mappings
      await this.createEntityChunkMappings(
        processedEntities,
        result.extractionMetadata,
        client
      );

      await client.query("COMMIT");

      console.log(
        `✅ Knowledge graph updated: ${entitiesCreated} entities created, ${entitiesUpdated} updated, ${relationshipsCreated} relationships created`
      );

      return {
        entitiesCreated,
        entitiesUpdated,
        relationshipsCreated,
        relationshipsUpdated,
        duplicatesFound,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Failed to process extraction result:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find duplicate entities using multiple similarity methods
   */
  async findDuplicateEntities(
    entity: KnowledgeGraphEntity,
    client: PoolClient
  ): Promise<EntitySimilarity[]> {
    const similarities: EntitySimilarity[] = [];

    // 1. Exact name match
    const exactMatches = await this.findExactNameMatches(entity.name, client);
    similarities.push(
      ...exactMatches.map((e) => ({
        entity: e,
        similarity: 1.0,
        method: "fuzzy" as const,
      }))
    );

    // 2. Canonical name match
    const canonicalMatches = await this.findCanonicalNameMatches(
      entity.canonicalName,
      client
    );
    similarities.push(
      ...canonicalMatches.map((e) => ({
        entity: e,
        similarity: 0.95,
        method: "fuzzy" as const,
      }))
    );

    // 3. Alias matches
    for (const alias of entity.aliases) {
      const aliasMatches = await this.findAliasMatches(alias, client);
      similarities.push(
        ...aliasMatches.map((e) => ({
          entity: e,
          similarity: 0.9,
          method: "fuzzy" as const,
        }))
      );
    }

    // 4. Fuzzy text similarity
    const fuzzyMatches = await this.findFuzzyMatches(
      entity.name,
      entity.type,
      client
    );
    similarities.push(...fuzzyMatches);

    // 5. Vector similarity (if embedding available)
    if (entity.embedding) {
      const vectorMatches = await this.findVectorSimilarMatches(
        entity.embedding,
        entity.type,
        client
      );
      similarities.push(...vectorMatches);
    }

    // Deduplicate and sort by similarity
    const uniqueSimilarities = this.deduplicateSimilarities(similarities);
    return uniqueSimilarities
      .filter((s) => s.similarity >= this.similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Generate embedding for entity
   */
  private async generateEntityEmbedding(
    entity: KnowledgeGraphEntity
  ): Promise<number[]> {
    // Combine entity name, aliases, and type for embedding
    const text = [
      entity.name,
      ...entity.aliases,
      entity.type.toLowerCase(),
    ].join(" ");

    const result = await this.embeddings.embedWithStrategy(text);
    return result.embedding;
  }

  /**
   * Create new entity in database
   */
  private async createEntity(
    entity: KnowledgeGraphEntity,
    client: PoolClient
  ): Promise<KnowledgeGraphEntity> {
    const query = `
      INSERT INTO knowledge_graph_entities (
        name, type, aliases, confidence, extraction_confidence, 
        validation_status, embedding, occurrence_count, document_frequency,
        source_files, extraction_methods, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, canonical_name, first_seen, last_updated, last_occurrence
    `;

    const values = [
      entity.name,
      entity.type,
      entity.aliases,
      entity.confidence,
      entity.extractionConfidence,
      entity.validationStatus,
      entity.embedding ? `[${entity.embedding.join(",")}]` : null,
      entity.occurrenceCount,
      entity.documentFrequency,
      entity.sourceFiles,
      entity.extractionMethods,
      JSON.stringify(entity.metadata),
    ];

    const result = await client.query(query, values);
    const row = result.rows[0];

    return {
      ...entity,
      id: row.id,
      canonicalName: row.canonical_name,
      firstSeen: row.first_seen,
      lastUpdated: row.last_updated,
      lastOccurrence: row.last_occurrence,
    };
  }

  /**
   * Update existing entity with new information
   */
  private async updateExistingEntity(
    existingEntity: KnowledgeGraphEntity,
    newEntity: KnowledgeGraphEntity,
    client: PoolClient
  ): Promise<KnowledgeGraphEntity> {
    // Merge aliases
    const mergedAliases = Array.from(
      new Set([...existingEntity.aliases, ...newEntity.aliases])
    );

    // Merge source files
    const mergedSourceFiles = Array.from(
      new Set([...existingEntity.sourceFiles, ...newEntity.sourceFiles])
    );

    // Merge extraction methods
    const mergedExtractionMethods = Array.from(
      new Set([
        ...existingEntity.extractionMethods,
        ...newEntity.extractionMethods,
      ])
    );

    // Update confidence (weighted average)
    const totalOccurrences =
      existingEntity.occurrenceCount + newEntity.occurrenceCount;
    const updatedConfidence =
      (existingEntity.confidence * existingEntity.occurrenceCount +
        newEntity.confidence * newEntity.occurrenceCount) /
      totalOccurrences;

    const query = `
      UPDATE knowledge_graph_entities 
      SET 
        aliases = $2,
        confidence = $3,
        occurrence_count = occurrence_count + $4,
        source_files = $5,
        extraction_methods = $6,
        last_occurrence = NOW(),
        metadata = $7
      WHERE id = $1
      RETURNING *
    `;

    const values = [
      existingEntity.id,
      mergedAliases,
      updatedConfidence,
      newEntity.occurrenceCount,
      mergedSourceFiles,
      mergedExtractionMethods,
      JSON.stringify({
        ...existingEntity.metadata,
        ...newEntity.metadata,
      }),
    ];

    const result = await client.query(query, values);
    return this.mapEntityFromRow(result.rows[0]);
  }

  /**
   * Merge two entities into one
   */
  private async mergeEntities(
    newEntity: KnowledgeGraphEntity,
    existingEntity: KnowledgeGraphEntity,
    client: PoolClient
  ): Promise<KnowledgeGraphEntity> {
    // Use the entity with higher confidence as the base
    const baseEntity =
      existingEntity.confidence >= newEntity.confidence
        ? existingEntity
        : newEntity;
    const mergeEntity =
      existingEntity.confidence >= newEntity.confidence
        ? newEntity
        : existingEntity;

    // Merge all properties
    const mergedEntity: KnowledgeGraphEntity = {
      ...baseEntity,
      aliases: Array.from(
        new Set([
          ...baseEntity.aliases,
          ...mergeEntity.aliases,
          mergeEntity.name,
        ])
      ),
      confidence: Math.max(baseEntity.confidence, mergeEntity.confidence),
      occurrenceCount: baseEntity.occurrenceCount + mergeEntity.occurrenceCount,
      sourceFiles: Array.from(
        new Set([...baseEntity.sourceFiles, ...mergeEntity.sourceFiles])
      ),
      extractionMethods: Array.from(
        new Set([
          ...baseEntity.extractionMethods,
          ...mergeEntity.extractionMethods,
        ])
      ),
      metadata: { ...baseEntity.metadata, ...mergeEntity.metadata },
    };

    // Update the base entity
    await this.updateExistingEntity(baseEntity, mergedEntity, client);

    return mergedEntity;
  }

  /**
   * Create relationship in database
   */
  private async createRelationship(
    relationship: KnowledgeGraphRelationship,
    client: PoolClient
  ): Promise<KnowledgeGraphRelationship> {
    const query = `
      INSERT INTO knowledge_graph_relationships (
        source_entity_id, target_entity_id, type, is_directional,
        confidence, strength, cooccurrence_count, mutual_information,
        pointwise_mutual_information, source_chunk_ids, extraction_context,
        supporting_text, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, created_at, updated_at, last_observed
    `;

    const values = [
      relationship.sourceEntityId,
      relationship.targetEntityId,
      relationship.type,
      relationship.isDirectional,
      relationship.confidence,
      relationship.strength,
      relationship.cooccurrenceCount,
      relationship.mutualInformation,
      relationship.pointwiseMutualInformation,
      relationship.sourceChunkIds,
      relationship.extractionContext,
      relationship.supportingText,
      JSON.stringify(relationship.metadata),
    ];

    const result = await client.query(query, values);
    const row = result.rows[0];

    return {
      ...relationship,
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastObserved: row.last_observed,
    };
  }

  /**
   * Update existing relationship
   */
  private async updateRelationship(
    relationshipId: string,
    newRelationship: KnowledgeGraphRelationship,
    client: PoolClient
  ): Promise<void> {
    const query = `
      UPDATE knowledge_graph_relationships 
      SET 
        confidence = GREATEST(confidence, $2),
        strength = GREATEST(strength, $3),
        cooccurrence_count = cooccurrence_count + $4,
        source_chunk_ids = array_cat(source_chunk_ids, $5),
        supporting_text = array_cat(supporting_text, $6),
        last_observed = NOW(),
        metadata = metadata || $7
      WHERE id = $1
    `;

    const values = [
      relationshipId,
      newRelationship.confidence,
      newRelationship.strength,
      newRelationship.cooccurrenceCount,
      newRelationship.sourceChunkIds,
      newRelationship.supportingText,
      JSON.stringify(newRelationship.metadata),
    ];

    await client.query(query, values);
  }

  /**
   * Create entity-chunk mappings
   */
  private async createEntityChunkMappings(
    entities: KnowledgeGraphEntity[],
    extractionMetadata: any,
    client: PoolClient
  ): Promise<void> {
    for (const entity of entities) {
      if (!entity.id) continue;

      for (const mention of entity.mentionContexts) {
        const query = `
          INSERT INTO entity_chunk_mappings (
            entity_id, chunk_id, mention_text, mention_context,
            start_position, end_position, extraction_method, extraction_confidence
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (entity_id, chunk_id, mention_text) DO NOTHING
        `;

        const values = [
          entity.id,
          mention.chunkId,
          mention.mentionText,
          mention.mentionContext,
          mention.startPosition,
          mention.endPosition,
          mention.extractionMethod,
          mention.extractionConfidence,
        ];

        await client.query(query, values);
      }
    }
  }

  /**
   * Find entities with exact name matches
   */
  private async findExactNameMatches(
    name: string,
    client: PoolClient
  ): Promise<KnowledgeGraphEntity[]> {
    const query = `
      SELECT * FROM knowledge_graph_entities 
      WHERE name ILIKE $1 OR $1 = ANY(aliases)
    `;

    const result = await client.query(query, [name]);
    return result.rows.map((row) => this.mapEntityFromRow(row));
  }

  /**
   * Find entities with canonical name matches
   */
  private async findCanonicalNameMatches(
    canonicalName: string,
    client: PoolClient
  ): Promise<KnowledgeGraphEntity[]> {
    const query = `
      SELECT * FROM knowledge_graph_entities 
      WHERE canonical_name = $1
    `;

    const result = await client.query(query, [canonicalName]);
    return result.rows.map((row) => this.mapEntityFromRow(row));
  }

  /**
   * Find entities with alias matches
   */
  private async findAliasMatches(
    alias: string,
    client: PoolClient
  ): Promise<KnowledgeGraphEntity[]> {
    const query = `
      SELECT * FROM knowledge_graph_entities 
      WHERE $1 = ANY(aliases) OR name ILIKE $1
    `;

    const result = await client.query(query, [alias]);
    return result.rows.map((row) => this.mapEntityFromRow(row));
  }

  /**
   * Find entities with fuzzy text similarity
   */
  private async findFuzzyMatches(
    name: string,
    entityType: EntityType,
    client: PoolClient
  ): Promise<EntitySimilarity[]> {
    const query = `
      SELECT *, similarity(name, $1) as sim_score
      FROM knowledge_graph_entities 
      WHERE type = $2 AND similarity(name, $1) > 0.6
      ORDER BY sim_score DESC
      LIMIT 10
    `;

    const result = await client.query(query, [name, entityType]);
    return result.rows.map((row) => ({
      entity: this.mapEntityFromRow(row),
      similarity: row.sim_score,
      method: "fuzzy" as const,
    }));
  }

  /**
   * Find entities with vector similarity
   */
  private async findVectorSimilarMatches(
    embedding: number[],
    entityType: EntityType,
    client: PoolClient
  ): Promise<EntitySimilarity[]> {
    const query = `
      SELECT *, (embedding <=> $1::vector) as distance
      FROM knowledge_graph_entities 
      WHERE type = $2 AND embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT 10
    `;

    const embeddingVector = `[${embedding.join(",")}]`;
    const result = await client.query(query, [embeddingVector, entityType]);

    return result.rows.map((row) => ({
      entity: this.mapEntityFromRow(row),
      similarity: 1 - row.distance, // Convert distance to similarity
      method: "cosine" as const,
    }));
  }

  /**
   * Find existing relationship between entities
   */
  private async findExistingRelationship(
    sourceEntityId: string,
    targetEntityId: string,
    type: RelationshipType,
    client: PoolClient
  ): Promise<KnowledgeGraphRelationship | null> {
    const query = `
      SELECT * FROM knowledge_graph_relationships 
      WHERE ((source_entity_id = $1 AND target_entity_id = $2) OR
             (source_entity_id = $2 AND target_entity_id = $1 AND NOT is_directional))
        AND type = $3
    `;

    const result = await client.query(query, [
      sourceEntityId,
      targetEntityId,
      type,
    ]);

    if (result.rows.length > 0) {
      return this.mapRelationshipFromRow(result.rows[0]);
    }

    return null;
  }

  /**
   * Get knowledge graph statistics
   */
  async getGraphStatistics(): Promise<GraphStatistics> {
    const client = await this.pool.connect();

    try {
      // Get entity count and type distribution
      const entityStatsQuery = `
        SELECT 
          COUNT(*) as total_entities,
          type,
          COUNT(*) as type_count
        FROM knowledge_graph_entities 
        GROUP BY ROLLUP(type)
      `;

      const entityResult = await client.query(entityStatsQuery);

      // Get relationship count and type distribution
      const relationshipStatsQuery = `
        SELECT 
          COUNT(*) as total_relationships,
          type,
          COUNT(*) as type_count
        FROM knowledge_graph_relationships 
        GROUP BY ROLLUP(type)
      `;

      const relationshipResult = await client.query(relationshipStatsQuery);

      // Calculate average connectivity
      const connectivityQuery = `
        SELECT AVG(connection_count) as avg_connectivity
        FROM (
          SELECT COUNT(*) as connection_count
          FROM knowledge_graph_relationships r
          GROUP BY r.source_entity_id
          UNION ALL
          SELECT COUNT(*) as connection_count
          FROM knowledge_graph_relationships r
          GROUP BY r.target_entity_id
        ) connectivity_counts
      `;

      const connectivityResult = await client.query(connectivityQuery);

      // Build statistics object
      const entityCount =
        entityResult.rows.find((r) => r.type === null)?.total_entities || 0;
      const relationshipCount =
        relationshipResult.rows.find((r) => r.type === null)
          ?.total_relationships || 0;

      const entityTypeDistribution: Record<string, number> = {};
      entityResult.rows
        .filter((r) => r.type !== null)
        .forEach((r) => {
          entityTypeDistribution[r.type] = parseInt(r.type_count);
        });

      const relationshipTypeDistribution: Record<string, number> = {};
      relationshipResult.rows
        .filter((r) => r.type !== null)
        .forEach((r) => {
          relationshipTypeDistribution[r.type] = parseInt(r.type_count);
        });

      const averageConnectivity = parseFloat(
        connectivityResult.rows[0]?.avg_connectivity || "0"
      );

      return {
        entityCount,
        relationshipCount,
        entityTypeDistribution,
        relationshipTypeDistribution,
        averageConnectivity,
        lastUpdated: new Date(),
      };
    } finally {
      client.release();
    }
  }

  /**
   * Utility methods
   */
  private deduplicateSimilarities(
    similarities: EntitySimilarity[]
  ): EntitySimilarity[] {
    const seen = new Set<string>();
    return similarities.filter((s) => {
      if (s.entity.id && seen.has(s.entity.id)) {
        return false;
      }
      if (s.entity.id) {
        seen.add(s.entity.id);
      }
      return true;
    });
  }

  private mapEntityFromRow(row: any): KnowledgeGraphEntity {
    return {
      id: row.id,
      name: row.name,
      canonicalName: row.canonical_name,
      type: row.type as EntityType,
      aliases: row.aliases || [],
      confidence: parseFloat(row.confidence),
      extractionConfidence: parseFloat(row.extraction_confidence),
      validationStatus: row.validation_status,
      embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
      occurrenceCount: row.occurrence_count,
      documentFrequency: row.document_frequency,
      sourceFiles: row.source_files || [],
      extractionMethods: row.extraction_methods || [],
      firstSeen: row.first_seen,
      lastUpdated: row.last_updated,
      lastOccurrence: row.last_occurrence,
      metadata: row.metadata || {},
      mentionContexts: [], // Would need separate query to populate
    };
  }

  private mapRelationshipFromRow(row: any): KnowledgeGraphRelationship {
    return {
      id: row.id,
      sourceEntityId: row.source_entity_id,
      targetEntityId: row.target_entity_id,
      type: row.type as RelationshipType,
      isDirectional: row.is_directional,
      confidence: parseFloat(row.confidence),
      strength: parseFloat(row.strength),
      cooccurrenceCount: row.cooccurrence_count,
      mutualInformation: row.mutual_information
        ? parseFloat(row.mutual_information)
        : undefined,
      pointwiseMutualInformation: row.pointwise_mutual_information
        ? parseFloat(row.pointwise_mutual_information)
        : undefined,
      sourceChunkIds: row.source_chunk_ids || [],
      extractionContext: row.extraction_context,
      supportingText: row.supporting_text || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastObserved: row.last_observed,
      metadata: row.metadata || {},
    };
  }
}
