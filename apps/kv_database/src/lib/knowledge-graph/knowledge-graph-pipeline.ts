import { Pool } from "pg";
import { ObsidianEmbeddingService } from "../embeddings.js";
import { ContentType } from "../types/index.js";
import {
  KnowledgeGraphEntityExtractor,
  EntityExtractionConfig,
  ExtractionMethod,
} from "./entity-extractor";
import { KnowledgeGraph } from "./knowledge-graph-manager.js";

export interface KnowledgeGraphPipelineConfig {
  entityExtraction: Partial<EntityExtractionConfig>;
  knowledgeGraph: {
    similarityThreshold?: number;
    enableAutoMerge?: boolean;
  };
  processing: {
    batchSize?: number;
    maxConcurrentExtractions?: number;
    enableRealTimeUpdates?: boolean;
  };
}

export interface PipelineProcessingResult {
  totalChunks: number;
  processedChunks: number;
  skippedChunks: number;
  failedChunks: number;
  entitiesCreated: number;
  entitiesUpdated: number;
  relationshipsCreated: number;
  relationshipsUpdated: number;
  duplicatesFound: number;
  processingTime: number;
  errors: string[];
}

export interface ChunkProcessingInput {
  chunkId: string;
  text: string;
  contentType: ContentType;
  sourceFile: string;
  metadata?: Record<string, unknown>;
}

/**
 * Main pipeline for knowledge graph construction from multi-modal content
 * Integrates entity extraction, deduplication, and graph management
 */
export class KnowledgeGraphPipeline {
  private entityExtractor: KnowledgeGraphEntityExtractor;
  private graphManager: KnowledgeGraph;
  private config: KnowledgeGraphPipelineConfig;
  private pool: Pool;
  private embeddings: ObsidianEmbeddingService;

  constructor(
    pool: Pool,
    embeddings: ObsidianEmbeddingService,
    config: Partial<KnowledgeGraphPipelineConfig> = {}
  ) {
    this.pool = pool;
    this.embeddings = embeddings;

    this.config = {
      entityExtraction: {
        minEntityConfidence: 0.7,
        minRelationshipConfidence: 0.5,
        enableRelationshipInference: true,
        maxEntitiesPerChunk: 50,
        enableEntityLinking: true,
        enableCooccurrenceAnalysis: true,
        contextWindowSize: 200,
        ...config.entityExtraction,
      },
      knowledgeGraph: {
        similarityThreshold: 0.8,
        enableAutoMerge: false,
        ...config.knowledgeGraph,
      },
      processing: {
        batchSize: 10,
        maxConcurrentExtractions: 3,
        enableRealTimeUpdates: true,
        ...config.processing,
      },
    };

    this.entityExtractor = new KnowledgeGraphEntityExtractor(
      this.config.entityExtraction
    );
    this.graphManager = new KnowledgeGraph(
      pool,
      embeddings,
      this.config.knowledgeGraph
    );
  }

  /**
   * Process multiple chunks and update knowledge graph
   */
  async processChunks(
    chunks: ChunkProcessingInput[]
  ): Promise<PipelineProcessingResult> {
    const startTime = performance.now();

    console.log(
      `🚀 Starting knowledge graph pipeline: ${chunks.length} chunks`
    );

    const result: PipelineProcessingResult = {
      totalChunks: chunks.length,
      processedChunks: 0,
      skippedChunks: 0,
      failedChunks: 0,
      entitiesCreated: 0,
      entitiesUpdated: 0,
      relationshipsCreated: 0,
      relationshipsUpdated: 0,
      duplicatesFound: 0,
      processingTime: 0,
      errors: [],
    };

    // Process chunks in batches
    const batchSize = this.config.processing.batchSize!;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      console.log(
        `📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          chunks.length / batchSize
        )}`
      );

      const batchResults = await this.processBatch(batch);

      // Aggregate results
      result.processedChunks += batchResults.processedChunks;
      result.skippedChunks += batchResults.skippedChunks;
      result.failedChunks += batchResults.failedChunks;
      result.entitiesCreated += batchResults.entitiesCreated;
      result.entitiesUpdated += batchResults.entitiesUpdated;
      result.relationshipsCreated += batchResults.relationshipsCreated;
      result.relationshipsUpdated += batchResults.relationshipsUpdated;
      result.duplicatesFound += batchResults.duplicatesFound;
      result.errors.push(...batchResults.errors);
    }

