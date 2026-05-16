import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

import {
  DocumentIngestionPipeline,
  ObsidianIngestionPipeline,
  OBSIDIAN_CONFIG,
  MARKDOWN_CONFIG,
  NOTION_CONFIG,
  type DocumentDatabaseLike,
  type DocumentEmbeddingServiceLike,
  type IngestionChunk,
} from "../../src/index";

function createFakeDatabase(): DocumentDatabaseLike & {
  upserted: Array<IngestionChunk & { embedding: number[] }>;
} {
  const upserted: Array<IngestionChunk & { embedding: number[] }> = [];
  return {
    upserted,
    async getChunkById() {
      return null;
    },
    async upsertChunk(chunk) {
      upserted.push(chunk);
      return undefined;
    },
    async getStats() {
      return { totalChunks: upserted.length };
    },
    async search() {
      return [];
    },
  };
}

function createFakeEmbeddings(): DocumentEmbeddingServiceLike {
  return {
    async embed() {
      return [0.1, 0.2, 0.3];
    },
    async embedWithStrategy() {
      return { embedding: [0.1, 0.2, 0.3] };
    },
  };
}

describe("@kv/ingestion", () => {
  describe("config presets", () => {
    it("exports OBSIDIAN_CONFIG with obsidian:// uri scheme", () => {
      expect(OBSIDIAN_CONFIG.uriScheme).toBe("obsidian");
      expect(OBSIDIAN_CONFIG.systemName).toBe("Obsidian");
      expect(OBSIDIAN_CONFIG.linkFormats.length).toBeGreaterThan(0);
    });

    it("exports MARKDOWN_CONFIG with file:// uri scheme", () => {
      expect(MARKDOWN_CONFIG.uriScheme).toBe("file");
      expect(MARKDOWN_CONFIG.linkFormats.length).toBeGreaterThan(1);
    });

    it("exports NOTION_CONFIG with notion:// uri scheme", () => {
      expect(NOTION_CONFIG.uriScheme).toBe("notion");
    });
  });

  describe("DocumentIngestionPipeline", () => {
    let tempDir: string;
    let db: ReturnType<typeof createFakeDatabase>;
    let embeddings: DocumentEmbeddingServiceLike;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "kv-ingest-test-"));
      db = createFakeDatabase();
      embeddings = createFakeEmbeddings();
    });

    it("discovers and ingests a markdown file", async () => {
      const filePath = path.join(tempDir, "note.md");
      fs.writeFileSync(
        filePath,
        "---\ntitle: Sample\ntags:\n  - alpha\n---\n# Heading\n\nBody text here."
      );

      const pipeline = new DocumentIngestionPipeline(
        db,
        embeddings,
        tempDir,
        MARKDOWN_CONFIG
      );

      const result = await pipeline.ingestDocuments({
        skipExisting: false,
        rateLimitMs: 0,
      });

      expect(result.totalFiles).toBe(1);
      expect(result.processedFiles).toBe(1);
      expect(result.processedChunks).toBeGreaterThan(0);
      expect(db.upserted.length).toBe(result.processedChunks);
    });

    it("uses the config's uriScheme in chunk metadata", async () => {
      const filePath = path.join(tempDir, "page.md");
      fs.writeFileSync(filePath, "# Page\n\nContent body.");

      const pipeline = new DocumentIngestionPipeline(
        db,
        embeddings,
        tempDir,
        NOTION_CONFIG
      );
      await pipeline.ingestDocuments({ skipExisting: false, rateLimitMs: 0 });

      expect(db.upserted[0].meta.uri.startsWith("notion://")).toBe(true);
      expect(db.upserted[0].meta.sourceType).toBe("notion");
    });

    it("respects skipExisting by querying getChunkById", async () => {
      const filePath = path.join(tempDir, "existing.md");
      fs.writeFileSync(filePath, "# Title\n\nBody.");

      const spy = vi.fn().mockResolvedValue({ id: "exists" });
      db.getChunkById = spy;

      const pipeline = new DocumentIngestionPipeline(
        db,
        embeddings,
        tempDir,
        MARKDOWN_CONFIG
      );
      const result = await pipeline.ingestDocuments({
        skipExisting: true,
        rateLimitMs: 0,
      });

      expect(spy).toHaveBeenCalled();
      expect(result.skippedChunks).toBeGreaterThan(0);
      expect(db.upserted.length).toBe(0);
    });

    it("excludes files matching excludePatterns", async () => {
      fs.mkdirSync(path.join(tempDir, "Attachments"), { recursive: true });
      fs.writeFileSync(path.join(tempDir, "Attachments", "skip.md"), "# skip");
      fs.writeFileSync(path.join(tempDir, "keep.md"), "# keep");

      const pipeline = new DocumentIngestionPipeline(
        db,
        embeddings,
        tempDir,
        MARKDOWN_CONFIG
      );
      const result = await pipeline.ingestDocuments({
        skipExisting: false,
        rateLimitMs: 0,
      });

      expect(result.totalFiles).toBe(1);
    });
  });

  describe("ObsidianIngestionPipeline (backward compat)", () => {
    it("constructs with OBSIDIAN_CONFIG by default", () => {
      const db = createFakeDatabase();
      const embeddings = createFakeEmbeddings();
      const pipeline = new ObsidianIngestionPipeline(db, embeddings, "/tmp");
      expect(pipeline).toBeInstanceOf(DocumentIngestionPipeline);
    });

    it("exposes ingestVault as an alias for ingestDocuments", async () => {
      const tempDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "kv-ingest-vault-")
      );
      fs.writeFileSync(path.join(tempDir, "note.md"), "# Hello");

      const db = createFakeDatabase();
      const embeddings = createFakeEmbeddings();
      const pipeline = new ObsidianIngestionPipeline(db, embeddings, tempDir);
      const result = await pipeline.ingestVault({
        rateLimitMs: 0,
        skipExisting: false,
      });

      expect(result.totalFiles).toBe(1);
      expect(result.processedFiles).toBe(1);
    });
  });
});
