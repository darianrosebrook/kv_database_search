/**
 * PDF Processing Pipeline - Orchestrates PDF processing using composition
 * Replaces the monolithic EnhancedPDFProcessor
 */

import { ContentType, ContentMetadata } from "../../../types/index";
import { ProcessorOptions, ProcessorResult } from "../base-processor";
import {
  PDFTextExtractor,
  PDFTextExtractionResult,
} from "../core/pdf-text-extractor";
import { ImageOCRExtractor } from "../core/image-ocr-extractor";
import {
  EntityAnalyzer,
  EntityAnalysisResult,
} from "../analysis/entity-analyzer";
import {
  PDFProcessingStrategyEngine,
  PDFProcessingStrategy,
} from "../strategies/pdf-processing-strategy";
import { QualityMetrics, QualityScore } from "../shared/quality-metrics";
import {
  TextAnalysisUtils,
  DocumentStructure,
} from "../shared/text-analysis-utils";

export interface PDFProcessingResult extends ProcessorResult {
  metadata: PDFContentMetadata;
}

export interface PDFContentMetadata extends ContentMetadata {
  pageCount: number;
  wordCount: number;
  characterCount: number;
  hasText: boolean;
  hasImages: boolean;
  imageCount: number;
  processingStrategy: PDFProcessingStrategy;
  textExtractionResult: PDFTextExtractionResult;
  ocrResults?: {
    combinedText: string;
    totalConfidence: number;
    imageCount: number;
  };
  entityAnalysis?: EntityAnalysisResult;
  qualityScore?: QualityScore;
  structure?: DocumentStructure;
  pdfMetadata?: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}

export interface PDFProcessingOptions extends ProcessorOptions {
  enableOCR?: boolean;
  enableEntityAnalysis?: boolean;
  enableQualityAnalysis?: boolean;
  forceStrategy?: PDFProcessingStrategy["approach"];
  ocrMinConfidence?: number;
}

export class PDFProcessingPipeline {
  private textExtractor: PDFTextExtractor;
  private ocrExtractor: ImageOCRExtractor;
  private entityAnalyzer: EntityAnalyzer;
  private strategyEngine: PDFProcessingStrategyEngine;

  constructor() {
    this.textExtractor = new PDFTextExtractor();
    this.ocrExtractor = new ImageOCRExtractor();
    this.entityAnalyzer = new EntityAnalyzer();
    this.strategyEngine = new PDFProcessingStrategyEngine();
  }

