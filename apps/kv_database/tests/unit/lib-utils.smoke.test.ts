/**
 * Smoke Tests for Core Utility Functions
 *
 * Basic tests to ensure core utility functions work correctly.
 * These are "quick wins" identified by the legacy assessment tool.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  normalize,
  createContentHash,
  createHash,
  generateDeterministicId,
  determineContentType,
  cosineSimilarity,
  estimateTokens,
  sleep,
  EntityExtractor,
} from "../../src/lib/utils";

describe("Core Utility Functions - Smoke Tests", () => {
  describe("normalize", () => {
    it("should normalize basic text", () => {
      const result = normalize("  Hello   World  ");
      expect(result).toBe("Hello World");
    });

    it("should handle line breaks", () => {
      const result = normalize("Line1\r\nLine2\rLine3\nLine4");
      expect(result).toBe("Line1\nLine2\nLine3\nLine4");
    });

    it("should remove zero-width characters", () => {
      const result = normalize("test\u200Btext");
      expect(result).toBe("testtext");
    });

    it("should apply NFC normalization", () => {
      const result = normalize("café"); // Ensures consistent Unicode representation
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("createContentHash", () => {
    it("should create consistent hashes for same content", () => {
      const hash1 = createContentHash("test content");
      const hash2 = createContentHash("test content");
      expect(hash1).toBe(hash2);
    });

    it("should create different hashes for different content", () => {
      const hash1 = createContentHash("content 1");
      const hash2 = createContentHash("content 2");
      expect(hash1).not.toBe(hash2);
    });

    it("should normalize before hashing", () => {
      const hash1 = createContentHash("  test  ");
      const hash2 = createContentHash("test");
      expect(hash1).toBe(hash2);
    });

    it("should return a valid hex string", () => {
      const hash = createContentHash("test");
      expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 produces 64 hex chars
    });
  });

  describe("createHash", () => {
    it("should create SHA-256 hash", () => {
      const hash = createHash("sha256", "test");
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should handle Buffer input", () => {
      const buffer = Buffer.from("test");
      const hash = createHash("sha256", buffer);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("generateDeterministicId", () => {
    it("should generate consistent IDs for same components", () => {
      const id1 = generateDeterministicId("part1", "part2", 123);
      const id2 = generateDeterministicId("part1", "part2", 123);
      expect(id1).toBe(id2);
    });

    it("should generate different IDs for different components", () => {
      const id1 = generateDeterministicId("part1", "part2");
      const id2 = generateDeterministicId("part1", "part3");
      expect(id1).not.toBe(id2);
    });

    it("should handle numeric components", () => {
      const id = generateDeterministicId("doc", 123, "chunk");
      expect(id).toBeTruthy();
      expect(typeof id).toBe("string");
    });
  });

  describe("determineContentType", () => {
    it("should identify PDF files", () => {
      expect(determineContentType("document.pdf")).toBe("pdf");
    });

    it("should identify markdown files", () => {
      expect(determineContentType("note.md")).toBe("markdown");
    });

    it("should identify image files", () => {
      expect(determineContentType("photo.jpg")).toBe("image");
      expect(determineContentType("image.png")).toBe("image");
      expect(determineContentType("graphic.gif")).toBe("image");
    });

    it("should identify text files", () => {
      expect(determineContentType("document.txt")).toBe("text");
    });

    it("should handle unknown extensions", () => {
      expect(determineContentType("file.xyz")).toBe("unknown");
      expect(determineContentType("audio.mp3")).toBe("unknown"); // Not implemented
      expect(determineContentType("video.mp4")).toBe("unknown"); // Not implemented
    });

    it("should be case-insensitive", () => {
      expect(determineContentType("FILE.PDF")).toBe("pdf");
    });
  });

  describe("cosineSimilarity", () => {
    it("should return 1 for identical vectors", () => {
      const vec = [1, 2, 3];
      const similarity = cosineSimilarity(vec, vec);
      expect(similarity).toBe(1);
    });

    it("should return 0 for orthogonal vectors", () => {
      const vec1 = [1, 0];
      const vec2 = [0, 1];
      const similarity = cosineSimilarity(vec1, vec2);
      expect(similarity).toBe(0);
    });

    it("should handle negative values", () => {
      const vec1 = [1, -1];
      const vec2 = [-1, 1];
      const similarity = cosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(-1, 10); // Allow for floating point precision
    });

    it("should throw error for different dimensions", () => {
      expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow(
        "Vectors must have the same dimension"
      );
    });

    it("should handle zero vectors", () => {
      const similarity = cosineSimilarity([0, 0], [1, 2]);
      expect(similarity).toBe(0);
    });

    it("should calculate similarity for typical vectors", () => {
      const vec1 = [1, 2, 3];
      const vec2 = [2, 4, 6]; // Parallel vector (2x vec1)
      const similarity = cosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(1, 10);
    });
  });

  describe("estimateTokens", () => {
    it("should estimate tokens for simple text", () => {
      const tokens = estimateTokens("This is a test");
      expect(tokens).toBeGreaterThan(0);
      expect(Number.isInteger(tokens)).toBe(true);
    });

    it("should scale with text length", () => {
      const short = estimateTokens("short");
      const long = estimateTokens(
        "This is a much longer piece of text with many words"
      );
      expect(long).toBeGreaterThan(short);
    });

    it("should handle empty string", () => {
      const tokens = estimateTokens("");
      expect(tokens).toBeGreaterThanOrEqual(0);
    });
  });

  describe("sleep", () => {
    it("should wait for specified milliseconds", async () => {
      const start = Date.now();
      await sleep(50);
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(45); // Allow small timing variance
    });

    it("should resolve without error", async () => {
      await expect(sleep(10)).resolves.toBeUndefined();
    });
  });

  describe("EntityExtractor", () => {
    let extractor: EntityExtractor;

    beforeEach(() => {
      extractor = new EntityExtractor();
    });

    it("should extract person names", () => {
      const entities = extractor.extractEntities("John Smith met Jane Doe");
      const personEntities = entities.filter((e) => e.type === "person");
      expect(personEntities.length).toBeGreaterThan(0);
    });

    it("should extract organizations", () => {
      const entities = extractor.extractEntities(
        "Microsoft Corporation and Apple Inc are tech companies"
      );
      const orgEntities = entities.filter((e) => e.type === "organization");
      expect(orgEntities.length).toBeGreaterThan(0);
    });

    it("should extract locations", () => {
      const entities = extractor.extractEntities(
        "The meeting was in Washington and Baltimore"
      );
      const locationEntities = entities.filter((e) => e.type === "location");
      expect(locationEntities.length).toBeGreaterThan(0);
    });

    it("should include position information", () => {
      const entities = extractor.extractEntities("John Smith is here");
      expect(entities[0]).toHaveProperty("position");
      expect(entities[0].position).toHaveProperty("start");
      expect(entities[0].position).toHaveProperty("end");
    });

    it("should filter out stop words", () => {
      const entities = extractor.extractEntities("The and or but");
      expect(entities.length).toBe(0);
    });

    it("should extract relationships", () => {
      const text = "John Smith works for Microsoft Corporation";
      const entities = extractor.extractEntities(text);
      const relationships = extractor.extractRelationships(text, entities);
      expect(Array.isArray(relationships)).toBe(true);
    });
  });
});
