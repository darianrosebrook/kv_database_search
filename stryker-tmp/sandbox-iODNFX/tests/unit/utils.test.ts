// @ts-nocheck
import { describe, it, expect } from "vitest";
import {
  normalize,
  createContentHash,
  normalizeVector,
  cosineSimilarity,
  estimateTokens,
} from "../../src/lib/utils.js";

describe("normalize", () => {
  it("should normalize basic text", () => {
    const input = "  Hello   World  ";
    const expected = "Hello World";
    expect(normalize(input)).toBe(expected);
  });
});

describe("createContentHash", () => {
  it("should create consistent hashes for same content", () => {
    const content1 = "Hello World";
    const content2 = "Hello World";
    expect(createContentHash(content1)).toBe(createContentHash(content2));
  });
});

describe("normalizeVector", () => {
  it("should normalize a vector to unit length", () => {
    const vector = [3, 4]; // Should normalize to [0.6, 0.8]
    const normalized = normalizeVector(vector);
    const magnitude = Math.sqrt(normalized.reduce((sum, x) => sum + x * x, 0));
    expect(magnitude).toBeCloseTo(1.0, 10);
  });
});

describe("cosineSimilarity", () => {
  it("should calculate similarity between identical vectors", () => {
    const vec = [1, 2, 3];
    expect(cosineSimilarity(vec, vec)).toBeCloseTo(1.0, 10);
  });
});

describe("estimateTokens", () => {
  it("should estimate tokens based on word count", () => {
    const text = "This is a test sentence";
    const words = text.split(/\s+/).length; // 5 words
    const expectedTokens = Math.ceil(words / 0.75); // ceil(5 / 0.75) = 7
    expect(estimateTokens(text)).toBe(expectedTokens);
  });
});
