// @ts-nocheck
import ollama from "ollama";
import { normalize, normalizeVector } from "./utils.js";
export class ObsidianEmbeddingService {
    config;
    cache = new Map();
    strategy;
    // Obsidian-optimized embedding models
    models = [
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
    constructor(config) {
        this.config = config;
        this.strategy = this.createObsidianStrategy();
    }
    createObsidianStrategy() {
        return {
            primaryModel: this.models.find((m) => m.name === this.config.model) || this.models[0],
            fallbackModels: this.models.filter((m) => m.name !== this.config.model),
            contentTypeOverrides: {
                // Obsidian-specific content type optimizations
                moc: this.models.find((m) => m.name === "embeddinggemma"),
                article: this.models.find((m) => m.name === "embeddinggemma"),
                conversation: this.models.find((m) => m.name === "embeddinggemma"),
                "book-note": this.models.find((m) => m.name === "embeddinggemma"),
                note: this.models.find((m) => m.name === "embeddinggemma"),
            },
            qualityThresholds: {
                minSimilarity: 0.3,
                maxResults: 30,
            },
        };
    }
    async embed(text) {
        const normalizedText = normalize(text);
        // Check cache first
        const cacheKey = `${this.config.model}:${normalizedText}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
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
                throw new Error(`Embedding dimension mismatch: expected ${this.config.dimension}, got ${embedding.length}`);
            }
            // Normalize the embedding vector for consistent cosine similarity scores
            const normalizedEmbedding = normalizeVector(embedding);
            // Cache the normalized result
            this.cache.set(cacheKey, normalizedEmbedding);
            return normalizedEmbedding;
        }
        catch (error) {
            console.error(`❌ Failed to embed text: ${error}`);
            throw new Error(`Embedding failed: ${error}`);
        }
    }
    async embedBatch(texts, batchSize = 5) {
        const results = [];
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
    async embedWithStrategy(text, contentType, domainHint) {
        const normalizedText = normalize(text);
        // Select appropriate model based on content type and domain
        const selectedModel = this.selectModelForContent(contentType, domainHint);
        // Check cache with model-specific key
        const cacheKey = `${selectedModel.name}:${normalizedText}`;
        if (this.cache.has(cacheKey)) {
            return {
                embedding: this.cache.get(cacheKey),
                model: selectedModel,
                confidence: 1.0, // Cached result
            };
        }
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
            const confidence = this.calculateEmbeddingConfidence(embedding, normalizedText);
            return {
                embedding,
                model: selectedModel,
                confidence,
            };
        }
        catch (error) {
            console.warn(`Failed to embed with ${selectedModel.name}, trying fallback...`);
            // Try fallback models
            for (const fallbackModel of this.strategy.fallbackModels) {
                try {
                    const originalModel = this.config.model;
                    this.config.model = fallbackModel.name;
                    const embedding = await this.embedCore(normalizedText);
                    this.config.model = originalModel;
                    const confidence = this.calculateEmbeddingConfidence(embedding, normalizedText);
                    return {
                        embedding,
                        model: fallbackModel,
                        confidence: confidence * 0.8, // Penalty for fallback
                    };
                }
                catch (fallbackError) {
                    console.warn(`Fallback model ${fallbackModel.name} also failed`);
                }
            }
            throw new Error(`All embedding models failed for text: ${normalizedText.slice(0, 50)}...`);
        }
    }
    selectModelForContent(contentType, domainHint) {
        // Content-type specific overrides for Obsidian
        if (contentType && this.strategy.contentTypeOverrides[contentType]) {
            return this.strategy.contentTypeOverrides[contentType];
        }
        // Domain-specific selection
        if (domainHint) {
            const domainModel = this.models.find((m) => m.domain === domainHint || m.name.includes(domainHint));
            if (domainModel)
                return domainModel;
        }
        // Default to primary model
        return this.strategy.primaryModel;
    }
    async embedCore(text) {
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
    calculateEmbeddingConfidence(embedding, text) {
        // Simple confidence metric based on embedding properties
        const magnitude = Math.sqrt(embedding.reduce((sum, x) => sum + x * x, 0));
        const sparsity = embedding.filter((x) => Math.abs(x) < 0.01).length / embedding.length;
        // High magnitude and low sparsity indicate good embeddings
        let confidence = Math.min(magnitude / 2.0, 1.0); // Normalized magnitude
        confidence *= 1.0 - sparsity * 0.5; // Penalty for sparsity
        // Boost confidence for Obsidian-specific content patterns
        if (text.includes("[[") || text.includes("#")) {
            confidence *= 1.1; // Boost for wikilinks and tags
        }
        return Math.max(0.1, Math.min(1.0, confidence));
    }
    async testConnection() {
        try {
            const testText = "This is a test embedding for Obsidian knowledge base.";
            const embedding = await this.embed(testText);
            return {
                success: true,
                dimension: embedding.length,
                model: this.config.model,
            };
        }
        catch (error) {
            console.error(`❌ Embedding service test failed: ${error}`);
            return {
                success: false,
                dimension: 0,
                model: this.config.model,
            };
        }
    }
    clearCache() {
        this.cache.clear();
    }
    updateStrategy(newStrategy) {
        this.strategy = { ...this.strategy, ...newStrategy };
        console.log(`🔄 Updated embedding strategy:`, {
            primary: this.strategy.primaryModel.name,
            fallbacks: this.strategy.fallbackModels.map((m) => m.name),
            overrides: Object.keys(this.strategy.contentTypeOverrides),
        });
    }
    getCurrentStrategy() {
        return { ...this.strategy };
    }
    getAvailableModels() {
        return [...this.models];
    }
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()).slice(0, 10), // First 10 keys for debugging
        };
    }
}
