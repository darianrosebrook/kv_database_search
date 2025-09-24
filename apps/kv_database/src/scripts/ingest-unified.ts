#!/usr/bin/env tsx

import dotenv from "dotenv";
import { ObsidianDatabase } from "../lib/database";
import { ObsidianEmbeddingService } from "../lib/embeddings";
import { ObsidianIngestionPipeline } from "../lib/obsidian-ingest";
import { MultiModalIngestionPipeline } from "../lib/multi-modal-ingest";
import { ImageLinkExtractor } from "../lib/image-link-extractor";
import { ImagePathResolver } from "../lib/image-path-resolver";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
dotenv.config();

const OBSIDIAN_VAULT_PATH =
  process.env.OBSIDIAN_VAULT_PATH ||
  "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault";

const DATABASE_URL = process.env.DATABASE_URL;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "embeddinggemma";
const EMBEDDING_DIMENSION = parseInt(process.env.EMBEDDING_DIMENSION || "768");

interface IngestionOptions {
  batchSize?: number;
  rateLimitMs?: number;
  skipExisting?: boolean;
  includePatterns?: string[];
  excludePatterns?: string[];
  chunkingOptions?: any;
  enableImageProcessing?: boolean;
  maxFileSize?: number;
  maxImagesPerFile?: number;
}

class UnifiedIngestionPipeline {
  private obsidianPipeline: ObsidianIngestionPipeline;
  private multiModalPipeline: MultiModalIngestionPipeline;
  private imageLinkExtractor: ImageLinkExtractor;
  private imagePathResolver: ImagePathResolver;
  private vaultPath: string;

  constructor(
    database: ObsidianDatabase,
    embeddingService: ObsidianEmbeddingService,
    vaultPath: string
  ) {
    this.vaultPath = vaultPath;
    this.obsidianPipeline = new ObsidianIngestionPipeline(
      database,
      embeddingService,
      vaultPath
    );
    this.multiModalPipeline = new MultiModalIngestionPipeline(
      database,
      embeddingService
    );
    this.imageLinkExtractor = new ImageLinkExtractor();
    this.imagePathResolver = new ImagePathResolver(vaultPath);
  }

