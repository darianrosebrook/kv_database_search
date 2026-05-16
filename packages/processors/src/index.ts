// Public API for @kv/processors.

export { BaseContentProcessor } from "./base-processor";
export type {
  ContentProcessor,
  ProcessorOptions,
  ProcessorResult,
} from "./base-processor";

export { ContentProcessorRegistry } from "./processor-registry";
export { contentProcessorRegistry } from "./processor-registry-instance";

export { PDFProcessor } from "./pdf-processor";
export { PDFProcessorAdapter } from "./pdf-processor-adapter";
export { OCRProcessor } from "./ocr-processor";
export { OfficeProcessor } from "./office-processor";
export { SpeechProcessor } from "./speech-processor";
export { AudioTranscriptionProcessor } from "./audio-transcription-processor";
export { ImageClassificationProcessor } from "./image-classification-processor";

export { PDFProcessingPipeline } from "./pipelines/pdf-processing-pipeline";
export type {
  PDFProcessingOptions,
  PDFProcessingResult,
} from "./pipelines/pdf-processing-pipeline";

export { EntityAnalyzer } from "./analysis/entity-analyzer";
export type {
  EntityAnalysisResult,
  EntityCluster,
  TopicSummary,
} from "./analysis/entity-analyzer";

// Video sub-module
export {
  VideoProcessor,
  formatTimestamp,
  configureFFmpegPaths,
  classifyVideoContent,
  generateCanonicalTranscript,
} from "./video";
export type {
  ExtractedFrame,
  VideoMetadata,
  VideoProcessorOptions,
  VideoContentMetadata,
} from "./video";
