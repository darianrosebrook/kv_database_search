#!/usr/bin/env tsx

/**
 * Obsidian RAG Setup Script
 *
 * Interactive setup script to configure and test all components
 * for the Obsidian RAG system.
 *
 * @author @darianrosebrook
 */

import { config as dotenvConfig } from "dotenv";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { ObsidianDatabase } from "../lib/database";
import { ObsidianEmbeddingService } from "../lib/embeddings";

// Load environment variables
dotenvConfig();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const DATABASE_URL = process.env.DATABASE_URL;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "embeddinggemma";
const EMBEDDING_DIMENSION = parseInt(process.env.EMBEDDING_DIMENSION || "768");
const OBSIDIAN_VAULT_PATH =
  process.env.OBSIDIAN_VAULT_PATH ||
  "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault";

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function logStep(step: number, message: string) {
  console.log(`\n📋 Step ${step}: ${message}`);
}

function logSuccess(message: string) {
  console.log(`✅ ${message}`);
}

function logError(message: string, hint?: string) {
  console.log(`❌ ${message}`);
  if (hint) {
    console.log(`💡 ${hint}`);
  }
}

function logWarning(message: string, hint?: string) {
  console.log(`⚠️  ${message}`);
  if (hint) {
    console.log(`💡 ${hint}`);
  }
}

async function main() {
  console.log("🚀 Obsidian RAG Setup Wizard");
  console.log("=".repeat(50));
  console.log(
    "This script will help you configure and test your Obsidian RAG system."
  );
  console.log("Press Ctrl+C at any time to exit.\n");

  logStep(1, "Environment Configuration");

  if (!DATABASE_URL) {
    logError("DATABASE_URL environment variable is required");
    console.log("\nPlease set up your environment:");
    console.log("1. Copy env.example to .env");
    console.log("2. Edit .env file with your database connection");
    console.log("3. Run this setup script again");
    process.exit(1);
  }

  // Check if .env exists and show current configuration
  console.log("Current Configuration:");
  console.log(
    `   🗄️  Database: ${DATABASE_URL ? "✅ Configured" : "❌ Missing"}`
  );
  console.log(`   🤖 Embedding: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSION}d)`);
  console.log(`   📁 Vault Path: ${OBSIDIAN_VAULT_PATH}`);

  const updateConfig = await ask(
    "\nWould you like to update any configuration? (y/n): "
  );
  if (updateConfig.toLowerCase() === "y") {
    await updateConfiguration();
  }

  logStep(2, "Testing Database Connection");
  await testDatabase();

  logStep(3, "Testing Embedding Service");
  await testEmbeddings();

  logStep(4, "Testing Obsidian Vault");
  await testVault();

  logStep(5, "Final Setup");
  console.log("\n🎉 Setup Complete!");
  console.log("You can now start the server with:");
  console.log("   npm run server");
  console.log("   or");
  console.log("   npx tsx src/server.ts");

  rl.close();
}

async function updateConfiguration() {
  console.log("\n📝 Updating Configuration...");

  const newDbUrl =
    (await ask(`Database URL [${DATABASE_URL}]: `)) || DATABASE_URL!;
  const newModel =
    (await ask(`Embedding Model [${EMBEDDING_MODEL}]: `)) || EMBEDDING_MODEL;
  const newDimension =
    (await ask(`Embedding Dimension [${EMBEDDING_DIMENSION}]: `)) ||
    EMBEDDING_DIMENSION.toString();
  const newVaultPath =
    (await ask(`Obsidian Vault Path [${OBSIDIAN_VAULT_PATH}]: `)) ||
    OBSIDIAN_VAULT_PATH;

  // Update .env file
  let envContent = fs.readFileSync(".env", "utf-8");
  envContent = envContent.replace(
    /DATABASE_URL=.*/,
    `DATABASE_URL=${newDbUrl}`
  );
  envContent = envContent.replace(
    /EMBEDDING_MODEL=.*/,
    `EMBEDDING_MODEL=${newModel}`
  );
  envContent = envContent.replace(
    /EMBEDDING_DIMENSION=.*/,
    `EMBEDDING_DIMENSION=${newDimension}`
  );
  envContent = envContent.replace(
    /OBSIDIAN_VAULT_PATH=.*/,
    `OBSIDIAN_VAULT_PATH=${newVaultPath}`
  );

  fs.writeFileSync(".env", envContent);
  logSuccess("Configuration updated. Please restart the setup script.");
  process.exit(0);
}

