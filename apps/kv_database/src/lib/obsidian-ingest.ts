import { ObsidianDatabase } from "./database";
import { ObsidianEmbeddingService } from "./embeddings";
import {
  DocumentChunk,
  DocumentMetadata,
  ObsidianFile,
  ObsidianDocument,
} from "../types/index";
import * as fs from "fs";
import * as path from "path";
import {
  createHash,
  extractWikilinks,
  extractObsidianTags,
  cleanMarkdown,
  // detectLanguage, // Unused import
  generateDeterministicId,
  sleep,
  determineContentType,
} from "./utils";
import { ImageLinkExtractor, ImageLink } from "./image-link-extractor";
import { ImagePathResolver, ResolvedImagePath } from "./image-path-resolver";
import { OCRProcessor } from "./processors/ocr-processor";
import { ImageClassificationProcessor } from "./processors/image-classification-processor";

export interface ObsidianChunkingOptions {
  maxChunkSize?: number;
  chunkOverlap?: number;
  preserveStructure?: boolean;
  includeContext?: boolean;
  cleanContent?: boolean;
}

export interface ImageProcessingOptions {
  enableImageProcessing?: boolean;
  enableImageClassification?: boolean;
  maxImagesPerFile?: number;
  maxImageSize?: number;
  ocrLanguage?: string;
  imageProcessingTimeout?: number;
  minClassificationConfidence?: number;
  maxObjects?: number;
  includeVisualFeatures?: boolean;
}

export interface ImageProcessingResult {
  filesWithImages: number;
  totalImages: number;
  processedImages: number;
  failedImages: number;
  extractedTextLength: number;
  averageConfidence: number;
  sceneDescriptionsGenerated: number;
  averageClassificationConfidence: number;
}

export class ObsidianIngestionPipeline {
  private db: ObsidianDatabase;
  private embeddings: ObsidianEmbeddingService;
  private vaultPath: string;
  private imageLinkExtractor: ImageLinkExtractor;
  private imagePathResolver: ImagePathResolver;
  private ocrProcessor: OCRProcessor;
  private imageClassificationProcessor: ImageClassificationProcessor;

  constructor(
    database: ObsidianDatabase,
    embeddingService: ObsidianEmbeddingService,
    vaultPath: string
  ) {
    this.db = database;
    this.embeddings = embeddingService;
    this.vaultPath = vaultPath;
    this.imageLinkExtractor = new ImageLinkExtractor();
    this.imagePathResolver = new ImagePathResolver(vaultPath);
    this.ocrProcessor = new OCRProcessor();
    this.imageClassificationProcessor = new ImageClassificationProcessor();
  }

