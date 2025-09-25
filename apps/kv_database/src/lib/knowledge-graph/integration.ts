import { Pool } from "pg";
import { ObsidianDatabase } from "../database.js";
import { ObsidianEmbeddingService } from "../embeddings.js";
import { MultiModalIngestionPipeline } from "../multi-modal-ingest.js";
import {
  KnowledgeGraphPipeline,
  KnowledgeGraphPipelineConfig,
} from "./knowledge-graph-pipeline.js";
import { ContentType } from "../types/index.js";

export interface KnowledgeGraphIntegrationConfig {
  enableRealTimeProcessing: boolean;
  processingDelay: number; // ms to wait after ingestion before processing
  batchProcessingInterval: number; // ms between batch processing runs
  knowledgeGraphConfig: Partial<KnowledgeGraphPipelineConfig>;
}

/**
 * Integrates knowledge graph construction with existing multi-modal ingestion pipeline
 */
export class KnowledgeGraphIntegration {
  private database: ObsidianDatabase;
  private embeddings: ObsidianEmbeddingService;
  private knowledgeGraphPipeline: KnowledgeGraphPipeline;
  private config: KnowledgeGraphIntegrationConfig;
  private processingQueue: Set<string> = new Set();
  private batchProcessingTimer?: NodeJS.Timeout;

  constructor(
    database: ObsidianDatabase,
    embeddings: ObsidianEmbeddingService,
    config: Partial<KnowledgeGraphIntegrationConfig> = {}
  ) {
    this.database = database;
    this.embeddings = embeddings;

    this.config = {
      enableRealTimeProcessing: true,
      processingDelay: 5000, // 5 seconds
      batchProcessingInterval: 60000, // 1 minute
      knowledgeGraphConfig: {},
      ...config,
    };

    // Get the underlying pool from the database
    const pool = (this.database as any).pool as Pool;

    this.knowledgeGraphPipeline = new KnowledgeGraphPipeline(
      pool,
      embeddings,
      this.config.knowledgeGraphConfig
    );

    // Start batch processing if enabled
    if (this.config.enableRealTimeProcessing) {
      this.startBatchProcessing();
    }
  }

  /**
   * Enhanced multi-modal ingestion pipeline with knowledge graph integration
   */
  createEnhancedIngestionPipeline(): MultiModalIngestionPipeline {
    const originalPipeline = new MultiModalIngestionPipeline(
      this.database,
      this.embeddings
    );

    // Wrap the original ingestFiles method to add knowledge graph processing
    const originalIngestFiles =
      originalPipeline.ingestFiles.bind(originalPipeline);

    originalPipeline.ingestFiles = async (
      filePaths: string[],
      options: any = {}
    ) => {
      console.log("🔗 Enhanced ingestion with knowledge graph integration");

      // Run original ingestion
      const result = await originalIngestFiles(filePaths, options);

      // Queue knowledge graph processing if enabled
      if (this.config.enableRealTimeProcessing && result.processedFiles > 0) {
        console.log(
          "📊 Queueing knowledge graph processing for ingested files"
        );

        // Add files to processing queue with delay
        setTimeout(() => {
          this.queueFilesForProcessing(filePaths);
        }, this.config.processingDelay);
      }

      return result;
    };

    return originalPipeline;
  }

  /**
   * Process all unprocessed chunks in the knowledge graph
   */
  async processAllUnprocessedChunks(): Promise<{
    totalProcessed: number;
    entitiesCreated: number;
    relationshipsCreated: number;
    processingTime: number;
  }> {
    console.log(
      "🚀 Processing all unprocessed chunks for knowledge graph construction"
    );

    const result = await this.knowledgeGraphPipeline.processExistingChunks({
      onlyUnprocessed: true,
    });

    return {
      totalProcessed: result.processedChunks,
      entitiesCreated: result.entitiesCreated,
      relationshipsCreated: result.relationshipsCreated,
      processingTime: result.processingTime,
    };
  }

  /**
   * Process chunks for specific files
   */
  async processFilesForKnowledgeGraph(filePaths: string[]): Promise<{
    totalProcessed: number;
    entitiesCreated: number;
    relationshipsCreated: number;
    processingTime: number;
  }> {
    console.log(
      `🔍 Processing ${filePaths.length} files for knowledge graph construction`
    );

    const result = await this.knowledgeGraphPipeline.processExistingChunks({
      sourceFiles: filePaths,
      onlyUnprocessed: true,
    });

    return {
      totalProcessed: result.processedChunks,
      entitiesCreated: result.entitiesCreated,
      relationshipsCreated: result.relationshipsCreated,
      processingTime: result.processingTime,
    };
  }

  /**
   * Process chunks by content type
   */
  async processContentTypeForKnowledgeGraph(
    contentTypes: ContentType[]
  ): Promise<{
    totalProcessed: number;
    entitiesCreated: number;
    relationshipsCreated: number;
    processingTime: number;
  }> {
    console.log(
      `📋 Processing content types [${contentTypes.join(
        ", "
      )}] for knowledge graph construction`
    );

    const result = await this.knowledgeGraphPipeline.processExistingChunks({
      contentTypes,
      onlyUnprocessed: true,
    });

    return {
      totalProcessed: result.processedChunks,
      entitiesCreated: result.entitiesCreated,
      relationshipsCreated: result.relationshipsCreated,
      processingTime: result.processingTime,
    };
  }

  /**
   * Get comprehensive knowledge graph statistics
   */
  async getKnowledgeGraphStatistics() {
    const stats = await this.knowledgeGraphPipeline.getStatistics();
    const consistency = await this.knowledgeGraphPipeline.validateConsistency();

    return {
      ...stats,
      consistency,
    };
  }

