#!/usr/bin/env tsx

import { ObsidianDatabase } from "../lib/database";
import { ObsidianEmbeddingService } from "../lib/embeddings";
import { MultiModalIngestionPipeline } from "../lib/multi-modal-ingest";
import * as fs from "fs";
import * as path from "path";

/**
 * Multi-modal ingestion script
 * Ingests various file types beyond just Markdown
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: npm run ingest-multi-modal <paths...> [options]

Arguments:
  <paths...>    File paths or directories to ingest

Options:
  --db-url <url>           Database URL (default: from env)
  --embedding-model <model> Embedding model (default: from env)
  --batch-size <number>    Batch size (default: 5)
  --rate-limit <ms>        Rate limit between batches (default: 200)
  --skip-existing          Skip existing chunks (default: true)
  --max-file-size <bytes>  Maximum file size (default: 50MB)
  --include <patterns>     Comma-separated include patterns (default: **/*)
  --exclude <patterns>     Comma-separated exclude patterns (default: node_modules/**,.git/**,**/.*/**)

Examples:
  npm run ingest-multi-modal ./documents/
  npm run ingest-multi-modal file1.pdf file2.docx --batch-size 3
  npm run ingest-multi-modal ./mixed-files/ --include "**/*.{pdf,docx,txt}" --exclude "**/temp/**"
`);
    process.exit(1);
  }

  // Parse arguments
  const filePaths: string[] = [];
  const options: any = {
    batchSize: 5,
    rateLimitMs: 200,
    skipExisting: true,
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

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg.startsWith("--")) {
      switch (arg) {
        case "--db-url":
          options.databaseUrl = args[++i];
          break;
        case "--embedding-model":
          options.embeddingModel = args[++i];
          break;
        case "--batch-size":
          options.batchSize = parseInt(args[++i]);
          break;
        case "--rate-limit":
          options.rateLimitMs = parseInt(args[++i]);
          break;
        case "--max-file-size":
          options.maxFileSize = parseInt(args[++i]);
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
        default:
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
      }
    } else {
      filePaths.push(arg);
    }
    i++;
  }

  // Environment variables
  const databaseUrl = options.databaseUrl || process.env.DATABASE_URL;
  const embeddingModel =
    options.embeddingModel || process.env.EMBEDDING_MODEL || "embeddinggemma";
  const embeddingDimension = parseInt(process.env.EMBEDDING_DIMENSION || "768");

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  try {
    // Initialize services
    console.log("🔧 Initializing services...");
    const database = new ObsidianDatabase(databaseUrl);
    await database.initialize();

    const embeddings = new ObsidianEmbeddingService({
      model: embeddingModel,
      dimension: embeddingDimension,
    });

    const ingestionPipeline = new MultiModalIngestionPipeline(
      database,
      embeddings
    );

    // Discover all files to process
    console.log("🔍 Discovering files...");
    const filesToProcess = await discoverFiles(filePaths, {
      includePatterns: options.includePatterns,
      excludePatterns: options.excludePatterns,
    });

    if (filesToProcess.length === 0) {
      console.log("ℹ️  No files found to process");
      return;
    }

    console.log(`📄 Found ${filesToProcess.length} files to process`);

    // Show file type breakdown
    const typeBreakdown = getContentTypeBreakdown(filesToProcess);
    console.log("📊 Content type breakdown:");
    Object.entries(typeBreakdown).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} files`);
    });

    // Confirm before processing
    console.log("\n⚠️  This will process files and may take some time.");
    console.log("Press Ctrl+C to cancel...");

    // Add a small delay to allow cancellation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Process files
    const result = await ingestionPipeline.ingestFiles(filesToProcess, {
      batchSize: options.batchSize,
      rateLimitMs: options.rateLimitMs,
      skipExisting: options.skipExisting,
      maxFileSize: options.maxFileSize,
    });

    // Display results
    console.log("\n🎉 Multi-modal ingestion completed!");
    console.log(`📊 Results:`);
    console.log(`  Total files: ${result.totalFiles}`);
    console.log(`  Processed: ${result.processedFiles}`);
    console.log(`  Skipped: ${result.skippedFiles}`);
    console.log(`  Failed: ${result.failedFiles}`);
    console.log(`  Total chunks: ${result.totalChunks}`);
    console.log(`  Processed chunks: ${result.processedChunks}`);

    console.log(`\n📈 Content type statistics:`);
    Object.entries(result.contentTypeStats).forEach(([type, count]) => {
      if (count > 0) {
        console.log(`  ${type}: ${count} files`);
      }
    });

    if (result.errors.length > 0) {
      console.log(`\n❌ Errors encountered (${result.errors.length}):`);
      result.errors.slice(0, 10).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });

      if (result.errors.length > 10) {
        console.log(`  ... and ${result.errors.length - 10} more errors`);
      }
    }

    // Validate ingestion
    console.log("\n🔍 Validating ingestion...");
    const validation = await validateIngestion(
      database,
      result.processedChunks
    );
    console.log(`✅ Validation: ${validation.isValid ? "PASSED" : "FAILED"}`);

    if (!validation.isValid && validation.errors.length > 0) {
      console.log("❌ Validation errors:");
      validation.errors.forEach((error) => console.log(`  - ${error}`));
    }
  } catch (error) {
    console.error("❌ Multi-modal ingestion failed:", error);
    process.exit(1);
  }
}

/**
 * Discover files to process from given paths
 */
async function discoverFiles(
  inputPaths: string[],
  options: {
    includePatterns: string[];
    excludePatterns: string[];
  }
): Promise<string[]> {
  const files: string[] = [];

  for (const inputPath of inputPaths) {
    if (fs.existsSync(inputPath)) {
      const stat = fs.statSync(inputPath);

      if (stat.isDirectory()) {
        // Walk directory
        await walkDirectory(inputPath, files, options);
      } else if (stat.isFile()) {
        // Single file
        if (shouldIncludeFile(inputPath, options)) {
          files.push(inputPath);
        }
      }
    } else {
      console.warn(`⚠️  Path does not exist: ${inputPath}`);
    }
  }

  return files;
}

/**
 * Recursively walk directory to find files
 */
async function walkDirectory(
  dirPath: string,
  files: string[],
  options: {
    includePatterns: string[];
    excludePatterns: string[];
  }
): Promise<void> {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(process.cwd(), fullPath);

    // Check exclude patterns
    if (
      options.excludePatterns.some((pattern) =>
        matchesPattern(relativePath, pattern)
      )
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      await walkDirectory(fullPath, files, options);
    } else if (entry.isFile()) {
      if (shouldIncludeFile(relativePath, options)) {
        files.push(fullPath);
      }
    }
  }
}

