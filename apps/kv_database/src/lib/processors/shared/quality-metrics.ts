/**
 * Quality assessment utilities for content processing
 * Extracted from duplicated quality assessment logic
 */

export interface QualityScore {
  overall: number; // 0-1, higher is better
  confidence: number; // 0-1, confidence in the score
  breakdown: {
    textQuality: number;
    extractionQuality: number;
    contentRichness: number;
    structuralIntegrity: number;
  };
  issues: string[];
  recommendations: string[];
}

export interface ProcessingMetrics {
  processingTime: number;
  methodUsed: string;
  fallbacksUsed: string[];
  successRate: number;
}

export class QualityMetrics {
  /**
   * Calculate confidence score based on extraction metadata
   */
  static calculateExtractionConfidence(metadata: {
    textLength?: number;
    extractionMethod?: string;
    hasErrors?: boolean;
    ocrConfidence?: number;
    fallbackUsed?: boolean;
  }): number {
    let confidence = 1.0;

    // Penalize short text extractions
    if (metadata.textLength !== undefined) {
      if (metadata.textLength < 100) confidence -= 0.3;
      else if (metadata.textLength < 500) confidence -= 0.1;
    }

    // Penalize fallback methods
    if (metadata.fallbackUsed) confidence -= 0.2;

    // Factor in OCR confidence if available
    if (metadata.ocrConfidence !== undefined) {
      confidence = confidence * 0.7 + metadata.ocrConfidence * 0.3;
    }

    // Penalize extraction errors
    if (metadata.hasErrors) confidence -= 0.4;

    // Method-specific adjustments
    switch (metadata.extractionMethod) {
      case "pdf-parse":
        confidence *= 0.95; // Generally reliable
        break;
      case "pdf.js-extract":
        confidence *= 0.9; // Good but can be complex
        break;
      case "hybrid":
        confidence *= 0.85; // Multiple methods, some uncertainty
        break;
      case "image-heavy-fallback":
        confidence *= 0.7; // OCR-based, less reliable
        break;
      case "ocr":
        confidence *= 0.75; // OCR inherently less reliable
        break;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Assess overall content quality
   */
  static assessContentQuality(
    text: string,
    metadata: any = {},
    processingMetrics?: ProcessingMetrics
  ): QualityScore {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Text quality assessment
    const textQuality = this.assessTextQuality(text);

    // Extraction quality assessment
    const extractionQuality = this.calculateExtractionConfidence({
      textLength: text.length,
      extractionMethod: metadata.textExtractionMethod || metadata.method,
      hasErrors: !!metadata.error,
      ocrConfidence: metadata.ocrConfidence,
      fallbackUsed: metadata.textExtractionMethod?.includes("fallback"),
    });

    // Content richness assessment
    const contentRichness = this.assessContentRichness(text, metadata);

    // Structural integrity assessment
    const structuralIntegrity = this.assessStructuralIntegrity(text, metadata);

    // Combine scores
    const overall =
      textQuality * 0.3 +
      extractionQuality * 0.3 +
      contentRichness * 0.2 +
      structuralIntegrity * 0.2;

    // Generate recommendations
    if (textQuality < 0.7) {
      recommendations.push(
        "Consider re-processing with different extraction method"
      );
    }
    if (extractionQuality < 0.6) {
      recommendations.push(
        "Text extraction quality is low, manual review recommended"
      );
    }
    if (contentRichness < 0.5) {
      recommendations.push(
        "Content appears sparse, verify source document quality"
      );
    }

    // Calculate confidence in our assessment
    const confidence = Math.min(
      extractionQuality + 0.2, // Higher extraction quality = more confident assessment
      overall + 0.1 // Higher overall quality = more confident
    );

    return {
      overall,
      confidence: Math.max(0, Math.min(1, confidence)),
      breakdown: {
        textQuality,
        extractionQuality,
        contentRichness,
        structuralIntegrity,
      },
      issues,
      recommendations,
    };
  }

  /**
   * Assess text quality specifically
   */
  private static assessTextQuality(text: string): number {
    if (!text || text.trim().length === 0) return 0;

    let score = 1.0;

    // Check for common OCR/extraction artifacts
    const artifactPatterns = [
      /[^\w\s]{5,}/, // Long sequences of special characters
      /\s{5,}/, // Excessive whitespace
      /(.)\1{10,}/, // Repeated characters
      /\n{5,}/, // Excessive line breaks
    ];

    for (const pattern of artifactPatterns) {
      if (pattern.test(text)) {
        score -= 0.1;
      }
    }

    // Check text coherence
    const words = text.split(/\s+/);
    const avgWordLength =
      words.reduce((sum, word) => sum + word.length, 0) / words.length;

    if (avgWordLength < 2 || avgWordLength > 15) {
      score -= 0.2; // Unusual word lengths might indicate extraction issues
    }

    // Check for reasonable sentence structure
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length > 0) {
      const avgSentenceLength =
        sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) /
        sentences.length;

      if (avgSentenceLength < 3 || avgSentenceLength > 50) {
        score -= 0.15; // Unusual sentence lengths
      }
    }

    return Math.max(0, score);
  }

