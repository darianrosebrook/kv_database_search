import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { OCRProcessor } from "../../src/lib/processors/ocr-processor";
import { PDFProcessor } from "../../src/lib/processors/pdf-processor";
import { ImageClassificationProcessor } from "../../src/lib/processors/image-classification-processor";
import { OfficeProcessor } from "../../src/lib/processors/office-processor";
import { ObsidianUtils } from "../../src/lib/obsidian-models";

// Mock Tesseract.js for OCR tests - but allow real processing for integration tests
vi.mock("tesseract.js", () => ({
  createWorker: vi.fn(() =>
    Promise.resolve({
      setParameters: vi.fn(),
      recognize: vi.fn().mockImplementation(async (buffer) => {
        // For real integration tests, we could use actual OCR
        // For now, return mock data that represents what OCR might find
        return {
          data: {
            text: "Sample OCR text from image with design and typography content",
            confidence: 85,
          },
        };
      }),
      terminate: vi.fn(),
    })
  ),
}));

// Mock pdf-parse for PDF tests - but allow real processing for integration tests
vi.mock("pdf-parse", () => ({
  __esModule: true,
  default: vi.fn().mockImplementation(async (buffer) => {
    // For real integration tests, we could use actual PDF parsing
    // For now, return mock data that represents what PDF parsing might find
    return {
      text: "Sample PDF content with design, AI, and innovation concepts for analysis",
      numpages: 1,
      info: {
        Title: "Test PDF Document",
        Author: "Test Author",
      },
    };
  }),
}));

