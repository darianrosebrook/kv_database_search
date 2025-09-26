import * as fs from "fs";
import * as path from "path";
import { createHash, detectLanguage } from "./utils";
import {
  ContentType,
  UniversalMetadata,
  FileMetadata,
  ContentMetadata,
  Dimensions,
  ProcessingMetadata,
  QualityMetadata,
  QualityIssue,
  RelationshipMetadata,
  ContentTypeResult,
  ContentFeatures,
} from "../types/index";

// Re-export types for external use
export type {
  UniversalMetadata,
  FileMetadata,
  ContentMetadata,
  Dimensions,
  ProcessingMetadata,
  QualityMetadata,
  QualityIssue,
  RelationshipMetadata,
  ContentTypeResult,
  ContentFeatures,
};

// Re-export enum as value for use in switch statements etc.
export { ContentType } from "../types/index";
import { contentProcessorRegistry } from "./processors/processor-registry-instance";

/**
 * Multi-modal content detector and processor
 */
export class MultiModalContentDetector {
  private mimeTypeMap: Map<string, ContentType> = new Map([
    // Text
    ["text/plain", ContentType.PLAIN_TEXT],
    ["text/markdown", ContentType.MARKDOWN],
    ["text/rtf", ContentType.RICH_TEXT],

    // Documents
    ["application/pdf", ContentType.PDF],
    [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ContentType.OFFICE_DOC,
    ],
    ["application/msword", ContentType.OFFICE_DOC],
    [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ContentType.OFFICE_SHEET,
    ],
    ["application/vnd.ms-excel", ContentType.OFFICE_SHEET],
    [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ContentType.OFFICE_PRESENTATION,
    ],
    ["application/vnd.ms-powerpoint", ContentType.OFFICE_PRESENTATION],

    // Images
    ["image/jpeg", ContentType.RASTER_IMAGE],
    ["image/png", ContentType.RASTER_IMAGE],
    ["image/gif", ContentType.RASTER_IMAGE],
    ["image/bmp", ContentType.RASTER_IMAGE],
    ["image/tiff", ContentType.RASTER_IMAGE],
    ["image/webp", ContentType.RASTER_IMAGE],
    ["image/svg+xml", ContentType.VECTOR_IMAGE],

    // Audio
    ["audio/mpeg", ContentType.AUDIO],
    ["audio/wav", ContentType.AUDIO],
    ["audio/flac", ContentType.AUDIO],
    ["audio/mp4", ContentType.AUDIO],
    ["audio/ogg", ContentType.AUDIO],

    // Video
    ["video/mp4", ContentType.VIDEO],
    ["video/avi", ContentType.VIDEO],
    ["video/mov", ContentType.VIDEO],
    ["video/wmv", ContentType.VIDEO],
    ["video/mkv", ContentType.VIDEO],

    // Structured Data
    ["application/json", ContentType.JSON],
    ["application/xml", ContentType.XML],
    ["text/xml", ContentType.XML],
    ["text/csv", ContentType.CSV],
  ]);

  private extensionMap: Map<string, ContentType> = new Map([
    // Text
    [".md", ContentType.MARKDOWN],
    [".txt", ContentType.PLAIN_TEXT],
    [".rtf", ContentType.RICH_TEXT],

    // Documents
    [".pdf", ContentType.PDF],
    [".docx", ContentType.OFFICE_DOC],
    [".doc", ContentType.OFFICE_DOC],
    [".xlsx", ContentType.OFFICE_SHEET],
    [".xls", ContentType.OFFICE_SHEET],
    [".pptx", ContentType.OFFICE_PRESENTATION],
    [".ppt", ContentType.OFFICE_PRESENTATION],

    // Images
    [".jpg", ContentType.RASTER_IMAGE],
    [".jpeg", ContentType.RASTER_IMAGE],
    [".png", ContentType.RASTER_IMAGE],
    [".gif", ContentType.RASTER_IMAGE],
    [".bmp", ContentType.RASTER_IMAGE],
    [".tiff", ContentType.RASTER_IMAGE],
    [".webp", ContentType.RASTER_IMAGE],
    [".svg", ContentType.VECTOR_IMAGE],

    // Audio
    [".mp3", ContentType.AUDIO],
    [".wav", ContentType.AUDIO],
    [".flac", ContentType.AUDIO],
    [".m4a", ContentType.AUDIO],
    [".ogg", ContentType.AUDIO],

    // Video
    [".mp4", ContentType.VIDEO],
    [".avi", ContentType.VIDEO],
    [".mov", ContentType.VIDEO],
    [".wmv", ContentType.VIDEO],
    [".mkv", ContentType.VIDEO],

    // Structured Data
    [".json", ContentType.JSON],
    [".xml", ContentType.XML],
    [".csv", ContentType.CSV],
  ]);

