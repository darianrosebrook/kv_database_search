import { describe, it, expect, beforeEach, vi } from "vitest";
import { OfficeProcessor } from "../../src/lib/processors/office-processor.ts";
import { ContentType } from "../../src/lib/multi-modal.ts";

// Mock mammoth and xlsx
vi.mock("mammoth", () => ({
  extractRawText: vi.fn(),
}));

vi.mock("xlsx", () => ({
  read: vi.fn(),
  utils: {
    sheet_to_csv: vi.fn(),
    decode_range: vi.fn(),
    encode_cell: vi.fn(),
  },
}));

// Mock pdf-parse to prevent initialization issues
vi.mock("pdf-parse", () => ({
  default: vi.fn().mockResolvedValue({
    text: "mock pdf text",
    numpages: 1,
    info: {},
  }),
}));

// Mock fs module for ESM
vi.mock("fs", async () => {
  const actual = await vi.importActual("fs");
  return {
    ...actual,
    readFileSync: vi.fn(),
  };
});

import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import fs from "fs";

describe("OfficeProcessor", () => {
  let processor: OfficeProcessor;
  let mockMammoth;
  let mockXLSX;

  beforeEach(() => {
    processor = new OfficeProcessor();
    mockMammoth = vi.mocked(mammoth.extractRawText);
    mockXLSX = {
      read: vi.mocked(XLSX.read),
      utils: {
        sheet_to_csv: vi.mocked(XLSX.utils.sheet_to_csv),
        decode_range: vi.mocked(XLSX.utils.decode_range),
        encode_cell: vi.mocked(XLSX.utils.encode_cell),
      },
    };
  });

  describe("extractTextFromBuffer - DOCX", () => {
    it("should extract text from a valid DOCX buffer", async () => {
      mockMammoth.mockResolvedValue({
        value: "This is the content of a Word document.",
      });

      const buffer = Buffer.from("fake docx content");
      const result = await processor.extractTextFromBuffer(
        buffer,
        ContentType.OFFICE_DOC
      );

      expect(result.text).toBe("This is the content of a Word document.");
      expect(result.metadata.type).toBe(ContentType.OFFICE_DOC);
      expect(result.metadata.hasText).toBe(true);
      expect(result.metadata.wordCount).toBe(8); // "This is the content of a Word document."
      expect(result.metadata.language).toBe("en");
    });

    it("should handle DOCX files with no text", async () => {
      mockMammoth.mockResolvedValue({
        value: "",
      });

      const buffer = Buffer.from("fake docx content");
      const result = await processor.extractTextFromBuffer(
        buffer,
        ContentType.OFFICE_DOC
      );

      expect(result.text).toBe("Word Document: No readable text content found");
      expect(result.metadata.hasText).toBe(false);
      expect(result.metadata.wordCount).toBe(0);
    });

    it("should handle DOCX processing errors", async () => {
      mockMammoth.mockRejectedValue(new Error("Invalid DOCX format"));

      const buffer = Buffer.from("fake docx content");
      const result = await processor.extractTextFromBuffer(
        buffer,
        ContentType.OFFICE_DOC
      );

      expect(result.text).toContain("Word Document Error");
      expect(result.metadata.hasText).toBe(false);
    });
  });

  describe("extractTextFromBuffer - XLSX", () => {
    it("should extract data from a valid XLSX buffer", async () => {
      const mockWorkbook = {
        SheetNames: ["Sheet1", "Sheet2"],
        Sheets: {
          Sheet1: {
            A1: { v: "Name" },
            B1: { v: "Age" },
            A2: { v: "John" },
            B2: { v: 25 },
          },
          Sheet2: {
            A1: { v: "Product" },
            B1: { v: "Price" },
          },
        },
      };

      mockXLSX.read.mockReturnValue(mockWorkbook);
      mockXLSX.utils.sheet_to_csv.mockReturnValue("Name,Age\nJohn,25");
      mockXLSX.utils.decode_range.mockReturnValue({
        s: { r: 0, c: 0 },
        e: { r: 1, c: 1 },
      });

      const buffer = Buffer.from("fake xlsx content");
      const result = await processor.extractTextFromBuffer(
        buffer,
        ContentType.OFFICE_SHEET
      );

      expect(result.text).toContain("=== Sheet1 ===");
      expect(result.text).toContain("Name,Age");
      expect(result.metadata.type).toBe(ContentType.OFFICE_SHEET);
      expect(result.metadata.officeMetadata?.sheetCount).toBe(2);
      expect(result.metadata.hasText).toBe(true);
    });

    it("should handle XLSX files with no data", async () => {
      const mockWorkbook = {
        SheetNames: ["Sheet1"],
        Sheets: {
          Sheet1: {},
        },
      };

      mockXLSX.read.mockReturnValue(mockWorkbook);
      mockXLSX.utils.sheet_to_csv.mockReturnValue("");
      mockXLSX.utils.decode_range.mockReturnValue({
        s: { r: 0, c: 0 },
        e: { r: 0, c: 0 },
      });

      const buffer = Buffer.from("fake xlsx content");
      const result = await processor.extractTextFromBuffer(
        buffer,
        ContentType.OFFICE_SHEET
      );

      expect(result.text).toContain("Excel Spreadsheet");
      expect(result.metadata.hasText).toBe(false);
    });

    it("should handle XLSX processing errors", async () => {
      mockXLSX.read.mockImplementation(() => {
        throw new Error("Invalid XLSX format");
      });

      const buffer = Buffer.from("fake xlsx content");
      const result = await processor.extractTextFromBuffer(
        buffer,
        ContentType.OFFICE_SHEET
      );

      expect(result.text).toContain("Excel Document Error");
      expect(result.metadata.hasText).toBe(false);
    });
  });

  describe("extractTextFromBuffer - PPTX", () => {
    it("should handle PPTX files (placeholder implementation)", async () => {
      const buffer = Buffer.from("fake pptx content");
      const result = await processor.extractTextFromBuffer(
        buffer,
        ContentType.OFFICE_PRESENTATION
      );

      expect(result.text).toContain(
        "Text extraction not yet implemented for PPTX files"
      );
      expect(result.metadata.type).toBe(ContentType.OFFICE_PRESENTATION);
      expect(result.metadata.hasText).toBe(false);
    });
  });

  describe("extractTextFromFile", () => {
    it("should read file and process Office document", async () => {
      // Mock fs.readFileSync
      fs.readFileSync.mockReturnValue(Buffer.from("file content"));

      mockMammoth.mockResolvedValue({
        value: "File content extracted",
      });

      const result = await processor.extractTextFromFile(
        "/test/document.docx",
        ContentType.OFFICE_DOC
      );

      expect(result.text).toBe("File content extracted");
      expect(result.metadata.type).toBe(ContentType.OFFICE_DOC);
    });

    it("should handle file read errors", async () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error("File not found");
      });

      const result = await processor.extractTextFromFile(
        "/test/missing.docx",
        ContentType.OFFICE_DOC
      );

      expect(result.text).toContain("Failed to read file");
      expect(result.metadata.hasText).toBe(false);
    });
  });

  describe("isSupportedOfficeDocument", () => {
    it("should validate DOCX files", () => {
      const docxBuffer = Buffer.from("PK\x03\x04fake docx content with word/");
      const result = processor.isSupportedOfficeDocument(docxBuffer);

      expect(result.supported).toBe(true);
      expect(result.type).toBe(ContentType.OFFICE_DOC);
    });

    it("should validate XLSX files", () => {
      const xlsxBuffer = Buffer.from("PK\x03\x04fake xlsx content with xl/");
      const result = processor.isSupportedOfficeDocument(xlsxBuffer);

      expect(result.supported).toBe(true);
      expect(result.type).toBe(ContentType.OFFICE_SHEET);
    });

    it("should validate PPTX files", () => {
      const pptxBuffer = Buffer.from("PK\x03\x04fake pptx content with ppt/");
      const result = processor.isSupportedOfficeDocument(pptxBuffer);

      expect(result.supported).toBe(true);
      expect(result.type).toBe(ContentType.OFFICE_PRESENTATION);
    });

    it("should reject non-Office files", () => {
      const textBuffer = Buffer.from("not an office document");
      const result = processor.isSupportedOfficeDocument(textBuffer);

      expect(result.supported).toBe(false);
      expect(result.type).toBeUndefined();
    });

    it("should reject non-ZIP files", () => {
      const nonZipBuffer = Buffer.from("not a zip file");
      const result = processor.isSupportedOfficeDocument(nonZipBuffer);

      expect(result.supported).toBe(false);
    });
  });

  describe("Language detection", () => {
    it("should detect English text in Office documents", async () => {
      mockMammoth.mockResolvedValue({
        value: "This document contains English text for testing purposes.",
      });

      const buffer = Buffer.from("fake docx content");
      const result = await processor.extractTextFromBuffer(
        buffer,
        ContentType.OFFICE_DOC
      );

      expect(result.metadata.language).toBe("en");
    });

    it("should detect Spanish text in Office documents", async () => {
      mockMammoth.mockResolvedValue({
        value: "Este documento contiene texto en español para pruebas.",
      });

      const buffer = Buffer.from("fake docx content");
      const result = await processor.extractTextFromBuffer(
        buffer,
        ContentType.OFFICE_DOC
      );

      expect(result.metadata.language).toBe("es");
    });

    it("should return unknown for ambiguous text", async () => {
      mockMammoth.mockResolvedValue({
        value: "xyz abc 123", // No common words
      });

      const buffer = Buffer.from("fake docx content");
      const result = await processor.extractTextFromBuffer(
        buffer,
        ContentType.OFFICE_DOC
      );

      expect(result.metadata.language).toBe("unknown");
    });
  });

  describe("Error handling", () => {
    it("should handle unsupported Office document types", async () => {
      const buffer = Buffer.from("fake content");

      const result = await processor.extractTextFromBuffer(
        buffer,
        ContentType.UNKNOWN
      );

      expect(result.text).toContain("Unsupported Office document type");
      expect(result.metadata.hasText).toBe(false);
    });

    it("should provide meaningful error messages", async () => {
      mockMammoth.mockRejectedValue(new Error("Corrupted DOCX file"));

      const buffer = Buffer.from("fake docx content");
      const result = await processor.extractTextFromBuffer(
        buffer,
        ContentType.OFFICE_DOC
      );

      expect(result.text).toContain("Corrupted DOCX file");
      expect(result.metadata.hasText).toBe(false);
    });
  });
});
