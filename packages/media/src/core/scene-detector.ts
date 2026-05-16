import { spawn } from "child_process";
import type { SceneChange, SceneDetectionOptions } from "../types.js";
import { MediaProcessingError } from "../errors.js";

const DEFAULT_THRESHOLD = 0.3;
const DEFAULT_MIN_SCENE_LENGTH = 1.0;

export class SceneDetector {
  /**
   * Detect scene changes in a video using FFmpeg's scene filter.
   *
   * Runs: ffmpeg -i <path> -vf "select='gt(scene,THRESHOLD)',showinfo" -vsync vfn -f null -
   * Parses stderr for scene change timestamps and scores.
   */
  async detectScenes(
    videoPath: string,
    options?: SceneDetectionOptions,
  ): Promise<SceneChange[]> {
    const threshold = options?.threshold ?? DEFAULT_THRESHOLD;
    const minSceneLength = options?.minSceneLength ?? DEFAULT_MIN_SCENE_LENGTH;

    const stderr = await this.runFFmpegSceneDetection(videoPath, threshold);
    const rawScenes = this.parseShowInfoOutput(stderr);
    return this.filterByMinSceneLength(rawScenes, minSceneLength);
  }

  private runFFmpegSceneDetection(
    videoPath: string,
    threshold: number,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = [
        "-i",
        videoPath,
        "-vf",
        `select='gt(scene,${threshold})',showinfo`,
        "-fps_mode",
        "vfr",
        "-f",
        "null",
        "-",
      ];

      const proc = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
      let stderr = "";

      proc.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        // FFmpeg returns 0 on success; non-zero may still have valid output
        if (code !== 0 && stderr.length === 0) {
          reject(
            new MediaProcessingError(
              `FFmpeg scene detection failed with code ${code}`,
              "FFMPEG_SCENE_DETECTION_ERROR",
              { videoPath, code },
            ),
          );
          return;
        }
        resolve(stderr);
      });

      proc.on("error", (err) => {
        reject(
          new MediaProcessingError(
            `Failed to spawn FFmpeg: ${err.message}`,
            "FFMPEG_SPAWN_ERROR",
            { videoPath, error: err.message },
          ),
        );
      });
    });
  }

  /**
   * Parse FFmpeg showinfo filter output for scene change data.
   *
   * Example line:
   * [Parsed_showinfo_1 @ 0x...] n:  42 pts:  84000 pts_time:3.36    ...
   *
   * We also look for scene score in the select filter debug output:
   * [Parsed_select_0 @ 0x...] ... t:3.36 ... scene:0.456789
   */
  parseShowInfoOutput(stderr: string): SceneChange[] {
    const scenes: SceneChange[] = [];
    const lines = stderr.split("\n");

    // Strategy: collect pts_time from showinfo lines, and scene scores from select lines
    const showInfoTimes: number[] = [];
    const selectScores: Map<string, number> = new Map();

    for (const line of lines) {
      // Parse showinfo lines for timestamps
      const showInfoMatch = line.match(
        /\[Parsed_showinfo.*?\].*?pts_time:\s*([\d.]+)/,
      );
      if (showInfoMatch) {
        showInfoTimes.push(parseFloat(showInfoMatch[1]));
        continue;
      }

      // Parse select filter debug lines for scene scores
      const selectMatch = line.match(
        /\[Parsed_select.*?\].*?t:([\d.]+).*?scene:([\d.]+)/,
      );
      if (selectMatch) {
        selectScores.set(selectMatch[1], parseFloat(selectMatch[2]));
      }
    }

    for (const timestamp of showInfoTimes) {
      // Try to find matching scene score from select debug output
      const _tsKey = timestamp.toFixed(2);
      // Look for approximate match in select scores
      let sceneScore = 1.0; // default if we can't find the score
      for (const [t, score] of selectScores) {
        if (Math.abs(parseFloat(t) - timestamp) < 0.05) {
          sceneScore = score;
          break;
        }
      }

      scenes.push({ timestamp, sceneScore });
    }

    return scenes;
  }

  private filterByMinSceneLength(
    scenes: SceneChange[],
    minSceneLength: number,
  ): SceneChange[] {
    if (scenes.length === 0) return scenes;

    const filtered: SceneChange[] = [scenes[0]];
    for (let i = 1; i < scenes.length; i++) {
      const lastTimestamp = filtered[filtered.length - 1].timestamp;
      if (scenes[i].timestamp - lastTimestamp >= minSceneLength) {
        filtered.push(scenes[i]);
      }
    }
    return filtered;
  }
}
