// @ts-nocheck
import { ObsidianDatabase } from "./database.js";
import { ObsidianEmbeddingService } from "./embeddings.js";
export interface ObsidianChunkingOptions {
    maxChunkSize?: number;
    chunkOverlap?: number;
    preserveStructure?: boolean;
    includeContext?: boolean;
    cleanContent?: boolean;
}
export declare class ObsidianIngestionPipeline {
    private db;
    private embeddings;
    private vaultPath;
    constructor(database: ObsidianDatabase, embeddingService: ObsidianEmbeddingService, vaultPath: string);
    ingestVault(options?: {
        batchSize?: number;
        rateLimitMs?: number;
        skipExisting?: boolean;
        includePatterns?: string[];
        excludePatterns?: string[];
        chunkingOptions?: ObsidianChunkingOptions;
    }): Promise<{
        totalFiles: number;
        processedFiles: number;
        totalChunks: number;
        processedChunks: number;
        skippedChunks: number;
        errors: string[];
    }>;
    private discoverMarkdownFiles;
    private matchesPattern;
    private processBatch;
    private parseObsidianFile;
    private parseSections;
    private chunkObsidianFile;
    private chunkByStructure;
    private chunkBySize;
    private createChunk;
    private generateChunkId;
    validateIngestion(sampleSize?: number): Promise<{
        isValid: boolean;
        issues: string[];
        sampleResults: Array<{
            id: string;
            textPreview: string;
            hasEmbedding: boolean;
            metadataValid: boolean;
            obsidianMetadata?: any;
        }>;
    }>;
    private validateObsidianMetadata;
    private generateBreadcrumbs;
}
