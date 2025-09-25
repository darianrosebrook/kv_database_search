import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import * as officeParser from "officeparser";
import { ContentType, ContentMetadata } from "../../types/index.ts";
import {
  detectLanguage,
  EnhancedEntityExtractor,
  ExtractedEntity,
  EntityRelationship,
  countWords,
  countCharacters,
} from "../utils.ts";
import * as fs from "fs";
import {
  BaseContentProcessor,
  ProcessorOptions,
  ProcessorResult,
} from "./base-processor.ts";

export interface EnhancedOfficeMetadata {
  title?: string;
  author?: string;
  created?: Date;
  modified?: Date;
  application?: string;
  version?: string;
  wordCount?: number;
  pageCount?: number;
  sheetCount?: number;
  slideCount?: number;
  paragraphCount?: number;
  hasImages?: boolean;
  hasCharts?: boolean;
  hasComments?: boolean;
  hasFormulas?: boolean;
  documentTheme?: string;
  customProperties?: Record<string, any>;
}

export interface EnhancedOfficeContentMetadata extends ContentMetadata {
  officeMetadata?: EnhancedOfficeMetadata;
  hasText: boolean;
  wordCount: number;
  characterCount: number;
  entities?: ExtractedEntity[];
  relationships?: EntityRelationship[];
  structure?: {
    headers: string[];
    sections: string[];
    paragraphs: number;
    hasTables: boolean;
    hasImages: boolean;
    hasLists: boolean;
    hasFormulas: boolean;
    hasCharts: boolean;
    documentType: "text" | "spreadsheet" | "presentation";
  };
  sheets?: Array<{
    name: string;
    cellCount: number;
    hasFormulas: boolean;
    hasCharts: boolean;
    dataTypes: string[];
  }>;
  slides?: Array<{
    title?: string;
    contentLength: number;
    hasImages: boolean;
    noteLength: number;
  }>;
}

export class EnhancedOfficeProcessor extends BaseContentProcessor {
  private entityExtractor: EnhancedEntityExtractor;

  constructor() {
    super("Enhanced Office Processor", [
      ContentType.OFFICE_DOC,
      ContentType.OFFICE_SHEET,
      ContentType.OFFICE_PRESENTATION,
    ]);
    this.entityExtractor = new EnhancedEntityExtractor();
  }

