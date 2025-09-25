#!/usr/bin/env tsx

/**
 * Obsidian RAG File Watcher Script
 *
 * Starts the file system watcher to monitor Obsidian vault changes
 * and automatically update the knowledge base.
 *
 * @author @darianrosebrook
 */

import { config as dotenvConfig } from "dotenv";
import { ObsidianDatabase } from "../lib/database";
import { ObsidianEmbeddingService } from "../lib/embeddings";
import { MultiModalIngestionPipeline } from "../lib/multi-modal-ingest";
import { ObsidianFileWatcher, FileWatcherOptions } from "../lib/file-watcher";

// Load environment variables
dotenvConfig();

const DATABASE_URL = process.env.DATABASE_URL;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "embeddinggemma";
const EMBEDDING_DIMENSION = parseInt(process.env.EMBEDDING_DIMENSION || "768");
const OBSIDIAN_VAULT_PATH =
  process.env.OBSIDIAN_VAULT_PATH ||
  "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault";
const WATCHER_ENABLED = process.env.FILE_WATCHER_ENABLED !== "false";
const WATCHER_BATCH_SIZE = parseInt(process.env.WATCHER_BATCH_SIZE || "10");
const WATCHER_DEBOUNCE_MS = parseInt(process.env.WATCHER_DEBOUNCE_MS || "500");
const WATCHER_BATCH_DELAY_MS = parseInt(
  process.env.WATCHER_BATCH_DELAY_MS || "2000"
);

async function main() {
  console.log("🚀 Starting Obsidian RAG File Watcher...");

  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  try {
    // Initialize database
    console.log("🔧 Initializing database connection...");
    const database = new ObsidianDatabase(DATABASE_URL);
    await database.initialize();
    console.log("✅ Database connected successfully");

    // Initialize embedding service
    console.log("🔧 Initializing embedding service...");
    const embeddingService = new ObsidianEmbeddingService({ model: EMBEDDING_MODEL });
    await embeddingService.initialize();
    console.log("✅ Embedding service initialized");

    // Initialize ingestion pipeline
    console.log("🔧 Initializing ingestion pipeline...");
    const ingestionPipeline = new MultiModalIngestionPipeline(
      database,
      embeddingService
    );
    console.log("✅ Ingestion pipeline initialized");

    // Configure file watcher options
    const watcherOptions: FileWatcherOptions = {
      vaultPath: OBSIDIAN_VAULT_PATH,
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/.obsidian/**",
        "**/.obsidian-rag/**",
        "**/*.tmp",
        "**/*.temp",
        "**/*.lock",
        "**/.*.sw[a-z]",
        "**/~backup/**",
      ],
      persistent: true,
      ignoreInitial: true,
      debounceMs: WATCHER_DEBOUNCE_MS,
      batchProcessing: true,
      batchSize: WATCHER_BATCH_SIZE,
      batchDelayMs: WATCHER_BATCH_DELAY_MS,
      enableReindexing: true,
      reindexIntervalHours: 24,
    };

    // Create and start file watcher
    console.log("🔧 Initializing file system watcher...");
    const fileWatcher = new ObsidianFileWatcher(
      database,
      embeddingService,
      ingestionPipeline,
      watcherOptions
    );

    // Set up event listeners
    fileWatcher.on("watcherReady", () => {
      console.log("✅ File system watcher is ready");
      console.log("👀 Watching for changes in:", OBSIDIAN_VAULT_PATH);
      console.log("📊 Monitoring these file types:");
      console.log("   • Markdown (.md)");
      console.log("   • Text files (.txt)");
      console.log("   • PDFs (.pdf)");
      console.log("   • Office documents (.docx, .xlsx, .pptx)");
      console.log("   • Images (.jpg, .png, .gif, .webp)");
      console.log("   • Audio files (.mp3, .wav, .flac)");
      console.log("   • Video files (.mp4, .avi, .mov)");
      console.log("   • Structured data (.json, .xml, .csv)");
    });

    fileWatcher.on("fileChange", (event) => {
      console.log(`📝 File ${event.type}: ${event.path}`);
    });

    fileWatcher.on("batchStart", (batch) => {
      console.log(
        `🚀 Processing batch ${batch.batchId}: ${batch.changes.length} files`
      );
    });

    fileWatcher.on("batchComplete", (batch) => {
      console.log(
        `✅ Batch ${batch.batchId} completed: ${batch.processedFiles}/${batch.changes.length} files processed`
      );

      if (batch.errors.length > 0) {
        console.log(`⚠️  ${batch.errors.length} errors encountered:`);
        batch.errors.forEach((error) => console.log(`   - ${error}`));
      }
    });

    fileWatcher.on("fileProcessed", (result) => {
      console.log(
        `✅ Processed: ${result.path} (${result.result.processedChunks} chunks)`
      );
    });

    fileWatcher.on("fileSkipped", (info) => {
      console.log(`⏭️  Skipped: ${info.path} (${info.reason})`);
    });

    fileWatcher.on("fileDeleted", (info) => {
      console.log(`🗑️  Deleted: ${info.path}`);
    });

    fileWatcher.on("processingError", (error) => {
      console.error(`❌ Processing error: ${error.error}`);
    });

    fileWatcher.on("watcherError", (error) => {
      console.error(`❌ Watcher error: ${error.message}`);
    });

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n🛑 Received SIGINT, shutting down gracefully...");
      await fileWatcher.stop();
      await database.close();
      console.log("✅ Shutdown complete");
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
      await fileWatcher.stop();
      await database.close();
      console.log("✅ Shutdown complete");
      process.exit(0);
    });

    // Start the watcher
    fileWatcher.start();

    console.log("\n" + "=".repeat(80));
    console.log("🎯 OBSIDIAN RAG FILE WATCHER ACTIVE");
    console.log("=".repeat(80));
    console.log("📁 Vault Path:", OBSIDIAN_VAULT_PATH);
    console.log("⚙️  Batch Size:", WATCHER_BATCH_SIZE);
    console.log("⏱️  Debounce Delay:", WATCHER_DEBOUNCE_MS + "ms");
    console.log("⏱️  Batch Delay:", WATCHER_BATCH_DELAY_MS + "ms");
    console.log("🔄 Re-indexing Interval:", "24 hours");
    console.log("=".repeat(80));

    // Keep the process running
    await new Promise(() => {}); // Never resolves, keeps process alive
  } catch (error) {
    console.error("❌ Failed to start file watcher:", error);
    process.exit(1);
  }
}

// Run the file watcher
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Unhandled error:", error);
    process.exit(1);
  });
}

export { ObsidianFileWatcher };
