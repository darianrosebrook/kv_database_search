import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import * as path from "path";
import { ContentType, ContentMetadata } from "@kv/types";
import {
  detectLanguage,
  EntityExtractor,
  ExtractedEntity,
  EntityRelationship,
  countWords,
  countCharacters,
} from "@kv/utils";
import {
  BaseContentProcessor,
  ProcessorOptions,
  ProcessorResult,
} from "./base-processor.ts";

export interface AudioMetadata {
  duration: number; // in seconds
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
  codec: string;
  format: string;
  size: number; // file size in bytes
}

export interface TranscriptionSegment {
  start: number; // timestamp in seconds
  end: number;
  text: string;
  confidence?: number;
  speaker?: string;
}

export interface AudioTranscriptionMetadata extends ContentMetadata {
  audioMetadata: AudioMetadata;
  hasText: boolean;
  wordCount: number;
  characterCount: number;
  transcriptionEngine:
    | "whisper-cpp"
    | "openai-whisper"
    | "web-speech"
    | "fallback";
  segments?: TranscriptionSegment[];
  entities?: ExtractedEntity[];
  relationships?: EntityRelationship[];
  speakers?: {
    count: number;
    identified: string[];
  };
  qualityMetrics?: {
    averageConfidence: number;
    speechDuration: number; // actual speech vs silence
    speechRate: number; // words per minute
  };
}

export interface AudioTranscriptionOptions extends ProcessorOptions {
  useTimestamps?: boolean;
  enableSpeakerDetection?: boolean;
  model?: "whisper-1" | "whisper-large" | "auto";
  temperature?: number;
  language?: string;
}

export class AudioTranscriptionProcessor extends BaseContentProcessor {
  private entityExtractor: EntityExtractor;
  private tempDir: string;

