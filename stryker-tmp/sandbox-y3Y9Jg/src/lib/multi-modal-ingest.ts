// @ts-nocheck
import { ObsidianDatabase } from "./database.js";
import { ObsidianEmbeddingService } from "./embeddings.js";
import {
  MultiModalContentDetector,
  UniversalMetadataExtractor,
  UniversalMetadata,
  ContentType,
} from "./multi-modal.js";
import { PDFProcessor } from "./processors/pdf-processor.js";
import { OCRProcessor } from "./processors/ocr-processor.js";
import { OfficeProcessor } from "./processors/office-processor.js";
import { SpeechProcessor } from "./processors/speech-processor.js";
import { DocumentChunk, DocumentMetadata } from "../types/index.js";
import { cleanMarkdown } from "./utils.js";
import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";

export interface MultiModalIngestionConfig {
  batchSize?: number;
  rateLimitMs?: number;
  skipExisting?: boolean;
  includePatterns?: string[];
  excludePatterns?: string[];
  enableOCR?: boolean;
  enableSpeechToText?: boolean;
  maxFileSize?: number; // in bytes
}

export interface MultiModalIngestionResult {
  totalFiles: number;
  processedFiles: number;
  skippedFiles: number;
  failedFiles: number;
  totalChunks: number;
  processedChunks: number;
  errors: string[];
  contentTypeStats: Record<ContentType, number>;
}

/**
 * Multi-modal content ingestion pipeline
 * Extends the existing ingestion system to handle various file types
 */
export class MultiModalIngestionPipeline {
  private db: ObsidianDatabase;
  private embeddings: ObsidianEmbeddingService;
  private contentDetector: MultiModalContentDetector;
  private metadataExtractor: UniversalMetadataExtractor;
  private pdfProcessor: PDFProcessor;
  private ocrProcessor: OCRProcessor;
  private officeProcessor: OfficeProcessor;
  private speechProcessor: SpeechProcessor;

  constructor(
    database: ObsidianDatabase,
    embeddingService: ObsidianEmbeddingService
  ) {
    this.db = database;
    this.embeddings = embeddingService;
    this.contentDetector = new MultiModalContentDetector();
    this.pdfProcessor = new PDFProcessor();
    this.ocrProcessor = new OCRProcessor();
    this.officeProcessor = new OfficeProcessor();
    this.speechProcessor = new SpeechProcessor();
    this.metadataExtractor = new UniversalMetadataExtractor(
      this.contentDetector
    );
  }

