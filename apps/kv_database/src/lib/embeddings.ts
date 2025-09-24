import ollama from "ollama";
import { EmbeddingConfig } from "../types/index";
import { normalize, normalizeVector } from "./utils";

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

export class ObsidianEmbeddingService {
  private config: EmbeddingConfig;
  private cache: Map<string, number[]> = new Map();
  private strategy: EmbeddingStrategy;
  private performanceMetrics: {
    embedLatency: number[];
    cacheHits: number;
    cacheMisses: number;
    totalRequests: number;
    slowEmbeds: number;
  } = {
    embedLatency: [],
    cacheHits: 0,
    cacheMisses: 0,
    totalRequests: 0,
    slowEmbeds: 0,
  };

  // Obsidian-optimized embedding models
  private readonly models: EmbeddingModel[] = [
    {
      name: "embeddinggemma",
      dimension: 768,
      type: "semantic",
      domain: "knowledge-base",
      strengths: [
        "Fast inference",
        "Good for knowledge management",
        "Handles markdown well",
      ],
      limitations: [
        "Limited domain knowledge",
        "May not capture technical terms well",
      ],
    },
    {
      name: "nomic-embed-text",
      dimension: 768,
      type: "semantic",
      domain: "general",
      strengths: [
        "Excellent for general text",
        "Good performance on knowledge tasks",
        "Handles long documents well",
      ],
      limitations: [
        "Larger model, slower inference",
        "May be overkill for simple queries",
      ],
    },
  ];

  constructor(config: EmbeddingConfig) {
    this.config = config;
    this.strategy = this.createObsidianStrategy();
  }

  private createObsidianStrategy(): EmbeddingStrategy {
    return {
      primaryModel:
        this.models.find((m) => m.name === this.config.model) || this.models[0],
      fallbackModels: this.models.filter((m) => m.name !== this.config.model),
      contentTypeOverrides: {
        // Obsidian-specific content type optimizations
        moc: this.models.find((m) => m.name === "embeddinggemma")!,
        article: this.models.find((m) => m.name === "embeddinggemma")!,
        conversation: this.models.find((m) => m.name === "embeddinggemma")!,
        "book-note": this.models.find((m) => m.name === "embeddinggemma")!,
        note: this.models.find((m) => m.name === "embeddinggemma")!,
      },
      qualityThresholds: {
        minSimilarity: 0.3,
        maxResults: 30,
      },
    };
  }

