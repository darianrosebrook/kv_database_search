import { describe, it, expect, beforeEach, vi } from "vitest";
import { IngestionPipeline } from "../../src/scripts/ingest";
import { ObsidianDatabase } from "../../src/lib/database";
import { ObsidianEmbeddingService } from "../../src/lib/embeddings";
import { ImageLinkExtractor } from "../../src/lib/image-link-extractor";
import { ImagePathResolver } from "../../src/lib/image-path-resolver";
import * as fs from "fs";

// Mock dependencies
vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    statSync: vi.fn(),
  },
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn(),
}));

vi.mock("../../src/lib/database");
vi.mock("../../src/lib/embeddings");
vi.mock("../../src/lib/obsidian-ingest");
vi.mock("../../src/lib/multi-modal-ingest");

// Mock the IngestionPipeline constructor
vi.mock("../../src/scripts/ingest", () => ({
  IngestionPipeline: vi.fn().mockImplementation(() => ({
    ingestVault: vi.fn(),
    validateIngestion: vi.fn(),
  })),
}));

describe("IngestionPipeline", () => {
  let mockDatabase: any;
  let mockEmbeddingService: any;
  let pipeline: IngestionPipeline;
  const vaultPath = "/test/vault";

  beforeEach(() => {
    mockDatabase = {
      initialize: vi.fn(),
      close: vi.fn(),
    };

    mockEmbeddingService = {
      testConnection: vi
        .fn()
        .mockResolvedValue({ success: true, dimension: 768 }),
    };

    // Create a mock constructor for IngestionPipeline
    pipeline = new (IngestionPipeline as any)(
      mockDatabase,
      mockEmbeddingService,
      vaultPath
    );

    vi.clearAllMocks();
  });

  describe("discoverFiles", () => {
    it("should discover files recursively", async () => {
      const options = {
        includePatterns: ["**/*"],
        excludePatterns: ["node_modules/**", ".git/**"],
      };

      // Mock fs functions
      (fs.existsSync as any).mockReturnValue(true);
      (fs.readdirSync as any).mockReturnValue([
        { name: "notes", isDirectory: () => true },
        { name: "document.md", isDirectory: () => false },
        { name: "image.png", isDirectory: () => false },
      ]);
      (fs.statSync as any).mockReturnValue({ isDirectory: () => false });

      const files = await (pipeline as any).discoverFiles(options);

      expect(files).toContain("/test/vault/document.md");
      expect(files).toContain("/test/vault/image.png");
    });

    it("should respect exclude patterns", async () => {
      const options = {
        includePatterns: ["**/*"],
        excludePatterns: ["**/node_modules/**", "**/temp/**"],
      };

      (fs.existsSync as any).mockReturnValue(true);
      (fs.readdirSync as any).mockReturnValue([
        { name: "node_modules", isDirectory: () => true },
        { name: "temp", isDirectory: () => true },
        { name: "document.md", isDirectory: () => false },
      ]);
      (fs.statSync as any).mockReturnValue({ isDirectory: () => false });

      const files = await (pipeline as any).discoverFiles(options);

      expect(files).not.toContain("/test/vault/node_modules");
      expect(files).not.toContain("/test/vault/temp");
      expect(files).toContain("/test/vault/document.md");
    });
  });

  describe("categorizeFiles", () => {
    it("should separate markdown and other files", () => {
      const files = [
        "/test/vault/notes/document1.md",
        "/test/vault/notes/document2.md",
        "/test/vault/images/screenshot.png",
        "/test/vault/documents/report.pdf",
        "/test/vault/assets/diagram.jpg",
      ];

      const result = (pipeline as any).categorizeFiles(files);

      expect(result.markdownFiles).toHaveLength(2);
      expect(result.markdownFiles).toEqual([
        "/test/vault/notes/document1.md",
        "/test/vault/notes/document2.md",
      ]);

      expect(result.otherFiles).toHaveLength(3);
      expect(result.otherFiles).toEqual([
        "/test/vault/images/screenshot.png",
        "/test/vault/documents/report.pdf",
        "/test/vault/assets/diagram.jpg",
      ]);
    });
  });

  describe("matchesPattern", () => {
    it("should match simple patterns", () => {
      const result1 = (pipeline as any).matchesPattern("test.md", "*.md");
      const result2 = (pipeline as any).matchesPattern("test.txt", "*.md");

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    it("should handle globstar patterns", () => {
      const result1 = (pipeline as any).matchesPattern(
        "notes/test.md",
        "**/*.md"
      );
      const result2 = (pipeline as any).matchesPattern(
        "notes/test.txt",
        "**/*.md"
      );

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    it("should handle multiple patterns", () => {
      const patterns = ["*.md", "*.txt"];
      const result1 = (pipeline as any).matchesPattern("test.md", "*.md");
      const result2 = (pipeline as any).matchesPattern("test.txt", "*.txt");

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe("ingestVault with image processing", () => {
    it("should process vault with image extraction enabled", async () => {
      const options = {
        enableImageProcessing: true,
        batchSize: 2,
        maxImagesPerFile: 5,
      };

      // Mock file discovery
      (fs.existsSync as any).mockReturnValue(true);
      (fs.readdirSync as any).mockReturnValue([
        { name: "notes", isDirectory: () => true },
        { name: "document.md", isDirectory: () => false },
        { name: "image.png", isDirectory: () => false },
      ]);
      (fs.statSync as any).mockReturnValue({ isDirectory: () => false });

      // Mock the processMarkdownFiles and processOtherFiles methods
      (pipeline as any).processMarkdownFiles = vi.fn().mockResolvedValue({
        totalFiles: 1,
        processedFiles: 1,
        totalChunks: 3,
        processedChunks: 3,
        skippedChunks: 0,
        errors: [],
        imageStats: {
          filesWithImages: 1,
          totalImages: 2,
          processedImages: 2,
          failedImages: 0,
        },
      });

      (pipeline as any).processOtherFiles = vi.fn().mockResolvedValue({
        totalFiles: 1,
        processedFiles: 1,
        totalChunks: 1,
        processedChunks: 1,
        skippedChunks: 0,
        errors: [],
      });

      const result = await pipeline.ingestVault(options);

      expect(result.processedFiles).toBe(2);
      expect(result.totalChunks).toBe(4);
      expect(result.imageStats.filesWithImages).toBe(1);
      expect(result.imageStats.totalImages).toBe(2);
    });
  });

  describe("ingestVault without image processing", () => {
    it("should process vault with image processing disabled", async () => {
      const options = {
        enableImageProcessing: false,
        batchSize: 2,
      };

      // Mock file discovery
      (fs.existsSync as any).mockReturnValue(true);
      (fs.readdirSync as any).mockReturnValue([
        { name: "document.md", isDirectory: () => false },
        { name: "image.png", isDirectory: () => false },
      ]);

      // Mock the processMarkdownFiles method (only markdown files processed)
      (pipeline as any).processMarkdownFiles = vi.fn().mockResolvedValue({
        totalFiles: 1,
        processedFiles: 1,
        totalChunks: 3,
        processedChunks: 3,
        skippedChunks: 0,
        errors: [],
        imageStats: {
          filesWithImages: 0,
          totalImages: 0,
          processedImages: 0,
          failedImages: 0,
        },
      });

      (pipeline as any).processOtherFiles = vi.fn().mockResolvedValue({
        totalFiles: 1,
        processedFiles: 1,
        totalChunks: 1,
        processedChunks: 1,
        skippedChunks: 0,
        errors: [],
      });

      const result = await pipeline.ingestVault(options);

      expect(result.processedFiles).toBe(2);
      expect(result.imageStats.filesWithImages).toBe(0);
      expect(result.imageStats.totalImages).toBe(0);
    });
  });

  describe("error handling", () => {
    it("should handle empty vault gracefully", async () => {
      const options = { enableImageProcessing: true };

      (fs.existsSync as any).mockReturnValue(false);

      const result = await pipeline.ingestVault(options);

      expect(result.totalFiles).toBe(0);
      expect(result.processedFiles).toBe(0);
      expect(result.imageStats.filesWithImages).toBe(0);
    });

    it("should handle processing errors", async () => {
      const options = { enableImageProcessing: true };

      (fs.existsSync as any).mockReturnValue(true);
      (fs.readdirSync as any).mockReturnValue([
        { name: "document.md", isDirectory: () => false },
      ]);

      // Mock processing to throw an error
      (pipeline as any).processMarkdownFiles = vi
        .fn()
        .mockRejectedValue(new Error("Processing failed"));

      await expect(pipeline.ingestVault(options)).rejects.toThrow(
        "Processing failed"
      );
    });
  });
});
