#!/usr/bin/env tsx

import { SearchService } from "../src/lib/search.ts";
import { Database } from "../src/lib/database.ts";
import { EmbeddingService } from "../src/lib/embeddings.ts";
import { KnowledgeGraphService } from "../src/lib/knowledge-graph.ts";

async function debugGraphRAG() {
  console.log("🔗 Debugging Graph RAG System...\n");

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

  // Test 1: Basic search to get some content
  console.log("1. Testing basic search...");
  const basicResults = await searchService.search("component", { limit: 3 });
  console.log(`   Found ${basicResults.results.length} results`);

  // Test 2: Graph construction
  console.log("\n2. Testing graph construction...");

  // Test entity extraction first
  console.log("   Testing entity extraction...");
  const entityExtractor = new (
    knowledgeGraph as any
  ).entityExtractor.constructor();
  for (const result of basicResults.results.slice(0, 2)) {
    const entities = await entityExtractor.extract(result.text);
    console.log(`   Text: "${result.text.substring(0, 200)}..."`);
    console.log(`   Entities found: ${entities.length}`);
    entities.forEach((entity) => {
      console.log(
        `     • ${entity.text} (${entity.entityType}, confidence: ${entity.confidence})`
      );
    });

    // Test specific patterns that might work
    console.log(`   Testing manual patterns...`);
    const text = result.text.toLowerCase();

    // Look for common patterns
    const patterns = [
      /\bform.*input\b/g,
      /\binput.*form\b/g,
      /\bcomponent.*accessibility\b/g,
      /\bdesign.*system\b/g,
      /\bvalidation.*field\b/g,
    ];

    patterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        console.log(`     Pattern ${pattern}: ${matches.join(", ")}`);
      }
    });

    // Test relationship extraction
    console.log(`   Testing relationship extraction...`);
    const relationshipExtractor = new (
      knowledgeGraph as any
    ).relationshipExtractor.constructor();
    const relationships = await relationshipExtractor.extract(
      result.text,
      entities,
      result.id
    );
    console.log(`   Relationships found: ${relationships.length}`);
    relationships.forEach((rel) => {
      console.log(
        `     • ${rel.sourceEntity} ${rel.relationshipType} ${rel.targetEntity} (${rel.confidence})`
      );
    });
  }

  console.log("\n   Building knowledge graph from search results...");

  try {
    await knowledgeGraph.buildFromDocuments(basicResults.results);
    const stats = knowledgeGraph.getGraphStatistics();

    console.log("   Graph Statistics:");
    console.log(`   • Nodes: ${stats.nodeCount}`);
    console.log(`   • Edges: ${stats.edgeCount}`);
    console.log(`   • Average Degree: ${stats.averageDegree}`);
    console.log(`   • Density: ${stats.density}`);
    console.log(`   • Node Types:`, stats.nodeTypes);
    console.log(`   • Edge Types:`, stats.edgeTypes);

    // Test graph paths
    console.log("\n3. Testing graph path finding...");

    // Get entity nodes only
    const entityNodes = Array.from(
      (knowledgeGraph as any).nodes.values()
    ).filter((node: any) => node.type === "entity");

    console.log(`   Found ${entityNodes.length} entity nodes`);

    if (entityNodes.length >= 2) {
      const node1 = entityNodes[0];
      const node2 = entityNodes[1];

      console.log(
        `   Finding paths between entity "${node1.label}" and "${node2.label}"...`
      );
      const paths = knowledgeGraph.findPaths(node1.id, node2.id, 3, 0.1);

      console.log(`   Found ${paths.length} paths:`);
      paths.slice(0, 3).forEach((path, i) => {
        console.log(
          `   Path ${i + 1}: ${
            path.nodes.length
          } nodes, score: ${path.score.toFixed(3)}`
        );
        console.log(
          `     Nodes: ${path.nodes.map((n: any) => n.label).join(" -> ")}`
        );
      });

      // Also try a more connected search
      console.log("\n   Testing broader connectivity...");
      const connectedNodes = knowledgeGraph.findPaths(
        node1.id,
        node2.id,
        5,
        0.0
      );
      console.log(`   With lower threshold: ${connectedNodes.length} paths`);

      // Debug the actual graph structure
      console.log("\n4. Debugging graph structure...");
      const nodes = Array.from((knowledgeGraph as any).nodes.values());
      const edges = Array.from((knowledgeGraph as any).edges.values()).flat();

      console.log(`   Total nodes: ${nodes.length}`);
      console.log(`   Total edges: ${edges.length}`);

      console.log("\n   Entity nodes:");
      nodes
        .filter((n: any) => n.type === "entity")
        .forEach((node: any) => {
          console.log(`     • ${node.label} (${node.id})`);
        });

      console.log("\n   Entity-to-entity edges:");
      edges
        .filter(
          (e: any) =>
            e.sourceId.includes("entity_") && e.targetId.includes("entity_")
        )
        .forEach((edge: any) => {
          const sourceNode = nodes.find((n: any) => n.id === edge.sourceId);
          const targetNode = nodes.find((n: any) => n.id === edge.targetId);
          console.log(
            `     • ${sourceNode?.label} --[${edge.type}]--> ${targetNode?.label} (weight: ${edge.weight})`
          );
        });
    } else {
      console.log("   Not enough entity nodes for path finding test");
    }
  } catch (error) {
    console.error("   ❌ Graph construction failed:", error);
    console.error("   Error stack:", error.stack);
  }

  // Test 3: Graph-augmented search
  console.log("\n4. Testing graph-augmented search...");
  try {
    const graphResults = await searchService.search("component", {
      graphAugmentation: true,
      maxGraphHops: 2,
      limit: 3,
    });

    console.log(
      `   Graph-augmented search found ${graphResults.results.length} results`
    );

    // Check for graph context in results
    const hasGraphContext = graphResults.results.some(
      (result) => (result as any).graphContext
    );
    console.log(`   Has graph context: ${hasGraphContext}`);

    if (hasGraphContext) {
      const graphContexts = graphResults.results
        .map((result) => (result as any).graphContext)
        .filter((context) => context);

      console.log(`   Graph contexts found: ${graphContexts.length}`);
      if (graphContexts.length > 0) {
        console.log("   Sample graph context:");
        console.log(
          "   • Entities:",
          graphContexts[0].relatedEntities?.length || 0
        );
        console.log("   • Paths:", graphContexts[0].paths?.length || 0);
        console.log(
          "   • Centrality Score:",
          graphContexts[0].centralityScore?.toFixed(3) || "N/A"
        );
      }
    }
  } catch (error) {
    console.error("   ❌ Graph-augmented search failed:", error);
    console.error("   Error stack:", error.stack);
  }

  await database.close();
}

debugGraphRAG().catch(console.error);
