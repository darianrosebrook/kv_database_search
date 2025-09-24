/**
 * Obsidian Data Contracts and API Specifications
 * Defines the data structures and contracts for Obsidian vault processing
 */
/**
 * Represents a complete Obsidian document with all metadata
 */
export interface ObsidianDocument {
    /** Unique identifier (relative path from vault root) */
    id: string;
    /** File system path relative to vault root */
    path: string;
    /** Full file path (for backward compatibility) */
    filePath?: string;
    /** Relative path (alias for path for backward compatibility) */
    relativePath?: string;
    /** Filename without extension */
    name: string;
    /** Filename with extension */
    fileName?: string;
    /** File extension (.md, .canvas, etc.) */
    extension: string;
    /** Raw file content */
    content: string;
    /** Parsed frontmatter YAML */
    frontmatter: Record<string, any>;
    /** Document statistics */
    stats: {
        wordCount: number;
        characterCount: number;
        lineCount: number;
        headingCount: number;
        linkCount: number;
        tagCount: number;
        size?: number;
        createdAt?: Date;
        updatedAt?: Date;
    };
    /** Obsidian-specific relationships */
    relationships: {
        /** Outgoing wikilinks */
        wikilinks: Wikilink[];
        /** Tags used in document */
        tags: string[];
        /** Referenced by these documents */
        backlinks: Backlink[];
    };
    /** Document sections (for chunking) */
    sections?: Array<{
        title: string;
        level: number;
        content: string;
        startLine: number;
        endLine: number;
        wikilinks?: string[];
        tags?: string[];
    }>;
    /** Processing metadata */
    metadata: {
        created: Date;
        modified: Date;
        checksum: string;
        lastIndexed?: Date;
        processingErrors?: string[];
    };
}
/**
 * Utility functions for Obsidian document processing
 */
export declare class ObsidianUtils {
    static cleanMarkdown(content: string): string;
    static extractWikilinks(content: string): string[];
    static extractTags(content: string): string[];
    static parseFrontmatter(content: string): Record<string, any>;
    static generateFileChecksum(content: string): string;
    static determineContentType(filePath: string, vaultPath: string, frontmatter: Record<string, any>): string;
}
/**
 * Represents a wikilink in Obsidian format
 */
export interface Wikilink {
    /** Target document path */
    target: string;
    /** Display text (if different from target) */
    display?: string;
    /** Link type */
    type: "document" | "heading" | "block";
    /** Position in source document */
    position: {
        line: number;
        column: number;
        offset: number;
    };
    /** Context around the link */
    context: string;
}
/**
 * Represents a backlink reference
 */
export interface Backlink {
    /** Source document that references this document */
    source: string;
    /** Context of the reference */
    context: string;
    /** Position in source document */
    position: {
        line: number;
        column: number;
        offset: number;
    };
}
/**
 * Processing context for embeddings
 */
export interface ObsidianEmbeddingContext {
    /** Document identifier */
    documentId: string;
    /** Section or heading being embedded */
    section: string;
    /** Hierarchical breadcrumbs */
    breadcrumbs: string[];
    /** Related concepts and tags */
    relatedConcepts: string[];
    /** Importance score (0-1) */
    importance: number;
}
/**
 * Comprehensive search query for Obsidian content
 */
export interface ObsidianSearchQuery {
    /** Search text */
    text: string;
    /** Search mode */
    mode: "semantic" | "lexical" | "hybrid" | "graph";
    /** Content type filters */
    contentTypes?: ("note" | "moc" | "article" | "conversation" | "template" | "book-note")[];
    /** Tag filters */
    tags?: string[];
    /** Folder/path filters */
    folders?: string[];
    /** Date range filters */
    dateRange?: {
        start?: Date;
        end?: Date;
    };
    /** Wikilink relationship filters */
    linkedFrom?: string[];
    linkedTo?: string[];
    /** Result limits */
    limit?: number;
    offset?: number;
    /** Sorting preferences */
    sortBy?: "relevance" | "date" | "title" | "importance";
    sortOrder?: "asc" | "desc";
}
/**
 * Search options with advanced filtering
 */
