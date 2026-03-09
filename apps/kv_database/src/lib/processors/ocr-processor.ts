import { execFile } from "child_process";
import { promisify } from "util";
import { ContentType, ContentMetadata } from "../../types/index";
import {
  detectLanguage,
  EntityExtractor,
  ExtractedEntity,
  EntityRelationship,
} from "../utils";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  ContentProcessor,
  ProcessorResult,
  ProcessorOptions,
} from "./base-processor";

const execFileAsync = promisify(execFile);

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
  private tesseractPath: string | null = null;
  private entityExtractor: EntityExtractor;
  private static readonly RECOGNIZE_TIMEOUT_MS = 30_000; // 30s per image

  constructor() {
    this.entityExtractor = new EntityExtractor();
  }

  /**
   * Find and validate the native tesseract binary
   */
  async initialize(): Promise<void> {
    if (this.tesseractPath) return;

    const possiblePaths = [
      "/opt/homebrew/bin/tesseract",  // Homebrew on Apple Silicon
      "/usr/local/bin/tesseract",     // Homebrew on Intel
      "/usr/bin/tesseract",           // Linux
      "tesseract",                    // System PATH
    ];

    for (const p of possiblePaths) {
      try {
        await execFileAsync(p, ["--version"], { timeout: 5000 });
        this.tesseractPath = p;
        return;
      } catch {
        continue;
      }
    }

    throw new Error(
      "Native tesseract not found. Install with: brew install tesseract"
    );
  }

  /**
   * Run native tesseract on an image file and return the raw text + confidence
   */
  private async runTesseract(
    imagePath: string,
    language: string = "eng"
  ): Promise<{ text: string; confidence: number }> {
    if (!this.tesseractPath) {
      await this.initialize();
    }

    // tesseract <input> stdout -l <lang> --psm 3 tsv  -> gives confidence per word
    // For simplicity: get text from stdout, get confidence from tsv output
    const tsvOutputBase = path.join(
      os.tmpdir(),
      `ocr-tsv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    );

    try {
      // Run tesseract to get text
      const { stdout: text } = await execFileAsync(
        this.tesseractPath!,
        [imagePath, "stdout", "-l", language, "--psm", "3"],
        { timeout: OCRProcessor.RECOGNIZE_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 }
      );

      // Run tesseract to get confidence via TSV
      let confidence = 0;
      try {
        await execFileAsync(
          this.tesseractPath!,
          [imagePath, tsvOutputBase, "-l", language, "--psm", "3", "tsv"],
          { timeout: OCRProcessor.RECOGNIZE_TIMEOUT_MS }
        );

        const tsvPath = `${tsvOutputBase}.tsv`;
        if (fs.existsSync(tsvPath)) {
          const tsvContent = fs.readFileSync(tsvPath, "utf-8");
          const lines = tsvContent.split("\n").slice(1); // skip header
          const confidences: number[] = [];
          for (const line of lines) {
            const cols = line.split("\t");
            // TSV format: level, page_num, block_num, par_num, line_num, word_num, left, top, width, height, conf, text
            if (cols.length >= 12) {
              const conf = parseFloat(cols[10]);
              if (!isNaN(conf) && conf >= 0) {
                confidences.push(conf);
              }
            }
          }
          if (confidences.length > 0) {
            confidence =
              confidences.reduce((a, b) => a + b, 0) / confidences.length;
          }
          fs.unlinkSync(tsvPath);
        }
      } catch {
        // Confidence extraction is best-effort
      }

      return { text: text.trim(), confidence };
    } catch (error) {
      if (error instanceof Error && error.message.includes("timed out")) {
        throw new Error(
          `OCR timed out after ${(OCRProcessor.RECOGNIZE_TIMEOUT_MS / 1000).toFixed(0)}s`
        );
      }
      throw error;
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
    // Write buffer to temp file for native tesseract
    const tempPath = path.join(
      os.tmpdir(),
      `ocr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`
    );

    try {
      fs.writeFileSync(tempPath, buffer);

      const startTime = Date.now();
      const language = options.language || "eng";

      const result = await this.runTesseract(tempPath, language);

      const processingTime = Date.now() - startTime;
      const rawText = result.text;
      const confidence = result.confidence;

      // Enhanced text processing
      const enhancedText = this.enhanceOCRText(rawText);
      const words = enhancedText
        .split(/\s+/)
        .filter((word) => word.length > 0);
      const hasText = enhancedText.length > 0 && words.length > 0;

      // Check if confidence meets minimum threshold
      const minConfidence = options.confidence || 50;
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
        language,
        version: "tesseract-native",
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
    } finally {
      try {
        fs.unlinkSync(tempPath);
      } catch {
        // ignore cleanup errors
      }
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
    processingTime: number;
  }> {
    try {
      const startTime = Date.now();
      const buffer = fs.readFileSync(filePath);
      const result = await this.extractTextFromBuffer(buffer, options);
      const processingTime = Date.now() - startTime;

      return {
        text: result.text,
        metadata: result.metadata,
        processingTime,
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
        text: `Image OCR Error: Failed to read file - ${errorMessage}`,
        metadata: contentMetadata,
        processingTime: 0,
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
   * Clean up (no-op for native tesseract — no persistent worker)
   */
  async terminate(): Promise<void> {
    // Native tesseract has no persistent state to clean up
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
    _options?: ProcessorOptions
  ): Promise<ProcessorResult> {
    const result = await this.extractTextFromBuffer(buffer);
    return {
      text: result.text,
      metadata: result.metadata,
      success: true,
      processingTime: result.metadata.ocrMetadata?.processingTime || 0,
      confidence: result.metadata.confidence,
    };
  }

  /**
   * Extract text and metadata from a file path
   */
  async extractFromFile(
    filePath: string,
    _options?: ProcessorOptions
  ): Promise<ProcessorResult> {
    const result = await this.extractTextFromFile(filePath);
    return {
      text: result.text,
      metadata: result.metadata,
      success: true,
      processingTime: result.processingTime,
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
    let result = text
      // Fix common OCR artifacts
      .replace(/\|/g, "") // Remove pipe characters (OCR artifacts)
      .replace(/\0/g, ""); // Remove null characters

    // Normalize whitespace but preserve newlines
    result = result
      .replace(/ {2,}/g, " ") // Normalize multiple spaces to single space
      .replace(/\t+/g, " ") // Convert tabs to spaces
      .replace(/\n{3,}/g, "\n\n") // Preserve paragraph breaks (max 2 newlines)
      .trim();

    // Filter out lines that are predominantly noise
    const lines = result.split("\n");
    const cleanedLines = lines.filter((line) => {
      const trimmed = line.trim();
      if (trimmed.length === 0) return true; // preserve blank lines for structure

      // Reject lines that are mostly non-alphanumeric characters
      const alphanumCount = (trimmed.match(/[a-zA-Z0-9]/g) || []).length;
      const ratio = alphanumCount / trimmed.length;
      if (ratio < 0.5 && trimmed.length > 3) return false;

      // Reject lines dominated by single-character "words" (OCR fragments)
      const words = trimmed.split(/\s+/);
      const singleCharWords = words.filter(
        (w) => w.length === 1 && !/^[aAI]$/.test(w)
      );
      if (words.length > 2 && singleCharWords.length / words.length > 0.5)
        return false;

      return true;
    });

    return cleanedLines.join("\n").trim();
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
          (trimmed === trimmed.toUpperCase() ||
            /^[A-Z][^.!?]*$/.test(trimmed));

        if (isHeader) {
          headers.push(trimmed);
        }
      }
    }

    // Count paragraphs
    paragraphs = text
      .split(/\n\s*\n/)
      .filter((block) => block.trim().replace(/\0/g, "").length > 0).length;

    // Detect lists (numbered or bulleted)
    const listPattern = /^\s*[1-9]+\.|\s*\*|\s*-|\s*•/gm;
    hasLists = listPattern.test(text);

    // Also check for common OCR list artifacts
    if (!hasLists) {
      const ocrListPattern = /^\s*\d+\.|\s*\* |\s*- |\s*•/gm;
      hasLists = ocrListPattern.test(text);
    }

    return { headers, paragraphs, hasLists, textQuality };
  }
}