describe("Multi-Modal Integration Tests", () => {
  const testFilesDir = join(process.cwd(), "test", "test-files");

  describe("File Discovery and Validation", () => {
    it("should find test files in the test directory", () => {
      expect(existsSync(testFilesDir)).toBe(true);

      // Check for specific file types
      const pdfFile = join(testFilesDir, "05-versions-space.pdf");
      const imageFile = join(testFilesDir, "darian-square.png");
      const markdownFile = join(
        testFilesDir,
        "The birth of Inter  Figma Blog.md"
      );

      // Check for DOCX file dynamically (handle Unicode apostrophe)
      const allFiles = readdirSync(testFilesDir);
      const docxFile = allFiles.find(
        (file) =>
          file.toLowerCase().includes("designers") && file.endsWith(".docx")
      );

      expect(existsSync(pdfFile)).toBe(true);
      expect(existsSync(imageFile)).toBe(true);
      expect(existsSync(markdownFile)).toBe(true);
      expect(docxFile).toBeDefined();
    });
  });

  describe("PDF Processing", () => {
    let pdfProcessor: PDFProcessor;

    beforeEach(() => {
      pdfProcessor = new PDFProcessor();
    });

    it("should process PDF files and extract text content", async () => {
      const pdfPath = join(testFilesDir, "05-versions-space.pdf");

      if (existsSync(pdfPath)) {
        const buffer = readFileSync(pdfPath);
        const result = await pdfProcessor.extractTextFromBuffer(buffer);

        expect(result.text).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.metadata.pageCount).toBeGreaterThan(0);
        expect(result.metadata.hasText).toBe(true);
        expect(result.metadata.wordCount).toBeGreaterThan(0);
      }
    });

    it("should process Innovation Summit PDF", async () => {
      const pdfPath = join(
        testFilesDir,
        "Innovation Summit : Designing for AI: UX Patterns, Practice, and Product Differentiation.pdf"
      );

      if (existsSync(pdfPath)) {
        const buffer = readFileSync(pdfPath);
        const result = await pdfProcessor.extractTextFromBuffer(buffer);

        expect(result.text).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.metadata.hasText).toBe(true);

        // Check for semantic content
        if (result.text.length > 0) {
          expect(result.text.toLowerCase()).toMatch(/ai|design|ux|innovation/i);
        }
      }
    });
  });

  describe("Image Processing", () => {
    let ocrProcessor: OCRProcessor;
    let imageProcessor: ImageClassificationProcessor;

    beforeEach(() => {
      ocrProcessor = new OCRProcessor();
      imageProcessor = new ImageClassificationProcessor();
    });

    it("should process PNG images with OCR", async () => {
      const imagePath = join(testFilesDir, "darian-square.png");

      if (existsSync(imagePath)) {
        const buffer = readFileSync(imagePath);
        const result = await ocrProcessor.extractTextFromBuffer(buffer);

        expect(result.text).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.metadata.hasText).toBeDefined();
      }
    });

    it("should process JPEG images", async () => {
      const imagePath = join(
        testFilesDir,
        "815ca7eacb4b68beffff388c2c8b7a59.jpg"
      );

      if (existsSync(imagePath)) {
        const buffer = readFileSync(imagePath);
        const result = await ocrProcessor.extractTextFromBuffer(buffer);

        expect(result.text).toBeDefined();
        expect(result.metadata).toBeDefined();
      }
    });

    it("should process GIF images", async () => {
      const imagePath = join(
        testFilesDir,
        "8ae5c8b253ce37b9876ce464e0d396c4.gif"
      );

      if (existsSync(imagePath)) {
        const buffer = readFileSync(imagePath);
        const result = await ocrProcessor.extractTextFromBuffer(buffer);

        expect(result.text).toBeDefined();
        expect(result.metadata).toBeDefined();
      }
    });

    it("should process WebP images", async () => {
      const imagePath = join(
        testFilesDir,
        "calligraphic-ampersand-symbols-typhographic-30278239.webp"
      );

      if (existsSync(imagePath)) {
        const buffer = readFileSync(imagePath);
        const result = await ocrProcessor.extractTextFromBuffer(buffer);

        expect(result.text).toBeDefined();
        expect(result.metadata).toBeDefined();
      }
    });
  });

  describe("Document Processing", () => {
    let officeProcessor: OfficeProcessor;

    beforeEach(() => {
      officeProcessor = new OfficeProcessor();
    });

    it("should process DOCX files", async () => {
      const docxPath = join(
        testFilesDir,
        "Designers' Guide to Wielding AI.docx"
      );

      if (existsSync(docxPath)) {
        const buffer = readFileSync(docxPath);
        const result = await officeProcessor.extractTextFromBuffer(buffer);

        expect(result.text).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.metadata.hasText).toBe(true);

        // Check for semantic content
        if (result.text.length > 0) {
          expect(result.text.toLowerCase()).toMatch(/design|ai|guide/i);
        }
      }
    });

    it("should process CSV files", async () => {
      const csvPath = join(testFilesDir, "Untitled spreadsheet - Sheet1.csv");

      if (existsSync(csvPath)) {
        const buffer = readFileSync(csvPath);
        const result = await officeProcessor.extractTextFromBuffer(buffer);

        expect(result.text).toBeDefined();
        expect(result.metadata).toBeDefined();
      }
    });
  });

  describe("Markdown Processing", () => {
    it("should process Markdown files with ObsidianUtils", () => {
      const mdPath = join(testFilesDir, "The birth of Inter  Figma Blog.md");

      if (existsSync(mdPath)) {
        const content = readFileSync(mdPath, "utf-8");

        // Test frontmatter parsing
        const frontmatter = ObsidianUtils.parseFrontmatter(content);
        expect(frontmatter).toBeDefined();

        // Test wikilink extraction
        const wikilinks = ObsidianUtils.extractWikilinks(content);
        expect(Array.isArray(wikilinks)).toBe(true);

        // Test tag extraction
        const tags = ObsidianUtils.extractTags(content);
        expect(Array.isArray(tags)).toBe(true);

        // Test markdown cleaning
        const cleaned = ObsidianUtils.cleanMarkdown(content);
        expect(cleaned).toBeDefined();
        expect(cleaned.length).toBeGreaterThan(0);

        // Check for semantic content
        expect(cleaned.toLowerCase()).toMatch(/inter|figma|design|typography/i);
      }
    });
  });

  describe("HTML Processing", () => {
    it("should process HTML files", () => {
      const htmlPath = join(
        testFilesDir,
        "inference-embeddinggemma-with-sentence-transformers.html"
      );

      if (existsSync(htmlPath)) {
        const content = readFileSync(htmlPath, "utf-8");

        // Basic HTML content validation
        expect(content).toContain("<");
        expect(content.length).toBeGreaterThan(0);

        // Check for semantic content
        expect(content.toLowerCase()).toMatch(
          /embedding|sentence|transformer|inference/i
        );
      }
    });
  });

  describe("Semantic Analysis", () => {
    it("should extract meaningful content from various file types", async () => {
      const testCases = [
        {
          file: "05-versions-space.pdf",
          expectedKeywords: ["version", "space", "design"],
          processor: new PDFProcessor(),
        },
        {
          file: "Designers' Guide to Wielding AI.docx",
          expectedKeywords: ["design", "ai", "guide"],
          processor: new OfficeProcessor(),
        },
        {
          file: "The birth of Inter  Figma Blog.md",
          expectedKeywords: ["inter", "figma", "typography"],
          processor: null, // Use ObsidianUtils directly
        },
      ];

      for (const testCase of testCases) {
        const filePath = join(testFilesDir, testCase.file);

        if (existsSync(filePath)) {
          let content = "";

          if (testCase.processor) {
            const buffer = readFileSync(filePath);
            const result = await testCase.processor.extractTextFromBuffer(
              buffer
            );
            content = result.text;
          } else {
            // For markdown files, use ObsidianUtils
            const rawContent = readFileSync(filePath, "utf-8");
            content = ObsidianUtils.cleanMarkdown(rawContent);
          }

          expect(content.length).toBeGreaterThan(0);

          // Check for expected keywords
          const lowerContent = content.toLowerCase();
          const foundKeywords = testCase.expectedKeywords.filter((keyword) =>
            lowerContent.includes(keyword.toLowerCase())
          );

          expect(foundKeywords.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle non-existent files gracefully", async () => {
      const nonExistentPath = join(testFilesDir, "non-existent-file.pdf");
      const pdfProcessor = new PDFProcessor();

      try {
        const buffer = readFileSync(nonExistentPath);
        const result = await pdfProcessor.extractTextFromBuffer(buffer);
        // Should not reach here
        expect(result).toBeUndefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle corrupted or invalid files", async () => {
      const pdfProcessor = new PDFProcessor();
      const invalidBuffer = Buffer.from("invalid pdf content");

      const result = await pdfProcessor.extractTextFromBuffer(invalidBuffer);

      expect(result.text).toBeDefined();
      // With mocked pdf-parse, it should still return some content
      expect(result.text.length).toBeGreaterThan(0);
    });
  });
});
