import { createWorker, Worker } from "tesseract.js";
import { ContentType, ContentMetadata } from "../multi-modal.js";
import * as fs from "fs";

export interface OCRMetadata {
  confidence: number;
  processingTime: number;
  language: string;
  version: string;
}

export interface OCRContentMetadata extends ContentMetadata {
  confidence: number;
  ocrMetadata?: OCRMetadata;
  hasText: boolean;
  wordCount: number;
  characterCount: number;
}

export class OCRProcessor {
  private worker: Worker | null = null;

  /**
   * Initialize the OCR worker
   */
  async initialize(): Promise<void> {
    if (!this.worker) {
      this.worker = await createWorker("eng"); // Default to English
    }
  }

  /**
   * Extract text from an image buffer
   */
  async extractTextFromBuffer(
    buffer: Buffer,
    options: {
      language?: string;
      confidence?: number;
    } = {}
  ): Promise<{
    text: string;
    metadata: OCRContentMetadata;
  }> {
    try {
      await this.initialize();

      if (!this.worker) {
        throw new Error("OCR worker not initialized");
      }

      // Load language if specified
      if (options.language && options.language !== "eng") {
        await this.worker.setParameters({
          tessedit_ocr_engine_mode: "1", // Use LSTM OCR engine
        });
      }

      const startTime = Date.now();

      // Perform OCR
      const result = await this.worker.recognize(buffer);

      const processingTime = Date.now() - startTime;
      const text = result.data.text.trim();
      const confidence = result.data.confidence;

      // Analyze extracted text
      const words = text.split(/\s+/).filter((word) => word.length > 0);
      const hasText = text.length > 0 && words.length > 0;

      // Check if confidence meets minimum threshold
      const minConfidence = options.confidence || 30; // Default minimum confidence
      const isConfident = confidence >= minConfidence;

      const ocrMetadata: OCRMetadata = {
        confidence,
        processingTime,
        language: options.language || "eng",
        version: "tesseract.js",
      };

      const contentMetadata: OCRContentMetadata = {
        type: ContentType.RASTER_IMAGE,
        language: this.detectLanguage(text),
        encoding: "utf-8",
        confidence,
        hasText: hasText && isConfident,
        wordCount: words.length,
        characterCount: text.length,
        ocrMetadata,
      };

      // Return appropriate text based on confidence
      const finalText =
        isConfident && hasText
          ? text
          : `Image OCR: ${
              hasText
                ? `Low confidence (${confidence.toFixed(1)}%)`
                : "No text detected"
            }`;

      return {
        text: finalText,
        metadata: contentMetadata,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const contentMetadata: OCRContentMetadata = {
        type: ContentType.RASTER_IMAGE,
        language: "unknown",
        encoding: "unknown",
        confidence: 0,
        hasText: false,
        wordCount: 0,
        characterCount: 0,
      };

      return {
        text: `Image OCR Error: ${errorMessage}`,
        metadata: contentMetadata,
      };
    }
  }

  /**
   * Extract text from an image file
   */
  async extractTextFromFile(
    filePath: string,
    options: {
      language?: string;
      confidence?: number;
    } = {}
  ): Promise<{
    text: string;
    metadata: OCRContentMetadata;
  }> {
    try {
      const buffer = fs.readFileSync(filePath);
      return await this.extractTextFromBuffer(buffer, options);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const contentMetadata: OCRContentMetadata = {
        type: ContentType.RASTER_IMAGE,
        language: "unknown",
        encoding: "unknown",
        confidence: 0,
        hasText: false,
        wordCount: 0,
        characterCount: 0,
      };

      return {
        text: `Image OCR Error: Failed to read file - ${errorMessage}`,
        metadata: contentMetadata,
      };
    }
  }

  /**
   * Check if an image format is supported for OCR
   */
  isSupportedImage(buffer: Buffer): boolean {
    // Check common image signatures
    const signatures = [
      Buffer.from([0xff, 0xd8, 0xff]), // JPEG
      Buffer.from([0x89, 0x50, 0x4e, 0x47]), // PNG
      Buffer.from([0x42, 0x4d]), // BMP
      Buffer.from([0x49, 0x49, 0x2a, 0x00]), // TIFF (little-endian)
      Buffer.from([0x4d, 0x4d, 0x00, 0x2a]), // TIFF (big-endian)
      Buffer.from([0x52, 0x49, 0x46, 0x46]), // WEBP (starts with RIFF)
    ];

    return signatures.some((signature) =>
      buffer.subarray(0, signature.length).equals(signature)
    );
  }

  /**
   * Detect language from OCR text (simple heuristic)
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
   * Clean up OCR worker
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * Get supported languages (basic list)
   */
  getSupportedLanguages(): string[] {
    return [
      "eng", // English
      "spa", // Spanish
      "fra", // French
      "deu", // German
      "ita", // Italian
      "por", // Portuguese
      "rus", // Russian
      "ara", // Arabic
      "chi_sim", // Chinese Simplified
      "jpn", // Japanese
    ];
  }
}
