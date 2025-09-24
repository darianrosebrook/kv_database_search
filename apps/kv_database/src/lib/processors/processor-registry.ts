import { ContentType, ContentMetadata } from "../../types/index";
import {
  ContentProcessor,
  ProcessorOptions,
  ProcessorResult,
} from "./base-processor";
import { PDFProcessor } from "./pdf-processor";
import { OCRProcessor } from "./ocr-processor";
import { OfficeProcessor } from "./office-processor";
import { SpeechProcessor } from "./speech-processor";

/**
 * Registry for managing all content processors
 */
export class ContentProcessorRegistry {
  private processors: Map<ContentType, ContentProcessor> = new Map();
  private initialized = false;

  constructor() {
    this.registerDefaultProcessors();
  }

  /**
   * Register a processor for one or more content types
   */
  registerProcessor(processor: ContentProcessor): void {
    const supportedTypes = processor.getSupportedContentTypes();
    for (const contentType of supportedTypes) {
      this.processors.set(contentType, processor);
    }
  }

  /**
   * Get a processor for a specific content type
   */
  getProcessor(contentType: ContentType): ContentProcessor | undefined {
    return this.processors.get(contentType);
  }

  /**
   * Process content with the appropriate processor
   */
  async processContent(
    buffer: Buffer,
    contentType: ContentType,
    options?: ProcessorOptions
  ): Promise<ProcessorResult> {
    const processor = this.getProcessor(contentType);
    if (!processor) {
      return this.createUnsupportedResult(contentType);
    }

    return await processor.extractFromBuffer(buffer, options);
  }

  /**
   * Process a file with the appropriate processor
   */
  async processFile(
    filePath: string,
    contentType: ContentType,
    options?: ProcessorOptions
  ): Promise<ProcessorResult> {
    const processor = this.getProcessor(contentType);
    if (!processor) {
      return this.createUnsupportedResult(contentType);
    }

    return await processor.extractFromFile(filePath, options);
  }

  /**
   * Get all supported content types
   */
  getSupportedContentTypes(): ContentType[] {
    return Array.from(this.processors.keys());
  }

  /**
   * Check if a content type is supported
   */
  isContentTypeSupported(contentType: ContentType): boolean {
    return this.processors.has(contentType);
  }

  /**
   * Get processor information
   */
  getProcessorInfo(): Array<{
    contentType: ContentType;
    processorName: string;
    supported: boolean;
  }> {
    const info: Array<{
      contentType: ContentType;
      processorName: string;
      supported: boolean;
    }> = [];

    // Check all known content types
    for (const contentType of Object.values(ContentType)) {
      const processor = this.processors.get(contentType);
      info.push({
        contentType,
        processorName: processor?.getProcessorName() || "None",
        supported: processor !== undefined,
      });
    }

    return info;
  }

  /**
   * Initialize all processors that require initialization
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    const initPromises: Promise<void>[] = [];

    for (const processor of this.processors.values()) {
      // Check if processor has an initialize method
      if (typeof (processor as any).initialize === "function") {
        initPromises.push((processor as any).initialize());
      }
    }

    await Promise.all(initPromises);
    this.initialized = true;
  }

  /**
   * Cleanup all processors that require cleanup
   */
  async cleanup(): Promise<void> {
    const cleanupPromises: Promise<void>[] = [];

    for (const processor of this.processors.values()) {
      // Check if processor has a cleanup method
      if (typeof (processor as any).cleanup === "function") {
        cleanupPromises.push((processor as any).cleanup());
      }
    }

    await Promise.all(cleanupPromises);
  }

  /**
   * Register all default processors
   */
  private registerDefaultProcessors(): void {
    this.registerProcessor(new PDFProcessor());
    this.registerProcessor(new OCRProcessor());
    this.registerProcessor(new OfficeProcessor());
    this.registerProcessor(new SpeechProcessor());
  }

  /**
   * Create a result for unsupported content types
   */
  private createUnsupportedResult(contentType: ContentType): ProcessorResult {
    const errorMessage = `${contentType} content type is not supported`;

    const errorMetadata: ContentMetadata = {
      type: contentType,
      language: "unknown",
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
}

/**
 * Singleton instance of the processor registry
 */
export const contentProcessorRegistry = new ContentProcessorRegistry();
