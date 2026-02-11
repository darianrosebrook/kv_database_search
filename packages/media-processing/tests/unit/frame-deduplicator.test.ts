import { describe, it, expect, vi, beforeEach } from "vitest";
import { FrameDeduplicator } from "../../src/analysis/frame-deduplicator.js";
import type { ExtractedFrameInfo } from "../../src/types.js";

function makeFrame(i: number): ExtractedFrameInfo {
  return {
    timestamp: i * 5,
    frameNumber: i,
    imagePath: `/tmp/frame_${i}.png`,
  };
}

describe("FrameDeduplicator", () => {
  let deduplicator: FrameDeduplicator;
  let mockHashImage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockHashImage = vi.fn();
    const mockHasher = { hashImage: mockHashImage } as any;
    deduplicator = new FrameDeduplicator(mockHasher);
  });

  it("returns empty result for empty input", async () => {
    const result = await deduplicator.deduplicate([]);
    expect(result.uniqueFrames).toHaveLength(0);
    expect(result.duplicatesRemoved).toBe(0);
    expect(result.clusters).toHaveLength(0);
  });

  it("keeps single frame as unique", async () => {
    mockHashImage.mockResolvedValue(0xABCDn);

    const result = await deduplicator.deduplicate([makeFrame(0)]);
    expect(result.uniqueFrames).toHaveLength(1);
    expect(result.duplicatesRemoved).toBe(0);
  });

  it("removes consecutive duplicate frames (identical hashes)", async () => {
    // All frames have the same hash
    mockHashImage.mockResolvedValue(0xABCDn);

    const frames = [makeFrame(0), makeFrame(1), makeFrame(2), makeFrame(3)];
    const result = await deduplicator.deduplicate(frames);

    expect(result.uniqueFrames).toHaveLength(1);
    expect(result.uniqueFrames[0]).toBe(frames[0]);
    expect(result.duplicatesRemoved).toBe(3);
    expect(result.clusters).toHaveLength(1);
    expect(result.clusters[0].duplicates).toHaveLength(3);
  });

  it("keeps all frames when all are unique", async () => {
    // Each frame gets a very different hash
    mockHashImage
      .mockResolvedValueOnce(0x0000000000000000n)
      .mockResolvedValueOnce(0xFFFFFFFFFFFFFFFFn)
      .mockResolvedValueOnce(0x00FF00FF00FF00FFn);

    const frames = [makeFrame(0), makeFrame(1), makeFrame(2)];
    const result = await deduplicator.deduplicate(frames);

    expect(result.uniqueFrames).toHaveLength(3);
    expect(result.duplicatesRemoved).toBe(0);
    expect(result.clusters).toHaveLength(3);
  });

  it("groups consecutive similar frames into clusters", async () => {
    // Frames 0,1,2 are similar (hash ~0x100), frame 3 is different, frames 4,5 are similar
    mockHashImage
      .mockResolvedValueOnce(0x100n)   // frame 0
      .mockResolvedValueOnce(0x101n)   // frame 1 — distance 1 from frame 0
      .mockResolvedValueOnce(0x103n)   // frame 2 — distance 1 from frame 0 (within 5)
      .mockResolvedValueOnce(0xFFFFn)  // frame 3 — very different
      .mockResolvedValueOnce(0xFFF0n)  // frame 4 — distance 4 from frame 3
      .mockResolvedValueOnce(0xFFF1n); // frame 5 — distance 1 from frame 3

    const frames = Array.from({ length: 6 }, (_, i) => makeFrame(i));
    const result = await deduplicator.deduplicate(frames);

    expect(result.uniqueFrames).toHaveLength(2);
    expect(result.uniqueFrames[0]).toBe(frames[0]); // representative of first cluster
    expect(result.uniqueFrames[1]).toBe(frames[3]); // representative of second cluster
    expect(result.duplicatesRemoved).toBe(4);
  });

  it("respects custom hamming threshold", async () => {
    // Two frames with distance 3
    mockHashImage
      .mockResolvedValueOnce(0b000n)
      .mockResolvedValueOnce(0b111n); // distance 3

    const frames = [makeFrame(0), makeFrame(1)];

    // Threshold 2 — they're different
    const strictResult = await deduplicator.deduplicate(frames, {
      hammingThreshold: 2,
    });
    expect(strictResult.uniqueFrames).toHaveLength(2);

    // Reset mocks
    mockHashImage
      .mockResolvedValueOnce(0b000n)
      .mockResolvedValueOnce(0b111n);

    // Threshold 5 — they're similar
    const lenientResult = await deduplicator.deduplicate(frames, {
      hammingThreshold: 5,
    });
    expect(lenientResult.uniqueFrames).toHaveLength(1);
  });

  it("handles hash failures gracefully (keeps frame)", async () => {
    mockHashImage
      .mockResolvedValueOnce(0xABCDn)
      .mockRejectedValueOnce(new Error("sharp failed"))
      .mockResolvedValueOnce(0xABCDn);

    const frames = [makeFrame(0), makeFrame(1), makeFrame(2)];
    const result = await deduplicator.deduplicate(frames);

    // Frame 1 gets a sentinel hash so it's kept as unique
    // Frame 2 has hash 0xABCD but is compared to the sentinel, so it's also different
    expect(result.uniqueFrames.length).toBeGreaterThanOrEqual(2);
  });
});
