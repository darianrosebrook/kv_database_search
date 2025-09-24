import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ObsidianDatabase } from "../../src/lib/database.js";
import { ObsidianEmbeddingService } from "../../src/lib/embeddings.js";
import { MultiModalIngestionPipeline } from "../../src/lib/multi-modal-ingest.js";
import { ContentType } from "../../src/lib/multi-modal.js";
import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";

// Use testcontainers for PostgreSQL
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";

describe("MultiModalIngestionPipeline Integration", () => {
  let postgresContainer: StartedPostgreSqlContainer;
  let database: ObsidianDatabase;
  let embeddings: ObsidianEmbeddingService;
  let pipeline: MultiModalIngestionPipeline;
  let testDir: string;

  beforeEach(async () => {
    // Start PostgreSQL container
    postgresContainer = await new PostgreSqlContainer("postgres:16")
      .withDatabase("testdb")
      .withUsername("testuser")
      .withPassword("testpass")
      .start();

    const connectionString = postgresContainer.getConnectionUri();

    // Initialize database
    database = new ObsidianDatabase(connectionString);
    await database.initialize();

    // Initialize embeddings (mock for integration tests)
    embeddings = new ObsidianEmbeddingService({
      model: "test-model",
      dimension: 768,
    });

    // Override the embedWithStrategy method for testing
    (embeddings as any).embedWithStrategy = async () => ({
      embedding: new Array(768).fill(0.1),
      model: { name: "test-model" },
      confidence: 0.9,
    });

    // Create pipeline
    pipeline = new MultiModalIngestionPipeline(database, embeddings);

    // Create test directory
    testDir = path.join(process.cwd(), "test-temp");
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  }, 60000); // 60 second timeout for container startup

  afterEach(async () => {
    // Clean up database
    if (database) {
      await database.clearAll();
      await database.close();
    }

    // Stop container
    if (postgresContainer) {
      await postgresContainer.stop();
    }

    // Clean up test files
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("End-to-end file ingestion", () => {
    it("should ingest text files successfully", async () => {
      // Create test files
      const textFile = path.join(testDir, "test.txt");
      fs.writeFileSync(
        textFile,
        "This is a test text file.\nIt contains multiple lines.\n\nAnd paragraphs."
      );

      const jsonFile = path.join(testDir, "test.json");
      fs.writeFileSync(
        jsonFile,
        '{"name": "test", "description": "A test JSON file", "items": [1, 2, 3]}'
      );

      // Ingest files
      const result = await pipeline.ingestFiles([textFile, jsonFile], {
        batchSize: 1,
        rateLimitMs: 0,
      });

      // Verify results
      expect(result.totalFiles).toBe(2);
      expect(result.processedFiles).toBe(2);
      expect(result.failedFiles).toBe(0);
      expect(result.totalChunks).toBeGreaterThan(0);
      expect(result.processedChunks).toBeGreaterThan(0);

      // Check content type stats
      expect(result.contentTypeStats[ContentType.PLAIN_TEXT]).toBe(1);
      expect(result.contentTypeStats[ContentType.JSON]).toBe(1);

      // Verify database contains chunks
      const stats = await database.getStats();
      expect(stats.totalChunks).toBeGreaterThan(0);

      // Verify chunks have multi-modal metadata
      const sampleChunks = await database.search(new Array(768).fill(0), 5);
      const hasMultiModal = sampleChunks.some(
        (chunk) => chunk.meta.multiModalFile !== undefined
      );
      expect(hasMultiModal).toBe(true);
    }, 30000);

    it("should handle mixed file types", async () => {
      // Create various test files
      const files = [
        {
          name: "document.md",
          content: "# Test Document\n\nThis is a markdown file.",
          type: ContentType.MARKDOWN,
        },
        {
          name: "data.json",
          content: '{"test": "data", "numbers": [1,2,3]}',
          type: ContentType.JSON,
        },
        {
          name: "spreadsheet.csv",
          content: "name,value\ntest,123\nother,456",
          type: ContentType.CSV,
        },
        {
          name: "notes.txt",
          content: "Simple text notes.\nMore content here.",
          type: ContentType.PLAIN_TEXT,
        },
      ];

      const filePaths: string[] = [];
      for (const file of files) {
        const filePath = path.join(testDir, file.name);
        fs.writeFileSync(filePath, file.content);
        filePaths.push(filePath);
      }

      // Ingest files
      const result = await pipeline.ingestFiles(filePaths, {
        batchSize: 2,
        rateLimitMs: 10,
      });

      // Verify all files processed
      expect(result.totalFiles).toBe(4);
      expect(result.processedFiles).toBe(4);
      expect(result.failedFiles).toBe(0);

      // Check content type distribution
      expect(result.contentTypeStats[ContentType.MARKDOWN]).toBe(1);
      expect(result.contentTypeStats[ContentType.JSON]).toBe(1);
      expect(result.contentTypeStats[ContentType.CSV]).toBe(1);
      expect(result.contentTypeStats[ContentType.PLAIN_TEXT]).toBe(1);
    }, 30000);

    it("should handle large files appropriately", async () => {
      // Create a moderately large text file
      const largeContent = "This is a test sentence. ".repeat(1000);
      const largeFile = path.join(testDir, "large.txt");
      fs.writeFileSync(largeFile, largeContent);

      const result = await pipeline.ingestFiles([largeFile]);

      expect(result.totalFiles).toBe(1);
      expect(result.processedFiles).toBe(1);
      expect(result.totalChunks).toBeGreaterThan(1); // Should be chunked
    }, 30000);

    it("should respect skip existing configuration", async () => {
      const textFile = path.join(testDir, "test.txt");
      fs.writeFileSync(textFile, "Test content for skip existing test.");

      // First ingestion
      const result1 = await pipeline.ingestFiles([textFile], {
        skipExisting: false,
      });

      expect(result1.processedFiles).toBe(1);
      expect(result1.totalChunks).toBeGreaterThan(0);

      // Second ingestion with skip existing
      const result2 = await pipeline.ingestFiles([textFile], {
        skipExisting: true,
      });

      expect(result2.processedFiles).toBe(1);
      expect(result2.totalChunks).toBe(result1.totalChunks); // Same chunks
    }, 30000);
  });

  describe("Database persistence", () => {
    it("should persist chunks with correct metadata", async () => {
      const textFile = path.join(testDir, "metadata-test.txt");
      const content = "Test content for metadata verification.";
      fs.writeFileSync(textFile, content);

      await pipeline.ingestFiles([textFile]);

      // Query database directly
      const chunks = await database.search(new Array(768).fill(0), 10);

      expect(chunks.length).toBeGreaterThan(0);

      const chunk = chunks[0];
      expect(chunk.meta.multiModalFile).toBeDefined();
      expect(chunk.meta.multiModalFile?.contentType).toBe(
        ContentType.PLAIN_TEXT
      );
      expect(chunk.meta.multiModalFile?.mimeType).toBe("text/plain");
      expect(chunk.meta.multiModalFile?.quality.overallScore).toBeGreaterThan(
        0
      );
      expect(chunk.meta.multiModalFile?.processing.success).toBe(true);
    }, 30000);

    it("should maintain data integrity across restarts", async () => {
      const textFile = path.join(testDir, "integrity-test.txt");
      fs.writeFileSync(textFile, "Content for integrity testing.");

      // Ingest and verify
      const result1 = await pipeline.ingestFiles([textFile]);
      const stats1 = await database.getStats();

      // Simulate restart by creating new pipeline
      const pipeline2 = new MultiModalIngestionPipeline(database, embeddings);

      // Verify data still exists
      const stats2 = await database.getStats();
      expect(stats2.totalChunks).toBe(stats1.totalChunks);

      // Re-ingest with skip existing
      const result2 = await pipeline2.ingestFiles([textFile], {
        skipExisting: true,
      });

      expect(result2.processedFiles).toBe(1);
      expect(result2.totalChunks).toBe(result1.totalChunks);
    }, 30000);
  });

  describe("Error handling and recovery", () => {
    it("should handle corrupted files gracefully", async () => {
      // Create a file that might cause parsing issues
      const corruptedFile = path.join(testDir, "corrupted.md");
      fs.writeFileSync(
        corruptedFile,
        "# Valid header\n\n" + "\x00\x01\x02".repeat(100)
      );

      const result = await pipeline.ingestFiles([corruptedFile]);

      // Should still process the file, even if with reduced quality
      expect(result.totalFiles).toBe(1);
      expect(result.processedFiles).toBe(1);
      expect(result.failedFiles).toBe(0);
    }, 30000);

    it("should handle permission errors", async () => {
      const restrictedFile = path.join(testDir, "restricted.txt");
      fs.writeFileSync(restrictedFile, "This file should be readable.");

      // Change permissions to simulate access issues
      try {
        fs.chmodSync(restrictedFile, 0o000);

        const result = await pipeline.ingestFiles([restrictedFile]);

        // Should handle the error gracefully
        expect(result.totalFiles).toBe(1);
        expect(result.failedFiles).toBe(1);
        expect(result.errors.length).toBeGreaterThan(0);
      } finally {
        // Restore permissions for cleanup
        try {
          fs.chmodSync(restrictedFile, 0o644);
        } catch {}
      }
    }, 30000);

    it("should handle empty files", async () => {
      const emptyFile = path.join(testDir, "empty.txt");
      fs.writeFileSync(emptyFile, "");

      const result = await pipeline.ingestFiles([emptyFile]);

      expect(result.totalFiles).toBe(1);
      expect(result.processedFiles).toBe(1);
      expect(result.totalChunks).toBe(0); // Empty files might not create chunks
    }, 30000);
  });

  describe("Performance characteristics", () => {
    it("should process files within reasonable time limits", async () => {
      // Create multiple files
      const files: string[] = [];
      for (let i = 0; i < 5; i++) {
        const filePath = path.join(testDir, `perf-test-${i}.txt`);
        fs.writeFileSync(
          filePath,
          `Performance test content ${i}. `.repeat(50)
        );
        files.push(filePath);
      }

      const startTime = Date.now();
      const result = await pipeline.ingestFiles(files, {
        batchSize: 2,
        rateLimitMs: 50,
      });
      const duration = Date.now() - startTime;

      expect(result.totalFiles).toBe(5);
      expect(result.processedFiles).toBe(5);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    }, 30000);

    it("should maintain reasonable memory usage", async () => {
      // Create a larger file to test memory handling
      const largeContent = "Large content block. ".repeat(5000);
      const largeFile = path.join(testDir, "memory-test.txt");
      fs.writeFileSync(largeFile, largeContent);

      const initialMemory = process.memoryUsage().heapUsed;
      await pipeline.ingestFiles([largeFile]);
      const finalMemory = process.memoryUsage().heapUsed;

      // Memory usage should not increase dramatically
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    }, 30000);
  });

  describe("Content type specific behavior", () => {
    it("should handle markdown files with sections", async () => {
      const mdFile = path.join(testDir, "sections.md");
      const content = `# Header 1

Content for header 1.

## Header 2

Content for header 2.

### Header 3

More content here.

# Another Header 1

Final content.`;

      fs.writeFileSync(mdFile, content);

      const result = await pipeline.ingestFiles([mdFile]);

      expect(result.totalFiles).toBe(1);
      expect(result.processedFiles).toBe(1);
      expect(result.contentTypeStats[ContentType.MARKDOWN]).toBe(1);

      // Check that chunks contain section information
      const chunks = await database.search(new Array(768).fill(0), 10);
      const hasSections = chunks.some(
        (chunk) => chunk.meta.section && chunk.meta.section.includes("Header")
      );
      expect(hasSections).toBe(true);
    }, 30000);

    it("should handle structured data files", async () => {
      const xmlFile = path.join(testDir, "test.xml");
      const xmlContent = `<?xml version="1.0"?>
<root>
  <item id="1">
    <name>Test Item</name>
    <value>123</value>
  </item>
  <item id="2">
    <name>Another Item</name>
    <value>456</value>
  </item>
</root>`;

      fs.writeFileSync(xmlFile, xmlContent);

      const result = await pipeline.ingestFiles([xmlFile]);

      expect(result.totalFiles).toBe(1);
      expect(result.processedFiles).toBe(1);
      expect(result.contentTypeStats[ContentType.XML]).toBe(1);

      // Verify XML content is preserved in chunks
      const chunks = await database.search(new Array(768).fill(0), 5);
      const xmlChunk = chunks.find((chunk) => chunk.text.includes("xml"));
      expect(xmlChunk).toBeDefined();
    }, 30000);
  });
});
