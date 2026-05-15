/**
 * Video processing module: orchestrator + helpers, all separately importable.
 *
 * Public surface:
 *   - VideoProcessor — class extending BaseContentProcessor
 *   - Type exports: VideoMetadata, VideoProcessorOptions, ExtractedFrame,
 *     VideoContentMetadata
 *   - Pure helpers: classifyVideoContent, createTextSummary, detectKeyframes,
 *     formatTimestamp, exportArtifacts, generateCanonicalTranscript,
 *     configureFFmpegPaths
 */
export { VideoProcessor } from "./processor.ts";
export type {
  ExtractedFrame,
  VideoContentMetadata,
  VideoMetadata,
  VideoProcessorOptions,
} from "./types.ts";
export {
  classifyVideoContent,
  createTextSummary,
  detectKeyframes,
  jaccardSimilarity,
} from "./classify-content.ts";
export { formatTimestamp } from "./format-timestamp.ts";
export {
  exportArtifacts,
  generateCanonicalTranscript,
} from "./canonical-transcript.ts";
export { configureFFmpegPaths } from "./ffmpeg-config.ts";