  /**
   * Assess content richness (how much useful information is present)
   */
  private static assessContentRichness(text: string, metadata: any): number {
    if (!text) return 0;

    let score = 0.5; // Base score

    // Length bonus
    if (text.length > 1000) score += 0.2;
    else if (text.length > 500) score += 0.1;

    // Entity richness
    if (metadata.entities && metadata.entities.length > 0) {
      score += Math.min(0.2, metadata.entities.length * 0.02);
    }

    // Structural elements
    if (metadata.structure) {
      if (metadata.structure.headers?.length > 0) score += 0.1;
      if (metadata.structure.paragraphs > 3) score += 0.1;
      if (metadata.structure.hasTables) score += 0.05;
    }

    // Multi-modal content
    if (metadata.hasImages && metadata.imageCount > 0) {
      score += Math.min(0.1, metadata.imageCount * 0.02);
    }

    return Math.min(1, score);
  }

  /**
   * Assess structural integrity of extracted content
   */
  private static assessStructuralIntegrity(
    text: string,
    metadata: any
  ): number {
    if (!text) return 0;

    let score = 1.0;

    // Check for broken formatting
    const brokenFormatPatterns = [
      /\w{50,}/, // Very long words (might be concatenated)
      /[A-Z]{20,}/, // Long sequences of capitals
      /\d{20,}/, // Long sequences of numbers
    ];

    for (const pattern of brokenFormatPatterns) {
      if (pattern.test(text)) {
        score -= 0.2;
      }
    }

    // Check for reasonable paragraph structure
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    if (paragraphs.length === 1 && text.length > 2000) {
      score -= 0.2; // Long text without paragraph breaks
    }

    // Check for metadata consistency
    if (metadata.pageCount && metadata.wordCount) {
      const wordsPerPage = metadata.wordCount / metadata.pageCount;
      if (wordsPerPage < 50 || wordsPerPage > 2000) {
        score -= 0.1; // Unusual word density might indicate extraction issues
      }
    }

    return Math.max(0, score);
  }

  /**
   * Generate processing quality report
   */
  static generateQualityReport(
    text: string,
    metadata: any,
    processingMetrics?: ProcessingMetrics
  ): {
    quality: QualityScore;
    summary: string;
    actionRequired: boolean;
  } {
    const quality = this.assessContentQuality(
      text,
      metadata,
      processingMetrics
    );

    let summary = `Quality Score: ${(quality.overall * 100).toFixed(1)}%`;

    if (quality.overall >= 0.8) {
      summary += " - Excellent quality extraction";
    } else if (quality.overall >= 0.6) {
      summary += " - Good quality extraction";
    } else if (quality.overall >= 0.4) {
      summary += " - Fair quality extraction, review recommended";
    } else {
      summary += " - Poor quality extraction, manual review required";
    }

    const actionRequired = quality.overall < 0.6 || quality.confidence < 0.5;

    return {
      quality,
      summary,
      actionRequired,
    };
  }
}
