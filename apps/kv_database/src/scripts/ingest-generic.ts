#!/usr/bin/env node

/**
 * Generic Document Ingestion Script
 * Demonstrates how to use the new generalized document ingestion system
 */

import { DocumentDatabase } from "../lib/database";
import { DocumentEmbeddingService } from "../lib/embeddings";
import { DocumentIngestionPipeline } from "../lib/document-ingest";
import {
  OBSIDIAN_CONFIG,
  MARKDOWN_CONFIG,
  NOTION_CONFIG,
  DocumentProcessingConfig,
} from "../lib/types/document-config";

interface IngestionOptions {
  connectionString: string;
  rootPath: string;
  systemType: "obsidian" | "markdown" | "notion" | "custom";
  customConfig?: DocumentProcessingConfig;
  includePatterns?: string[];
  excludePatterns?: string[];
  batchSize?: number;
}

/**
 * Main ingestion function
 */
async function ingestDocuments(options: IngestionOptions) {
  const {
    connectionString,
    rootPath,
    systemType,
    customConfig,
    includePatterns,
    excludePatterns,
    batchSize = 5,
  } = options;

  // Choose configuration based on system type
  let config: DocumentProcessingConfig;
  switch (systemType) {
    case "obsidian":
      config = OBSIDIAN_CONFIG;
      break;
    case "markdown":
      config = MARKDOWN_CONFIG;
      break;
    case "notion":
      config = NOTION_CONFIG;
      break;
    case "custom":
      if (!customConfig) {
        throw new Error("Custom config required when systemType is 'custom'");
      }
      config = customConfig;
      break;
    default:
      throw new Error(`Unsupported system type: ${systemType}`);
  }

  console.log(`🚀 Starting ${config.systemName} document ingestion...`);
  console.log(`📁 Root path: ${rootPath}`);
  console.log(`🔗 URI scheme: ${config.uriScheme}://`);
  console.log(
    `📝 Supported extensions: ${config.supportedExtensions.join(", ")}`
  );

  // Initialize services
  const database = new DocumentDatabase(connectionString);
  const embeddingService = new DocumentEmbeddingService({
    provider: "ollama",
    model: "embeddinggemma",
    apiUrl: "http://localhost:11434",
    dimension: 768,
    maxTokens: 8192,
    batchSize: 10,
    rateLimitMs: 100,
    retryAttempts: 3,
    timeout: 30000,
    search: {
      minSimilarity: 0.0,
      maxResults: 100,
    },
  });

  const pipeline = new DocumentIngestionPipeline(
    database,
    embeddingService,
    rootPath,
    config
  );

  try {
    // Ensure database is ready
    await database.ensureTablesExist();

    // Run ingestion
    const result = await pipeline.ingestDocuments({
      batchSize,
      includePatterns:
        includePatterns ||
        config.supportedExtensions.map((ext) => `**/*${ext}`),
      excludePatterns,
      chunkingOptions: config.chunkingDefaults,
    });

    console.log(`✅ Ingestion completed successfully!`);
    console.log(`📊 Results:`, result);

    return result;
  } catch (error) {
    console.error(`❌ Ingestion failed:`, error);
    throw error;
  } finally {
    await database.close();
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log(`
Usage: node ingest-generic.js <connection-string> <root-path> <system-type> [options]

System types:
  obsidian  - Obsidian vault (supports [[wikilinks]], #tags)
  markdown  - Generic markdown (supports [links](url), #tags)
  notion    - Notion-style (supports [links](url), @tags)
  custom    - Custom configuration (requires --config option)

Examples:
  # Ingest Obsidian vault
  node ingest-generic.js "postgresql://..." "/path/to/vault" obsidian

  # Ingest markdown documentation
  node ingest-generic.js "postgresql://..." "/path/to/docs" markdown

  # Ingest with custom patterns
  node ingest-generic.js "postgresql://..." "/path/to/files" markdown \\
    --include "**/*.md" --include "**/*.mdx" \\
    --exclude "**/node_modules/**" --exclude "**/.git/**"
`);
    process.exit(1);
  }

  const [connectionString, rootPath, systemType] = args as [
    string,
    string,
    unknown
  ];

  // Parse additional options
  const includePatterns: string[] = [];
  const excludePatterns: string[] = [];
  let batchSize = 5;

  for (let i = 3; i < args.length; i++) {
    switch (args[i]) {
      case "--include":
        includePatterns.push(args[++i]);
        break;
      case "--exclude":
        excludePatterns.push(args[++i]);
        break;
      case "--batch-size":
        batchSize = parseInt(args[++i]);
        break;
    }
  }

  try {
    await ingestDocuments({
      connectionString,
      rootPath,
      systemType,
      includePatterns: includePatterns.length > 0 ? includePatterns : undefined,
      excludePatterns: excludePatterns.length > 0 ? excludePatterns : undefined,
      batchSize,
    });
  } catch (error) {
    console.error("Ingestion failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { ingestDocuments, IngestionOptions };
