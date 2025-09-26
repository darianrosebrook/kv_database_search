/**
 * PDF Text Extractor - Single purpose PDF text extraction
 * Replaces the text extraction logic from enhanced-pdf-processor.ts
 */

import pdfParse from "pdf-parse";
import { PDFExtract } from "pdf.js-extract";
import * as fs from "fs";
import { TextAnalysisUtils } from "../shared/text-analysis-utils";

export interface PDFTextExtractionResult {
  text: string;
  pageCount: number;
  method: "pdf-parse" | "pdf.js-extract" | "hybrid";
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
  confidence: number;
  processingTime: number;
}

export interface PDFExtractionOptions {
  preferredMethod?: "pdf-parse" | "pdf.js-extract" | "auto";
  fallbackOnFailure?: boolean;
  cleanText?: boolean;
}

export class PDFTextExtractor {
  private pdfExtract: PDFExtract;

  constructor() {
    this.pdfExtract = new PDFExtract();
  }

  /**
   * Extract text from PDF buffer using the best available method
   */
  async extractText(
    buffer: Buffer,
    options: PDFExtractionOptions = {}
  ): Promise<PDFTextExtractionResult> {
    const startTime = Date.now();
    const {
      preferredMethod = "auto",
      fallbackOnFailure = true,
      cleanText = true,
    } = options;

    let pdfParseResult = null;
    let pdfExtractResult = null;

    // Try pdf-parse method
    if (preferredMethod === "pdf-parse" || preferredMethod === "auto") {
      try {
        console.log("📄 Trying pdf-parse method...");
        pdfParseResult = await pdfParse(buffer);
        console.log(
          `✅ pdf-parse successful: ${pdfParseResult.numpages} pages, ${pdfParseResult.text.length} chars`
        );
      } catch (error) {
        console.log("⚠️ pdf-parse failed:", (error as Error).message);
        if (!fallbackOnFailure && preferredMethod === "pdf-parse") {
          throw error;
        }
      }
    }

    // Try pdf.js-extract method
    if (
      preferredMethod === "pdf.js-extract" ||
      preferredMethod === "auto" ||
      (!pdfParseResult && fallbackOnFailure)
    ) {
      try {
        console.log("🔧 Trying pdf.js-extract method...");

        // Write buffer to temporary file for pdf.js-extract
        const tempPath = `/tmp/temp_pdf_${Date.now()}.pdf`;
        fs.writeFileSync(tempPath, buffer);

        pdfExtractResult = await new Promise((resolve, reject) => {
          this.pdfExtract.extract(tempPath, {}, (err, data) => {
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
      } catch (error) {
        console.log("⚠️ pdf.js-extract failed:", (error as Error).message);
        if (!fallbackOnFailure && preferredMethod === "pdf.js-extract") {
          throw error;
        }
      }
    }

    // Select the best result
    const result = this.selectBestExtractionResult(
      pdfParseResult,
      pdfExtractResult
    );

    // Clean text if requested
    if (cleanText && result.text) {
      result.text = TextAnalysisUtils.cleanExtractedText(result.text);
    }

    // Calculate confidence
    const confidence = this.calculateExtractionConfidence(
      result,
      buffer.length
    );

    const processingTime = Date.now() - startTime;

    return {
      ...result,
      confidence,
      processingTime,
    };
  }

  /**
   * Check if a buffer contains a valid PDF
   */
  isValidPDF(buffer: Buffer): boolean {
    // Check PDF signature
    const signature = buffer.subarray(0, 8);
    return signature.toString().startsWith("%PDF-");
  }

  /**
   * Get basic PDF info without full text extraction
   */
  async getPDFInfo(buffer: Buffer): Promise<{
    pageCount: number;
    metadata?;
    isTextBased: boolean;
    estimatedTextLength: number;
  }> {
    try {
      const pdfData = await pdfParse(buffer, { max: 1 }); // Only parse first page for info

      return {
        pageCount: pdfData.numpages || 0,
        metadata: pdfData.info,
        isTextBased: (pdfData.text?.length || 0) > 50,
        estimatedTextLength:
          (pdfData.text?.length || 0) * (pdfData.numpages || 1),
      };
    } catch {
      return {
        pageCount: 0,
        isTextBased: false,
        estimatedTextLength: 0,
      };
    }
  }

  /**
   * Select the best extraction result from multiple methods
   */
  private selectBestExtractionResult(
    pdfParseResult,
    pdfExtractResult
  ): {
    text: string;
    pageCount: number;
    method: "pdf-parse" | "pdf.js-extract" | "hybrid";
    metadata?;
  } {
    let text = "";
    let pageCount = 0;
    let method: "pdf-parse" | "pdf.js-extract" | "hybrid" = "pdf-parse";
    let metadata = {};

    // Determine the best text extraction method
    const pdfParseTextLength = pdfParseResult?.text?.length || 0;
    const pdfExtractTextLength =
      pdfExtractResult?.pages?.reduce((total: number, page) => {
        return (
          total +
          (page.content?.reduce((pageTotal: number, item) => {
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
      metadata = pdfParseResult.info || {};
      method = "pdf-parse";
    } else if (pdfExtractResult?.pages) {
      // Use pdf.js-extract text
      text = this.extractTextFromPdfJsPages(pdfExtractResult.pages);
      pageCount = pdfExtractResult.pages.length;
      method = "pdf.js-extract";
    } else if (pdfParseResult?.text) {
      // Fallback to pdf-parse even if text is limited
      text = pdfParseResult.text;
      pageCount = pdfParseResult.numpages || 0;
      metadata = pdfParseResult.info || {};
      method = "pdf-parse";
    }

    return {
      text: text.trim(),
      pageCount,
      method,
      metadata,
    };
  }

  /**
   * Extract text from pdf.js-extract pages
   */
  private extractTextFromPdfJsPages(pages): string {
    const textParts: string[] = [];

    for (const page of pages) {
      if (page.content && page.content.length > 0) {
        const pageText = page.content
          .filter((item) => item.str && item.str.trim().length > 0)
          .map((item) => item.str)
          .join(" ");

        if (pageText.trim().length > 0) {
          textParts.push(pageText);
        }
      }
    }

    return textParts.join("\n\n");
  }

  /**
   * Calculate confidence in the extraction
   */
  private calculateExtractionConfidence(
    result: { text: string; pageCount: number; method: string },
    fileSize: number
  ): number {
    let confidence = 1.0;

    // Penalize very short extractions
    if (result.text.length < 100) confidence -= 0.4;
    else if (result.text.length < 500) confidence -= 0.2;

    // Check text-to-file-size ratio
    const textToSizeRatio = result.text.length / fileSize;
    if (textToSizeRatio < 0.001) confidence -= 0.3; // Very low text density

    // Method-specific confidence adjustments
    switch (result.method) {
      case "pdf-parse":
        confidence *= 0.95; // Generally reliable
        break;
      case "pdf.js-extract":
        confidence *= 0.9; // Good but can be complex
        break;
      case "hybrid":
        confidence *= 0.85; // Multiple methods, some uncertainty
        break;
    }

    // Page count sanity check
    if (result.pageCount > 0) {
      const avgTextPerPage = result.text.length / result.pageCount;
      if (avgTextPerPage < 50) confidence -= 0.2; // Very little text per page
    }

    return Math.max(0, Math.min(1, confidence));
  }
}
