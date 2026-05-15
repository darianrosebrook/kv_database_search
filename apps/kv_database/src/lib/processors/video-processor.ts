/**
 * Back-compat re-export. The video processor was split into
 * `./video/{processor,classify-content,canonical-transcript,...}.ts`.
 * Existing callers can keep importing from this path; new code should
 * import from `./video` directly.
 */
export {
  VideoProcessor,
  classifyVideoContent,
  createTextSummary,
  detectKeyframes,
  formatTimestamp,
  exportArtifacts,
  generateCanonicalTranscript,
  configureFFmpegPaths,
} from "./video/index.ts";
export type {
  ExtractedFrame,
  VideoContentMetadata,
  VideoMetadata,
  VideoProcessorOptions,
} from "./video/index.ts";
