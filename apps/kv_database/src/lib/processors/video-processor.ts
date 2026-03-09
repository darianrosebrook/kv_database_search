import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import * as path from "path";
import { ContentType, ContentMetadata } from "../../types/index.ts";
import {
  detectLanguage,
  EntityExtractor,
  ExtractedEntity,
  EntityRelationship,
  countWords,
  countCharacters,
} from "../utils.ts";
import {
  BaseContentProcessor,
  ProcessorOptions,
  ProcessorResult,
} from "./base-processor.ts";
import { OCRProcessor } from "./ocr-processor.ts";
import { AudioTranscriptionProcessor } from "./audio-transcription-processor.ts";
import {
  AdaptiveFrameExtractor,
  SceneDetector,
  FrameExtractor,
  FrameDeduplicator,
  PerceptualHasher,
  VideoMetadataExtractor,
} from "@obsidian-rag/media-processing";

export interface VideoMetadata {
  duration: number; // in seconds
  width: number;
  height: number;
  frameRate: number;
  codec: string;
  bitrate?: number;
  format: string;
  size: number; // file size in bytes
  aspectRatio: string;
  audioCodec?: string;
  hasAudio: boolean;
  creationTime?: Date;
}

export interface VideoProcessorOptions extends ProcessorOptions {
  enableSpeechTranscription?: boolean;
  frameExtractionInterval?: number; // seconds between frame extractions
  maxFramesToExtract?: number;
  enableOCR?: boolean;
  outputDir?: string; // If set, export artifacts (keyframes, transcript, manifest) to this directory
}

