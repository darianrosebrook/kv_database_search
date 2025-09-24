// @ts-nocheck
import { ObsidianDatabase } from "./database.js";
import { ObsidianEmbeddingService } from "./embeddings.js";
import { ContentType } from "./multi-modal.js";
export interface MultiModalIngestionConfig {
    batchSize?: number;
    rateLimitMs?: number;
    skipExisting?: boolean;
    includePatterns?: string[];
    excludePatterns?: string[];
    enableOCR?: boolean;
    enableSpeechToText?: boolean;
    maxFileSize?: number;
}
export interface MultiModalIngestionResult {
    totalFiles: number;
    processedFiles: number;
    skippedFiles: number;
    failedFiles: number;
    totalChunks: number;
    processedChunks: number;
    errors: string[];
    contentTypeStats: Record<ContentType, number>;
}
/**
 * Multi-modal content ingestion pipeline
 * Extends the existing ingestion system to handle various file types
 */
export declare class MultiModalIngestionPipeline {
    private db;
    private embeddings;
    private contentDetector;
    private metadataExtractor;
    constructor(database: ObsidianDatabase, embeddingService: ObsidianEmbeddingService);
    ingestFiles(filePaths: string[], config?: MultiModalIngestionConfig): Promise<MultiModalIngestionResult>;
    private processBatch;
    private chunkMultiModalFile;
    private chunkTextFile;
    private chunkPDFFile;
    private chunkOfficeFile;
    private chunkImageFile;
    private chunkAudioFile;
    private chunkVideoFile;
    private chunkStructuredFile;
    private createMetadataOnlyChunk;
    private mapContentType;
    private mapContentTypeToStrategy;
    private generateChunkId;
    private generateBreadcrumbs;
}
