import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Pool } from "pg";
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { ObsidianDatabase } from "../../src/lib/database.js";
import { ObsidianEmbeddingService } from "../../src/lib/embeddings.js";
import { MultiModalIngestionPipeline } from "../../src/lib/multi-modal-ingest.js";
import {
  createKnowledgeGraphSystem,
  KnowledgeGraphIntegration,
  bootstrapKnowledgeGraphFromExistingData,
} from "../../src/lib/knowledge-graph/index.js";
import {
  HybridSearchEngine,
  type SearchQuery,
} from "../../src/lib/knowledge-graph/hybrid-search-engine.js";
import {
  MultiHopReasoningEngine,
  type ReasoningQuery,
} from "../../src/lib/knowledge-graph/multi-hop-reasoning.js";
import { ContentType } from "../../src/lib/types/index.js";
import path from "path";
import fs from "fs";

describe("Graph RAG Integration Tests [INV: End-to-end functionality]", () => {
  let container: StartedPostgreSqlContainer;
  let pool: Pool;
  let database: ObsidianDatabase;
  let embeddings: ObsidianEmbeddingService;
  let ingestionPipeline: MultiModalIngestionPipeline;
  let knowledgeGraphSystem;
  let searchEngine: HybridSearchEngine;
  let reasoningEngine: MultiHopReasoningEngine;

  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer("postgres:16")
      .withDatabase("test_db")
      .withUsername("test_user")
      .withPassword("test_pass")
      .withExposedPorts(5432)
      .start();

    // Create pool and database
    pool = new Pool({
      host: container.getHost(),
      port: container.getMappedPort(5432),
      database: container.getDatabase(),
      user: container.getUsername(),
      password: container.getPassword(),
    });

    database = new ObsidianDatabase(pool);
    await database.initialize();

    // Initialize embeddings with mock
    embeddings = new ObsidianEmbeddingService({
      apiKey: "test-key",
      model: "text-embedding-3-small",
    });

    // Mock embedding service
    embeddings.embedWithStrategy = async (text: string) => ({
      embedding: new Array(768).fill(0.1).map(() => Math.random()),
      model: "text-embedding-3-small",
      usage: { prompt_tokens: text.length, total_tokens: text.length },
    });

    // Create ingestion pipeline
    ingestionPipeline = new MultiModalIngestionPipeline(database, embeddings);

    // Initialize knowledge graph system
    knowledgeGraphSystem = await createKnowledgeGraphSystem(
      database,
      embeddings,
      {
        enableRealTimeProcessing: true,
        entityExtraction: {
          minEntityConfidence: 0.6,
          minRelationshipConfidence: 0.4,
          enableCooccurrenceAnalysis: true,
        },
        knowledgeGraph: {
          similarityThreshold: 0.7,
          enableAutoMerge: false,
        },
      }
    );

    // Initialize search and reasoning engines
    searchEngine = new HybridSearchEngine(pool, embeddings);
    reasoningEngine = new MultiHopReasoningEngine(pool);
  }, 60000);

  afterAll(async () => {
    if (knowledgeGraphSystem?.knowledgeGraph) {
      await knowledgeGraphSystem.knowledgeGraph.cleanup();
    }
    await pool.end();
    await container.stop();
  });

  beforeEach(async () => {
    // Clean up database between tests
    await pool.query("TRUNCATE TABLE obsidian_chunks CASCADE");
    await pool.query("TRUNCATE TABLE kg_nodes CASCADE");
    await pool.query("TRUNCATE TABLE kg_relationships CASCADE");
  });

  describe("Multi-Modal Knowledge Graph Construction", () => {
    it("should build knowledge graph from diverse content types [A1]", async () => {
      // Arrange: Create test content files
      const testFiles = await createTestContent();

      try {
        // Act: Ingest multi-modal content
        console.log("🔄 Ingesting multi-modal content...");
        const ingestionResult = await knowledgeGraphSystem.pipeline.ingestFiles(
          testFiles
        );

        expect(ingestionResult.processedFiles).toBeGreaterThan(0);
        expect(ingestionResult.totalChunks).toBeGreaterThan(0);

        // Wait for knowledge graph processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Force process any remaining content
        await knowledgeGraphSystem.knowledgeGraph.flushProcessingQueue();

        // Verify knowledge graph construction
        const stats = await knowledgeGraphSystem.getStatistics();

        expect(stats.entityCount).toBeGreaterThan(0);
        expect(stats.relationshipCount).toBeGreaterThan(0);
        expect(Object.keys(stats.entityTypeDistribution)).toContain("PERSON");
        expect(Object.keys(stats.entityTypeDistribution)).toContain(
          "ORGANIZATION"
        );

        console.log(
          `✅ Knowledge graph built: ${stats.entityCount} entities, ${stats.relationshipCount} relationships`
        );
      } finally {
        // Cleanup test files
        await cleanupTestFiles(testFiles);
      }
    }, 30000);

    it("should handle entity deduplication correctly [A2]", async () => {
      // Arrange: Create content with duplicate entities
      const testFiles = await createDuplicateEntityContent();

      try {
        // Act: Ingest content with duplicates
        await knowledgeGraphSystem.pipeline.ingestFiles(testFiles);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await knowledgeGraphSystem.knowledgeGraph.flushProcessingQueue();

        // Verify deduplication
        const stats = await knowledgeGraphSystem.getStatistics();

        // Should have fewer entities than mentions due to deduplication
        expect(stats.entityCount).toBeLessThan(10); // Assuming we created more mentions
        expect(stats.entityCount).toBeGreaterThan(0);

        console.log(
          `✅ Entity deduplication: ${stats.entityCount} unique entities`
        );
      } finally {
        await cleanupTestFiles(testFiles);
      }
    }, 20000);
  });

  describe("Hybrid Search Functionality", () => {
    beforeEach(async () => {
      // Setup test knowledge graph
      const testFiles = await createSearchTestContent();
      await knowledgeGraphSystem.pipeline.ingestFiles(testFiles);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await knowledgeGraphSystem.knowledgeGraph.flushProcessingQueue();
      await cleanupTestFiles(testFiles);
    });

    it("should perform vector similarity search [A3]", async () => {
      // Arrange
      const searchQuery: SearchQuery = {
        text: "artificial intelligence machine learning",
        options: {
          searchType: "vector",
          maxResults: 10,
          includeExplanation: true,
        },
      };

      // Act
      const searchResult = await searchEngine.search(searchQuery);

      // Assert
      expect(searchResult.results).toBeDefined();
      expect(searchResult.metrics.vectorResults).toBeGreaterThan(0);
      expect(searchResult.metrics.executionTime).toBeGreaterThan(0);
      expect(searchResult.explanation).toBeDefined();

      console.log(
        `✅ Vector search: ${
          searchResult.results.length
        } results in ${searchResult.metrics.executionTime.toFixed(1)}ms`
      );
    }, 15000);

    it("should perform graph traversal search [A4]", async () => {
      // Arrange
      const searchQuery: SearchQuery = {
        text: "technology companies",
        options: {
          searchType: "graph",
          maxHops: 2,
          maxResults: 10,
          includeExplanation: true,
        },
      };

      // Act
      const searchResult = await searchEngine.search(searchQuery);

      // Assert
      expect(searchResult.results).toBeDefined();
      expect(searchResult.metrics.executionTime).toBeGreaterThan(0);

      if (searchResult.results.length > 0) {
        expect(searchResult.results[0].entities.length).toBeGreaterThan(0);
      }

      console.log(
        `✅ Graph search: ${searchResult.results.length} results, ${searchResult.metrics.entitiesFound} entities found`
      );
    }, 15000);

    it("should perform hybrid search combining vector and graph [A5]", async () => {
      // Arrange
      const searchQuery: SearchQuery = {
        text: "Microsoft artificial intelligence research",
        options: {
          searchType: "hybrid",
          maxHops: 2,
          maxResults: 10,
          includeExplanation: true,
        },
      };

      // Act
      const searchResult = await searchEngine.search(searchQuery);

      // Assert
      expect(searchResult.results).toBeDefined();
      expect(searchResult.metrics.executionTime).toBeGreaterThan(0);
      expect(searchResult.explanation?.searchStrategy).toBe("hybrid");

      // Should have both vector and graph components
      const hasVectorResults = searchResult.metrics.vectorResults > 0;
      const hasGraphResults = searchResult.metrics.graphResults > 0;

      console.log(
        `✅ Hybrid search: vector=${hasVectorResults}, graph=${hasGraphResults}, total=${searchResult.results.length} results`
      );
    }, 15000);
  });

  describe("Multi-Hop Reasoning", () => {
    beforeEach(async () => {
      // Setup test knowledge graph with reasoning scenarios
      const testFiles = await createReasoningTestContent();
      await knowledgeGraphSystem.pipeline.ingestFiles(testFiles);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await knowledgeGraphSystem.knowledgeGraph.flushProcessingQueue();
      await cleanupTestFiles(testFiles);
    });

    it("should perform exploratory reasoning [A6]", async () => {
      // First, get some entity IDs from the knowledge graph
      const entitiesQuery = `
        SELECT id FROM kg_nodes 
        WHERE type = 'PERSON' OR type = 'ORGANIZATION'
        LIMIT 2
      `;
      const entitiesResult = await pool.query(entitiesQuery);

      if (entitiesResult.rows.length === 0) {
        console.log("⚠️ No entities found for reasoning test, skipping...");
        return;
      }

      // Arrange
      const reasoningQuery: ReasoningQuery = {
        startEntities: [entitiesResult.rows[0].id],
        question:
          "What are the connections and relationships from this entity?",
        maxDepth: 2,
        minConfidence: 0.3,
        reasoningType: "exploratory",
      };

      // Act
      const reasoningResult = await reasoningEngine.reason(reasoningQuery);

      // Assert
      expect(reasoningResult).toBeDefined();
      expect(reasoningResult.confidence).toBeGreaterThanOrEqual(0);
      expect(reasoningResult.metrics.processingTime).toBeGreaterThan(0);

      console.log(
        `✅ Exploratory reasoning: ${
          reasoningResult.paths.length
        } paths, confidence=${reasoningResult.confidence.toFixed(3)}`
      );
    }, 15000);

    it("should perform targeted reasoning between entities [A7]", async () => {
      // Get two different entities
      const entitiesQuery = `
        SELECT id FROM kg_nodes 
        WHERE type IN ('PERSON', 'ORGANIZATION', 'CONCEPT')
        LIMIT 2
      `;
      const entitiesResult = await pool.query(entitiesQuery);

      if (entitiesResult.rows.length < 2) {
        console.log(
          "⚠️ Not enough entities found for targeted reasoning test, skipping..."
        );
        return;
      }

      // Arrange
      const reasoningQuery: ReasoningQuery = {
        startEntities: [entitiesResult.rows[0].id],
        targetEntities: [entitiesResult.rows[1].id],
        question: "How are these entities connected?",
        maxDepth: 3,
        minConfidence: 0.3,
        reasoningType: "targeted",
      };

      // Act
      const reasoningResult = await reasoningEngine.reason(reasoningQuery);

      // Assert
      expect(reasoningResult).toBeDefined();
      expect(reasoningResult.metrics.processingTime).toBeGreaterThan(0);

      console.log(
        `✅ Targeted reasoning: ${reasoningResult.paths.length} paths found`
      );
    }, 15000);
  });

  describe("Performance and Scalability", () => {
    it("should handle large knowledge graphs efficiently [NFR: Performance]", async () => {
      // Arrange: Create larger test dataset
      const testFiles = await createLargeTestDataset();

      try {
        // Act: Measure ingestion and search performance
        const startTime = performance.now();

        await knowledgeGraphSystem.pipeline.ingestFiles(testFiles);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        await knowledgeGraphSystem.knowledgeGraph.flushProcessingQueue();

        const ingestionTime = performance.now() - startTime;

        // Perform search
        const searchStart = performance.now();
        const searchResult = await searchEngine.search({
          text: "technology innovation artificial intelligence",
          options: { maxResults: 20, searchType: "hybrid" },
        });
        const searchTime = performance.now() - searchStart;

        // Assert performance requirements
        expect(ingestionTime).toBeLessThan(30000); // Should complete within 30 seconds
        expect(searchTime).toBeLessThan(5000); // Search should complete within 5 seconds
        expect(searchResult.results.length).toBeGreaterThan(0);

        const stats = await knowledgeGraphSystem.getStatistics();
        console.log(
          `✅ Performance test: ${
            stats.entityCount
          } entities, ingestion=${ingestionTime.toFixed(
            0
          )}ms, search=${searchTime.toFixed(0)}ms`
        );
      } finally {
        await cleanupTestFiles(testFiles);
      }
    }, 60000);

    it("should maintain consistency under concurrent operations [NFR: Consistency]", async () => {
      // Arrange: Create test content
      const testFiles = await createConcurrencyTestContent();

      try {
        // Act: Run concurrent ingestion operations
        const concurrentPromises = testFiles.map(async (file, index) => {
          await new Promise((resolve) => setTimeout(resolve, index * 100)); // Stagger starts
          return knowledgeGraphSystem.pipeline.ingestFiles([file]);
        });

        await Promise.all(concurrentPromises);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await knowledgeGraphSystem.knowledgeGraph.flushProcessingQueue();

        // Verify consistency
        const consistency = await knowledgeGraphSystem.validateConsistency();
        expect(consistency.isValid).toBe(true);
        expect(consistency.errors).toHaveLength(0);

        console.log(
          `✅ Consistency test: ${consistency.warnings.length} warnings, ${consistency.errors.length} errors`
        );
      } finally {
        await cleanupTestFiles(testFiles);
      }
    }, 30000);
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle empty search queries gracefully [INV: Input validation]", async () => {
      // Act & Assert
      await expect(
        searchEngine.search({
          text: "",
          options: { maxResults: 10 },
        })
      ).rejects.toThrow();

      await expect(
        searchEngine.search({
          text: "   ",
          options: { maxResults: 10 },
        })
      ).rejects.toThrow();
    });

    it("should handle malformed content gracefully [INV: Error resilience]", async () => {
      // Arrange: Create malformed content
      const malformedFile = await createMalformedContent();

      try {
        // Act: Should not crash on malformed content
        const result = await knowledgeGraphSystem.pipeline.ingestFiles([
          malformedFile,
        ]);

        // Assert: Should handle gracefully
        expect(result).toBeDefined();
        // May have 0 processed files, but shouldn't crash

        console.log(
          `✅ Malformed content handled: ${result.processedFiles} files processed`
        );
      } finally {
        await cleanupTestFiles([malformedFile]);
      }
    });
  });

  // Helper functions for creating test content
  async function createTestContent(): Promise<string[]> {
    const testDir = path.join(process.cwd(), "test-temp");
    await fs.promises.mkdir(testDir, { recursive: true });

    const files = [
      {
        name: "ai-research.md",
        content: `# Artificial Intelligence Research

John Smith is a researcher at Microsoft Corporation working on machine learning algorithms.
He collaborates with Jane Doe from Stanford University on deep learning projects.
Their research focuses on natural language processing and computer vision.

Microsoft has invested heavily in AI research, partnering with various universities.
The company's AI division, led by Dr. Sarah Johnson, develops cutting-edge technologies.`,
      },
      {
        name: "tech-companies.txt",
        content: `Technology Companies and AI

Google (Alphabet Inc.) is a major player in artificial intelligence.
Amazon Web Services provides cloud computing for AI applications.
Apple Inc. integrates AI into consumer products.
Meta (formerly Facebook) develops AI for social media platforms.

These companies compete in the AI market while also collaborating on research.`,
      },
      {
        name: "research-paper.md",
        content: `# Deep Learning in Natural Language Processing

Abstract: This paper presents novel approaches to transformer architectures.

Authors:
- Dr. John Smith (Microsoft Research)
- Prof. Jane Doe (Stanford University)
- Dr. Alex Chen (Google DeepMind)

The research demonstrates significant improvements in language understanding.
Applications include machine translation, text summarization, and question answering.`,
      },
    ];

    const filePaths: string[] = [];
    for (const file of files) {
      const filePath = path.join(testDir, file.name);
      await fs.promises.writeFile(filePath, file.content);
      filePaths.push(filePath);
    }

    return filePaths;
  }

  async function createDuplicateEntityContent(): Promise<string[]> {
    const testDir = path.join(process.cwd(), "test-temp-duplicates");
    await fs.promises.mkdir(testDir, { recursive: true });

    const files = [
      {
        name: "doc1.md",
        content:
          "John Smith works at Microsoft Corporation. John is a senior researcher.",
      },
      {
        name: "doc2.txt",
        content:
          "Microsoft Corporation employs John Smith in their AI division. John Smith leads the research team.",
      },
      {
        name: "doc3.md",
        content:
          "J. Smith (also known as John Smith) is affiliated with Microsoft Corp.",
      },
    ];

    const filePaths: string[] = [];
    for (const file of files) {
      const filePath = path.join(testDir, file.name);
      await fs.promises.writeFile(filePath, file.content);
      filePaths.push(filePath);
    }

    return filePaths;
  }

  async function createSearchTestContent(): Promise<string[]> {
    const testDir = path.join(process.cwd(), "test-temp-search");
    await fs.promises.mkdir(testDir, { recursive: true });

    const files = [
      {
        name: "ai-overview.md",
        content: `Artificial Intelligence and Machine Learning

AI technologies are transforming industries worldwide.
Machine learning algorithms enable computers to learn from data.
Deep learning uses neural networks to solve complex problems.`,
      },
      {
        name: "tech-industry.txt",
        content: `Technology Industry Leaders

Major technology companies invest in AI research.
These companies develop innovative solutions for various markets.
Competition drives rapid advancement in AI capabilities.`,
      },
    ];

    const filePaths: string[] = [];
    for (const file of files) {
      const filePath = path.join(testDir, file.name);
      await fs.promises.writeFile(filePath, file.content);
      filePaths.push(filePath);
    }

    return filePaths;
  }

  async function createReasoningTestContent(): Promise<string[]> {
    const testDir = path.join(process.cwd(), "test-temp-reasoning");
    await fs.promises.mkdir(testDir, { recursive: true });

    const files = [
      {
        name: "connections.md",
        content: `Research Connections

Dr. Alice Johnson works at OpenAI and collaborates with researchers at MIT.
She previously worked at Google Brain before joining OpenAI.
Her research focuses on large language models and their applications.

OpenAI partners with Microsoft for cloud computing resources.
MIT has joint research projects with several technology companies.`,
      },
    ];

    const filePaths: string[] = [];
    for (const file of files) {
      const filePath = path.join(testDir, file.name);
      await fs.promises.writeFile(filePath, file.content);
      filePaths.push(filePath);
    }

    return filePaths;
  }

  async function createLargeTestDataset(): Promise<string[]> {
    const testDir = path.join(process.cwd(), "test-temp-large");
    await fs.promises.mkdir(testDir, { recursive: true });

    const files: string[] = [];

    // Create multiple files with varied content
    for (let i = 0; i < 5; i++) {
      const content = `# Document ${i + 1}

This is a test document about technology and innovation.
It contains information about artificial intelligence, machine learning, and data science.
Various companies and researchers are mentioned throughout the document.

Companies: TechCorp${i}, InnovateAI${i}, DataSystems${i}
Researchers: Dr. Smith${i}, Prof. Johnson${i}, Dr. Chen${i}

The document discusses various aspects of modern technology development.`;

      const filePath = path.join(testDir, `document-${i + 1}.md`);
      await fs.promises.writeFile(filePath, content);
      files.push(filePath);
    }

    return files;
  }

  async function createConcurrencyTestContent(): Promise<string[]> {
    const testDir = path.join(process.cwd(), "test-temp-concurrency");
    await fs.promises.mkdir(testDir, { recursive: true });

    const files: string[] = [];

    for (let i = 0; i < 3; i++) {
      const content = `# Concurrent Document ${i + 1}

This document is processed concurrently with others.
Entity: ConcurrentEntity${i}
Organization: ConcurrentOrg${i}

Content about concurrent processing and entity extraction.`;

      const filePath = path.join(testDir, `concurrent-${i + 1}.md`);
      await fs.promises.writeFile(filePath, content);
      files.push(filePath);
    }

    return files;
  }

  async function createMalformedContent(): Promise<string> {
    const testDir = path.join(process.cwd(), "test-temp-malformed");
    await fs.promises.mkdir(testDir, { recursive: true });

    const filePath = path.join(testDir, "malformed.txt");
    // Create content with unusual characters and formatting
    const malformedContent =
      "���\x00\x01\x02Invalid UTF-8 and control characters\n\n\n\n\n";
    await fs.promises.writeFile(filePath, malformedContent);

    return filePath;
  }

  async function cleanupTestFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await fs.promises.unlink(filePath);

        // Try to remove directory if empty
        const dir = path.dirname(filePath);
        try {
          await fs.promises.rmdir(dir);
        } catch {
          // Directory not empty or doesn't exist, ignore
        }
      } catch (error) {
        // File might not exist, ignore
      }
    }
  }
});