  /**
   * Validate knowledge graph consistency
   */
  async validateKnowledgeGraphConsistency() {
    return await this.knowledgeGraphPipeline.validateConsistency();
  }

  /**
   * Queue files for knowledge graph processing
   */
  private queueFilesForProcessing(filePaths: string[]): void {
    for (const filePath of filePaths) {
      this.processingQueue.add(filePath);
    }

    console.log(
      `📥 Queued ${filePaths.length} files for knowledge graph processing (queue size: ${this.processingQueue.size})`
    );
  }

  /**
   * Start batch processing timer
   */
  private startBatchProcessing(): void {
    this.batchProcessingTimer = setInterval(async () => {
      if (this.processingQueue.size > 0) {
        console.log(
          `🔄 Starting batch knowledge graph processing: ${this.processingQueue.size} files queued`
        );

        const filesToProcess = Array.from(this.processingQueue);
        this.processingQueue.clear();

        try {
          const result = await this.processFilesForKnowledgeGraph(
            filesToProcess
          );
          console.log(
            `✅ Batch processing complete: ${result.totalProcessed} chunks processed, ${result.entitiesCreated} entities created`
          );
        } catch (error) {
          console.error("❌ Batch processing failed:", error);

          // Re-queue files for retry
          for (const file of filesToProcess) {
            this.processingQueue.add(file);
          }
        }
      }
    }, this.config.batchProcessingInterval);

    console.log(
      `⏰ Started batch processing timer (interval: ${this.config.batchProcessingInterval}ms)`
    );
  }

  /**
   * Stop batch processing
   */
  stopBatchProcessing(): void {
    if (this.batchProcessingTimer) {
      clearInterval(this.batchProcessingTimer);
      this.batchProcessingTimer = undefined;
      console.log("⏹️ Stopped batch processing timer");
    }
  }

  /**
   * Force process queued files immediately
   */
  async flushProcessingQueue(): Promise<void> {
    if (this.processingQueue.size > 0) {
      console.log(
        `🚀 Flushing processing queue: ${this.processingQueue.size} files`
      );

      const filesToProcess = Array.from(this.processingQueue);
      this.processingQueue.clear();

      await this.processFilesForKnowledgeGraph(filesToProcess);
    }
  }

  /**
   * Get processing queue status
   */
  getProcessingQueueStatus(): {
    queueSize: number;
    queuedFiles: string[];
    isProcessingEnabled: boolean;
  } {
    return {
      queueSize: this.processingQueue.size,
      queuedFiles: Array.from(this.processingQueue),
      isProcessingEnabled: this.config.enableRealTimeProcessing,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<KnowledgeGraphIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart batch processing if interval changed
    if (newConfig.batchProcessingInterval && this.batchProcessingTimer) {
      this.stopBatchProcessing();
      if (this.config.enableRealTimeProcessing) {
        this.startBatchProcessing();
      }
    }

    console.log("⚙️ Updated knowledge graph integration configuration");
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.stopBatchProcessing();

    // Process any remaining queued files
    if (this.processingQueue.size > 0) {
      console.log("🧹 Processing remaining queued files before cleanup");
      await this.flushProcessingQueue();
    }

    console.log("✅ Knowledge graph integration cleanup complete");
  }
}

/**
 * Factory function to create enhanced ingestion pipeline with knowledge graph integration
 */
export function createEnhancedIngestionPipeline(
  database: ObsidianDatabase,
  embeddings: ObsidianEmbeddingService,
  config: Partial<KnowledgeGraphIntegrationConfig> = {}
): {
  pipeline: MultiModalIngestionPipeline;
  knowledgeGraph: KnowledgeGraphIntegration;
} {
  const knowledgeGraph = new KnowledgeGraphIntegration(
    database,
    embeddings,
    config
  );
  const pipeline = knowledgeGraph.createEnhancedIngestionPipeline();

  return {
    pipeline,
    knowledgeGraph,
  };
}

/**
 * Utility function to bootstrap knowledge graph from existing data
 */
export async function bootstrapKnowledgeGraphFromExistingData(
  database: ObsidianDatabase,
  embeddings: ObsidianEmbeddingService,
  options: {
    contentTypes?: ContentType[];
    batchSize?: number;
    maxChunks?: number;
  } = {}
): Promise<{
  totalProcessed: number;
  entitiesCreated: number;
  relationshipsCreated: number;
  processingTime: number;
}> {
  console.log("🚀 Bootstrapping knowledge graph from existing data");

  const pool = (database as any).pool as Pool;
  const pipeline = new KnowledgeGraphPipeline(pool, embeddings, {
    processing: {
      batchSize: options.batchSize || 20,
      maxConcurrentExtractions: 5,
    },
  });

  const result = await pipeline.processExistingChunks({
    contentTypes: options.contentTypes,
    limit: options.maxChunks,
    onlyUnprocessed: true,
  });

  console.log(`✅ Knowledge graph bootstrap complete:`);
  console.log(`   📊 Processed: ${result.processedChunks} chunks`);
  console.log(
    `   👥 Entities: ${result.entitiesCreated} created, ${result.entitiesUpdated} updated`
  );
  console.log(
    `   🔗 Relationships: ${result.relationshipsCreated} created, ${result.relationshipsUpdated} updated`
  );
  console.log(
    `   ⏱️ Processing time: ${(result.processingTime / 1000).toFixed(1)}s`
  );

  return {
    totalProcessed: result.processedChunks,
    entitiesCreated: result.entitiesCreated,
    relationshipsCreated: result.relationshipsCreated,
    processingTime: result.processingTime,
  };
}