  async detectContentType(
    fileBuffer: Buffer,
    fileName: string
  ): Promise<ContentTypeResult> {
    // 1. MIME type detection
    const mimeType = await this.detectMimeType(fileBuffer);

    // 2. Content analysis
    const contentAnalysis = await this.analyzeContent(fileBuffer);

    // 3. Extension-based detection (as fallback)
    const extension = path.extname(fileName).toLowerCase();
    const extensionBasedType = this.extensionMap.get(extension);

    // 4. Extension validation
    const extensionMatch = this.validateExtension(fileName, mimeType);

    // 5. Final classification - prefer MIME type, fall back to extension, then content analysis
    let contentType: ContentType;
    if (this.mimeTypeMap.has(mimeType)) {
      contentType = this.mimeTypeMap.get(mimeType)!;
    } else if (extensionBasedType) {
      contentType = extensionBasedType;
    } else {
      contentType = this.classifyContentType(mimeType, contentAnalysis);
    }

    return {
      mimeType,
      contentType,
      confidence: this.calculateConfidence(
        mimeType,
        contentAnalysis,
        extensionMatch
      ),
      features: contentAnalysis.features,
    };
  }

  private async detectMimeType(buffer: Buffer): Promise<string> {
    // Simple MIME type detection based on file signatures
    // In production, use a proper library like 'file-type' or 'mmmagic'

    const signatures: Array<{
      signature: Buffer;
      mimeType: string;
      offset?: number;
    }> = [
      {
        signature: Buffer.from([0x25, 0x50, 0x44, 0x46]),
        mimeType: "application/pdf",
      }, // %PDF
      { signature: Buffer.from([0xff, 0xd8, 0xff]), mimeType: "image/jpeg" }, // JPEG
      {
        signature: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
        mimeType: "image/png",
      }, // PNG
      {
        signature: Buffer.from([0x47, 0x49, 0x46, 0x38]),
        mimeType: "image/gif",
      }, // GIF
      { signature: Buffer.from([0x42, 0x4d]), mimeType: "image/bmp" }, // BMP
      {
        signature: Buffer.from([0x49, 0x49, 0x2a, 0x00]),
        mimeType: "image/tiff",
      }, // TIFF (little-endian)
      {
        signature: Buffer.from([0x4d, 0x4d, 0x00, 0x2a]),
        mimeType: "image/tiff",
      }, // TIFF (big-endian)
      {
        signature: Buffer.from([0x52, 0x49, 0x46, 0x46]),
        mimeType: "video/avi",
      }, // RIFF (AVI)
      {
        signature: Buffer.from([
          0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
        ]),
        mimeType: "video/mp4",
      }, // MP4
      {
        signature: Buffer.from([0x66, 0x74, 0x79, 0x70]),
        mimeType: "video/mp4",
        offset: 4,
      }, // MP4 (alternative)
    ];

    for (const { signature, mimeType, offset = 0 } of signatures) {
      if (buffer.length >= signature.length + offset) {
        const bufferSlice = buffer.slice(offset, offset + signature.length);
        if (bufferSlice.equals(signature)) {
          return mimeType;
        }
      }
    }

    // Fallback to extension-based detection
    return "application/octet-stream";
  }

  private async analyzeContent(
    buffer: Buffer
  ): Promise<{ features: ContentFeatures }> {
    const features: ContentFeatures = {
      hasText: false,
      hasImages: false,
      hasAudio: false,
      hasVideo: false,
      isStructured: false,
      encoding: "unknown",
      language: "unknown",
    };

    // Check for text content (simple heuristic)
    features.hasText = this.detectTextContent(buffer);

    // Check for structured data
    features.isStructured = this.detectStructuredData(buffer);

    // Detect encoding if text
    if (features.hasText) {
      features.encoding = await this.detectEncoding(buffer);
      features.language = detectLanguage(
        buffer.toString("utf8", 0, Math.min(1024, buffer.length))
      );
    }

    // Note: Binary file analysis for images/audio/video would require
    // more sophisticated libraries in production

    return { features };
  }