  async ingestVault(
    options: {
      batchSize?: number;
      rateLimitMs?: number;
      skipExisting?: boolean;
      includePatterns?: string[];
      excludePatterns?: string[];
      chunkingOptions?: ObsidianChunkingOptions;
      imageProcessingOptions?: ImageProcessingOptions;
    } = {}
  ): Promise<{
    totalFiles: number;
    processedFiles: number;
    totalChunks: number;
    processedChunks: number;
    skippedChunks: number;
    errors: string[];
    imageStats: ImageProcessingResult;
  }> {
    const {
      batchSize = 5, // Smaller batches for Obsidian files
      rateLimitMs = 200,
      skipExisting = true,
      includePatterns = ["**/*.md"],
      excludePatterns = [
        "**/.obsidian/**",
        "**/node_modules/**",
        "**/.git/**",
        "**/Attachments/**",
        "**/assets/**",
      ],
      chunkingOptions = {},
      imageProcessingOptions = {
        enableImageProcessing: true,
        enableImageClassification: true,
        maxImagesPerFile: 10,
        maxImageSize: 50 * 1024 * 1024, // 50MB
        ocrLanguage: "eng",
        imageProcessingTimeout: 30000, // 30 seconds
        minClassificationConfidence: 0.5,
        maxObjects: 5,
        includeVisualFeatures: true,
      },
    } = options;

    console.log(`🚀 Starting Obsidian vault ingestion: ${this.vaultPath}`);
    console.log(
      `🖼️  Image processing: ${
        imageProcessingOptions.enableImageProcessing ? "ENABLED" : "DISABLED"
      }`
    );

    try {
      // Initialize OCR processor if image processing is enabled
      if (imageProcessingOptions.enableImageProcessing) {
        console.log("🔧 Initializing OCR processor...");
        await this.ocrProcessor.initialize();
      }

      // Discover all markdown files
      const markdownFiles = await this.discoverMarkdownFiles(
        includePatterns,
        excludePatterns
      );
      console.log(`📄 Found ${markdownFiles.length} markdown files`);

      let processedFiles = 0;
      let totalChunks = 0;
      let processedChunks = 0;
      let skippedChunks = 0;
      const errors: string[] = [];

      // Image processing statistics
      let filesWithImages = 0;
      let totalImages = 0;
      let processedImages = 0;
      let failedImages = 0;
      let extractedTextLength = 0;
      const confidenceScores: number[] = [];
      let sceneDescriptionsGenerated = 0;
      const classificationConfidenceScores: number[] = [];

      // Process files in batches
      for (let i = 0; i < markdownFiles.length; i += batchSize) {
        const batch = markdownFiles.slice(i, i + batchSize);
        console.log(
          `⚙️  Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            markdownFiles.length / batchSize
          )}`
        );

        try {
          const batchResults = await this.processBatch(
            batch,
            skipExisting,
            chunkingOptions,
            imageProcessingOptions
          );

          processedFiles += batchResults.processedFiles;
          totalChunks += batchResults.totalChunks;
          processedChunks += batchResults.processedChunks;
          skippedChunks += batchResults.skippedChunks;
          errors.push(...batchResults.errors);

          // Accumulate image statistics
          if (batchResults.imageStats) {
            filesWithImages += batchResults.imageStats.filesWithImages;
            totalImages += batchResults.imageStats.totalImages;
            processedImages += batchResults.imageStats.processedImages;
            failedImages += batchResults.imageStats.failedImages;
            extractedTextLength += batchResults.imageStats.extractedTextLength;
            sceneDescriptionsGenerated +=
              batchResults.imageStats.sceneDescriptionsGenerated;
            if (batchResults.imageStats.averageConfidence > 0) {
              confidenceScores.push(batchResults.imageStats.averageConfidence);
            }
            if (batchResults.imageStats.averageClassificationConfidence > 0) {
              classificationConfidenceScores.push(
                batchResults.imageStats.averageClassificationConfidence
              );
            }
          }

          // Rate limiting
          if (i + batchSize < markdownFiles.length) {
            await sleep(rateLimitMs);
          }
        } catch (error) {
          const errorMsg = `Batch ${
            Math.floor(i / batchSize) + 1
          } failed: ${error}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      const result = {
        totalFiles: markdownFiles.length,
        processedFiles,
        totalChunks,
        processedChunks,
        skippedChunks,
        errors,
        imageStats: {
          filesWithImages,
          totalImages,
          processedImages,
          failedImages,
          extractedTextLength,
          averageConfidence:
            confidenceScores.length > 0
              ? confidenceScores.reduce((a, b) => a + b, 0) /
                confidenceScores.length
              : 0,
          sceneDescriptionsGenerated,
          averageClassificationConfidence:
            classificationConfidenceScores.length > 0
              ? classificationConfidenceScores.reduce((a, b) => a + b, 0) /
                classificationConfidenceScores.length
              : 0,
        },
      };

      console.log(`✅ Obsidian ingestion complete:`, result);

      // Log image processing results if enabled
      if (imageProcessingOptions.enableImageProcessing) {
        console.log(`🖼️  Image processing results:`);
        console.log(`   Files with images: ${filesWithImages}`);
        console.log(`   Total images found: ${totalImages}`);
        console.log(`   Images processed: ${processedImages}`);
        console.log(`   Images failed: ${failedImages}`);
        console.log(`   Text extracted: ${extractedTextLength} characters`);
        console.log(
          `   Average OCR confidence: ${result.imageStats.averageConfidence.toFixed(
            1
          )}%`
        );
        if (imageProcessingOptions.enableImageClassification) {
          console.log(
            `   Scene descriptions generated: ${sceneDescriptionsGenerated}`
          );
          console.log(
            `   Average classification confidence: ${result.imageStats.averageClassificationConfidence.toFixed(
              1
            )}%`
          );
        }
      }

      return result;
    } catch (error) {
      console.error(`❌ Obsidian ingestion failed: ${error}`);
      throw new Error(`Obsidian ingestion pipeline failed: ${error}`);
    } finally {
      // Cleanup OCR processor if it was initialized
      if (imageProcessingOptions.enableImageProcessing) {
        try {
          await this.ocrProcessor.terminate();
        } catch (error) {
          console.warn(`⚠️  OCR processor cleanup failed: ${error}`);
        }
      }
    }
  }

  /**
   * Ingest specific files
   */
  async ingestFiles(
    filePaths: string[],
    options: {
      skipExisting?: boolean;
      batchSize?: number;
    } = {}
  ): Promise<{
    totalFiles: number;
    processedFiles: number;
    totalChunks: number;
    processedChunks: number;
    skippedChunks: number;
    errors: string[];
  }> {
    const { skipExisting = false, batchSize = 10 } = options;

    console.log(`🚀 Starting file ingestion for ${filePaths.length} files`);

    try {
      let processedFiles = 0;
      let totalChunks = 0;
      let processedChunks = 0;
      let skippedChunks = 0;
      const errors: string[] = [];

      // Process files in batches
      for (let i = 0; i < filePaths.length; i += batchSize) {
        const batch = filePaths.slice(i, i + batchSize);

        try {
          const batchResults = await this.processBatch(batch, skipExisting, {});

          processedFiles += batchResults.processedFiles;
          totalChunks += batchResults.totalChunks;
          processedChunks += batchResults.processedChunks;
          skippedChunks += batchResults.skippedChunks;
          errors.push(...batchResults.errors);
        } catch (error) {
          const errorMsg = `Batch ${
            Math.floor(i / batchSize) + 1
          } failed: ${error}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      const result = {
        totalFiles: filePaths.length,
        processedFiles,
        totalChunks,
        processedChunks,
        skippedChunks,
        errors,
      };

      console.log(`✅ File ingestion complete:`, result);
      return result;
    } catch (error) {
      console.error(`❌ File ingestion failed: ${error}`);
      throw new Error(`File ingestion pipeline failed: ${error}`);
    }
  }

  private async discoverMarkdownFiles(
    includePatterns: string[],
    excludePatterns: string[]
  ): Promise<string[]> {
    const files: string[] = [];

    const walkDir = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(this.vaultPath, fullPath);

        // Check exclude patterns
        if (
          excludePatterns.some((pattern) =>
            this.matchesPattern(relativePath, pattern)
          )
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          // Check include patterns
          if (
            includePatterns.some((pattern) =>
              this.matchesPattern(relativePath, pattern)
            )
          ) {
            files.push(fullPath);
          }
        }
      }
    };

    walkDir(this.vaultPath);
    return files;
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Simple glob pattern matching
    const regexPattern = pattern
      .replace(/\*\*/g, ".*")
      .replace(/\*/g, "[^/]*")
      .replace(/\?/g, ".");
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  private async processBatch(
    filePaths: string[],
    skipExisting: boolean,
    chunkingOptions: ObsidianChunkingOptions,
    imageProcessingOptions?: ImageProcessingOptions
  ): Promise<{
    processedFiles: number;
    totalChunks: number;
    processedChunks: number;
    skippedChunks: number;
    errors: string[];
    imageStats?: ImageProcessingResult;
  }> {
    let processedFiles = 0;
    let totalChunks = 0;
    let processedChunks = 0;
    let skippedChunks = 0;
    const errors: string[] = [];

    // Image processing statistics
    let filesWithImages = 0;
    let totalImages = 0;
    let processedImages = 0;
    let failedImages = 0;
    let extractedTextLength = 0;
    const confidenceScores: number[] = [];
    let sceneDescriptionsGenerated = 0;
    const classificationConfidenceScores: number[] = [];

    for (const filePath of filePaths) {
      try {
        console.log(
          `📖 Processing: ${path.relative(this.vaultPath, filePath)}`
        );

        // Parse the Obsidian file
        const obsidianFile = await this.parseObsidianFile(filePath);

        console.log(`✅ Successfully parsed file: ${obsidianFile.fileName}`);

        // Skip empty files
        if (!obsidianFile.content.trim()) {
          console.log(`⏭️  Skipping empty file: ${obsidianFile.fileName}`);
          continue;
        }

        // Process embedded images if enabled
        let imageContent = "";
        if (imageProcessingOptions?.enableImageProcessing) {
          try {
            const imageResult = await this.processEmbeddedImages(
              obsidianFile,
              filePath,
              imageProcessingOptions
            );

            if (imageResult.images.length > 0) {
              filesWithImages++;
              totalImages += imageResult.images.length;
              processedImages += imageResult.processedImages;
              failedImages += imageResult.failedImages;
              extractedTextLength += imageResult.extractedTextLength;
              confidenceScores.push(...imageResult.confidenceScores);
              sceneDescriptionsGenerated +=
                imageResult.sceneDescriptionsGenerated;
              classificationConfidenceScores.push(
                ...imageResult.classificationConfidenceScores
              );
              imageContent = imageResult.combinedText;

              console.log(
                `🖼️  Processed ${imageResult.processedImages}/${imageResult.images.length} images from ${obsidianFile.fileName}`
              );
            }
          } catch (error) {
            console.warn(
              `⚠️  Image processing failed for ${obsidianFile.fileName}: ${error}`
            );
            errors.push(
              `Image processing failed for ${obsidianFile.fileName}: ${error}`
            );
          }
        }

        // Create chunks from the file (including image content if available)
        const enhancedFile = {
          ...obsidianFile,
          content: imageContent
            ? `${obsidianFile.content}\n\n## Extracted Image Content\n${imageContent}`
            : obsidianFile.content,
        };

        const chunks = await this.chunkObsidianFile(
          enhancedFile,
          chunkingOptions
        );
        totalChunks += chunks.length;

        // Process each chunk
        for (const chunk of chunks) {
          try {
            // Check if chunk already exists (if skipExisting is enabled)
            if (skipExisting) {
              const existing = await this.db.getChunkById(chunk.id);
              if (existing) {
                console.log(
                  `⏭️  Skipping existing chunk: ${chunk.id.slice(0, 8)}...`
                );
                skippedChunks++;
                continue;
              }
            }

            // Generate embedding with strategy
            console.log(
              `🔮 Embedding chunk: ${chunk.id.slice(0, 8)}... (${
                chunk.text.length
              } chars)`
            );

            const embeddingResult = await this.embeddings.embedWithStrategy(
              chunk.text,
              chunk.meta.contentType,
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
      }
    }

    return {
      processedFiles,
      totalChunks,
      processedChunks,
      skippedChunks,
      errors,
      imageStats: {
        filesWithImages,
        totalImages,
        processedImages,
        failedImages,
        extractedTextLength,
        averageConfidence:
          confidenceScores.length > 0
            ? confidenceScores.reduce((a, b) => a + b, 0) /
              confidenceScores.length
            : 0,
        sceneDescriptionsGenerated,
        averageClassificationConfidence:
          classificationConfidenceScores.length > 0
            ? classificationConfidenceScores.reduce((a, b) => a + b, 0) /
              classificationConfidenceScores.length
            : 0,
      },
    };
  }

  /**
   * Process embedded images from a markdown file
   */
  private async processEmbeddedImages(
    obsidianFile: ObsidianDocument,
    sourceFilePath: string,
    options: ImageProcessingOptions
  ): Promise<{
    images: ImageLink[];
    processedImages: number;
    failedImages: number;
    extractedTextLength: number;
    confidenceScores: number[];
    combinedText: string;
    sceneDescriptionsGenerated: number;
    classificationConfidenceScores: number[];
  }> {
    // Extract image links from content
    const extractionResult = this.imageLinkExtractor.extractImageLinks(
      obsidianFile.content
    );
    const validImageLinks = this.imageLinkExtractor.filterValidImageLinks(
      extractionResult.links
    );

    if (validImageLinks.length === 0) {
      return {
        images: [],
        processedImages: 0,
        failedImages: 0,
        extractedTextLength: 0,
        confidenceScores: [],
        combinedText: "",
        sceneDescriptionsGenerated: 0,
        classificationConfidenceScores: [],
      };
    }

    console.log(
      `🔍 Found ${validImageLinks.length} image links in ${obsidianFile.fileName}`
    );

    // Resolve image paths
    const imagePaths = validImageLinks.map((link) => link.src);
    const resolutionResult = this.imagePathResolver.resolvePaths(
      imagePaths,
      sourceFilePath
    );
    const validResolvedPaths = this.imagePathResolver.filterValidImages(
      resolutionResult.resolved
    );

    if (validResolvedPaths.length === 0) {
      console.log(
        `⚠️  No valid image files found for ${obsidianFile.fileName}`
      );
      return {
        images: validImageLinks,
        processedImages: 0,
        failedImages: validImageLinks.length,
        extractedTextLength: 0,
        confidenceScores: [],
        combinedText: "",
        sceneDescriptionsGenerated: 0,
        classificationConfidenceScores: [],
      };
    }

    // Limit number of images per file
    const imagesToProcess = validResolvedPaths.slice(
      0,
      options.maxImagesPerFile || 10
    );

    let processedImages = 0;
    let failedImages = 0;
    let extractedTextLength = 0;
    const confidenceScores: number[] = [];
    const extractedTexts: string[] = [];
    let sceneDescriptionsGenerated = 0;
    const classificationConfidenceScores: number[] = [];

    // Process each image with OCR
    for (const resolvedPath of imagesToProcess) {
      try {
        console.log(
          `🖼️  Processing image: ${path.basename(resolvedPath.resolvedPath)}`
        );

        // Check file size limit
        if (
          resolvedPath.size &&
          resolvedPath.size > (options.maxImageSize || 50 * 1024 * 1024)
        ) {
          console.log(
            `⚠️  Skipping large image: ${path.basename(
              resolvedPath.resolvedPath
            )} (${Math.round(resolvedPath.size / 1024 / 1024)}MB)`
          );
          failedImages++;
          continue;
        }

        // Process with enhanced image classification (includes OCR + scene description)
        const classificationResult =
          await this.imageClassificationProcessor.extractFromFile(
            resolvedPath.resolvedPath,
            {
              enableOCR: options.enableImageProcessing,
              enableClassification: options.enableImageClassification,
              minClassificationConfidence:
                options.minClassificationConfidence || 0.5,
              maxObjects: options.maxObjects || 5,
              includeVisualFeatures: options.includeVisualFeatures !== false,
              language: options.ocrLanguage || "eng",
              confidence: 30, // Minimum OCR confidence threshold
            }
          );

        if (
          classificationResult.success &&
          classificationResult.text &&
          classificationResult.text.trim()
        ) {
          const cleanText = classificationResult.text.trim();
          extractedTexts.push(
            `### Image: ${path.basename(
              resolvedPath.resolvedPath
            )}\n${cleanText}`
          );
          extractedTextLength += cleanText.length;

          // Track OCR confidence if available
          if (classificationResult.confidence) {
            confidenceScores.push(classificationResult.confidence);
          }

          // Track classification confidence if available
          if (
            classificationResult.metadata?.imageClassification?.sceneConfidence
          ) {
            classificationConfidenceScores.push(
              classificationResult.metadata.imageClassification.sceneConfidence
            );
            sceneDescriptionsGenerated++;
          }

          processedImages++;
          console.log(
            `✅ Processed ${cleanText.length} characters from ${path.basename(
              resolvedPath.resolvedPath
            )} (OCR: ${
              classificationResult.confidence?.toFixed(1) || 0
            }%, Scene: ${
              classificationResult.metadata?.imageClassification?.sceneConfidence?.toFixed(
                1
              ) || 0
            }%)`
          );
        } else {
          console.log(
            `⚠️  No content extracted from ${path.basename(
              resolvedPath.resolvedPath
            )} (success: ${classificationResult.success})`
          );
          failedImages++;
        }
      } catch (error) {
        console.error(
          `❌ Failed to process image ${resolvedPath.resolvedPath}: ${error}`
        );
        failedImages++;
      }
    }

    return {
      images: validImageLinks,
      processedImages,
      failedImages,
      extractedTextLength,
      confidenceScores,
      combinedText: extractedTexts.join("\n\n"),
      sceneDescriptionsGenerated,
      classificationConfidenceScores,
    };
  }

  private async parseObsidianFile(filePath: string): Promise<ObsidianDocument> {
    let content: string;
    try {
      content = fs.readFileSync(filePath, "utf-8");
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }

    // Parse frontmatter and content
    // TODO: Implement frontmatter parsing or use a different approach
    const parseResult = { frontmatter: {}, body: content };
    const frontmatter = parseResult?.frontmatter || {};
    const body = parseResult?.body || content;

    // Extract wikilinks and tags
    const wikilinks = extractWikilinks(body);
    const contentTags = extractObsidianTags(body);

    // Combine frontmatter tags with content tags (defensive programming)
    const frontmatterTags =
      frontmatter && (frontmatter as any).tags
        ? Array.isArray((frontmatter as any).tags)
          ? (frontmatter as any).tags
          : typeof (frontmatter as any).tags === "string"
          ? [(frontmatter as any).tags]
          : []
        : [];

    const allTags = Array.from(new Set([...frontmatterTags, ...contentTags]));

    // Get file stats
    let stats: fs.Stats;
    try {
      stats = fs.statSync(filePath);
    } catch (error) {
      throw new Error(`Failed to get stats for file ${filePath}: ${error}`);
    }

    // Calculate content statistics
    const wordCount = body
      .split(/\s+/)
      .filter((word: string) => word.length > 0).length;
    const characterCount = body.length;
    const lineCount = body.split("\n").length;

    // Parse sections
    const sections = this.parseSections(body);

    // Generate checksum
    const checksum = createHash("sha256", content);

    const document: ObsidianDocument = {
      id: path.relative(this.vaultPath, filePath),
      path: path.relative(this.vaultPath, filePath),
      filePath,
      relativePath: path.relative(this.vaultPath, filePath),
      name: path.basename(filePath, ".md"),
      fileName: path.basename(filePath, ".md"),
      extension: ".md",

      content: body,
      frontmatter,
      sections,

      stats: {
        wordCount,
        characterCount,
        lineCount,
        headingCount: sections?.length || 0,
        linkCount: wikilinks.length,
        tagCount: allTags.length,
        size: stats.size,
        createdAt: stats.birthtime,
        updatedAt: stats.mtime,
      },

      relationships: {
        wikilinks:
          wikilinks?.map((link) => ({
            target: link,
            display: link,
            type: "document" as const,
            position: { line: 0, column: 0, offset: 0 },
            context: "",
          })) || [],
        tags: allTags || [],
        backlinks: [], // Will be populated later
      },

      metadata: {
        created: stats.birthtime,
        modified: stats.mtime,
        checksum,
        size: stats.size,
        lastIndexed: new Date(),
        processingErrors: [],
      },
    };

    return document;
  }

  private parseSections(content: string): ObsidianDocument["sections"] {
    const sections: NonNullable<ObsidianDocument["sections"]> = [];
    const lines = content.split("\n");

    type SectionType = NonNullable<ObsidianDocument["sections"]>[0];
    let currentSection: SectionType | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headerMatch) {
        // Save previous section if exists
        if (currentSection) {
          currentSection.endLine = i - 1;
          sections.push(currentSection);
        }

        // Start new section
        const level = parseInt(headerMatch[1].length.toString());
        const title = headerMatch[2];

        currentSection = {
          level,
          title,
          content: "",
          startLine: i,
          endLine: i,
          wikilinks: [],
          tags: [],
        };
      } else if (currentSection) {
        // Add content to current section
        currentSection.content += line + "\n";

        // Extract wikilinks and tags from this line
        currentSection.wikilinks.push(...extractWikilinks(line));
        currentSection.tags.push(...extractObsidianTags(line));
      }
    }

    // Add final section
    if (currentSection) {
      currentSection.endLine = lines.length - 1;
      sections.push(currentSection);
    }

    // Deduplicate wikilinks and tags
    sections.forEach((section: any) => {
      section.wikilinks = Array.from(new Set(section.wikilinks));
      section.tags = Array.from(new Set(section.tags));
    });

    return sections;
  }

  private async chunkObsidianFile(
    document: ObsidianDocument,
    options: ObsidianChunkingOptions
  ): Promise<DocumentChunk[]> {
    const {
      maxChunkSize = 800, // Smaller chunks for better semantic search
      chunkOverlap = 100,
      preserveStructure = true,
      includeContext = true,
      cleanContent = true,
    } = options;

    const chunks: DocumentChunk[] = [];

    // TODO: Implement proper content type determination
    const contentType = determineContentType(
      document.filePath || document.path
    );

    // Create base metadata
    const docPath = document.relativePath || document.path || "unknown";
    const docName = document.fileName || document.name || "untitled";
    const baseMetadata: DocumentMetadata = {
      uri: `obsidian://${docPath}`,
      section: docName,
      breadcrumbs: this.generateBreadcrumbs(docPath),
      contentType,
      sourceType: "obsidian",
      sourceDocumentId: docName,
      lang: "en",
      acl: "public",
      updatedAt: document.stats.updatedAt || new Date(),
      createdAt: document.stats.createdAt || new Date(),
      chunkIndex: 0,
      chunkCount: 1,
      // Enhanced Obsidian-specific metadata
      obsidianFile: {
        fileName: document.fileName || document.name || "untitled",
        filePath: document.relativePath || document.path || "unknown",
        frontmatter: document.frontmatter,
        wikilinks:
          document.relationships.wikilinks?.map((w: any) => w.target) || [],
        tags: (document.relationships.tags as any[]) || [],
        checksum: document.metadata.checksum,
        stats: {
          wordCount: document.stats.wordCount as any, // TODO: Fix type
          characterCount: document.stats.characterCount,
          lineCount: document.stats.lineCount,
        },
      },
    };

    if (preserveStructure) {
      // Structure-aware chunking for Obsidian files
      const obsidianFile: ObsidianFile = {
        filePath: document.filePath || document.path || "unknown",
        fileName: document.fileName || document.name || "untitled",
        content: document.content,
        frontmatter: document.frontmatter,
        wikilinks: document.relationships.wikilinks?.map((w) => w.target) || [],
        tags: document.relationships.tags || [],
        createdAt: document.metadata.created,
        updatedAt: document.metadata.modified,
      };
      chunks.push(
        ...this.chunkByStructure(
          obsidianFile,
          baseMetadata,
          maxChunkSize,
          includeContext,
          cleanContent
        )
      );
    } else {
      // Simple sliding window chunking
      chunks.push(
        ...this.chunkBySize(
          document.content,
          baseMetadata,
          maxChunkSize,
          chunkOverlap,
          cleanContent
        )
      );
    }

    return chunks;
  }

  private chunkByStructure(
    file: ObsidianFile,
    baseMetadata: DocumentMetadata,
    maxChunkSize: number,
    includeContext: boolean,
    cleanContent: boolean
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const lines = file.content.split("\n");

    let currentChunk = "";
    let currentSection = file.fileName;
    let chunkIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        // Save previous chunk if it exists
        if (currentChunk.trim()) {
          chunks.push(
            this.createChunk(
              file,
              currentChunk.trim(),
              currentSection,
              baseMetadata,
              chunkIndex++,
              includeContext,
              cleanContent
            )
          );
        }

        // Start new chunk
        currentSection = headerMatch[2];
        currentChunk = line + "\n";
      } else {
        currentChunk += line + "\n";

        // Check if chunk is getting too large
        if (currentChunk.length > maxChunkSize) {
          chunks.push(
            this.createChunk(
              file,
              currentChunk.trim(),
              currentSection,
              baseMetadata,
              chunkIndex++,
              includeContext,
              cleanContent
            )
          );
          currentChunk = "";
        }
      }
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push(
        this.createChunk(
          file,
          currentChunk.trim(),
          currentSection,
          baseMetadata,
          chunkIndex++,
          includeContext,
          cleanContent
        )
      );
    }

    return chunks;
  }

