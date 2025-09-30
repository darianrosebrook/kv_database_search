import { DocumentDatabase } from "./database";
import { ObsidianEmbeddingService } from "./embeddings";
import { LoggerFactory } from "./shared/logger";
import { ObsidianChunker } from "./obsidian-chunker";
import { ObsidianFileProcessor } from "./obsidian-file-processor";
import { ObsidianImageProcessor } from "./obsidian-image-processor";

/**
 * Refactored Obsidian ingestion pipeline using modular components
 * @darianrosebrook
 */
export class ObsidianIngestionPipeline {
  private logger = LoggerFactory.create("ObsidianIngestionPipeline");
  private db: DocumentDatabase;
  private embeddings: ObsidianEmbeddingService;
  private vaultPath: string;
  private chunker: ObsidianChunker;
  private fileProcessor: ObsidianFileProcessor;
  private imageProcessor: ObsidianImageProcessor;

  constructor(
    database: DocumentDatabase,
    embeddingService: ObsidianEmbeddingService,
    vaultPath: string
  ) {
    this.db = database;
    this.embeddings = embeddingService;
    this.vaultPath = vaultPath;
    this.chunker = new ObsidianChunker();
    this.fileProcessor = new ObsidianFileProcessor();
    this.imageProcessor = new ObsidianImageProcessor(vaultPath);
  }

  async ingestVault(
    options: {
      batchSize?: number;
      rateLimitMs?: number;
      skipExisting?: boolean;
      includePatterns?: string[];
      excludePatterns?: string[];
      chunkingOptions?: {
        maxChunkSize?: number;
        chunkOverlap?: number;
        preserveStructure?: boolean;
        includeContext?: boolean;
        cleanContent?: boolean;
      };
      imageProcessingOptions?: {
        enableImageProcessing?: boolean;
        enableImageClassification?: boolean;
        maxImagesPerFile?: number;
        maxImageSize?: number;
        ocrLanguage?: string;
        imageProcessingTimeout?: number;
        minClassificationConfidence?: number;
        maxObjects?: number;
        includeVisualFeatures?: boolean;
      };
    } = {}
  ): Promise<{
    totalFiles: number;
    processedFiles: number;
    totalChunks: number;
    processedChunks: number;
    skippedChunks: number;
    errors: string[];
    imageStats: {
      filesWithImages: number;
      totalImages: number;
      processedImages: number;
      failedImages: number;
      extractedTextLength: number;
      averageConfidence: number;
      sceneDescriptionsGenerated: number;
      averageClassificationConfidence: number;
    };
  }> {
    const {
      batchSize = 10,
      rateLimitMs = 100,
      skipExisting = false,
      includePatterns = ["**/*.md"],
      excludePatterns = [],
      chunkingOptions = {},
      imageProcessingOptions = {},
    } = options;

    this.logger.info(`Starting vault ingestion for path: ${this.vaultPath}`);

    // Discover files to process
    const filePaths = await this.discoverMarkdownFiles(
      includePatterns,
      excludePatterns
    );

    this.logger.info(`Found ${filePaths.length} files to process`);

    const results = {
      totalFiles: filePaths.length,
      processedFiles: 0,
      totalChunks: 0,
      processedChunks: 0,
      skippedChunks: 0,
      errors: [] as string[],
      imageStats: {
        filesWithImages: 0,
        totalImages: 0,
        processedImages: 0,
        failedImages: 0,
        extractedTextLength: 0,
        averageConfidence: 0,
        sceneDescriptionsGenerated: 0,
        averageClassificationConfidence: 0,
      },
    };

    // Process files in batches
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);

