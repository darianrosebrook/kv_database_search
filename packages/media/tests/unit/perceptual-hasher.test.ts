import { describe, it, expect, vi, beforeEach } from "vitest";
import { PerceptualHasher } from "../../src/analysis/perceptual-hasher.js";
import { hammingDistance } from "../../src/analysis/hamming-distance.js";

// Mock sharp
const mockSharpInstance = {
  resize: vi.fn().mockReturnThis(),
  grayscale: vi.fn().mockReturnThis(),
  raw: vi.fn().mockReturnThis(),
  toBuffer: vi.fn(),
};

vi.mock("sharp", () => ({
  default: vi.fn(() => mockSharpInstance),
}));

describe("PerceptualHasher", () => {
  let hasher: PerceptualHasher;

  beforeEach(() => {
    hasher = new PerceptualHasher();
    vi.clearAllMocks();
    // Reset mock chain
    mockSharpInstance.resize.mockReturnValue(mockSharpInstance);
    mockSharpInstance.grayscale.mockReturnValue(mockSharpInstance);
    mockSharpInstance.raw.mockReturnValue(mockSharpInstance);
  });

  describe("hashImage", () => {
    it("resizes to 9x8 grayscale", async () => {
      // Create a 9x8 = 72 byte buffer (all zeros = all pixels equal = hash 0)
      mockSharpInstance.toBuffer.mockResolvedValue(Buffer.alloc(72, 0));

      await hasher.hashImage("/path/to/image.png");

      expect(mockSharpInstance.resize).toHaveBeenCalledWith(9, 8, {
        fit: "fill",
      });
      expect(mockSharpInstance.grayscale).toHaveBeenCalled();
      expect(mockSharpInstance.raw).toHaveBeenCalled();
    });

    it("produces 0n for uniform image (all same pixel value)", async () => {
      // All pixels = 128 → no pixel is greater than its neighbor
      mockSharpInstance.toBuffer.mockResolvedValue(Buffer.alloc(72, 128));

      const hash = await hasher.hashImage("/path/to/image.png");
      expect(hash).toBe(0n);
    });

    it("produces all 1s for strictly descending rows", async () => {
      // Each row: 240, 210, 180, 150, 120, 90, 60, 30, 0 (9 pixels, strictly descending)
      // Every left > right comparison is true → all 64 bits set
      const pixels = Buffer.alloc(72);
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 9; x++) {
          pixels[y * 9 + x] = 240 - x * 30;
        }
      }
      mockSharpInstance.toBuffer.mockResolvedValue(pixels);

      const hash = await hasher.hashImage("/path/to/image.png");
      expect(hash).toBe(0xFFFFFFFFFFFFFFFFn);
    });

    it("produces all 0s for strictly ascending rows", async () => {
      // Each row: 0, 30, 60, 90, 120, 150, 180, 210, 240 (strictly ascending)
      // Every left > right comparison is false → all 64 bits 0
      const pixels = Buffer.alloc(72);
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 9; x++) {
          pixels[y * 9 + x] = x * 30;
        }
      }
      mockSharpInstance.toBuffer.mockResolvedValue(pixels);

      const hash = await hasher.hashImage("/path/to/image.png");
      expect(hash).toBe(0n);
    });

    it("produces consistent hash for same input", async () => {
      const pixels = Buffer.from(
        Array.from({ length: 72 }, (_, i) => (i * 37) % 256),
      );
      mockSharpInstance.toBuffer.mockResolvedValue(pixels);

      const hash1 = await hasher.hashImage("/path/to/image.png");
      const hash2 = await hasher.hashImage("/path/to/image.png");

      expect(hash1).toBe(hash2);
    });

    it("produces a known hash for a specific pixel pattern", async () => {
      // Build a specific pattern and verify the hash manually
      // Row 0: [10, 20, 10, 20, 10, 20, 10, 20, 10]
      // Comparisons: 10>20=0, 20>10=1, 10>20=0, 20>10=1, 10>20=0, 20>10=1, 10>20=0, 20>10=1
      // Row 0 bits: 01010101
      const pixels = Buffer.alloc(72);
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 9; x++) {
          pixels[y * 9 + x] = x % 2 === 0 ? 10 : 20;
        }
      }
      mockSharpInstance.toBuffer.mockResolvedValue(pixels);

      const hash = await hasher.hashImage("/path/to/image.png");

      // Each row produces 01010101 = 0x55
      // 8 rows of 0x55 = 0x5555555555555555
      expect(hash).toBe(0x5555555555555555n);
    });
  });

  describe("hashBuffer", () => {
    it("works with buffer input", async () => {
      mockSharpInstance.toBuffer.mockResolvedValue(Buffer.alloc(72, 0));

      const hash = await hasher.hashBuffer(Buffer.from("fake image data"));
      expect(typeof hash).toBe("bigint");
    });
  });

  describe("hashBatch", () => {
    it("returns hashes with image paths", async () => {
      mockSharpInstance.toBuffer.mockResolvedValue(Buffer.alloc(72, 0));

      const results = await hasher.hashBatch(["/a.png", "/b.png", "/c.png"]);

      expect(results).toHaveLength(3);
      expect(results[0].imagePath).toBe("/a.png");
      expect(results[1].imagePath).toBe("/b.png");
      expect(results[2].imagePath).toBe("/c.png");
      expect(typeof results[0].hash).toBe("bigint");
    });
  });

  describe("similar vs different images", () => {
    it("similar images have low hamming distance", async () => {
      // Two nearly identical pixel patterns
      const pixels1 = Buffer.from(
        Array.from({ length: 72 }, (_, i) => (i * 37) % 256),
      );
      const pixels2 = Buffer.from(pixels1);
      // Modify just one pixel slightly
      pixels2[5] = (pixels1[5] + 1) % 256;

      mockSharpInstance.toBuffer.mockResolvedValueOnce(pixels1);
      const hash1 = await hasher.hashImage("/a.png");

      mockSharpInstance.toBuffer.mockResolvedValueOnce(pixels2);
      const hash2 = await hasher.hashImage("/b.png");

      // Small pixel change → small hash change
      expect(hammingDistance(hash1, hash2)).toBeLessThanOrEqual(2);
    });

    it("different images have high hamming distance", async () => {
      // Ascending gradient
      const pixels1 = Buffer.from(
        Array.from({ length: 72 }, (_, i) => Math.floor((i / 72) * 255)),
      );
      // Descending gradient
      const pixels2 = Buffer.from(
        Array.from({ length: 72 }, (_, i) =>
          Math.floor(((72 - i) / 72) * 255),
        ),
      );

      mockSharpInstance.toBuffer.mockResolvedValueOnce(pixels1);
      const hash1 = await hasher.hashImage("/a.png");

      mockSharpInstance.toBuffer.mockResolvedValueOnce(pixels2);
      const hash2 = await hasher.hashImage("/b.png");

      expect(hammingDistance(hash1, hash2)).toBeGreaterThan(20);
    });
  });
});
