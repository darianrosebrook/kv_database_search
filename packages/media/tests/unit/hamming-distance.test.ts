import { describe, it, expect } from "vitest";
import { hammingDistance, areSimilar } from "../../src/analysis/hamming-distance.js";

describe("hammingDistance", () => {
  it("returns 0 for identical hashes", () => {
    expect(hammingDistance(0n, 0n)).toBe(0);
    expect(hammingDistance(0xFFFFFFFFFFFFFFFFn, 0xFFFFFFFFFFFFFFFFn)).toBe(0);
    expect(hammingDistance(0xABCD1234n, 0xABCD1234n)).toBe(0);
  });

  it("returns correct count for single bit difference", () => {
    expect(hammingDistance(0b0000n, 0b0001n)).toBe(1);
    expect(hammingDistance(0b1000n, 0b0000n)).toBe(1);
  });

  it("returns correct count for multiple bit differences", () => {
    // 0b1010 vs 0b0101 = 4 bits different
    expect(hammingDistance(0b1010n, 0b0101n)).toBe(4);
  });

  it("returns 64 for completely opposite 64-bit hashes", () => {
    expect(hammingDistance(0n, 0xFFFFFFFFFFFFFFFFn)).toBe(64);
  });

  it("is commutative", () => {
    const a = 0xDEADBEEFn;
    const b = 0xCAFEBABEn;
    expect(hammingDistance(a, b)).toBe(hammingDistance(b, a));
  });

  it("handles large 64-bit values", () => {
    const a = 0x8000000000000000n;
    const b = 0x0000000000000001n;
    expect(hammingDistance(a, b)).toBe(2);
  });
});

describe("areSimilar", () => {
  it("returns true for identical hashes", () => {
    expect(areSimilar(0xABCDn, 0xABCDn)).toBe(true);
  });

  it("returns true when distance is within default threshold (5)", () => {
    // 3 bits different
    expect(areSimilar(0b000n, 0b111n)).toBe(true);
  });

  it("returns false when distance exceeds default threshold", () => {
    // 8 bits different
    expect(areSimilar(0x00n, 0xFFn)).toBe(false);
  });

  it("respects custom threshold", () => {
    // 4 bits different (0b1010 vs 0b0101)
    expect(areSimilar(0b1010n, 0b0101n, 4)).toBe(true);
    expect(areSimilar(0b1010n, 0b0101n, 3)).toBe(false);
  });

  it("threshold of 0 only matches identical hashes", () => {
    expect(areSimilar(0xABCDn, 0xABCDn, 0)).toBe(true);
    expect(areSimilar(0xABCDn, 0xABCEn, 0)).toBe(false);
  });
});
