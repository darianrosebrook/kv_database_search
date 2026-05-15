import { DocumentChunk, DocumentMetadata } from "../types/index";
import { ImageLinkExtractor } from "./image-link-extractor";
import { ImagePathResolver } from "./image-path-resolver";
import { OCRProcessor } from "./processors/ocr-processor";
import { ImageClassificationProcessor } from "./processors/image-classification-processor";
import { LoggerFactory } from "./shared/logger";
import { generateDeterministicId } from "./utils";

/**
 * Image processing utilities for Obsidian documents
 * @darianrosebrook
 */
export class ObsidianImageProcessor {
  private logger = LoggerFactory.create("ObsidianImageProcessor");
  private imageLinkExtractor: ImageLinkExtractor;
  private imagePathResolver: ImagePathResolver;
  private ocrProcessor: OCRProcessor;
  private imageClassificationProcessor: ImageClassificationProcessor;

  constructor(vaultPath: string) {
    this.imageLinkExtractor = new ImageLinkExtractor();
    this.imagePathResolver = new ImagePathResolver(vaultPath);
    this.ocrProcessor = new OCRProcessor();
    this.imageClassificationProcessor = new ImageClassificationProcessor();
  }

  /**
   * Process embedded images in an Obsidian document
   */
  async processEmbeddedImages(
    obsidianFile: {
      fileName: string;
      filePath: string;
      vaultPath: string;
      content: string;
      tags?: string[];
      frontmatter?: Record<string, unknown>;
    },
    options: {
      enableImageProcessing?: boolean;
      enableImageClassification?: boolean;
      maxImagesPerFile?: number;
      maxImageSize?: number;
      ocrLanguage?: string;
      imageProcessingTimeout?: number;
      minClassificationConfidence?: number;
      maxObjects?: number;
      includeVisualFeatures?: boolean;
    } = {}
  ): Promise<{
    filesWithImages: number;
    totalImages: number;
    processedImages: number;
    failedImages: number;
    extractedTextLength: number;
    averageConfidence: number;
    sceneDescriptionsGenerated: number;
    averageClassificationConfidence: number;
  }> {
    const {
      enableImageProcessing = true,
      enableImageClassification = false,
      maxImagesPerFile = 10,
      maxImageSize = 5 * 1024 * 1024, // 5MB
      ocrLanguage = "eng",
      minClassificationConfidence = 0.7,
      maxObjects = 10,
      includeVisualFeatures = false,
    } = options;

    if (!enableImageProcessing) {
      return {
        filesWithImages: 0,
        totalImages: 0,
        processedImages: 0,
        failedImages: 0,
        extractedTextLength: 0,
        averageConfidence: 0,
        sceneDescriptionsGenerated: 0,
        averageClassificationConfidence: 0,
      };
    }

    // Extract image links from content
    const imageLinks = this.imageLinkExtractor.extractImageLinks(
      obsidianFile.content
    );

    if (imageLinks.length === 0) {
      return {
        filesWithImages: 0,
        totalImages: 0,
        processedImages: 0,
        failedImages: 0,
        extractedTextLength: 0,
        averageConfidence: 0,
        sceneDescriptionsGenerated: 0,
        averageClassificationConfidence: 0,
      };
    }

    this.logger.info(
      `Processing ${imageLinks.length} images in file: ${obsidianFile.fileName}`
    );

    const results = {
      filesWithImages: 1,
      totalImages: imageLinks.length,
      processedImages: 0,
      failedImages: 0,
      extractedTextLength: 0,
      averageConfidence: 0,
      sceneDescriptionsGenerated: 0,
      averageClassificationConfidence: 0,
    };

    const confidenceScores: number[] = [];

    // Resolve all image paths once (resolver works in batch)
    const resolution = this.imagePathResolver.resolvePaths(
      imageLinks.slice(0, maxImagesPerFile).map((l) => l.path),
      obsidianFile.filePath
    );
    const resolvedByOriginal = new Map(
      resolution.resolved.map((r) => [r.originalPath, r.resolvedPath])
    );

    // Process each image
    for (let i = 0; i < Math.min(imageLinks.length, maxImagesPerFile); i++) {
      try {
        const imageLink = imageLinks[i];
        const imagePath = resolvedByOriginal.get(imageLink.path);
        if (!imagePath) {
          this.logger.warn(`Image path not resolved: ${imageLink.path}`);
          results.failedImages++;
          continue;
        }

        // Check if image exists and is within size limits
        const fs = await import("fs");
        if (!fs.existsSync(imagePath)) {
          this.logger.warn(`Image not found: ${imagePath}`);
          results.failedImages++;
          continue;
        }

        const stats = fs.statSync(imagePath);
        if (stats.size > maxImageSize) {
          this.logger.warn(
            `Image too large: ${imagePath} (${stats.size} bytes)`
          );
          results.failedImages++;
          continue;
        }

        // Process image with OCR
        const ocrResult = await this.ocrProcessor.extractFromFile(imagePath, {
          language: ocrLanguage,
        });

        if (ocrResult.success && ocrResult.text) {
          results.processedImages++;
          results.extractedTextLength += ocrResult.text.length;

          if (ocrResult.confidence) {
            confidenceScores.push(ocrResult.confidence);
          }
        }

        // Process image with classification if enabled
        if (enableImageClassification) {
          const classificationResult =
            await this.imageClassificationProcessor.extractFromFile(imagePath, {
              minConfidence: minClassificationConfidence,
              maxObjects,
              includeVisualFeatures,
            });

          if (classificationResult.success) {
            results.sceneDescriptionsGenerated++;
            if (classificationResult.confidence) {
              results.averageClassificationConfidence +=
                classificationResult.confidence;
            }
          }
        }
      } catch (error) {
        this.logger.error(`Failed to process image ${i + 1}`, error as Error);
        results.failedImages++;
      }
    }

    // Calculate averages
    if (confidenceScores.length > 0) {
      results.averageConfidence =
        confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length;
    }

    if (results.sceneDescriptionsGenerated > 0) {
      results.averageClassificationConfidence /=
        results.sceneDescriptionsGenerated;
    }

    this.logger.info(
      `Image processing complete for ${obsidianFile.fileName}: ${results.processedImages} processed, ${results.failedImages} failed`
    );

    return results;
  }

