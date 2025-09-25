import { createWorker, Worker } from "tesseract.js";
import { ContentType, ContentMetadata } from "../../types/index";
import {
  detectLanguage,
  EnhancedEntityExtractor,
  ExtractedEntity,
  EntityRelationship,
} from "../utils";
import * as fs from "fs";
import {
  ContentProcessor,
  ProcessorResult,
  ProcessorOptions,
} from "./base-processor";

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
  entities?: ExtractedEntity[];
  relationships?: EntityRelationship[];
  structure?: {
    headers: string[];
    paragraphs: number;
    hasLists: boolean;
    textQuality: "high" | "medium" | "low";
  };
}

export class OCRProcessor implements ContentProcessor {
  private worker: Worker | null = null;
  private entityExtractor: EnhancedEntityExtractor;

  constructor() {
    this.entityExtractor = new EnhancedEntityExtractor();
  }

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
      const rawText = result.data.text.trim();
      const confidence = result.data.confidence;

      // Enhanced text processing
      const enhancedText = this.enhanceOCRText(rawText);
      const words = enhancedText.split(/\s+/).filter((word) => word.length > 0);
      const hasText = enhancedText.length > 0 && words.length > 0;

      // Check if confidence meets minimum threshold
      const minConfidence = options.confidence || 30; // Default minimum confidence
      const isConfident = confidence >= minConfidence;

      // Extract entities and relationships
      const entities = this.entityExtractor.extractEntities(enhancedText);
      const relationships = this.entityExtractor.extractRelationships(
        enhancedText,
        entities
      );

      // Analyze document structure
      const structure = this.analyzeOCRStructure(enhancedText, confidence);

      const ocrMetadata: OCRMetadata = {
        confidence,
        processingTime,
        language: options.language || "eng",
        version: "tesseract.js",
      };

      const contentMetadata: OCRContentMetadata = {
        type: ContentType.RASTER_IMAGE,
        language: detectLanguage(enhancedText),
        encoding: "utf-8",
        confidence,
        hasText: hasText && isConfident,
        wordCount: words.length,
        characterCount: enhancedText.length,
        ocrMetadata,
        entities,
        relationships,
        structure,
      };

      // Return appropriate text based on confidence
      const finalText =
        isConfident && hasText
          ? enhancedText
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

  /**
   * Extract text and metadata from a file buffer
   */
  async extractFromBuffer(
    buffer: Buffer,
    options?: ProcessorOptions
  ): Promise<ProcessorResult> {
    // Convert buffer to temporary file path for processing
    const tempPath = `/tmp/ocr-${Date.now()}.png`;
    try {
      require("fs").writeFileSync(tempPath, buffer);
      return await this.extractFromFile(tempPath, options);
    } finally {
      // Clean up temp file
      try {
        require("fs").unlinkSync(tempPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Extract text and metadata from a file path
   */
  async extractFromFile(
    filePath: string,
    options?: ProcessorOptions
  ): Promise<ProcessorResult> {
    const result = await this.extractTextFromFile(filePath);
    return {
      text: result.text,
      metadata: result.metadata,
      success: true,
      processingTime: Date.now() - Date.now(), // TODO: Calculate actual processing time
      confidence: result.metadata.confidence,
    };
  }

  /**
   * Check if this processor supports a given content type
   */
  supportsContentType(contentType: ContentType): boolean {
    return contentType === ContentType.RASTER_IMAGE;
  }

  /**
   * Get the supported content types for this processor
   */
  getSupportedContentTypes(): ContentType[] {
    return [ContentType.RASTER_IMAGE];
  }

  /**
   * Get the processor name/identifier
   */
  getProcessorName(): string {
    return "ocr-processor";
  }

  /**
   * Enhanced text cleaning for OCR results
   */
  private enhanceOCRText(text: string): string {
    return (
      text
        // Fix common OCR artifacts
        .replace(/\|/g, "I") // Fix pipe characters that should be I
        .replace(/0/g, "O") // Fix zero characters that should be O
        .replace(/([a-z])\s+([a-z])/g, "$1 $2") // Keep spaces between letters but normalize
        .replace(/\s+/g, " ") // Normalize remaining whitespace
        .replace(/\n{3,}/g, "\n\n") // Preserve paragraph breaks
        // Clean up any remaining artifacts
        .replace(/\0/g, "")
        .trim()
    );
  }

  /**
   * Analyze OCR text structure and quality
   */
  private analyzeOCRStructure(
    text: string,
    confidence: number
  ): {
    headers: string[];
    paragraphs: number;
    hasLists: boolean;
    textQuality: "high" | "medium" | "low";
  } {
    const headers: string[] = [];
    let paragraphs = 0;
    let hasLists = false;

    // Determine text quality based on confidence and content
    const textQuality: "high" | "medium" | "low" =
      confidence >= 80 ? "high" : confidence >= 50 ? "medium" : "low";

    // Extract potential headers (short lines with meaningful content)
    const lines = text.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 0 && trimmed.length < 100) {
        const isHeader =
          trimmed.length > 5 &&
          !/[.!?]$/.test(trimmed) &&
          (trimmed === trimmed.toUpperCase() || /^[A-Z][^.!?]*$/.test(trimmed));

        if (isHeader) {
          headers.push(trimmed);
        }
      }
    }

    // Count paragraphs
    paragraphs = text
      .split(/\n\s*\n/)
      .filter((block) => block.trim().length > 0).length;

    // Detect lists (numbered or bulleted)
    const listPattern = /^[1-9]+\.|^\*|^\-|^•/m;
    hasLists = listPattern.test(text);

    // Also check for common OCR list artifacts
    if (!hasLists) {
      const ocrListPattern = /^\d+\.|^\* |^- |^•/m;
      hasLists = ocrListPattern.test(text);
    }

    return { headers, paragraphs, hasLists, textQuality };
  }
}