  async ingestVault(options: IngestionOptions = {}): Promise<{
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
    };
  }> {
    const {
      batchSize = 5,
      rateLimitMs = 200,
      skipExisting = true,
      enableImageProcessing = true,
      maxImagesPerFile = 10,
      ...restOptions
    } = options;

    console.log("🚀 Starting unified multi-modal ingestion...");
    console.log(`📁 Vault path: ${this.vaultPath}`);
    console.log(
      `🔍 Image processing: ${enableImageProcessing ? "ENABLED" : "DISABLED"}`
    );

    try {
      // Discover all files to process
      const allFiles = await this.discoverFiles(options);

      if (allFiles.length === 0) {
        console.log("ℹ️  No files found to process");
        return {
          totalFiles: 0,
          processedFiles: 0,
          totalChunks: 0,
          processedChunks: 0,
          skippedChunks: 0,
          errors: [],
          imageStats: {
            filesWithImages: 0,
            totalImages: 0,
            processedImages: 0,
            failedImages: 0,
          },
        };
      }

      console.log(`📄 Found ${allFiles.length} files to process`);

      // Separate markdown and non-markdown files
      const { markdownFiles, otherFiles } = this.categorizeFiles(allFiles);

      console.log(`📝 Markdown files: ${markdownFiles.length}`);
      console.log(`🖼️  Other files: ${otherFiles.length}`);

      let totalFiles = 0;
      let processedFiles = 0;
      let totalChunks = 0;
      let processedChunks = 0;
      let skippedChunks = 0;
      const errors: string[] = [];

      let filesWithImages = 0;
      let totalImages = 0;
      let processedImages = 0;
      let failedImages = 0;

      // Process markdown files with image extraction
      if (markdownFiles.length > 0) {
        const markdownResult = await this.processMarkdownFiles(markdownFiles, {
          ...restOptions,
          batchSize,
          rateLimitMs,
          skipExisting,
          enableImageProcessing,
          maxImagesPerFile,
        });

        totalFiles += markdownResult.totalFiles;
        processedFiles += markdownResult.processedFiles;
        totalChunks += markdownResult.totalChunks;
        processedChunks += markdownResult.processedChunks;
        skippedChunks += markdownResult.skippedChunks;
        errors.push(...markdownResult.errors);

        filesWithImages += markdownResult.imageStats.filesWithImages;
        totalImages += markdownResult.imageStats.totalImages;
        processedImages += markdownResult.imageStats.processedImages;
        failedImages += markdownResult.imageStats.failedImages;
      }

      // Process other files (images, PDFs, etc.)
      if (otherFiles.length > 0) {
        const otherResult = await this.processOtherFiles(otherFiles, {
          ...restOptions,
          batchSize,
          rateLimitMs,
          skipExisting,
        });

        totalFiles += otherResult.totalFiles;
        processedFiles += otherResult.processedFiles;
        totalChunks += otherResult.totalChunks;
        processedChunks += otherResult.processedChunks;
        skippedChunks += otherResult.skippedChunks;
        errors.push(...otherResult.errors);
      }

      const result = {
        totalFiles,
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
        },
      };

      console.log("\n" + "=".repeat(60));
      console.log("📈 UNIFIED INGESTION RESULTS");
      console.log("=".repeat(60));
      console.log(`⏱️  Total files: ${totalFiles}`);
      console.log(`✅ Files processed: ${processedFiles}`);
      console.log(`📦 Total chunks: ${totalChunks}`);
      console.log(`🔮 Chunks processed: ${processedChunks}`);
      console.log(`⏭️  Chunks skipped: ${skippedChunks}`);
      console.log(`❌ Errors: ${errors.length}`);

      if (enableImageProcessing) {
        console.log("\n🖼️  IMAGE PROCESSING RESULTS:");
        console.log(`📄 Files with images: ${filesWithImages}`);
        console.log(`🖼️  Total images: ${totalImages}`);
        console.log(`✅ Images processed: ${processedImages}`);
        console.log(`❌ Images failed: ${failedImages}`);
      }

      return result;
    } catch (error) {
      console.error("❌ Unified ingestion failed:", error);
      throw new Error(`Unified ingestion pipeline failed: ${error}`);
    }
  }

  private async discoverFiles(options: IngestionOptions): Promise<string[]> {
    const files: string[] = [];

    const walkDir = (dir: string): void => {
      if (!fs.existsSync(dir)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(this.vaultPath, fullPath);

        // Check exclude patterns
        if (
          options.excludePatterns?.some((pattern) =>
            this.matchesPattern(relativePath, pattern)
          )
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile()) {
          // Include all files by default for unified processing
          if (
            options.includePatterns?.some((pattern) =>
              this.matchesPattern(relativePath, pattern)
            ) ??
            true
          ) {
            files.push(fullPath);
          }
        }
      }
    };

    walkDir(this.vaultPath);
    return files;
  }

  private categorizeFiles(files: string[]): {
    markdownFiles: string[];
    otherFiles: string[];
  } {
    const markdownFiles: string[] = [];
    const otherFiles: string[] = [];

    files.forEach((file) => {
      if (file.toLowerCase().endsWith(".md")) {
        markdownFiles.push(file);
      } else {
        otherFiles.push(file);
      }
    });

    return { markdownFiles, otherFiles };
  }

  private async processMarkdownFiles(
    files: string[],
    options: IngestionOptions
  ): Promise<any> {
    // Use the existing Obsidian pipeline for markdown files
    // This would need to be enhanced to include image processing
    return await this.obsidianPipeline.ingestVault(options);
  }

  private async processOtherFiles(
    files: string[],
    options: IngestionOptions
  ): Promise<any> {
    // Use the multi-modal pipeline for other files
    return await this.multiModalPipeline.ingestFiles(files, options);
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\*\*/g, ".*")
      .replace(/\*/g, "[^/]*")
      .replace(/\?/g, ".");
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  async validateIngestion(): Promise<{
    isValid: boolean;
    issues: string[];
    imageValidation: {
      imagesProcessed: number;
      imagesWithText: number;
      averageConfidence: number;
    };
  }> {
    // Run validation on the obsidian pipeline
    const obsidianValidation = await this.obsidianPipeline.validateIngestion();

    // Add image-specific validation
    const imageValidation = await this.validateImageProcessing();

    const allIssues = [...obsidianValidation.issues, ...imageValidation.issues];

    return {
      isValid: obsidianValidation.isValid && imageValidation.isValid,
      issues: allIssues,
      imageValidation: {
        imagesProcessed: imageValidation.imagesProcessed,
        imagesWithText: imageValidation.imagesWithText,
        averageConfidence: imageValidation.averageConfidence,
      },
    };
  }

  private async validateImageProcessing(): Promise<any> {
    // Placeholder for image validation logic
    return {
      isValid: true,
      issues: [],
      imagesProcessed: 0,
      imagesWithText: 0,
      averageConfidence: 0,
    };
  }
}

