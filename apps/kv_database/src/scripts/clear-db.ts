#!/usr/bin/env tsx

import * as dotenv from "dotenv";
import { DocumentDatabase } from "../lib/database";
import * as readline from "readline";

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  // Check for force flag
  const args = process.argv.slice(2);
  const forceMode = args.includes("-f") || args.includes("--force");

  if (!forceMode) {
    console.log("🧹 Database Clear Tool");
    console.log(
      "⚠️  This will delete ALL chunks and embeddings from the database"
    );
    console.log("⚠️  This action CANNOT be undone!");
    console.log("");

    // Create readline interface for user input
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const confirmation = await new Promise<string>((resolve) => {
      rl.question('Type "clear all" to continue: ', (answer) => {
        rl.close();
        resolve(answer.toLowerCase().trim());
      });
    });

    if (confirmation !== "clear all") {
      console.log(
        "❌ Operation cancelled. Type exactly 'clear all' to proceed."
      );
      process.exit(0);
    }
  }

  console.log("🧹 Clearing database...");
  console.log(`🔗 Database: ${DATABASE_URL.replace(/\/\/.*@/, "//***@")}`);

  try {
    // Initialize database
    const database = new DocumentDatabase(DATABASE_URL, "obsidian_chunks");
    await database.initialize();

    // Clear all data
    await database.clearAll();

    console.log("✅ Database cleared successfully!");

    await database.close();
  } catch (error) {
    console.error("❌ Failed to clear database:", error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Database Clear Tool

Usage: tsx src/scripts/clear-db.ts [options]

Environment Variables:
  DATABASE_URL    PostgreSQL connection string (required)

Options:
  --help, -h      Show this help message
  -f, --force     Force clear without confirmation prompt

Description:
  Clears all chunks and embeddings from the Obsidian RAG database.

  ⚠️  WARNING: This will permanently delete all data!

  Without -f flag: Requires typing "clear all" to proceed
  With -f flag: Skips the confirmation prompt (for scripts/CI)

Example:
  export DATABASE_URL="postgresql://user:pass@localhost:5432/obsidian_rag"
  tsx src/scripts/clear-db.ts          # Requires "clear all" confirmation
  tsx src/scripts/clear-db.ts -f      # Force clear without prompt

Note: For npm scripts with arguments, use:
  npx tsx src/scripts/clear-db.ts -f  # Instead of npm run clear-db -f
`);
  process.exit(0);
}

// Run the main function
main().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});