  private detectTextContent(buffer: Buffer): boolean {
    // Check if buffer contains mostly printable ASCII characters
    const sampleSize = Math.min(1024, buffer.length);
    let printableChars = 0;
    let totalChars = 0;

    for (let i = 0; i < sampleSize; i++) {
      const byte = buffer[i];
      totalChars++;

      // Count printable ASCII characters (32-126) and common whitespace
      if (
        (byte >= 32 && byte <= 126) ||
        byte === 9 ||
        byte === 10 ||
        byte === 13
      ) {
        printableChars++;
      }
    }

    // Consider it text if > 70% printable characters
    return totalChars > 0 && printableChars / totalChars > 0.7;
  }

  private detectStructuredData(buffer: Buffer): boolean {
    if (!this.detectTextContent(buffer)) return false;

    const text = buffer.toString("utf8", 0, Math.min(1024, buffer.length));

    // Check for JSON
    try {
      JSON.parse(text);
      return true;
    } catch {
      // Intentionally empty - we just want to know if JSON parsing succeeds
    }

    // Check for XML
    if (/^\s*<\?xml/.test(text) || /^\s*<[^>]+>/.test(text)) {
      return true;
    }

    // Check for CSV (simple heuristic)
    const lines = text.split("\n").slice(0, 5);
    if (lines.length >= 2) {
      const firstLineCommas = (lines[0].match(/,/g) || []).length;
      const hasConsistentCommas = lines.every(
        (line) =>
          Math.abs((line.match(/,/g) || []).length - firstLineCommas) <= 1
      );
      if (hasConsistentCommas && firstLineCommas > 0) {
        return true;
      }
    }

    return false;
  }

  private async detectEncoding(_buffer: Buffer): Promise<string> {
    // Simple encoding detection - in production use 'chardet' or similar
    // For now, assume UTF-8
    return "utf-8";
  }

  private validateExtension(fileName: string, mimeType: string): boolean {
    const extension = path.extname(fileName).toLowerCase();
    const expectedType = this.extensionMap.get(extension);

    if (!expectedType) return false;

    const actualType = this.mimeTypeMap.get(mimeType);
    return expectedType === actualType;
  }

  private classifyContentType(
    mimeType: string,
    contentAnalysis: { features: ContentFeatures }
  ): ContentType {
    // First try MIME type mapping
    const mimeBasedType = this.mimeTypeMap.get(mimeType);
    if (mimeBasedType) return mimeBasedType;

    // Fall back to content analysis
    const features = contentAnalysis.features;

    if (features.isStructured) {
      if (features.hasText) {
        const text = ""; // Would need buffer conversion
        if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
          return ContentType.JSON;
        }
        if (text.includes("<") && text.includes(">")) {
          return ContentType.XML;
        }
        if (text.includes(",")) {
          return ContentType.CSV;
        }
      }
    }

    if (features.hasText) {
      return ContentType.PLAIN_TEXT;
    }

    return ContentType.BINARY;
  }

  private calculateConfidence(
    mimeType: string,
    contentAnalysis: { features: ContentFeatures },
    extensionMatch: boolean
  ): number {
    let confidence = 0.5; // Base confidence

    // MIME type match increases confidence
    if (this.mimeTypeMap.has(mimeType)) {
      confidence += 0.3;
    }

    // Extension match increases confidence
    if (extensionMatch) {
      confidence += 0.2;
    }

    // Text detection increases confidence
    if (contentAnalysis.features.hasText) {
      confidence += 0.1;
    }

    // Structured data detection increases confidence
    if (contentAnalysis.features.isStructured) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }
}

/**
 * Universal metadata extractor
 */
export class UniversalMetadataExtractor {
  constructor(private contentDetector: MultiModalContentDetector) {
    // Processors are now managed by the registry
  }

