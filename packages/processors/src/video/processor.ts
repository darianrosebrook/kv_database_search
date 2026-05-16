import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as crypto from "crypto";
import { ContentType } from "@kv/types";
import {
  detectLanguage,
  EntityExtractor,
  countWords,
  countCharacters,
} from "@kv/utils";
import {
  BaseContentProcessor,
  ProcessorOptions,
  ProcessorResult,
} from "../base-processor.ts";
import { OCRProcessor } from "../ocr-processor.ts";
import { AudioTranscriptionProcessor } from "../audio-transcription-processor.ts";
import {
  AdaptiveFrameExtractor,
  SceneDetector,
  FrameExtractor,
  FrameDeduplicator,
  PerceptualHasher,
  VideoMetadataExtractor,
} from "@kv/media";
import { configureFFmpegPaths } from "./ffmpeg-config.ts";
import {
  classifyVideoContent,
  createTextSummary,
  detectKeyframes,
} from "./classify-content.ts";
import { exportArtifacts } from "./canonical-transcript.ts";
import {
  ExtractedFrame,
  VideoContentMetadata,
  VideoProcessorOptions,
} from "./types.ts";

export type {
  ExtractedFrame,
  VideoContentMetadata,
  VideoMetadata,
  VideoProcessorOptions,
} from "./types.ts";

export class VideoProcessor extends BaseContentProcessor {
  private entityExtractor: EntityExtractor;
  private ocrProcessor: OCRProcessor;
  private audioProcessor: AudioTranscriptionProcessor;
  private adaptiveExtractor: AdaptiveFrameExtractor;
  private metadataExtractor: VideoMetadataExtractor;

  constructor() {
    super("Video Processor", [ContentType.VIDEO]);
    this.entityExtractor = new EntityExtractor();
    this.ocrProcessor = new OCRProcessor();
    this.audioProcessor = new AudioTranscriptionProcessor();
    this.metadataExtractor = new VideoMetadataExtractor();

    const sceneDetector = new SceneDetector();
    const frameExtractor = new FrameExtractor();
    const hasher = new PerceptualHasher();
    const deduplicator = new FrameDeduplicator(hasher);
    this.adaptiveExtractor = new AdaptiveFrameExtractor(
      sceneDetector,
      frameExtractor,
      deduplicator,
      this.metadataExtractor,
    );
  }

