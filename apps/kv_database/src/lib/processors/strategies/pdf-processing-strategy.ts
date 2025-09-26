/**
 * PDF Processing Strategy - Determines the best approach for processing PDFs
 * Replaces the decision logic scattered across enhanced processors
 */

export interface PDFProcessingStrategy {
  approach: "text-focused" | "image-heavy" | "hybrid" | "ocr-fallback";
  includeOCR: boolean;
  includeEntityAnalysis: boolean;
  includeQualityAnalysis: boolean;
  textExtractionMethod: "pdf-parse" | "pdf.js-extract" | "auto";
  confidence: number;
  reasoning: string[];
}

export interface PDFCharacteristics {
  fileSize: number;
  pageCount: number;
  estimatedTextLength: number;
  isTextBased: boolean;
  textDensity: number; // characters per page
  fileSizeToTextRatio: number; // bytes per character
}

export class PDFProcessingStrategyEngine {
  /**
   * Determine the best processing strategy for a PDF
   */
  determineStrategy(
    buffer: Buffer,
    pdfInfo?: {
      pageCount: number;
      isTextBased: boolean;
      estimatedTextLength: number;
    }
  ): PDFProcessingStrategy {
    const characteristics = this.analyzePDFCharacteristics(buffer, pdfInfo);
    return this.selectStrategy(characteristics);
  }

  /**
   * Analyze PDF characteristics to inform strategy decision
   */
  private analyzePDFCharacteristics(
    buffer: Buffer,
    pdfInfo?: {
      pageCount: number;
      isTextBased: boolean;
      estimatedTextLength: number;
    }
  ): PDFCharacteristics {
    const fileSize = buffer.length;
    const pageCount = pdfInfo?.pageCount || 1;
    const estimatedTextLength = pdfInfo?.estimatedTextLength || 0;
    const isTextBased = pdfInfo?.isTextBased || false;

    const textDensity = estimatedTextLength / pageCount;
    const fileSizeToTextRatio =
      estimatedTextLength > 0 ? fileSize / estimatedTextLength : fileSize;

    return {
      fileSize,
      pageCount,
      estimatedTextLength,
      isTextBased,
      textDensity,
      fileSizeToTextRatio,
    };
  }

  /**
   * Select the appropriate processing strategy based on characteristics
   */
  private selectStrategy(
    characteristics: PDFCharacteristics
  ): PDFProcessingStrategy {
    const reasoning: string[] = [];
    let approach: PDFProcessingStrategy["approach"];
    let includeOCR = false;
    let includeEntityAnalysis = true;
    let includeQualityAnalysis = true;
    let textExtractionMethod: PDFProcessingStrategy["textExtractionMethod"] =
      "auto";
    let confidence = 0.8;

    // Analyze text density
    const isLowTextDensity = characteristics.textDensity < 50;
    const isHighFileSizeRatio = characteristics.fileSizeToTextRatio > 10 * 1024; // 10KB per char
    const isLargeFileMinimalText =
      characteristics.fileSize > 5 * 1024 * 1024 &&
      characteristics.estimatedTextLength < 2000; // 5MB, <2K chars

    // Decision logic
    if (isLowTextDensity && (isHighFileSizeRatio || isLargeFileMinimalText)) {
      // Image-heavy PDF
      approach = "image-heavy";
      includeOCR = true;
      textExtractionMethod = "pdf.js-extract"; // Better for extracting images
      confidence = 0.7;

      reasoning.push("Low text density detected");
      reasoning.push(
        `Text density: ${characteristics.textDensity.toFixed(1)} chars/page`
      );
      reasoning.push(
        `File size to text ratio: ${(
          characteristics.fileSizeToTextRatio / 1024
        ).toFixed(1)}KB/char`
      );

      if (isLargeFileMinimalText) {
        reasoning.push("Large file with minimal text - likely image-heavy");
      }
    } else if (
      !characteristics.isTextBased ||
      characteristics.estimatedTextLength < 100
    ) {
      // OCR fallback needed
      approach = "ocr-fallback";
      includeOCR = true;
      includeEntityAnalysis = false; // OCR text often lower quality
      textExtractionMethod = "pdf.js-extract";
      confidence = 0.6;

      reasoning.push("No extractable text detected");
      reasoning.push("Will rely primarily on OCR");
    } else if (
      characteristics.textDensity > 200 &&
      characteristics.fileSizeToTextRatio < 5 * 1024
    ) {
      // Text-focused PDF
      approach = "text-focused";
      includeOCR = false;
      textExtractionMethod = "pdf-parse"; // Faster for text-heavy docs
      confidence = 0.9;

      reasoning.push("High text density detected");
      reasoning.push(
        `Text density: ${characteristics.textDensity.toFixed(1)} chars/page`
      );
      reasoning.push("Optimizing for text extraction");
    } else {
      // Hybrid approach - has text but might have images too
      approach = "hybrid";
      includeOCR = true;
      textExtractionMethod = "auto"; // Let extractor decide
      confidence = 0.8;

      reasoning.push("Mixed content detected");
      reasoning.push("Using hybrid approach with text extraction and OCR");
    }

    // Adjust entity analysis based on expected text quality
    if (
      approach === "ocr-fallback" ||
      (approach === "image-heavy" && characteristics.estimatedTextLength < 500)
    ) {
      includeEntityAnalysis = false;
      reasoning.push(
        "Disabling entity analysis due to expected low text quality"
      );
    }

    // Adjust quality analysis for very small files
    if (characteristics.fileSize < 100 * 1024) {
      // Less than 100KB
      includeQualityAnalysis = false;
      reasoning.push("Disabling quality analysis for small file");
    }

    return {
      approach,
      includeOCR,
      includeEntityAnalysis,
      includeQualityAnalysis,
      textExtractionMethod,
      confidence,
      reasoning,
    };
  }

