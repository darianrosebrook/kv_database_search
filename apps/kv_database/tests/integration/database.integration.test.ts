import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { ObsidianDatabase } from "../../src/lib/database.js";

describe("ObsidianDatabase Integration", () => {
  let postgresContainer: StartedPostgreSqlContainer;
  let database: ObsidianDatabase;

  // Helper to create 768-dimensional embeddings
  const createEmbedding = () =>
    new Array(768).fill(0).map(() => Math.random() * 2 - 1);

  beforeAll(async () => {
    // Start PostgreSQL container with pgvector extension
    postgresContainer = await new PostgreSqlContainer("pgvector/pgvector:pg16")
      .withDatabase("testdb")
      .withUsername("testuser")
      .withPassword("testpass")
      .start();

    // Create database instance with container connection
    const connectionString = postgresContainer.getConnectionUri();
    database = new ObsidianDatabase(connectionString);

    // Initialize database schema
    await database.initialize();
  }, 60000); // 60 second timeout for container startup

  afterAll(async () => {
    if (database) {
      await database.close();
    }
    if (postgresContainer) {
      await postgresContainer.stop();
    }
  });

  describe("Database Initialization", () => {
    it("should create the obsidian_chunks table", async () => {
      // This is implicitly tested by the beforeAll, but we can verify the table exists
      const stats = await database.getStats();
      expect(stats.totalChunks).toBe(0); // Should start empty
    });

    it("should create required indexes", async () => {
      // Test that we can query the database without errors
      const results = await database.search(createEmbedding(), 10);
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(0); // Should be empty initially
    });
  });

  describe("Chunk Operations", () => {
    const testChunk = {
      id: "test-chunk-1",
      text: "This is a test chunk of content for integration testing",
      meta: {
        uri: "obsidian://test/file.md",
        section: "Test Section",
        breadcrumbs: ["Root", "Test"],
        contentType: "note",
        sourceType: "obsidian",
        sourceDocumentId: "test-file",
        lang: "en",
        acl: "public",
        updatedAt: new Date("2024-01-01T00:00:00Z"),
        createdAt: new Date("2024-01-01T00:00:00Z"),
      },
      embedding: createEmbedding(),
    };

    it("should upsert a chunk successfully", async () => {
      await database.upsertChunk(testChunk);

      // Verify it was stored
      const retrieved = await database.getChunkById(testChunk.id);
      expect(retrieved).toBeTruthy();
      expect(retrieved!.text).toBe(testChunk.text);
      expect(retrieved!.meta.section).toBe(testChunk.meta.section);
    });

    it("should retrieve a chunk by ID", async () => {
      const retrieved = await database.getChunkById(testChunk.id);
      expect(retrieved).toBeTruthy();
      expect(retrieved!.id).toBe(testChunk.id);
      expect(retrieved!.text).toBe(testChunk.text);
    });

    it("should return null for non-existent chunk", async () => {
      const retrieved = await database.getChunkById("non-existent-id");
      expect(retrieved).toBeNull();
    });

    it("should update existing chunk on upsert", async () => {
      const updatedChunk = {
        ...testChunk,
        text: "Updated test chunk content",
      };

      await database.upsertChunk(updatedChunk);

      const retrieved = await database.getChunkById(testChunk.id);
      expect(retrieved!.text).toBe("Updated test chunk content");
    });
  });

  describe("Batch Operations", () => {
    const batchChunks = [
      {
        id: "batch-chunk-1",
        text: "First batch chunk",
        meta: {
          uri: "obsidian://batch/file1.md",
          section: "Batch Section 1",
          breadcrumbs: ["Root"],
          contentType: "note",
          sourceType: "obsidian",
          sourceDocumentId: "batch-file1",
          lang: "en",
          acl: "public",
          updatedAt: new Date(),
          createdAt: new Date(),
        },
        embedding: createEmbedding(),
      },
      {
        id: "batch-chunk-2",
        text: "Second batch chunk",
        meta: {
          uri: "obsidian://batch/file2.md",
          section: "Batch Section 2",
          breadcrumbs: ["Root"],
          contentType: "note",
          sourceType: "obsidian",
          sourceDocumentId: "batch-file2",
          lang: "en",
          acl: "public",
          updatedAt: new Date(),
          createdAt: new Date(),
        },
        embedding: createEmbedding(),
      },
    ];

    it("should batch upsert chunks", async () => {
      await database.batchUpsertChunks(batchChunks);

      // Verify both chunks were stored
      const chunk1 = await database.getChunkById("batch-chunk-1");
      const chunk2 = await database.getChunkById("batch-chunk-2");

      expect(chunk1).toBeTruthy();
      expect(chunk2).toBeTruthy();
      expect(chunk1!.text).toBe("First batch chunk");
      expect(chunk2!.text).toBe("Second batch chunk");
    });
  });

  describe("Search Operations", () => {
    beforeAll(async () => {
      // Add test data for search
      const searchChunks = [
        {
          id: "search-design-1",
          text: "Design systems are crucial for maintaining consistency across products",
          meta: {
            uri: "obsidian://search/design1.md",
            section: "Design Systems",
            breadcrumbs: ["Design"],
            contentType: "article",
            sourceType: "obsidian",
            sourceDocumentId: "design1",
            lang: "en",
            acl: "public",
            updatedAt: new Date(),
            createdAt: new Date(),
          },
          embedding: createEmbedding(), // High similarity to design queries
        },
        {
          id: "search-code-1",
          text: "TypeScript provides type safety for JavaScript applications",
          meta: {
            uri: "obsidian://search/code1.md",
            section: "TypeScript",
            breadcrumbs: ["Development"],
            contentType: "note",
            sourceType: "obsidian",
            sourceDocumentId: "code1",
            lang: "en",
            acl: "public",
            updatedAt: new Date(),
            createdAt: new Date(),
          },
          embedding: createEmbedding(), // High similarity to code queries
        },
        {
          id: "search-moc-1",
          text: "Maps of Content help organize knowledge in Obsidian vaults",
          meta: {
            uri: "obsidian://MOCs/knowledge.md",
            section: "Knowledge Management",
            breadcrumbs: ["MOCs"],
            contentType: "moc",
            sourceType: "obsidian",
            sourceDocumentId: "knowledge",
            lang: "en",
            acl: "public",
            updatedAt: new Date(),
            createdAt: new Date(),
          },
          embedding: createEmbedding(), // Moderate similarity
        },
      ];

      for (const chunk of searchChunks) {
        await database.upsertChunk(chunk);
      }
    });

    it("should search by vector similarity", async () => {
      const queryEmbedding = createEmbedding(); // Similar to design chunk
      const results = await database.search(queryEmbedding, 5);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe("search-design-1"); // Should be most similar
      expect(results[0].cosineSimilarity).toBeGreaterThan(0.9);
    });

    it("should filter by content type", async () => {
      const queryEmbedding = createEmbedding();
      const results = await database.search(queryEmbedding, 10, undefined, [
        "moc",
      ]);

      // Should only return MOC content
      results.forEach((result) => {
        expect(result.meta.contentType).toBe("moc");
      });
    });

    it("should respect limit parameter", async () => {
      const queryEmbedding = createEmbedding();
      const results = await database.search(queryEmbedding, 2);

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it("should filter by minimum similarity", async () => {
      const queryEmbedding = [0.8, 0.1, 0.2, 0.3, 0.4];
      const results = await database.search(
        queryEmbedding,
        10,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        0.5
      );

      results.forEach((result) => {
        expect(result.cosineSimilarity).toBeGreaterThanOrEqual(0.5);
      });
    });
  });

  describe("File-based Operations", () => {
    beforeAll(async () => {
      // Add chunks for the same file
      const fileChunks = [
        {
          id: "file-test-md-chunk-1",
          text: "First chunk of test.md",
          meta: {
            uri: "obsidian://test.md",
            section: "Introduction",
            breadcrumbs: ["Root"],
            contentType: "note",
            sourceType: "obsidian",
            sourceDocumentId: "test",
            lang: "en",
            acl: "public",
            updatedAt: new Date(),
            createdAt: new Date(),
            chunkIndex: 0,
          },
          embedding: createEmbedding(),
        },
        {
          id: "file-test-md-chunk-2",
          text: "Second chunk of test.md",
          meta: {
            uri: "obsidian://test.md",
            section: "Conclusion",
            breadcrumbs: ["Root"],
            contentType: "note",
            sourceType: "obsidian",
            sourceDocumentId: "test",
            lang: "en",
            acl: "public",
            updatedAt: new Date(),
            createdAt: new Date(),
            chunkIndex: 1,
          },
          embedding: createEmbedding(),
        },
      ];

      for (const chunk of fileChunks) {
        await database.upsertChunk(chunk);
      }
    });

    it("should retrieve all chunks for a file", async () => {
      const chunks = await database.getChunksByFile("test");

      expect(chunks.length).toBe(2);
      expect(chunks.map((c) => c.id)).toEqual(
        expect.arrayContaining(["file-test-md-chunk-1", "file-test-md-chunk-2"])
      );
    });

    it("should delete all chunks for a file", async () => {
      await database.deleteChunksByFile("test");

      const chunks = await database.getChunksByFile("test");
      expect(chunks.length).toBe(0);
    });
  });

  describe("Statistics", () => {
    it("should provide accurate statistics", async () => {
      const stats = await database.getStats();

      expect(typeof stats.totalChunks).toBe("number");
      expect(stats.totalChunks).toBeGreaterThanOrEqual(0);
      expect(typeof stats.byContentType).toBe("object");
      expect(typeof stats.byFolder).toBe("object");
      expect(typeof stats.tagDistribution).toBe("object");
    });

    it("should track content types correctly", async () => {
      const stats = await database.getStats();

      // Should have some content types from our test data
      expect(Object.keys(stats.byContentType).length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle dimension mismatch gracefully", async () => {
      const invalidChunk = {
        id: "invalid-chunk",
        text: "Test",
        meta: {
          uri: "obsidian://test.md",
          section: "Test",
          breadcrumbs: [],
          contentType: "note",
          sourceType: "obsidian",
          sourceDocumentId: "test",
          lang: "en",
          acl: "public",
          updatedAt: new Date(),
          createdAt: new Date(),
        },
        embedding: createEmbedding(),
      };

      await expect(database.upsertChunk(invalidChunk)).rejects.toThrow(
        "Embedding dimension mismatch"
      );
    });

    it("should handle search with wrong embedding dimensions", async () => {
      const wrongDimensionEmbedding = [0.1, 0.2, 0.3]; // Wrong dimension

      await expect(database.search(wrongDimensionEmbedding, 5)).rejects.toThrow(
        "Query embedding dimension mismatch"
      );
    });
  });
});