  constructor() {
    super("Audio Transcription Processor", [
      ContentType.AUDIO,
      ContentType.AUDIO_FILE,
    ]);
    this.entityExtractor = new EntityExtractor();
    this.tempDir = "/tmp/audio-processing";

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
          throw new Error(error);
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
          throw new Error(error);
        }
      }
    } catch {
      console.warn(
        "⚠️ Could not configure FFmpeg paths, using system defaults"
      );
    }
  }

  /**
   * Extract text from audio files
   */
  async extractFromBuffer(
    buffer: Buffer,
    options?: AudioTranscriptionOptions
  ): Promise<ProcessorResult> {
    const { result, time } = await this.measureTime(async () => {
      try {
        console.log("🎤 Starting audio transcription...");

        // Write buffer to temporary file
        const tempAudioPath = path.join(
          this.tempDir,
          `audio_${Date.now()}.wav`
        );
        fs.writeFileSync(tempAudioPath, buffer);

        try {
          // Extract audio metadata
          console.log("📊 Extracting audio metadata...");
          const audioMetadata = await this.extractAudioMetadata(tempAudioPath);

          // Perform transcription
          console.log("🔊 Performing audio transcription...");
          const transcriptionResult = await this.transcribeAudio(
            tempAudioPath,
            audioMetadata,
            options
          );

          // Extract entities and relationships
          console.log("🏷️ Extracting entities and relationships...");
          const entities = this.entityExtractor.extractEntities(
            transcriptionResult.text
          );
          const relationships = this.entityExtractor.extractRelationships(
            transcriptionResult.text,
            entities
          );

          // Analyze speech patterns and quality
          const qualityMetrics = this.analyzeTranscriptionQuality(
            transcriptionResult.segments || [],
            audioMetadata
          );

          // Detect speakers if enabled
          const speakers = options?.enableSpeakerDetection
            ? this.detectSpeakers(transcriptionResult.segments || [])
            : undefined;

          const wordCount = countWords(transcriptionResult.text);
          const characterCount = countCharacters(transcriptionResult.text);
          const hasText = wordCount > 0;

          const metadata: AudioTranscriptionMetadata = {
            type: ContentType.AUDIO,
            language:
              options?.language || detectLanguage(transcriptionResult.text),
            audioMetadata,
            hasText,
            wordCount,
            characterCount,
            transcriptionEngine: transcriptionResult.engine,
            segments: transcriptionResult.segments,
            entities,
            relationships,
            speakers,
            qualityMetrics,
          };

          console.log(
            `✅ Audio transcription complete: ${wordCount} words, ${
              transcriptionResult.segments?.length || 0
            } segments`
          );

          return {
            success: true,
            text: hasText
              ? transcriptionResult.text
              : `Audio: ${audioMetadata.duration.toFixed(
                  2
                )}s duration, no speech detected`,
            metadata,
            processingTime: 0, // Will be set after measureTime completes
          };
        } finally {
          // Clean up temporary audio file
          try {
            fs.unlinkSync(tempAudioPath);
          } catch (cleanupError) {
            console.warn(
              "⚠️ Failed to clean up temp audio file:",
              cleanupError
            );
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("❌ Audio transcription failed:", errorMessage);

        const errorResult = this.createErrorResult(
          `Audio transcription error: ${errorMessage}`
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
   * Extract audio from video buffer and transcribe
   */
  async extractAudioFromVideo(
    videoBuffer: Buffer,
    options?: AudioTranscriptionOptions
  ): Promise<ProcessorResult> {
    const tempVideoPath = path.join(this.tempDir, `video_${Date.now()}.mp4`);

    try {
      // Write video buffer to temp file
      fs.writeFileSync(tempVideoPath, videoBuffer);

      // Delegate to path-based method
      return await this.extractAudioFromVideoPath(tempVideoPath, options);
    } finally {
      // Clean up temp video file
      try {
        if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
      } catch (cleanupError) {
        console.warn("⚠️ Failed to clean up temp video file:", cleanupError);
      }
    }
  }

  /**
   * Extract audio from video file path and transcribe (avoids loading video into memory)
   */
  async extractAudioFromVideoPath(
    videoPath: string,
    options?: AudioTranscriptionOptions
  ): Promise<ProcessorResult> {
    const tempAudioPath = path.join(
      this.tempDir,
      `extracted_audio_${Date.now()}.wav`
    );

    try {
      // Extract audio from video directly using file path
      console.log("🎬 Extracting audio from video...");
      await this.extractAudioFromVideoFile(videoPath, tempAudioPath);

      // Transcribe directly from the extracted audio file path
      return await this.transcribeFromPath(tempAudioPath, options);
    } finally {
      // Clean up temp audio file
      try {
        if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
      } catch (cleanupError) {
        console.warn("⚠️ Failed to clean up temp audio file:", cleanupError);
      }
    }
  }

  /**
   * Transcribe directly from an audio file path (avoids buffer round-trip)
   */
  private async transcribeFromPath(
    audioPath: string,
    options?: AudioTranscriptionOptions
  ): Promise<ProcessorResult> {
    const { result, time } = await this.measureTime(async () => {
      try {
        console.log("🎤 Starting audio transcription from file...");

        // Extract audio metadata
        console.log("📊 Extracting audio metadata...");
        const audioMetadata = await this.extractAudioMetadata(audioPath);

        // Perform transcription
        console.log("🔊 Performing audio transcription...");
        const transcriptionResult = await this.transcribeAudio(
          audioPath,
          audioMetadata,
          options
        );

        // Extract entities and relationships
        console.log("🏷️ Extracting entities and relationships...");
        const entities = this.entityExtractor.extractEntities(
          transcriptionResult.text
        );
        const relationships = this.entityExtractor.extractRelationships(
          transcriptionResult.text,
          entities
        );

        // Analyze speech patterns and quality
        const qualityMetrics = this.analyzeTranscriptionQuality(
          transcriptionResult.segments || [],
          audioMetadata
        );

        // Detect speakers if enabled
        const speakers = options?.enableSpeakerDetection
          ? this.detectSpeakers(transcriptionResult.segments || [])
          : undefined;

        const wordCount = countWords(transcriptionResult.text);
        const characterCount = countCharacters(transcriptionResult.text);
        const hasText = wordCount > 0;

        const metadata: AudioTranscriptionMetadata = {
          type: ContentType.AUDIO,
          language:
            options?.language || detectLanguage(transcriptionResult.text),
          audioMetadata,
          hasText,
          wordCount,
          characterCount,
          transcriptionEngine: transcriptionResult.engine,
          segments: transcriptionResult.segments,
          entities,
          relationships,
          speakers,
          qualityMetrics,
        };

        console.log(
          `✅ Audio transcription complete: ${wordCount} words, ${
            transcriptionResult.segments?.length || 0
          } segments`
        );

        return {
          success: true,
          text: hasText
            ? transcriptionResult.text
            : `Audio: ${audioMetadata.duration.toFixed(
                2
              )}s duration, no speech detected`,
          metadata,
          processingTime: 0,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("❌ Audio transcription failed:", errorMessage);

        const errorResult = this.createErrorResult(
          `Audio transcription error: ${errorMessage}`
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
   * Extract audio metadata using FFmpeg
   */
  private async extractAudioMetadata(
    audioPath: string
  ): Promise<AudioMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) {
          reject(new Error(`FFprobe failed: ${err.message}`));
          return;
        }

        try {
          const audioStream = metadata.streams.find(
            (stream) => stream.codec_type === "audio"
          );

          if (!audioStream) {
            reject(new Error("No audio stream found"));
            return;
          }

          const duration = parseFloat(String(metadata.format.duration || "0"));

          resolve({
            duration,
            sampleRate: audioStream.sample_rate || undefined,
            channels: audioStream.channels || undefined,
            bitrate: parseInt(String(audioStream.bit_rate || "0")) || undefined,
            codec: audioStream.codec_name || "unknown",
            format: metadata.format.format_name || "unknown",
            size: parseInt(String(metadata.format.size || "0")),
          });
        } catch (parseError) {
          reject(new Error(`Metadata parsing failed: ${parseError}`));
        }
      });
    });
  }

  /**
   * Extract audio from video file using FFmpeg
   */
  private extractAudioFromVideoFile(
    videoPath: string,
    audioPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .output(audioPath)
        .audioCodec("pcm_s16le") // Standard WAV format
        .audioFrequency(16000) // Standard frequency for speech recognition
        .audioChannels(1) // Mono for speech recognition
        .noVideo()
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });
  }

  /**
   * Transcribe audio using available transcription services
   */
  private async transcribeAudio(
    audioPath: string,
    audioMetadata: AudioMetadata,
    options?: AudioTranscriptionOptions
  ): Promise<{
    text: string;
    engine: "whisper-cpp" | "openai-whisper" | "web-speech" | "fallback";
    segments?: TranscriptionSegment[];
  }> {
    // Try different transcription methods in order of preference

    // 1. Try local Whisper.cpp (highest priority - fast, accurate, local)
    try {
      console.log("🎤 Attempting Whisper.cpp transcription...");
      return await this.transcribeWithWhisperCpp(
        audioPath,
        audioMetadata,
        options
      );
    } catch (error) {
      console.warn("⚠️ Whisper.cpp failed, trying OpenAI API:", error);
    }

    // 2. Try OpenAI Whisper API if API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log("🤖 Attempting OpenAI Whisper API transcription...");
        return await this.transcribeWithOpenAI(
          audioPath,
          audioMetadata,
          options
        );
      } catch (error) {
        console.warn("⚠️ OpenAI Whisper API failed, trying Web Speech:", error);
      }
    }

    // 3. Try Web Speech API (if available in environment)
    try {
      console.log("🌐 Attempting Web Speech API transcription...");
      return await this.transcribeWithWebSpeech(
        audioPath,
        audioMetadata,
        options
      );
    } catch (error) {
      console.warn("⚠️ Web Speech API failed, using fallback:", error);
    }

    // 4. Fallback: Return placeholder with structured metadata
    console.log("🔄 Using transcription fallback mode...");
    return this.createTranscriptionFallback(audioMetadata);
  }

  /**
   * Transcribe using local Whisper.cpp via nodejs-whisper
   */
  private async transcribeWithWhisperCpp(
    audioPath: string,
    audioMetadata: AudioMetadata,
    options?: AudioTranscriptionOptions
  ): Promise<{
    text: string;
    engine: "whisper-cpp";
    segments?: TranscriptionSegment[];
  }> {
    try {
      const { nodewhisper } = await import("nodejs-whisper");

      console.log("🤖 Starting Whisper.cpp transcription...");

      // Pick the right ggml model. nodejs-whisper's MODELS_LIST uses
      // "base.en", "small.en", "medium.en" for English-only variants —
      // those are noticeably faster and more accurate when we know the
      // language is English. Fall back to multilingual when caller
      // specifies a non-English language.
      const language = options?.language || "en";
      const isEnglish = language === "en" || language === "auto";
      const modelName =
        options?.model === "whisper-large"
          ? "large-v3-turbo"
          : isEnglish
          ? "base.en"
          : "base";

      // nodejs-whisper accepts only camelCase fields and a small subset of
      // flags (output formats, wordTimestamps, translateToEnglish,
      // timestamps_length, splitOnWord). Snake_case fields like
      // word_timestamps / no_speech_threshold / temperature / beam_size are
      // silently ignored by the wrapper. Pass autoDownloadModelName so the
      // model is fetched on first use if missing; the wrapper also self-
      // builds whisper.cpp via cmake when whisper-cli isn't present.
      const transcriptOptions = {
        modelName,
        autoDownloadModelName: modelName,
        whisperOptions: {
          outputInText: true,
          wordTimestamps: options?.useTimestamps ?? true,
        },
      };

      console.log(`   Model: ${modelName}`);
      console.log(`   Language: ${language}`);
      console.log("   Processing (first run may build whisper.cpp via cmake)...");

      const startTime = Date.now();
      const transcript = await nodewhisper(audioPath, transcriptOptions);
      const processingTime = Date.now() - startTime;

      const transcriptText = transcript ?? "";

      console.log(
        `✅ Whisper.cpp transcription complete in ${(
          processingTime / 1000
        ).toFixed(1)}s`
      );
      console.log(`   Extracted ${transcriptText.split(/\s+/).length} words`);

      let segments: TranscriptionSegment[] | undefined;
      if (transcriptText.includes("[") && transcriptText.includes("-->")) {
        segments = this.parseWhisperTimestamps(transcriptText);
      }

      return {
        text: transcriptText,
        engine: "whisper-cpp",
        segments,
      };
    } catch (error) {
      console.error("❌ Whisper.cpp transcription failed:", error);
      throw error;
    }
  }

  /**
   * Parse timestamp segments from Whisper output
   */
  private parseWhisperTimestamps(
    transcriptText: string
  ): TranscriptionSegment[] {
    const segments: TranscriptionSegment[] = [];
    const timestampRegex =
      /\[(\d{2}):(\d{2}):(\d{2})\.(\d{3}) --> (\d{2}):(\d{2}):(\d{2})\.(\d{3})\]\s*([^[]*)/g;

    let match;
    while ((match = timestampRegex.exec(transcriptText)) !== null) {
      const startHours = parseInt(match[1]);
      const startMinutes = parseInt(match[2]);
      const startSeconds = parseInt(match[3]);
      const startMs = parseInt(match[4]);

      const endHours = parseInt(match[5]);
      const endMinutes = parseInt(match[6]);
      const endSeconds = parseInt(match[7]);
      const endMs = parseInt(match[8]);

      const text = match[9].trim();

      if (text && text.length > 0 && !this.isNonSpeechSegment(text)) {
        segments.push({
          start:
            startHours * 3600 +
            startMinutes * 60 +
            startSeconds +
            startMs / 1000,
          end: endHours * 3600 + endMinutes * 60 + endSeconds + endMs / 1000,
          text: text,
          confidence: 0.9, // Whisper doesn't provide per-segment confidence, use default
        });
      }
    }

    return segments;
  }

  /**
   * Check if a transcript segment is non-speech (music, applause, filler sounds).
   * Whisper annotates non-speech with parentheses or brackets.
   */
  private isNonSpeechSegment(text: string): boolean {
    const trimmed = text.trim();

    // Parenthetical non-speech annotations: (upbeat music), (audience applauding), etc.
    if (/^\(.*\)$/.test(trimmed)) {
      return true;
    }

    // Bracket annotations: [music], [applause], etc.
    if (/^\[.*\]$/.test(trimmed)) {
      return true;
    }

    // Pure filler sounds
    if (/^(um|uh|hmm|mm|ah|oh|huh|mhm)\.?$/i.test(trimmed)) {
      return true;
    }

    return false;
  }

  /**
   * Transcribe using OpenAI Whisper API.
   *
   * NOT IMPLEMENTED. The previous version of this method returned a hard-
   * coded placeholder string while reporting engine "openai-whisper" with
   * confidence 0.95, which silently propagated as a "successful"
   * transcription through the summary pipeline. Throwing here lets the
   * cascade fall through to the honest `fallback` engine until a real
   * OpenAI SDK integration lands.
   */
  private async transcribeWithOpenAI(
    _audioPath: string,
    _audioMetadata: AudioMetadata,
    _options?: AudioTranscriptionOptions
  ): Promise<{
    text: string;
    engine: "openai-whisper";
    segments?: TranscriptionSegment[];
  }> {
    throw new Error(
      "OpenAI Whisper API integration is not implemented. Install the `openai` SDK and wire it in transcribeWithOpenAI to enable this engine."
    );
  }

  /**
   * Transcribe using Web Speech API.
   *
   * NOT IMPLEMENTED. The Web Speech API requires a browser environment
   * (window.SpeechRecognition); Node.js has no equivalent. The previous
   * version of this method returned a hard-coded placeholder string while
   * reporting engine "web-speech" with confidence 0.8, which silently
   * propagated as a "successful" transcription through the summary
   * pipeline. Throwing here lets the cascade fall through to the honest
   * `fallback` engine.
   */
  private async transcribeWithWebSpeech(
    _audioPath: string,
    _audioMetadata: AudioMetadata,
    _options?: AudioTranscriptionOptions
  ): Promise<{
    text: string;
    engine: "web-speech";
    segments?: TranscriptionSegment[];
  }> {
    throw new Error(
      "Web Speech API is not available in Node.js. This engine is unimplemented."
    );
  }

  /**
   * Create fallback transcription result
   */
  private createTranscriptionFallback(audioMetadata: AudioMetadata): {
    text: string;
    engine: "fallback";
    segments?: TranscriptionSegment[];
  } {
    const text = `Audio file detected: ${audioMetadata.duration.toFixed(
      2
    )}s duration, ${audioMetadata.format} format, ${
      audioMetadata.codec
    } codec. Transcription services not available - to enable speech-to-text, configure OpenAI API key or other transcription service.`;

    return {
      text,
      engine: "fallback",
    };
  }

  /**
   * Analyze transcription quality and speech patterns
   */
  private analyzeTranscriptionQuality(
    segments: TranscriptionSegment[],
    _audioMetadata: AudioMetadata
  ): AudioTranscriptionMetadata["qualityMetrics"] {
    if (segments.length === 0) {
      return {
        averageConfidence: 0,
        speechDuration: 0,
        speechRate: 0,
      };
    }

    const totalConfidence = segments.reduce(
      (sum, segment) => sum + (segment.confidence || 0),
      0
    );
    const averageConfidence = totalConfidence / segments.length;

    const speechDuration = segments.reduce(
      (sum, segment) => sum + (segment.end - segment.start),
      0
    );

    const totalWords = segments.reduce(
      (sum, segment) => sum + countWords(segment.text),
      0
    );
    const speechRate =
      speechDuration > 0 ? (totalWords / speechDuration) * 60 : 0;

    return {
      averageConfidence,
      speechDuration,
      speechRate,
    };
  }

  /**
   * Detect speakers in transcription segments
   */
  private detectSpeakers(
    segments: TranscriptionSegment[]
  ): AudioTranscriptionMetadata["speakers"] {
    const speakers = new Set<string>();
    segments.forEach((segment) => {
      if (segment.speaker) {
        speakers.add(segment.speaker);
      }
    });

    return {
      count: speakers.size,
      identified: Array.from(speakers),
    };
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
        `Failed to read audio file: ${errorMessage}`
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
        type: ContentType.AUDIO,
        language,
        hasText: false,
        wordCount: 0,
        characterCount: 0,
        transcriptionEngine: "fallback" as const,
        audioMetadata: {
          duration: 0,
          codec: "unknown",
          format: "unknown",
          size: 0,
        },
      } as AudioTranscriptionMetadata,
      processingTime: 0,
      errors: [errorMessage],
    };
  }
}
