import pdfParse from "pdf-parse";
import { PDFExtract } from "pdf.js-extract";
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
} from "../utils";
import { OCRProcessor } from "./ocr-processor";
import * as fs from "fs";

export interface EnhancedPDFMetadata extends ContentMetadata {
  pageCount: number;
  wordCount: number;
  characterCount: number;
  hasText: boolean;
  hasImages: boolean;
  imageCount: number;
  textExtractionMethod:
    | "pdf-parse"
    | "pdf.js-extract"
    | "hybrid"
    | "image-heavy-fallback";
  pdfMetadata?: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
  entities?: ExtractedEntity[];
  relationships?: EntityRelationship[];
  structure?: {
    headers: string[];
    paragraphs: number;
    hasTables: boolean;
    hasImages: boolean;
  };
  images?: Array<{
    pageNumber: number;
    width: number;
    height: number;
    ocrText?: string;
    ocrConfidence?: number;
  }>;
}

export class EnhancedPDFProcessor extends BaseContentProcessor {
  private entityExtractor: EnhancedEntityExtractor;
  private ocrProcessor: OCRProcessor;
  private pdfExtract: PDFExtract;

  constructor() {
    super("Enhanced PDF Processor", [ContentType.PDF]);
    this.entityExtractor = new EnhancedEntityExtractor();
    this.ocrProcessor = new OCRProcessor();
    this.pdfExtract = new PDFExtract();
  }

