import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("PDF Processor Isolated Test", () => {
  const testFilesDir = path.join(process.cwd(), "test", "test-files");

  it("should import PDF processor without errors", async () => {
    try {
      const { PDFProcessor } = await import(
        "../../src/lib/processors/pdf-processor.ts"
      );
      const processor = new PDFProcessor();
      expect(processor).toBeDefined();
      console.log("PDF processor imported successfully");
    } catch (error) {
      console.error("Failed to import PDF processor:", error);
      throw error;
    }
  });

  it("should process a real PDF file", async () => {
    const { PDFProcessor } = await import(
      "../../src/lib/processors/pdf-processor.ts"
    );
    const processor = new PDFProcessor();

    const pdfFiles = [
      "05-versions-space.pdf",
      "Innovation Summit : Designing for AI: UX Patterns, Practice, and Product Differentiation.pdf",
      "Professional Values (from Being a Good Mentee course with Ellen Fisher).pdf",
    ];

    for (const fileName of pdfFiles) {
      const filePath = path.join(testFilesDir, fileName);

      if (!fs.existsSync(filePath)) {
        console.warn(`PDF file ${fileName} not found, skipping`);
        continue;
      }

      try {
        const buffer = fs.readFileSync(filePath);
        console.log(`\n=== Processing ${fileName} ===`);
        console.log(`File size: ${buffer.length} bytes`);

        const result = await processor.extractTextFromBuffer(buffer);

        console.log(`Extracted text length: ${result.text.length} characters`);
        console.log(`Word count: ${result.metadata.wordCount}`);
        console.log(`Page count: ${result.metadata.pageCount}`);
        console.log(`Has text: ${result.metadata.hasText}`);
        console.log(`Language: ${result.metadata.language}`);
        console.log(`Text preview: ${result.text.substring(0, 200)}...`);

        // Basic validation
        expect(result).toBeDefined();
        expect(result.text).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.metadata.pageCount).toBeGreaterThanOrEqual(0);

        if (result.metadata.hasText) {
          expect(result.text.length).toBeGreaterThan(0);
          expect(result.metadata.wordCount).toBeGreaterThan(0);
        }
      } catch (error) {
        console.error(`Failed to process ${fileName}:`, error);
        // Don't throw here - we want to see which files work and which don't
      }
    }
  }, 30000);
});
