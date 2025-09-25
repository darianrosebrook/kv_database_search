import pdfParse from "pdf-parse";
import { ContentType, ContentMetadata } from "../../types/index";
import {
  BaseContentProcessor,
  ProcessorOptions,
  ProcessorResult,
} from "./base-processor";
import {
  detectLanguage,
  EnhancedEntityExtractor,
  ExtractedEntity,
  EntityRelationship,
} from "../utils";
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
  entities?: ExtractedEntity[];
  relationships?: EntityRelationship[];
  structure?: {
    headers: string[];
    paragraphs: number;
    hasTables: boolean;
    hasImages: boolean;
  };
}

export class PDFProcessor extends BaseContentProcessor {
  private entityExtractor: EnhancedEntityExtractor;

  constructor() {
    super("PDF Processor", [ContentType.PDF]);
    this.entityExtractor = new EnhancedEntityExtractor();
  }

  /**
   * Extract text and metadata from a PDF buffer
   */
  async extractFromBuffer(
    buffer: Buffer,
    options?: ProcessorOptions
  ): Promise<ProcessorResult> {
    const { time } = await this.measureTime(async () => {
      try {
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

        // Extract text content with enhanced processing
        const text = pdfData.text.trim();
        const cleanedText = this.cleanExtractedText(text);
        const enhancedText = this.enhanceExtractedText(cleanedText);
        const hasText = enhancedText.length > 0;
        const wordCount = this.countWords(enhancedText);
        const characterCount = this.countCharacters(enhancedText);

        // Get language from options or detect
        const language = options?.language || detectLanguage(enhancedText);

        // Extract entities and relationships
        const entities = this.entityExtractor.extractEntities(enhancedText);
        const relationships = this.entityExtractor.extractRelationships(
          enhancedText,
          entities
        );

        // Analyze document structure
        const structure = this.analyzeDocumentStructure(enhancedText);

        // Create content metadata
        const contentMetadata: PDFContentMetadata = {
          type: ContentType.PDF,
          language,
          encoding: "utf-8",
          pageCount: pdfData.numpages || 0,
          wordCount,
          characterCount,
          hasText,
          pdfMetadata,
          entities,
          relationships,
          structure,
        };

        return this.createSuccessResult(
          hasText ? enhancedText : "PDF document contains no extractable text",
          contentMetadata,
          time,
          language
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return this.createErrorResult(
          `PDF processing failed: ${errorMessage}`,
          options?.language || "unknown"
        );
      }
    });

    return time.result;
  }

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
   * Extract text from a PDF buffer (useful for testing) with enhanced processing
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

      // Extract text content with enhanced processing
      const text = pdfData.text.trim();
      const cleanedText = this.cleanExtractedText(text);
      const enhancedText = this.enhanceExtractedText(cleanedText);
      const hasText = enhancedText.length > 0;
      const wordCount = this.countWords(enhancedText);
      const characterCount = this.countCharacters(enhancedText);

      // Get language from options or detect
      const language = this.detectLanguage(enhancedText);

      // Extract entities and relationships
      const entities = this.entityExtractor.extractEntities(enhancedText);
      const relationships = this.entityExtractor.extractRelationships(
        enhancedText,
        entities
      );

      // Analyze document structure
      const structure = this.analyzeDocumentStructure(enhancedText);

      // Create content metadata
      const contentMetadata: PDFContentMetadata = {
        type: ContentType.PDF,
        language,
        encoding: "utf-8",
        pageCount: pdfData.numpages || 0,
        wordCount,
        characterCount,
        hasText,
        pdfMetadata,
        entities,
        relationships,
        structure,
      };

      return {
        text: enhancedText,
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
   * Enhanced text cleaning with structure preservation
   */
  private enhanceExtractedText(text: string): string {
    return (
      text
        // Preserve paragraph breaks but normalize spacing
        .replace(/\n{3,}/g, "\n\n")
        // Clean up excessive whitespace within paragraphs
        .replace(/[^\n]+/g, (line) =>
          line.replace(/[ \t]+/g, " ").replace(/^\s+|\s+$/g, "")
        )
        // Ensure headers are properly formatted (only for lines that look like actual headers)
        .replace(/^[A-Z][A-Za-z\s]{20,}$/gm, (header) => {
          const trimmed = header.trim();
          // Only format as header if it's clearly a title (longer and contains multiple words)
          return trimmed.length > 0 &&
            trimmed.includes(" ") &&
            trimmed.length > 30
            ? `# ${trimmed}`
            : trimmed;
        })
        // Clean up any remaining artifacts
        .replace(/\0/g, "")
        .trim()
    );
  }

  /**
   * Analyze document structure to extract headers and count elements
   */
  private analyzeDocumentStructure(text: string): {
    headers: string[];
    paragraphs: number;
    hasTables: boolean;
    hasImages: boolean;
  } {
    const headers: string[] = [];
    let paragraphs = 0;
    let hasTables = false;
    let hasImages = false;

    // Extract potential headers (lines that look like titles)
    const lines = text.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 0 && trimmed.length < 100) {
        // Check if it looks like a header (short, no punctuation, mostly uppercase)
        const isHeader =
          trimmed.length > 5 &&
          !/[.!?]$/.test(trimmed) &&
          (trimmed === trimmed.toUpperCase() || /^[A-Z][^.!?]*$/.test(trimmed));

        if (isHeader) {
          headers.push(trimmed);
        }
      }
    }

    // Count paragraphs (blocks of text separated by empty lines)
    paragraphs = text
      .split(/\n\s*\n/)
      .filter((block) => block.trim().length > 0).length;

    // Detect tables (multiple lines with similar structure)
    const tablePattern = /(.+\t.+|.+,.+.+)\n(.+\t.+|.+,.+.+)/;
    hasTables = tablePattern.test(text);

    // Detect image references
    hasImages =
      /\b(image|figure|img|pic|photo)\b/i.test(text) ||
      /\.(jpg|jpeg|png|gif|bmp|tiff|webp)\b/i.test(text);

    return { headers, paragraphs, hasTables, hasImages };
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
