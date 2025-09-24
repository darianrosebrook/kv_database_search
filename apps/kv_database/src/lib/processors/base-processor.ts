import { ContentType, ContentMetadata } from "../../types/index";
import { createHash } from "../utils";

/**
 * Base interface for all content processors
 */
export interface ContentProcessor {
  /**
   * Extract text and metadata from a file buffer
   */
  extractFromBuffer(
    buffer: Buffer,
    options?: ProcessorOptions
  ): Promise<ProcessorResult>;

  /**
   * Extract text and metadata from a file path
   */
  extractFromFile(
    filePath: string,
    options?: ProcessorOptions
  ): Promise<ProcessorResult>;

  /**
   * Check if this processor supports a given content type
   */
  supportsContentType(contentType: ContentType): boolean;

  /**
   * Get the supported content types for this processor
   */
  getSupportedContentTypes(): ContentType[];

  /**
   * Get the processor name/identifier
   */
  getProcessorName(): string;
}

/**
 * Common processor options
 */
export interface ProcessorOptions {
  language?: string;
  confidence?: number;
  extractMetadata?: boolean;
  skipValidation?: boolean;
}

/**
 * Standard processor result structure
 */
export interface ProcessorResult {
  text: string;
  metadata: ContentMetadata;
  success: boolean;
  errors?: string[];
  processingTime: number;
  confidence?: number; // For processors that can provide confidence scores
}

/**
 * Base class for content processors with common functionality
 */
export abstract class BaseContentProcessor implements ContentProcessor {
  protected readonly processorName: string;
  protected readonly supportedTypes: ContentType[];

  constructor(processorName: string, supportedTypes: ContentType[]) {
    this.processorName = processorName;
    this.supportedTypes = supportedTypes;
  }

  /**
   * Extract text and metadata from a file buffer
   */
  abstract extractFromBuffer(
    buffer: Buffer,
    options?: ProcessorOptions
  ): Promise<ProcessorResult>;

  /**
   * Extract text and metadata from a file path
   */
  async extractFromFile(
    filePath: string,
    options?: ProcessorOptions
  ): Promise<ProcessorResult> {
    try {
      const fs = await import("fs");
      const buffer = fs.readFileSync(filePath);
      return await this.extractFromBuffer(buffer, options);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        `Failed to read file: ${errorMessage}`,
        options?.language || "unknown"
      );
    }
  }

  /**
   * Check if this processor supports a given content type
   */
  supportsContentType(contentType: ContentType): boolean {
    return this.supportedTypes.includes(contentType);
  }

  /**
   * Get the supported content types for this processor
   */
  getSupportedContentTypes(): ContentType[] {
    return [...this.supportedTypes];
  }

  /**
   * Get the processor name/identifier
   */
  getProcessorName(): string {
    return this.processorName;
  }

  /**
   * Create a successful processor result
   */
  protected createSuccessResult(
    text: string,
    metadata: Partial<ContentMetadata>,
    processingTime: number,
    language?: string
  ): ProcessorResult {
    const fullMetadata: ContentMetadata = {
      type: metadata.type || ContentType.UNKNOWN,
      language: language || metadata.language || "unknown",
      encoding: metadata.encoding || "utf-8",
      ...metadata,
    };

    return {
      text,
      metadata: fullMetadata,
      success: true,
      processingTime,
    };
  }

  /**
   * Create an error processor result
   */
  protected createErrorResult(
    errorMessage: string,
    language: string = "unknown"
  ): ProcessorResult {
    const errorMetadata: ContentMetadata = {
      type: ContentType.UNKNOWN,
      language,
      encoding: "unknown",
    };

    return {
      text: errorMessage,
      metadata: errorMetadata,
      success: false,
      errors: [errorMessage],
      processingTime: 0,
    };
  }

  /**
   * Generate a file ID for content metadata
   */
  protected generateFileId(filePath: string): string {
    const hash = createHash("md5", filePath);
    return `file_${hash}`;
  }

  /**
   * Generate a checksum for content
   */
  protected generateChecksum(buffer: Buffer): string {
    return createHash("md5", buffer);
  }

  /**
   * Common text cleaning for extracted content
   */
  protected cleanExtractedText(text: string): string {
    return text
      .replace(/\0/g, "") // Remove null characters
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\t/g, " ") // Replace tabs with spaces
      .replace(/[ \u00A0]+/g, " ") // Normalize whitespace
      .trim();
  }

  /**
   * Count words in text for metadata
   */
  protected countWords(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  /**
   * Count characters in text for metadata
   */
  protected countCharacters(text: string): number {
    return text.length;
  }

  /**
   * Validate processing options
   */
  protected validateOptions(options?: ProcessorOptions): ProcessorOptions {
    return {
      language: options?.language || "en",
      confidence: options?.confidence || 0.5,
      extractMetadata: options?.extractMetadata ?? true,
      skipValidation: options?.skipValidation ?? false,
      ...options,
    };
  }

  /**
   * Measure processing time for a function
   */
  protected async measureTime<T>(
    fn: () => Promise<T>
  ): Promise<{ result: T; time: number }> {
    const start = Date.now();
    const result = await fn();
    const time = Date.now() - start;
    return { result, time };
  }
}
