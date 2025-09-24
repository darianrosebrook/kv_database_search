import { EmbeddingConfig } from "../types/index.js";
export interface EmbeddingModel {
    name: string;
    dimension: number;
    type: "semantic" | "keyword" | "hybrid";
    domain?: string;
    strengths: string[];
    limitations: string[];
}
export interface EmbeddingStrategy {
    primaryModel: EmbeddingModel;
    fallbackModels: EmbeddingModel[];
    contentTypeOverrides: Record<string, EmbeddingModel>;
    qualityThresholds: {
        minSimilarity: number;
        maxResults: number;
    };
}
export declare class ObsidianEmbeddingService {
    private config;
    private cache;
    private strategy;
    private readonly models;
    constructor(config: EmbeddingConfig);
    private createObsidianStrategy;
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[], batchSize?: number): Promise<number[][]>;
    embedWithStrategy(text: string, contentType?: string, domainHint?: string): Promise<{
        embedding: number[];
        model: EmbeddingModel;
        confidence: number;
    }>;
    private selectModelForContent;
    private embedCore;
    private calculateEmbeddingConfidence;
    testConnection(): Promise<{
        success: boolean;
        dimension: number;
        model: string;
    }>;
    clearCache(): void;
    updateStrategy(newStrategy: Partial<EmbeddingStrategy>): void;
    getCurrentStrategy(): EmbeddingStrategy;
    getAvailableModels(): EmbeddingModel[];
    getCacheStats(): {
        size: number;
        keys: string[];
    };
}