/**
 * Check if file should be included based on patterns
 */
function shouldIncludeFile(
  filePath: string,
  options: {
    includePatterns: string[];
    excludePatterns: string[];
  }
): boolean {
  // Check exclude patterns first
  if (
    options.excludePatterns.some((pattern) => matchesPattern(filePath, pattern))
  ) {
    return false;
  }

  // Check include patterns
  return options.includePatterns.some((pattern) =>
    matchesPattern(filePath, pattern)
  );
}

/**
 * Simple pattern matching (supports ** and *)
 */
function matchesPattern(filePath: string, pattern: string): boolean {
  const regexPattern = pattern
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, ".");
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(filePath);
}

/**
 * Get content type breakdown for display
 */
function getContentTypeBreakdown(files: string[]): Record<string, number> {
  const breakdown: Record<string, number> = {};

  files.forEach((file) => {
    const ext = path.extname(file).toLowerCase();
    const type = getContentTypeFromExtension(ext);
    breakdown[type] = (breakdown[type] || 0) + 1;
  });

  return breakdown;
}

/**
 * Map file extension to content type for display
 */
function getContentTypeFromExtension(ext: string): string {
  const extMap: Record<string, string> = {
    ".md": "Markdown",
    ".txt": "Text",
    ".pdf": "PDF",
    ".docx": "Word Document",
    ".doc": "Word Document",
    ".xlsx": "Excel Spreadsheet",
    ".xls": "Excel Spreadsheet",
    ".pptx": "PowerPoint",
    ".ppt": "PowerPoint",
    ".jpg": "Image",
    ".jpeg": "Image",
    ".png": "Image",
    ".gif": "Image",
    ".mp3": "Audio",
    ".wav": "Audio",
    ".mp4": "Video",
    ".avi": "Video",
    ".json": "JSON",
    ".xml": "XML",
    ".csv": "CSV",
  };

  return extMap[ext] || "Other";
}

/**
 * Validate ingestion results
 */
async function validateIngestion(
  database: ObsidianDatabase,
  expectedChunks: number
): Promise<{ isValid: boolean; errors: string[] }> {
  try {
    const stats = await database.getStats();
    const errors: string[] = [];

    if (stats.totalChunks === 0) {
      errors.push("No chunks found in database");
    }

    // Check that we have some chunks with multi-modal metadata
    const sampleChunks = await database.search(new Array(768).fill(0), 5);
    const hasMultiModal = sampleChunks.some(
      (chunk) => chunk.meta.multiModalFile !== undefined
    );

    if (!hasMultiModal && expectedChunks > 0) {
      errors.push("No multi-modal chunks found - ingestion may have failed");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation failed: ${error}`],
    };
  }
}

// Run the script
main().catch(console.error);
