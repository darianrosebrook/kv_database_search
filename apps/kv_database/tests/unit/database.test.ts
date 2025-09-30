import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Pool } from "pg";
import { DocumentDatabase } from "../../src/lib/database";

// Mock pg Pool
vi.mock("pg", () => ({
  Pool: vi.fn(),
}));

// Mock all the manager classes
vi.mock("../../src/lib/database-schema", () => ({
  DatabaseSchemaManager: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    clearAll: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("../../src/lib/database-operations", () => ({
  DocumentOperations: vi.fn().mockImplementation(() => ({
    upsertChunk: vi.fn().mockResolvedValue(undefined),
    batchUpsertChunks: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockResolvedValue([]),
    getChunkById: vi.fn().mockResolvedValue(null),
    getChunksByFile: vi.fn().mockResolvedValue([]),
    getStats: vi.fn().mockResolvedValue({ totalChunks: 0, totalFiles: 0 }),
    deleteChunksByFile: vi.fn().mockResolvedValue(undefined),
    getPerformanceMetrics: vi.fn().mockReturnValue({}),
  })),
}));

vi.mock("../../src/lib/chat-sessions", () => ({
  ChatSessionManager: vi.fn(),
}));

vi.mock("../../src/lib/document-versions", () => ({
  DocumentVersionManager: vi.fn(),
}));

vi.mock("../../src/lib/workspace-management", () => ({
  WorkspaceManager: vi.fn(),
}));

describe("DocumentDatabase", () => {
  let db: DocumentDatabase;
  const mockConnectionString = "postgresql://user:pass@localhost:5432/testdb";

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the Pool mock
    (Pool as any).mockClear();
    db = new DocumentDatabase(mockConnectionString, "test_chunks");
  });

  afterEach(async () => {
    await db.close();
  });

  describe("Constructor", () => {
    it("should create a new DocumentDatabase instance with correct configuration", () => {
      expect(Pool).toHaveBeenCalledWith({
        connectionString: mockConnectionString,
        max: 5,
        min: 1,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 2000,
        allowExitOnIdle: true,
      });
      expect(db).toBeInstanceOf(DocumentDatabase);
    });

    it("should use default table name when not provided", () => {
      const dbDefault = new DocumentDatabase(mockConnectionString);
      expect(dbDefault).toBeInstanceOf(DocumentDatabase);
    });
  });

  describe("Initialization", () => {
    it("should initialize the database successfully", async () => {
      await expect(db.initialize()).resolves.toBeUndefined();
    });
  });

  describe("Core Operations", () => {
    beforeEach(async () => {
      await db.initialize();
    });

    it("should upsert a chunk", async () => {
      const chunk = {
        id: "test-chunk",
        content: "test content",
        embedding: [0.1, 0.2, 0.3],
        metadata: { source: "test.txt" },
        fileName: "test.txt",
        chunkIndex: 0,
      };

      await expect(db.upsertChunk(chunk)).resolves.toBeUndefined();
    });

    it("should batch upsert chunks", async () => {
      const chunks = [
        {
          id: "test-chunk-1",
          content: "test content 1",
          embedding: [0.1, 0.2, 0.3],
          metadata: { source: "test.txt" },
          fileName: "test.txt",
          chunkIndex: 0,
        },
        {
          id: "test-chunk-2",
          content: "test content 2",
          embedding: [0.3, 0.2, 0.1],
          metadata: { source: "test.txt" },
          fileName: "test.txt",
          chunkIndex: 1,
        },
      ];

      await expect(db.batchUpsertChunks(chunks)).resolves.toBeUndefined();
    });

    it("should search for chunks", async () => {
      const queryEmbedding = [0.1, 0.2, 0.3];
      const results = await db.search(queryEmbedding);
      expect(Array.isArray(results)).toBe(true);
    });

    it("should search with options", async () => {
      const queryEmbedding = [0.1, 0.2, 0.3];
      const results = await db.search(queryEmbedding, {
        limit: 10,
        threshold: 0.8,
        includeMetadata: true,
      });
      expect(Array.isArray(results)).toBe(true);
    });

    it("should get chunk by id", async () => {
      const chunk = await db.getChunkById("test-id");
      expect(chunk).toBeNull();
    });

    it("should get chunks by file", async () => {
      const chunks = await db.getChunksByFile("test.txt");
      expect(Array.isArray(chunks)).toBe(true);
    });

    it("should get database stats", async () => {
      const stats = await db.getStats();
      expect(stats).toHaveProperty("totalChunks");
      expect(stats).toHaveProperty("totalFiles");
    });

    it("should delete chunks by file", async () => {
      await expect(db.deleteChunksByFile("test.txt")).resolves.toBeUndefined();
    });

    it("should get performance metrics", () => {
      const metrics = db.getPerformanceMetrics();
      expect(typeof metrics).toBe("object");
    });
  });
});
