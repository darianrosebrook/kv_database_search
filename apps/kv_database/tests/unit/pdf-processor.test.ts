import { describe, it, expect, beforeEach, vi } from "vitest";
import { PDFProcessor } from "../../src/lib/processors/pdf-processor.ts";

// Mock pdf-parse completely
vi.mock("pdf-parse", () => ({
  __esModule: true,
  default: vi.fn().mockImplementation(() =>
    Promise.resolve({
      text: "Mocked PDF text",
      numpages: 1,
      info: {
        Title: "Mocked PDF",
        Author: "Mock Author",
      },
    })
  ),
}));

import * as pdfParse from "pdf-parse";

describe("PDFProcessor", () => {
  let processor: PDFProcessor;
  let mockPdfParse: any;

  beforeEach(() => {
    processor = new PDFProcessor();
    mockPdfParse = vi.mocked(pdfParse.default);
    mockPdfParse.mockClear();
  });

  describe("extractTextFromBuffer", () => {
    it("should extract text from a valid PDF buffer", async () => {
      const buffer = Buffer.from("%PDF-1.4 Test PDF content");
      const result = await processor.extractTextFromBuffer(buffer);

      expect(result.text).toBe("Mocked PDF text");
      expect(result.metadata.pageCount).toBe(1);
      expect(result.metadata.wordCount).toBe(3); // "Mocked PDF text"
      expect(result.metadata.hasText).toBe(true);
      expect(result.metadata.pdfMetadata?.title).toBe("Mocked PDF");
      expect(result.metadata.pdfMetadata?.author).toBe("Mock Author");
    });

    it("should handle PDFs with no extractable text", async () => {
      // Override mock for this test
      mockPdfParse.mockResolvedValueOnce({
        text: "",
        numpages: 1,
        info: {},
      });

      const buffer = Buffer.from("%PDF-1.4");
      const result = await processor.extractTextFromBuffer(buffer);

      expect(result.text).toBe("");
      expect(result.metadata.hasText).toBe(false);
      expect(result.metadata.wordCount).toBe(0);
    });

    it("should handle corrupted PDFs gracefully", async () => {
      mockPdfParse.mockRejectedValue(new Error("Invalid PDF structure"));

      const buffer = Buffer.from("not a pdf");
      const result = await processor.extractTextFromBuffer(buffer);

      expect(result.text).toContain("Unable to extract text");
      expect(result.metadata.hasText).toBe(false);
      expect(result.metadata.pageCount).toBe(0);
    });

    it("should detect language from text content", async () => {
      const mockPdfData = {
        text: "This is a test document in English. It contains several sentences.",
        numpages: 1,
        info: {},
      };

      mockPdfParse.mockResolvedValue(mockPdfData);

      const buffer = Buffer.from("%PDF-1.4");
      const result = await processor.extractTextFromBuffer(buffer);

      expect(result.metadata.language).toBe("en");
    });
  });

  describe("extractText", () => {
    it("should read file and extract text", async () => {
      const mockPdfData = {
        text: "File content",
        numpages: 1,
        info: {},
      };

      mockPdfParse.mockResolvedValue(mockPdfData);

      // Mock fs.readFileSync
      const fs = await import("fs");
      vi.spyOn(fs, "readFileSync").mockReturnValue(Buffer.from("pdf content"));

      const result = await processor.extractText("/test/file.pdf");

      expect(result.text).toBe("File content");
      expect(result.metadata.pageCount).toBe(1);
    });
  });

  describe("isValidPDF", () => {
    it("should validate PDF signatures", () => {
      expect(processor.isValidPDF(Buffer.from("%PDF-1.4"))).toBe(true);
      expect(processor.isValidPDF(Buffer.from("%PDF-1.5"))).toBe(true);
      expect(processor.isValidPDF(Buffer.from("not a pdf"))).toBe(false);
      expect(processor.isValidPDF(Buffer.from(""))).toBe(false);
    });
  });

  describe("Language detection", () => {
    it("should detect English text", async () => {
      const mockPdfData = {
        text: "The quick brown fox jumps over the lazy dog. This is a test.",
        numpages: 1,
        info: {},
      };

      mockPdfParse.mockResolvedValue(mockPdfData);

      const buffer = Buffer.from("%PDF-1.4");
      const result = await processor.extractTextFromBuffer(buffer);

      expect(result.metadata.language).toBe("en");
    });

    it("should detect Spanish text", async () => {
      const mockPdfData = {
        text: "El rápido zorro marrón salta sobre el perro perezoso. Esto es una prueba.",
        numpages: 1,
        info: {},
      };

      mockPdfParse.mockResolvedValue(mockPdfData);

      const buffer = Buffer.from("%PDF-1.4");
      const result = await processor.extractTextFromBuffer(buffer);

      expect(result.metadata.language).toBe("es");
    });

    it("should return unknown for ambiguous text", async () => {
      const mockPdfData = {
        text: "xyz abc def", // No common words
        numpages: 1,
        info: {},
      };

      mockPdfParse.mockResolvedValue(mockPdfData);

      const buffer = Buffer.from("%PDF-1.4");
      const result = await processor.extractTextFromBuffer(buffer);

      expect(result.metadata.language).toBe("unknown");
    });
  });
});
