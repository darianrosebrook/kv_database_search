import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import * as path from "path";
import { ContentType, ContentMetadata } from "../../types/index.ts";
import {
  detectLanguage,
  EnhancedEntityExtractor,
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
  private entityExtractor: EnhancedEntityExtractor;
  private ocrProcessor: OCRProcessor;
  private audioProcessor: AudioTranscriptionProcessor;
  private tempDir: string;

  constructor() {
    super("Video Processor", [ContentType.VIDEO]);
    this.entityExtractor = new EnhancedEntityExtractor();
    this.ocrProcessor = new OCRProcessor();
    this.audioProcessor = new AudioTranscriptionProcessor();
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
        } catch (error) {
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
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
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
        console.log("🎬 Starting video processing...");

        // Write buffer to temporary file
        const tempVideoPath = path.join(
          this.tempDir,
          `video_${Date.now()}.mp4`
        );
        fs.writeFileSync(tempVideoPath, buffer);

        try {
          // Extract video metadata
          console.log("📊 Extracting video metadata...");
          const videoMetadata = await this.extractVideoMetadata(tempVideoPath);

          // Extract frames at strategic intervals
          console.log("🖼️ Extracting video frames...");
          const frames = await this.extractFrames(
            tempVideoPath,
            videoMetadata,
            options
          );

          // Perform OCR on extracted frames
          console.log("🔍 Performing OCR on frames...");
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
            console.log("🎤 Extracting and transcribing audio...");
            try {
              const audioResult =
                await this.audioProcessor.extractAudioFromVideo(buffer, {
                  useTimestamps: true,
                  enableSpeakerDetection: true,
                });

              if (audioResult.success) {
                const audioMeta = audioResult.metadata as any; // AudioTranscriptionMetadata
                audioTranscription = {
                  text: audioResult.text,
                  hasAudio: true,
                  segments: audioMeta.segments?.map((seg: any) => ({
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
                  `  🎯 Audio transcription: ${
                    audioMeta.wordCount || 0
                  } words extracted`
                );
              } else {
                audioTranscription = {
                  text: "No speech detected in audio",
                  hasAudio: true,
                  wordCount: 0,
                  speechDuration: 0,
                  qualityScore: 0,
                };
              }
            } catch (audioError) {
              console.warn("⚠️ Audio transcription failed:", audioError);
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
          console.log("🏷️ Extracting entities and relationships...");
          const entities = this.entityExtractor.extractEntities(allText);
          const relationships = this.entityExtractor.extractRelationships(
            allText,
            entities
          );

          // Analyze content and classify
          console.log("🎯 Classifying video content...");
          const contentClassification = this.classifyVideoContent(
            processedFrames,
            allText
          );
          const textSummary = this.createTextSummary(processedFrames);

          // Detect keyframes
          const keyframes = this.detectKeyframes(processedFrames);

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
            `✅ Video processing complete: ${processedFrames.length} frames, ${wordCount} words extracted`
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
   * Extract video metadata using FFmpeg
   */
  private async extractVideoMetadata(
    videoPath: string
  ): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(new Error(`FFprobe failed: ${err.message}`));
          return;
        }

        try {
          const videoStream = metadata.streams.find(
            (stream) => stream.codec_type === "video"
          );
          const audioStream = metadata.streams.find(
            (stream) => stream.codec_type === "audio"
          );

          if (!videoStream) {
            reject(new Error("No video stream found"));
            return;
          }

          const duration = parseFloat(String(metadata.format.duration || "0"));
          const width = videoStream.width || 0;
          const height = videoStream.height || 0;
          const frameRate = eval(videoStream.r_frame_rate || "0") || 0;
          const aspectRatio =
            videoStream.display_aspect_ratio || `${width}:${height}`;

          resolve({
            duration,
            width,
            height,
            frameRate,
            codec: videoStream.codec_name || "unknown",
            bitrate: parseInt(String(videoStream.bit_rate || "0")) || undefined,
            format: metadata.format.format_name || "unknown",
            size: parseInt(String(metadata.format.size || "0")),
            aspectRatio,
            audioCodec: audioStream?.codec_name,
            hasAudio: !!audioStream,
            creationTime: metadata.format.tags?.creation_time
              ? new Date(metadata.format.tags.creation_time)
              : undefined,
          });
        } catch (parseError) {
          reject(new Error(`Metadata parsing failed: ${parseError}`));
        }
      });
    });
  }

  /**
   * Extract frames from video at strategic intervals
   */
  private async extractFrames(
    videoPath: string,
    videoMetadata: VideoMetadata,
    options?: ProcessorOptions
  ): Promise<ExtractedFrame[]> {
    const frames: ExtractedFrame[] = [];

    // Calculate frame extraction strategy
    const maxFrames = 20; // Limit to avoid processing too many frames
    const duration = videoMetadata.duration;
    const interval = Math.max(1, duration / maxFrames); // Extract every N seconds

    console.log(
      `  📈 Extracting frames every ${interval.toFixed(
        1
      )}s from ${duration.toFixed(1)}s video`
    );

    for (let i = 0; i < maxFrames && i * interval < duration; i++) {
      const timestamp = i * interval;
      const frameNumber = Math.floor(timestamp * videoMetadata.frameRate);
      const framePath = path.join(this.tempDir, `frame_${Date.now()}_${i}.png`);

      try {
        await this.extractSingleFrame(videoPath, timestamp, framePath);

        frames.push({
          frameNumber,
          timestamp,
          imagePath: framePath,
        });
      } catch (frameError) {
        console.warn(
          `⚠️ Failed to extract frame at ${timestamp}s:`,
          frameError
        );
        // Continue with other frames
      }
    }

    console.log(`  ✅ Extracted ${frames.length} frames`);
    return frames;
  }

  /**
   * Extract a single frame at specific timestamp
   */
  private extractSingleFrame(
    videoPath: string,
    timestamp: number,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .seekInput(timestamp)
        .frames(1)
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });
  }

  /**
   * Process extracted frames with OCR
   */
  private async processFramesWithOCR(
    frames: ExtractedFrame[],
    options?: ProcessorOptions
  ): Promise<ExtractedFrame[]> {
    const processedFrames: ExtractedFrame[] = [];

    for (const frame of frames) {
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
          ocrConfidence: (ocrResult.metadata as any).confidence || 0,
          entities,
        };

        processedFrames.push(processedFrame);
      } catch (ocrError) {
        console.warn(`⚠️ OCR failed for frame ${frame.frameNumber}:`, ocrError);
        // Include frame without OCR data
        processedFrames.push(frame);
      } finally {
        // Clean up frame file
        try {
          fs.unlinkSync(frame.imagePath);
        } catch (cleanupError) {
          console.warn("⚠️ Failed to clean up frame file:", cleanupError);
        }
      }
    }

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

    // Code indicators
    const codePatterns = [
      "function",
      "var",
      "const",
      "class",
      "import",
      "export",
      "console",
      "error",
    ];
    const codeMatches = codePatterns.filter((pattern) =>
      text.includes(pattern)
    ).length;
    hasCode = codeMatches > 2;
    confidence += codeMatches * 0.1;

    // Presentation indicators
    const presentationPatterns = [
      "slide",
      "presentation",
      "agenda",
      "overview",
      "conclusion",
    ];
    const presentationMatches = presentationPatterns.filter((pattern) =>
      text.includes(pattern)
    ).length;
    hasPresentation = presentationMatches > 1;
    confidence += presentationMatches * 0.15;

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

    frames.forEach((frame, index) => {
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
   * Extract text from file path
   */
  async extractText(filePath: string): Promise<ProcessorResult> {
    try {
      const buffer = fs.readFileSync(filePath);
      return await this.extractFromBuffer(buffer);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        `Failed to read video file: ${errorMessage}`
      );
    }
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