  async ingestFiles(
    filePaths: string[],
    config: MultiModalIngestionConfig = {}
  ): Promise<MultiModalIngestionResult> {
    const {
      batchSize = 5,
      rateLimitMs = 200,
      skipExisting = true,
      maxFileSize = 50 * 1024 * 1024, // 50MB default
    } = config;

    console.log(`🚀 Starting multi-modal ingestion: ${filePaths.length} files`);

    let processedFiles = 0;
    let skippedFiles = 0;
    let failedFiles = 0;
    let totalChunks = 0;
    let processedChunks = 0;
    const errors: string[] = [];
    const contentTypeStats: Record<ContentType, number> = {} as Record<
      ContentType,
      number
    >;

    // Initialize stats
    Object.values(ContentType).forEach((type) => {
      contentTypeStats[type] = 0;
    });

    // Process files in batches
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      console.log(
        `⚙️  Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          filePaths.length / batchSize
        )}`
      );

      try {
        const batchResults = await this.processBatch(batch, {
          skipExisting,
          maxFileSize,
          ...config,
        });

        processedFiles += batchResults.processedFiles;
        skippedFiles += batchResults.skippedFiles;
        failedFiles += batchResults.failedFiles;
        totalChunks += batchResults.totalChunks;
        processedChunks += batchResults.processedChunks;
        errors.push(...batchResults.errors);

        // Update content type stats
        Object.entries(batchResults.contentTypeStats).forEach(
          ([type, count]) => {
            contentTypeStats[type as ContentType] += count;
          }
        );

        // Rate limiting
        if (i + batchSize < filePaths.length) {
          await new Promise((resolve) => setTimeout(resolve, rateLimitMs));
        }
      } catch (error) {
        const errorMsg = `Batch ${
          Math.floor(i / batchSize) + 1
        } failed: ${error}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
        failedFiles += batch.length;
      }
    }

    const result: MultiModalIngestionResult = {
      totalFiles: filePaths.length,
      processedFiles,
      skippedFiles,
      failedFiles,
      totalChunks,
      processedChunks,
      errors,
      contentTypeStats,
    };

    console.log(`✅ Multi-modal ingestion complete:`, result);
    return result;
  }

  private async processBatch(
    filePaths: string[],
    config: MultiModalIngestionConfig
  ): Promise<{
    processedFiles: number;
    skippedFiles: number;
    failedFiles: number;
    totalChunks: number;
    processedChunks: number;
    errors: string[];
    contentTypeStats: Record<ContentType, number>;
  }> {
    let processedFiles = 0;
    let skippedFiles = 0;
    let failedFiles = 0;
    let totalChunks = 0;
    let processedChunks = 0;
    const errors: string[] = [];
    const contentTypeStats: Record<ContentType, number> = {} as Record<
      ContentType,
      number
    >;

    // Initialize stats
    Object.values(ContentType).forEach((type) => {
      contentTypeStats[type] = 0;
    });

    for (const filePath of filePaths) {
      try {
        console.log(`📖 Processing: ${path.basename(filePath)}`);

        // Check file size
        const stats = fs.statSync(filePath);
        if (stats.size > (config.maxFileSize || 50 * 1024 * 1024)) {
          console.log(
            `⏭️  Skipping large file: ${path.basename(filePath)} (${
              stats.size
            } bytes)`
          );
          skippedFiles++;
          continue;
        }

        // Extract universal metadata
        const metadata = await this.metadataExtractor.extractMetadata(filePath);

        // Update content type stats
        contentTypeStats[metadata.content.type]++;

        // Skip if processing failed
        if (!metadata.processing.success) {
          console.log(
            `⏭️  Skipping failed processing: ${path.basename(filePath)}`
          );
          failedFiles++;
          continue;
        }

        // Generate chunks from the file
        const chunks = await this.chunkMultiModalFile(metadata);

        totalChunks += chunks.length;

        // Process each chunk
        for (const chunk of chunks) {
          try {
            // Check if chunk already exists
            if (config.skipExisting) {
              const existing = await this.db.getChunkById(chunk.id);
              if (existing) {
                console.log(
                  `⏭️  Skipping existing chunk: ${chunk.id.slice(0, 8)}...`
                );
                continue;
              }
            }

            console.log(
              `🔮 Embedding chunk: ${chunk.id.slice(0, 8)}... (${
                chunk.text.length
              } chars)`
            );

            // Generate embedding
            const embeddingResult = await this.embeddings.embedWithStrategy(
              chunk.text,
              this.mapContentTypeToStrategy(metadata.content.type),
              "knowledge-base"
            );

            // Store in database
            await this.db.upsertChunk({
              ...chunk,
              embedding: embeddingResult.embedding,
            });

            processedChunks++;
          } catch (error) {
            console.error(`❌ Failed to process chunk ${chunk.id}: ${error}`);
            errors.push(`Chunk ${chunk.id}: ${error}`);
          }
        }

        processedFiles++;
      } catch (error) {
        console.error(`❌ Failed to process file ${filePath}: ${error}`);
        errors.push(`File ${filePath}: ${error}`);
        failedFiles++;
      }
    }

    return {
      processedFiles,
      skippedFiles,
      failedFiles,
      totalChunks,
      processedChunks,
      errors,
      contentTypeStats,
    };
  }

  private async chunkMultiModalFile(
    metadata: UniversalMetadata
  ): Promise<DocumentChunk[]> {
    const filePath = metadata.file.path;
    const buffer = fs.readFileSync(filePath);

    // Base metadata for chunks
    const baseMetadata: DocumentMetadata = {
      uri: `file://${filePath}`,
      section: metadata.file.name,
      breadcrumbs: this.generateBreadcrumbs(filePath),
      contentType: this.mapContentType(metadata.content.type),
      sourceType: "multi-modal",
      sourceDocumentId: metadata.file.name,
      lang: metadata.content.language || "en",
      acl: "public",
      updatedAt: metadata.file.modifiedAt,
      createdAt: metadata.file.createdAt,
      chunkIndex: 0,
      chunkCount: 1,
      // Enhanced multi-modal metadata
      multiModalFile: {
        fileId: metadata.file.id,
        contentType: metadata.content.type,
        mimeType: metadata.file.mimeType,
        checksum: metadata.file.checksum,
        quality: metadata.quality,
        processing: metadata.processing,
      },
    };

    // Generate chunks based on content type
    switch (metadata.content.type) {
      case ContentType.MARKDOWN:
      case ContentType.PLAIN_TEXT:
        return await this.chunkTextFile(buffer, baseMetadata, metadata);

      case ContentType.PDF:
        return await this.chunkPDFFile(buffer, baseMetadata, metadata);

      case ContentType.OFFICE_DOC:
      case ContentType.OFFICE_SHEET:
      case ContentType.OFFICE_PRESENTATION:
        return await this.chunkOfficeFile(buffer, baseMetadata, metadata);

      case ContentType.RASTER_IMAGE:
      case ContentType.VECTOR_IMAGE:
        return await this.chunkImageFile(buffer, baseMetadata, metadata);

      case ContentType.AUDIO:
        return await this.chunkAudioFile(buffer, baseMetadata, metadata);

      case ContentType.VIDEO:
        return await this.chunkVideoFile(buffer, baseMetadata, metadata);

      case ContentType.JSON:
      case ContentType.XML:
      case ContentType.CSV:
        return await this.chunkStructuredFile(buffer, baseMetadata, metadata);

      default:
        // For unsupported types, create a single chunk with metadata
        return [this.createMetadataOnlyChunk(baseMetadata, metadata)];
    }
  }

