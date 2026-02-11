import { describe, it, expect, vi, beforeEach } from "vitest";
import { SceneDetector } from "../../src/core/scene-detector.js";
import { MediaProcessingError } from "../../src/errors.js";
import { EventEmitter } from "events";

let mockStderr: string;
let mockExitCode: number | null;
let mockSpawnError: Error | null;

vi.mock("child_process", () => ({
  spawn: vi.fn(() => {
    const proc = new EventEmitter() as any;
    const stderrEmitter = new EventEmitter();
    proc.stderr = stderrEmitter;

    // Emit data then close, giving the listener time to attach
    process.nextTick(() => {
      if (mockSpawnError) {
        proc.emit("error", mockSpawnError);
        return;
      }
      if (mockStderr) {
        stderrEmitter.emit("data", Buffer.from(mockStderr));
      }
      proc.emit("close", mockExitCode);
    });

    return proc;
  }),
}));

describe("SceneDetector", () => {
  let detector: SceneDetector;

  beforeEach(() => {
    detector = new SceneDetector();
    mockStderr = "";
    mockExitCode = 0;
    mockSpawnError = null;
    vi.clearAllMocks();
  });

  describe("parseShowInfoOutput", () => {
    it("parses showinfo lines with pts_time", () => {
      const stderr = [
        "[Parsed_showinfo_1 @ 0x1234] n:   0 pts:      0 pts_time:0       pos:     1234 fmt:yuv420p",
        "[Parsed_showinfo_1 @ 0x1234] n:  42 pts:  84000 pts_time:3.36    pos:   123456 fmt:yuv420p",
        "[Parsed_showinfo_1 @ 0x1234] n: 120 pts: 240000 pts_time:9.6     pos:   456789 fmt:yuv420p",
      ].join("\n");

      const scenes = detector.parseShowInfoOutput(stderr);

      expect(scenes).toHaveLength(3);
      expect(scenes[0].timestamp).toBe(0);
      expect(scenes[1].timestamp).toBeCloseTo(3.36);
      expect(scenes[2].timestamp).toBeCloseTo(9.6);
    });

    it("returns empty array for output with no showinfo lines", () => {
      const stderr =
        "frame=  100 fps= 30 q=0.0 Lsize=       0kB time=00:00:03.33 bitrate=   0.0kbits/s\n";
      const scenes = detector.parseShowInfoOutput(stderr);
      expect(scenes).toHaveLength(0);
    });

    it("picks up scene scores from select filter debug output", () => {
      const stderr = [
        "[Parsed_select_0 @ 0x1234] t:5.00 ... scene:0.456789",
        "[Parsed_showinfo_1 @ 0x1234] n:  150 pts: 125000 pts_time:5       pos:   500000 fmt:yuv420p",
      ].join("\n");

      const scenes = detector.parseShowInfoOutput(stderr);
      expect(scenes).toHaveLength(1);
      expect(scenes[0].timestamp).toBe(5);
      expect(scenes[0].sceneScore).toBeCloseTo(0.456789);
    });

    it("defaults scene score to 1.0 when select debug is unavailable", () => {
      const stderr =
        "[Parsed_showinfo_1 @ 0x1234] n:  10 pts:  20000 pts_time:2.5     pos:   100000 fmt:yuv420p\n";
      const scenes = detector.parseShowInfoOutput(stderr);
      expect(scenes).toHaveLength(1);
      expect(scenes[0].sceneScore).toBe(1.0);
    });

    it("handles mixed regular ffmpeg output and showinfo lines", () => {
      const stderr = [
        "Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'test.mp4':",
        "  Duration: 00:01:00.00, start: 0.000000, bitrate: 1000 kb/s",
        "[Parsed_showinfo_1 @ 0x1234] n:   0 pts:      0 pts_time:0       pos:     1234 fmt:yuv420p",
        "frame=  100 fps= 30 q=0.0 size=       0kB",
        "[Parsed_showinfo_1 @ 0x1234] n:  90 pts: 180000 pts_time:7.2     pos:   300000 fmt:yuv420p",
      ].join("\n");

      const scenes = detector.parseShowInfoOutput(stderr);
      expect(scenes).toHaveLength(2);
      expect(scenes[0].timestamp).toBe(0);
      expect(scenes[1].timestamp).toBeCloseTo(7.2);
    });
  });

  describe("detectScenes", () => {
    it("calls ffmpeg with correct scene filter arguments", async () => {
      const { spawn } = await import("child_process");
      mockStderr =
        "[Parsed_showinfo_1 @ 0x1234] n:  42 pts:  84000 pts_time:3.36    pos:   123456 fmt:yuv420p\n";

      const scenes = await detector.detectScenes("/path/to/video.mp4", {
        threshold: 0.4,
      });

      expect(spawn).toHaveBeenCalledWith(
        "ffmpeg",
        expect.arrayContaining([
          "-i",
          "/path/to/video.mp4",
          "-vf",
          expect.stringContaining("select='gt(scene,0.4)'")
,
        ]),
        expect.any(Object),
      );
      expect(scenes).toHaveLength(1);
    });

    it("filters scenes by minSceneLength", async () => {
      mockStderr = [
        "[Parsed_showinfo_1 @ 0x1234] n:  10 pts:  20000 pts_time:1       pos:   100000 fmt:yuv420p",
        "[Parsed_showinfo_1 @ 0x1234] n:  20 pts:  40000 pts_time:1.5     pos:   200000 fmt:yuv420p",
        "[Parsed_showinfo_1 @ 0x1234] n:  90 pts: 180000 pts_time:5       pos:   300000 fmt:yuv420p",
        "[Parsed_showinfo_1 @ 0x1234] n: 180 pts: 360000 pts_time:10      pos:   500000 fmt:yuv420p",
      ].join("\n");

      const scenes = await detector.detectScenes("/path/to/video.mp4", {
        minSceneLength: 2.0,
      });

      expect(scenes).toHaveLength(3);
      expect(scenes.map((s) => s.timestamp)).toEqual([1, 5, 10]);
    });

    it("rejects when FFmpeg fails to spawn", async () => {
      mockSpawnError = new Error("ENOENT");

      await expect(
        detector.detectScenes("/path/to/video.mp4"),
      ).rejects.toThrow(MediaProcessingError);
    });

    it("uses default threshold of 0.3 when not specified", async () => {
      const { spawn } = await import("child_process");
      mockStderr = "";

      await detector.detectScenes("/path/to/video.mp4");

      expect(spawn).toHaveBeenCalledWith(
        "ffmpeg",
        expect.arrayContaining([expect.stringContaining("select='gt(scene,0.3)'")
]),
        expect.any(Object),
      );
    });

    it("returns empty array when no scenes detected", async () => {
      mockStderr = "frame=  100 fps= 30 q=0.0 Lsize=       0kB\n";

      const scenes = await detector.detectScenes("/path/to/video.mp4");
      expect(scenes).toHaveLength(0);
    });
  });
});
