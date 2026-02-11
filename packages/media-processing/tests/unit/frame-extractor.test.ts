import { describe, it, expect, vi, beforeEach } from "vitest";
import { MediaProcessingError } from "../../src/errors.js";

let onEndCb: Function | null = null;
let onErrorCb: Function | null = null;
let seekInputArg: number | null = null;
let framesArg: number | null = null;
let outputArg: string | null = null;
let shouldError = false;
let errorMessage = "codec error";

const chainObj = {
  seekInput: vi.fn((ts: number) => {
    seekInputArg = ts;
    return chainObj;
  }),
  frames: vi.fn((n: number) => {
    framesArg = n;
    return chainObj;
  }),
  output: vi.fn((p: string) => {
    outputArg = p;
    return chainObj;
  }),
  on: vi.fn((event: string, cb: Function) => {
    if (event === "end") onEndCb = cb;
    if (event === "error") onErrorCb = cb;
    return chainObj;
  }),
  run: vi.fn(() => {
    process.nextTick(() => {
      if (shouldError && onErrorCb) {
        onErrorCb(new Error(errorMessage));
      } else if (onEndCb) {
        onEndCb();
      }
    });
  }),
};

vi.mock("fluent-ffmpeg", () => ({
  default: vi.fn(() => chainObj),
}));

vi.mock("../../src/utils/temp-files.js", () => ({
  createTempDir: vi.fn(() => "/tmp/test-frames"),
}));

describe("FrameExtractor", () => {
  let FrameExtractor: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    onEndCb = null;
    onErrorCb = null;
    seekInputArg = null;
    framesArg = null;
    outputArg = null;
    shouldError = false;
    // Reset chain mock returns
    chainObj.seekInput.mockImplementation((ts: number) => {
      seekInputArg = ts;
      return chainObj;
    });
    chainObj.frames.mockImplementation((n: number) => {
      framesArg = n;
      return chainObj;
    });
    chainObj.output.mockImplementation((p: string) => {
      outputArg = p;
      return chainObj;
    });
    chainObj.on.mockImplementation((event: string, cb: Function) => {
      if (event === "end") onEndCb = cb;
      if (event === "error") onErrorCb = cb;
      return chainObj;
    });
    chainObj.run.mockImplementation(() => {
      process.nextTick(() => {
        if (shouldError && onErrorCb) {
          onErrorCb(new Error(errorMessage));
        } else if (onEndCb) {
          onEndCb();
        }
      });
    });

    const mod = await import("../../src/core/frame-extractor.js");
    FrameExtractor = mod.FrameExtractor;
  });

  describe("extractSingleFrame", () => {
    it("calls ffmpeg with correct seek and output", async () => {
      const extractor = new FrameExtractor();
      const frame = await extractor.extractSingleFrame(
        "/path/to/video.mp4",
        5.5,
        "/tmp/frame.png",
        3,
      );

      expect(seekInputArg).toBe(5.5);
      expect(framesArg).toBe(1);
      expect(outputArg).toBe("/tmp/frame.png");
      expect(frame).toEqual({
        timestamp: 5.5,
        frameNumber: 3,
        imagePath: "/tmp/frame.png",
      });
    });

    it("rejects with MediaProcessingError on ffmpeg error", async () => {
      shouldError = true;
      const extractor = new FrameExtractor();

      await expect(
        extractor.extractSingleFrame(
          "/path/to/video.mp4",
          5.5,
          "/tmp/frame.png",
        ),
      ).rejects.toThrow(MediaProcessingError);
    });
  });

  describe("extractAtTimestamps", () => {
    it("extracts frames for each timestamp", async () => {
      const extractor = new FrameExtractor();
      const frames = await extractor.extractAtTimestamps(
        "/path/to/video.mp4",
        [0, 3.5, 7.2],
        { outputDir: "/tmp/test-output" },
      );

      expect(frames).toHaveLength(3);
      expect(frames[0].timestamp).toBe(0);
      expect(frames[1].timestamp).toBe(3.5);
      expect(frames[2].timestamp).toBe(7.2);
      expect(frames[0].frameNumber).toBe(0);
      expect(frames[1].frameNumber).toBe(1);
      expect(frames[2].frameNumber).toBe(2);
    });

    it("continues when individual frame extraction fails", async () => {
      let callCount = 0;
      chainObj.run.mockImplementation(() => {
        callCount++;
        process.nextTick(() => {
          if (callCount === 2 && onErrorCb) {
            onErrorCb(new Error("failed"));
          } else if (onEndCb) {
            onEndCb();
          }
        });
      });

      const extractor = new FrameExtractor();
      const frames = await extractor.extractAtTimestamps(
        "/path/to/video.mp4",
        [0, 5, 10],
        { outputDir: "/tmp/test-output" },
      );

      // 2nd frame fails, 1st and 3rd succeed
      expect(frames).toHaveLength(2);
    });

    it("returns empty array for empty timestamps", async () => {
      const extractor = new FrameExtractor();
      const frames = await extractor.extractAtTimestamps(
        "/path/to/video.mp4",
        [],
      );
      expect(frames).toHaveLength(0);
    });
  });
});
