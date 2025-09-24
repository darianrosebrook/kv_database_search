import { ObsidianDatabase } from "./database.js";
import { ObsidianEmbeddingService } from "./embeddings.js";
import { SearchResult, ObsidianSearchOptions, ObsidianSearchResponse } from "../types/index.js";
export declare class ObsidianSearchService {
    private db;
    private embeddings;
    constructor(database: ObsidianDatabase, embeddingService: ObsidianEmbeddingService);
    search(query: string, options?: ObsidianSearchOptions): Promise<ObsidianSearchResponse>;
    private enhanceResults;
    private generateHighlights;
    private findRelatedChunks;
    private generateChunkGraphContext;
    private generateFacets;
    private generateGraphInsights;
    private extractConcepts;
    searchByTag(tag: string, options?: ObsidianSearchOptions): Promise<ObsidianSearchResponse>;
    searchMOCs(query?: string, options?: ObsidianSearchOptions): Promise<ObsidianSearchResponse>;
    searchConversations(query: string, options?: ObsidianSearchOptions): Promise<ObsidianSearchResponse>;
    findRelatedNotes(fileName: string, options?: ObsidianSearchOptions): Promise<ObsidianSearchResponse>;
    exploreKnowledgeCluster(concept: string, options?: ObsidianSearchOptions): Promise<ObsidianSearchResponse>;
    getFileChunks(fileName: string): Promise<SearchResult[]>;
    getStats(): Promise<{
        totalChunks: number;
        byContentType: Record<string, number>;
        byFolder: Record<string, number>;
        tagDistribution: Record<string, number>;
    }>;
}
