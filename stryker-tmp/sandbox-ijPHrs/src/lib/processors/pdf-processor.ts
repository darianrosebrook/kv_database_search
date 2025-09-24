// @ts-nocheck
import * as pdfParse from "pdf-parse";
import {
  ContentType,
  UniversalMetadata,
  ContentMetadata,
} from "../multi-modal.js";
import * as fs from "fs";

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export interface PDFContentMetadata extends ContentMetadata {
  pageCount: number;
  wordCount: number;
  characterCount: number;
  hasText: boolean;
  pdfMetadata?: PDFMetadata;
}

export class PDFProcessor {
  /**
   * Extract text content from a PDF file
   */
  async extractText(filePath: string): Promise<{
    text: string;
    metadata: PDFContentMetadata;
  }> {
    try {
      // Read the PDF file
      const buffer = fs.readFileSync(filePath);

      // Parse the PDF
      const pdfData = await pdfParse(buffer);

      // Extract basic metadata
      const pdfMetadata: PDFMetadata = {
        title: pdfData.info?.Title,
        author: pdfData.info?.Author,
        subject: pdfData.info?.Subject,
        creator: pdfData.info?.Creator,
        producer: pdfData.info?.Producer,
        creationDate: pdfData.info?.CreationDate
          ? new Date(pdfData.info.CreationDate)
          : undefined,
        modificationDate: pdfData.info?.ModDate
          ? new Date(pdfData.info.ModDate)
          : undefined,
      };

      // Get the extracted text
      const text = pdfData.text.trim();

      // Analyze text content
      const words = text.split(/\s+/).filter((word) => word.length > 0);
      const hasText = text.length > 0 && words.length > 0;

      // Create content metadata
      const contentMetadata: PDFContentMetadata = {
        type: ContentType.PDF,
        language: this.detectLanguage(text),
        encoding: "utf-8",
        pageCount: pdfData.numpages,
        wordCount: words.length,
        characterCount: text.length,
        hasText,
        pdfMetadata,
      };

      return {
        text,
        metadata: contentMetadata,
      };
    } catch (error) {
      // Return basic metadata for corrupted or unreadable PDFs
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const contentMetadata: PDFContentMetadata = {
        type: ContentType.PDF,
        language: "unknown",
        encoding: "unknown",
        pageCount: 0,
        wordCount: 0,
        characterCount: 0,
        hasText: false,
      };

      return {
        text: `PDF Document: Unable to extract text. Error: ${errorMessage}`,
        metadata: contentMetadata,
      };
    }
  }

  /**
   * Extract text from a PDF buffer (useful for testing)
   */
  async extractTextFromBuffer(buffer: Buffer): Promise<{
    text: string;
    metadata: PDFContentMetadata;
  }> {
    try {
      // Parse the PDF buffer
      const pdfData = await pdfParse(buffer);

      // Extract basic metadata
      const pdfMetadata: PDFMetadata = {
        title: pdfData.info?.Title,
        author: pdfData.info?.Author,
        subject: pdfData.info?.Subject,
        creator: pdfData.info?.Creator,
        producer: pdfData.info?.Producer,
        creationDate: pdfData.info?.CreationDate
          ? new Date(pdfData.info.CreationDate)
          : undefined,
        modificationDate: pdfData.info?.ModDate
          ? new Date(pdfData.info.ModDate)
          : undefined,
      };

      // Get the extracted text
      const text = pdfData.text.trim();

      // Analyze text content
      const words = text.split(/\s+/).filter((word) => word.length > 0);
      const hasText = text.length > 0 && words.length > 0;

      // Create content metadata
      const contentMetadata: PDFContentMetadata = {
        type: ContentType.PDF,
        language: this.detectLanguage(text),
        encoding: "utf-8",
        pageCount: pdfData.numpages,
        wordCount: words.length,
        characterCount: text.length,
        hasText,
        pdfMetadata,
      };

      return {
        text,
        metadata: contentMetadata,
      };
    } catch (error) {
      // Return basic metadata for corrupted or unreadable PDFs
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const contentMetadata: PDFContentMetadata = {
        type: ContentType.PDF,
        language: "unknown",
        encoding: "unknown",
        pageCount: 0,
        wordCount: 0,
        characterCount: 0,
        hasText: false,
      };

      return {
        text: `PDF Document: Unable to extract text. Error: ${errorMessage}`,
        metadata: contentMetadata,
      };
    }
  }

  /**
   * Simple language detection based on common patterns
   * In production, use a proper language detection library
   */
  private detectLanguage(text: string): string {
    // Simple heuristics for language detection
    const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi;
    const spanishWords =
      /\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi;
    const frenchWords =
      /\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi;

    const englishMatches = (text.match(englishWords) || []).length;
    const spanishMatches = (text.match(spanishWords) || []).length;
    const frenchMatches = (text.match(frenchWords) || []).length;

    const maxMatches = Math.max(englishMatches, spanishMatches, frenchMatches);

    if (maxMatches === 0) return "unknown";
    if (maxMatches === englishMatches) return "en";
    if (maxMatches === spanishMatches) return "es";
    if (maxMatches === frenchMatches) return "fr";

    return "unknown";
  }

  /**
   * Check if a file is likely a readable PDF
   */
  isValidPDF(buffer: Buffer): boolean {
    // Check PDF signature
    const signature = buffer.subarray(0, 8);
    const pdfSignature = Buffer.from("%PDF-");

    return signature.subarray(0, 5).equals(pdfSignature);
  }
}
