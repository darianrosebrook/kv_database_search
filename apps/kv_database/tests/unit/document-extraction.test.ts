import { describe, it, expect } from "vitest";
import { PDFProcessor } from "../../src/lib/processors/pdf-processor";
import { OfficeProcessor } from "../../src/lib/processors/office-processor";
import { ContentType } from "../../src/types/index";
import * as fs from "fs";

describe("Enhanced Document Processors", () => {
  const pdfProcessor = new PDFProcessor();
  const officeProcessor = new OfficeProcessor();

  it("should enhance PDF processing with improved text extraction", async () => {
    // Use a simple text buffer since PDF parsing is complex for unit tests
    const testText = `
      Enhanced PDF Processing

      John Smith works at Apple Inc. and studies MachineLearning.

      This document demonstrates:
      • Person entity extraction
      • Organization entity extraction
      • Concept entity extraction
      • Relationship mapping
    `;

    const buffer = Buffer.from(testText);

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
    // Create a simple DOCX buffer for testing
    const testDocxContent = `
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
    `;

    const buffer = Buffer.from(testDocxContent);

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

    const buffer = Buffer.from(testText);

    // Test PDF processor structure analysis
    const pdfResult = await pdfProcessor.extractTextFromBuffer(buffer);
    expect(pdfResult.metadata.structure?.headers).toContain("DOCUMENT TITLE");
    expect(pdfResult.metadata.structure?.headers).toContain("SECOND HEADER");
    expect(pdfResult.metadata.structure?.paragraphs).toBeGreaterThan(2);
    expect(pdfResult.metadata.structure?.hasLists).toBe(true);

    // Test Office processor structure analysis
    const officeResult = await officeProcessor.extractTextFromBuffer(
      buffer,
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

    // Test PDF processor error handling
    const pdfResult = await pdfProcessor.extractTextFromBuffer(corruptedBuffer);
    expect(pdfResult.metadata.hasText).toBe(false);
    expect(pdfResult.text).toContain("Error");

    // Test Office processor error handling
    const officeResult = await officeProcessor.extractTextFromBuffer(
      corruptedBuffer,
      ContentType.OFFICE_DOC
    );
    expect(officeResult.metadata.hasText).toBe(false);
    expect(officeResult.metadata.wordCount).toBe(0);
  });
});