  /**
   * Process PDF using composition-based approach
   */
  async process(
    buffer: Buffer,
    options: PDFProcessingOptions = {}
  ): Promise<PDFProcessingResult> {
    const startTime = Date.now();

    try {
      console.log("🔍 Starting PDF processing pipeline...");

      // Step 1: Validate PDF
      if (!this.textExtractor.isValidPDF(buffer)) {
        throw new Error("Invalid PDF format");
      }

      // Step 2: Get basic PDF info
      const pdfInfo = await this.textExtractor.getPDFInfo(buffer);
      console.log(
        `📊 PDF Info: ${pdfInfo.pageCount} pages, text-based: ${pdfInfo.isTextBased}`
      );

      // Step 3: Determine processing strategy
      let strategy = this.strategyEngine.determineStrategy(buffer, pdfInfo);

      // Override strategy if forced
      if (options.forceStrategy) {
        strategy = { ...strategy, approach: options.forceStrategy };
        strategy.reasoning.push(`Strategy forced to: ${options.forceStrategy}`);
      }

      // Override individual options
      if (options.enableOCR !== undefined) {
        strategy.includeOCR = options.enableOCR;
      }
      if (options.enableEntityAnalysis !== undefined) {
        strategy.includeEntityAnalysis = options.enableEntityAnalysis;
      }
      if (options.enableQualityAnalysis !== undefined) {
        strategy.includeQualityAnalysis = options.enableQualityAnalysis;
      }

      console.log(`🎯 Processing strategy: ${strategy.approach}`);
      console.log(`📋 Strategy reasoning: ${strategy.reasoning.join(", ")}`);

      // Step 4: Extract text
      const textResult = await this.textExtractor.extractText(buffer, {
        preferredMethod: strategy.textExtractionMethod,
        fallbackOnFailure: true,
        cleanText: true,
      });

      console.log(
        `📝 Text extraction: ${textResult.text.length} characters using ${textResult.method}`
      );

      // Step 5: OCR processing if needed
      let ocrResults:
        | { combinedText: string; totalConfidence: number; imageCount: number }
        | undefined;
      let hasImages = false;
      let imageCount = 0;

      if (strategy.includeOCR) {
        console.log("🖼️ Starting OCR processing...");

        // For now, we'll use a simplified approach
        // In a full implementation, we'd extract images from the PDF pages
        // This is a placeholder that would need the actual PDF page extraction logic
        ocrResults = {
          combinedText: "",
          totalConfidence: 0,
          imageCount: 0,
        };

        console.log(
          `🔍 OCR complete: ${ocrResults.imageCount} images processed`
        );
      }

      // Step 6: Combine text results
      const combinedText = this.combineTextResults(
        textResult.text,
        ocrResults?.combinedText
      );
      const textMetrics = TextAnalysisUtils.getTextMetrics(
        combinedText,
        options.language
      );

      // Step 7: Analyze document structure
      const structure =
        TextAnalysisUtils.analyzeDocumentStructure(combinedText);

      // Step 8: Entity analysis if enabled
      let entityAnalysis: EntityAnalysisResult | undefined;
      if (strategy.includeEntityAnalysis && combinedText.length > 100) {
        console.log("🏷️ Starting entity analysis...");
        entityAnalysis = await this.entityAnalyzer.analyzeEntities(
          combinedText,
          {
            includeRelationships: true,
            includeClustering: combinedText.length > 2000,
            includeTopicSummary: true,
            minConfidence: 0.6,
          }
        );
        console.log(
          `🎯 Entity analysis: ${entityAnalysis.entities.length} entities, ${entityAnalysis.relationships.length} relationships`
        );
      }

      // Step 9: Quality analysis if enabled
      let qualityScore: QualityScore | undefined;
      if (strategy.includeQualityAnalysis) {
        console.log("📊 Starting quality analysis...");
        qualityScore = QualityMetrics.assessContentQuality(combinedText, {
          textExtractionMethod: textResult.method,
          ocrConfidence: ocrResults?.totalConfidence,
          pageCount: textResult.pageCount,
          hasImages,
          imageCount,
        });
        console.log(
          `✅ Quality score: ${(qualityScore.overall * 100).toFixed(1)}%`
        );
      }

      // Step 10: Validate strategy
      const strategyValidation = this.strategyEngine.validateStrategy(
        strategy,
        {
          textLength: combinedText.length,
          ocrTextLength: ocrResults?.combinedText.length,
          extractionConfidence: textResult.confidence,
          processingTime: Date.now() - startTime,
        }
      );

      if (!strategyValidation.isValid) {
        console.warn(
          "⚠️ Strategy validation failed:",
          strategyValidation.suggestedAdjustments.join(", ")
        );
      }

      // Step 11: Build final metadata
      const metadata: PDFContentMetadata = {
        type: ContentType.PDF,
        language: textMetrics.language,
        pageCount: textResult.pageCount,
        wordCount: textMetrics.wordCount,
        characterCount: textMetrics.characterCount,
        hasText: textMetrics.hasText,
        hasImages,
        imageCount,
        processingStrategy: strategy,
        textExtractionResult: textResult,
        ocrResults,
        entityAnalysis,
        qualityScore,
        structure,
        pdfMetadata: textResult.metadata,
      };

      const processingTime = Date.now() - startTime;
      console.log(`🎉 PDF processing complete in ${processingTime}ms`);

      return {
        success: true,
        text: combinedText,
        metadata,
        processingTime,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ PDF processing failed:", errorMessage);

      const processingTime = Date.now() - startTime;

      return {
        success: false,
        text: `PDF Document: Unable to process. Error: ${errorMessage}`,
        metadata: {
          type: ContentType.PDF,
          language: "unknown",
          pageCount: 0,
          wordCount: 0,
          characterCount: 0,
          hasText: false,
          hasImages: false,
          imageCount: 0,
          processingStrategy: {
            approach: "text-focused",
            includeOCR: false,
            includeEntityAnalysis: false,
            includeQualityAnalysis: false,
            textExtractionMethod: "pdf-parse",
            confidence: 0,
            reasoning: ["Processing failed"],
          },
          textExtractionResult: {
            text: "",
            pageCount: 0,
            method: "pdf-parse",
            confidence: 0,
            processingTime: 0,
          },
        } as PDFContentMetadata,
        processingTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Combine text from different extraction methods
   */
  private combineTextResults(mainText: string, ocrText?: string): string {
    if (!ocrText || ocrText.trim().length === 0) {
      return mainText;
    }

    if (!mainText || mainText.trim().length === 0) {
      return ocrText;
    }

    // Combine with clear separation
    return `${mainText}\n\n${ocrText}`;
  }

  /**
   * Get processing recommendations for similar files
   */
  getProcessingRecommendations(result: PDFProcessingResult): string[] {
    const recommendations: string[] = [];
    const metadata = result.metadata;

    // Strategy-based recommendations
    recommendations.push(
      ...this.strategyEngine.getOptimizationRecommendations(
        metadata.processingStrategy,
        {
          fileSize: 0, // Would need to pass this through
          pageCount: metadata.pageCount,
          estimatedTextLength: metadata.characterCount,
          isTextBased: metadata.hasText,
          textDensity: metadata.characterCount / metadata.pageCount,
          fileSizeToTextRatio: 0, // Would need to calculate
        }
      )
    );

    // Quality-based recommendations
    if (metadata.qualityScore && metadata.qualityScore.overall < 0.7) {
      recommendations.push(...metadata.qualityScore.recommendations);
    }

    // Entity analysis recommendations
    if (metadata.entityAnalysis && metadata.entityAnalysis.confidence < 0.6) {
      recommendations.push(
        "Entity extraction confidence is low - consider manual review"
      );
    }

    return recommendations;
  }
}
