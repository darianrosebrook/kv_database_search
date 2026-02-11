import { describe, it, expect } from "vitest";
import { OCRProcessor } from "../../src/lib/processors/ocr-processor";

describe("Enhanced OCR Processor", () => {
  const ocrProcessor = new OCRProcessor();

  it("should enhance OCR text processing", () => {
    // Test whitespace normalization (no longer joins single-spaced letters)
    const rawOcrText = "H e l l o   W o r l d";
    const enhancedText = ocrProcessor.enhanceOCRText(rawOcrText);

    expect(enhancedText).toBe("H e l l o W o r l d");
  });

  it("should fix common OCR artifacts", () => {
    // Test various OCR artifacts
    const artifacts = [
      { input: "H|ello", expected: "Hello" }, // Remove pipe artifacts
      { input: "H e l l 0", expected: "H e l l 0" }, // Preserve zeros (no 0→O replacement)
      { input: "Multiple    spaces", expected: "Multiple spaces" },
      { input: "Line1\n\n\nLine2", expected: "Line1\n\nLine2" }, // Preserve paragraphs
    ];

    for (const artifact of artifacts) {
      const result = ocrProcessor.enhanceOCRText(artifact.input);
      expect(result).toBe(artifact.expected);
    }
  });

  it("should analyze OCR text quality", () => {
    // Test quality analysis
    const highQualityText = "This is clear, well-structured text.";
    const lowQualityText = "T h i s   i s   b l u r r y   t e x t";

    const highQuality = ocrProcessor.analyzeOCRStructure(highQualityText, 85);
    const lowQuality = ocrProcessor.analyzeOCRStructure(lowQualityText, 35);

    expect(highQuality.textQuality).toBe("high");
    expect(lowQuality.textQuality).toBe("low");
  });

  it("should detect document structure in OCR text", () => {
    const structuredText = `
      DOCUMENT TITLE

      This is the first paragraph.
      It has multiple lines.

      Second paragraph here.
      More content follows.

      1. First item
      2. Second item
    `;

    const structure = ocrProcessor.analyzeOCRStructure(structuredText, 75);

    expect(structure.headers).toContain("DOCUMENT TITLE");
    expect(structure.paragraphs).toBeGreaterThan(1);
    expect(structure.hasLists).toBe(true);
    expect(structure.textQuality).toBe("medium"); // 75% confidence = medium quality
  });

  it("should handle edge cases", () => {
    // Test empty and null inputs
    const emptyText = "";
    const nullText = "\0\0\0"; // Null characters

    const emptyStructure = ocrProcessor.analyzeOCRStructure(emptyText, 0);
    const nullStructure = ocrProcessor.analyzeOCRStructure(nullText, 0);

    expect(emptyStructure.paragraphs).toBe(0);
    expect(nullStructure.paragraphs).toBe(0);
    expect(emptyStructure.textQuality).toBe("low");
    expect(nullStructure.textQuality).toBe("low");
  });
});