export interface ObsidianSearchOptions {
    /** Maximum results to return */
    limit?: number;
    /** Minimum similarity score (0-1) */
    minSimilarity?: number;
    /** Content type filters */
    contentTypes?: string[];
    /** Tag filters */
    tags?: string[];
    /** Folder filters */
    folders?: string[];
    /** File type filters (alias for contentTypes) */
    fileTypes?: string[];
    /** Has wikilinks filter */
    hasWikilinks?: boolean;
    /** Date range filters */
    dateRange?: {
        start?: Date;
        end?: Date;
    };
    /** Search mode */
    searchMode?: "semantic" | "hybrid" | "graph" | "comprehensive";
    /** Include related documents */
    includeRelated?: boolean;
    /** Maximum related documents */
    maxRelated?: number;
    /** Enable graph augmentation */
    graphAugmentation?: boolean;
    /** Maximum graph hops */
    maxGraphHops?: number;
}
/**
 * Configuration for vault ingestion
 */
export interface ObsidianIngestionConfig {
    /** Vault root directory */
    vaultPath: string;
    /** File patterns to include */
    includePatterns: string[];
    /** File patterns to exclude */
    excludePatterns: string[];
    /** Chunking configuration */
    chunking: {
        /** Maximum chunk size in characters */
        maxChunkSize: number;
        /** Overlap between chunks */
        chunkOverlap: number;
        /** Respect heading boundaries */
        preserveStructure: boolean;
        /** Include frontmatter context */
        includeContext: boolean;
        /** Clean markdown formatting */
        cleanContent: boolean;
    };
    /** Processing options */
    processing: {
        /** Extract wikilinks */
        extractLinks: boolean;
        /** Extract tags */
        extractTags: boolean;
        /** Calculate statistics */
        calculateStats: boolean;
        /** Generate checksums */
        generateChecksums: boolean;
    };
    /** Performance settings */
    performance: {
        /** Batch size for processing */
        batchSize: number;
        /** Rate limiting delay */
        rateLimitMs: number;
        /** Skip existing files */
        skipExisting: boolean;
        /** Maximum concurrent operations */
        maxConcurrency: number;
    };
}
/**
 * Validation result for Obsidian documents
 */
export interface ObsidianValidationResult {
    /** Document identifier */
    documentId: string;
    /** Overall validation status */
    valid: boolean;
    /** Validation errors */
    errors: ValidationError[];
    /** Validation warnings */
    warnings: ValidationWarning[];
    /** Processing statistics */
    stats: {
        processingTime: number;
        chunksGenerated: number;
        embeddingsGenerated: number;
    };
}
/**
 * Validation error details
 */
export interface ValidationError {
    /** Error code */
    code: string;
    /** Human-readable message */
    message: string;
    /** Location in document */
    location?: {
        line?: number;
        column?: number;
        offset?: number;
    };
    /** Severity level */
    severity: "error" | "warning" | "info";
}
/**
 * Validation warning details
 */
export interface ValidationWarning {
    /** Warning code */
    code: string;
    /** Human-readable message */
    message: string;
    /** Location in document */
    location?: {
        line?: number;
        column?: number;
        offset?: number;
    };
}
/**
 * Analytics for an Obsidian vault
 */
export interface ObsidianVaultAnalytics {
    /** Basic vault statistics */
    overview: {
        totalDocuments: number;
        totalWords: number;
        totalLinks: number;
        totalTags: number;
        vaultAge: number;
    };
    /** Content type distribution */
    contentDistribution: {
        byType: Record<string, number>;
        byFolder: Record<string, number>;
        byTag: Record<string, number>;
    };
    /** Network analysis */
    networkAnalysis: {
        /** Most connected documents */
        hubDocuments: Array<{
            document: string;
            connections: number;
            centrality: number;
        }>;
        /** Knowledge clusters */
        clusters: Array<{
            name: string;
            documents: string[];
            theme: string;
            density: number;
        }>;
        /** Orphaned documents */
        orphans: string[];
        /** Link health metrics */
        linkHealth: {
            brokenLinks: number;
            missingReferences: number;
            circularReferences: number;
        };
    };
    /** Temporal analysis */
    temporalAnalysis: {
        creationTimeline: Array<{
            period: string;
            count: number;
        }>;
        modificationTimeline: Array<{
            period: string;
            count: number;
        }>;
        activityPatterns: {
            mostActiveDays: string[];
            mostActiveHours: number[];
        };
    };
    /** Quality metrics */
    qualityMetrics: {
        averageDocumentLength: number;
        averageLinksPerDocument: number;
        tagConsistency: number;
        formattingConsistency: number;
    };
}
/**
 * Search API request contract
 */