    result.processingTime = performance.now() - startTime;

    console.log(
      `✅ Knowledge graph pipeline complete: ${result.processedChunks}/${result.totalChunks} chunks processed`
    );
    console.log(
      `   📊 Entities: ${result.entitiesCreated} created, ${result.entitiesUpdated} updated`
    );
    console.log(
      `   🔗 Relationships: ${result.relationshipsCreated} created, ${result.relationshipsUpdated} updated`
    );
    console.log(`   🔍 Duplicates found: ${result.duplicatesFound}`);

    return result;
  }

  /**
   * Process a single batch of chunks
   */
  private async processBatch(
    batch: ChunkProcessingInput[]
  ): Promise<PipelineProcessingResult> {
    const batchResult: PipelineProcessingResult = {
      totalChunks: batch.length,
      processedChunks: 0,
      skippedChunks: 0,
      failedChunks: 0,
      entitiesCreated: 0,
      entitiesUpdated: 0,
      relationshipsCreated: 0,
      relationshipsUpdated: 0,
      duplicatesFound: 0,
      processingTime: 0,
      errors: [],
    };

    // Process chunks concurrently within batch
    const maxConcurrent = this.config.processing.maxConcurrentExtractions!;
    const semaphore = new Array(maxConcurrent).fill(null);

    const processingPromises = batch.map(async (chunk, _index) => {
      // Wait for available slot
      await new Promise((resolve) => {
        const checkSlot = () => {
          const availableIndex = semaphore.findIndex((slot) => slot === null);
          if (availableIndex !== -1) {
            semaphore[availableIndex] = chunk.chunkId;
            resolve(availableIndex);
          } else {
            setTimeout(checkSlot, 10);
          }
        };
        checkSlot();
      }).then(async (slotIndex) => {
        try {
          const chunkResult = await this.processChunk(chunk);

          // Update batch results
          if (chunkResult.success) {
            batchResult.processedChunks++;
            batchResult.entitiesCreated += chunkResult.entitiesCreated;
            batchResult.entitiesUpdated += chunkResult.entitiesUpdated;
            batchResult.relationshipsCreated +=
              chunkResult.relationshipsCreated;
            batchResult.relationshipsUpdated +=
              chunkResult.relationshipsUpdated;
            batchResult.duplicatesFound += chunkResult.duplicatesFound;
          } else {
            batchResult.failedChunks++;
            if (chunkResult.error) {
              batchResult.errors.push(
                `Chunk ${chunk.chunkId}: ${chunkResult.error}`
              );
            }
          }
        } catch (error) {
          batchResult.failedChunks++;
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          batchResult.errors.push(`Chunk ${chunk.chunkId}: ${errorMessage}`);
        } finally {
          // Release slot
          semaphore[slotIndex] = null;
        }
      });
    });

    await Promise.all(processingPromises);
    return batchResult;
  }

  /**
   * Process a single chunk
   */
  private async processChunk(chunk: ChunkProcessingInput): Promise<{
    success: boolean;
    entitiesCreated: number;
    entitiesUpdated: number;
    relationshipsCreated: number;
    relationshipsUpdated: number;
    duplicatesFound: number;
    error?: string;
  }> {
    try {
      // Skip if chunk is too short or empty
      if (!chunk.text || chunk.text.trim().length < 10) {
        return {
          success: false,
          entitiesCreated: 0,
          entitiesUpdated: 0,
          relationshipsCreated: 0,
          relationshipsUpdated: 0,
          duplicatesFound: 0,
          error: "Chunk text too short or empty",
        };
      }

      // Determine extraction method based on content type
      const extractionMethod = this.getExtractionMethod(chunk.contentType);

      // Extract entities and relationships
      const extractionResult = await this.entityExtractor.extractFromText(
        chunk.text,
        {
          contentType: chunk.contentType,
          sourceFile: chunk.sourceFile,
          chunkId: chunk.chunkId,
          extractionMethod,
        }
      );

      // Skip if no entities found
      if (extractionResult.entities.length === 0) {
        return {
          success: true,
          entitiesCreated: 0,
          entitiesUpdated: 0,
          relationshipsCreated: 0,
          relationshipsUpdated: 0,
          duplicatesFound: 0,
        };
      }

      // Process extraction result through knowledge graph manager
      const graphResult = await this.graphManager.processExtractionResult(
        extractionResult
      );

      return {
        success: true,
        entitiesCreated: graphResult.entitiesCreated,
        entitiesUpdated: graphResult.entitiesUpdated,
        relationshipsCreated: graphResult.relationshipsCreated,
        relationshipsUpdated: graphResult.relationshipsUpdated,
        duplicatesFound: graphResult.duplicatesFound,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `❌ Failed to process chunk ${chunk.chunkId}:`,
        errorMessage
      );

      return {
        success: false,
        entitiesCreated: 0,
        entitiesUpdated: 0,
        relationshipsCreated: 0,
        relationshipsUpdated: 0,
        duplicatesFound: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Process content from existing obsidian_chunks table
   */
  async processExistingChunks(
    options: {
      limit?: number;
      offset?: number;
      contentTypes?: ContentType[];
      sourceFiles?: string[];
      onlyUnprocessed?: boolean;
    } = {}
  ): Promise<PipelineProcessingResult> {
    const client = await this.pool.connect();

    try {
      // Build query to fetch chunks
      let query = `
        SELECT 
          c.id,
          c.content as text,
          c.meta->>'contentType' as content_type,
          c.meta->>'sourceFile' as source_file,
          c.meta
        FROM obsidian_chunks c
      `;

      const conditions: string[] = [];
      const values = [];
      let paramIndex = 1;

      // Add content type filter
      if (options.contentTypes && options.contentTypes.length > 0) {
        conditions.push(`c.meta->>'contentType' = ANY($${paramIndex})`);
        values.push(options.contentTypes);
        paramIndex++;
      }

      // Add source file filter
      if (options.sourceFiles && options.sourceFiles.length > 0) {
        conditions.push(`c.meta->>'sourceFile' = ANY($${paramIndex})`);
        values.push(options.sourceFiles);
        paramIndex++;
      }

      // Add unprocessed filter
      if (options.onlyUnprocessed) {
        conditions.push(`NOT EXISTS (
          SELECT 1 FROM entity_chunk_mappings ecm 
          WHERE ecm.chunk_id = c.id
        )`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }

      query += ` ORDER BY c.created_at DESC`;

      if (options.limit) {
        query += ` LIMIT $${paramIndex}`;
        values.push(options.limit);
        paramIndex++;
      }

      if (options.offset) {
        query += ` OFFSET $${paramIndex}`;
        values.push(options.offset);
      }

      console.log(`🔍 Querying existing chunks with filters...`);
      const result = await client.query(query, values);

      console.log(`📊 Found ${result.rows.length} chunks to process`);

      // Convert rows to processing input format
      const chunks: ChunkProcessingInput[] = result.rows.map((row) => ({
        chunkId: row.id,
        text: row.text,
        contentType: row.content_type as ContentType,
        sourceFile: row.source_file,
        metadata: row.meta,
      }));

      // Process the chunks
      return await this.processChunks(chunks);
    } finally {
      client.release();
    }
  }

  /**
   * Get knowledge graph statistics
   */
  async getStatistics() {
    return await this.graphManager.getGraphStatistics();
  }

  /**
   * Validate knowledge graph consistency
   */
  async validateConsistency(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const client = await this.pool.connect();

    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check for orphaned relationships
      const orphanedRelQuery = `
        SELECT COUNT(*) as count
        FROM knowledge_graph_relationships r
        WHERE NOT EXISTS (
          SELECT 1 FROM knowledge_graph_entities e 
          WHERE e.id = r.source_entity_id
        ) OR NOT EXISTS (
          SELECT 1 FROM knowledge_graph_entities e 
          WHERE e.id = r.target_entity_id
        )
      `;

      const orphanedResult = await client.query(orphanedRelQuery);
      const orphanedCount = parseInt(orphanedResult.rows[0].count);

      if (orphanedCount > 0) {
        errors.push(`Found ${orphanedCount} orphaned relationships`);
      }

      // Check for entities with very low confidence
      const lowConfidenceQuery = `
        SELECT COUNT(*) as count
        FROM knowledge_graph_entities
        WHERE confidence < 0.5
      `;

      const lowConfidenceResult = await client.query(lowConfidenceQuery);
      const lowConfidenceCount = parseInt(lowConfidenceResult.rows[0].count);

      if (lowConfidenceCount > 0) {
        warnings.push(
          `Found ${lowConfidenceCount} entities with confidence < 0.5`
        );
      }

      // Check for duplicate canonical names
      const duplicateNamesQuery = `
        SELECT canonical_name, COUNT(*) as count
        FROM knowledge_graph_entities
        GROUP BY canonical_name
        HAVING COUNT(*) > 1
      `;

      const duplicateNamesResult = await client.query(duplicateNamesQuery);

      if (duplicateNamesResult.rows.length > 0) {
        warnings.push(
          `Found ${duplicateNamesResult.rows.length} duplicate canonical names`
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Determine extraction method based on content type
   */
  private getExtractionMethod(contentType: ContentType): ExtractionMethod {
    const methodMapping: Record<ContentType, ExtractionMethod> = {
      [ContentType.PDF]: ExtractionMethod.TEXT_EXTRACTION,
      [ContentType.VIDEO]: ExtractionMethod.SPEECH_TO_TEXT,
      [ContentType.AUDIO]: ExtractionMethod.SPEECH_TO_TEXT,
      [ContentType.RASTER_IMAGE]: ExtractionMethod.OCR,
      [ContentType.VECTOR_IMAGE]: ExtractionMethod.OCR,
      [ContentType.DOCUMENT_IMAGE]: ExtractionMethod.OCR,
      [ContentType.MARKDOWN]: ExtractionMethod.TEXT_EXTRACTION,
      [ContentType.PLAIN_TEXT]: ExtractionMethod.TEXT_EXTRACTION,
      [ContentType.RICH_TEXT]: ExtractionMethod.TEXT_EXTRACTION,
      [ContentType.OFFICE_DOC]: ExtractionMethod.TEXT_EXTRACTION,
      [ContentType.OFFICE_SHEET]: ExtractionMethod.TEXT_EXTRACTION,
      [ContentType.OFFICE_PRESENTATION]: ExtractionMethod.TEXT_EXTRACTION,
      [ContentType.HTML]: ExtractionMethod.TEXT_EXTRACTION,
      [ContentType.CSV]: ExtractionMethod.TEXT_EXTRACTION,
      [ContentType.JSON]: ExtractionMethod.TEXT_EXTRACTION,
      [ContentType.XML]: ExtractionMethod.TEXT_EXTRACTION,
      [ContentType.BINARY]: ExtractionMethod.MANUAL,
      [ContentType.UNKNOWN]: ExtractionMethod.TEXT_EXTRACTION,
    };

    return methodMapping[contentType] || ExtractionMethod.TEXT_EXTRACTION;
  }
}