  /**
   * Extract text and images from a PDF buffer using multiple methods
   */
  async extractFromBuffer(
    buffer: Buffer,
    options?: ProcessorOptions
  ): Promise<ProcessorResult> {
    const { result, time } = await this.measureTime(async () => {
      try {
        console.log("🔍 Starting enhanced PDF processing...");

        // Try multiple extraction methods
        const extractionResults = await this.tryMultipleExtractionMethods(
          buffer,
          options
        );

        // Combine results from different methods
        const combinedText = this.combineExtractionResults(extractionResults);
        const hasText = combinedText.length > 0;
        const wordCount = this.countWords(combinedText);
        const characterCount = this.countCharacters(combinedText);

        // Get language from options or detect
        const language = options?.language || detectLanguage(combinedText);

        // Extract entities and relationships
        const entities = this.entityExtractor.extractEntities(combinedText);
        const relationships = this.entityExtractor.extractRelationships(
          combinedText,
          entities
        );

        // Analyze document structure
        const structure = this.analyzeDocumentStructure(combinedText);

        // Create enhanced metadata
        const metadata: EnhancedPDFMetadata = {
          type: ContentType.PDF,
          language,
          pageCount: extractionResults.pageCount,
          wordCount,
          characterCount,
          hasText,
          hasImages: extractionResults.hasImages,
          imageCount: extractionResults.imageCount,
          textExtractionMethod: extractionResults.method,
          pdfMetadata: extractionResults.pdfMetadata,
          entities,
          relationships,
          structure,
          images: extractionResults.images,
        };

        console.log(
          `✅ PDF processing complete: ${wordCount} words, ${extractionResults.imageCount} images`
        );

        return {
          success: true,
          text: combinedText,
          metadata,
          processingTime: 0, // Will be set after measureTime completes
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("❌ Enhanced PDF processing failed:", errorMessage);

        return {
          success: false,
          text: `PDF Document: Unable to extract text. Error: ${errorMessage}`,
          metadata: {
            type: ContentType.PDF,
            language: "unknown",
            pageCount: 0,
            wordCount: 0,
            characterCount: 0,
            hasText: false,
            hasImages: false,
            imageCount: 0,
            textExtractionMethod: "pdf-parse" as const,
          } as EnhancedPDFMetadata,
          processingTime: 0, // Will be set after measureTime completes
          error: errorMessage,
        };
      }
    });

    // Set the actual processing time
    result.processingTime = time;
    return result;
  }

  /**
   * Try multiple PDF extraction methods and return the best results
   */
  private async tryMultipleExtractionMethods(
    buffer: Buffer,
    options?: ProcessorOptions
  ): Promise<{
    text: string;
    pageCount: number;
    hasImages: boolean;
    imageCount: number;
    method: "pdf-parse" | "pdf.js-extract" | "hybrid" | "image-heavy-fallback";
    pdfMetadata?: any;
    images?: Array<{
      pageNumber: number;
      width: number;
      height: number;
      ocrText?: string;
      ocrConfidence?: number;
    }>;
  }> {
    let pdfParseResult: any = null;
    let pdfExtractResult: any = null;
    let images: any[] = [];

    // Method 1: Try pdf-parse (fast, good for text-heavy PDFs)
    try {
      console.log("📄 Trying pdf-parse method...");
      pdfParseResult = await pdfParse(buffer);
      console.log(
        `✅ pdf-parse successful: ${pdfParseResult.text.length} characters`
      );
    } catch (error) {
      console.log("⚠️ pdf-parse failed:", (error as Error).message);
    }

    // Method 2: Try pdf.js-extract (comprehensive, good for complex PDFs)
    try {
      console.log("🔧 Trying pdf.js-extract method...");

      // Write buffer to temporary file for pdf.js-extract
      const tempPath = `/tmp/temp_pdf_${Date.now()}.pdf`;
      fs.writeFileSync(tempPath, buffer);

      pdfExtractResult = await new Promise((resolve, reject) => {
        this.pdfExtract.extract(tempPath, {}, (err: any, data: any) => {
          // Clean up temp file
          try {
            fs.unlinkSync(tempPath);
          } catch (cleanupError) {
            console.warn("Failed to clean up temp file:", cleanupError);
          }

          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });

      console.log(
        `✅ pdf.js-extract successful: ${
          pdfExtractResult.pages?.length || 0
        } pages`
      );

      // Extract images and perform OCR
      if (pdfExtractResult.pages) {
        images = await this.extractAndProcessImages(pdfExtractResult.pages);
      }
    } catch (error) {
      console.log("⚠️ pdf.js-extract failed:", (error as Error).message);
    }

    // Check if this is an image-heavy PDF that needs special handling
    const shouldUseImageFallback = this.shouldUseImageHeavyFallback(
      buffer,
      pdfParseResult,
      pdfExtractResult
    );

    if (shouldUseImageFallback && options?.enableOCR) {
      console.log(
        "🖼️ Detected image-heavy PDF, using OCR fallback strategy..."
      );
      return await this.handleImageHeavyPDF(buffer, pdfParseResult, options);
    }

    // Determine the best method and combine results
    return this.selectBestExtractionResult(
      pdfParseResult,
      pdfExtractResult,
      images
    );
  }

  /**
   * Determine if PDF is image-heavy and should use OCR fallback
   */
  private shouldUseImageHeavyFallback(
    buffer: Buffer,
    pdfParseResult: any,
    pdfExtractResult: any
  ): boolean {
    const fileSize = buffer.length;
    const textLength = pdfParseResult?.text?.length || 0;
    const pageCount =
      pdfParseResult?.numpages || pdfExtractResult?.pages?.length || 1;

    // Calculate text density metrics
    const avgTextPerPage = textLength / pageCount;
    const fileSizeToTextRatio = fileSize / Math.max(textLength, 1);

    // Criteria for image-heavy PDF:
    // 1. Very low text density (< 50 chars per page on average)
    // 2. High file size to text ratio (> 10KB per character)
    // 3. Large file size (> 5MB) with minimal text (< 2000 chars)

    const isLowTextDensity = avgTextPerPage < 50;
    const isHighFileSizeRatio = fileSizeToTextRatio > 10 * 1024; // 10KB per char
    const isLargeFileMinimalText =
      fileSize > 5 * 1024 * 1024 && textLength < 2000; // 5MB, <2K chars

    const shouldUseFallback =
      isLowTextDensity && (isHighFileSizeRatio || isLargeFileMinimalText);

    if (shouldUseFallback) {
      console.log(`📊 Image-heavy PDF detected:`);
      console.log(`  📄 Pages: ${pageCount}`);
      console.log(`  📝 Text chars: ${textLength}`);
      console.log(`  📊 Avg text/page: ${avgTextPerPage.toFixed(1)}`);
      console.log(`  💾 File size: ${(fileSize / 1024 / 1024).toFixed(1)}MB`);
      console.log(
        `  📈 Size/text ratio: ${(fileSizeToTextRatio / 1024).toFixed(
          1
        )}KB/char`
      );
    }

    return shouldUseFallback;
  }

  /**
   * Handle image-heavy PDFs by generating placeholder content and suggesting OCR
   */
  private async handleImageHeavyPDF(
    buffer: Buffer,
    pdfParseResult: any,
    options?: ProcessorOptions
  ): Promise<{
    text: string;
    pageCount: number;
    hasImages: boolean;
    imageCount: number;
    method: "image-heavy-fallback";
    pdfMetadata?: any;
    images?: Array<{
      pageNumber: number;
      width: number;
      height: number;
      ocrText?: string;
      ocrConfidence?: number;
    }>;
  }> {
    const pageCount = pdfParseResult?.numpages || 1;
    const existingText = pdfParseResult?.text || "";

    // For now, create a structured placeholder that indicates this PDF needs OCR
    // In a production system, this is where you'd integrate with a service like:
    // - AWS Textract
    // - Google Cloud Document AI
    // - Azure Form Recognizer
    // - Or a custom PDF-to-image + OCR pipeline

    const placeholderText = this.generateImageHeavyPDFPlaceholder(
      pageCount,
      buffer.length,
      existingText
    );

    console.log("🔄 Generated structured placeholder for image-heavy PDF");
    console.log(`📝 Placeholder length: ${placeholderText.length} characters`);

    return {
      text: placeholderText,
      pageCount,
      hasImages: true,
      imageCount: pageCount, // Assume each page is an image
      method: "image-heavy-fallback",
      pdfMetadata: pdfParseResult?.info,
      images: Array.from({ length: pageCount }, (_, i) => ({
        pageNumber: i + 1,
        width: 0, // Unknown
        height: 0, // Unknown
        ocrText: `[Page ${i + 1} requires OCR processing]`,
        ocrConfidence: 0,
      })),
    };
  }

  /**
   * Generate a structured placeholder for image-heavy PDFs
   */
  private generateImageHeavyPDFPlaceholder(
    pageCount: number,
    fileSize: number,
    existingText: string
  ): string {
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(1);

    let placeholder = `# Image-Heavy PDF Document

**Document Type**: Visual/Image-based PDF
**Pages**: ${pageCount}
**File Size**: ${fileSizeMB}MB
**Processing Method**: Enhanced PDF Processor with Image-Heavy Fallback

## Content Summary
This PDF appears to be primarily image-based with minimal extractable text. The document likely contains:
- Visual presentations or slides
- Scanned documents
- Charts, diagrams, or infographics
- Images with embedded text

## Available Text Content
${existingText.trim() || "No directly extractable text found."}

## Processing Recommendations
To extract the full content from this document, consider:
1. **OCR Processing**: Use advanced OCR to extract text from images
2. **Visual Analysis**: Analyze charts, diagrams, and visual elements
3. **Layout Analysis**: Preserve document structure and formatting
4. **Manual Review**: Some content may require human interpretation

## Page Structure
`;

    // Add page-by-page placeholders
    for (let i = 1; i <= pageCount; i++) {
      placeholder += `### Page ${i}
[Visual content - requires OCR processing]

`;
    }

    placeholder += `
## Technical Details
- **Processing Engine**: Enhanced PDF Processor
- **Detection Method**: File size to text ratio analysis
- **Recommended OCR Engine**: Tesseract.js, AWS Textract, or Google Cloud Document AI
- **Status**: Placeholder content generated, full OCR processing recommended

---
*This content was generated by the Enhanced PDF Processor's image-heavy fallback system.*`;

    return placeholder;
  }

  /**
   * Extract images from PDF pages and perform OCR
   */
  private async extractAndProcessImages(pages: any[]): Promise<
    Array<{
      pageNumber: number;
      width: number;
      height: number;
      ocrText?: string;
      ocrConfidence?: number;
    }>
  > {
    const processedImages: Array<{
      pageNumber: number;
      width: number;
      height: number;
      ocrText?: string;
      ocrConfidence?: number;
    }> = [];

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];

      if (page.content && page.content.length > 0) {
        for (const item of page.content) {
          if (item.type === "image" && item.data) {
            try {
              console.log(`🖼️ Processing image on page ${pageIndex + 1}...`);

              // Convert base64 image data to buffer
              const imageBuffer = Buffer.from(item.data, "base64");

              // Perform OCR on the image
              const ocrResult = await this.ocrProcessor.extractTextFromBuffer(
                imageBuffer
              );

              processedImages.push({
                pageNumber: pageIndex + 1,
                width: item.width || 0,
                height: item.height || 0,
                ocrText: ocrResult.text,
                ocrConfidence: ocrResult.metadata.confidence,
              });

              console.log(
                `✅ OCR complete: ${ocrResult.text.length} characters extracted`
              );
            } catch (error) {
              console.warn(
                `⚠️ OCR failed for image on page ${pageIndex + 1}:`,
                (error as Error).message
              );

              processedImages.push({
                pageNumber: pageIndex + 1,
                width: item.width || 0,
                height: item.height || 0,
              });
            }
          }
        }
      }
    }

    return processedImages;
  }

  /**
   * Select the best extraction result from multiple methods
   */
  private selectBestExtractionResult(
    pdfParseResult: any,
    pdfExtractResult: any,
    images: any[]
  ): {
    text: string;
    pageCount: number;
    hasImages: boolean;
    imageCount: number;
    method: "pdf-parse" | "pdf.js-extract" | "hybrid";
    pdfMetadata?: any;
    images?: any[];
  } {
    let text = "";
    let pageCount = 0;
    let method: "pdf-parse" | "pdf.js-extract" | "hybrid" = "pdf-parse";
    let pdfMetadata: any = {};

    // Determine the best text extraction method
    const pdfParseTextLength = pdfParseResult?.text?.length || 0;
    const pdfExtractTextLength =
      pdfExtractResult?.pages?.reduce((total: number, page: any) => {
        return (
          total +
          (page.content?.reduce((pageTotal: number, item: any) => {
            return pageTotal + (item.str || "").length;
          }, 0) || 0)
        );
      }, 0) || 0;

    if (
      pdfParseTextLength > 100 &&
      pdfParseTextLength >= pdfExtractTextLength
    ) {
      // pdf-parse has good text content
      text = pdfParseResult.text;
      pageCount = pdfParseResult.numpages || 0;
      pdfMetadata = pdfParseResult.info || {};
      method = images.length > 0 ? "hybrid" : "pdf-parse";
    } else if (pdfExtractResult?.pages) {
      // Use pdf.js-extract text
      text = this.extractTextFromPdfJsPages(pdfExtractResult.pages);
      pageCount = pdfExtractResult.pages.length;
      method = images.length > 0 ? "hybrid" : "pdf.js-extract";
    } else if (pdfParseResult?.text) {
      // Fallback to pdf-parse even if text is limited
      text = pdfParseResult.text;
      pageCount = pdfParseResult.numpages || 0;
      pdfMetadata = pdfParseResult.info || {};
      method = images.length > 0 ? "hybrid" : "pdf-parse";
    }

    // Add OCR text from images
    const ocrText = images
      .filter((img) => img.ocrText && img.ocrText.length > 10)
      .map((img) => `[Image OCR from page ${img.pageNumber}]: ${img.ocrText}`)
      .join("\n\n");

    if (ocrText) {
      text = text ? `${text}\n\n${ocrText}` : ocrText;
      method = "hybrid";
    }

    return {
      text: text.trim(),
      pageCount,
      hasImages: images.length > 0,
      imageCount: images.length,
      method,
      pdfMetadata,
      images,
    };
  }

  /**
   * Extract text from pdf.js-extract pages
   */
  private extractTextFromPdfJsPages(pages: any[]): string {
    return pages
      .map((page, index) => {
        if (!page.content) return "";

        const pageText = page.content
          .filter((item: any) => item.str && item.str.trim())
          .map((item: any) => item.str)
          .join(" ");

        return pageText.trim();
      })
      .filter((pageText) => pageText.length > 0)
      .join("\n\n");
  }

  /**
   * Combine extraction results from multiple methods
   */
  private combineExtractionResults(extractionResults: any): string {
    return extractionResults.text || "";
  }

  /**
   * Analyze document structure
   */
  private analyzeDocumentStructure(text: string): {
    headers: string[];
    paragraphs: number;
    hasTables: boolean;
    hasImages: boolean;
  } {
    const lines = text.split("\n").filter((line) => line.trim());

    // Detect headers (lines that are short and likely to be titles)
    const headers = lines.filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed.length > 0 &&
        trimmed.length < 100 &&
        /^[A-Z]/.test(trimmed) &&
        !trimmed.endsWith(".")
      );
    });

    // Count paragraphs (groups of lines separated by empty lines)
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length;

    // Detect tables (look for common table patterns)
    const hasTables =
      /\|.*\|/.test(text) ||
      /\t.*\t/.test(text) ||
      text.includes("Table") ||
      /\d+\s+\d+\s+\d+/.test(text);

    // Detect image references
    const hasImages = /\[Image|\(Image|Figure \d+|Fig\. \d+/i.test(text);

    return {
      headers: headers.slice(0, 10), // Limit to first 10 headers
      paragraphs,
      hasTables,
      hasImages,
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
        `Failed to read PDF file: ${errorMessage}`,
        0
      );
    }
  }

  /**
   * Extract text from buffer (for compatibility with pipeline)
   */
  async extractTextFromBuffer(buffer: Buffer): Promise<ProcessorResult> {
    return await this.extractFromBuffer(buffer);
  }

  /**
   * Create an error result
   */
  private createErrorResult(
    message: string,
    processingTime: number
  ): ProcessorResult {
    return {
      success: false,
      text: `PDF Document: Unable to extract text. Error: ${message}`,
      metadata: {
        type: ContentType.PDF,
        language: "unknown",
        pageCount: 0,
        wordCount: 0,
        characterCount: 0,
        hasText: false,
        hasImages: false,
        imageCount: 0,
        textExtractionMethod: "pdf-parse" as const,
      } as EnhancedPDFMetadata,
      processingTime,
      error: message,
    };
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Count characters in text
   */
  private countCharacters(text: string): number {
    return text.length;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.ocrProcessor) {
      await this.ocrProcessor.cleanup();
    }
  }
}
