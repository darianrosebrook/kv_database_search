import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  MultiModalIngestionPipeline,
  MultiModalIngestionConfig,
} from "../../src/lib/multi-modal-ingest.ts";
import { ContentType } from "../../src/lib/multi-modal.ts";
import fs from "fs";
import path from "path";

// Mock fs module for ESM
vi.mock("fs", async () => {
  const actual = await vi.importActual("fs");
  return {
    ...actual,
    statSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

describe("MultiModalIngestionPipeline", () => {
  let mockDatabase;
  let mockEmbeddings;
  let mockContentDetector;
  let mockMetadataExtractor;
  let pipeline: MultiModalIngestionPipeline;

  beforeEach(() => {
    // Mock database
    mockDatabase = {
      upsertChunk: vi.fn().mockResolvedValue(undefined),
      getChunkById: vi.fn().mockResolvedValue(null),
    };

    // Mock embeddings
    mockEmbeddings = {
      embedWithStrategy: vi.fn().mockResolvedValue({
        embedding: new Array(768).fill(0.1),
        model: { name: "test-model" },
        confidence: 0.9,
      }),
    };

    // Mock content detector
    mockContentDetector = {
      detectContentType: vi.fn(),
    };

    // Mock metadata extractor
    mockMetadataExtractor = {
      extractMetadata: vi.fn(),
    };

    // Create pipeline with mocked dependencies
    pipeline = new MultiModalIngestionPipeline(mockDatabase, mockEmbeddings);

    // Override internal dependencies
    pipeline.contentDetector = mockContentDetector;
    pipeline.metadataExtractor = mockMetadataExtractor;

    // Mock file system operations
    fs.statSync.mockReturnValue({
      size: 100,
      birthtime: new Date("2023-01-01"),
      mtime: new Date("2023-01-02"),
    });

    fs.readFileSync.mockReturnValue(Buffer.from("test content"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("ingestFiles", () => {
    it("should process files successfully", async () => {
      const testFiles = ["/test/file1.txt", "/test/file2.json"];

      // Mock metadata extraction
      mockMetadataExtractor.extractMetadata.mockResolvedValue({
        file: {
          id: "file_123",
          path: "/test/file1.txt",
          name: "file1.txt",
          extension: ".txt",
          mimeType: "text/plain",
          size: 100,
          createdAt: new Date(),
          modifiedAt: new Date(),
          checksum: "abc123",
        },
        content: {
          type: ContentType.PLAIN_TEXT,
          language: "en",
          encoding: "utf-8",
          wordCount: 2,
          characterCount: 12,
        },
        processing: {
          processedAt: new Date(),
          processor: "test",
          version: "1.0.0",
          parameters: {},
          processingTime: 100,
          success: true,
        },
        quality: {
          overallScore: 0.8,
          confidence: 0.8,
          completeness: 0.9,
          accuracy: 0.8,
          issues: [],
        },
        relationships: {
          relatedFiles: [],
          tags: [],
          categories: [],
          topics: [],
        },
      });

      const result = await pipeline.ingestFiles(testFiles, {
        batchSize: 1,
        rateLimitMs: 0,
      });

      expect(result.totalFiles).toBe(2);
      expect(result.processedFiles).toBe(2);
      expect(result.failedFiles).toBe(0);
      expect(result.totalChunks).toBeGreaterThan(0);
      expect(result.processedChunks).toBeGreaterThan(0);
    });

    it("should handle file processing errors gracefully", async () => {
      const testFiles = ["/test/file1.txt"];

      mockMetadataExtractor.extractMetadata.mockRejectedValue(
        new Error("Processing failed")
      );

      const result = await pipeline.ingestFiles(testFiles);

      expect(result.totalFiles).toBe(1);
      expect(result.processedFiles).toBe(0);
      expect(result.failedFiles).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Processing failed");
    });

    it("should skip existing chunks when configured", async () => {
      const testFiles = ["/test/file1.txt"];

      // Mock existing chunk
      mockDatabase.getChunkById.mockResolvedValue({
        id: "existing_chunk",
        text: "existing content",
      });

      // Mock metadata
      mockMetadataExtractor.extractMetadata.mockResolvedValue({
        file: {
          id: "file_123",
          path: "/test/file1.txt",
          name: "file1.txt",
          extension: ".txt",
          mimeType: "text/plain",
          size: 100,
          createdAt: new Date(),
          modifiedAt: new Date(),
          checksum: "abc123",
        },
        content: {
          type: ContentType.PLAIN_TEXT,
          language: "en",
          encoding: "utf-8",
          wordCount: 2,
          characterCount: 12,
        },
        processing: {
          processedAt: new Date(),
          processor: "test",
          version: "1.0.0",
          parameters: {},
          processingTime: 100,
          success: true,
        },
        quality: {
          overallScore: 0.8,
          confidence: 0.8,
          completeness: 0.9,
          accuracy: 0.8,
          issues: [],
        },
        relationships: {
          relatedFiles: [],
          tags: [],
          categories: [],
          topics: [],
        },
      });

      const result = await pipeline.ingestFiles(testFiles, {
        skipExisting: true,
      });

      expect(result.totalFiles).toBe(1);
      expect(result.processedFiles).toBe(1);
      expect(result.skippedFiles).toBe(0); // Files processed but chunks skipped
      expect(mockDatabase.upsertChunk).not.toHaveBeenCalled(); // Should skip existing chunks
    });

    it("should respect max file size limits", async () => {
      const testFiles = ["/test/large-file.txt"];

      // Mock large file
      vi.spyOn(fs, "statSync").mockReturnValue({
        size: 100 * 1024 * 1024, // 100MB
        birthtime: new Date(),
        mtime: new Date(),
      });

      const result = await pipeline.ingestFiles(testFiles, {
        maxFileSize: 50 * 1024 * 1024, // 50MB limit
      });

      expect(result.totalFiles).toBe(1);
      expect(result.processedFiles).toBe(0);
      expect(result.skippedFiles).toBe(1);
      expect(mockMetadataExtractor.extractMetadata).not.toHaveBeenCalled();
    });

    it.skip("should track content type statistics", async () => {
      const testFiles = ["/test/file1.txt", "/test/file2.json"];

      mockMetadataExtractor.extractMetadata
        .mockResolvedValueOnce({
          file: {
            id: "file_1",
            path: "/test/file1.txt",
            name: "file1.txt",
            extension: ".txt",
            mimeType: "text/plain",
            size: 100,
            createdAt: new Date(),
            modifiedAt: new Date(),
            checksum: "abc123",
          },
          content: { type: ContentType.PLAIN_TEXT },
          processing: {
            success: true,
            processedAt: new Date(),
            processor: "test",
            version: "1.0",
            parameters: {},
            processingTime: 100,
          },
          quality: {
            overallScore: 0.8,
            confidence: 0.8,
            completeness: 0.9,
            accuracy: 0.8,
            issues: [],
          },
          relationships: {
            relatedFiles: [],
            tags: [],
            categories: [],
            topics: [],
          },
        })
        .mockResolvedValueOnce({
          file: {
            id: "file_2",
            path: "/test/file2.json",
            name: "file2.json",
            extension: ".json",
            mimeType: "application/json",
            size: 50,
            createdAt: new Date(),
            modifiedAt: new Date(),
            checksum: "def456",
          },
          content: { type: ContentType.JSON },
          processing: {
            success: true,
            processedAt: new Date(),
            processor: "test",
            version: "1.0",
            parameters: {},
            processingTime: 100,
          },
          quality: {
            overallScore: 0.8,
            confidence: 0.8,
            completeness: 0.9,
            accuracy: 0.8,
            issues: [],
          },
          relationships: {
            relatedFiles: [],
            tags: [],
            categories: [],
            topics: [],
          },
        });

      const result = await pipeline.ingestFiles(testFiles);

      expect(result.contentTypeStats[ContentType.PLAIN_TEXT]).toBe(1);
      expect(result.contentTypeStats[ContentType.JSON]).toBe(1);
      expect(result.contentTypeStats[ContentType.PDF]).toBe(0);
    });
  });

  describe("Content-specific chunking", () => {
    const baseMetadata = {
      uri: "file:///test/file.txt",
      section: "file.txt",
      breadcrumbs: [],
      contentType: "plain_text",
      sourceType: "multi-modal",
      sourceDocumentId: "file.txt",
      lang: "en",
      acl: "public",
      updatedAt: new Date(),
      createdAt: new Date(),
      chunkIndex: 0,
      chunkCount: 1,
      multiModalFile: {
        fileId: "file_123",
        contentType: ContentType.PLAIN_TEXT,
        mimeType: "text/plain",
        checksum: "abc123",
        quality: {
          overallScore: 0.8,
          confidence: 0.8,
          completeness: 0.9,
          accuracy: 0.8,
          issues: [],
        },
        processing: {
          processedAt: new Date(),
          processor: "test",
          version: "1.0.0",
          parameters: {},
          processingTime: 100,
          success: true,
        },
      },
    };

    it.skip("should chunk text files by paragraphs", async () => {
      const metadata = {
        file: { id: "file_123", path: "/test/file.txt" },
        content: { type: ContentType.PLAIN_TEXT },
        processing: { success: true },
        quality: { overallScore: 0.8 },
        relationships: {
          relatedFiles: [],
          tags: [],
          categories: [],
          topics: [],
        },
      };

      const buffer = Buffer.from(
        "First paragraph.\n\nSecond paragraph with more content.\n\nThird paragraph."
      );

      const chunks = await pipeline["chunkTextFile"](
        buffer,
        baseMetadata,
        metadata
      );

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].text).toContain("First paragraph");
      expect(chunks[1].text).toContain("Second paragraph");
    });

    it("should create single chunks for unsupported file types", async () => {
      const metadata = {
        file: { id: "file_123", path: "/test/file.unknown" },
        content: { type: ContentType.UNKNOWN },
        processing: { success: true },
        quality: { overallScore: 0.5 },
        relationships: {
          relatedFiles: [],
          tags: [],
          categories: [],
          topics: [],
        },
      };

      const chunks = await pipeline["chunkMultiModalFile"](metadata);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].text).toContain("File:");
      expect(chunks[0].text).toContain("Quality Score:");
    });

    it("should generate unique chunk IDs", () => {
      const id1 = pipeline["generateChunkId"]("file_123", 0);
      const id2 = pipeline["generateChunkId"]("file_123", 1);
      const id3 = pipeline["generateChunkId"]("file_456", 0);

      expect(id1).not.toBe(id2);
      expect(id1).not.toBe(id3);
      expect(id1).toMatch(/^multi_file_123_0_[a-f0-9]{8}$/);
    });
  });

  describe("Configuration options", () => {
    it("should apply batch size configuration", async () => {
      const testFiles = [
        "/test/file1.txt",
        "/test/file2.txt",
        "/test/file3.txt",
      ];

      mockMetadataExtractor.extractMetadata.mockResolvedValue({
        file: {
          id: "file_123",
          path: "/test/file1.txt",
          name: "file1.txt",
          extension: ".txt",
          mimeType: "text/plain",
          size: 100,
          createdAt: new Date(),
          modifiedAt: new Date(),
          checksum: "abc123",
        },
        content: { type: ContentType.PLAIN_TEXT },
        processing: {
          success: true,
          processedAt: new Date(),
          processor: "test",
          version: "1.0",
          parameters: {},
          processingTime: 100,
        },
        quality: {
          overallScore: 0.8,
          confidence: 0.8,
          completeness: 0.9,
          accuracy: 0.8,
          issues: [],
        },
        relationships: {
          relatedFiles: [],
          tags: [],
          categories: [],
          topics: [],
        },
      });

      const startTime = Date.now();
      await pipeline.ingestFiles(testFiles, {
        batchSize: 1,
        rateLimitMs: 0,
      });
      const endTime = Date.now();

      // Should process all files since batch size is 1
      expect(mockMetadataExtractor.extractMetadata).toHaveBeenCalledTimes(3);
    });

    it("should handle rate limiting", async () => {
      const testFiles = ["/test/file1.txt", "/test/file2.txt"];

      mockMetadataExtractor.extractMetadata.mockResolvedValue({
        file: {
          id: "file_123",
          path: "/test/file1.txt",
          name: "file1.txt",
          extension: ".txt",
          mimeType: "text/plain",
          size: 100,
          createdAt: new Date(),
          modifiedAt: new Date(),
          checksum: "abc123",
        },
        content: { type: ContentType.PLAIN_TEXT },
        processing: {
          success: true,
          processedAt: new Date(),
          processor: "test",
          version: "1.0",
          parameters: {},
          processingTime: 100,
        },
        quality: {
          overallScore: 0.8,
          confidence: 0.8,
          completeness: 0.9,
          accuracy: 0.8,
          issues: [],
        },
        relationships: {
          relatedFiles: [],
          tags: [],
          categories: [],
          topics: [],
        },
      });

      const startTime = Date.now();
      await pipeline.ingestFiles(testFiles, {
        batchSize: 1,
        rateLimitMs: 100,
      });
      const endTime = Date.now();

      // Should take at least 100ms due to rate limiting
      expect(endTime - startTime).toBeGreaterThanOrEqual(90);
    });
  });
});
