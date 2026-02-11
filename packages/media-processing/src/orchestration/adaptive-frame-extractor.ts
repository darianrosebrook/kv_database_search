import type {
  AdaptiveExtractionOptions,
  AdaptiveExtractionResult,
  AdaptiveExtractionStats,
} from "../types.js";
import type { SceneDetector } from "../core/scene-detector.js";
import type { FrameExtractor } from "../core/frame-extractor.js";
import type { FrameDeduplicator } from "../analysis/frame-deduplicator.js";
import type { VideoMetadataExtractor } from "../core/video-metadata.js";

const DEFAULT_SCENE_THRESHOLD = 0.3;
const DEFAULT_MIN_SCENE_LENGTH = 1.0;
const DEFAULT_MAX_FRAMES = 200;
const DEFAULT_FALLBACK_INTERVAL = 30;
const DEFAULT_HAMMING_THRESHOLD = 5;

export class AdaptiveFrameExtractor {
  constructor(
    private sceneDetector: SceneDetector,
    private frameExtractor: FrameExtractor,
    private deduplicator: FrameDeduplicator,
    private metadataExtractor: VideoMetadataExtractor,
  ) {}

  async extract(
    videoPath: string,
    options?: AdaptiveExtractionOptions,
  ): Promise<AdaptiveExtractionResult> {
    const sceneThreshold = options?.sceneThreshold ?? DEFAULT_SCENE_THRESHOLD;
    const minSceneLength = options?.minSceneLength ?? DEFAULT_MIN_SCENE_LENGTH;
    const maxFrames = options?.maxFrames ?? DEFAULT_MAX_FRAMES;
    const fallbackInterval = options?.fallbackInterval ?? DEFAULT_FALLBACK_INTERVAL;
    const enableDedup = options?.enableDeduplication ?? true;
    const hammingThreshold = options?.hammingThreshold ?? DEFAULT_HAMMING_THRESHOLD;

    // 1. Get video duration
    const metadata = await this.metadataExtractor.extract(videoPath);
    const duration = metadata.duration;

    // 2. Run scene detection
    const sceneChanges = await this.sceneDetector.detectScenes(videoPath, {
      threshold: sceneThreshold,
      minSceneLength,
    });

    // 3. Determine timestamps to extract
    let timestamps: number[];
    let strategy: AdaptiveExtractionStats["strategy"];

    if (sceneChanges.length > 0) {
      timestamps = sceneChanges.map((s) => s.timestamp);
      strategy = "scene-based";

      // Always include first frame if not already a scene change
      if (timestamps[0] > 0.5) {
        timestamps.unshift(0);
      }
    } else {
      // Fallback: fixed interval sampling
      timestamps = this.generateFixedIntervalTimestamps(
        duration,
        fallbackInterval,
      );
      strategy = "fixed-interval";
    }

    // 4. Apply maxFrames cap
    if (timestamps.length > maxFrames) {
      timestamps = this.sampleEvenly(timestamps, maxFrames);
    }

    // 5. Extract frames
    let frames = await this.frameExtractor.extractAtTimestamps(
      videoPath,
      timestamps,
      {
        outputDir: options?.outputDir,
        outputFormat: options?.outputFormat,
      },
    );

    // 6. Deduplicate if enabled
    let duplicatesRemoved = 0;
    if (enableDedup && frames.length > 1) {
      const dedupResult = await this.deduplicator.deduplicate(frames, {
        hammingThreshold,
      });
      frames = dedupResult.uniqueFrames;
      duplicatesRemoved = dedupResult.duplicatesRemoved;
    }

    return {
      frames,
      sceneChanges,
      stats: {
        totalDuration: duration,
        scenesDetected: sceneChanges.length,
        framesExtracted: frames.length,
        duplicatesRemoved,
        strategy,
      },
    };
  }

  private generateFixedIntervalTimestamps(
    duration: number,
    interval: number,
  ): number[] {
    const timestamps: number[] = [0];
    let t = interval;
    while (t < duration) {
      timestamps.push(t);
      t += interval;
    }
    return timestamps;
  }

  /**
   * Evenly sample N timestamps from a larger set.
   */
  private sampleEvenly(timestamps: number[], count: number): number[] {
    if (timestamps.length <= count) return timestamps;

    const result: number[] = [];
    const step = (timestamps.length - 1) / (count - 1);

    for (let i = 0; i < count; i++) {
      const idx = Math.round(i * step);
      result.push(timestamps[idx]);
    }

    return result;
  }
}