  /**
   * Allocate a unique per-job temp directory under the OS temp root.
   * Caller is responsible for removing it (runPipeline does so in finally).
   */
  private createJobTempDir(): string {
    const id = crypto.randomBytes(8).toString("hex");
    const dir = path.join(os.tmpdir(), `kv-video-${id}`);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  /**
   * Public entry point for buffer-based extraction. Writes the buffer to a
   * temp file and runs the unified pipeline.
   */
  async extractFromBuffer(
    buffer: Buffer,
    options?: VideoProcessorOptions,
  ): Promise<ProcessorResult> {
    const jobDir = this.createJobTempDir();
    const tempVideoPath = path.join(jobDir, "video.mp4");
    fs.writeFileSync(tempVideoPath, buffer);
    return this.runPipeline(tempVideoPath, tempVideoPath, jobDir, options);
  }

  /**
   * Public entry point for file-path-based extraction. Avoids loading the
   * video into the JS heap (uses an OS-level copy on APFS).
   */
  async extractText(
    filePath: string,
    options?: VideoProcessorOptions,
  ): Promise<ProcessorResult> {
    let jobDir: string | undefined;
    try {
      jobDir = this.createJobTempDir();
      const tempVideoPath = path.join(jobDir, "video.mp4");
      fs.copyFileSync(filePath, tempVideoPath);
      return await this.runPipeline(filePath, tempVideoPath, jobDir, options);
    } catch (error) {
      // If we created a jobDir but never reached runPipeline (e.g. copy
      // failed), best-effort clean it up here.
      if (jobDir) {
        try {
          fs.rmSync(jobDir, { recursive: true, force: true });
        } catch {
          // ignore
        }
      }
      const msg = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(`Failed to read video file: ${msg}`);
    }
  }

  /**
   * Unified pipeline. `sourcePath` is the original (used for result text
   * and artifact naming); `tempVideoPath` is the materialized copy ffmpeg
   * and whisper run against; `jobDir` owns both the temp video and any
   * extracted frames, and is cleaned up in `finally`.
   */
  private async runPipeline(
    sourcePath: string,
    tempVideoPath: string,
    jobDir: string,
    options?: VideoProcessorOptions,
  ): Promise<ProcessorResult> {
    // Lazily ensure ffmpeg/ffprobe paths are resolved before any extractor
    // runs. Idempotent and probes binaries by execution.
    await configureFFmpegPaths();

    const { result, time } = await this.measureTime(async () => {
      try {
        const pipelineStart = Date.now();
        const stageTime = () =>
          ((Date.now() - pipelineStart) / 1000).toFixed(1);
        console.log("🎬 Starting video processing...");

        try {
          // Metadata
          console.log(`[${stageTime()}s] 📊 Extracting video metadata...`);
          const metaStart = Date.now();
          const videoMetadata =
            await this.metadataExtractor.extract(tempVideoPath);
          console.log(
            `  ✅ Metadata extracted in ${((Date.now() - metaStart) / 1000).toFixed(1)}s ` +
              `(${videoMetadata.duration?.toFixed(1)}s, ${videoMetadata.width}x${videoMetadata.height})`,
          );

          // Frame extraction
          console.log(
            `[${stageTime()}s] 🖼️ Extracting video frames (adaptive scene detection)...`,
          );
          const frameStart = Date.now();
          const extractionResult = await this.adaptiveExtractor.extract(
            tempVideoPath,
            {
              sceneThreshold: 0.3,
              minSceneLength: 1.0,
              enableDeduplication: true,
              maxFrames: options?.maxFramesToExtract ?? 200,
              fallbackInterval: options?.frameExtractionInterval ?? 30,
              outputDir: jobDir,
              outputFormat: "png",
            },
          );
          console.log(
            `  ✅ Frame extraction in ${((Date.now() - frameStart) / 1000).toFixed(1)}s — ` +
              `strategy: ${extractionResult.stats.strategy}, ` +
              `scenes: ${extractionResult.stats.scenesDetected}, ` +
              `frames: ${extractionResult.stats.framesExtracted}, ` +
              `deduped: ${extractionResult.stats.duplicatesRemoved}`,
          );
          const frames: ExtractedFrame[] = extractionResult.frames.map((f) => ({
            frameNumber: f.frameNumber,
            timestamp: f.timestamp,
            imagePath: f.imagePath,
          }));

          // OCR — preserve frame files only when we'll be exporting them
          const exportMode = !!options?.outputDir;
          console.log(
            `[${stageTime()}s] 🔍 Performing OCR on ${frames.length} frames...`,
          );
          const processedFrames = await this.processFramesWithOCR(
            frames,
            options,
            exportMode,
          );

          // Audio transcription
          const audioTranscription = videoMetadata.hasAudio &&
          options?.enableSpeechTranscription !== false
            ? await this.transcribeAudio(tempVideoPath, videoMetadata.duration, stageTime)
            : undefined;

          // Combine text
          const ocrText = combineTextFromFrames(processedFrames);
          const audioText = audioTranscription?.text || "";
          const allText = [ocrText, audioText]
            .filter((t) => t.trim())
            .join("\n\n");
          const hasText = allText.length > 0;

          // Entities
          console.log(
            `[${stageTime()}s] 🏷️ Extracting entities and relationships...`,
          );
          const entityStart = Date.now();
          const entities = this.entityExtractor.extractEntities(allText);
          const relationships = this.entityExtractor.extractRelationships(
            allText,
            entities,
          );
          console.log(
            `  ✅ Entities in ${((Date.now() - entityStart) / 1000).toFixed(1)}s: ` +
              `${entities.length} entities, ${relationships.length} relationships`,
          );

          // Classification + summary + keyframes
          console.log(`[${stageTime()}s] 🎯 Classifying video content...`);
          const classifyStart = Date.now();
          const contentClassification = classifyVideoContent(
            processedFrames,
            allText,
          );
          const textSummary = createTextSummary(processedFrames);
          const keyframes = detectKeyframes(processedFrames);
          console.log(
            `  ✅ Classification + keyframes in ${((Date.now() - classifyStart) / 1000).toFixed(1)}s`,
          );

          const metadata: VideoContentMetadata = {
            type: ContentType.VIDEO,
            language: options?.language || detectLanguage(allText),
            duration: videoMetadata.duration,
            wordCount: countWords(allText),
            characterCount: countCharacters(allText),
            videoMetadata: {
              duration: videoMetadata.duration,
              frameRate: videoMetadata.frameRate,
              resolution: `${videoMetadata.width}x${videoMetadata.height}`,
              keyframesExtracted: keyframes?.count || 0,
              audioAvailable: videoMetadata.hasAudio,
              subtitlesAvailable: false,
              width: videoMetadata.width,
              height: videoMetadata.height,
              codec: videoMetadata.codec,
              bitrate: videoMetadata.bitrate,
              format: videoMetadata.format,
              size: videoMetadata.size,
              aspectRatio: videoMetadata.aspectRatio,
              audioCodec: videoMetadata.audioCodec,
              hasAudio: videoMetadata.hasAudio,
              creationTime: videoMetadata.creationTime,
            },
            hasText,
            frameCount: processedFrames.length,
            extractedFrames: processedFrames,
            audioTranscription,
            entities,
            relationships,
            keyframes,
            textSummary,
            contentClassification,
          };

          console.log(
            `\n✅ Video processing complete in ${stageTime()}s: ` +
              `${processedFrames.length} frames, ${metadata.wordCount} words extracted`,
          );

          // Optional artifact export
          if (exportMode && options.outputDir) {
            console.log(`📦 Exporting artifacts to ${options.outputDir}...`);
            exportArtifacts(
              options.outputDir,
              metadata,
              path.basename(sourcePath),
            );
            // Clean up preserved frame files now that they've been copied
            for (const frame of processedFrames) {
              try {
                if (frame.imagePath && fs.existsSync(frame.imagePath)) {
                  fs.unlinkSync(frame.imagePath);
                }
              } catch {
                // ignore cleanup errors
              }
            }
          }

          return {
            success: true,
            text: hasText
              ? allText
              : `Video: ${path.basename(sourcePath)} (${videoMetadata.duration}s, ${processedFrames.length} frames processed)`,
            metadata,
            processingTime: 0,
          };
        } finally {
          // Remove the entire per-job temp directory: video file, any
          // residual frames the OCR loop didn't unlink, scene-detector
          // intermediates, etc. rmSync with force ignores ENOENT.
          try {
            fs.rmSync(jobDir, { recursive: true, force: true });
          } catch (cleanupError) {
            console.warn(
              `⚠️ Failed to clean up job temp dir ${jobDir}:`,
              cleanupError,
            );
          }
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("❌ Video processing failed:", msg);
        const errorResult = this.createErrorResult(
          `Video processing error: ${msg}`,
        );
        return { ...errorResult, error: msg };
      }
    });

    result.processingTime = time;
    return result;
  }

  private async transcribeAudio(
    tempVideoPath: string,
    durationSec: number,
    stageTime: () => string,
  ): Promise<VideoContentMetadata["audioTranscription"]> {
    console.log(
      `[${stageTime()}s] 🎤 Extracting and transcribing audio (${durationSec?.toFixed(0)}s of audio)...`,
    );
    const audioStart = Date.now();
    try {
      const audioResult = await this.audioProcessor.extractAudioFromVideoPath(
        tempVideoPath,
        {
          useTimestamps: true,
          enableSpeakerDetection: true,
        },
      );

      const elapsed = ((Date.now() - audioStart) / 1000).toFixed(1);

      if (!audioResult.success) {
        console.log(`  ⚠️ No speech detected (${elapsed}s)`);
        return {
          text: "No speech detected in audio",
          hasAudio: true,
          wordCount: 0,
          speechDuration: 0,
          qualityScore: 0,
        };
      }

      const audioMeta = audioResult.metadata;
      console.log(
        `  ✅ Audio transcription in ${elapsed}s: ${audioMeta.wordCount || 0} words extracted`,
      );
      return {
        text: audioResult.text,
        hasAudio: true,
        segments: audioMeta.segments?.map(
          (seg: {
            start: number;
            end: number;
            text: string;
            confidence: number;
          }) => ({
            start: seg.start,
            end: seg.end,
            text: seg.text,
            confidence: seg.confidence,
          }),
        ),
        wordCount: audioMeta.wordCount || 0,
        speechDuration: audioMeta.qualityMetrics?.speechDuration || 0,
        qualityScore: audioMeta.qualityMetrics?.averageConfidence || 0,
      };
    } catch (audioError) {
      const elapsed = ((Date.now() - audioStart) / 1000).toFixed(1);
      console.warn(
        `  ⚠️ Audio transcription failed after ${elapsed}s:`,
        audioError,
      );
      return {
        text: "Audio transcription failed",
        hasAudio: true,
        wordCount: 0,
        speechDuration: 0,
        qualityScore: 0,
      };
    }
  }

  private async processFramesWithOCR(
    frames: ExtractedFrame[],
    _options?: ProcessorOptions,
    preserveFrames: boolean = false,
  ): Promise<ExtractedFrame[]> {
    const processedFrames: ExtractedFrame[] = [];
    const total = frames.length;
    const ocrStartTime = Date.now();

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const frameStart = Date.now();
      try {
        const frameBuffer = fs.readFileSync(frame.imagePath);
        const ocrResult =
          await this.ocrProcessor.extractTextFromBuffer(frameBuffer);
        const entities = this.entityExtractor.extractEntities(ocrResult.text);

        const processed: ExtractedFrame = {
          ...frame,
          ocrText: ocrResult.text,
          ocrConfidence: ocrResult.metadata.confidence || 0,
          entities,
        };

        const elapsed = ((Date.now() - frameStart) / 1000).toFixed(1);
        console.log(
          `  🔍 OCR frame ${i + 1}/${total} ` +
            `@ ${frame.timestamp.toFixed(1)}s ` +
            `(${elapsed}s, ${ocrResult.text.trim().length} chars)`,
        );
        processedFrames.push(processed);
      } catch (ocrError) {
        const elapsed = ((Date.now() - frameStart) / 1000).toFixed(1);
        console.warn(
          `  ⚠️ OCR failed for frame ${i + 1}/${total} (${elapsed}s):`,
          ocrError,
        );
        processedFrames.push(frame);
      } finally {
        if (!preserveFrames) {
          try {
            fs.unlinkSync(frame.imagePath);
          } catch (cleanupError) {
            console.warn("⚠️ Failed to clean up frame file:", cleanupError);
          }
        }
      }
    }

    const totalTime = ((Date.now() - ocrStartTime) / 1000).toFixed(1);
    console.log(`  ✅ OCR complete: ${total} frames in ${totalTime}s`);
    return processedFrames;
  }

  protected createErrorResult(
    errorMessage: string,
    language: string = "unknown",
  ): ProcessorResult {
    return {
      success: false,
      text: `Error: ${errorMessage}`,
      metadata: {
        type: ContentType.VIDEO,
        language: language || "unknown",
        duration: 0,
        wordCount: 0,
        characterCount: 0,
        hasText: false,
        frameCount: 0,
        extractedFrames: [],
        videoMetadata: {
          duration: 0,
          frameRate: 0,
          resolution: "0x0",
          keyframesExtracted: 0,
          audioAvailable: false,
          subtitlesAvailable: false,
          width: 0,
          height: 0,
          codec: "unknown",
          format: "unknown",
          size: 0,
          aspectRatio: "unknown",
          hasAudio: false,
        },
        keyframes: { count: 0, intervals: [] },
      } as VideoContentMetadata,
      processingTime: 0,
    };
  }
}

/**
 * Combine OCR text from processed frames into a single timestamped text
 * block. Frames with no text are skipped.
 */
function combineTextFromFrames(frames: ExtractedFrame[]): string {
  const segments: string[] = [];
  frames.forEach((frame, idx) => {
    if (frame.ocrText && frame.ocrText.trim()) {
      segments.push(
        `[Frame ${idx + 1} @ ${frame.timestamp.toFixed(1)}s]: ${frame.ocrText.trim()}`,
      );
    }
  });
  return segments.join("\n\n");
}
