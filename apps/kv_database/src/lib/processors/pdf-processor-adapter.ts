/**
 * PDF Processor Adapter - Adapts the new PDFProcessingPipeline to the ContentProcessor interface
 * This maintains backward compatibility while using the new architecture
 */

import { ContentType } from "../../types/index";
import {
  BaseContentProcessor,
  ProcessorOptions,
  ProcessorResult,
} from "./base-processor";
import {
  PDFProcessingPipeline,
  PDFProcessingOptions,
} from "./pipelines/pdf-processing-pipeline";

export class PDFProcessorAdapter extends BaseContentProcessor {
  private pipeline: PDFProcessingPipeline;

  constructor() {
    super("PDF Processor", [ContentType.PDF]);
    this.pipeline = new PDFProcessingPipeline();
  }

  /**
   * Extract content from buffer using the new pipeline
   */
  async extractFromBuffer(
    buffer: Buffer,
    options?: ProcessorOptions
  ): Promise<ProcessorResult> {
    // Convert ProcessorOptions to PDFProcessingOptions
    const pdfOptions: PDFProcessingOptions = {
      ...options,
      enableOCR: options?.enableOCR,
      enableEntityAnalysis: true, // Default to true for backward compatibility
      enableQualityAnalysis: true, // Default to true for backward compatibility
    };

    return await this.pipeline.process(buffer, pdfOptions);
  }

  /**
   * Check if buffer is a valid PDF
   */
  canProcess(buffer: Buffer): boolean {
    // Check PDF signature
    const signature = buffer.subarray(0, 8);
    return signature.toString().startsWith("%PDF-");
  }
}