  private chunkBySize(
    content: string,
    baseMetadata: DocumentMetadata,
    maxChunkSize: number,
    chunkOverlap: number,
    cleanContent: boolean
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const processedContent = cleanContent ? cleanMarkdown(content) : content;
    const words = processedContent.split(/\s+/);

    let chunkIndex = 0;
    for (let i = 0; i < words.length; i += maxChunkSize - chunkOverlap) {
      const chunkWords = words.slice(i, i + maxChunkSize);
      const chunkText = chunkWords.join(" ");

      if (chunkText.trim()) {
        const chunkId = this.generateChunkId(
          baseMetadata.sourceDocumentId!,
          chunkIndex
        );

        chunks.push({
          id: chunkId,
          text: chunkText.trim(),
          meta: {
            ...baseMetadata,
            section: `${baseMetadata.section} (Part ${chunkIndex + 1})`,
            chunkIndex,
            chunkCount: Math.ceil(words.length / (maxChunkSize - chunkOverlap)),
          },
        });

        chunkIndex++;
      }
    }

    return chunks;
  }

  private createChunk(
    file: ObsidianFile,
    text: string,
    section: string,
    baseMetadata: DocumentMetadata,
    chunkIndex: number,
    includeContext: boolean,
    cleanContent: boolean
  ): DocumentChunk {
    const chunkId = this.generateChunkId(file.fileName, chunkIndex);

    let enhancedText = cleanContent ? cleanMarkdown(text) : text;

    if (includeContext) {
      // Add context from frontmatter and file structure
      const contextParts: string[] = [];

      if (file.frontmatter.title && file.frontmatter.title !== file.fileName) {
        contextParts.push(`Title: ${file.frontmatter.title}`);
      }

      if (file.tags?.length > 0) {
        contextParts.push(`Tags: ${file.tags.slice(0, 5).join(", ")}`);
      }

      if (file.wikilinks?.length > 0) {
        contextParts.push(`Related: ${file.wikilinks.slice(0, 3).join(", ")}`);
      }

      if (contextParts.length > 0) {
        enhancedText = `${contextParts.join(" | ")}\n\n${enhancedText}`;
      }
    }

    return {
      id: chunkId,
      text: enhancedText,
      meta: {
        ...baseMetadata,
        section,
        chunkIndex,
      },
    };
  }

