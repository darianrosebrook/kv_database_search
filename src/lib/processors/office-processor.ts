import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { ContentType, ContentMetadata } from "../multi-modal.js";
import * as fs from "fs";

export interface OfficeMetadata {
  title?: string;
  author?: string;
  created?: Date;
  modified?: Date;
  application?: string;
  wordCount?: number;
  pageCount?: number;
  sheetCount?: number;
  slideCount?: number;
}

export interface OfficeContentMetadata extends ContentMetadata {
  officeMetadata?: OfficeMetadata;
  hasText: boolean;
  wordCount: number;
  characterCount: number;
}

export class OfficeProcessor {
  /**
   * Extract text from Office documents
   */
  async extractTextFromBuffer(
    buffer: Buffer,
    contentType: ContentType
  ): Promise<{
    text: string;
    metadata: OfficeContentMetadata;
  }> {
    try {
      switch (contentType) {
        case ContentType.OFFICE_DOC:
          return await this.extractDocxFromBuffer(buffer);
        case ContentType.OFFICE_SHEET:
          return await this.extractXlsxFromBuffer(buffer);
        case ContentType.OFFICE_PRESENTATION:
          return await this.extractPptxFromBuffer(buffer);
        default:
          throw new Error(`Unsupported Office document type: ${contentType}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const contentMetadata: OfficeContentMetadata = {
        type: contentType,
        language: "unknown",
        encoding: "unknown",
        hasText: false,
        wordCount: 0,
        characterCount: 0,
      };

      return {
        text: `Office Document Error: ${errorMessage}`,
        metadata: contentMetadata,
      };
    }
  }

  /**
   * Extract text from Office document files
   */
  async extractTextFromFile(
    filePath: string,
    contentType: ContentType
  ): Promise<{
    text: string;
    metadata: OfficeContentMetadata;
  }> {
    try {
      const buffer = fs.readFileSync(filePath);
      return await this.extractTextFromBuffer(buffer, contentType);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const contentMetadata: OfficeContentMetadata = {
        type: contentType,
        language: "unknown",
        encoding: "unknown",
        hasText: false,
        wordCount: 0,
        characterCount: 0,
      };

      return {
        text: `Office Document Error: Failed to read file - ${errorMessage}`,
        metadata: contentMetadata,
      };
    }
  }

  /**
   * Extract text from DOCX files
   */
  private async extractDocxFromBuffer(buffer: Buffer): Promise<{
    text: string;
    metadata: OfficeContentMetadata;
  }> {
    try {
      const result = await mammoth.extractRawText({ buffer });

      const text = result.value.trim();
      const words = text.split(/\s+/).filter((word) => word.length > 0);
      const hasText = text.length > 0 && words.length > 0;

      // Try to extract some basic metadata from the XML structure
      const officeMetadata: OfficeMetadata = {
        wordCount: words.length,
        // Additional metadata extraction could be added here
      };

      const contentMetadata: OfficeContentMetadata = {
        type: ContentType.OFFICE_DOC,
        language: this.detectLanguage(text),
        encoding: "utf-8",
        hasText,
        wordCount: words.length,
        characterCount: text.length,
        officeMetadata,
      };

      const finalText = hasText
        ? text
        : "Word Document: No readable text content found";

      return {
        text: finalText,
        metadata: contentMetadata,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const contentMetadata: OfficeContentMetadata = {
        type: ContentType.OFFICE_DOC,
        language: "unknown",
        encoding: "unknown",
        hasText: false,
        wordCount: 0,
        characterCount: 0,
      };

      return {
        text: `Word Document Error: ${errorMessage}`,
        metadata: contentMetadata,
      };
    }
  }

  /**
   * Extract text from XLSX files
   */
  private async extractXlsxFromBuffer(buffer: Buffer): Promise<{
    text: string;
    metadata: OfficeContentMetadata;
  }> {
    try {
      const workbook = XLSX.read(buffer, { type: "buffer" });

      let allText = "";
      const sheetNames: string[] = [];
      let totalCells = 0;

      // Extract text from all worksheets
      workbook.SheetNames.forEach((sheetName) => {
        sheetNames.push(sheetName);
        const worksheet = workbook.Sheets[sheetName];

        // Convert sheet to CSV-like text
        const csvText = XLSX.utils.sheet_to_csv(worksheet);
        if (csvText.trim()) {
          allText += `\n=== ${sheetName} ===\n${csvText}\n`;
        }

        // Count cells with content
        const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");
        for (let row = range.s.r; row <= range.e.r; row++) {
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            if (
              worksheet[cellAddress] &&
              worksheet[cellAddress].v !== undefined
            ) {
              totalCells++;
            }
          }
        }
      });

      const text = allText.trim();
      const words = text.split(/\s+/).filter((word) => word.length > 0);
      const hasText = text.length > 0 && words.length > 0;

      const officeMetadata: OfficeMetadata = {
        sheetCount: sheetNames.length,
        wordCount: words.length,
        application: "Microsoft Excel",
      };

      const contentMetadata: OfficeContentMetadata = {
        type: ContentType.OFFICE_SHEET,
        language: this.detectLanguage(text),
        encoding: "utf-8",
        hasText,
        wordCount: words.length,
        characterCount: text.length,
        officeMetadata,
      };

      const finalText = hasText
        ? text
        : `Excel Spreadsheet: ${sheetNames.length} sheet(s), ${totalCells} cells with content`;

      return {
        text: finalText,
        metadata: contentMetadata,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const contentMetadata: OfficeContentMetadata = {
        type: ContentType.OFFICE_SHEET,
        language: "unknown",
        encoding: "unknown",
        hasText: false,
        wordCount: 0,
        characterCount: 0,
      };

      return {
        text: `Excel Document Error: ${errorMessage}`,
        metadata: contentMetadata,
      };
    }
  }

  /**
   * Extract text from PPTX files (basic implementation)
   */
  private async extractPptxFromBuffer(buffer: Buffer): Promise<{
    text: string;
    metadata: OfficeContentMetadata;
  }> {
    try {
      // For now, provide basic PPTX handling
      // A full implementation would require extracting text from slide XML files
      // This is a placeholder that could be enhanced with additional libraries

      const contentMetadata: OfficeContentMetadata = {
        type: ContentType.OFFICE_PRESENTATION,
        language: "unknown",
        encoding: "unknown",
        hasText: false,
        wordCount: 0,
        characterCount: 0,
        officeMetadata: {
          application: "Microsoft PowerPoint",
        },
      };

      return {
        text: "PowerPoint Presentation: Text extraction not yet implemented for PPTX files",
        metadata: contentMetadata,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const contentMetadata: OfficeContentMetadata = {
        type: ContentType.OFFICE_PRESENTATION,
        language: "unknown",
        encoding: "unknown",
        hasText: false,
        wordCount: 0,
        characterCount: 0,
      };

      return {
        text: `PowerPoint Document Error: ${errorMessage}`,
        metadata: contentMetadata,
      };
    }
  }

  /**
   * Check if a file is a supported Office document
   */
  isSupportedOfficeDocument(buffer: Buffer): {
    supported: boolean;
    type?: ContentType;
  } {
    // Office document signatures
    const signatures = [
      { signature: Buffer.from([0x50, 0x4b, 0x03, 0x04]), type: "zip-based" }, // PK.. (ZIP/OFFICE)
    ];

    const isZipBased = signatures.some((sig) =>
      buffer.subarray(0, 4).equals(sig.signature)
    );

    if (!isZipBased) {
      return { supported: false };
    }

    // Check for Office document content types by examining ZIP structure
    // This is a simplified check - in production, you'd parse the ZIP and check [Content_Types].xml
    const docxMarker = buffer.includes(Buffer.from("word/"));
    const xlsxMarker = buffer.includes(Buffer.from("xl/"));
    const pptxMarker = buffer.includes(Buffer.from("ppt/"));

    if (docxMarker) {
      return { supported: true, type: ContentType.OFFICE_DOC };
    } else if (xlsxMarker) {
      return { supported: true, type: ContentType.OFFICE_SHEET };
    } else if (pptxMarker) {
      return { supported: true, type: ContentType.OFFICE_PRESENTATION };
    }

    return { supported: false };
  }

  /**
   * Simple language detection based on common patterns
   */
  private detectLanguage(text: string): string {
    if (!text || text.length === 0) return "unknown";

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
}