      try {
        const batchResults = await this.processBatch(batch, {
          skipExisting,
          chunkingOptions,
          imageProcessingOptions,
        });

        results.processedFiles += batchResults.processedFiles;
        results.totalChunks += batchResults.totalChunks;
        results.processedChunks += batchResults.processedChunks;
        results.skippedChunks += batchResults.skippedChunks;
        results.errors.push(...batchResults.errors);

        // Merge image stats
        Object.keys(results.imageStats).forEach((key) => {
          (results.imageStats as any)[key] += (batchResults.imageStats as any)[
            key
          ];
        });

        // Rate limiting
        if (rateLimitMs > 0 && i + batchSize < filePaths.length) {
          await new Promise((resolve) => setTimeout(resolve, rateLimitMs));
        }
      } catch (error) {
        const errorMessage = `Batch processing failed: ${
          error instanceof Error ? error.message : String(error)
        }`;
        this.logger.error(errorMessage, error as Error);
        results.errors.push(errorMessage);
      }
    }

    this.logger.info(
      `Vault ingestion complete: ${results.processedFiles}/${results.totalFiles} files processed, ${results.processedChunks} chunks created`
    );

    return results;
  }

  /**
   * Process a batch of files
   */
  private async processBatch(
    filePaths: string[],
    options: {
      skipExisting?: boolean;
      chunkingOptions?: any;
      imageProcessingOptions?: any;
    }
  ): Promise<{
    processedFiles: number;
    totalChunks: number;
    processedChunks: number;
    skippedChunks: number;
    errors: string[];
    imageStats: any;
  }> {
    const results = {
      processedFiles: 0,
      totalChunks: 0,
      processedChunks: 0,
      skippedChunks: 0,
      errors: [] as string[],
      imageStats: {
        filesWithImages: 0,
        totalImages: 0,
        processedImages: 0,
        failedImages: 0,
        extractedTextLength: 0,
        averageConfidence: 0,
        sceneDescriptionsGenerated: 0,
        averageClassificationConfidence: 0,
      },
    };

    for (const filePath of filePaths) {
      try {
        const fileResult = await this.ingestFile(filePath, options);
        results.processedFiles += fileResult.processedFiles;
        results.totalChunks += fileResult.totalChunks;
        results.processedChunks += fileResult.processedChunks;
        results.skippedChunks += fileResult.skippedChunks;
        results.errors.push(...fileResult.errors);

        // Merge image stats
        Object.keys(results.imageStats).forEach((key) => {
          (results.imageStats as any)[key] += (fileResult.imageStats as any)[
            key
          ];
        });
      } catch (error) {
        const errorMessage = `File processing failed for ${filePath}: ${
          error instanceof Error ? error.message : String(error)
        }`;
        this.logger.error(errorMessage, error as Error);
        results.errors.push(errorMessage);
      }
    }

    return results;
  }

  /**
   * Process a single file
   */
  private async ingestFile(
    filePath: string,
    options: {
      skipExisting?: boolean;
      chunkingOptions?: any;
      imageProcessingOptions?: any;
    }
  ): Promise<{
    processedFiles: number;
    totalChunks: number;
    processedChunks: number;
    skippedChunks: number;
    errors: string[];
    imageStats: any;
  }> {
    // Parse the Obsidian file
    const obsidianFile = await this.fileProcessor.parseObsidianFile(filePath);

    // Validate file
    const validation = await this.fileProcessor.validateFile(filePath);
    if (!validation.isValid) {
      return {
        processedFiles: 0,
        totalChunks: 0,
        processedChunks: 0,
        skippedChunks: 0,
        errors: validation.errors,
        imageStats: {
          filesWithImages: 0,
          totalImages: 0,
          processedImages: 0,
          failedImages: 0,
          extractedTextLength: 0,
          averageConfidence: 0,
          sceneDescriptionsGenerated: 0,
          averageClassificationConfidence: 0,
        },
      };
    }

    // Process images if enabled
    const imageStats = await this.imageProcessor.processEmbeddedImages(
      obsidianFile,
      options.imageProcessingOptions || {}
    );

    // Create text chunks
    const textChunks = await this.chunker.chunkDocument(
      obsidianFile,
      options.chunkingOptions || {}
    );

    // Create image chunks if there are processed images
    const imageChunks = await this.imageProcessor.createImageChunks(
      obsidianFile,
      imageStats
    );

    // Combine all chunks
    const allChunks = [...textChunks, ...imageChunks];

    // Generate embeddings for chunks
    const embeddings = await this.embeddings.generateEmbeddings(
      allChunks.map((chunk) => chunk.text)
    );

    // Merge chunks with embeddings
    const chunksWithEmbeddings = this.chunker.mergeChunksWithEmbeddings(
      allChunks,
      embeddings
    );

    // Store chunks in database
    await this.db.batchUpsertChunks(chunksWithEmbeddings);

    return {
      processedFiles: 1,
      totalChunks: chunksWithEmbeddings.length,
      processedChunks: chunksWithEmbeddings.length,
      skippedChunks: 0,
      errors: [],
      imageStats,
    };
  }

  /**
   * Discover markdown files matching patterns
   */
  private async discoverMarkdownFiles(
    includePatterns: string[],
    excludePatterns: string[]
  ): Promise<string[]> {
    const path = await import("path");
    const { glob } = await import("glob");

    const files: string[] = [];

    for (const pattern of includePatterns) {
      const fullPattern = path.join(this.vaultPath, pattern);
      const matchedFiles = await glob(fullPattern, {
        ignore: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.*",
          ...excludePatterns.map((p) => path.join(this.vaultPath, p)),
        ],
      });

      files.push(...matchedFiles);
    }

    // Remove duplicates and filter for markdown files
    const uniqueFiles = [...new Set(files)];
    return uniqueFiles.filter((file) => file.toLowerCase().endsWith(".md"));
  }
}