  /**
   * Create image-related chunks for search indexing
   */
  async createImageChunks(
    obsidianFile: {
      fileName: string;
      filePath: string;
      vaultPath: string;
      content: string;
      tags?: string[];
      frontmatter?: Record<string, unknown>;
    },
    imageProcessingResults: {
      filesWithImages: number;
      totalImages: number;
      processedImages: number;
      failedImages: number;
      extractedTextLength: number;
      averageConfidence: number;
      sceneDescriptionsGenerated: number;
      averageClassificationConfidence: number;
    }
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];

    if (imageProcessingResults.processedImages === 0) {
      return chunks;
    }

    // Create a summary chunk for image content
    const imageSummaryContent = this.generateImageSummary(
      obsidianFile,
      imageProcessingResults
    );

    const chunkId = generateDeterministicId(`${obsidianFile.fileName}#images`);

    const metadata: DocumentMetadata = {
      uri: `obsidian://${obsidianFile.fileName}#images`,
      section: "images",
      breadcrumbs: [obsidianFile.fileName, "images"],
      contentType: "image_summary",
      language: "en",
      encoding: "utf-8",
      obsidianFile: {
        fileName: obsidianFile.fileName,
        filePath: obsidianFile.filePath,
        vaultPath: obsidianFile.vaultPath,
        tags: obsidianFile.tags || [],
        frontmatter: obsidianFile.frontmatter || {},
        chunkIndex: 0,
        chunkPosition: 0,
        chunkSize: imageSummaryContent.length,
        totalChunks: 1,
      },
    };

    chunks.push({
      id: chunkId,
      text: imageSummaryContent,
      meta: metadata,
      embedding: undefined, // Will be set by embedding service
    });

    return chunks;
  }

  /**
   * Generate a summary of image processing results
   */
  private generateImageSummary(
    obsidianFile: {
      fileName: string;
      filePath: string;
      vaultPath: string;
      content: string;
      tags?: string[];
      frontmatter?: Record<string, unknown>;
    },
    results: {
      filesWithImages: number;
      totalImages: number;
      processedImages: number;
      failedImages: number;
      extractedTextLength: number;
      averageConfidence: number;
      sceneDescriptionsGenerated: number;
      averageClassificationConfidence: number;
    }
  ): string {
    const summaryParts = [
      `## Image Content Summary`,
      `File: ${obsidianFile.fileName}`,
      ``,
      `**Image Statistics:**`,
      `- Total images found: ${results.totalImages}`,
      `- Successfully processed: ${results.processedImages}`,
      `- Failed to process: ${results.failedImages}`,
      ``,
    ];

    if (results.extractedTextLength > 0) {
      summaryParts.push(
        `**OCR Results:**`,
        `- Extracted text length: ${results.extractedTextLength} characters`,
        `- Average confidence: ${(results.averageConfidence * 100).toFixed(
          1
        )}%`,
        ``
      );
    }

    if (results.sceneDescriptionsGenerated > 0) {
      summaryParts.push(
        `**Image Classification:**`,
        `- Scene descriptions generated: ${results.sceneDescriptionsGenerated}`,
        `- Average classification confidence: ${(
          results.averageClassificationConfidence * 100
        ).toFixed(1)}%`,
        ``
      );
    }

    summaryParts.push(
      `**Related Tags:** ${obsidianFile.tags?.join(", ") || "None"}`
    );

    return summaryParts.join("\n");
  }
}
