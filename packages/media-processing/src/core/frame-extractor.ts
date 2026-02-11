import ffmpeg from "fluent-ffmpeg";
import * as path from "path";
import type { ExtractedFrameInfo, FrameExtractionOptions } from "../types.js";
import { MediaProcessingError } from "../errors.js";
import { createTempDir } from "../utils/temp-files.js";

export class FrameExtractor {
  /**
   * Extract frames from a video at the given timestamps.
   */
  async extractAtTimestamps(
    videoPath: string,
    timestamps: number[],
    options?: FrameExtractionOptions,
  ): Promise<ExtractedFrameInfo[]> {
    const outputDir = options?.outputDir ?? createTempDir("frames");
    const format = options?.outputFormat ?? "png";
    const frames: ExtractedFrameInfo[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const filename = `frame_${i}_${timestamp.toFixed(2)}.${format}`;
      const outputPath = path.join(outputDir, filename);

      try {
        const frame = await this.extractSingleFrame(
          videoPath,
          timestamp,
          outputPath,
          i,
        );
        frames.push(frame);
      } catch (err) {
        // Log but continue — partial extraction is acceptable
        const message = err instanceof Error ? err.message : String(err);
        console.warn(
          `Failed to extract frame at ${timestamp}s: ${message}`,
        );
      }
    }

    return frames;
  }

  /**
   * Extract a single frame at a specific timestamp.
   */
  async extractSingleFrame(
    videoPath: string,
    timestamp: number,
    outputPath: string,
    frameNumber: number = 0,
  ): Promise<ExtractedFrameInfo> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .seekInput(timestamp)
        .frames(1)
        .output(outputPath)
        .on("end", () => {
          resolve({
            timestamp,
            frameNumber,
            imagePath: outputPath,
          });
        })
        .on("error", (err) => {
          reject(
            new MediaProcessingError(
              `Frame extraction failed at ${timestamp}s: ${err.message}`,
              "FRAME_EXTRACTION_ERROR",
              { videoPath, timestamp },
            ),
          );
        })
        .run();
    });
  }
}
