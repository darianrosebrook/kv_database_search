import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { ContentType, ContentMetadata } from "../../types/index";
import {
  detectLanguage,
  EnhancedEntityExtractor,
  ExtractedEntity,
  EntityRelationship,
} from "../utils";
import * as fs from "fs";
import {
  ContentProcessor,
  ProcessorResult,
  ProcessorOptions,
} from "./base-processor";

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
  entities?: ExtractedEntity[];
  relationships?: EntityRelationship[];
  structure?: {
    headers: string[];
    paragraphs: number;
    hasTables: boolean;
    hasImages: boolean;
    hasLists: boolean;
  };
}

export class OfficeProcessor implements ContentProcessor {
  private entityExtractor: EnhancedEntityExtractor;

  constructor() {
    this.entityExtractor = new EnhancedEntityExtractor();
  }

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
      const enhancedText = this.enhanceOfficeText(text);
      const words = enhancedText.split(/\s+/).filter((word) => word.length > 0);
      const hasText = enhancedText.length > 0 && words.length > 0;

      // Try to extract some basic metadata from the XML structure
      const officeMetadata: OfficeMetadata = {
        wordCount: words.length,
        // Additional metadata extraction could be added here
      };

      // Extract entities and relationships
      const entities = this.entityExtractor.extractEntities(enhancedText);
      const relationships = this.entityExtractor.extractRelationships(
        enhancedText,
        entities
      );

      // Analyze document structure
      const structure = this.analyzeOfficeStructure(enhancedText);

      const contentMetadata: OfficeContentMetadata = {
        type: ContentType.OFFICE_DOC,
        language: detectLanguage(enhancedText),
        encoding: "utf-8",
        hasText,
        wordCount: words.length,
        characterCount: enhancedText.length,
        officeMetadata,
        entities,
        relationships,
        structure,
      };

      const finalText = hasText
        ? enhancedText
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
        language: detectLanguage(text),
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
  private async extractPptxFromBuffer(_buffer: Buffer): Promise<{
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
   * Extract text and metadata from a file buffer
   */
  async extractFromBuffer(
    buffer: Buffer,
    options?: ProcessorOptions
  ): Promise<ProcessorResult> {
    // Convert buffer to temporary file path for processing
    const tempPath = `/tmp/office-${Date.now()}.docx`;
    try {
      require("fs").writeFileSync(tempPath, buffer);
      return await this.extractFromFile(tempPath, options);
    } finally {
      // Clean up temp file
      try {
        require("fs").unlinkSync(tempPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Extract text and metadata from a file path
   */
  async extractFromFile(
    filePath: string,
    options?: ProcessorOptions
  ): Promise<ProcessorResult> {
    const result = await this.extractTextFromFile(
      filePath,
      ContentType.OFFICE_DOC
    );
    return {
      text: result.text,
      metadata: result.metadata,
      success: true,
      processingTime: Date.now() - Date.now(), // TODO: Calculate actual processing time
      confidence: 1, // Office documents don't have confidence scores
    };
  }

  /**
   * Check if this processor supports a given content type
   */
  supportsContentType(contentType: ContentType): boolean {
    return (
      contentType === ContentType.OFFICE_DOC ||
      contentType === ContentType.OFFICE_SHEET ||
      contentType === ContentType.OFFICE_PRESENTATION
    );
  }

  /**
   * Get the supported content types for this processor
   */
  getSupportedContentTypes(): ContentType[] {
    return [
      ContentType.OFFICE_DOC,
      ContentType.OFFICE_SHEET,
      ContentType.OFFICE_PRESENTATION,
    ];
  }

  /**
   * Get the processor name/identifier
   */
  getProcessorName(): string {
    return "office-processor";
  }

  /**
   * Enhanced text cleaning for Office documents
   */
  private enhanceOfficeText(text: string): string {
    return (
      text
        // Normalize line endings and preserve paragraphs
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        // Clean up excessive whitespace within paragraphs
        .replace(/[^\n]+/g, (line) =>
          line.replace(/[ \t]+/g, " ").replace(/^\s+|\s+$/g, "")
        )
        // Clean up any remaining artifacts
        .replace(/\0/g, "")
        .trim()
    );
  }

  /**
   * Analyze Office document structure
   */
  private analyzeOfficeStructure(text: string): {
    headers: string[];
    paragraphs: number;
    hasTables: boolean;
    hasImages: boolean;
    hasLists: boolean;
  } {
    const headers: string[] = [];
    let paragraphs = 0;
    let hasTables = false;
    let hasImages = false;
    let hasLists = false;

    // Extract potential headers
    const lines = text.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 0 && trimmed.length < 100) {
        const isHeader =
          trimmed.length > 5 &&
          !/[.!?]$/.test(trimmed) &&
          (trimmed === trimmed.toUpperCase() || /^[A-Z][^.!?]*$/.test(trimmed));

        if (isHeader) {
          headers.push(trimmed);
        }
      }
    }

    // Count paragraphs
    paragraphs = text
      .split(/\n\s*\n/)
      .filter((block) => block.trim().length > 0).length;

    // Detect tables (tab-separated or comma-separated data)
    const tablePattern = /(\t|,.*)\n.*(\t|,.*)/;
    hasTables = tablePattern.test(text);

    // Detect image references
    hasImages =
      /\b(image|figure|img|pic|photo)\b/i.test(text) ||
      /\.(jpg|jpeg|png|gif|bmp|tiff|webp)\b/i.test(text);

    // Detect lists (numbered or bulleted)
    const listPattern = /^[1-9]+\.|^\*|^\-|^•/m;
    hasLists = listPattern.test(text);

    return { headers, paragraphs, hasTables, hasImages, hasLists };
  }
}