  private async chunkTextFile(
    buffer: Buffer,
    baseMetadata: DocumentMetadata,
    metadata: UniversalMetadata,
    preExtractedText?: string
  ): Promise<DocumentChunk[]> {
    const text = preExtractedText || buffer.toString("utf8");
    const cleanedText = cleanMarkdown(text);

    // Simple chunking by paragraphs or size
    const chunks: DocumentChunk[] = [];
    const paragraphs = cleanedText
      .split("\n\n")
      .filter((p) => p.trim().length > 0);
    const maxChunkSize = 800;

    let currentChunk = "";
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      if (
        (currentChunk + paragraph).length > maxChunkSize &&
        currentChunk.length > 0
      ) {
        // Create chunk
        chunks.push({
          id: this.generateChunkId(metadata.file.id, chunkIndex),
          text: currentChunk.trim(),
          meta: {
            ...baseMetadata,
            section: `${baseMetadata.section} (Part ${chunkIndex + 1})`,
            chunkIndex,
            chunkCount: Math.ceil(cleanedText.length / maxChunkSize),
          },
        });

        currentChunk = paragraph;
        chunkIndex++;
      } else {
        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
      }
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({
        id: this.generateChunkId(metadata.file.id, chunkIndex),
        text: currentChunk.trim(),
        meta: {
          ...baseMetadata,
          section: `${baseMetadata.section} (Part ${chunkIndex + 1})`,
          chunkIndex,
          chunkCount: chunkIndex + 1,
        },
      });
    }

