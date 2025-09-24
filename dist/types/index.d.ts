export type { ObsidianDocument, Wikilink, Backlink, ObsidianEmbeddingContext, ObsidianSearchQuery, ObsidianSearchOptions, ObsidianVaultAnalytics, ObsidianValidationResult, ObsidianIngestionConfig, SearchAPIRequest, SearchAPIResponse, IngestionAPIRequest, IngestionAPIResponse, AnalyticsAPIResponse, HealthAPIResponse, ObsidianContentType, ObsidianFrontmatterSchema, ValidationError, ValidationWarning, } from "../lib/obsidian-models.js";
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
export interface MultiModalIngestionConfig {
    batchSize?: number;
    rateLimitMs?: number;
    skipExisting?: boolean;
    includePatterns?: string[];
    excludePatterns?: string[];
    enableOCR?: boolean;
    enableSpeechToText?: boolean;
    maxFileSize?: number;
}
export interface MultiModalIngestionResult {
    totalFiles: number;
    processedFiles: number;
    skippedFiles: number;
    failedFiles: number;
    totalChunks: number;
    processedChunks: number;
    errors: string[];
    contentTypeStats: Record<ContentType, number>;
}
import type { ObsidianSearchResult as ObsidianSearchResultType } from "../lib/obsidian-models.js";
export type ObsidianSearchResult = ObsidianSearchResultType;
export interface DocumentChunk {
    id: string;
    text: string;
    meta: DocumentMetadata;
    embedding?: number[];
}
export interface DocumentMetadata {
    uri: string;
    section: string;
    breadcrumbs: string[];
    contentType: string;
    sourceType: string;
    sourceDocumentId: string;
    lang: string;
    acl: string;
    updatedAt: Date;
    createdAt?: Date;
    chunkIndex?: number;
    chunkCount?: number;
    obsidianFile?: {
        fileName: string;
        filePath: string;
        frontmatter: Record<string, any>;
        wikilinks: string[];
        tags: string[];
        checksum: string;
        stats: {
            wordCount: number;
            characterCount: number;
            lineCount: number;
        };
    };
    multiModalFile?: {
        fileId: string;
        contentType: ContentType;
        mimeType: string;
        checksum: string;
        quality: QualityMetadata;
        processing: ProcessingMetadata;
    };
}
export interface SearchResult {
    id: string;
    text: string;
    meta: DocumentMetadata;
    cosineSimilarity: number;
    rank: number;
}
export interface EmbeddingConfig {
    model: string;
    dimension: number;
}
export interface ObsidianFile {
    filePath: string;
    fileName: string;
    content: string;
    frontmatter: Record<string, any>;
    wikilinks: string[];
    tags: string[];
    createdAt?: Date;
    updatedAt?: Date;
}
export interface ObsidianSearchResponse {
    query: string;
    results: ObsidianSearchResult[];
    totalFound: number;
    latencyMs: number;
    facets?: {
        contentTypes?: Array<{
            type: string;
            count: number;
        }>;
        tags?: Array<{
            tag: string;
            count: number;
        }>;
        folders?: Array<{
            folder: string;
            count: number;
        }>;
        temporal?: Array<{
            period: string;
            count: number;
        }>;
        fileTypes?: Array<{
            type: string;
            count: number;
        }>;
    };
    graphInsights?: {
        queryConcepts: string[];
        relatedConcepts: string[];
        knowledgeClusters: Array<{
            name: string;
            files: string[];
            centrality: number;
        }>;
    };
}