  private generateChunkId(fileName: string, chunkIndex: number): string {
    const hash = generateDeterministicId(fileName, chunkIndex);
    return `obsidian_${fileName}_${chunkIndex}_${hash}`;
  }

  async validateIngestion(sampleSize = 5): Promise<{
    isValid: boolean;
    issues: string[];
    sampleResults: Array<{
      id: string;
      textPreview: string;
      hasEmbedding: boolean;
      metadataValid: boolean;
      obsidianMetadata?: any;
    }>;
  }> {
    const issues: string[] = [];
    const sampleResults: Array<{
      id: string;
      textPreview: string;
      hasEmbedding: boolean;
      metadataValid: boolean;
      obsidianMetadata?: any;
    }> = [];

    try {
      // Get database stats
      const stats = await this.db.getStats();
      console.log(`📊 Database stats:`, stats);

      if (stats.totalChunks === 0) {
        issues.push("No chunks found in database");
        return { isValid: false, issues, sampleResults };
      }

      // Test search functionality with Obsidian-specific queries
      const testQueries = [
        "design system",
        "MOC",
        "accessibility",
        "components",
      ];

      for (const query of testQueries) {
        try {
          const testEmbedding = await this.embeddings.embed(query);
          const searchResults = await this.db.search(testEmbedding, sampleSize);

          for (const result of searchResults.slice(0, 2)) {
            const metadataValid = this.validateObsidianMetadata(result.meta);
            sampleResults.push({
              id: result.id,
              textPreview: result.text.slice(0, 150) + "...",
              hasEmbedding: true,
              metadataValid,
              obsidianMetadata: result.meta.obsidianFile,
            });

            if (!metadataValid) {
              issues.push(`Invalid Obsidian metadata for chunk ${result.id}`);
            }
          }
        } catch (error) {
          issues.push(`Search test failed for query "${query}": ${error}`);
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
        sampleResults,
      };
    } catch (error) {
      issues.push(`Validation failed: ${error}`);
      return { isValid: false, issues, sampleResults };
    }
  }

  private validateObsidianMetadata(meta: any): boolean {
    const required = [
      "uri",
      "section",
      "sourceType",
      "sourceDocumentId",
      "obsidianFile",
    ];

    const hasRequired = required.every((field) =>
      Object.prototype.hasOwnProperty.call(meta, field)
    );
    const hasObsidianFields =
      meta.obsidianFile &&
      meta.obsidianFile.fileName &&
      meta.obsidianFile.filePath;

    return hasRequired && hasObsidianFields;
  }

  private generateBreadcrumbs(relativePath: string): string[] {
    const parts = relativePath
      .split(path.sep)
      .filter((part) => part && part !== ".");
    const breadcrumbs: string[] = [];

    for (let i = 0; i < parts.length - 1; i++) {
      // Exclude filename
      const segment = parts.slice(0, i + 1).join("/");
      breadcrumbs.push(segment);
    }

    return breadcrumbs;
  }
}