  /**
   * Get strategy recommendations for optimization
   */
  getOptimizationRecommendations(
    strategy: PDFProcessingStrategy,
    characteristics: PDFCharacteristics
  ): string[] {
    const recommendations: string[] = [];

    if (strategy.approach === "image-heavy") {
      recommendations.push(
        "Consider using a dedicated OCR service for better accuracy"
      );
      recommendations.push("Image preprocessing might improve OCR results");
    }

    if (
      strategy.approach === "text-focused" &&
      characteristics.pageCount > 100
    ) {
      recommendations.push(
        "Consider chunking large documents for better performance"
      );
    }

    if (strategy.confidence < 0.7) {
      recommendations.push(
        "Manual review recommended due to low confidence in processing strategy"
      );
    }

    if (characteristics.fileSize > 50 * 1024 * 1024) {
      // 50MB
      recommendations.push(
        "Consider splitting very large files for better processing performance"
      );
    }

    return recommendations;
  }

  /**
   * Validate strategy against actual results and suggest adjustments
   */
  validateStrategy(
    strategy: PDFProcessingStrategy,
    actualResults: {
      textLength: number;
      ocrTextLength?: number;
      extractionConfidence: number;
      processingTime: number;
    }
  ): {
    isValid: boolean;
    suggestedAdjustments: string[];
    confidence: number;
  } {
    const suggestedAdjustments: string[] = [];
    let isValid = true;
    let confidence = strategy.confidence;

    // Check if text extraction was successful as expected
    if (
      strategy.approach === "text-focused" &&
      actualResults.textLength < 100
    ) {
      isValid = false;
      suggestedAdjustments.push(
        "Text-focused strategy failed - consider hybrid approach"
      );
      confidence -= 0.3;
    }

    // Check if OCR was beneficial
    if (
      strategy.includeOCR &&
      (!actualResults.ocrTextLength || actualResults.ocrTextLength < 50)
    ) {
      suggestedAdjustments.push(
        "OCR produced minimal results - consider disabling for similar files"
      );
      confidence -= 0.1;
    }

    // Check extraction confidence
    if (actualResults.extractionConfidence < 0.5) {
      isValid = false;
      suggestedAdjustments.push(
        "Low extraction confidence - consider alternative processing method"
      );
      confidence -= 0.2;
    }

    // Check processing time efficiency
    if (actualResults.processingTime > 30000) {
      // 30 seconds
      suggestedAdjustments.push(
        "Processing time excessive - consider optimization or chunking"
      );
    }

    return {
      isValid,
      suggestedAdjustments,
      confidence: Math.max(0, confidence),
    };
  }
}
