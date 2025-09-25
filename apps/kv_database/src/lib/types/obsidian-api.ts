/**
 * Obsidian API Specifications
 * API contracts and interfaces for Obsidian-related operations
 */

// Import the search result type for API responses
import { SearchResult } from "../../types/index";

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
  multiModalMeta?: {
    fileId: string;
    contentType: string;
    contentTypeLabel: string;
    mimeType: string;
    checksum: string;
    quality?: any;
    processing?: any;
    // Content-specific metadata
    duration?: number;
    sampleRate?: number;
    channels?: number;
    confidence?: number;
    language?: string;
    pageCount?: number;
    hasText?: boolean;
    wordCount?: number;
  };
  highlights?: string[];
  relatedChunks?: SearchResult[];
  graphContext?: {
    connectedConcepts: string[];
    pathsToQuery: number;
    centralityScore: number;
  };
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
  contentTypes?: (
    | "note"
    | "moc"
    | "article"
    | "conversation"
    | "template"
    | "book-note"
  )[];

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

  // Multi-modal specific filters
  /** Multi-modal content types to include */
  multiModalTypes?: string[];

  /** Minimum OCR/audio quality score (0-1) */
  minQuality?: number;

  /** Language filters for multi-modal content */
  languages?: string[];

  /** Include only content with text extraction */
  hasText?: boolean;

  /** File size range filters (in bytes) */
  fileSizeRange?: {
    min?: number;
    max?: number;
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
    vaultAge: number; // days
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

// =============================================================================
// API CONTRACTS
// =============================================================================

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
    contentTypes: Array<{ type: string; count: number }>;
    tags: Array<{ tag: string; count: number }>;
    folders: Array<{ folder: string; count: number }>;
    temporal: Array<{ period: string; count: number }>;
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
    force?: boolean; // Reprocess all files
    incremental?: boolean; // Only process changed files
    validateOnly?: boolean; // Just validate without storing
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
import { ObsidianContentType } from "./obsidian-constants";

export { ObsidianContentType };

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
  [key: string]: any; // Allow custom fields
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
export type ProcessingStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

/**
 * Validation rule definitions
 */
export interface ValidationRule {
  name: string;
  description: string;
  check: (
    document: import("./obsidian-core.ts").ObsidianDocument
  ) => ValidationError | null;
  severity: "error" | "warning" | "info";
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
