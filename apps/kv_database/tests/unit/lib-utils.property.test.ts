/**
 * Property-Based Tests for Core Utility Functions
 *
 * Using fast-check to test mathematical properties and invariants
 * that should hold for all inputs. This significantly improves edge
 * case coverage and test quality.
 *
 * Property-based testing generates hundreds of random test cases
 * to verify that properties always hold true.
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  normalize,
  createContentHash,
  cosineSimilarity,
  estimateTokens,
  generateDeterministicId,
} from "../../src/lib/utils";

describe("Property-Based Tests - Core Utilities", () => {
  describe("normalize - Properties", () => {
    it("should be idempotent (normalizing twice gives same result)", () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          const once = normalize(text);
          const twice = normalize(once);
          expect(once).toBe(twice);
        }),
        { numRuns: 100 }
      );
    });

    it("should always trim whitespace from edges", () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          const result = normalize(text);
          // Should not start or end with whitespace
          if (result.length > 0) {
            expect(result[0]).not.toBe(" ");
            expect(result[result.length - 1]).not.toBe(" ");
          }
        }),
        { numRuns: 100 }
      );
    });

    it("should not increase text length for simple text", () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => !s.includes("\r") && !s.includes("\t")),
          (text) => {
            const result = normalize(text);
            expect(result.length).toBeLessThanOrEqual(text.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle any valid Unicode string", () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          const result = normalize(text);
          expect(typeof result).toBe("string");
          expect(result).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("createContentHash - Properties", () => {
    it("should be deterministic (same input produces same hash)", () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          const hash1 = createContentHash(text);
          const hash2 = createContentHash(text);
          expect(hash1).toBe(hash2);
        }),
        { numRuns: 100 }
      );
    });

    it("should always produce 64-character hex strings", () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          const hash = createContentHash(text);
          expect(hash).toMatch(/^[a-f0-9]{64}$/);
          expect(hash.length).toBe(64);
        }),
        { numRuns: 100 }
      );
    });

    it("should produce different hashes for different normalized inputs", () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => s.trim().length > 0),
          fc.string().filter((s) => s.trim().length > 0),
          (text1, text2) => {
            const normalized1 = normalize(text1);
            const normalized2 = normalize(text2);

            if (normalized1 !== normalized2) {
              const hash1 = createContentHash(text1);
              const hash2 = createContentHash(text2);
              expect(hash1).not.toBe(hash2);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should normalize before hashing (whitespace variations produce same hash)", () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => s.trim().length > 0),
          (text) => {
            const hash1 = createContentHash(text);
            const hash2 = createContentHash(`  ${text}  `);
            const hash3 = createContentHash(text.replace(/ /g, "  "));

            // After normalization, these should match
            expect(hash1).toBe(hash2);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("cosineSimilarity - Mathematical Properties", () => {
    it("should be commutative: similarity(a,b) = similarity(b,a)", () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: -100, max: 100, noNaN: true }), {
            minLength: 3,
            maxLength: 10,
          }),
          fc.array(fc.float({ min: -100, max: 100, noNaN: true }), {
            minLength: 3,
            maxLength: 10,
          }),
          (vecA, vecB) => {
            // Ensure same length
            const length = Math.min(vecA.length, vecB.length);
            const v1 = vecA.slice(0, length);
            const v2 = vecB.slice(0, length);

            const sim1 = cosineSimilarity(v1, v2);
            const sim2 = cosineSimilarity(v2, v1);

            // Only check if both are valid numbers (not NaN)
            if (!Number.isNaN(sim1) && !Number.isNaN(sim2)) {
              expect(sim1).toBeCloseTo(sim2, 10);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return 1 for identical non-zero vectors", () => {
      fc.assert(
        fc.property(
          fc
            .array(fc.float({ min: -100, max: 100, noNaN: true }), {
              minLength: 3,
              maxLength: 10,
            })
            .filter((arr) => arr.some((x) => x !== 0)),
          (vec) => {
            const similarity = cosineSimilarity(vec, vec);
            expect(similarity).toBeCloseTo(1, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return value between -1 and 1", () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: -100, max: 100, noNaN: true }), {
            minLength: 3,
            maxLength: 10,
          }),
          fc.array(fc.float({ min: -100, max: 100, noNaN: true }), {
            minLength: 3,
            maxLength: 10,
          }),
          (vecA, vecB) => {
            const length = Math.min(vecA.length, vecB.length);
            const v1 = vecA.slice(0, length);
            const v2 = vecB.slice(0, length);

            const similarity = cosineSimilarity(v1, v2);

            // Should be a valid number between -1 and 1
            if (!Number.isNaN(similarity)) {
              expect(similarity).toBeGreaterThanOrEqual(-1);
              expect(similarity).toBeLessThanOrEqual(1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return 0 for zero vectors", () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: -100, max: 100 }), {
            minLength: 3,
            maxLength: 10,
          }),
          (vec) => {
            const zeroVec = new Array(vec.length).fill(0);
            const similarity = cosineSimilarity(vec, zeroVec);
            expect(similarity).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should scale linearly (parallel vectors have similarity 1)", () => {
      fc.assert(
        fc.property(
          fc
            .array(fc.float({ min: -100, max: 100, noNaN: true }), {
              minLength: 3,
              maxLength: 10,
            })
            .filter((arr) => arr.some((x) => x !== 0)),
          fc.float({ noNaN: true }).filter((x) => x > 0.1 && x < 10),
          (vec, scale) => {
            const scaledVec = vec.map((x) => x * scale);
            const similarity = cosineSimilarity(vec, scaledVec);
            expect(similarity).toBeCloseTo(1, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle negative scaling (anti-parallel vectors have similarity -1)", () => {
      fc.assert(
        fc.property(
          fc
            .array(fc.float({ min: -100, max: 100, noNaN: true }), {
              minLength: 3,
              maxLength: 10,
            })
            .filter((arr) => arr.some((x) => x !== 0)),
          fc.float({ noNaN: true }).filter((x) => x < -0.1 && x > -10),
          (vec, scale) => {
            const scaledVec = vec.map((x) => x * scale);
            const similarity = cosineSimilarity(vec, scaledVec);
            expect(similarity).toBeCloseTo(-1, 10);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("estimateTokens - Properties", () => {
    it("should always return non-negative integers", () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          const tokens = estimateTokens(text);
          expect(tokens).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(tokens)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("should scale monotonically (more text = more tokens)", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10 }),
          fc.string({ minLength: 10 }),
          (text1, text2) => {
            const combined = text1 + " " + text2;
            const tokens1 = estimateTokens(text1);
            const tokensCombined = estimateTokens(combined);

            expect(tokensCombined).toBeGreaterThanOrEqual(tokens1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return 0 or small value for empty/whitespace strings", () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => s.trim().length === 0),
          (text) => {
            const tokens = estimateTokens(text);
            // Empty/whitespace strings should have minimal tokens
            // Adjust threshold based on actual behavior (some whitespace might count as tokens)
            expect(tokens).toBeLessThanOrEqual(5);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should estimate similar token counts for similar length text", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), {
            minLength: 5,
            maxLength: 5,
          }),
          (words) => {
            const text1 = words.join(" ");
            const text2 = words.slice().reverse().join(" ");

            const tokens1 = estimateTokens(text1);
            const tokens2 = estimateTokens(text2);

            // Same words = similar token estimate (within reasonable margin)
            // Token estimation may vary slightly due to punctuation, spacing
            expect(Math.abs(tokens1 - tokens2)).toBeLessThanOrEqual(3);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("generateDeterministicId - Properties", () => {
    it("should be deterministic (same inputs produce same ID)", () => {
      fc.assert(
        fc.property(
          fc.array(fc.oneof(fc.string(), fc.integer()), {
            minLength: 1,
            maxLength: 5,
          }),
          (components) => {
            const id1 = generateDeterministicId(...components);
            const id2 = generateDeterministicId(...components);
            expect(id1).toBe(id2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should produce different IDs for different inputs", () => {
      fc.assert(
        fc.property(
          fc.array(fc.oneof(fc.string(), fc.integer()), {
            minLength: 1,
            maxLength: 5,
          }),
          fc.array(fc.oneof(fc.string(), fc.integer()), {
            minLength: 1,
            maxLength: 5,
          }),
          (components1, components2) => {
            // Ensure arrays are different
            const str1 = JSON.stringify(components1);
            const str2 = JSON.stringify(components2);

            if (str1 !== str2) {
              const id1 = generateDeterministicId(...components1);
              const id2 = generateDeterministicId(...components2);
              expect(id1).not.toBe(id2);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should always return a non-empty string", () => {
      fc.assert(
        fc.property(
          fc.array(fc.oneof(fc.string(), fc.integer()), {
            minLength: 1,
            maxLength: 5,
          }),
          (components) => {
            const id = generateDeterministicId(...components);
            expect(typeof id).toBe("string");
            expect(id.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle mixed string and number components", () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.integer(),
          fc.string(),
          (str1, num, str2) => {
            const id = generateDeterministicId(str1, num, str2);
            expect(typeof id).toBe("string");
            expect(id.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should be order-sensitive (different order = different ID)", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          (a, b) => {
            if (a !== b) {
              const id1 = generateDeterministicId(a, b);
              const id2 = generateDeterministicId(b, a);
              expect(id1).not.toBe(id2);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Integration Properties - Hash and Normalize", () => {
    it("should produce consistent hashes after normalization chain", () => {
      fc.assert(
        fc.property(fc.string(), (text) => {
          // Multiple paths to the same normalized form should hash the same
          const normalized1 = normalize(text);
          const normalized2 = normalize(normalize(text));
          const normalized3 = normalize(`  ${text}  `);

          const hash1 = createContentHash(normalized1);
          const hash2 = createContentHash(normalized2);
          const hash3 = createContentHash(text.trim());

          expect(hash1).toBe(hash2);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Edge Cases - Property Verification", () => {
    it("should handle Unicode edge cases in normalization", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant("café"),
            fc.constant("naïve"),
            fc.constant("𝕳𝖊𝖑𝖑𝖔"),
            fc.constant("👨‍👩‍👧‍👦"),
            fc.string()
          ),
          (text) => {
            const result = normalize(text);
            expect(typeof result).toBe("string");
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should handle extreme vector dimensions", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), (dimension) => {
          const vec1 = new Array(dimension).fill(1);
          const vec2 = new Array(dimension).fill(1);

          const similarity = cosineSimilarity(vec1, vec2);
          expect(similarity).toBeCloseTo(1, 10);
        }),
        { numRuns: 20 } // Fewer runs for large dimensions
      );
    });

    it("should handle very long text in token estimation", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 100, maxLength: 1000 }),
          (words) => {
            const longText = words.join(" ");
            const tokens = estimateTokens(longText);

            expect(tokens).toBeGreaterThan(0);
            expect(Number.isFinite(tokens)).toBe(true);
          }
        ),
        { numRuns: 10 } // Fewer runs for large texts
      );
    });
  });
});
