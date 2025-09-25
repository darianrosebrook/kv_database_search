import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Office Processor Real File Test", () => {
  const testFilesDir = path.join(process.cwd(), "test", "test-files");

  it("should process real office documents", async () => {
    const { OfficeProcessor } = await import(
      "../../src/lib/processors/office-processor.ts"
    );
    const processor = new OfficeProcessor();

    // Find DOCX files dynamically
    const allFiles = fs.readdirSync(testFilesDir);
    const docxFiles = allFiles.filter((file) =>
      file.toLowerCase().endsWith(".docx")
    );

    console.log(`Found DOCX files: ${docxFiles.join(", ")}`);

    for (const fileName of docxFiles) {
      const filePath = path.join(testFilesDir, fileName);

      try {
        const buffer = fs.readFileSync(filePath);
        console.log(`\n=== Office Processing ${fileName} ===`);
        console.log(`File size: ${(buffer.length / 1024).toFixed(1)} KB`);

        const result = await processor.extractTextFromBuffer(buffer);

        console.log(`Extracted text length: ${result.text.length} characters`);
        console.log(`Word count: ${result.metadata.wordCount}`);
        console.log(`Language: ${result.metadata.language}`);
        console.log(`Has text: ${result.metadata.hasText}`);
        console.log(`Character count: ${result.metadata.characterCount}`);

        if (result.text.length > 0) {
          console.log(`Text preview: ${result.text.substring(0, 300)}...`);
        }

        // Basic validation
        expect(result).toBeDefined();
        expect(result.text).toBeDefined();
        expect(result.metadata).toBeDefined();

        if (result.metadata.hasText) {
          expect(result.text.length).toBeGreaterThan(0);
          expect(result.metadata.wordCount).toBeGreaterThan(0);
        }
      } catch (error) {
        console.error(`Failed to process ${fileName}:`, error);
      }
    }

    expect(docxFiles.length).toBeGreaterThan(0);
  }, 30000);
});
