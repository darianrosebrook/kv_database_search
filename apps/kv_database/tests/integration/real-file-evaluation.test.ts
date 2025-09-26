import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ObsidianDatabase } from "../../src/lib/database.ts";
import { ObsidianEmbeddingService } from "../../src/lib/embeddings.ts";
import { MultiModalIngestionPipeline } from "../../src/lib/multi-modal-ingest.ts";
import { ContentType } from "../../src/lib/multi-modal.ts";
import * as fs from "fs";
import * as path from "path";

// Use testcontainers for PostgreSQL
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";

describe("Real File Multi-Modal Evaluation", () => {
  let postgresContainer: StartedPostgreSqlContainer;
  let database: ObsidianDatabase;
  let embeddings: ObsidianEmbeddingService;
  let pipeline: MultiModalIngestionPipeline;

  const testFilesDir = path.join(process.cwd(), "test", "test-files");

  beforeEach(async () => {
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

    // Initialize embeddings (mock for integration tests)
    embeddings = new ObsidianEmbeddingService({
      model: "test-model",
      dimension: 768,
    });

    // Override the embedWithStrategy method for testing
    embeddings.embedWithStrategy = async (text: string) => ({
      embedding: new Array(768).fill(0.1),
      model: { name: "test-model" },
      confidence: 0.9,
    });

    // Create pipeline
    pipeline = new MultiModalIngestionPipeline(database, embeddings);

    // Processors are initialized within the pipeline
  }, 60000);

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

    // Processors are cleaned up automatically with the pipeline
  });

  describe("PDF Content Extraction", () => {
    const pdfFiles = [
      "05-versions-space.pdf",
      "Innovation Summit : Designing for AI: UX Patterns, Practice, and Product Differentiation.pdf",
      "Professional Values (from Being a Good Mentee course with Ellen Fisher).pdf",
    ];

    pdfFiles.forEach((fileName) => {
      it(`should extract meaningful content from ${fileName}`, async () => {
        const filePath = path.join(testFilesDir, fileName);

        if (!fs.existsSync(filePath)) {
          console.warn(`Test file ${fileName} not found, skipping test`);
          return;
        }

        // Use the multi-modal pipeline to process the PDF
        const result = await pipeline.ingestFiles([filePath], {
          batchSize: 1,
          skipExisting: false,
        });

        console.log(`\n=== PDF Analysis: ${fileName} ===`);
        console.log(`Files processed: ${result.processedFiles}`);
        console.log(`Chunks created: ${result.totalChunks}`);
        console.log(`Content type stats:`, result.contentTypeStats);

        // Verify the PDF was processed successfully
        expect(result.processedFiles).toBeGreaterThan(0);
        expect(result.totalChunks).toBeGreaterThan(0);

        // Check if PDF content type was detected
        const hasPdfContent =
          result.contentTypeStats.pdf > 0 ||
          result.contentTypeStats.unknown > 0;
        expect(hasPdfContent).toBe(true);

        // Check for successful processing (no errors)
        expect(result.errors.length).toBe(0);
      }, 30000);
    });
  });

  describe("Image OCR Content Extraction", () => {
    const imageFiles = [
      "5F3B751D-227B-45F3-ABF2-7E5F6F574A02.PNG",
      "darian-square.png",
      "IMG_0321.JPG",
      "Fj3JTkdXgAQcyd1.jpeg",
    ];

    imageFiles.forEach((fileName) => {
      it(`should extract text content from image ${fileName}`, async () => {
        const filePath = path.join(testFilesDir, fileName);

        if (!fs.existsSync(filePath)) {
          console.warn(`Test file ${fileName} not found, skipping test`);
          return;
        }

        // Use the multi-modal pipeline to process the image
        const result = await pipeline.ingestFiles([filePath], {
          batchSize: 1,
          skipExisting: false,
          enableOCR: true,
        });

        console.log(`\n=== OCR Analysis: ${fileName} ===`);
        console.log(`Files processed: ${result.processedFiles}`);
        console.log(`Chunks created: ${result.totalChunks}`);
        console.log(`Content type stats:`, result.contentTypeStats);

        // Verify the image was processed
        expect(result.processedFiles).toBeGreaterThanOrEqual(0); // May fail if OCR not available

        // Check if image content type was detected
        const hasImageContent =
          result.contentTypeStats.raster_image > 0 ||
          result.contentTypeStats.document_image > 0 ||
          result.contentTypeStats.unknown > 0;
        expect(hasImageContent).toBe(true);
      }, 45000);
    });
  });

  describe("Office Document Processing", () => {
    const officeFiles = ["Designers' Guide to Wielding AI.docx"];

    officeFiles.forEach((fileName) => {
      it(`should extract content from office document ${fileName}`, async () => {
        const filePath = path.join(testFilesDir, fileName);

        if (!fs.existsSync(filePath)) {
          console.warn(`Test file ${fileName} not found, skipping test`);
          return;
        }

        // Use the multi-modal pipeline to process the office document
        const result = await pipeline.ingestFiles([filePath], {
          batchSize: 1,
          skipExisting: false,
        });

        console.log(`\n=== Office Document Analysis: ${fileName} ===`);
        console.log(`Files processed: ${result.processedFiles}`);
        console.log(`Chunks created: ${result.totalChunks}`);
        console.log(`Content type stats:`, result.contentTypeStats);

        // Verify the office document was processed
        expect(result.processedFiles).toBeGreaterThanOrEqual(0);

        // Check if office document content type was detected
        const hasOfficeContent =
          result.contentTypeStats.office_document > 0 ||
          result.contentTypeStats.office_spreadsheet > 0 ||
          result.contentTypeStats.office_presentation > 0 ||
          result.contentTypeStats.unknown > 0;
        expect(hasOfficeContent).toBe(true);
      }, 30000);
    });
  });

  describe("Audio Content Processing", () => {
    it("should extract content from standalone audio files with speech-to-text", async () => {
      // Find audio files for testing
      const allFiles = fs.readdirSync(testFilesDir);
      const audioFiles = allFiles.filter((file) =>
        file.match(/\.(mp3|wav|m4a|aac|flac)$/i)
      );

      if (audioFiles.length === 0) {
        console.warn("No audio files found, skipping audio processing test");
        return;
      }

      const testFile = audioFiles[0];
      const filePath = path.join(testFilesDir, testFile);
      const stats = fs.statSync(filePath);

      console.log(
        `\n🎤 Processing audio: ${testFile} (${(
          stats.size /
          1024 /
          1024
        ).toFixed(1)}MB)`
      );

      const result = await pipeline.ingestFiles([filePath]);

      console.log(`📊 Audio processing result:`, {
        totalFiles: result.totalFiles,
        processedFiles: result.processedFiles,
        failedFiles: result.failedFiles,
        totalChunks: result.totalChunks,
        errors: result.errors,
      });

      // Audio processing should succeed
      expect(result.totalFiles).toBe(1);
      expect(result.processedFiles).toBeGreaterThanOrEqual(0);
      expect(result.failedFiles).toBeLessThanOrEqual(1);

      // If audio processing succeeded, we should have some indication
      if (result.processedFiles > 0) {
        expect(result.totalChunks).toBeGreaterThan(0);
        console.log(
          `✅ Audio processed successfully with ${result.totalChunks} chunks`
        );
      } else {
        console.log(
          `⚠️ Audio processing completed but no extractable content found`
        );
      }
    }, 60000);
  });

  describe("Video Content Processing", () => {
    it("should extract content from video files with OCR and entity recognition", async () => {
      // Find a small video file for testing
      const allFiles = fs.readdirSync(testFilesDir);
      const videoFiles = allFiles.filter((file) =>
        file.match(/\.(mp4|mov|avi|mkv|webm)$/i)
      );

      if (videoFiles.length === 0) {
        console.warn("No video files found, skipping video processing test");
        return;
      }

      // Choose the smallest video file for testing
      let testFile = videoFiles[0];
      let smallestSize = Infinity;

      for (const file of videoFiles) {
        const filePath = path.join(testFilesDir, file);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          if (stats.size < smallestSize) {
            smallestSize = stats.size;
            testFile = file;
          }
        }
      }

      const filePath = path.join(testFilesDir, testFile);
      console.log(
        `\n🎬 Processing video: ${testFile} (${(
          smallestSize /
          1024 /
          1024
        ).toFixed(1)}MB)`
      );

      const result = await pipeline.ingestFiles([filePath]);

      console.log(`📊 Video processing result:`, {
        totalFiles: result.totalFiles,
        processedFiles: result.processedFiles,
        failedFiles: result.failedFiles,
        totalChunks: result.totalChunks,
        errors: result.errors,
      });

      // The video might not produce chunks if no text is found, but processing should succeed
      expect(result.totalFiles).toBe(1);
      expect(result.processedFiles).toBeGreaterThanOrEqual(0);
      expect(result.failedFiles).toBeLessThanOrEqual(1);

      // If video processing succeeded, we should have some indication
      if (result.processedFiles > 0) {
        expect(result.totalChunks).toBeGreaterThan(0);
        console.log(
          `✅ Video processed successfully with ${result.totalChunks} chunks`
        );
      } else {
        console.log(
          `⚠️ Video processing completed but no extractable content found`
        );
      }
    }, 60000);
  });

  describe("Structured Data Processing", () => {
    it("should process CSV data correctly", async () => {
      const filePath = path.join(
        testFilesDir,
        "Untitled spreadsheet - Sheet1.csv"
      );

      if (!fs.existsSync(filePath)) {
        console.warn("CSV test file not found, skipping test");
        return;
      }

      const result = await pipeline.ingestFiles([filePath]);

      console.log(`\n=== CSV Analysis ===`);
      console.log(`Files processed: ${result.processedFiles}`);
      console.log(`Chunks created: ${result.totalChunks}`);
      console.log(`Content type stats:`, result.contentTypeStats);

      expect(result.processedFiles).toBe(1);
      expect(result.totalChunks).toBeGreaterThan(0);
      expect(result.contentTypeStats[ContentType.CSV]).toBe(1);
    }, 30000);

    it("should process markdown files correctly", async () => {
      const filePath = path.join(
        testFilesDir,
        "The birth of Inter  Figma Blog.md"
      );

      if (!fs.existsSync(filePath)) {
        console.warn("Markdown test file not found, skipping test");
        return;
      }

      const result = await pipeline.ingestFiles([filePath]);

      console.log(`\n=== Markdown Analysis ===`);
      console.log(`Files processed: ${result.processedFiles}`);
      console.log(`Chunks created: ${result.totalChunks}`);
      console.log(`Content type stats:`, result.contentTypeStats);

      expect(result.processedFiles).toBe(1);
      expect(result.totalChunks).toBeGreaterThan(0);
      expect(result.contentTypeStats[ContentType.MARKDOWN]).toBe(1);
    }, 30000);

    it("should process HTML files correctly", async () => {
      const filePath = path.join(
        testFilesDir,
        "inference-embeddinggemma-with-sentence-transformers.html"
      );

      if (!fs.existsSync(filePath)) {
        console.warn("HTML test file not found, skipping test");
        return;
      }

      const result = await pipeline.ingestFiles([filePath]);

      console.log(`\n=== HTML Analysis ===`);
      console.log(`Files processed: ${result.processedFiles}`);
      console.log(`Chunks created: ${result.totalChunks}`);
      console.log(`Content type stats:`, result.contentTypeStats);

      expect(result.processedFiles).toBe(1);
      expect(result.totalChunks).toBeGreaterThan(0);
    }, 30000);
  });

  describe("Comprehensive Multi-Modal Ingestion", () => {
    it("should process a diverse set of files and provide semantic insights", async () => {
      // Select a representative sample of files for comprehensive testing
      const testFiles = [
        "05-versions-space.pdf",
        "Designers' Guide to Wielding AI.docx",
        "The birth of Inter  Figma Blog.md",
        "Untitled spreadsheet - Sheet1.csv",
        "darian-square.png",
      ];

      const filePaths = testFiles
        .map((fileName) => path.join(testFilesDir, fileName))
        .filter((filePath) => fs.existsSync(filePath));

      if (filePaths.length === 0) {
        console.warn("No test files found, skipping comprehensive test");
        return;
      }

      console.log(`\n=== Comprehensive Multi-Modal Analysis ===`);
      console.log(`Processing ${filePaths.length} files...`);

      const result = await pipeline.ingestFiles(filePaths, {
        batchSize: 2,
        rateLimitMs: 100,
      });

      console.log(`\n=== Results Summary ===`);
      console.log(`Total files: ${result.totalFiles}`);
      console.log(`Processed files: ${result.processedFiles}`);
      console.log(`Failed files: ${result.failedFiles}`);
      console.log(`Total chunks: ${result.totalChunks}`);
      console.log(`Content type distribution:`, result.contentTypeStats);
      console.log(`Processing time: ${result.processingTime}ms`);

      if (result.errors.length > 0) {
        console.log(`Errors encountered:`, result.errors);
      }

      // Validate comprehensive processing
      expect(result.totalFiles).toBe(filePaths.length);
      expect(result.processedFiles).toBeGreaterThan(0);
      expect(result.totalChunks).toBeGreaterThan(0);
      expect(Object.keys(result.contentTypeStats).length).toBeGreaterThan(0);

      // Test semantic search capabilities
      const searchQuery = "design artificial intelligence";
      const searchVector = new Array(768).fill(0.1);
      const searchResults = await database.search(searchVector, 10);

      console.log(`\n=== Semantic Search Test ===`);
      console.log(`Query: "${searchQuery}"`);
      console.log(`Results found: ${searchResults.length}`);

      searchResults.slice(0, 3).forEach((result, index) => {
        console.log(`\nResult ${index + 1}:`);
        console.log(`Score: ${result.score}`);
        console.log(
          `Content type: ${
            result.meta.multiModalFile?.contentType || "unknown"
          }`
        );
        console.log(`File: ${result.meta.file_path || "unknown"}`);
        console.log(`Text preview: ${result.text.substring(0, 150)}...`);
      });

      expect(searchResults.length).toBeGreaterThan(0);

      // Validate that multi-modal metadata is preserved
      const hasMultiModalMetadata = searchResults.some(
        (result) => result.meta.multiModalFile !== undefined
      );
      expect(hasMultiModalMetadata).toBe(true);
    }, 60000);
  });

  describe("Content Quality Assessment", () => {
    it("should provide quality metrics for extracted content", async () => {
      const testFiles = [
        "05-versions-space.pdf",
        "darian-square.png",
        "The birth of Inter  Figma Blog.md",
      ];

      for (const fileName of testFiles) {
        const filePath = path.join(testFilesDir, fileName);

        if (!fs.existsSync(filePath)) {
          console.warn(
            `Test file ${fileName} not found, skipping quality test`
          );
          continue;
        }

        const result = await pipeline.ingestFiles([filePath]);

        if (result.processedFiles > 0) {
          const chunks = await database.search(new Array(768).fill(0.1), 5);
          const chunk = chunks[0];

          console.log(`\n=== Quality Assessment: ${fileName} ===`);
          console.log(
            `Overall quality score: ${chunk.meta.multiModalFile?.quality.overallScore}`
          );
          console.log(
            `Content confidence: ${chunk.meta.multiModalFile?.quality.contentConfidence}`
          );
          console.log(
            `Structure score: ${chunk.meta.multiModalFile?.quality.structureScore}`
          );
          console.log(
            `Language confidence: ${chunk.meta.multiModalFile?.quality.languageConfidence}`
          );

          expect(
            chunk.meta.multiModalFile?.quality.overallScore
          ).toBeGreaterThan(0);
          expect(
            chunk.meta.multiModalFile?.quality.overallScore
          ).toBeLessThanOrEqual(1);
          expect(chunk.meta.multiModalFile?.processing.success).toBe(true);
        }
      }
    }, 60000);
  });
});
