import { describe, it, expect, beforeEach, vi } from "vitest";
import { OCRProcessor } from "../../src/lib/processors/ocr-processor.js";

// Mock Tesseract.js
vi.mock("tesseract.js", () => ({
  createWorker: vi.fn(),
}));

// Mock pdf-parse to prevent initialization issues
vi.mock("pdf-parse", () => ({
  default: vi.fn().mockResolvedValue({
    text: "mock pdf text",
    numpages: 1,
    info: {},
  }),
}));

// Mock fs module
vi.mock("fs", () => ({
  default: {
    readFileSync: vi.fn(),
  },
  readFileSync: vi.fn(),
}));

import { createWorker } from "tesseract.js";
import * as fs from "fs";

describe("OCRProcessor", () => {
  let processor: OCRProcessor;
  let mockWorker: any;

  beforeEach(() => {
    processor = new OCRProcessor();
    mockWorker = {
      setParameters: vi.fn(),
      recognize: vi.fn(),
      terminate: vi.fn(),
    };
    (createWorker as any).mockResolvedValue(mockWorker);
  });

  describe("extractTextFromBuffer", () => {
    it("should extract text with high confidence", async () => {
      mockWorker.recognize.mockResolvedValue({
        data: {
          text: "This is a test document with clear text.",
          confidence: 85,
        },
      });

      const buffer = Buffer.from("fake image data");
      const result = await processor.extractTextFromBuffer(buffer);

      expect(result.text).toBe("This is a test document with clear text.");
      expect(result.metadata.confidence).toBe(85);
      expect(result.metadata.hasText).toBe(true);
      expect(result.metadata.wordCount).toBe(8); // "This is a test document with clear text."
      expect(result.metadata.ocrMetadata?.confidence).toBe(85);
      expect(result.metadata.ocrMetadata?.language).toBe("eng");
    });

    it("should handle low confidence OCR results", async () => {
      mockWorker.recognize.mockResolvedValue({
        data: {
          text: "unclear text",
          confidence: 15, // Below default threshold of 30
        },
      });

      const buffer = Buffer.from("fake image data");
      const result = await processor.extractTextFromBuffer(buffer);

      expect(result.text).toContain("Low confidence");
      expect(result.metadata.confidence).toBe(15);
      expect(result.metadata.hasText).toBe(false); // Below confidence threshold
    });

    it("should handle images with no text", async () => {
      mockWorker.recognize.mockResolvedValue({
        data: {
          text: "",
          confidence: 0,
        },
      });

      const buffer = Buffer.from("fake image data");
      const result = await processor.extractTextFromBuffer(buffer);

      expect(result.text).toContain("No text detected");
      expect(result.metadata.hasText).toBe(false);
      expect(result.metadata.wordCount).toBe(0);
    });

    it("should handle OCR errors gracefully", async () => {
      mockWorker.recognize.mockRejectedValue(
        new Error("OCR processing failed")
      );

      const buffer = Buffer.from("fake image data");
      const result = await processor.extractTextFromBuffer(buffer);

      expect(result.text).toContain("OCR Error");
      expect(result.metadata.confidence).toBe(0);
      expect(result.metadata.hasText).toBe(false);
    });

    it("should accept custom confidence threshold", async () => {
      mockWorker.recognize.mockResolvedValue({
        data: {
          text: "some text",
          confidence: 25, // Above custom threshold of 20
        },
      });

      const buffer = Buffer.from("fake image data");
      const result = await processor.extractTextFromBuffer(buffer, {
        confidence: 20,
      });

      expect(result.metadata.hasText).toBe(true);
    });
  });

  describe("extractTextFromFile", () => {
    it("should read file and perform OCR", async () => {
      // Mock fs.readFileSync
      (fs.readFileSync as any).mockReturnValue(Buffer.from("image data"));

      mockWorker.recognize.mockResolvedValue({
        data: {
          text: "File OCR text",
          confidence: 90,
        },
      });

      const result = await processor.extractTextFromFile("/test/image.jpg");

      expect(result.text).toBe("File OCR text");
      expect(result.metadata.confidence).toBe(90);
    });

    it("should handle file read errors", async () => {
      (fs.readFileSync as any).mockImplementation(() => {
        throw new Error("File not found");
      });

      const result = await processor.extractTextFromFile("/test/missing.jpg");

      expect(result.text).toContain("Failed to read file");
      expect(result.metadata.hasText).toBe(false);
    });
  });

  describe("isSupportedImage", () => {
    it("should validate JPEG images", () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      expect(processor.isSupportedImage(jpegBuffer)).toBe(true);
    });

    it("should validate PNG images", () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      expect(processor.isSupportedImage(pngBuffer)).toBe(true);
    });

    it("should validate BMP images", () => {
      const bmpBuffer = Buffer.from([0x42, 0x4d]);
      expect(processor.isSupportedImage(bmpBuffer)).toBe(true);
    });

    it("should reject unsupported formats", () => {
      const textBuffer = Buffer.from("not an image");
      expect(processor.isSupportedImage(textBuffer)).toBe(false);
    });
  });

  describe("Language detection", () => {
    it("should detect English text", async () => {
      mockWorker.recognize.mockResolvedValue({
        data: {
          text: "The quick brown fox jumps over the lazy dog. This is a test.",
          confidence: 80,
        },
      });

      const buffer = Buffer.from("fake image");
      const result = await processor.extractTextFromBuffer(buffer);

      expect(result.metadata.language).toBe("en");
    });

    it("should detect Spanish text", async () => {
      mockWorker.recognize.mockResolvedValue({
        data: {
          text: "El rápido zorro marrón salta sobre el perro perezoso. Esto es una prueba.",
          confidence: 80,
        },
      });

      const buffer = Buffer.from("fake image");
      const result = await processor.extractTextFromBuffer(buffer);

      expect(result.metadata.language).toBe("es");
    });

    it("should return unknown for ambiguous text", async () => {
      mockWorker.recognize.mockResolvedValue({
        data: {
          text: "xyz abc 123", // No common words
          confidence: 80,
        },
      });

      const buffer = Buffer.from("fake image");
      const result = await processor.extractTextFromBuffer(buffer);

      expect(result.metadata.language).toBe("unknown");
    });
  });

  describe("Worker management", () => {
    it("should initialize worker on first use", async () => {
      mockWorker.recognize.mockResolvedValue({
        data: { text: "test", confidence: 80 },
      });

      await processor.extractTextFromBuffer(Buffer.from("test"));

      expect(createWorker).toHaveBeenCalledWith("eng");
    });

    it("should terminate worker", async () => {
      // Initialize worker first
      await processor.extractTextFromBuffer(Buffer.from("test"));
      // Reset mock call count
      mockWorker.terminate.mockClear();

      await processor.terminate();

      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it("should reuse initialized worker", async () => {
      // Clear previous calls
      (createWorker as any).mockClear();

      mockWorker.recognize.mockResolvedValue({
        data: { text: "test", confidence: 80 },
      });

      await processor.extractTextFromBuffer(Buffer.from("test1"));
      await processor.extractTextFromBuffer(Buffer.from("test2"));

      expect(createWorker).toHaveBeenCalledTimes(1);
      expect(mockWorker.recognize).toHaveBeenCalledTimes(2);
    });
  });

  describe("Supported languages", () => {
    it("should return list of supported languages", () => {
      const languages = processor.getSupportedLanguages();

      expect(languages).toContain("eng");
      expect(languages).toContain("spa");
      expect(languages).toContain("fra");
      expect(languages.length).toBeGreaterThan(5);
    });
  });
});
