import { describe, it, expect, vi } from "vitest";
import { PDFProcessor } from "../../src/lib/processors/pdf-processor";
import { OfficeProcessor } from "../../src/lib/processors/office-processor";
import { ContentType } from "../../src/types/index";
import * as fs from "fs";

// Mock pdf-parse
vi.mock("pdf-parse", () => ({
  default: vi.fn(),
}));

// Mock mammoth (for DOCX processing)
vi.mock("mammoth", () => ({
  extractRawText: vi.fn(),
}));

// Mock XLSX (for Excel processing)
vi.mock("xlsx", () => ({
  read: vi.fn(),
}));

import pdfParse from "pdf-parse";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";

describe("Enhanced Document Processors", () => {
  const pdfProcessor = new PDFProcessor();
  const officeProcessor = new OfficeProcessor();

  it("should enhance PDF processing with improved text extraction", async () => {
    // Mock PDF parsing to return structured data
    const mockPdfData = {
      text: `
        Enhanced PDF Processing

        John Smith works at Apple Inc. and studies MachineLearning.

        This document demonstrates:
        • Person entity extraction
        • Organization entity extraction
        • Concept entity extraction
        • Relationship mapping
      `,
      numpages: 1,
      info: {
        Title: "Test PDF",
        Author: "Test Author",
      },
    };

    vi.mocked(pdfParse).mockResolvedValue(mockPdfData);

    // Use a dummy buffer since we're mocking the PDF parsing
    const buffer = Buffer.from("dummy pdf content");

    // Use extractTextFromBuffer which now includes enhanced processing
    const result = await pdfProcessor.extractTextFromBuffer(buffer);

    expect(result.metadata.hasText).toBe(true);
    expect(result.metadata.wordCount).toBeGreaterThan(10);
    expect(result.metadata.characterCount).toBeGreaterThan(50);
    expect(result.metadata.language).toBe("en");
    expect(result.text).toContain("John Smith");
    expect(result.text).toContain("Apple Inc");
    expect(result.text).toContain("MachineLearning");
  });

  it("should enhance Office document processing with improved text extraction", async () => {
    // Mock mammoth to return structured data
    const mockDocxData = {
      value: `
        Enhanced Office Processing

        John Smith works at Apple Inc. and studies MachineLearning.

        This document demonstrates:
        - Person entity extraction
        - Organization entity extraction
        - Concept entity extraction
        - Relationship mapping

        Technical terms include:
        • ArtificialIntelligence
        • DeepLearning
        • NaturalLanguageProcessing
      `,
      messages: [],
    };

    vi.mocked(mammoth.extractRawText).mockResolvedValue(mockDocxData);

    // Use a dummy buffer since we're mocking the Office parsing
    const buffer = Buffer.from("dummy docx content");

    const result = await officeProcessor.extractTextFromBuffer(
      buffer,
      ContentType.OFFICE_DOC
    );

    expect(result.metadata.hasText).toBe(true);
    expect(result.metadata.wordCount).toBeGreaterThan(15);
    expect(result.metadata.characterCount).toBeGreaterThan(100);
    expect(result.metadata.language).toBe("en");
    expect(result.text).toContain("John Smith");
    expect(result.text).toContain("Apple Inc");
    expect(result.text).toContain("MachineLearning");
  });

  it("should analyze document structure correctly", async () => {
    const testText = `
      DOCUMENT TITLE

      This is the first paragraph with some content.
      It continues on multiple lines.

      SECOND HEADER

      Another paragraph here.
      More content to analyze.

      • List item 1
      • List item 2
      • List item 3
    `;

    // Mock PDF parsing to return the test text
    const mockPdfData = {
      text: testText,
      numpages: 1,
      info: {
        Title: "Test PDF",
        Author: "Test Author",
      },
    };

    vi.mocked(pdfParse).mockResolvedValue(mockPdfData);

    const buffer = Buffer.from("dummy pdf content");

    // Test PDF processor structure analysis
    const pdfResult = await pdfProcessor.extractTextFromBuffer(buffer);
    expect(pdfResult.metadata.structure?.headers).toContain("DOCUMENT TITLE");
    expect(pdfResult.metadata.structure?.headers).toContain("SECOND HEADER");
    expect(pdfResult.metadata.structure?.paragraphs).toBeGreaterThan(2);
    expect(pdfResult.metadata.structure?.hasLists).toBe(true);

    // Mock Office processing to return the test text
    const mockOfficeData = {
      value: testText,
      messages: [],
    };

    vi.mocked(mammoth.extractRawText).mockResolvedValue(mockOfficeData);

    // Test Office processor structure analysis
    const officeResult = await officeProcessor.extractTextFromBuffer(
      Buffer.from("dummy office content"),
      ContentType.OFFICE_DOC
    );
    expect(officeResult.metadata.structure?.headers).toContain(
      "DOCUMENT TITLE"
    );
    expect(officeResult.metadata.structure?.headers).toContain("SECOND HEADER");
    expect(officeResult.metadata.structure?.paragraphs).toBeGreaterThan(2);
    expect(officeResult.metadata.structure?.hasLists).toBe(true);
  });

  it("should handle document processing errors gracefully", async () => {
    const corruptedBuffer = Buffer.from("This is not a valid document");

    // Mock PDF parsing to fail
    vi.mocked(pdfParse).mockRejectedValue(new Error("Invalid PDF format"));

    // Test PDF processor error handling
    const pdfResult = await pdfProcessor.extractTextFromBuffer(corruptedBuffer);
    expect(pdfResult.metadata.hasText).toBe(false);
    expect(pdfResult.text).toContain("Error");

    // Mock Office processing to fail
    vi.mocked(mammoth.extractRawText).mockRejectedValue(
      new Error("Invalid Office document")
    );

    // Test Office processor error handling
    const officeResult = await officeProcessor.extractTextFromBuffer(
      corruptedBuffer,
      ContentType.OFFICE_DOC
    );
    expect(officeResult.metadata.hasText).toBe(false);
    expect(officeResult.metadata.wordCount).toBe(0);
  });
});
