export declare enum ContentType {
    MARKDOWN = "markdown",
    PLAIN_TEXT = "plain_text",
    RICH_TEXT = "rich_text",
    PDF = "pdf",
    OFFICE_DOC = "office_document",
    OFFICE_SHEET = "office_spreadsheet",
    OFFICE_PRESENTATION = "office_presentation",
    RASTER_IMAGE = "raster_image",
    VECTOR_IMAGE = "vector_image",
    DOCUMENT_IMAGE = "document_image",
    AUDIO = "audio",
    SPEECH = "speech",
    VIDEO = "video",
    JSON = "json",
    XML = "xml",
    CSV = "csv",
    BINARY = "binary",
    UNKNOWN = "unknown"
}
export interface UniversalMetadata {
    file: FileMetadata;
    content: ContentMetadata;
    processing: ProcessingMetadata;
    quality: QualityMetadata;
    relationships: RelationshipMetadata;
}
export interface FileMetadata {
    id: string;
    path: string;
    name: string;
    extension: string;
    mimeType: string;
    size: number;
    createdAt: Date;
    modifiedAt: Date;
    checksum: string;
}
export interface ContentMetadata {
    type: ContentType;
    language?: string;
    encoding?: string;
    dimensions?: Dimensions;
    duration?: number;
    pageCount?: number;
    wordCount?: number;
    characterCount?: number;
}
export interface Dimensions {
    width: number;
    height: number;
}
export interface ProcessingMetadata {
    processedAt: Date;
    processor: string;
    version: string;
    parameters: Record<string, any>;
    processingTime: number;
    success: boolean;
    errors?: string[];
}
export interface QualityMetadata {
    overallScore: number;
    confidence: number;
    completeness: number;
    accuracy: number;
    issues: QualityIssue[];
}
export interface QualityIssue {
    type: 'completeness' | 'accuracy' | 'consistency' | 'timeliness';
    field: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
}
export interface RelationshipMetadata {
    parentFile?: string;
    relatedFiles: string[];
    tags: string[];
    categories: string[];
    topics: string[];
}
export interface ContentTypeResult {
    mimeType: string;
    contentType: ContentType;
    confidence: number;
    features: ContentFeatures;
}
export interface ContentFeatures {
    hasText: boolean;
    hasImages: boolean;
    hasAudio: boolean;
    hasVideo: boolean;
    isStructured: boolean;
    encoding: string;
    language: string;
}
/**
 * Multi-modal content detector and processor
 */
export declare class MultiModalContentDetector {
    private mimeTypeMap;
    private extensionMap;
    detectContentType(fileBuffer: Buffer, fileName: string): Promise<ContentTypeResult>;
    private detectMimeType;
    private analyzeContent;
    private detectTextContent;
    private detectStructuredData;
    private detectEncoding;
    private detectLanguage;
    private validateExtension;
    private classifyContentType;
    private calculateConfidence;
}
/**
 * Universal metadata extractor
 */
export declare class UniversalMetadataExtractor {
    private contentDetector;
    constructor(contentDetector: MultiModalContentDetector);
    extractMetadata(filePath: string): Promise<UniversalMetadata>;
    private extractContentMetadata;
    private extractTextMetadata;
    private extractPDFMetadata;
    private extractImageMetadata;
    private extractAudioMetadata;
    private extractVideoMetadata;
    private extractStructuredMetadata;
    private calculateCompleteness;
    private generateFileId;
    private generateChecksum;
}
