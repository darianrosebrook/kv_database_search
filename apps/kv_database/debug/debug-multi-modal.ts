#!/usr/bin/env tsx

import { SearchService } from "../src/lib/search.ts";
import { Database } from "../src/lib/database.ts";
import { EmbeddingService } from "../src/lib/embeddings.ts";
import { KnowledgeGraphService } from "../src/lib/knowledge-graph.ts";
import { MultiModalRetriever, ContentType } from "../src/lib/multi-modal.ts";

async function debugMultiModal() {
  console.log("🔍 Debugging Multi-Modal System...\n");

  // Initialize services
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  const database = new Database(dbUrl);
  await database.initialize();

  const embeddings = new EmbeddingService({
    model: process.env.EMBEDDING_MODEL || "embeddinggemma",
    dimension: parseInt(process.env.EMBEDDING_DIMENSION || "768"),
    host: process.env.OLLAMA_HOST || "http://localhost:11434",
  });

  const knowledgeGraph = new KnowledgeGraphService();
  const searchService = new SearchService(database, embeddings, knowledgeGraph);

  // Test basic search
  console.log("1. Testing basic search...");
  const basicResults = await searchService.search("javascript function", {
    limit: 3,
  });
  console.log(`   Found ${basicResults.results.length} results`);
  console.log(
    `   First result text preview: ${basicResults.results[0]?.text.substring(
      0,
      100
    )}...`
  );
  console.log(`   First result URI: ${basicResults.results[0]?.meta.uri}`);

  // Test content type detection directly
  console.log("\n2. Testing content type detection...");
  const multiModalRetriever = new MultiModalRetriever(embeddings);

  for (const result of basicResults.results.slice(0, 2)) {
    console.log(`   Testing result: ${result.meta.uri}`);

    const contentType = multiModalRetriever[
      "contentTypeDetector"
    ].detectContentType(result.text, result.meta.uri);
    console.log(`   Detected content type: ${contentType}`);

    if (contentType === ContentType.CODE) {
      const language = multiModalRetriever[
        "contentTypeDetector"
      ].detectProgrammingLanguage(result.text, result.meta.uri);
      console.log(`   Detected language: ${language}`);
    }
  }

  // Test multi-modal processing
  console.log("\n3. Testing multi-modal processing...");
  try {
    const multiModalQuery = {
      query: "javascript function",
      preferredContentTypes: [ContentType.CODE],
      includeCode: true,
    };

    const processedResults = await multiModalRetriever.processResults(
      basicResults.results,
      multiModalQuery
    );

    console.log(`   Processed ${processedResults.length} results`);
    console.log(`   First result metadata:`, processedResults[0]?.metadata);
    console.log(
      `   First result contentType:`,
      processedResults[0]?.contentType
    );
    console.log(
      `   First result modalityScores:`,
      processedResults[0]?.modalityScores
    );
  } catch (error) {
    console.error("   ❌ Multi-modal processing failed:", error);
    console.error("   Error stack:", error.stack);
  }

  await database.close();
}

debugMultiModal().catch(console.error);
