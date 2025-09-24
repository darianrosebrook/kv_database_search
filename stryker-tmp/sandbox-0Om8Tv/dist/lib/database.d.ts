// @ts-nocheck
import { DocumentChunk, SearchResult } from "../types/index.js";
export declare class ObsidianDatabase {
    private pool;
    private readonly tableName;
    private readonly dimension;
    constructor(connectionString: string);
    initialize(): Promise<void>;
    upsertChunk(chunk: DocumentChunk): Promise<void>;
    batchUpsertChunks(chunks: DocumentChunk[]): Promise<void>;
    search(queryEmbedding: number[], limit?: number, options?: {
        fileTypes?: string[];
        tags?: string[];
        folders?: string[];
        hasWikilinks?: boolean;
        dateRange?: {
            start?: Date;
            end?: Date;
        };
        minSimilarity?: number;
    }): Promise<SearchResult[]>;
    getChunkById(id: string): Promise<DocumentChunk | null>;
    getChunksByFile(fileName: string): Promise<DocumentChunk[]>;
    getStats(): Promise<{
        totalChunks: number;
        byContentType: Record<string, number>;
        byFolder: Record<string, number>;
        tagDistribution: Record<string, number>;
    }>;
    clearAll(): Promise<void>;
    deleteChunksByFile(fileName: string): Promise<void>;
    close(): Promise<void>;
}