  async embed(text: string): Promise<number[]> {
    const normalizedText = normalize(text);

    // Check cache first
    const cacheKey = `${this.config.model}:${normalizedText}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const response = await ollama.embed({
        model: this.config.model,
        input: normalizedText,
      });

      if (!response.embeddings || response.embeddings.length === 0) {
        throw new Error("No embeddings returned from Ollama");
      }

      const embedding = response.embeddings[0];

      // Validate dimension
      if (embedding.length !== this.config.dimension) {
        throw new Error(
          `Embedding dimension mismatch: expected ${this.config.dimension}, got ${embedding.length}`
        );
      }

      // Normalize the embedding vector for consistent cosine similarity scores
      const normalizedEmbedding = normalizeVector(embedding);

      // Cache the normalized result
      this.cache.set(cacheKey, normalizedEmbedding);

      return normalizedEmbedding;
    } catch (error) {
      console.error(`❌ Failed to embed text: ${error}`);
      throw new Error(`Embedding failed: ${error}`);
    }
  }

  async embedBatch(texts: string[], batchSize = 5): Promise<number[][]> {
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const promises = batch.map((text) => this.embed(text));
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);

      // Rate limiting - small delay between batches
      if (i + batchSize < texts.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  async embedWithStrategy(
    text: string,
    contentType?: string,
    domainHint?: string
  ): Promise<{
    embedding: number[];
    model: EmbeddingModel;
    confidence: number;
  }> {
    const startTime = performance.now();
    this.performanceMetrics.totalRequests++;

    const normalizedText = normalize(text);

    // Select appropriate model based on content type and domain
    const selectedModel = this.selectModelForContent(contentType, domainHint);

    // Check cache with model-specific key
    const cacheKey = `${selectedModel.name}:${normalizedText}`;
    if (this.cache.has(cacheKey)) {
      this.performanceMetrics.cacheHits++;
      const endTime = performance.now();
      this.performanceMetrics.embedLatency.push(endTime - startTime);
      return {
        embedding: this.cache.get(cacheKey)!,
        model: selectedModel,
        confidence: 1.0, // Cached result
      };
    }

    this.performanceMetrics.cacheMisses++;

    try {
      // Temporarily switch model if different from current
      const originalModel = this.config.model;
      this.config.model = selectedModel.name;

      const embedding = await this.embedCore(normalizedText);

      // Restore original model
      this.config.model = originalModel;

      // Cache with model-specific key
      this.cache.set(cacheKey, embedding);

      // Calculate confidence based on embedding quality metrics
      const confidence = this.calculateEmbeddingConfidence(
        embedding,
        normalizedText
      );

      // Performance monitoring
      const endTime = performance.now();
      const latency = endTime - startTime;
      this.performanceMetrics.embedLatency.push(latency);

      // Track slow embeddings (over 1000ms target for embedding)
      if (latency > 1000) {
        this.performanceMetrics.slowEmbeds++;
        console.warn(
          `⚠️ Slow embedding detected: ${latency.toFixed(2)}ms (target: 1000ms)`
        );
      }

      // Keep only last 1000 measurements for memory efficiency
      if (this.performanceMetrics.embedLatency.length > 1000) {
        this.performanceMetrics.embedLatency =
          this.performanceMetrics.embedLatency.slice(-500);
      }

      return {
        embedding,
        model: selectedModel,
        confidence,
      };
    } catch (error) {
      console.warn(
        `Failed to embed with ${selectedModel.name}, trying fallback...`
      );

      // Try fallback models
      for (const fallbackModel of this.strategy.fallbackModels) {
        try {
          const originalModel = this.config.model;
          this.config.model = fallbackModel.name;

          const embedding = await this.embedCore(normalizedText);
          this.config.model = originalModel;

          const confidence = this.calculateEmbeddingConfidence(
            embedding,
            normalizedText
          );

          return {
            embedding,
            model: fallbackModel,
            confidence: confidence * 0.8, // Penalty for fallback
          };
        } catch (fallbackError) {
          console.warn(`Fallback model ${fallbackModel.name} also failed`);
        }
      }

      throw new Error(
        `All embedding models failed for text: ${normalizedText.slice(
          0,
          50
        )}...`
      );
    }
  }

  private selectModelForContent(
    contentType?: string,
    domainHint?: string
  ): EmbeddingModel {
    // Content-type specific overrides for Obsidian
    if (contentType && this.strategy.contentTypeOverrides[contentType]) {
      return this.strategy.contentTypeOverrides[contentType];
    }

    // Domain-specific selection
    if (domainHint) {
      const domainModel = this.models.find(
        (m) => m.domain === domainHint || m.name.includes(domainHint)
      );
      if (domainModel) return domainModel;
    }

    // Default to primary model
    return this.strategy.primaryModel;
  }

  private async embedCore(text: string): Promise<number[]> {
    const response = await ollama.embed({
      model: this.config.model,
      input: text,
    });

    if (!response.embeddings || response.embeddings.length === 0) {
      throw new Error("No embeddings returned from Ollama");
    }

    const embedding = response.embeddings[0];

    // Validate dimension (may vary by model)
    if (embedding.length !== this.config.dimension) {
      // Update config dimension if model uses different size
      this.config.dimension = embedding.length;
    }

    return normalizeVector(embedding);
  }

  private calculateEmbeddingConfidence(
    embedding: number[],
    text: string
  ): number {
    // Simple confidence metric based on embedding properties
    const magnitude = Math.sqrt(embedding.reduce((sum, x) => sum + x * x, 0));
    const sparsity =
      embedding.filter((x) => Math.abs(x) < 0.01).length / embedding.length;

    // High magnitude and low sparsity indicate good embeddings
    let confidence = Math.min(magnitude / 2.0, 1.0); // Normalized magnitude
    confidence *= 1.0 - sparsity * 0.5; // Penalty for sparsity

    // Boost confidence for Obsidian-specific content patterns
    if (text.includes("[[") || text.includes("#")) {
      confidence *= 1.1; // Boost for wikilinks and tags
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  async testConnection(): Promise<{
    success: boolean;
    dimension: number;
    model: string;
  }> {
    try {
      const testText = "This is a test embedding for Obsidian knowledge base.";
      const embedding = await this.embed(testText);

      return {
        success: true,
        dimension: embedding.length,
        model: this.config.model,
      };
    } catch (error) {
      console.error(`❌ Embedding service test failed: ${error}`);
      return {
        success: false,
        dimension: 0,
        model: this.config.model,
      };
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  updateStrategy(newStrategy: Partial<EmbeddingStrategy>): void {
    this.strategy = { ...this.strategy, ...newStrategy };
    console.log(`🔄 Updated embedding strategy:`, {
      primary: this.strategy.primaryModel.name,
      fallbacks: this.strategy.fallbackModels.map((m) => m.name),
      overrides: Object.keys(this.strategy.contentTypeOverrides),
    });
  }

  getCurrentStrategy(): EmbeddingStrategy {
    return { ...this.strategy };
  }

  getAvailableModels(): EmbeddingModel[] {
    return [...this.models];
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()).slice(0, 10), // First 10 keys for debugging
    };
  }

  /**
   * Get performance metrics for monitoring embedding latency requirements
   * @returns Performance statistics including p95 latency, cache hit rate, and slow embed count
   */
  getPerformanceMetrics() {
    if (this.performanceMetrics.embedLatency.length === 0) {
      return {
        totalRequests: this.performanceMetrics.totalRequests,
        cacheHits: this.performanceMetrics.cacheHits,
        cacheMisses: this.performanceMetrics.cacheMisses,
        cacheHitRate: 0,
        slowEmbeds: this.performanceMetrics.slowEmbeds,
        p95Latency: 0,
        averageLatency: 0,
        minLatency: 0,
        maxLatency: 0,
      };
    }

    const sorted = [...this.performanceMetrics.embedLatency].sort(
      (a, b) => a - b
    );
    const p95Index = Math.floor(sorted.length * 0.95);
    const cacheHitRate =
      this.performanceMetrics.totalRequests > 0
        ? (this.performanceMetrics.cacheHits /
            this.performanceMetrics.totalRequests) *
          100
        : 0;

    return {
      totalRequests: this.performanceMetrics.totalRequests,
      cacheHits: this.performanceMetrics.cacheHits,
      cacheMisses: this.performanceMetrics.cacheMisses,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100, // Round to 2 decimal places
      slowEmbeds: this.performanceMetrics.slowEmbeds,
      p95Latency: sorted[p95Index] || 0,
      averageLatency: sorted.reduce((sum, lat) => sum + lat, 0) / sorted.length,
      minLatency: sorted[0],
      maxLatency: sorted[sorted.length - 1],
    };
  }
}
