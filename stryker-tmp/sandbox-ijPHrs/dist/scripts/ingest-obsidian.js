#!/usr/bin/env tsx
// @ts-nocheck
import dotenv from "dotenv";
import { ObsidianDatabase } from "../lib/database.js";
import { ObsidianEmbeddingService } from "../lib/embeddings.js";
import { ObsidianIngestionPipeline } from "../lib/obsidian-ingest.js";
// Load environment variables
dotenv.config();
const OBSIDIAN_VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH ||
    "/Users/drosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault";
const DATABASE_URL = process.env.DATABASE_URL;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "embeddinggemma";
const EMBEDDING_DIMENSION = parseInt(process.env.EMBEDDING_DIMENSION || "768");
async function main() {
    if (!DATABASE_URL) {
        console.error("❌ DATABASE_URL environment variable is required");
        process.exit(1);
    }
    console.log("🚀 Starting Obsidian vault ingestion...");
    console.log(`📁 Vault path: ${OBSIDIAN_VAULT_PATH}`);
    console.log(`🔗 Database: ${DATABASE_URL.replace(/\/\/.*@/, "//***@")}`);
    console.log(`🧠 Embedding model: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSION}d)`);
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
        // Initialize Obsidian ingestion pipeline
        const obsidianPipeline = new ObsidianIngestionPipeline(database, embeddingService, OBSIDIAN_VAULT_PATH);
        // Configure ingestion options
        const ingestionOptions = {
            batchSize: 3, // Small batches for Obsidian files
            rateLimitMs: 300, // Be gentle with the embedding service
            skipExisting: true,
            includePatterns: ["**/*.md"],
            excludePatterns: [
                "**/.obsidian/**",
                "**/node_modules/**",
                "**/.git/**",
                "**/Attachments/**", // Skip binary attachments
                "**/assets/**", // Skip asset files
                "**/wp-content/**", // Skip WordPress content
            ],
            chunkingOptions: {
                maxChunkSize: 800, // Smaller chunks for better semantic search
                chunkOverlap: 100,
                preserveStructure: true, // Respect Obsidian's heading structure
                includeContext: true, // Include frontmatter and wikilink context
                cleanContent: true, // Clean markdown for better embeddings
            },
        };
        console.log("📊 Ingestion configuration:", {
            batchSize: ingestionOptions.batchSize,
            maxChunkSize: ingestionOptions.chunkingOptions.maxChunkSize,
            preserveStructure: ingestionOptions.chunkingOptions.preserveStructure,
            includeContext: ingestionOptions.chunkingOptions.includeContext,
            cleanContent: ingestionOptions.chunkingOptions.cleanContent,
        });
        // Start ingestion
        const startTime = Date.now();
        const result = await obsidianPipeline.ingestVault(ingestionOptions);
        const duration = Date.now() - startTime;
        // Display results
        console.log("\n" + "=".repeat(60));
        console.log("📈 OBSIDIAN INGESTION RESULTS");
        console.log("=".repeat(60));
        console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
        console.log(`📄 Files processed: ${result.processedFiles}/${result.totalFiles}`);
        console.log(`📦 Chunks created: ${result.totalChunks}`);
        console.log(`✅ Chunks processed: ${result.processedChunks}`);
        console.log(`⏭️  Chunks skipped: ${result.skippedChunks}`);
        console.log(`❌ Errors: ${result.errors.length}`);
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
        const validation = await obsidianPipeline.validateIngestion(10);
        if (validation.isValid) {
            console.log("✅ Validation passed!");
        }
        else {
            console.log("⚠️  Validation issues found:");
            validation.issues.forEach((issue, i) => {
                console.log(`  ${i + 1}. ${issue}`);
            });
        }
        // Sample results
        if (validation.sampleResults.length > 0) {
            console.log("\n📋 Sample results:");
            validation.sampleResults.slice(0, 3).forEach((sample, i) => {
                console.log(`  ${i + 1}. ${sample.id}`);
                console.log(`     Text: ${sample.textPreview}`);
                console.log(`     Valid: ${sample.metadataValid ? "✅" : "❌"}`);
                if (sample.obsidianMetadata) {
                    console.log(`     File: ${sample.obsidianMetadata.fileName}`);
                    console.log(`     Tags: ${sample.obsidianMetadata.tags?.slice(0, 3).join(", ") || "none"}`);
                }
                console.log("");
            });
        }
        // Database statistics
        const dbStats = await database.getStats();
        console.log("\n📊 Database statistics:");
        console.log(`  Total chunks: ${dbStats.totalChunks}`);
        console.log("  By content type:");
        Object.entries(dbStats.byContentType).forEach(([type, count]) => {
            console.log(`    ${type}: ${count}`);
        });
        console.log("  By folder:");
        Object.entries(dbStats.byFolder)
            .slice(0, 5)
            .forEach(([folder, count]) => {
            console.log(`    ${folder}: ${count}`);
        });
        console.log("  Top tags:");
        Object.entries(dbStats.tagDistribution)
            .slice(0, 5)
            .forEach(([tag, count]) => {
            console.log(`    #${tag}: ${count}`);
        });
        // Test search functionality
        console.log("\n🔍 Testing search functionality...");
        const testQueries = [
            "design systems holistic requirements",
            "MOC maps of content",
            "accessibility guidelines",
            "AI chat conversations",
            "design thinking process",
        ];
        for (const query of testQueries) {
            try {
                const queryEmbedding = await embeddingService.embed(query);
                const searchResults = await database.search(queryEmbedding, 3);
                console.log(`\n  Query: "${query}"`);
                console.log(`  Results: ${searchResults.length}`);
                if (searchResults.length > 0) {
                    const topResult = searchResults[0];
                    console.log(`    Top: ${topResult.meta.section} (${(topResult.cosineSimilarity * 100).toFixed(1)}%)`);
                    console.log(`    File: ${topResult.meta.obsidianFile?.fileName || "unknown"}`);
                    console.log(`    Type: ${topResult.meta.contentType}`);
                    if (topResult.meta.obsidianFile?.tags?.length) {
                        console.log(`    Tags: ${topResult.meta.obsidianFile.tags
                            .slice(0, 3)
                            .join(", ")}`);
                    }
                }
            }
            catch (error) {
                console.log(`  ❌ Search failed for "${query}": ${error}`);
            }
        }
        console.log("\n🎉 Obsidian ingestion completed successfully!");
        console.log("\n💡 Next steps:");
        console.log("  1. Run search queries: tsx src/scripts/search.ts");
        console.log("  2. Start the web interface: npm run dev");
        console.log("  3. Set up periodic re-ingestion for updated files");
        console.log("  4. Explore knowledge clusters and connections");
        await database.close();
    }
    catch (error) {
        console.error("❌ Ingestion failed:", error);
        process.exit(1);
    }
}
// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Obsidian Vault Ingestion Tool

Usage: tsx src/scripts/ingest-obsidian.ts [options]

Environment Variables:
  OBSIDIAN_VAULT_PATH    Path to your Obsidian vault (default: iCloud path)
  DATABASE_URL           PostgreSQL connection string (required)
  EMBEDDING_MODEL        Ollama model name (default: embeddinggemma)
  EMBEDDING_DIMENSION    Embedding dimension (default: 768)

Options:
  --help, -h             Show this help message

Example:
  export DATABASE_URL="postgresql://user:pass@localhost:5432/obsidian_rag"
  export OBSIDIAN_VAULT_PATH="/path/to/your/vault"
  tsx src/scripts/ingest-obsidian.ts
`);
    process.exit(0);
}
// Run the main function
main().catch((error) => {
    console.error("❌ Unhandled error:", error);
    process.exit(1);
});
