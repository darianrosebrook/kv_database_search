import {
  createModel,
  createRecognizer,
  type ModelConfig,
  type RecognizerConfig,
} from "sherpa-onnx";
import { ContentType, ContentMetadata } from "../multi-modal.js";
import * as fs from "fs";

export interface SpeechMetadata {
  duration?: number; // in seconds
  sampleRate?: number;
  channels?: number;
  confidence?: number;
  processingTime: number;
  language: string;
  engine: string;
}

export interface SpeechContentMetadata extends ContentMetadata {
  speechMetadata?: SpeechMetadata;
  hasText: boolean;
  wordCount: number;
  characterCount: number;
}

export class SpeechProcessor {
  private model: any = null;
  private recognizer: any = null;
  private initialized = false;

  /**
   * Initialize the speech recognition model
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Configure the model for speech recognition
      // Using a pre-built model configuration for English
      const modelConfig: ModelConfig = {
        encoder:
          "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/encoder-epoch-99-avg-1.onnx",
        decoder:
          "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/decoder-epoch-99-avg-1.onnx",
        joiner:
          "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/joiner-epoch-99-avg-1.onnx",
        tokens:
          "./models/sherpa-onnx-streaming-zipformer-en-2023-06-26/tokens.txt",
        numThreads: 2,
        provider: "cpu",
      };

      const recognizerConfig: RecognizerConfig = {
        modelConfig,
        decodingMethod: "greedy_search",
        maxActivePaths: 4,
        enableEndpoint: true,
        rule1MinTrailingSilence: 2.4,
        rule2MinTrailingSilence: 1.2,
        rule3MinUtteranceLength: 20,
      };

      // Create model and recognizer
      this.model = createModel(modelConfig);
      this.recognizer = createRecognizer(recognizerConfig);

      this.initialized = true;
    } catch (error) {
      console.warn("Speech recognition model initialization failed:", error);
      // Continue with limited functionality
    }
  }

  /**
   * Transcribe audio from a buffer
   */
  async transcribeFromBuffer(
    buffer: Buffer,
    options: {
      language?: string;
      sampleRate?: number;
    } = {}
  ): Promise<{
    text: string;
    metadata: SpeechContentMetadata;
  }> {
    try {
      await this.initialize();

      const startTime = Date.now();

      // If we don't have a working model, return a placeholder
      if (!this.recognizer) {
        return this.createFallbackResult(
          "Speech recognition model not available",
          startTime
        );
      }

      // Convert buffer to the format expected by sherpa-onnx
      // This is a simplified implementation - in practice, you'd need proper audio decoding
      const audioData = this.convertBufferToAudioData(buffer);

      if (!audioData) {
        return this.createFallbackResult("Unsupported audio format", startTime);
      }

      // Reset recognizer for new audio
      this.recognizer.reset();

      // Process audio in chunks
      const stream = this.recognizer.createStream();
      const samplesPerChunk = 1024; // Process in chunks

      for (let i = 0; i < audioData.length; i += samplesPerChunk) {
        const chunk = audioData.slice(i, i + samplesPerChunk);
        stream.acceptWaveform(chunk);
      }

      // Get the final result
      stream.inputFinished();
      const result = this.recognizer.getResult();

      const processingTime = Date.now() - startTime;
      const text = result.text?.trim() || "";
      const words = text.split(/\s+/).filter((word) => word.length > 0);
      const hasText = text.length > 0 && words.length > 0;

      // Estimate confidence (simplified - sherpa-onnx doesn't provide direct confidence)
      const confidence = hasText ? 0.8 : 0.0;

      const speechMetadata: SpeechMetadata = {
        duration: audioData.length / (options.sampleRate || 16000), // Estimate duration
        sampleRate: options.sampleRate || 16000,
        channels: 1, // Assume mono
        confidence,
        processingTime,
        language: options.language || "en",
        engine: "sherpa-onnx",
      };

      const contentMetadata: SpeechContentMetadata = {
        type: ContentType.AUDIO,
        language: this.detectLanguage(text),
        encoding: "utf-8",
        hasText,
        wordCount: words.length,
        characterCount: text.length,
        speechMetadata,
      };

      return {
        text: hasText
          ? text
          : "Audio: No speech detected or transcription failed",
        metadata: contentMetadata,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return this.createFallbackResult(
        `Speech processing error: ${errorMessage}`,
        Date.now()
      );
    }
  }

  /**
   * Transcribe audio from a file
   */
  async transcribeFromFile(
    filePath: string,
    options: {
      language?: string;
      sampleRate?: number;
    } = {}
  ): Promise<{
    text: string;
    metadata: SpeechContentMetadata;
  }> {
    try {
      const buffer = fs.readFileSync(filePath);
      return await this.transcribeFromBuffer(buffer, options);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const contentMetadata: SpeechContentMetadata = {
        type: ContentType.AUDIO,
        language: "unknown",
        encoding: "unknown",
        hasText: false,
        wordCount: 0,
        characterCount: 0,
      };

      return {
        text: `Audio File Error: Failed to read file - ${errorMessage}`,
        metadata: contentMetadata,
      };
    }
  }

  /**
   * Check if a file format is supported for speech recognition
   */
  isSupportedAudioFormat(buffer: Buffer): boolean {
    // Check common audio file signatures
    const signatures = [
      Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF (WAV)
      Buffer.from([0x66, 0x74, 0x79, 0x70]), // ftyp (MP4/M4A)
      Buffer.from([0x49, 0x44, 0x33]), // ID3 (MP3)
      Buffer.from([0x4f, 0x67, 0x67, 0x53]), // OggS (OGG)
      Buffer.from([0x66, 0x4c, 0x61, 0x43]), // fLaC (FLAC)
    ];

    return signatures.some(
      (signature) =>
        buffer.subarray(0, 4).equals(signature) ||
        buffer.subarray(0, signature.length).equals(signature)
    );
  }

  /**
   * Convert audio buffer to float32 array (simplified implementation)
   * In practice, you'd need proper audio decoding based on format
   */
  private convertBufferToAudioData(buffer: Buffer): Float32Array | null {
    try {
      // This is a very simplified implementation
      // In practice, you'd need to:
      // 1. Detect audio format (WAV, MP3, etc.)
      // 2. Decode the audio to raw PCM data
      // 3. Convert to Float32Array

      // For now, return null to indicate unsupported format
      // This would need to be implemented with proper audio decoding libraries
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create a fallback result when speech recognition is not available
   */
  private createFallbackResult(
    reason: string,
    startTime: number
  ): {
    text: string;
    metadata: SpeechContentMetadata;
  } {
    const contentMetadata: SpeechContentMetadata = {
      type: ContentType.AUDIO,
      language: "unknown",
      encoding: "unknown",
      hasText: false,
      wordCount: 0,
      characterCount: 0,
      speechMetadata: {
        processingTime: Date.now() - startTime,
        language: "unknown",
        engine: "none",
      },
    };

    return {
      text: `Audio: ${reason}`,
      metadata: contentMetadata,
    };
  }

  /**
   * Simple language detection based on common patterns
   */
  private detectLanguage(text: string): string {
    if (!text || text.length === 0) return "unknown";

    // Simple heuristics for language detection
    const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi;
    const spanishWords =
      /\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi;
    const frenchWords =
      /\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi;

    const englishMatches = (text.match(englishWords) || []).length;
    const spanishMatches = (text.match(spanishWords) || []).length;
    const frenchMatches = (text.match(frenchWords) || []).length;

    const maxMatches = Math.max(englishMatches, spanishMatches, frenchMatches);

    if (maxMatches === 0) return "unknown";
    if (maxMatches === englishMatches) return "en";
    if (maxMatches === spanishMatches) return "es";
    if (maxMatches === frenchMatches) return "fr";

    return "unknown";
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.recognizer) {
      this.recognizer.free();
      this.recognizer = null;
    }
    if (this.model) {
      this.model.free();
      this.model = null;
    }
    this.initialized = false;
  }

  /**
   * Check if the speech processor is ready
   */
  isReady(): boolean {
    return this.initialized && this.recognizer !== null;
  }
}
