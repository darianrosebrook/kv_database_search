import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdaptiveFrameExtractor } from "../../src/orchestration/adaptive-frame-extractor.js";
import type { ExtractedFrameInfo, SceneChange } from "../../src/types.js";

function makeFrame(timestamp: number, i: number): ExtractedFrameInfo {
  return { timestamp, frameNumber: i, imagePath: `/tmp/frame_${i}.png` };
}

describe("AdaptiveFrameExtractor", () => {
  let extractor: AdaptiveFrameExtractor;
  let mockSceneDetector: any;
  let mockFrameExtractor: any;
  let mockDeduplicator: any;
  let mockMetadataExtractor: any;

  beforeEach(() => {
    mockSceneDetector = {
      detectScenes: vi.fn().mockResolvedValue([]),
    };
    mockFrameExtractor = {
      extractAtTimestamps: vi.fn().mockImplementation(
        (_path: string, timestamps: number[]) =>
          Promise.resolve(timestamps.map((t, i) => makeFrame(t, i))),
      ),
    };
    mockDeduplicator = {
      deduplicate: vi.fn().mockImplementation((frames: ExtractedFrameInfo[]) =>
        Promise.resolve({
          uniqueFrames: frames,
          duplicatesRemoved: 0,
          clusters: frames.map((f: ExtractedFrameInfo) => ({
            representative: f,
            duplicates: [],
          })),
        }),
      ),
    };
    mockMetadataExtractor = {
      extract: vi.fn().mockResolvedValue({ duration: 120 }),
    };

    extractor = new AdaptiveFrameExtractor(
      mockSceneDetector,
      mockFrameExtractor,
      mockDeduplicator,
      mockMetadataExtractor,
    );
  });

  describe("scene-based strategy", () => {
    it("extracts frames at scene change timestamps", async () => {
      const scenes: SceneChange[] = [
        { timestamp: 5, sceneScore: 0.8 },
        { timestamp: 30, sceneScore: 0.6 },
        { timestamp: 60, sceneScore: 0.9 },
      ];
      mockSceneDetector.detectScenes.mockResolvedValue(scenes);

      const result = await extractor.extract("/video.mp4");

      expect(result.stats.strategy).toBe("scene-based");
      expect(result.stats.scenesDetected).toBe(3);
      expect(result.sceneChanges).toBe(scenes);

      // Should include first frame (0) + scene timestamps
      const extractedTimestamps =
        mockFrameExtractor.extractAtTimestamps.mock.calls[0][1];
      expect(extractedTimestamps).toContain(0);
      expect(extractedTimestamps).toContain(5);
      expect(extractedTimestamps).toContain(30);
      expect(extractedTimestamps).toContain(60);
    });

    it("does not duplicate first frame if scene change is near 0", async () => {
      const scenes: SceneChange[] = [
        { timestamp: 0.2, sceneScore: 0.8 },
        { timestamp: 30, sceneScore: 0.6 },
      ];
      mockSceneDetector.detectScenes.mockResolvedValue(scenes);

      const result = await extractor.extract("/video.mp4");

      const extractedTimestamps =
        mockFrameExtractor.extractAtTimestamps.mock.calls[0][1];
      // Should NOT prepend 0 since first scene is at 0.2 (< 0.5s)
      expect(extractedTimestamps[0]).toBe(0.2);
    });
  });

  describe("fixed-interval fallback", () => {
    it("uses fixed interval when no scenes detected", async () => {
      mockSceneDetector.detectScenes.mockResolvedValue([]);
      mockMetadataExtractor.extract.mockResolvedValue({ duration: 120 });

      const result = await extractor.extract("/video.mp4", {
        fallbackInterval: 30,
      });

      expect(result.stats.strategy).toBe("fixed-interval");

      // 120s / 30s interval = timestamps at 0, 30, 60, 90
      const extractedTimestamps =
        mockFrameExtractor.extractAtTimestamps.mock.calls[0][1];
      expect(extractedTimestamps).toEqual([0, 30, 60, 90]);
    });

    it("respects custom fallback interval", async () => {
      mockSceneDetector.detectScenes.mockResolvedValue([]);
      mockMetadataExtractor.extract.mockResolvedValue({ duration: 60 });

      await extractor.extract("/video.mp4", { fallbackInterval: 10 });

      const extractedTimestamps =
        mockFrameExtractor.extractAtTimestamps.mock.calls[0][1];
      expect(extractedTimestamps).toEqual([0, 10, 20, 30, 40, 50]);
    });
  });

  describe("maxFrames cap", () => {
    it("limits extracted frames to maxFrames", async () => {
      // Generate 50 scene changes
      const scenes: SceneChange[] = Array.from({ length: 50 }, (_, i) => ({
        timestamp: i * 2,
        sceneScore: 0.5,
      }));
      mockSceneDetector.detectScenes.mockResolvedValue(scenes);

      await extractor.extract("/video.mp4", { maxFrames: 10 });

      const extractedTimestamps =
        mockFrameExtractor.extractAtTimestamps.mock.calls[0][1];
      expect(extractedTimestamps.length).toBeLessThanOrEqual(10);
    });

    it("does not limit when under maxFrames", async () => {
      const scenes: SceneChange[] = [
        { timestamp: 5, sceneScore: 0.8 },
        { timestamp: 30, sceneScore: 0.6 },
      ];
      mockSceneDetector.detectScenes.mockResolvedValue(scenes);

      await extractor.extract("/video.mp4", { maxFrames: 100 });

      const extractedTimestamps =
        mockFrameExtractor.extractAtTimestamps.mock.calls[0][1];
      // 0 + 5 + 30 = 3 timestamps
      expect(extractedTimestamps.length).toBe(3);
    });
  });

  describe("deduplication", () => {
    it("runs deduplication by default", async () => {
      const scenes: SceneChange[] = [
        { timestamp: 5, sceneScore: 0.8 },
        { timestamp: 10, sceneScore: 0.6 },
      ];
      mockSceneDetector.detectScenes.mockResolvedValue(scenes);

      await extractor.extract("/video.mp4");

      expect(mockDeduplicator.deduplicate).toHaveBeenCalled();
    });

    it("skips deduplication when disabled", async () => {
      const scenes: SceneChange[] = [
        { timestamp: 5, sceneScore: 0.8 },
      ];
      mockSceneDetector.detectScenes.mockResolvedValue(scenes);

      await extractor.extract("/video.mp4", {
        enableDeduplication: false,
      });

      expect(mockDeduplicator.deduplicate).not.toHaveBeenCalled();
    });

    it("reports duplicates removed in stats", async () => {
      const scenes: SceneChange[] = [
        { timestamp: 5, sceneScore: 0.8 },
        { timestamp: 10, sceneScore: 0.6 },
        { timestamp: 15, sceneScore: 0.5 },
      ];
      mockSceneDetector.detectScenes.mockResolvedValue(scenes);

      // Deduplicator removes 1 frame
      mockDeduplicator.deduplicate.mockResolvedValue({
        uniqueFrames: [makeFrame(0, 0), makeFrame(5, 1), makeFrame(15, 3)],
        duplicatesRemoved: 1,
        clusters: [],
      });

      const result = await extractor.extract("/video.mp4");

      expect(result.stats.duplicatesRemoved).toBe(1);
      expect(result.frames).toHaveLength(3);
    });
  });

  describe("options forwarding", () => {
    it("passes scene detection options", async () => {
      await extractor.extract("/video.mp4", {
        sceneThreshold: 0.5,
        minSceneLength: 2.0,
      });

      expect(mockSceneDetector.detectScenes).toHaveBeenCalledWith(
        "/video.mp4",
        { threshold: 0.5, minSceneLength: 2.0 },
      );
    });

    it("passes frame extraction options", async () => {
      mockSceneDetector.detectScenes.mockResolvedValue([
        { timestamp: 5, sceneScore: 0.8 },
      ]);

      await extractor.extract("/video.mp4", {
        outputDir: "/custom/dir",
        outputFormat: "jpeg",
      });

      expect(mockFrameExtractor.extractAtTimestamps).toHaveBeenCalledWith(
        "/video.mp4",
        expect.any(Array),
        { outputDir: "/custom/dir", outputFormat: "jpeg" },
      );
    });

    it("passes hamming threshold to deduplicator", async () => {
      mockSceneDetector.detectScenes.mockResolvedValue([
        { timestamp: 5, sceneScore: 0.8 },
        { timestamp: 10, sceneScore: 0.6 },
      ]);

      await extractor.extract("/video.mp4", { hammingThreshold: 3 });

      expect(mockDeduplicator.deduplicate).toHaveBeenCalledWith(
        expect.any(Array),
        { hammingThreshold: 3 },
      );
    });
  });

  describe("stats", () => {
    it("returns complete stats", async () => {
      mockMetadataExtractor.extract.mockResolvedValue({ duration: 300 });
      const scenes: SceneChange[] = [
        { timestamp: 10, sceneScore: 0.8 },
        { timestamp: 50, sceneScore: 0.6 },
      ];
      mockSceneDetector.detectScenes.mockResolvedValue(scenes);

      const result = await extractor.extract("/video.mp4");

      expect(result.stats.totalDuration).toBe(300);
      expect(result.stats.scenesDetected).toBe(2);
      expect(result.stats.strategy).toBe("scene-based");
      expect(typeof result.stats.framesExtracted).toBe("number");
      expect(typeof result.stats.duplicatesRemoved).toBe("number");
    });
  });
});