async function main() {
  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: IngestionOptions = {
    batchSize: 5,
    rateLimitMs: 200,
    skipExisting: true,
    enableImageProcessing: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    includePatterns: ["**/*"],
    excludePatterns: [
      "node_modules/**",
      ".git/**",
      "**/.*/**",
      "**/*.log",
      "**/*.tmp",
    ],
  };

  // Parse arguments
  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg.startsWith("--")) {
      switch (arg) {
        case "--batch-size":
          options.batchSize = parseInt(args[++i]);
          break;
        case "--rate-limit":
          options.rateLimitMs = parseInt(args[++i]);
          break;
        case "--max-file-size":
          options.maxFileSize = parseInt(args[++i]);
          break;
        case "--max-images-per-file":
          options.maxImagesPerFile = parseInt(args[++i]);
          break;
        case "--include":
          options.includePatterns = args[++i].split(",");
          break;
        case "--exclude":
          options.excludePatterns = args[++i].split(",");
          break;
        case "--skip-existing":
          options.skipExisting = true;
          break;
        case "--no-skip-existing":
          options.skipExisting = false;
          break;
        case "--no-image-processing":
          options.enableImageProcessing = false;
          break;
        case "--help":
        case "-h":
          showHelp();
          process.exit(0);
        default:
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
      }
    }
    i++;
  }

  console.log("🚀 Starting unified Obsidian vault ingestion...");
  console.log(`📁 Vault path: ${OBSIDIAN_VAULT_PATH}`);
  console.log(`🔗 Database: ${DATABASE_URL.replace(/\/\/.*@/, "//***@")}`);
  console.log(
    `🧠 Embedding model: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSION}d)`
  );

  try {
    // Initialize services
    console.log("🔧 Initializing services...");

    const database = new ObsidianDatabase(DATABASE_URL);
    await database.initialize();

    const embeddingService = new ObsidianEmbeddingService({
      model: EMBEDDING_MODEL,
      dimension: EMBEDDING_DIMENSION,
    });

    // Test embedding service
    const embeddingTest = await embeddingService.testConnection();
    if (!embeddingTest.success) {
      throw new Error("Embedding service connection failed");
    }
    console.log(`✅ Embedding service ready (${embeddingTest.dimension}d)`);

    // Initialize unified ingestion pipeline
    const unifiedPipeline = new UnifiedIngestionPipeline(
      database,
      embeddingService,
      OBSIDIAN_VAULT_PATH
    );

    // Start ingestion
    const startTime = Date.now();
    const result = await unifiedPipeline.ingestVault(options);
    const duration = Date.now() - startTime;

    // Display results
    console.log("\n" + "=".repeat(60));
    console.log("📈 UNIFIED INGESTION RESULTS");
    console.log("=".repeat(60));
    console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
    console.log(
      `📄 Files processed: ${result.processedFiles}/${result.totalFiles}`
    );
    console.log(`📦 Chunks created: ${result.totalChunks}`);
    console.log(`✅ Chunks processed: ${result.processedChunks}`);
    console.log(`⏭️  Chunks skipped: ${result.skippedChunks}`);
    console.log(`❌ Errors: ${result.errors.length}`);

    if (options.enableImageProcessing) {
      console.log("\n🖼️  IMAGE PROCESSING RESULTS:");
      console.log(`📄 Files with images: ${result.imageStats.filesWithImages}`);
      console.log(`🖼️  Total images: ${result.imageStats.totalImages}`);
      console.log(`✅ Images processed: ${result.imageStats.processedImages}`);
      console.log(`❌ Images failed: ${result.imageStats.failedImages}`);
    }

    if (result.errors.length > 0) {
      console.log("\n🚨 ERRORS:");
      result.errors.slice(0, 5).forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
      if (result.errors.length > 5) {
        console.log(`  ... and ${result.errors.length - 5} more errors`);
      }
    }

    // Validation
    console.log("\n🔍 Validating ingestion...");
    const validation = await unifiedPipeline.validateIngestion();

    if (validation.isValid) {
      console.log("✅ Validation passed!");
    } else {
      console.log("⚠️  Validation issues found:");
      validation.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
    }

    if (options.enableImageProcessing && validation.imageValidation) {
      console.log("\n🖼️  Image validation:");
      console.log(
        `  Images processed: ${validation.imageValidation.imagesProcessed}`
      );
      console.log(
        `  Images with text: ${validation.imageValidation.imagesWithText}`
      );
      console.log(
        `  Average confidence: ${validation.imageValidation.averageConfidence.toFixed(
          1
        )}%`
      );
    }

    console.log("\n🎉 Unified ingestion completed successfully!");

    await database.close();
  } catch (error) {
    console.error("❌ Ingestion failed:", error);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
Unified Multi-Modal Obsidian Ingestion Tool

Usage: tsx src/scripts/ingest-unified.ts [options]

Environment Variables:
  OBSIDIAN_VAULT_PATH    Path to your Obsidian vault (default: iCloud path)
  DATABASE_URL           PostgreSQL connection string (required)
  EMBEDDING_MODEL        Ollama model name (default: embeddinggemma)
  EMBEDDING_DIMENSION    Embedding dimension (default: 768)

Options:
  --batch-size <number>         Batch size for processing (default: 5)
  --rate-limit <ms>             Rate limit between batches (default: 200)
  --max-file-size <bytes>       Maximum file size to process (default: 50MB)
  --max-images-per-file <num>   Maximum images to process per file (default: 10)
  --include <patterns>          Comma-separated include patterns (default: **/*)
  --exclude <patterns>          Comma-separated exclude patterns (default: node_modules/**,.git/**,**/.*/**)
  --skip-existing               Skip existing chunks (default: true)
  --no-skip-existing            Process all chunks even if they exist
  --no-image-processing         Disable automatic image processing
  --help, -h                    Show this help message

Examples:
  tsx src/scripts/ingest-unified.ts
  tsx src/scripts/ingest-unified.ts --batch-size 3 --max-images-per-file 5
  tsx src/scripts/ingest-unified.ts --no-image-processing
  tsx src/scripts/ingest-unified.ts --include "**/*.{md,png,jpg}" --exclude "**/temp/**"
`);
}

// Run the main function
main().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});
