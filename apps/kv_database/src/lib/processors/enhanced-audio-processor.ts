import * as fs from "fs";
import * as path from "path";
import { ContentType, ContentMetadata } from "../../types/index.ts";
import {
  BaseContentProcessor,
  ProcessorOptions,
  ProcessorResult,
} from "./base-processor";
import {
  detectLanguage,
  EnhancedEntityExtractor,
  ExtractedEntity,
  EntityRelationship,
  countWords,
  countCharacters,
} from "../utils";

export interface EnhancedAudioMetadata extends ContentMetadata {
  duration: number;
  sampleRate: number;
  channels: number;
  bitrate?: number;
  format: string;
  hasText: boolean;
  wordCount: number;
  characterCount: number;
  transcriptionEngine: "whisper" | "sherpa-onnx" | "fallback" | "mock";
  transcriptionConfidence: number;
  audioQuality: {
    noiseLevel: "low" | "medium" | "high";
    clarity: "excellent" | "good" | "fair" | "poor";
    speechRatio: number; // Percentage of audio that contains speech
    silenceRatio: number; // Percentage that is silence
    overallScore: number; // 0-1 quality score
  };
  speechSegments?: Array<{
    id: string;
    start: number;
    end: number;
    text: string;
    confidence: number;
    speaker?: string;
    language?: string;
  }>;
  speakers?: Array<{
    id: string;
    label: string;
    segments: number[];
    confidence: number;
  }>;
  entities?: ExtractedEntity[];
  relationships?: EntityRelationship[];
  topics?: Array<{
    name: string;
    confidence: number;
    timeRanges: Array<{ start: number; end: number }>;
  }>;
  sentimentAnalysis?: {
    overall: "positive" | "negative" | "neutral";
    confidence: number;
    segments?: Array<{
      start: number;
      end: number;
      sentiment: "positive" | "negative" | "neutral";
      confidence: number;
    }>;
  };
}

export interface AudioProcessingOptions extends ProcessorOptions {
  enableSpeakerDiarization?: boolean;
  enableTopicDetection?: boolean;
  enableSentimentAnalysis?: boolean;
  useTimestamps?: boolean;
  maxDuration?: number; // Skip files longer than this (in seconds)
  language?: string;
  transcriptionEngine?: "auto" | "whisper" | "sherpa-onnx" | "mock";
}

export class EnhancedAudioProcessor extends BaseContentProcessor {
  private entityExtractor: EnhancedEntityExtractor;
  private tempDir: string;