  /**
   * Extract text and metadata from Office documents
   */
  async extractFromBuffer(
    buffer: Buffer,
    options?: ProcessorOptions
  ): Promise<ProcessorResult> {
    const { result, time } = await this.measureTime(async () => {
      try {
        console.log("🏢 Starting enhanced office document processing...");

        // Detect office document type
        const detection = this.detectOfficeDocumentType(buffer);

        if (!detection.supported) {
          throw new Error("Unsupported office document format");
        }

        console.log(`📋 Detected document type: ${detection.type}`);

        // Process based on document type
        let processingResult;
        switch (detection.type) {
          case ContentType.OFFICE_DOC:
            processingResult = await this.processDocxDocument(buffer, options);
            break;
          case ContentType.OFFICE_SHEET:
            processingResult = await this.processXlsxDocument(buffer, options);
            break;
          case ContentType.OFFICE_PRESENTATION:
            processingResult = await this.processPptxDocument(buffer, options);
            break;
          default:
            throw new Error(`Unsupported document type: ${detection.type}`);
        }

        console.log(
          `✅ Office processing complete: ${processingResult.metadata.wordCount} words`
        );

        return {
          success: true,
          text: processingResult.text,
          metadata: processingResult.metadata,
          processingTime: 0, // Will be set after measureTime completes
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("❌ Enhanced office processing failed:", errorMessage);

        return {
          success: false,
          text: `Office Document Error: ${errorMessage}`,
          metadata: {
            type: ContentType.OFFICE_DOC,
            language: "unknown",
            hasText: false,
            wordCount: 0,
            characterCount: 0,
          } as EnhancedOfficeContentMetadata,
          processingTime: 0,
          error: errorMessage,
        };
      }
    });

    result.processingTime = time;
    return result;
  }

  /**
   * Detect office document type from buffer
   */
  private detectOfficeDocumentType(buffer: Buffer): {
    supported: boolean;
    type?: ContentType;
  } {
    // Office documents are ZIP-based, check for ZIP signature
    const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
    if (!buffer.subarray(0, 4).equals(zipSignature)) {
      return { supported: false };
    }

    // Check for Office-specific content markers
    const bufferString = buffer.toString("ascii");

    if (bufferString.includes("word/")) {
      return { supported: true, type: ContentType.OFFICE_DOC };
    } else if (bufferString.includes("xl/")) {
      return { supported: true, type: ContentType.OFFICE_SHEET };
    } else if (bufferString.includes("ppt/")) {
      return { supported: true, type: ContentType.OFFICE_PRESENTATION };
    }

    return { supported: false };
  }

  /**
   * Process DOCX documents with enhanced metadata and structure extraction
   */
  private async processDocxDocument(
    buffer: Buffer,
    options?: ProcessorOptions
  ): Promise<{
    text: string;
    metadata: EnhancedOfficeContentMetadata;
  }> {
    console.log("📄 Processing DOCX document...");

    try {
      // Extract raw text with mammoth
      const mammothResult = await mammoth.extractRawText({ buffer });
      let text = mammothResult.value.trim();

      // Also try to extract HTML for better structure analysis
      const htmlResult = await mammoth.convertToHtml({ buffer });
      const htmlContent = htmlResult.value;

      // Clean and enhance the text
      text = this.enhanceOfficeText(text);
      const hasText = text.length > 0;
      const wordCount = countWords(text);
      const characterCount = countCharacters(text);

      // Extract enhanced metadata
      const officeMetadata = await this.extractDocxMetadata(buffer);

      // Analyze document structure from both text and HTML
      const structure = this.analyzeDocumentStructure(
        text,
        htmlContent,
        "text"
      );

      // Extract entities and relationships
      const entities = this.entityExtractor.extractEntities(text);
      const relationships = this.entityExtractor.extractRelationships(
        text,
        entities
      );

      const metadata: EnhancedOfficeContentMetadata = {
        type: ContentType.OFFICE_DOC,
        language: options?.language || detectLanguage(text),
        hasText,
        wordCount,
        characterCount,
        officeMetadata,
        entities,
        relationships,
        structure,
      };

      return {
        text: hasText ? text : "Word Document: No readable text content found",
        metadata,
      };
    } catch (error) {
      throw new Error(
        `DOCX processing failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Process XLSX documents with enhanced sheet analysis
   */
  private async processXlsxDocument(
    buffer: Buffer,
    options?: ProcessorOptions
  ): Promise<{
    text: string;
    metadata: EnhancedOfficeContentMetadata;
  }> {
    console.log("📊 Processing XLSX document...");

    try {
      const workbook = XLSX.read(buffer, { type: "buffer" });

      let allText = "";
      const sheets: EnhancedOfficeContentMetadata["sheets"] = [];
      let totalCells = 0;
      let hasFormulas = false;
      let hasCharts = false;

      // Process each worksheet
      workbook.SheetNames.forEach((sheetName, index) => {
        console.log(`  📄 Processing sheet ${index + 1}: ${sheetName}`);

        const worksheet = workbook.Sheets[sheetName];

        // Extract text content
        const csvText = XLSX.utils.sheet_to_csv(worksheet);
        if (csvText.trim()) {
          allText += `\n=== Sheet: ${sheetName} ===\n${csvText}\n`;
        }

        // Analyze sheet content
        const sheetAnalysis = this.analyzeWorksheet(worksheet, sheetName);
        sheets.push(sheetAnalysis);

        totalCells += sheetAnalysis.cellCount;
        if (sheetAnalysis.hasFormulas) hasFormulas = true;
        if (sheetAnalysis.hasCharts) hasCharts = true;
      });

      const text = allText.trim();
      const hasText = text.length > 0;
      const wordCount = countWords(text);
      const characterCount = countCharacters(text);

      // Create enhanced metadata
      const officeMetadata: EnhancedOfficeMetadata = {
        sheetCount: workbook.SheetNames.length,
        wordCount,
        application: "Microsoft Excel",
        hasFormulas,
        hasCharts,
      };

      const structure = this.analyzeDocumentStructure(text, "", "spreadsheet");

      const metadata: EnhancedOfficeContentMetadata = {
        type: ContentType.OFFICE_SHEET,
        language: options?.language || detectLanguage(text),
        hasText,
        wordCount,
        characterCount,
        officeMetadata,
        structure,
        sheets,
      };

      const finalText = hasText
        ? text
        : `Excel Spreadsheet: ${workbook.SheetNames.length} sheet(s), ${totalCells} cells with content`;

      return { text: finalText, metadata };
    } catch (error) {
      throw new Error(
        `XLSX processing failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Process PPTX documents using officeparser for comprehensive extraction
   */
  private async processPptxDocument(
    buffer: Buffer,
    options?: ProcessorOptions
  ): Promise<{
    text: string;
    metadata: EnhancedOfficeContentMetadata;
  }> {
    console.log("🎞️ Processing PPTX document...");

    try {
      // Write buffer to temporary file for officeparser
      const tempPath = `/tmp/pptx_${Date.now()}.pptx`;
      fs.writeFileSync(tempPath, buffer);

      try {
        // Extract text using officeparser
        const extractedData = await new Promise<string>((resolve, reject) => {
          officeParser.parseOfficeAsync(tempPath, (data: any, err: any) => {
            if (err) {
              reject(new Error(err));
            } else {
              resolve(data || "");
            }
          });
        });

        let text = extractedData.trim();

        // Clean and enhance the extracted text
        text = this.enhanceOfficeText(text);
        const hasText = text.length > 0;
        const wordCount = countWords(text);
        const characterCount = countCharacters(text);

        // Analyze slide structure (basic estimation from text)
        const slides = this.analyzeSlideStructure(text);

        // Create enhanced metadata
        const officeMetadata: EnhancedOfficeMetadata = {
          slideCount: slides.length,
          wordCount,
          application: "Microsoft PowerPoint",
        };

        const structure = this.analyzeDocumentStructure(
          text,
          "",
          "presentation"
        );

        // Extract entities and relationships
        const entities = this.entityExtractor.extractEntities(text);
        const relationships = this.entityExtractor.extractRelationships(
          text,
          entities
        );

        const metadata: EnhancedOfficeContentMetadata = {
          type: ContentType.OFFICE_PRESENTATION,
          language: options?.language || detectLanguage(text),
          hasText,
          wordCount,
          characterCount,
          officeMetadata,
          entities,
          relationships,
          structure,
          slides,
        };

        const finalText = hasText
          ? text
          : `PowerPoint Presentation: ${slides.length} slide(s), no readable text found`;

        return { text: finalText, metadata };
      } finally {
        // Clean up temporary file
        try {
          fs.unlinkSync(tempPath);
        } catch (cleanupError) {
          console.warn("⚠️ Failed to clean up temp file:", cleanupError);
        }
      }
    } catch (error) {
      throw new Error(
        `PPTX processing failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
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
        // Remove common office artifacts
        .replace(/\0/g, "")
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        .trim()
    );
  }

  /**
   * Extract enhanced metadata from DOCX documents
   */
  private async extractDocxMetadata(
    buffer: Buffer
  ): Promise<EnhancedOfficeMetadata> {
    // This is a simplified implementation
    // In a full implementation, you would parse the docProps/core.xml and docProps/app.xml files
    const metadata: EnhancedOfficeMetadata = {
      application: "Microsoft Word",
      // Additional metadata extraction would require parsing the ZIP structure
    };

    return metadata;
  }

  /**
   * Analyze worksheet content and structure
   */
  private analyzeWorksheet(
    worksheet: any,
    sheetName: string
  ): {
    name: string;
    cellCount: number;
    hasFormulas: boolean;
    hasCharts: boolean;
    dataTypes: string[];
  } {
    const dataTypes = new Set<string>();
    let cellCount = 0;
    let hasFormulas = false;

    // Analyze cells
    if (worksheet["!ref"]) {
      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      for (let row = range.s.r; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];

          if (cell && cell.v !== undefined) {
            cellCount++;

            // Check for formulas
            if (cell.f) {
              hasFormulas = true;
            }

            // Determine data type
            if (typeof cell.v === "number") {
              dataTypes.add("number");
            } else if (typeof cell.v === "string") {
              dataTypes.add("text");
            } else if (cell.v instanceof Date) {
              dataTypes.add("date");
            }
          }
        }
      }
    }

    return {
      name: sheetName,
      cellCount,
      hasFormulas,
      hasCharts: false, // Would need additional analysis for charts
      dataTypes: Array.from(dataTypes),
    };
  }

  /**
   * Analyze document structure based on content and type
   */
  private analyzeDocumentStructure(
    text: string,
    htmlContent: string,
    documentType: "text" | "spreadsheet" | "presentation"
  ): EnhancedOfficeContentMetadata["structure"] {
    const lines = text.split("\n").filter((line) => line.trim());
    const headers: string[] = [];
    const sections: string[] = [];

    // Extract headers based on document type
    if (documentType === "text") {
      // For text documents, look for potential headers
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (
          trimmed.length > 0 &&
          trimmed.length < 100 &&
          !trimmed.endsWith(".") &&
          /^[A-Z]/.test(trimmed)
        ) {
          headers.push(trimmed);
        }
      });

      // Extract sections from HTML if available
      if (htmlContent) {
        const sectionMatches = htmlContent.match(
          /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi
        );
        if (sectionMatches) {
          sectionMatches.forEach((match) => {
            const sectionText = match.replace(/<[^>]+>/g, "").trim();
            if (sectionText) {
              sections.push(sectionText);
            }
          });
        }
      }
    }

    // Count paragraphs
    const paragraphs = text
      .split(/\n\s*\n/)
      .filter((block) => block.trim().length > 0).length;

    // Detect various content types
    const hasTables =
      /\t/.test(text) || /\|.*\|/.test(text) || text.includes("Table");
    const hasImages = /\b(image|figure|img|pic|photo)\b/i.test(text);
    const hasLists = /^\s*[•\-\*]\s+|^\s*\d+\.\s+/m.test(text);
    const hasFormulas = /=\w+\(/.test(text) || /\$[A-Z]+\$?\d+/.test(text);
    const hasCharts = /\b(chart|graph|diagram)\b/i.test(text);

    return {
      headers: headers.slice(0, 10), // Limit to first 10 headers
      sections: sections.slice(0, 10),
      paragraphs,
      hasTables,
      hasImages,
      hasLists,
      hasFormulas,
      hasCharts,
      documentType,
    };
  }

  /**
   * Analyze slide structure from presentation text
   */
  private analyzeSlideStructure(text: string): Array<{
    title?: string;
    contentLength: number;
    hasImages: boolean;
    noteLength: number;
  }> {
    // Simple slide detection based on content patterns
    // In a full implementation, this would parse the actual slide XML structure
    const slideBreaks = text.split(/\n\s*\n\s*\n/); // Multiple line breaks often indicate slide boundaries

    return slideBreaks.map((slideContent, index) => {
      const lines = slideContent.split("\n").filter((line) => line.trim());
      const title = lines.length > 0 ? lines[0] : undefined;

      return {
        title: title && title.length < 100 ? title : undefined,
        contentLength: slideContent.length,
        hasImages: /\b(image|figure|img|pic|photo)\b/i.test(slideContent),
        noteLength: 0, // Would need additional parsing for speaker notes
      };
    });
  }

  /**
   * Extract text from file path
   */
  async extractText(filePath: string): Promise<ProcessorResult> {
    try {
      const buffer = fs.readFileSync(filePath);
      return await this.extractFromBuffer(buffer);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        `Failed to read office file: ${errorMessage}`,
        0
      );
    }
  }

  /**
   * Create an error result
   */
  private createErrorResult(
    message: string,
    processingTime: number
  ): ProcessorResult {
    return {
      success: false,
      text: `Error: ${message}`,
      metadata: {
        type: ContentType.OFFICE_DOC,
        language: "unknown",
        hasText: false,
        wordCount: 0,
        characterCount: 0,
      } as EnhancedOfficeContentMetadata,
      processingTime,
      error: message,
    };
  }
}