async function testDatabase() {
  try {
    const db = new ObsidianDatabase(DATABASE_URL!);
    await db.initialize();
    const stats = await db.getStats();

    logSuccess("Database connection successful!");
    console.log(`   📊 Total chunks: ${stats.totalChunks || 0}`);
    console.log(
      `   📅 Last update: ${
        (stats as any).lastUpdate
          ? new Date((stats as any).lastUpdate).toLocaleString()
          : "Never"
      }`
    );

    await db.close();
  } catch (error: any) {
    logError("Database connection failed", error.message);

    if (
      error.message.includes("role") &&
      error.message.includes("does not exist")
    ) {
      logWarning("Database user doesn't exist");
      console.log(
        "   💡 You need to create a PostgreSQL user or update DATABASE_URL"
      );
      console.log("   💡 Options:");
      console.log(
        "      1. Create user: CREATE USER username WITH PASSWORD 'password'"
      );
      console.log("      2. Update .env with correct credentials");
      console.log("      3. Use a different database user");
    } else if (
      error.message.includes("database") &&
      error.message.includes("does not exist")
    ) {
      logWarning("Database doesn't exist");
      console.log("   💡 You need to create the database first");
      console.log("   💡 Run: CREATE DATABASE obsidian_rag");
    }

    const setupDb = await ask(
      "\nWould you like help setting up the database? (y/n): "
    );
    if (setupDb.toLowerCase() === "y") {
      await setupDatabaseInstructions();
    }

    const retry = await ask("Would you like to continue anyway? (y/n): ");
    if (retry.toLowerCase() !== "y") {
      process.exit(1);
    }
  }
}

async function setupDatabaseInstructions() {
  console.log("\n📋 Database Setup Instructions:");
  console.log("=".repeat(40));
  console.log("1. Connect to PostgreSQL:");
  console.log("   psql -h localhost -U postgres");
  console.log("");
  console.log("2. Create a database user:");
  console.log(
    "   CREATE USER obsidian_rag_user WITH PASSWORD 'your_secure_password';"
  );
  console.log("");
  console.log("3. Create the database:");
  console.log("   CREATE DATABASE obsidian_rag OWNER obsidian_rag_user;");
  console.log("");
  console.log("4. Grant privileges:");
  console.log(
    "   GRANT ALL PRIVILEGES ON DATABASE obsidian_rag TO obsidian_rag_user;"
  );
  console.log("");
  console.log("5. Update your .env file:");
  console.log(
    "   DATABASE_URL=postgresql://obsidian_rag_user:your_secure_password@localhost:5432/obsidian_rag"
  );
  console.log("");
  console.log("6. Test the connection:");
  console.log("   npm run setup");

  const newUrl = await ask("\nEnter your new DATABASE_URL: ");
  if (newUrl) {
    // Update .env file
    let envContent = fs.readFileSync(".env", "utf-8");
    envContent = envContent.replace(
      /DATABASE_URL=.*/,
      `DATABASE_URL=${newUrl}`
    );
    fs.writeFileSync(".env", envContent);
    logSuccess("DATABASE_URL updated! Please run setup again.");
    process.exit(0);
  }
}

async function testEmbeddings() {
  try {
    const embeddingService = new ObsidianEmbeddingService({
      model: EMBEDDING_MODEL,
      dimension: EMBEDDING_DIMENSION,
    });

    const test = await embeddingService.testConnection();
    if (test.success) {
      logSuccess("Embedding service ready!");
      console.log(`   🤖 Model: ${EMBEDDING_MODEL}`);
      console.log(`   📐 Dimension: ${test.dimension}`);
    } else {
      logError("Embedding service test failed");
    }
  } catch (error: any) {
    logError("Embedding service connection failed", error.message);
    logWarning("Make sure Ollama is running and the model is installed");
    console.log("   Install: ollama pull embeddinggemma");
  }
}

async function testVault() {
  if (!fs.existsSync(OBSIDIAN_VAULT_PATH)) {
    logWarning("Obsidian vault directory not found");
    console.log(`   Path: ${OBSIDIAN_VAULT_PATH}`);
    const createVault = await ask(
      "Would you like to create this directory? (y/n): "
    );
    if (createVault.toLowerCase() === "y") {
      fs.mkdirSync(OBSIDIAN_VAULT_PATH, { recursive: true });
      logSuccess("Vault directory created");
    }
  } else {
    logSuccess("Obsidian vault directory found");
    const files = fs.readdirSync(OBSIDIAN_VAULT_PATH);
    console.log(`   📁 Contains: ${files.length} items`);
  }

  // Check for typical Obsidian files
  const markdownFiles = fs
    .readdirSync(OBSIDIAN_VAULT_PATH)
    .filter((f) => f.endsWith(".md"));
  if (markdownFiles.length > 0) {
    logSuccess(`Found ${markdownFiles.length} markdown files`);
  } else {
    logWarning("No markdown files found in vault");
    console.log("   Add some .md files to your Obsidian vault to get started");
  }
}