  async extractMetadata(filePath: string): Promise<UniversalMetadata> {
    const startTime = Date.now();

    try {
      // Read file
      const buffer = fs.readFileSync(filePath);
      const stats = fs.statSync(filePath);

      // Detect content type
      const typeResult = await this.contentDetector.detectContentType(
        buffer,
        path.basename(filePath)
      );

      // Generate checksum
      const checksum = this.generateChecksum(buffer);

      // Extract file metadata
      const fileMetadata: FileMetadata = {
        id: this.generateFileId(filePath),
        path: filePath,
        name: path.basename(filePath),
        extension: path.extname(filePath),
        mimeType: typeResult.mimeType,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        checksum,
      };

      // Extract content-specific metadata
      const contentMetadata = await this.extractContentMetadata(
        buffer,
        typeResult
      );

      // Create processing metadata
      const processingMetadata: ProcessingMetadata = {
        processedAt: new Date(),
        processor: "universal-metadata-extractor",
        version: "1.0.0",
        parameters: {},
        processingTime: Date.now() - startTime,
        success: true,
      };

      // Create quality metadata
      const qualityMetadata: QualityMetadata = {
        overallScore: typeResult.confidence,
        confidence: typeResult.confidence,
        completeness: this.calculateCompleteness(contentMetadata),
        accuracy: typeResult.confidence,
        issues: [],
      };

      // Create relationship metadata (placeholder for now)
      const relationshipMetadata: RelationshipMetadata = {
        relatedFiles: [],
        tags: [],
        categories: [],
        topics: [],
      };

      return {
        file: fileMetadata,
        content: contentMetadata,
        processing: processingMetadata,
        quality: qualityMetadata,
        relationships: relationshipMetadata,
      };
    } catch (error) {
      // Create error metadata
      const processingMetadata: ProcessingMetadata = {
        processedAt: new Date(),
        processor: "universal-metadata-extractor",
        version: "1.0.0",
        parameters: {},
        processingTime: Date.now() - startTime,
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };

      return {
        file: {
          id: this.generateFileId(filePath),
          path: filePath,
          name: path.basename(filePath),
          extension: path.extname(filePath),
          mimeType: "application/octet-stream",
          size: 0,
          createdAt: new Date(),
          modifiedAt: new Date(),
          checksum: "",
        },
        content: {
          type: ContentType.UNKNOWN,
        },
        processing: processingMetadata,
        quality: {
          overallScore: 0,
          confidence: 0,
          completeness: 0,
          accuracy: 0,
          issues: [
            {
              type: "completeness",
              field: "processing",
              severity: "high",
              description: `Failed to process file: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        },
        relationships: {
          relatedFiles: [],
          tags: [],
          categories: [],
          topics: [],
        },
      };
    }
  }

  private async extractContentMetadata(
    buffer: Buffer,
    typeResult: ContentTypeResult
  ): Promise<ContentMetadata> {
    const baseMetadata: ContentMetadata = {
      type: typeResult.contentType,
      language: typeResult.features.language,
      encoding: typeResult.features.encoding,
    };

    // Use processor registry to extract type-specific metadata
    const processorResult = await contentProcessorRegistry.processContent(
      buffer,
      typeResult.contentType,
      { language: typeResult.features.language }
    );

    if (processorResult.success) {
      return processorResult.metadata;
    }

    // Fallback to generic processing for unsupported types
    return this.extractGenericMetadata(buffer, baseMetadata);
  }

  private extractGenericMetadata(
    buffer: Buffer,
    baseMetadata: ContentMetadata
  ): ContentMetadata {
    const text = buffer.toString("utf8");
    const words = text.split(/\s+/).filter((word) => word.length > 0);

    return {
      ...baseMetadata,
      wordCount: words.length,
      characterCount: text.length,
    };
  }

  private calculateCompleteness(contentMetadata: ContentMetadata): number {
    let score = 0;
    let maxScore = 0;

    // Type is always present
    score += 1;
    maxScore += 1;

    // Language detection
    if (contentMetadata.language && contentMetadata.language !== "unknown") {
      score += 1;
    }
    maxScore += 1;

    // Encoding detection
    if (contentMetadata.encoding && contentMetadata.encoding !== "unknown") {
      score += 1;
    }
    maxScore += 1;

    // Content-specific metrics
    switch (contentMetadata.type) {
      case ContentType.MARKDOWN:
      case ContentType.PLAIN_TEXT:
        if (contentMetadata.wordCount !== undefined) score += 1;
        if (contentMetadata.characterCount !== undefined) score += 1;
        maxScore += 2;
        break;

      case ContentType.PDF:
        if (contentMetadata.pageCount !== undefined) score += 1;
        maxScore += 1;
        break;

      case ContentType.RASTER_IMAGE:
      case ContentType.VECTOR_IMAGE:
        if (contentMetadata.dimensions !== undefined) score += 1;
        maxScore += 1;
        break;

      case ContentType.AUDIO:
      case ContentType.VIDEO:
        if (contentMetadata.duration !== undefined) score += 1;
        maxScore += 1;
        break;
    }

    return maxScore > 0 ? score / maxScore : 0;
  }

  private generateFileId(filePath: string): string {
    const hash = createHash("md5", filePath);
    return `file_${hash}`;
  }

  private generateChecksum(buffer: Buffer): string {
    return createHash("md5", buffer);
  }
}