  constructor() {
    super("Enhanced Audio Processor", [
      ContentType.AUDIO,
      ContentType.AUDIO_FILE,
      ContentType.SPEECH,
    ]);
    this.entityExtractor = new EnhancedEntityExtractor();
    this.tempDir = path.join(process.cwd(), "temp", "audio");

    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Extract text and rich metadata from audio files
   */
  async extractFromBuffer(
    buffer: Buffer,
    options?: AudioProcessingOptions
  ): Promise<ProcessorResult> {
    const { result, time } = await this.measureTime(async () => {
      try {
        console.log("🎤 Starting enhanced audio processing...");

        // Quick duration check to avoid processing very long files
        const basicMetadata = await this.extractBasicAudioMetadata(buffer);
        if (
          options?.maxDuration &&
          basicMetadata.duration > options.maxDuration
        ) {
          return this.createSkippedResult(
            `Audio file too long (${basicMetadata.duration.toFixed(1)}s > ${
              options.maxDuration
            }s limit)`,
            basicMetadata
          );
        }

        // Write buffer to temporary file for processing
        const tempAudioPath = path.join(
          this.tempDir,
          `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`
        );
        fs.writeFileSync(tempAudioPath, buffer);

        try {
          // Extract comprehensive audio metadata
          console.log("📊 Analyzing audio characteristics...");
          const audioMetadata = await this.extractDetailedAudioMetadata(
            tempAudioPath
          );

          // Perform speech-to-text transcription
          console.log("🔊 Performing speech transcription...");
          const transcriptionResult = await this.performEnhancedTranscription(
            tempAudioPath,
            audioMetadata,
            options
          );

          // Analyze speech quality and characteristics
          console.log("🎯 Analyzing speech quality...");
          const qualityAnalysis = this.analyzeAudioQuality(
            transcriptionResult,
            audioMetadata
          );

          // Extract entities and relationships from transcript
          console.log("🏷️ Extracting entities and relationships...");
          const entities = this.entityExtractor.extractEntities(
            transcriptionResult.text
          );
          const relationships = this.entityExtractor.extractRelationships(
            transcriptionResult.text,
            entities
          );

          // Perform speaker diarization if enabled
          let speakers;
          if (
            options?.enableSpeakerDiarization &&
            transcriptionResult.segments
          ) {
            console.log("👥 Performing speaker diarization...");
            speakers = this.performSpeakerDiarization(
              transcriptionResult.segments
            );
          }

          // Detect topics if enabled
          let topics;
          if (options?.enableTopicDetection) {
            console.log("📋 Detecting topics...");
            topics = this.detectTopics(
              transcriptionResult.text,
              transcriptionResult.segments
            );
          }

          // Analyze sentiment if enabled
          let sentimentAnalysis;
          if (options?.enableSentimentAnalysis) {
            console.log("😊 Analyzing sentiment...");
            sentimentAnalysis = this.analyzeSentiment(
              transcriptionResult.text,
              transcriptionResult.segments
            );
          }

          const wordCount = countWords(transcriptionResult.text);
          const characterCount = countCharacters(transcriptionResult.text);
          const hasText = wordCount > 0;

          // Create enhanced metadata
          const metadata: EnhancedAudioMetadata = {
            type: ContentType.AUDIO,
            language:
              options?.language || detectLanguage(transcriptionResult.text),
            duration: audioMetadata.duration,
            sampleRate: audioMetadata.sampleRate,
            channels: audioMetadata.channels,
            bitrate: audioMetadata.bitrate,
            format: audioMetadata.format,
            hasText,
            wordCount,
            characterCount,
            transcriptionEngine: transcriptionResult.engine,
            transcriptionConfidence: transcriptionResult.confidence,
            audioQuality: qualityAnalysis,
            speechSegments: transcriptionResult.segments,
            speakers,
            entities,
            relationships,
            topics,
            sentimentAnalysis,
          };

          console.log(
            `✅ Enhanced audio processing complete: ${wordCount} words, ${
              transcriptionResult.segments?.length || 0
            } segments`
          );

          return {
            success: true,
            text: this.formatTranscriptText(transcriptionResult, metadata),
            metadata,
            processingTime: 0, // Will be set by measureTime
          };
        } finally {
          // Clean up temporary file
          try {
            if (fs.existsSync(tempAudioPath)) {
              fs.unlinkSync(tempAudioPath);
            }
          } catch (cleanupError) {
            console.warn(
              "⚠️ Failed to clean up temporary audio file:",
              cleanupError
            );
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("❌ Enhanced audio processing failed:", errorMessage);

        return {
          success: false,
          text: `Audio Transcript: Processing failed. Error: ${errorMessage}`,
          metadata: {
            type: ContentType.AUDIO,
            language: "unknown",
            duration: 0,
            sampleRate: 0,
            channels: 0,
            format: "unknown",
            hasText: false,
            wordCount: 0,
            characterCount: 0,
            transcriptionEngine: "fallback" as const,
            transcriptionConfidence: 0,
            audioQuality: {
              noiseLevel: "high" as const,
              clarity: "poor" as const,
              speechRatio: 0,
              silenceRatio: 1,
              overallScore: 0,
            },
          } as EnhancedAudioMetadata,
          processingTime: 0,
          error: errorMessage,
        };
      }
    });

    result.processingTime = time;
    return result;
  }

  /**
   * Extract basic audio metadata quickly
   */
  private async extractBasicAudioMetadata(buffer: Buffer): Promise<{
    duration: number;
    format: string;
  }> {
    // For demo purposes, we'll estimate based on file size
    // In a real implementation, you'd use libraries like ffprobe or node-ffmpeg
    const estimatedDuration = Math.max(10, buffer.length / (16000 * 2)); // Rough estimate

    return {
      duration: estimatedDuration,
      format: "unknown",
    };
  }

  /**
   * Extract detailed audio metadata
   */
  private async extractDetailedAudioMetadata(filePath: string): Promise<{
    duration: number;
    sampleRate: number;
    channels: number;
    bitrate?: number;
    format: string;
  }> {
    // Mock implementation - in production, use ffprobe or similar
    // Example: ffprobe -v quiet -print_format json -show_format -show_streams input.wav

    return {
      duration: 60, // Mock 60 seconds
      sampleRate: 16000,
      channels: 1,
      bitrate: 256000,
      format: "wav",
    };
  }

  /**
   * Perform enhanced speech transcription with multiple fallbacks
   */
  private async performEnhancedTranscription(
    filePath: string,
    audioMetadata: any,
    options?: AudioProcessingOptions
  ): Promise<{
    text: string;
    confidence: number;
    engine: "whisper" | "sherpa-onnx" | "fallback" | "mock";
    segments?: Array<{
      id: string;
      start: number;
      end: number;
      text: string;
      confidence: number;
    }>;
  }> {
    const engine = options?.transcriptionEngine || "auto";

    // Try different transcription engines based on availability and settings
    if (engine === "auto" || engine === "whisper") {
      try {
        return await this.transcribeWithWhisper(filePath, options);
      } catch (error) {
        console.warn(
          "⚠️ Whisper transcription failed, trying fallback:",
          error
        );
      }
    }

    if (engine === "auto" || engine === "sherpa-onnx") {
      try {
        return await this.transcribeWithSherpaOnnx(filePath, options);
      } catch (error) {
        console.warn("⚠️ Sherpa-ONNX transcription failed, using mock:", error);
      }
    }

    // Mock transcription for demonstration
    return this.createMockTranscription(audioMetadata.duration);
  }

  /**
   * Transcribe using Whisper (OpenAI's speech recognition)
   */
  private async transcribeWithWhisper(
    filePath: string,
    options?: AudioProcessingOptions
  ): Promise<{
    text: string;
    confidence: number;
    engine: "whisper";
    segments?: Array<{
      id: string;
      start: number;
      end: number;
      text: string;
      confidence: number;
    }>;
  }> {
    // In a real implementation, you'd use:
    // - @xenova/transformers for client-side Whisper
    // - OpenAI API for cloud-based Whisper
    // - whisper-node for local Whisper installation

    throw new Error("Whisper not available in demo environment");
  }

  /**
   * Transcribe using Sherpa-ONNX
   */
  private async transcribeWithSherpaOnnx(
    filePath: string,
    options?: AudioProcessingOptions
  ): Promise<{
    text: string;
    confidence: number;
    engine: "sherpa-onnx";
    segments?: Array<{
      id: string;
      start: number;
      end: number;
      text: string;
      confidence: number;
    }>;
  }> {
    // In a real implementation, you'd use the sherpa-onnx library
    throw new Error("Sherpa-ONNX not available in demo environment");
  }

  /**
   * Create mock transcription for demonstration
   */
  private createMockTranscription(duration: number): {
    text: string;
    confidence: number;
    engine: "mock";
    segments: Array<{
      id: string;
      start: number;
      end: number;
      text: string;
      confidence: number;
    }>;
  } {
    const mockSegments = [
      {
        id: "seg_001",
        start: 0,
        end: 15,
        text: "Welcome to this audio recording about enhanced speech processing.",
        confidence: 0.95,
      },
      {
        id: "seg_002",
        start: 15,
        end: 30,
        text: "Today we'll be discussing various aspects of natural language processing.",
        confidence: 0.92,
      },
      {
        id: "seg_003",
        start: 30,
        end: Math.min(duration, 45),
        text: "This includes speech recognition, entity extraction, and sentiment analysis.",
        confidence: 0.88,
      },
    ];

    const text = mockSegments.map((s) => s.text).join(" ");

    return {
      text,
      confidence: 0.92,
      engine: "mock",
      segments: mockSegments,
    };
  }

  /**
   * Analyze audio quality characteristics
   */
  private analyzeAudioQuality(
    transcriptionResult: any,
    audioMetadata: any
  ): EnhancedAudioMetadata["audioQuality"] {
    const avgConfidence =
      transcriptionResult.segments?.reduce(
        (sum: number, seg: any) => sum + seg.confidence,
        0
      ) / (transcriptionResult.segments?.length || 1);

    // Estimate quality based on confidence and audio characteristics
    const clarity =
      avgConfidence > 0.9
        ? "excellent"
        : avgConfidence > 0.8
        ? "good"
        : avgConfidence > 0.6
        ? "fair"
        : "poor";

    const noiseLevel =
      avgConfidence > 0.85 ? "low" : avgConfidence > 0.7 ? "medium" : "high";

    // Mock speech/silence ratio analysis
    const speechRatio = Math.min(0.95, avgConfidence * 0.8 + 0.2);
    const silenceRatio = 1 - speechRatio;

    const overallScore = (avgConfidence + speechRatio) / 2;

    return {
      noiseLevel,
      clarity,
      speechRatio,
      silenceRatio,
      overallScore,
    };
  }

  /**
   * Perform speaker diarization
   */
  private performSpeakerDiarization(
    segments: any[]
  ): EnhancedAudioMetadata["speakers"] {
    // Mock speaker diarization - in reality, you'd use libraries like:
    // - pyannote.audio (via Python integration)
    // - speaker-diarization libraries

    const speakers = [
      {
        id: "speaker_001",
        label: "Speaker 1",
        segments: segments
          .slice(0, Math.ceil(segments.length / 2))
          .map((_, i) => i),
        confidence: 0.87,
      },
      {
        id: "speaker_002",
        label: "Speaker 2",
        segments: segments
          .slice(Math.ceil(segments.length / 2))
          .map((_, i) => i + Math.ceil(segments.length / 2)),
        confidence: 0.83,
      },
    ];

    return speakers;
  }

  /**
   * Detect topics in the conversation
   */
  private detectTopics(
    fullText: string,
    segments?: any[]
  ): EnhancedAudioMetadata["topics"] {
    // Mock topic detection - in reality, you'd use:
    // - TF-IDF with keyword extraction
    // - LDA (Latent Dirichlet Allocation)
    // - Modern transformer models for topic modeling

    const topics = [
      {
        name: "Speech Processing",
        confidence: 0.92,
        timeRanges: [{ start: 0, end: 30 }],
      },
      {
        name: "Natural Language Processing",
        confidence: 0.88,
        timeRanges: [{ start: 15, end: 45 }],
      },
      {
        name: "Technology Discussion",
        confidence: 0.75,
        timeRanges: [{ start: 0, end: 60 }],
      },
    ];

    return topics;
  }

  /**
   * Analyze sentiment throughout the conversation
   */
  private analyzeSentiment(
    fullText: string,
    segments?: any[]
  ): EnhancedAudioMetadata["sentimentAnalysis"] {
    // Mock sentiment analysis - in reality, you'd use:
    // - VADER sentiment analyzer
    // - TextBlob
    // - Transformer models like BERT for sentiment

    return {
      overall: "positive",
      confidence: 0.78,
      segments:
        segments?.map((seg, i) => ({
          start: seg.start,
          end: seg.end,
          sentiment:
            i % 3 === 0 ? "positive" : i % 3 === 1 ? "neutral" : "positive",
          confidence: 0.7 + Math.random() * 0.25,
        })) || [],
    };
  }

  /**
   * Format the transcript text with enhanced information
   */
  private formatTranscriptText(
    transcriptionResult: any,
    metadata: EnhancedAudioMetadata
  ): string {
    let formattedText = `# Audio Transcript

**File Information:**
- Duration: ${metadata.duration.toFixed(1)} seconds
- Quality: ${metadata.audioQuality.clarity} (${(
      metadata.audioQuality.overallScore * 100
    ).toFixed(1)}% confidence)
- Speech Coverage: ${(metadata.audioQuality.speechRatio * 100).toFixed(1)}%
- Transcription Engine: ${metadata.transcriptionEngine}

`;

    // Add speaker information if available
    if (metadata.speakers && metadata.speakers.length > 1) {
      formattedText += `**Speakers Detected:** ${metadata.speakers.length}\n`;
      metadata.speakers.forEach((speaker) => {
        formattedText += `- ${speaker.label}: ${
          speaker.segments.length
        } segments (${(speaker.confidence * 100).toFixed(1)}% confidence)\n`;
      });
      formattedText += "\n";
    }

    // Add topics if available
    if (metadata.topics && metadata.topics.length > 0) {
      formattedText += `**Topics Discussed:**\n`;
      metadata.topics.forEach((topic) => {
        formattedText += `- ${topic.name} (${(topic.confidence * 100).toFixed(
          1
        )}% confidence)\n`;
      });
      formattedText += "\n";
    }

    // Add sentiment if available
    if (metadata.sentimentAnalysis) {
      formattedText += `**Overall Sentiment:** ${
        metadata.sentimentAnalysis.overall
      } (${(metadata.sentimentAnalysis.confidence * 100).toFixed(
        1
      )}% confidence)\n\n`;
    }

    // Add the main transcript
    formattedText += `## Transcript\n\n`;

    if (transcriptionResult.segments && metadata.speakers) {
      // Format with speakers and timestamps
      transcriptionResult.segments.forEach((segment: any, index: number) => {
        const speaker = metadata.speakers?.find((s) =>
          s.segments.includes(index)
        );
        const timestamp = `[${this.formatTimestamp(
          segment.start
        )}-${this.formatTimestamp(segment.end)}]`;
        const speakerLabel = speaker ? `**${speaker.label}:** ` : "";
        formattedText += `${timestamp} ${speakerLabel}${segment.text}\n\n`;
      });
    } else if (transcriptionResult.segments) {
      // Format with timestamps only
      transcriptionResult.segments.forEach((segment: any) => {
        const timestamp = `[${this.formatTimestamp(
          segment.start
        )}-${this.formatTimestamp(segment.end)}]`;
        formattedText += `${timestamp} ${segment.text}\n\n`;
      });
    } else {
      // Simple text format
      formattedText += transcriptionResult.text;
    }

    return formattedText;
  }

  /**
   * Format timestamp in MM:SS format
   */
  private formatTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }

  /**
   * Create result for skipped files
   */
  private createSkippedResult(
    reason: string,
    basicMetadata: any
  ): ProcessorResult {
    return {
      success: true,
      text: `Audio File: ${reason}`,
      metadata: {
        type: ContentType.AUDIO,
        language: "unknown",
        duration: basicMetadata.duration,
        sampleRate: 0,
        channels: 0,
        format: basicMetadata.format,
        hasText: false,
        wordCount: 0,
        characterCount: 0,
        transcriptionEngine: "fallback" as const,
        transcriptionConfidence: 0,
        audioQuality: {
          noiseLevel: "unknown" as any,
          clarity: "unknown" as any,
          speechRatio: 0,
          silenceRatio: 1,
          overallScore: 0,
        },
      } as EnhancedAudioMetadata,
      processingTime: 0,
    };
  }

  /**
   * Extract text from file path (for compatibility)
   */
  async extractText(filePath: string): Promise<ProcessorResult> {
    try {
      const buffer = fs.readFileSync(filePath);
      return await this.extractFromBuffer(buffer);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        text: `Error reading audio file: ${errorMessage}`,
        metadata: {
          type: ContentType.AUDIO,
          language: "unknown",
          duration: 0,
          sampleRate: 0,
          channels: 0,
          format: "unknown",
          hasText: false,
          wordCount: 0,
          characterCount: 0,
          transcriptionEngine: "fallback" as const,
          transcriptionConfidence: 0,
          audioQuality: {
            noiseLevel: "high" as const,
            clarity: "poor" as const,
            speechRatio: 0,
            silenceRatio: 1,
            overallScore: 0,
          },
        } as EnhancedAudioMetadata,
        processingTime: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Extract text from buffer (for compatibility with pipeline)
   */
  async extractTextFromBuffer(buffer: Buffer): Promise<ProcessorResult> {
    return await this.extractFromBuffer(buffer);
  }
}
