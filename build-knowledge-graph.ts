#!/usr/bin/env tsx

// Script to build the knowledge graph from existing documents
import { Database } from "./src/lib/database.js";
import { EmbeddingService } from "./src/lib/embeddings.js";
import { KnowledgeGraphService } from "./src/lib/knowledge-graph.js";

async function buildKnowledgeGraph() {
  console.log("🔗 Building Knowledge Graph from existing documents...\n");

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

  try {
    // Get all documents from database
    const allChunks = await database.getAllChunks();
    console.log(`📄 Found ${allChunks.length} document chunks`);

    if (allChunks.length === 0) {
      console.log("❌ No documents found. Please ingest some documents first.");
      console.log(
        '💡 Try running: npm run ingest "Cue Design System Guidelines.pdf"'
      );
      return;
    }

    // Build knowledge graph from documents
    console.log("🏗️ Building knowledge graph...");
    await knowledgeGraph.buildFromDocuments(allChunks);

    // Get statistics
    const stats = knowledgeGraph.getGraphStatistics();
    console.log("\n📊 Knowledge Graph Statistics:");
    console.log(`   • Nodes: ${stats.nodeCount}`);
    console.log(`   • Edges: ${stats.edgeCount}`);
    console.log(`   • Density: ${stats.density?.toFixed(4) || "N/A"}`);

    // Save the graph
    console.log("\n💾 Saving knowledge graph...");
    await knowledgeGraph.saveGraph("./knowledge-graph.json");

    console.log("✅ Knowledge graph built and saved successfully!");

    // Test a sample query to see if graph context is working
    console.log("\n🧪 Testing graph context generation...");
    const testResults = allChunks.slice(0, 3);

    if (testResults.length > 0) {
      console.log("🔍 Sample entities and relationships:");

      // Show some sample nodes and edges
      const nodes = Array.from(knowledgeGraph["nodes"].values()).slice(0, 5);
      const edges = Array.from(knowledgeGraph["edges"].values())
        .flat()
        .slice(0, 5);

      console.log("📍 Sample Nodes:");
      nodes.forEach((node: any) => {
        console.log(`   • ${node.label} (${node.type})`);
      });

      console.log("\n🔗 Sample Edges:");
      edges.forEach((edge: any) => {
        const sourceNode = knowledgeGraph["nodes"].get(edge.sourceId);
        const targetNode = knowledgeGraph["nodes"].get(edge.targetId);
        console.log(
          `   • ${sourceNode?.label} --[${edge.type}]--> ${targetNode?.label}`
        );
      });
    }
  } catch (error) {
    console.error("❌ Failed to build knowledge graph:", error);
  }
}

buildKnowledgeGraph();