export interface SearchAPIRequest {
    query: string;
    options?: Partial<ObsidianSearchOptions>;
    pagination?: {
        limit: number;
        offset: number;
    };
}
/**
 * Search API response contract
 */
export interface SearchAPIResponse {
    query: string;
    results: ObsidianSearchResult[];
    totalFound: number;
    pagination?: {
        limit: number;
        offset: number;
        hasMore: boolean;
    };
    facets?: {
        contentTypes: Array<{
            type: string;
            count: number;
        }>;
        tags: Array<{
            tag: string;
            count: number;
        }>;
        folders: Array<{
            folder: string;
            count: number;
        }>;
        temporal: Array<{
            period: string;
            count: number;
        }>;
    };
    performance: {
        totalTime: number;
        searchTime: number;
        processingTime: number;
    };
    graphInsights?: {
        queryConcepts: string[];
        relatedConcepts: string[];
        knowledgeClusters: Array<{
            name: string;
            documents: string[];
            centrality: number;
        }>;
    };
}
/**
 * Ingestion API request contract
 */
export interface IngestionAPIRequest {
    vaultPath: string;
    config?: Partial<ObsidianIngestionConfig>;
    options?: {
        force?: boolean;
        incremental?: boolean;
        validateOnly?: boolean;
    };
}
/**
 * Ingestion API response contract
 */
export interface IngestionAPIResponse {
    success: boolean;
    processed: number;
    skipped: number;
    errors: number;
    details: {
        documentsProcessed: string[];
        documentsSkipped: string[];
        errors: Array<{
            document: string;
            error: string;
        }>;
    };
    performance: {
        totalTime: number;
        documentsPerSecond: number;
        chunksPerSecond: number;
    };
    validationResults?: ObsidianValidationResult[];
}
/**
 * Analytics API response contract
 */
export interface AnalyticsAPIResponse {
    analytics: ObsidianVaultAnalytics;
    generated: Date;
    computationTime: number;
}
/**
 * Health check API response contract
 */
export interface HealthAPIResponse {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: Date;
    version: string;
    services: {
        database: "up" | "down";
        embeddings: "up" | "down";
        indexing: "up" | "down";
    };
    metrics: {
        totalDocuments: number;
        totalChunks: number;
        lastIngestion: Date | null;
        uptime: number;
    };
}
/**
 * Supported Obsidian content types
 */
export declare const OBSIDIAN_CONTENT_TYPES: readonly ["note", "moc", "article", "conversation", "template", "book-note", "canvas", "dataview"];
export type ObsidianContentType = (typeof OBSIDIAN_CONTENT_TYPES)[number];
/**
 * Obsidian frontmatter field definitions
 */
export interface ObsidianFrontmatterSchema {
    title?: string;
    created?: string | Date;
    updated?: string | Date;
    tags?: string[];
    aliases?: string[];
    category?: string;
    status?: "draft" | "published" | "archived";
    priority?: "low" | "medium" | "high";
    project?: string;
    related?: string[];
    [key: string]: any;
}
/**
 * Chunk generation strategies
 */
export type ChunkStrategy = "fixed-size" | "structure-aware" | "semantic";
/**
 * Link types in Obsidian
 */
export type ObsidianLinkType = "document" | "heading" | "block" | "embed";
/**
 * Document processing status
 */
export type ProcessingStatus = "pending" | "processing" | "completed" | "failed";
/**
 * Validation rule definitions
 */
export interface ValidationRule {
    name: string;
    description: string;
    check: (document: ObsidianDocument) => ValidationError | null;
    severity: "error" | "warning" | "info";
}
import { SearchResult } from "../types/index.js";
export interface ObsidianSearchResult extends SearchResult {
    obsidianMeta?: {
        fileName: string;
        filePath: string;
        tags: string[];
        wikilinks: string[];
        frontmatter: Record<string, any>;
        relatedFiles?: string[];
        backlinks?: string[];
    };
    highlights?: string[];
    relatedChunks?: SearchResult[];
    graphContext?: {
        connectedConcepts: string[];
        pathsToQuery: number;
        centralityScore: number;
    };
}
