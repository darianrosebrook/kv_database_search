import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock ollama
vi.mock("ollama", () => ({
  default: {
    embed: vi.fn(),
    list: vi.fn(),
    show: vi.fn(),
  },
}));

// Mock utils functions
vi.mock("../../src/lib/utils", () => ({
  normalize: vi.fn((text: string) => text.trim().toLowerCase()),
  normalizeVector: vi.fn((vector: number[]) => vector),
}));

import { DocumentEmbeddingService } from "../../src/lib/embeddings";
import ollama from "ollama";
import { normalize } from "../../src/lib/utils";

describe("DocumentEmbeddingService", () => {
  let service: DocumentEmbeddingService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    vi.mocked(ollama.embed).mockReset();
    vi.mocked(ollama.list).mockReset();
    vi.mocked(ollama.show).mockReset();
    vi.mocked(normalize).mockReset();

    // Set default mock behaviors
    vi.mocked(normalize).mockImplementation((text: string) =>
      text.trim().toLowerCase()
    );
    vi.mocked(ollama.list).mockResolvedValue({
      models: [
        {
          name: "embeddinggemma:latest",
          size: 1000000,
          digest: "test-digest",
        },
      ],
    });
    vi.mocked(ollama.show).mockResolvedValue({
      modelfile: "# Test model file",
      parameters: "",
      template: "",
      details: {
        format: "gguf",
        family: "gemma",
        families: ["gemma"],
        parameter_size: "2.0B",
        quantization_level: "Q4_0",
      },
    });

    service = new DocumentEmbeddingService({
      model: "embeddinggemma",
      baseUrl: "http://localhost:11434",
      dimension: 768,
    });
  });

  afterEach(async () => {
    // Clean up any cached embeddings
    await service.clearCache();
  });

  describe("Constructor and Configuration", () => {
    it("should create a new DocumentEmbeddingService instance", () => {
      expect(service).toBeInstanceOf(DocumentEmbeddingService);
    });

    it("should initialize with correct configuration", () => {
      // Access config through the private property (not ideal but for testing)
      expect((service as any).config.model).toBe("embeddinggemma");
      expect((service as any).config.baseUrl).toBe("http://localhost:11434");
      expect((service as any).config.dimension).toBe(768);
    });
  });

  describe("Embedding Generation", () => {
    it("should embed text successfully", async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      vi.mocked(ollama.embed).mockResolvedValue({
        embeddings: [mockEmbedding],
      });

      const result = await service.embed("test text");

      expect(result).toEqual(mockEmbedding);
      expect(ollama.embed).toHaveBeenCalledWith({
        model: "embeddinggemma",
        input: "test text", // normalized
      });
    });

    it("should use cache for repeated embeddings", async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      vi.mocked(ollama.embed).mockResolvedValue({
        embeddings: [mockEmbedding],
      });

      // First call
      const result1 = await service.embed("test text");
      expect(result1).toEqual(mockEmbedding);

      // Second call with same text should use cache
      const result2 = await service.embed("test text");
      expect(result2).toEqual(mockEmbedding);

      // Should only call ollama once due to caching
      expect(ollama.embed).toHaveBeenCalledTimes(1);
    });

    it("should handle embedding errors", async () => {
      vi.mocked(ollama.embed).mockRejectedValue(
        new Error("Ollama connection failed")
      );

      await expect(service.embed("test text")).rejects.toThrow(
        "Ollama connection failed"
      );
    });

    it("should handle empty embeddings response", async () => {
      vi.mocked(ollama.embed).mockResolvedValue({
        embeddings: [],
      });

      await expect(service.embed("test text")).rejects.toThrow(
        "No embeddings returned from Ollama"
      );
    });

    it("should normalize input text", async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      vi.mocked(ollama.embed).mockResolvedValue({
        embeddings: [mockEmbedding],
      });

      await service.embed("  TEST TEXT  ");

      expect(normalize).toHaveBeenCalledWith("  TEST TEXT  ");
      expect(ollama.embed).toHaveBeenCalledWith({
        model: "embeddinggemma",
        input: "test text", // normalized result
      });
    });
  });

  describe("Batch Embedding", () => {
    it("should embed multiple texts in batch", async () => {
      const mockEmbedding1 = new Array(768).fill(0.1);
      const mockEmbedding2 = new Array(768).fill(0.2);
      vi.mocked(ollama.embed)
        .mockResolvedValueOnce({
          embeddings: [mockEmbedding1],
        })
        .mockResolvedValueOnce({
          embeddings: [mockEmbedding2],
        });

      const result = await service.embedBatch(["text 1", "text 2"]);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveLength(768);
      expect(result[1]).toHaveLength(768);
      expect(ollama.embed).toHaveBeenCalledTimes(2);
    });

    it("should handle batch size limits", async () => {
      const mockEmbedding = new Array(768).fill(0.1);

      // Mock embed to return the same embedding for all calls
      vi.mocked(ollama.embed).mockResolvedValue({
        embeddings: [mockEmbedding],
      });

      const texts = Array.from({ length: 10 }, (_, i) => `text ${i}`);
      const result = await service.embedBatch(texts, 5);

      expect(result).toHaveLength(10);
      expect(result[0]).toHaveLength(768);
      expect(result[5]).toHaveLength(768);
      expect(ollama.embed).toHaveBeenCalledTimes(10); // Called once per text
    });
  });

  describe("Embedding Strategy", () => {
    it("should embed with strategy", async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      vi.mocked(ollama.embed).mockResolvedValue({
        embeddings: [mockEmbedding],
      });

      const result = await service.embedWithStrategy("test text", {
        useCache: true,
        normalize: true,
      });

      expect(result.embedding).toEqual(mockEmbedding);
      expect(result.model).toBeDefined();
      expect(result.confidence).toBeDefined();
    });

    it("should use cache for repeated calls", async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      vi.mocked(ollama.embed).mockResolvedValue({
        embeddings: [mockEmbedding],
      });

      // First call
      await service.embedWithStrategy("test text");

      // Second call with same text should use cache
      await service.embedWithStrategy("test text");

      // Should only call ollama once due to caching
      expect(ollama.embed).toHaveBeenCalledTimes(1);
    });
  });

  describe("Connection Testing", () => {
    it("should test connection successfully", async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      vi.mocked(ollama.embed).mockResolvedValue({
        embeddings: [mockEmbedding],
      });

      const result = await service.testConnection();
      expect(result.success).toBe(true);
      expect(result.dimension).toBe(768);
      expect(result.model).toBe("embeddinggemma");
    });

    it("should handle connection failure", async () => {
      vi.mocked(ollama.embed).mockRejectedValue(new Error("Connection failed"));

      const result = await service.testConnection();
      expect(result.success).toBe(false);
      expect(result.dimension).toBe(0);
      expect(result.model).toBe("embeddinggemma");
    });
  });

  describe("Cache Management", () => {
    it("should clear cache", async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      vi.mocked(ollama.embed).mockResolvedValue({
        embeddings: [mockEmbedding],
      });

      await service.embed("test text");
      // Cache should have one entry
      expect((service as any).cache.size).toBe(1);

      service.clearCache();
      expect((service as any).cache.size).toBe(0);
    });
  });

  describe("Performance Metrics", () => {
    it("should track performance metrics", async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      vi.mocked(ollama.embed).mockResolvedValue({
        embeddings: [mockEmbedding],
      });

      await service.embedWithStrategy("test text");

      const metrics = service.getPerformanceMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
      expect(metrics.averageLatency).toBeGreaterThan(0);
    });

    it("should track cache hits", async () => {
      const mockEmbedding = new Array(768).fill(0.1);
      vi.mocked(ollama.embed).mockResolvedValue({
        embeddings: [mockEmbedding],
      });

      // First call (cache miss)
      await service.embedWithStrategy("test text");
      // Second call (cache hit)
      await service.embedWithStrategy("test text");

      const metrics = service.getPerformanceMetrics();
      expect(metrics.totalRequests).toBe(2);
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
    });
  });
});
