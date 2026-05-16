// Core components
export { SceneDetector } from "./core/scene-detector.js";
export { FrameExtractor } from "./core/frame-extractor.js";
export { VideoMetadataExtractor } from "./core/video-metadata.js";

// Analysis
export { PerceptualHasher } from "./analysis/perceptual-hasher.js";
export { FrameDeduplicator } from "./analysis/frame-deduplicator.js";
export { hammingDistance, areSimilar } from "./analysis/hamming-distance.js";

// Orchestration
export { AdaptiveFrameExtractor } from "./orchestration/adaptive-frame-extractor.js";

// Utilities
export { createTempDir, cleanupTempDir } from "./utils/temp-files.js";

// Types
export type {
  SceneChange,
  SceneDetectionOptions,
  ExtractedFrameInfo,
  FrameExtractionOptions,
  VideoMetadata,
  PerceptualHash,
  DuplicateCluster,
  DeduplicationResult,
  DeduplicationOptions,
  AdaptiveExtractionOptions,
  AdaptiveExtractionResult,
  AdaptiveExtractionStats,
} from "./types.js";

// Errors
export { MediaProcessingError } from "./errors.js";
