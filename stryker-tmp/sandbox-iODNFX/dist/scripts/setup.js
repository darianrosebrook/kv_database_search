#!/usr/bin/env tsx
// @ts-nocheck
import dotenv from "dotenv";
import { ObsidianDatabase } from "../lib/database.js";
import { ObsidianEmbeddingService } from "../lib/embeddings.js";
// Load environment variables
dotenv.config();
const DATABASE_URL = process.env.DATABASE_URL;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "embeddinggemma";
const EMBEDDING_DIMENSION = parseInt(process.env.EMBEDDING_DIMENSION || "768");
async function main() {
    console.log("🚀 Setting up Obsidian RAG system...");
    if (!DATABASE_URL) {
        console.error("❌ DATABASE_URL environment variable is required");
        console.log("\nPlease set up your environment:");
        console.log("1. Copy env.example to .env");
        console.log("2. Update DATABASE_URL with your PostgreSQL connection string");
        console.log("3. Update OBSIDIAN_VAULT_PATH with your vault location");
        process.exit(1);
    }
    console.log(`🔗 Database: ${DATABASE_URL.replace(/\/\/.*@/, "//***@")}`);
    console.log(`🧠 Embedding model: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSION}d)`);
    try {
        // Test database connection and initialize
        console.log("\n🔧 Initializing database...");
        const database = new ObsidianDatabase(DATABASE_URL);
        await database.initialize();
        console.log("✅ Database initialized successfully");
        // Test embedding service
        console.log("\n🧠 Testing embedding service...");
        const embeddingService = new ObsidianEmbeddingService({
            model: EMBEDDING_MODEL,
            dimension: EMBEDDING_DIMENSION,
        });
        const embeddingTest = await embeddingService.testConnection();
        if (embeddingTest.success) {
            console.log(`✅ Embedding service ready (${embeddingTest.dimension}d)`);
        }
        else {
            console.error("❌ Embedding service test failed");
            console.log("\nPlease ensure:");
            console.log("1. Ollama is running (ollama serve)");
            console.log(`2. Model '${EMBEDDING_MODEL}' is available (ollama pull ${EMBEDDING_MODEL})`);
            process.exit(1);
        }
        // Check database stats
        console.log("\n📊 Checking database status...");
        const stats = await database.getStats();
        console.log(`  Total chunks: ${stats.totalChunks}`);
        if (stats.totalChunks === 0) {
            console.log("\n📄 No content found in database.");
            console.log("Run ingestion to add your Obsidian vault:");
            console.log("  npm run ingest");
        }
        else {
            console.log("  Content types:");
            Object.entries(stats.byContentType).forEach(([type, count]) => {
                console.log(`    ${type}: ${count}`);
            });
            console.log("  Folders:");
            Object.entries(stats.byFolder)
                .slice(0, 5)
                .forEach(([folder, count]) => {
                console.log(`    ${folder}: ${count}`);
            });
            if (Object.keys(stats.tagDistribution).length > 0) {
                console.log("  Top tags:");
                Object.entries(stats.tagDistribution)
                    .slice(0, 5)
                    .forEach(([tag, count]) => {
                    console.log(`    #${tag}: ${count}`);
                });
            }
        }
        console.log("\n🎉 Setup completed successfully!");
        console.log("\n💡 Next steps:");
        if (stats.totalChunks === 0) {
            console.log("  1. Ingest your Obsidian vault: npm run ingest");
            console.log("  2. Test search functionality: npm run search 'design systems'");
            console.log("  3. Start the web interface: npm run dev");
        }
        else {
            console.log("  1. Test search functionality: npm run search 'design systems'");
            console.log("  2. Start the web interface: npm run dev");
            console.log("  3. Re-ingest for updates: npm run ingest");
        }
        await database.close();
    }
    catch (error) {
        console.error("❌ Setup failed:", error);
        if (error instanceof Error) {
            if (error.message.includes("ECONNREFUSED")) {
                console.log("\n🔧 Database connection failed. Please ensure:");
                console.log("1. PostgreSQL is running");
                console.log("2. Database exists and is accessible");
                console.log("3. Connection string is correct");
            }
            else if (error.message.includes("connect ECONNREFUSED")) {
                console.log("\n🔧 Ollama connection failed. Please ensure:");
                console.log("1. Ollama is installed and running (ollama serve)");
                console.log(`2. Model is available (ollama pull ${EMBEDDING_MODEL})`);
            }
        }
        process.exit(1);
    }
}
// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Obsidian RAG Setup Tool

Usage: tsx src/scripts/setup.ts

This script will:
1. Test database connection and initialize tables
2. Test embedding service (Ollama) connection
3. Display current system status
4. Provide next steps for getting started

Environment Variables Required:
  DATABASE_URL           PostgreSQL connection string
  OBSIDIAN_VAULT_PATH    Path to your Obsidian vault
  EMBEDDING_MODEL        Ollama model name (default: embeddinggemma)
  EMBEDDING_DIMENSION    Embedding dimension (default: 768)
`);
    process.exit(0);
}
// Run the main function
main().catch((error) => {
    console.error("❌ Unhandled error:", error);
    process.exit(1);
});
