#!/usr/bin/env tsx

import { config as dotenvConfig } from "dotenv";
import { DocumentDatabase } from "../lib/database";
import { DocumentEmbeddingService } from "../lib/embeddings";
import { ObsidianSearchService } from "../lib/obsidian-search";

// Load environment variables
dotenvConfig();

const DATABASE_URL = process.env.DATABASE_URL;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "embeddinggemma";
const EMBEDDING_DIMENSION = parseInt(process.env.EMBEDDING_DIMENSION || "768");

async function main() {
  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  // Get query from command line arguments
  const args = process.argv.slice(2);
  const query = args.join(" ");

  if (!query) {
    console.log(`
Obsidian Search Tool

Usage: tsx src/scripts/search.ts <query>

Examples:
  tsx src/scripts/search.ts "design systems"
  tsx src/scripts/search.ts "accessibility guidelines"
  tsx src/scripts/search.ts "MOC maps of content"
`);
    process.exit(0);
  }

  console.log("🔍 Initializing Obsidian search...");
  console.log(`🔗 Database: ${DATABASE_URL.replace(/\/\/.*@/, "//***@")}`);
  console.log(
    `🧠 Embedding model: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSION}d)`
  );

  try {
    // Initialize services
    const database = new DocumentDatabase(DATABASE_URL, "obsidian_chunks");
    await database.initialize();

    const embeddingService = new DocumentEmbeddingService({
      model: EMBEDDING_MODEL,
      dimension: EMBEDDING_DIMENSION,
    });

    // Test embedding service
    const embeddingTest = await embeddingService.testConnection();
    if (!embeddingTest.success) {
      throw new Error("Embedding service connection failed");
    }

    const searchService = new ObsidianSearchService(database, embeddingService);

    // Perform search
    console.log(`\n🔍 Searching for: "${query}"`);
    const startTime = Date.now();

    const searchResponse = await searchService.search(query, {
      limit: 10,
      searchMode: "comprehensive",
      includeRelated: true,
      maxRelated: 3,
    });

    const duration = Date.now() - startTime;

    // Display results
    console.log("\n" + "=".repeat(80));
    console.log(`📊 SEARCH RESULTS (${duration}ms)`);
    console.log("=".repeat(80));
    console.log(`Query: "${searchResponse.query}"`);
    console.log(
      `Results: ${searchResponse.results.length}/${searchResponse.totalFound} found`
    );

    if (searchResponse.results.length === 0) {
      console.log("\n❌ No results found. Try:");
      console.log("  - Using different keywords");
      console.log("  - Checking if content has been ingested");
      console.log("  - Using broader search terms");
    } else {
      // Display top results
      console.log("\n📋 Top Results:");
      searchResponse.results.slice(0, 5).forEach((result, i) => {
        console.log(`\n${i + 1}. ${result.meta?.section}`);
        console.log(`   File: ${result.documentId || "unknown"}`);
        console.log(`   Type: ${result.meta?.contentType}`);
        console.log(`   Score: ${((result.cosineSimilarity ?? 0) * 100).toFixed(1)}%`);

        if (result.obsidianMeta?.tags?.length) {
          console.log(
            `   Tags: ${result.obsidianMeta.tags.slice(0, 5).join(", ")}`
          );
        }

        if (result.highlights?.length) {
          console.log(
            `   Highlights: ${result.highlights[0].slice(0, 100)}...`
          );
        } else {
          console.log(`   Preview: ${(result.text ?? "").slice(0, 150)}...`);
        }

        if (result.relatedChunks?.length) {
          console.log(
            `   Related: ${result.relatedChunks.length} connected chunks`
          );
        }
      });

      // Display facets
      if (searchResponse.facets) {
        console.log("\n📊 Content Distribution:");

        if (
          searchResponse.facets.fileTypes &&
          searchResponse.facets.fileTypes.length > 0
        ) {
          console.log("  By Type:");
          searchResponse.facets.fileTypes.slice(0, 5).forEach((facet) => {
            console.log(`    ${facet.type}: ${facet.count}`);
          });
        }

        if (
          searchResponse.facets.tags &&
          searchResponse.facets.tags.length > 0
        ) {
          console.log("  By Tags:");
          searchResponse.facets.tags.slice(0, 5).forEach((facet) => {
            console.log(`    #${facet.tag}: ${facet.count}`);
          });
        }

        if (
          searchResponse.facets.folders &&
          searchResponse.facets.folders.length > 0
        ) {
          console.log("  By Folders:");
          searchResponse.facets.folders.slice(0, 5).forEach((facet) => {
            console.log(`    ${facet.folder}: ${facet.count}`);
          });
        }
      }

      // Display graph insights
      if (searchResponse.graphInsights) {
        console.log("\n🔗 Knowledge Graph Insights:");

        if (searchResponse.graphInsights.queryConcepts.length > 0) {
          console.log(
            `  Query concepts: ${searchResponse.graphInsights.queryConcepts.join(
              ", "
            )}`
          );
        }

        if (searchResponse.graphInsights.relatedConcepts.length > 0) {
          console.log(
            `  Related concepts: ${searchResponse.graphInsights.relatedConcepts
              .slice(0, 5)
              .join(", ")}`
          );
        }

        if (searchResponse.graphInsights.knowledgeClusters.length > 0) {
          console.log("  Knowledge clusters:");
          searchResponse.graphInsights.knowledgeClusters
            .slice(0, 3)
            .forEach((cluster) => {
              console.log(
                `    ${cluster.name}: ${cluster.files.length} files (${(
                  cluster.centrality * 100
                ).toFixed(1)}% centrality)`
              );
            });
        }
      }
    }

    // Suggest specialized searches
    console.log("\n💡 Try specialized searches:");
    console.log("  MOCs: tsx src/scripts/search.ts MOC");
    console.log("  By tag: tsx src/scripts/search.ts '#design'");
    console.log("  Conversations: tsx src/scripts/search.ts 'AI chat'");
    console.log(
      "  Articles: tsx src/scripts/search.ts 'article design system'"
    );

    await database.close();
  } catch (error) {
    console.error("❌ Search failed:", error);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});