    return chunks;
  }

  private async chunkPDFFile(
    buffer: Buffer,
    baseMetadata: DocumentMetadata,
    metadata: UniversalMetadata
  ): Promise<DocumentChunk[]> {
    try {
      // Extract text content from PDF using the PDF processor
      const pdfResult = await this.pdfProcessor.extractTextFromBuffer(buffer);

      // If PDF has extractable text, chunk it like regular text
      if (pdfResult.metadata.hasText && pdfResult.text.length > 0) {
        return await this.chunkTextFile(
          buffer,
          baseMetadata,
          metadata,
          pdfResult.text
        );
      }

      // If no extractable text, create a metadata-only chunk
      const chunk: DocumentChunk = {
        id: this.generateChunkId(metadata.file.id, 0),
        text:
          `PDF Document: ${metadata.file.name}\n` +
          `Type: ${metadata.content.type}\n` +
          `Pages: ${pdfResult.metadata.pageCount || "Unknown"}\n` +
          `Has Text: ${pdfResult.metadata.hasText ? "Yes" : "No"}\n` +
          `Word Count: ${pdfResult.metadata.wordCount || 0}\n` +
          `Author: ${pdfResult.metadata.pdfMetadata?.author || "Unknown"}\n` +
          `Title: ${pdfResult.metadata.pdfMetadata?.title || "Unknown"}`,
        meta: {
          ...baseMetadata,
          chunkIndex: 0,
          chunkCount: 1,
        },
      };

      return [chunk];
    } catch (error) {
      // Fallback for PDF processing errors
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const chunk: DocumentChunk = {
        id: this.generateChunkId(metadata.file.id, 0),
        text: `PDF Document: ${metadata.file.name}\nType: ${metadata.content.type}\nError: ${errorMessage}`,
        meta: {
          ...baseMetadata,
          chunkIndex: 0,
          chunkCount: 1,
        },
      };

      return [chunk];
    }
  }

  private async chunkOfficeFile(
    buffer: Buffer,
    baseMetadata: DocumentMetadata,
    metadata: UniversalMetadata
  ): Promise<DocumentChunk[]> {
    try {
      // Extract text content from Office document using the Office processor
      const officeResult = await this.officeProcessor.extractTextFromBuffer(
        buffer,
        metadata.content.type
      );

      // If Office document has extractable text, chunk it like regular text
      if (officeResult.metadata.hasText && officeResult.text.length > 0) {
        // For substantial content, use text chunking
        if (officeResult.text.length > 500) {
          return await this.chunkTextFile(
            buffer,
            baseMetadata,
            metadata,
            officeResult.text
          );
        } else {
          // For shorter content, create a single enriched chunk
          const chunk: DocumentChunk = {
            id: this.generateChunkId(metadata.file.id, 0),
            text:
              `${this.getOfficeTypeLabel(metadata.content.type)}: ${
                metadata.file.name
              }\n` +
              `Word Count: ${officeResult.metadata.wordCount}\n` +
              `Language: ${officeResult.metadata.language}\n` +
              `${officeResult.text}`,
            meta: {
              ...baseMetadata,
              chunkIndex: 0,
              chunkCount: 1,
            },
          };

          return [chunk];
        }
      }

      // If no extractable text, create a metadata-only chunk
      const chunk: DocumentChunk = {
        id: this.generateChunkId(metadata.file.id, 0),
        text:
          `${this.getOfficeTypeLabel(metadata.content.type)}: ${
            metadata.file.name
          }\n` +
          `Type: ${metadata.content.type}\n` +
          `Has Text: ${officeResult.metadata.hasText ? "Yes" : "No"}\n` +
          `Word Count: ${officeResult.metadata.wordCount || 0}\n` +
          `${officeResult.text}`,
        meta: {
          ...baseMetadata,
          chunkIndex: 0,
          chunkCount: 1,
        },
      };

      return [chunk];
    } catch (error) {
      // Fallback for Office document processing errors
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const chunk: DocumentChunk = {
        id: this.generateChunkId(metadata.file.id, 0),
        text: `Office Document Processing Error: ${metadata.file.name}\nError: ${errorMessage}`,
        meta: {
          ...baseMetadata,
          chunkIndex: 0,
          chunkCount: 1,
        },
      };

      return [chunk];
    }
  }

  /**
   * Get human-readable label for Office document types
   */
  private getOfficeTypeLabel(contentType: ContentType): string {
    switch (contentType) {
      case ContentType.OFFICE_DOC:
        return "Word Document";
      case ContentType.OFFICE_SHEET:
        return "Excel Spreadsheet";
      case ContentType.OFFICE_PRESENTATION:
        return "PowerPoint Presentation";
      default:
        return "Office Document";
    }
  }

  private async chunkImageFile(
    buffer: Buffer,
    baseMetadata: DocumentMetadata,
    metadata: UniversalMetadata
  ): Promise<DocumentChunk[]> {
    try {
      // For raster images, OCR might have been performed
      if (metadata.content.type === ContentType.RASTER_IMAGE) {
        // Check if OCR extracted text (content has hasText and wordCount > 0)
        if (
          (metadata.content as any).hasText &&
          (metadata.content as any).wordCount > 0
        ) {
          // Perform OCR to get the actual text
          const ocrResult = await this.ocrProcessor.extractTextFromBuffer(
            buffer
          );

          // If OCR was successful, chunk the text
          if (ocrResult.metadata.hasText && ocrResult.text.length > 100) {
            // Use text chunking for substantial OCR content
            return await this.chunkTextFile(
              buffer,
              baseMetadata,
              metadata,
              ocrResult.text
            );
          } else {
            // Create a chunk with OCR results and metadata
            const chunk: DocumentChunk = {
              id: this.generateChunkId(metadata.file.id, 0),
              text:
                `Image OCR: ${metadata.file.name}\n` +
                `OCR Confidence: ${
                  (metadata.content as any).confidence?.toFixed(1) || "Unknown"
                }%\n` +
                `Has Text: ${
                  (metadata.content as any).hasText ? "Yes" : "No"
                }\n` +
                `Word Count: ${(metadata.content as any).wordCount || 0}\n` +
                `${ocrResult.text}`,
              meta: {
                ...baseMetadata,
                chunkIndex: 0,
                chunkCount: 1,
              },
            };

            return [chunk];
          }
        }
      }

      // Fallback for images without OCR or unsupported image types
      const chunk: DocumentChunk = {
        id: this.generateChunkId(metadata.file.id, 0),
        text: `Image: ${metadata.file.name}\nType: ${metadata.content.type}\nFormat: ${metadata.file.extension}`,
        meta: {
          ...baseMetadata,
          chunkIndex: 0,
          chunkCount: 1,
        },
      };

      return [chunk];
    } catch (error) {
      // Fallback for image processing errors
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const chunk: DocumentChunk = {
        id: this.generateChunkId(metadata.file.id, 0),
        text: `Image Processing Error: ${metadata.file.name}\nError: ${errorMessage}`,
        meta: {
          ...baseMetadata,
          chunkIndex: 0,
          chunkCount: 1,
        },
      };

      return [chunk];
    }
  }

  private async chunkAudioFile(
    buffer: Buffer,
    baseMetadata: DocumentMetadata,
    metadata: UniversalMetadata
  ): Promise<DocumentChunk[]> {
    try {
      // Attempt speech-to-text transcription
      const speechResult = await this.speechProcessor.transcribeFromBuffer(buffer, {
        language: "en",
        sampleRate: 16000,
      });

      // If transcription was successful, chunk the text
      if (speechResult.metadata.hasText && speechResult.text.length > 0) {
        // For substantial transcriptions, use text chunking
        if (speechResult.text.length > 300) {
          return await this.chunkTextFile(buffer, baseMetadata, metadata, speechResult.text);
        } else {
          // For shorter transcriptions, create a single enriched chunk
          const chunk: DocumentChunk = {
            id: this.generateChunkId(metadata.file.id, 0),
            text: `Audio Transcript: ${metadata.file.name}\n` +
                  `Duration: ${speechResult.metadata.speechMetadata?.duration?.toFixed(1) || "Unknown"}s\n` +
                  `Language: ${speechResult.metadata.language}\n` +
                  `Confidence: ${speechResult.metadata.speechMetadata?.confidence?.toFixed(1) || "Unknown"}\n` +
                  `${speechResult.text}`,
            meta: {
              ...baseMetadata,
              chunkIndex: 0,
              chunkCount: 1,
            },
          };

          return [chunk];
        }
      }

      // If no transcription, create a metadata-only chunk
      const chunk: DocumentChunk = {
        id: this.generateChunkId(metadata.file.id, 0),
        text: `Audio: ${metadata.file.name}\n` +
              `Type: ${metadata.content.type}\n` +
              `Duration: ${speechResult.metadata.speechMetadata?.duration?.toFixed(1) || "Unknown"}s\n` +
              `Processing Time: ${speechResult.metadata.speechMetadata?.processingTime || 0}ms\n` +
              `${speechResult.text}`,
        meta: {
          ...baseMetadata,
          chunkIndex: 0,
          chunkCount: 1,
        },
      };

      return [chunk];
    } catch (error) {
      // Fallback for audio processing errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      const chunk: DocumentChunk = {
        id: this.generateChunkId(metadata.file.id, 0),
        text: `Audio Processing Error: ${metadata.file.name}\nError: ${errorMessage}`,
        meta: {
          ...baseMetadata,
          chunkIndex: 0,
          chunkCount: 1,
        },
      };

      return [chunk];
    }
  }

  private async chunkVideoFile(
    buffer: Buffer,
    baseMetadata: DocumentMetadata,
    metadata: UniversalMetadata
  ): Promise<DocumentChunk[]> {
    // Placeholder for video processing
    // In production, would extract audio and attempt speech-to-text

    const chunk: DocumentChunk = {
      id: this.generateChunkId(metadata.file.id, 0),
      text: `Video: ${metadata.file.name}\nType: ${
        metadata.content.type
      }\nDuration: ${
        metadata.content.duration || "Unknown"
      } seconds\nDimensions: ${
        metadata.content.dimensions?.width || "Unknown"
      }x${metadata.content.dimensions?.height || "Unknown"}`,
      meta: {
        ...baseMetadata,
        chunkIndex: 0,
        chunkCount: 1,
      },
    };

    return [chunk];
  }

  private async chunkStructuredFile(
    buffer: Buffer,
    baseMetadata: DocumentMetadata,
    metadata: UniversalMetadata
  ): Promise<DocumentChunk[]> {
    const text = buffer.toString("utf8");

    // For structured data, create a single chunk with the content
    const chunk: DocumentChunk = {
      id: this.generateChunkId(metadata.file.id, 0),
      text: `Structured Data: ${metadata.file.name}\nType: ${
        metadata.content.type
      }\nContent:\n${text.slice(0, 1000)}${text.length > 1000 ? "..." : ""}`,
      meta: {
        ...baseMetadata,
        chunkIndex: 0,
        chunkCount: 1,
      },
    };

    return [chunk];
  }

  private createMetadataOnlyChunk(
    baseMetadata: DocumentMetadata,
    metadata: UniversalMetadata
  ): DocumentChunk {
    const chunk: DocumentChunk = {
      id: this.generateChunkId(metadata.file.id, 0),
      text: `File: ${metadata.file.name}\nType: ${
        metadata.content.type
      }\nMIME Type: ${metadata.file.mimeType}\nSize: ${
        metadata.file.size
      } bytes\nQuality Score: ${metadata.quality.overallScore.toFixed(2)}`,
      meta: {
        ...baseMetadata,
        chunkIndex: 0,
        chunkCount: 1,
      },
    };

    return chunk;
  }

  private mapContentType(contentType: ContentType): string {
    // Map our ContentType enum to the existing content type strings
    switch (contentType) {
      case ContentType.MARKDOWN:
        return "markdown";
      case ContentType.PLAIN_TEXT:
        return "plain_text";
      case ContentType.PDF:
        return "pdf";
      case ContentType.OFFICE_DOC:
        return "office_document";
      case ContentType.OFFICE_SHEET:
        return "office_sheet";
      case ContentType.OFFICE_PRESENTATION:
        return "office_presentation";
      case ContentType.RASTER_IMAGE:
        return "image";
      case ContentType.VECTOR_IMAGE:
        return "vector_image";
      case ContentType.AUDIO:
        return "audio";
      case ContentType.VIDEO:
        return "video";
      case ContentType.JSON:
        return "json";
      case ContentType.XML:
        return "xml";
      case ContentType.CSV:
        return "csv";
      default:
        return "unknown";
    }
  }

  private mapContentTypeToStrategy(contentType: ContentType): string {
    // Map to embedding strategy
    switch (contentType) {
      case ContentType.MARKDOWN:
      case ContentType.PLAIN_TEXT:
      case ContentType.PDF:
      case ContentType.OFFICE_DOC:
        return "text";
      case ContentType.RASTER_IMAGE:
      case ContentType.VECTOR_IMAGE:
        return "image";
      case ContentType.AUDIO:
        return "audio";
      case ContentType.VIDEO:
        return "video";
      default:
        return "text"; // fallback
    }
  }

  private generateChunkId(fileId: string, chunkIndex: number): string {
    const hash = createHash("md5")
      .update(`${fileId}_${chunkIndex}`)
      .digest("hex")
      .slice(0, 8);
    return `multi_${fileId}_${chunkIndex}_${hash}`;
  }

  private generateBreadcrumbs(filePath: string): string[] {
    const parts = filePath
      .split(path.sep)
      .filter((part) => part && part !== ".");

    const breadcrumbs: string[] = [];
    for (let i = 0; i < parts.length - 1; i++) {
      const segment = parts.slice(0, i + 1).join("/");
      breadcrumbs.push(segment);
    }

    return breadcrumbs;
  }
}
