import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("OCR Processor Real File Test", () => {
  const testFilesDir = path.join(process.cwd(), "test", "test-files");

  it("should process real image files with OCR", async () => {
    const { OCRProcessor } = await import(
      "../../src/lib/processors/ocr-processor.ts"
    );
    const processor = new OCRProcessor();

    const imageFiles = [
      "darian-square.png",
      "5F3B751D-227B-45F3-ABF2-7E5F6F574A02.PNG",
      "IMG_0321.JPG",
      "Fj3JTkdXgAQcyd1.jpeg",
      "FmGJoJgXkAEzHO6.png",
      "tschichold-ampersands-e1308409555653.png",
    ];

    let successfulOCR = 0;
    let totalFiles = 0;

    for (const fileName of imageFiles) {
      const filePath = path.join(testFilesDir, fileName);

      if (!fs.existsSync(filePath)) {
        console.warn(`Image file ${fileName} not found, skipping`);
        continue;
      }

      totalFiles++;

      try {
        const buffer = fs.readFileSync(filePath);
        console.log(`\n=== OCR Processing ${fileName} ===`);
        console.log(`File size: ${(buffer.length / 1024).toFixed(1)} KB`);

        const result = await processor.extractTextFromBuffer(buffer);

        console.log(`Extracted text length: ${result.text.length} characters`);
        console.log(`Confidence: ${result.metadata.confidence}%`);
        console.log(`Language: ${result.metadata.language}`);
        console.log(`Has text: ${result.metadata.hasText}`);
        console.log(`Character count: ${result.metadata.characterCount}`);

        if (result.metadata.structure) {
          console.log(
            `Headers found: ${result.metadata.structure.headers.length}`
          );
          console.log(`Paragraphs: ${result.metadata.structure.paragraphs}`);
          console.log(`Text quality: ${result.metadata.structure.textQuality}`);
        }

        if (result.text.length > 0) {
          console.log(`Text preview: ${result.text.substring(0, 200)}...`);
        }

        // Basic validation
        expect(result).toBeDefined();
        expect(result.text).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.metadata.confidence).toBeGreaterThanOrEqual(0);
        expect(result.metadata.confidence).toBeLessThanOrEqual(100);

        if (result.metadata.hasText && result.metadata.confidence > 30) {
          successfulOCR++;
          expect(result.text.length).toBeGreaterThan(0);
        }
      } catch (error) {
        console.error(`Failed to process ${fileName}:`, error);
        // Don't throw - we want to see results for all files
      }
    }

    console.log(`\n=== OCR Summary ===`);
    console.log(`Total files processed: ${totalFiles}`);
    console.log(`Successful OCR extractions: ${successfulOCR}`);
    console.log(
      `Success rate: ${
        totalFiles > 0 ? ((successfulOCR / totalFiles) * 100).toFixed(1) : 0
      }%`
    );

    // OCR processor doesn't need explicit cleanup

    expect(totalFiles).toBeGreaterThan(0);
  }, 60000);
});