export interface ExtractedFrame {
  frameNumber: number;
  timestamp: number; // in seconds
  imagePath: string;
  ocrText?: string;
  ocrConfidence?: number;
  entities?: ExtractedEntity[];
  textBlocks?: Array<{
    text: string;
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export interface VideoContentMetadata extends ContentMetadata {
  // Override videoMetadata to be compatible with base interface
  videoMetadata: {
    duration: number;
    frameRate: number;
    resolution: string;
    keyframesExtracted: number;
    audioAvailable: boolean;
    subtitlesAvailable: boolean;
    width: number;
    height: number;
    codec: string;
    bitrate?: number;
    format: string;
    size: number;
    aspectRatio: string;
    audioCodec?: string;
    hasAudio: boolean;
    creationTime?: Date;
  };
  hasText: boolean;
  frameCount: number;
  extractedFrames: ExtractedFrame[];
  audioTranscription?: {
    text: string;
    hasAudio: boolean;
    segments?: Array<{
      start: number;
      end: number;
      text: string;
      confidence?: number;
    }>;
    wordCount: number;
    speechDuration: number;
    qualityScore: number;
  };
  entities?: ExtractedEntity[];
  relationships?: EntityRelationship[];
  keyframes?: {
    count: number;
    intervals: number[]; // timestamps of significant frames
  };
  textSummary?: {
    totalTextBlocks: number;
    averageConfidence: number;
    languages: string[];
    dominantLanguage: string;
  };
  contentClassification?: {
    isScreenRecording: boolean;
    hasUI: boolean;
    hasCode: boolean;
    hasPresentation: boolean;
    confidence: number;
  };
}

export class VideoProcessor extends BaseContentProcessor {
  private entityExtractor: EntityExtractor;
  private ocrProcessor: OCRProcessor;
  private audioProcessor: AudioTranscriptionProcessor;
  private adaptiveExtractor: AdaptiveFrameExtractor;
  private metadataExtractor: VideoMetadataExtractor;
  private tempDir: string;

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

    this.tempDir = "/tmp/video-processing";

    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    // Configure ffmpeg paths if available
    this.configureFFmpegPaths();
  }

  /**
   * Configure FFmpeg paths dynamically
   */
  private configureFFmpegPaths(): void {
    try {
      // Try common paths where ffmpeg might be installed
      const possiblePaths = [
        "/opt/homebrew/bin/ffmpeg", // Homebrew on Apple Silicon
        "/usr/local/bin/ffmpeg", // Homebrew on Intel
        "/usr/bin/ffmpeg", // Linux package managers
        "ffmpeg", // System PATH
      ];

      const possibleFfprobePaths = [
        "/opt/homebrew/bin/ffprobe",
        "/usr/local/bin/ffprobe",
        "/usr/bin/ffprobe",
        "ffprobe",
      ];

      // Try to find working paths
      for (const ffmpegPath of possiblePaths) {
        try {
          if (fs.existsSync(ffmpegPath) || ffmpegPath === "ffmpeg") {
            ffmpeg.setFfmpegPath(ffmpegPath);
            console.log(`✅ FFmpeg configured: ${ffmpegPath}`);
            break;
          }
        } catch {
          continue;
        }
      }

      for (const ffprobePath of possibleFfprobePaths) {
        try {
          if (fs.existsSync(ffprobePath) || ffprobePath === "ffprobe") {
            ffmpeg.setFfprobePath(ffprobePath);
            console.log(`✅ FFprobe configured: ${ffprobePath}`);
            break;
          }
        } catch {
          continue;
        }
      }
    } catch {
      console.warn(
        "⚠️ Could not configure FFmpeg paths, using system defaults"
      );
    }
  }

  /**
   * Extract text and metadata from video files
   */
  async extractFromBuffer(
    buffer: Buffer,
    options?: VideoProcessorOptions
  ): Promise<ProcessorResult> {
    const { result, time } = await this.measureTime(async () => {
      try {
        const pipelineStart = Date.now();
        const stageTime = () => ((Date.now() - pipelineStart) / 1000).toFixed(1);
        console.log("🎬 Starting video processing...");

        // Write buffer to temporary file
        const tempVideoPath = path.join(
          this.tempDir,
          `video_${Date.now()}.mp4`
        );
        fs.writeFileSync(tempVideoPath, buffer);

        try {
          // Extract video metadata
          console.log(`[${stageTime()}s] 📊 Extracting video metadata...`);
          const metaStart = Date.now();
          const videoMetadata = await this.metadataExtractor.extract(tempVideoPath);
          console.log(`  ✅ Metadata extracted in ${((Date.now() - metaStart) / 1000).toFixed(1)}s (${videoMetadata.duration?.toFixed(1)}s, ${videoMetadata.width}x${videoMetadata.height})`);

          // Extract frames using adaptive scene detection
          console.log(`[${stageTime()}s] 🖼️ Extracting video frames (adaptive scene detection)...`);
          const frameStart = Date.now();
          const extractionResult = await this.adaptiveExtractor.extract(
            tempVideoPath,
            {
              sceneThreshold: 0.3,
              minSceneLength: 1.0,
              enableDeduplication: true,
              maxFrames: (options as VideoProcessorOptions)?.maxFramesToExtract ?? 200,
              fallbackInterval: (options as VideoProcessorOptions)?.frameExtractionInterval ?? 30,
              outputDir: this.tempDir,
              outputFormat: "png",
            }
          );
          console.log(
            `  ✅ Frame extraction in ${((Date.now() - frameStart) / 1000).toFixed(1)}s — ` +
            `strategy: ${extractionResult.stats.strategy}, ` +
            `scenes: ${extractionResult.stats.scenesDetected}, ` +
            `frames: ${extractionResult.stats.framesExtracted}, ` +
            `deduped: ${extractionResult.stats.duplicatesRemoved}`
          );
          const frames: ExtractedFrame[] = extractionResult.frames.map((f) => ({
            frameNumber: f.frameNumber,
            timestamp: f.timestamp,
            imagePath: f.imagePath,
          }));

          // Perform OCR on extracted frames
          console.log(`[${stageTime()}s] 🔍 Performing OCR on ${frames.length} frames...`);
          const processedFrames = await this.processFramesWithOCR(
            frames,
            options
          );

          // Extract and transcribe audio if the video has audio
          let audioTranscription: VideoContentMetadata["audioTranscription"];
          if (
            videoMetadata.hasAudio &&
            options?.enableSpeechTranscription !== false
          ) {
            console.log(`[${stageTime()}s] 🎤 Extracting and transcribing audio (${videoMetadata.duration?.toFixed(0)}s of audio)...`);
            const audioStart = Date.now();
            try {
              const audioResult =
                await this.audioProcessor.extractAudioFromVideo(buffer, {
                  useTimestamps: true,
                  enableSpeakerDetection: true,
                });

              if (audioResult.success) {
                const audioMeta = audioResult.metadata; // AudioTranscriptionMetadata
                audioTranscription = {
                  text: audioResult.text,
                  hasAudio: true,
                  segments: audioMeta.segments?.map((seg) => ({
                    start: seg.start,
                    end: seg.end,
                    text: seg.text,
                    confidence: seg.confidence,
                  })),
                  wordCount: audioMeta.wordCount || 0,
                  speechDuration: audioMeta.qualityMetrics?.speechDuration || 0,
                  qualityScore:
                    audioMeta.qualityMetrics?.averageConfidence || 0,
                };
                console.log(
                  `  ✅ Audio transcription in ${((Date.now() - audioStart) / 1000).toFixed(1)}s: ${
                    audioMeta.wordCount || 0
                  } words extracted`
                );
              } else {
                console.log(`  ⚠️ No speech detected (${((Date.now() - audioStart) / 1000).toFixed(1)}s)`);
                audioTranscription = {
                  text: "No speech detected in audio",
                  hasAudio: true,
                  wordCount: 0,
                  speechDuration: 0,
                  qualityScore: 0,
                };
              }
            } catch (audioError) {
              console.warn(`  ⚠️ Audio transcription failed after ${((Date.now() - audioStart) / 1000).toFixed(1)}s:`, audioError);
              audioTranscription = {
                text: "Audio transcription failed",
                hasAudio: true,
                wordCount: 0,
                speechDuration: 0,
                qualityScore: 0,
              };
            }
          }

          // Combine all text content (OCR + audio transcription)
          const ocrText = this.combineTextFromFrames(processedFrames);
          const audioText = audioTranscription?.text || "";
          const allText = [ocrText, audioText]
            .filter((t) => t.trim())
            .join("\n\n");
          const hasText = allText.length > 0;
          const wordCount = countWords(allText);
          const characterCount = countCharacters(allText);

          // Extract entities and relationships
          console.log(`[${stageTime()}s] 🏷️ Extracting entities and relationships...`);
          const entityStart = Date.now();
          const entities = this.entityExtractor.extractEntities(allText);
          const relationships = this.entityExtractor.extractRelationships(
            allText,
            entities
          );
          console.log(`  ✅ Entities in ${((Date.now() - entityStart) / 1000).toFixed(1)}s: ${entities.length} entities, ${relationships.length} relationships`);

          // Analyze content and classify
          console.log(`[${stageTime()}s] 🎯 Classifying video content...`);
          const classifyStart = Date.now();
          const contentClassification = this.classifyVideoContent(
            processedFrames,
            allText
          );
          const textSummary = this.createTextSummary(processedFrames);

          // Detect keyframes
          const keyframes = this.detectKeyframes(processedFrames);
          console.log(`  ✅ Classification + keyframes in ${((Date.now() - classifyStart) / 1000).toFixed(1)}s`);

          const metadata: VideoContentMetadata = {
            type: ContentType.VIDEO,
            language: options?.language || detectLanguage(allText),
            duration: videoMetadata.duration,
            wordCount,
            characterCount,
            videoMetadata: {
              duration: videoMetadata.duration,
              frameRate: videoMetadata.frameRate,
              resolution: `${videoMetadata.width}x${videoMetadata.height}`,
              keyframesExtracted: keyframes?.count || 0,
              audioAvailable: videoMetadata.hasAudio,
              subtitlesAvailable: false, // Could be extended in the future
              // Extended metadata
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
            `\n✅ Video processing complete in ${stageTime()}s: ${processedFrames.length} frames, ${wordCount} words extracted`
          );

          return {
            success: true,
            text: hasText
              ? allText
              : `Video: ${path.basename(tempVideoPath)} (${
                  videoMetadata.duration
                }s, ${processedFrames.length} frames processed)`,
            metadata,
            processingTime: 0, // Will be set after measureTime completes
          };
        } finally {
          // Clean up temporary video file
          try {
            fs.unlinkSync(tempVideoPath);
          } catch (cleanupError) {
            console.warn(
              "⚠️ Failed to clean up temp video file:",
              cleanupError
            );
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("❌ Video processing failed:", errorMessage);

        const errorResult = this.createErrorResult(
          `Video processing error: ${errorMessage}`
        );
        return {
          ...errorResult,
          error: errorMessage,
        };
      }
    });

    result.processingTime = time;
    return result;
  }

  /**
   * Process extracted frames with OCR
   */
  private async processFramesWithOCR(
    frames: ExtractedFrame[],
    _options?: ProcessorOptions,
    preserveFrames: boolean = false
  ): Promise<ExtractedFrame[]> {
    const processedFrames: ExtractedFrame[] = [];
    const totalFrames = frames.length;
    const ocrStartTime = Date.now();

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const frameStart = Date.now();
      try {
        // Read frame image buffer
        const frameBuffer = fs.readFileSync(frame.imagePath);

        // Perform OCR
        const ocrResult = await this.ocrProcessor.extractTextFromBuffer(
          frameBuffer
        );

        // Extract entities from OCR text
        const entities = this.entityExtractor.extractEntities(ocrResult.text);

        const processedFrame: ExtractedFrame = {
          ...frame,
          ocrText: ocrResult.text,
          ocrConfidence: ocrResult.metadata.confidence || 0,
          entities,
        };

        const frameElapsed = ((Date.now() - frameStart) / 1000).toFixed(1);
        const textLen = ocrResult.text.trim().length;
        console.log(
          `  🔍 OCR frame ${i + 1}/${totalFrames} ` +
          `@ ${frame.timestamp.toFixed(1)}s ` +
          `(${frameElapsed}s, ${textLen} chars)`
        );

        processedFrames.push(processedFrame);
      } catch (ocrError) {
        const frameElapsed = ((Date.now() - frameStart) / 1000).toFixed(1);
        console.warn(`  ⚠️ OCR failed for frame ${i + 1}/${totalFrames} (${frameElapsed}s):`, ocrError);
        // Include frame without OCR data
        processedFrames.push(frame);
      } finally {
        // Clean up frame file unless we need to preserve for export
        if (!preserveFrames) {
          try {
            fs.unlinkSync(frame.imagePath);
          } catch (cleanupError) {
            console.warn("⚠️ Failed to clean up frame file:", cleanupError);
          }
        }
      }
    }

    const totalOcrTime = ((Date.now() - ocrStartTime) / 1000).toFixed(1);
    console.log(`  ✅ OCR complete: ${totalFrames} frames in ${totalOcrTime}s`);

    return processedFrames;
  }

  /**
   * Combine text from all processed frames
   */
  private combineTextFromFrames(frames: ExtractedFrame[]): string {
    const textSegments: string[] = [];

    frames.forEach((frame, index) => {
      if (frame.ocrText && frame.ocrText.trim()) {
        textSegments.push(
          `[Frame ${index + 1} @ ${frame.timestamp.toFixed(
            1
          )}s]: ${frame.ocrText.trim()}`
        );
      }
    });

    return textSegments.join("\n\n");
  }

  /**
   * Classify video content based on extracted text and patterns
   */
  private classifyVideoContent(
    frames: ExtractedFrame[],
    combinedText: string
  ): VideoContentMetadata["contentClassification"] {
    let confidence = 0;
    let isScreenRecording = false;
    let hasUI = false;
    let hasCode = false;
    let hasPresentation = false;

    // Analyze text patterns
    const text = combinedText.toLowerCase();

    // Screen recording indicators
    const screenPatterns = [
      "screen recording",
      "cursor",
      "click",
      "menu",
      "window",
      "application",
    ];
    const screenMatches = screenPatterns.filter((pattern) =>
      text.includes(pattern)
    ).length;
    isScreenRecording = screenMatches > 2;
    confidence += screenMatches * 0.1;

    // UI element indicators
    const uiPatterns = [
      "button",
      "dialog",
      "input",
      "form",
      "dropdown",
      "navigation",
      "tab",
      "panel",
    ];
    const uiMatches = uiPatterns.filter((pattern) =>
      text.includes(pattern)
    ).length;
    hasUI = uiMatches > 3;
    confidence += uiMatches * 0.05;

    // Code indicators — look for actual code syntax, not just spoken keywords
    const codeSyntaxPatterns = [
      /[a-z]+\([^)]*\)\s*\{/,        // function calls with braces: foo() {
      /[a-z]+\.[a-z]+\(/,             // method calls: obj.method(
      /\b(?:const|let|var)\s+\w+\s*=/, // variable declarations: const x =
      /=>\s*\{/,                        // arrow functions: => {
      /import\s+\{[^}]+\}\s+from/,     // import statements: import { x } from
      /if\s*\([^)]+\)\s*\{/,           // if statements with braces
      /\bclass\s+[A-Z]\w+/,            // class declarations: class Foo
      /\breturn\s+[^;]+;/,             // return statements
    ];
    const codeMatches = codeSyntaxPatterns.filter((pattern) =>
      pattern.test(text)
    ).length;
    hasCode = codeMatches > 2;
    confidence += codeMatches * 0.1;

    // Presentation indicators — expanded to match natural presenter language
    const presentationPatterns = [
      "slide",
      "presentation",
      "agenda",
      "overview",
      "conclusion",
      "talk",
      "audience",
      "demo",
      "demonstration",
      "walkthrough",
      "let me show",
      "as you can see",
      "questions",
      "thank you",
      "welcome",
      "conference",
    ];
    const presentationMatches = presentationPatterns.filter((pattern) =>
      text.includes(pattern)
    ).length;
    hasPresentation = presentationMatches > 1;
    confidence += presentationMatches * 0.15;

    // If presentation detected but code was only marginally matched,
    // it's likely a talk ABOUT code, not a screen recording of code
    if (hasPresentation && codeMatches <= 3) {
      hasCode = false;
    }

    return {
      isScreenRecording,
      hasUI,
      hasCode,
      hasPresentation,
      confidence: Math.min(confidence, 1.0),
    };
  }

  /**
   * Create text summary from processed frames
   */
  private createTextSummary(
    frames: ExtractedFrame[]
  ): VideoContentMetadata["textSummary"] {
    const textBlocks = frames.filter(
      (frame) => frame.ocrText && frame.ocrText.trim()
    );
    const languages = new Set<string>();
    let totalConfidence = 0;
    let confidenceCount = 0;

    textBlocks.forEach((frame) => {
      if (frame.ocrText) {
        const language = detectLanguage(frame.ocrText);
        languages.add(language);
      }

      if (frame.ocrConfidence) {
        totalConfidence += frame.ocrConfidence;
        confidenceCount++;
      }
    });

    const averageConfidence =
      confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
    const languageArray = Array.from(languages);
    const dominantLanguage = languageArray[0] || "unknown";

    return {
      totalTextBlocks: textBlocks.length,
      averageConfidence,
      languages: languageArray,
      dominantLanguage,
    };
  }

  /**
   * Detect keyframes based on OCR content changes
   */
  private detectKeyframes(
    frames: ExtractedFrame[]
  ): VideoContentMetadata["keyframes"] {
    const keyframeTimestamps: number[] = [];
    let previousText = "";

    frames.forEach((frame, _index) => {
      const currentText = frame.ocrText || "";

      // Detect significant text changes (indicating new content/scene)
      const similarity = this.calculateTextSimilarity(
        previousText,
        currentText
      );

      if (similarity < 0.5 && currentText.length > 20) {
        keyframeTimestamps.push(frame.timestamp);
      }

      previousText = currentText;
    });

    return {
      count: keyframeTimestamps.length,
      intervals: keyframeTimestamps,
    };
  }

  /**
   * Calculate similarity between two text strings
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 && !text2) return 1;
    if (!text1 || !text2) return 0;

    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set(
      [...words1].filter((word) => words2.has(word))
    );
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Extract text from file path (avoids loading entire video into memory)
   */
  async extractText(
    filePath: string,
    options?: VideoProcessorOptions
  ): Promise<ProcessorResult> {
    try {
      return await this.extractFromFilePath(filePath, options);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        `Failed to read video file: ${errorMessage}`
      );
    }
  }

  /**
   * Process video directly from file path without loading into JS heap.
   * Uses fs.copyFileSync which is an OS-level copy (copy-on-write on APFS).
   */
  private async extractFromFilePath(
    filePath: string,
    options?: VideoProcessorOptions
  ): Promise<ProcessorResult> {
    const { result, time } = await this.measureTime(async () => {
      try {
        const pipelineStart = Date.now();
        const stageTime = () => ((Date.now() - pipelineStart) / 1000).toFixed(1);
        console.log("🎬 Starting video processing (path-based)...");

        // OS-level copy to temp dir — no JS heap allocation
        const tempVideoPath = path.join(
          this.tempDir,
          `video_${Date.now()}.mp4`
        );
        fs.copyFileSync(filePath, tempVideoPath);

        try {
          // Extract video metadata
          console.log(`[${stageTime()}s] 📊 Extracting video metadata...`);
          const metaStart = Date.now();
          const videoMetadata = await this.metadataExtractor.extract(tempVideoPath);
          console.log(`  ✅ Metadata extracted in ${((Date.now() - metaStart) / 1000).toFixed(1)}s (${videoMetadata.duration?.toFixed(1)}s, ${videoMetadata.width}x${videoMetadata.height})`);

          // Extract frames using adaptive scene detection
          console.log(`[${stageTime()}s] 🖼️ Extracting video frames (adaptive scene detection)...`);
          const frameStart = Date.now();
          const extractionResult = await this.adaptiveExtractor.extract(
            tempVideoPath,
            {
              sceneThreshold: 0.3,
              minSceneLength: 1.0,
              enableDeduplication: true,
              maxFrames: (options as VideoProcessorOptions)?.maxFramesToExtract ?? 200,
              fallbackInterval: (options as VideoProcessorOptions)?.frameExtractionInterval ?? 30,
              outputDir: this.tempDir,
              outputFormat: "png",
            }
          );
          console.log(
            `  ✅ Frame extraction in ${((Date.now() - frameStart) / 1000).toFixed(1)}s — ` +
            `strategy: ${extractionResult.stats.strategy}, ` +
            `scenes: ${extractionResult.stats.scenesDetected}, ` +
            `frames: ${extractionResult.stats.framesExtracted}, ` +
            `deduped: ${extractionResult.stats.duplicatesRemoved}`
          );
          const frames: ExtractedFrame[] = extractionResult.frames.map((f) => ({
            frameNumber: f.frameNumber,
            timestamp: f.timestamp,
            imagePath: f.imagePath,
          }));

          // Perform OCR on extracted frames
          const exportMode = !!(options as VideoProcessorOptions)?.outputDir;
          console.log(`[${stageTime()}s] 🔍 Performing OCR on ${frames.length} frames...`);
          const processedFrames = await this.processFramesWithOCR(
            frames,
            options,
            exportMode // preserve frame images for export
          );

          // Extract and transcribe audio if the video has audio
          let audioTranscription: VideoContentMetadata["audioTranscription"];
          if (
            videoMetadata.hasAudio &&
            options?.enableSpeechTranscription !== false
          ) {
            console.log(`[${stageTime()}s] 🎤 Extracting and transcribing audio (${videoMetadata.duration?.toFixed(0)}s of audio)...`);
            const audioStart = Date.now();
            try {
              // Use path-based extraction to avoid loading video into memory
              const audioResult =
                await this.audioProcessor.extractAudioFromVideoPath(tempVideoPath, {
                  useTimestamps: true,
                  enableSpeakerDetection: true,
                });

              if (audioResult.success) {
                const audioMeta = audioResult.metadata;
                audioTranscription = {
                  text: audioResult.text,
                  hasAudio: true,
                  segments: audioMeta.segments?.map((seg: { start: number; end: number; text: string; confidence: number }) => ({
                    start: seg.start,
                    end: seg.end,
                    text: seg.text,
                    confidence: seg.confidence,
                  })),
                  wordCount: audioMeta.wordCount || 0,
                  speechDuration: audioMeta.qualityMetrics?.speechDuration || 0,
                  qualityScore:
                    audioMeta.qualityMetrics?.averageConfidence || 0,
                };
                console.log(
                  `  ✅ Audio transcription in ${((Date.now() - audioStart) / 1000).toFixed(1)}s: ${
                    audioMeta.wordCount || 0
                  } words extracted`
                );
              } else {
                console.log(`  ⚠️ No speech detected (${((Date.now() - audioStart) / 1000).toFixed(1)}s)`);
                audioTranscription = {
                  text: "No speech detected in audio",
                  hasAudio: true,
                  wordCount: 0,
                  speechDuration: 0,
                  qualityScore: 0,
                };
              }
            } catch (audioError) {
              console.warn(`  ⚠️ Audio transcription failed after ${((Date.now() - audioStart) / 1000).toFixed(1)}s:`, audioError);
              audioTranscription = {
                text: "Audio transcription failed",
                hasAudio: true,
                wordCount: 0,
                speechDuration: 0,
                qualityScore: 0,
              };
            }
          }

          // Combine all text content (OCR + audio transcription)
          const ocrText = this.combineTextFromFrames(processedFrames);
          const audioText = audioTranscription?.text || "";
          const allText = [ocrText, audioText]
            .filter((t) => t.trim())
            .join("\n\n");
          const hasText = allText.length > 0;
          const wordCount = countWords(allText);
          const characterCount = countCharacters(allText);

          // Extract entities and relationships
          console.log(`[${stageTime()}s] 🏷️ Extracting entities and relationships...`);
          const entityStart = Date.now();
          const entities = this.entityExtractor.extractEntities(allText);
          const relationships = this.entityExtractor.extractRelationships(
            allText,
            entities
          );
          console.log(`  ✅ Entities in ${((Date.now() - entityStart) / 1000).toFixed(1)}s: ${entities.length} entities, ${relationships.length} relationships`);

          // Analyze content and classify
          console.log(`[${stageTime()}s] 🎯 Classifying video content...`);
          const classifyStart = Date.now();
          const contentClassification = this.classifyVideoContent(
            processedFrames,
            allText
          );
          const textSummary = this.createTextSummary(processedFrames);

          // Detect keyframes
          const keyframes = this.detectKeyframes(processedFrames);
          console.log(`  ✅ Classification + keyframes in ${((Date.now() - classifyStart) / 1000).toFixed(1)}s`);

          const metadata: VideoContentMetadata = {
            type: ContentType.VIDEO,
            language: options?.language || detectLanguage(allText),
            duration: videoMetadata.duration,
            wordCount,
            characterCount,
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
            `\n✅ Video processing complete in ${stageTime()}s: ${processedFrames.length} frames, ${wordCount} words extracted`
          );

          // Export artifacts if outputDir is set
          if (exportMode) {
            const outputDir = (options as VideoProcessorOptions).outputDir!;
            console.log(`📦 Exporting artifacts to ${outputDir}...`);
            this.exportArtifacts(
              outputDir,
              metadata,
              path.basename(filePath)
            );
            // Clean up preserved frame temp files now that they've been copied
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
              : `Video: ${path.basename(filePath)} (${
                  videoMetadata.duration
                }s, ${processedFrames.length} frames processed)`,
            metadata,
            processingTime: 0,
          };
        } finally {
          // Clean up temporary video file
          try {
            fs.unlinkSync(tempVideoPath);
          } catch (cleanupError) {
            console.warn(
              "⚠️ Failed to clean up temp video file:",
              cleanupError
            );
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("❌ Video processing failed:", errorMessage);

        const errorResult = this.createErrorResult(
          `Video processing error: ${errorMessage}`
        );
        return {
          ...errorResult,
          error: errorMessage,
        };
      }
    });

    result.processingTime = time;
    return result;
  }

  /**
   * Format seconds as HH:MM:SS
   */
  private formatTimestamp(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  /**
   * Export processing artifacts to a structured output directory.
   * Writes keyframe images, manifest.json, transcript_segments.json,
   * and a canonical transcript.md that interleaves frames and speech.
   */
  private exportArtifacts(
    outputDir: string,
    metadata: VideoContentMetadata,
    sourceFileName: string
  ): void {
    const keyframesDir = path.join(outputDir, "keyframes");
    fs.mkdirSync(keyframesDir, { recursive: true });

    // Determine which frames are keyframes
    const keyframeTimestamps = new Set(
      metadata.keyframes?.intervals ?? metadata.extractedFrames.map((f) => f.timestamp)
    );

    // Copy keyframe images and build index
    const keyframeFiles = new Map<number, string>();
    const frameIndex: Array<{
      frameNumber: number;
      timestamp: number;
      filename: string | null;
      ocrText: string | null;
      ocrConfidence: number;
      isKeyframe: boolean;
    }> = [];

    for (const frame of metadata.extractedFrames) {
      const isKeyframe = keyframeTimestamps.has(frame.timestamp);
      let filename: string | null = null;

      if (isKeyframe && frame.imagePath && fs.existsSync(frame.imagePath)) {
        filename = `frame_${String(frame.frameNumber).padStart(3, "0")}_${frame.timestamp.toFixed(1)}s.png`;
        fs.copyFileSync(frame.imagePath, path.join(keyframesDir, filename));
        keyframeFiles.set(frame.timestamp, filename);
      }

      frameIndex.push({
        frameNumber: frame.frameNumber,
        timestamp: frame.timestamp,
        filename,
        ocrText: frame.ocrText?.trim() || null,
        ocrConfidence: frame.ocrConfidence ?? 0,
        isKeyframe,
      });
    }

    // Write manifest.json
    const manifest = {
      source: sourceFileName,
      exportedAt: new Date().toISOString(),
      video: metadata.videoMetadata,
      contentClassification: metadata.contentClassification,
      summary: {
        duration: metadata.duration,
        wordCount: metadata.wordCount,
        frameCount: metadata.frameCount,
        keyframeCount: keyframeFiles.size,
        language: metadata.language,
        segmentCount: metadata.audioTranscription?.segments?.length ?? 0,
      },
      frames: frameIndex,
      entities: metadata.entities,
      relationships: metadata.relationships,
    };
    fs.writeFileSync(
      path.join(outputDir, "manifest.json"),
      JSON.stringify(manifest, null, 2)
    );

    // Write transcript_segments.json
    const segments = metadata.audioTranscription?.segments ?? [];
    fs.writeFileSync(
      path.join(outputDir, "transcript_segments.json"),
      JSON.stringify(segments, null, 2)
    );

    // Write canonical transcript.md
    const transcript = this.generateCanonicalTranscript(
      metadata,
      keyframeFiles,
      sourceFileName
    );
    fs.writeFileSync(path.join(outputDir, "transcript.md"), transcript);

    console.log(
      `  📄 Exported: manifest.json, transcript.md, transcript_segments.json, ${keyframeFiles.size} keyframes`
    );
  }

  /**
   * Generate a canonical markdown transcript that interleaves keyframe
   * references (with OCR text) and speech transcript segments on a
   * unified timeline.
   */
  private generateCanonicalTranscript(
    metadata: VideoContentMetadata,
    keyframeFiles: Map<number, string>,
    sourceFileName: string
  ): string {
    const lines: string[] = [];

    // Header
    lines.push(`# Video Transcript: ${sourceFileName}`);
    lines.push("");
    lines.push("## Video Info");
    const vm = metadata.videoMetadata;
    const durationStr = `${vm.duration.toFixed(1)}s (${this.formatTimestamp(vm.duration)})`;
    lines.push(`- **Duration:** ${durationStr}`);
    lines.push(`- **Resolution:** ${vm.resolution}`);
    lines.push(`- **Codec:** ${vm.codec}`);
    lines.push(`- **Frame rate:** ${vm.frameRate.toFixed(2)} fps`);
    lines.push(`- **Has audio:** ${vm.hasAudio}`);
    if (metadata.contentClassification) {
      const cc = metadata.contentClassification;
      const tags = [];
      if (cc.hasPresentation) tags.push("presentation");
      if (cc.hasCode) tags.push("code");
      if (cc.isScreenRecording) tags.push("screen recording");
      if (cc.hasUI) tags.push("UI");
      if (tags.length > 0) lines.push(`- **Content type:** ${tags.join(", ")}`);
    }
    lines.push(`- **Words extracted:** ${metadata.wordCount}`);
    lines.push(`- **Frames extracted:** ${metadata.frameCount}`);
    lines.push(`- **Keyframes:** ${keyframeFiles.size}`);
    lines.push("");

    // Build unified timeline of events
    type TimelineEvent =
      | { type: "keyframe"; timestamp: number; filename: string; ocrText: string | null; frameNumber: number }
      | { type: "speech"; start: number; end: number; text: string; confidence?: number };

    const events: TimelineEvent[] = [];

    // Add keyframe events
    for (const frame of metadata.extractedFrames) {
      const filename = keyframeFiles.get(frame.timestamp);
      if (filename) {
        events.push({
          type: "keyframe",
          timestamp: frame.timestamp,
          filename,
          ocrText: frame.ocrText?.trim() || null,
          frameNumber: frame.frameNumber,
        });
      }
    }

    // Add speech segments
    const segments = metadata.audioTranscription?.segments ?? [];
    for (const seg of segments) {
      events.push({
        type: "speech",
        start: seg.start,
        end: seg.end,
        text: seg.text,
        confidence: seg.confidence,
      });
    }

    // Sort by timestamp (keyframe.timestamp or speech.start)
    events.sort((a, b) => {
      const tA = a.type === "keyframe" ? a.timestamp : a.start;
      const tB = b.type === "keyframe" ? b.timestamp : b.start;
      if (tA !== tB) return tA - tB;
      // Keyframes appear before speech at the same timestamp
      return a.type === "keyframe" ? -1 : 1;
    });

    // Render timeline
    lines.push("## Timeline");
    lines.push("");

    for (const event of events) {
      if (event.type === "keyframe") {
        const ts = this.formatTimestamp(event.timestamp);
        lines.push(`### [${ts}] Keyframe: ${event.filename}`);
        lines.push("");
        lines.push(`![${event.filename}](keyframes/${event.filename})`);
        lines.push("");
        if (event.ocrText && !event.ocrText.startsWith("Image OCR:")) {
          // Render OCR text as blockquote, each line prefixed
          const ocrLines = event.ocrText.split("\n").filter((l) => l.trim());
          for (const ocrLine of ocrLines) {
            lines.push(`> ${ocrLine}`);
          }
          lines.push("");
        }
      } else {
        const startTs = this.formatTimestamp(event.start);
        const endTs = this.formatTimestamp(event.end);
        lines.push(`**[${startTs} - ${endTs}]** ${event.text}`);
        lines.push("");
      }
    }

    return lines.join("\n");
  }

  /**
   * Create an error result
   */
  protected createErrorResult(
    errorMessage: string,
    language: string = "unknown"
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
