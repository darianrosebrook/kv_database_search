// Graph RAG Video Analysis Test
// This script processes a video about Graph RAG concepts to validate our multi-modal system
// and extract insights for implementing comprehensive semantic search

import { ObsidianDatabase } from "../../apps/kv_database/src/lib/database.ts";
import { ObsidianEmbeddingService } from "../../apps/kv_database/src/lib/embeddings.ts";
import { MultiModalIngestionPipeline } from "../../apps/kv_database/src/lib/multi-modal-ingest.ts";
import { ContentType } from "../../apps/kv_database/src/lib/multi-modal.ts";
import * as fs from "fs";
import * as path from "path";

// Use testcontainers for PostgreSQL
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";

async function analyzeGraphRAGVideo() {
  console.log("🎬 Graph RAG Video Analysis - Testing Our Multi-Modal System");
  console.log("=".repeat(80));

  let postgresContainer: StartedPostgreSqlContainer;
  let database: ObsidianDatabase;
  let embeddings: ObsidianEmbeddingService;
  let pipeline: MultiModalIngestionPipeline;

  try {
    console.log("🔧 Initializing test environment...");

    // Start PostgreSQL container with pgvector extension
    postgresContainer = await new PostgreSqlContainer("pgvector/pgvector:pg16")
      .withDatabase("testdb")
      .withUsername("testuser")
      .withPassword("testpass")
      .start();

    const connectionString = postgresContainer.getConnectionUri();

    // Initialize database
    database = new ObsidianDatabase(connectionString);
    await database.initialize();

    // Initialize embeddings (mock for testing)
    embeddings = new ObsidianEmbeddingService({
      model: "test-model",
      dimension: 768,
    });

    // Override the embedWithStrategy method for testing
    (embeddings ).embedWithStrategy = async (text: string) => ({
      embedding: new Array(768).fill(0.1),
      model: { name: "test-model" },
      confidence: 0.9,
    });

    // Create pipeline
    pipeline = new MultiModalIngestionPipeline(database, embeddings);

    console.log("✅ Test environment initialized successfully");

    // Locate the Graph RAG video
    const testFilesDir = path.join(process.cwd(), "test", "test-files");
    const videoPath = path.join(testFilesDir, "vector-graph-search-video.mp4");

    if (!fs.existsSync(videoPath)) {
      throw new Error(`Graph RAG video not found at: ${videoPath}`);
    }

    const videoStats = fs.statSync(videoPath);
    console.log(`\n📹 Processing Graph RAG Video:`);
    console.log(`  File: vector-graph-search-video.mp4`);
    console.log(`  Size: ${(videoStats.size / 1024 / 1024).toFixed(1)}MB`);

    // Process the video using our pipeline
    console.log("\n🎥 Starting video processing...");
    const result = await pipeline.ingestFiles([videoPath], {
      batchSize: 1,
      skipExisting: false,
    });

    console.log(`\n📊 Video processing result:`, {
      totalFiles: result.totalFiles,
      processedFiles: result.processedFiles,
      failedFiles: result.failedFiles,
      totalChunks: result.totalChunks,
      errors: result.errors,
    });

    if (result.failedFiles > 0) {
      console.error("❌ Video processing failed:", result.errors);
      return;
    }

    if (result.totalChunks === 0) {
      console.warn("⚠️ No content chunks extracted from video");
      return;
    }

    console.log("✅ Video processed successfully!");

    // Retrieve and analyze the extracted content
    console.log("\n🔍 Analyzing extracted content...");

    // Search for all chunks related to this video
    const searchResults = await database.search(
      new Array(768).fill(0.1), // Dummy embedding for search
      100, // Get up to 100 chunks
      {
        minSimilarity: 0.0, // Get all chunks
        fileTypes: [ContentType.VIDEO],
      }
    );

    console.log(`📋 Found ${searchResults.length} content chunks`);

    // Analyze the content for Graph RAG concepts
    const graphRagConcepts = analyzeGraphRagConcepts(searchResults);

    console.log("\n🧠 Graph RAG Concept Analysis:");
    console.log("=".repeat(50));

    // Core Concepts
    if (graphRagConcepts.coreConceptsFound.length > 0) {
      console.log("\n📚 Core Graph RAG Concepts Identified:");
      graphRagConcepts.coreConceptsFound.forEach((concept, index) => {
        console.log(`  ${index + 1}. ${concept.name}`);
        console.log(`     📝 Context: ${concept.context.substring(0, 100)}...`);
        console.log(`     🎯 Confidence: ${concept.confidence}`);
      });
    }

    // Methodologies
    if (graphRagConcepts.methodologiesFound.length > 0) {
      console.log("\n🔬 Methodologies Detected:");
      graphRagConcepts.methodologiesFound.forEach((method, index) => {
        console.log(`  ${index + 1}. ${method.name}`);
        console.log(
          `     📖 Description: ${method.description.substring(0, 100)}...`
        );
      });
    }

    // Technical Approaches
    if (graphRagConcepts.technicalApproaches.length > 0) {
      console.log("\n⚙️ Technical Approaches:");
      graphRagConcepts.technicalApproaches.forEach((approach, index) => {
        console.log(`  ${index + 1}. ${approach.name}`);
        console.log(
          `     🔧 Implementation: ${approach.implementation.substring(
            0,
            100
          )}...`
        );
      });
    }

    // Generate implementation recommendations
    const recommendations =
      generateImplementationRecommendations(graphRagConcepts);

    console.log("\n💡 Implementation Recommendations for Our System:");
    console.log("=".repeat(60));

    recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. ${rec.title}`);
      console.log(`   🎯 Priority: ${rec.priority}`);
      console.log(`   📋 Description: ${rec.description}`);
      console.log(`   🔧 Implementation: ${rec.implementation}`);
    });

    console.log("\n🎉 Graph RAG Video Analysis Complete!");
    console.log("This demonstrates our multi-modal system's ability to:");
    console.log("• Extract content from video (audio + visual)");
    console.log("• Perform semantic analysis and entity extraction");
    console.log("• Identify domain-specific concepts and methodologies");
    console.log("• Generate actionable implementation insights");
  } catch (error) {
    console.error("💥 Analysis failed:", error.message);
    if (error.stack) {
      console.error("Stack:", error.stack);
    }
  } finally {
    // Cleanup
    if (postgresContainer) {
      try {
        await postgresContainer.stop();
        console.log("🧹 Database container stopped");
      } catch (cleanupError) {
        console.warn("⚠️ Cleanup warning:", cleanupError.message);
      }
    }
  }
}

// Helper function to analyze Graph RAG concepts in the extracted content
function analyzeGraphRagConcepts(chunks[]) {
  const coreConceptsFound: Array<{
    name: string;
    context: string;
    confidence: number;
  }> = [];
  const methodologiesFound: Array<{ name: string; description: string }> = [];
  const technicalApproaches: Array<{ name: string; implementation: string }> =
    [];

  // Define Graph RAG core concepts to look for
  const coreGraphRagTerms = [
    "graph rag",
    "knowledge graph",
    "retrieval augmented generation",
    "entity extraction",
    "relationship mapping",
    "semantic search",
    "vector database",
    "embedding",
    "semantic chunking",
    "graph traversal",
    "node relationships",
    "edge connections",
  ];

  const methodologyTerms = [
    "multi-hop reasoning",
    "graph construction",
    "entity linking",
    "relationship inference",
    "semantic clustering",
    "hierarchical retrieval",
    "context expansion",
    "query decomposition",
    "answer synthesis",
  ];

  const technicalTerms = [
    "neo4j",
    "networkx",
    "spacy",
    "transformers",
    "llama",
    "vector similarity",
    "cosine similarity",
    "graph embedding",
    "attention mechanism",
    "bert",
    "gpt",
    "langchain",
  ];

  // Analyze each chunk
  chunks.forEach((chunk) => {
    // Check if chunk has content property, if not use text or other available content
    const rawContent = chunk.content || chunk.text || chunk.body || "";
    if (!rawContent || typeof rawContent !== "string") {
      console.warn("⚠️ Chunk missing text content:", Object.keys(chunk));
      return;
    }
    const content = rawContent.toLowerCase();

    // Check for core concepts
    coreGraphRagTerms.forEach((term) => {
      if (content.includes(term.toLowerCase())) {
        // Extract context around the term
        const termIndex = content.indexOf(term.toLowerCase());
        const contextStart = Math.max(0, termIndex - 100);
        const contextEnd = Math.min(content.length, termIndex + 200);
        const context = rawContent.substring(contextStart, contextEnd);

        coreConceptsFound.push({
          name: term,
          context: context,
          confidence: calculateTermConfidence(content, term),
        });
      }
    });

    // Check for methodologies
    methodologyTerms.forEach((term) => {
      if (content.includes(term.toLowerCase())) {
        const termIndex = content.indexOf(term.toLowerCase());
        const contextStart = Math.max(0, termIndex - 50);
        const contextEnd = Math.min(content.length, termIndex + 150);
        const description = rawContent.substring(contextStart, contextEnd);

        methodologiesFound.push({
          name: term,
          description: description,
        });
      }
    });

    // Check for technical approaches
    technicalTerms.forEach((term) => {
      if (content.includes(term.toLowerCase())) {
        const termIndex = content.indexOf(term.toLowerCase());
        const contextStart = Math.max(0, termIndex - 50);
        const contextEnd = Math.min(content.length, termIndex + 150);
        const implementation = rawContent.substring(contextStart, contextEnd);

        technicalApproaches.push({
          name: term,
          implementation: implementation,
        });
      }
    });
  });

  return {
    coreConceptsFound: removeDuplicateConcepts(coreConceptsFound),
    methodologiesFound: removeDuplicateMethodologies(methodologiesFound),
    technicalApproaches: removeDuplicateTechnical(technicalApproaches),
    totalChunksAnalyzed: chunks.length,
  };
}

// Helper function to calculate term confidence based on context
function calculateTermConfidence(content: string, term: string): number {
  const termCount = (
    content.toLowerCase().match(new RegExp(term.toLowerCase(), "g")) || []
  ).length;
  const contentLength = content.length;
  const termDensity = (termCount * term.length) / contentLength;

  // Simple confidence scoring based on term frequency and context
  return Math.min(0.95, 0.3 + termDensity * 100);
}

// Helper functions to remove duplicates
function removeDuplicateConcepts(
  concepts: Array<{ name: string; context: string; confidence: number }>
) {
  const seen = new Set();
  return concepts.filter((concept) => {
    if (seen.has(concept.name)) {
      return false;
    }
    seen.add(concept.name);
    return true;
  });
}

function removeDuplicateMethodologies(
  methodologies: Array<{ name: string; description: string }>
) {
  const seen = new Set();
  return methodologies.filter((method) => {
    if (seen.has(method.name)) {
      return false;
    }
    seen.add(method.name);
    return true;
  });
}

function removeDuplicateTechnical(
  technical: Array<{ name: string; implementation: string }>
) {
  const seen = new Set();
  return technical.filter((tech) => {
    if (seen.has(tech.name)) {
      return false;
    }
    seen.add(tech.name);
    return true;
  });
}

// Generate implementation recommendations based on found concepts
function generateImplementationRecommendations(concepts) {
  const recommendations = [];

  // Always recommend enhanced semantic search
  recommendations.push({
    title: "Enhanced Semantic Search Infrastructure",
    priority: "HIGH",
    description:
      "Implement multi-layered semantic search combining vector similarity with graph traversal for more accurate and contextual results.",
    implementation:
      "Extend existing ObsidianSearchService with graph-aware ranking algorithms and multi-hop query expansion.",
  });

  // If graph concepts were found, recommend graph database integration
  if (
    concepts.coreConceptsFound.some(
      (c) => c.name.includes("graph") || c.name.includes("knowledge")
    )
  ) {
    recommendations.push({
      title: "Graph Database Integration",
      priority: "HIGH",
      description:
        "Integrate a graph database (Neo4j or NetworkX) alongside PostgreSQL to store and query entity relationships.",
      implementation:
        "Create hybrid storage: PostgreSQL for vectors and metadata, graph DB for entity relationships and knowledge graphs.",
    });
  }

  // If entity extraction concepts were found
  if (
    concepts.coreConceptsFound.some(
      (c) => c.name.includes("entity") || c.name.includes("relationship")
    )
  ) {
    recommendations.push({
      title: "Advanced Entity and Relationship Extraction",
      priority: "MEDIUM",
      description:
        "Enhance the existing entity extraction to identify more complex relationships and create dynamic knowledge graphs.",
      implementation:
        "Upgrade EntityExtractor with better NLP models and relationship inference algorithms.",
    });
  }

  // If chunking concepts were found
  if (
    concepts.coreConceptsFound.some(
      (c) => c.name.includes("chunk") || c.name.includes("semantic")
    )
  ) {
    recommendations.push({
      title: "Intelligent Semantic Chunking",
      priority: "MEDIUM",
      description:
        "Implement context-aware chunking that preserves semantic boundaries and entity relationships.",
      implementation:
        "Replace fixed-size chunking with semantic boundary detection and entity-aware splitting.",
    });
  }

  // If technical approaches like transformers or embeddings were found
  if (concepts.technicalApproaches.length > 0) {
    recommendations.push({
      title: "Advanced Embedding and Retrieval Strategies",
      priority: "MEDIUM",
      description:
        "Implement multiple embedding strategies and fusion techniques for better semantic understanding.",
      implementation:
        "Add support for multiple embedding models, cross-encoder reranking, and embedding fusion techniques.",
    });
  }

  // Always recommend comprehensive testing
  recommendations.push({
    title: "Comprehensive Graph RAG Evaluation Framework",
    priority: "LOW",
    description:
      "Create evaluation metrics specifically for graph-enhanced retrieval and generation quality.",
    implementation:
      "Develop benchmarks for entity extraction accuracy, relationship quality, and end-to-end retrieval performance.",
  });

  return recommendations;
}

// Run the analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeGraphRAGVideo().catch(console.error);
}
