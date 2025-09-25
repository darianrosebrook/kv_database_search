/**
 * Obsidian Data Contracts and API Specifications
 * Defines the data structures and contracts for Obsidian vault processing
 *
 * This file serves as the main export point for all Obsidian-related types,
 * utilities, and interfaces. It re-exports from focused modules for better
 * organization and maintainability.
 */

// =============================================================================
// CORE DATA STRUCTURES
// =============================================================================

export interface ObsidianDocument {
  id: string;
  path: string;
  relativePath: string;
  filePath?: string;
  fileName?: string;
  name?: string;
  extension?: string;
  content: string;
  frontmatter: Record<string, any>;
  sections?: any[];
  relationships: {
    wikilinks: Array<{ target: string; displayText?: string }>;
    tags: string[];
    backlinks: string[];
  };
  metadata: {
    checksum: string;
    created: Date;
    modified: Date;
    size: number;
    lastIndexed?: Date;
    processingErrors?: string[];
  };
  stats: {
    wordCount: number;
    characterCount: number;
    lineCount: number;
    headingCount?: number;
    linkCount?: number;
    tagCount?: number;
    size?: number;
    updatedAt?: Date;
    createdAt?: Date;
  };
}

export interface Wikilink {
  target: string;
  displayText?: string;
  position: number;
}

export interface Backlink {
  source: string;
  target: string;
  context: string;
}

export interface ObsidianEmbeddingContext {
  documentId: string;
  chunkId: string;
  position: number;
  surroundingContent: string;
}

// =============================================================================
// API SPECIFICATIONS
// =============================================================================

export interface ObsidianSearchQuery {
  query: string;
  context?: string;
  filters?: {
    contentTypes?: string[];
    tags?: string[];
    folders?: string[];
    dateRange?: {
      start?: Date;
      end?: Date;
    };
  };
  options?: {
    limit?: number;
    threshold?: number;
    includeContent?: boolean;
  };
}

export interface ObsidianSearchOptions {
  limit?: number;
  threshold?: number;
  includeContent?: boolean;
  rerank?: boolean;
  searchMode?: string;
  includeRelated?: boolean;
  maxRelated?: number;
  minSimilarity?: number;
  multiModalTypes?: string[];
  minQuality?: number;
  languages?: string[];
  hasText?: boolean;
  fileSizeRange?: {
    min?: number;
    max?: number;
  };
  tags?: string[];
  fileTypes?: string[];
  contentTypes?: string[];
  folders?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

export interface ObsidianSearchResult {
  documentId: string;
  score: number;
  title: string;
  path: string;
  content?: string;
  matches: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  obsidianMeta?: {
    tags?: string[];
    wikilinks?: string[];
    frontmatter?: Record<string, any>;
  };
  multiModalMeta?: {
    contentType?: string;
    processing?: {
      confidence?: number;
      quality?: number;
    };
  };
  meta?: Record<string, any>;
  cosineSimilarity?: number;
  highlights?: string[];
  text?: string;
  relatedChunks?: Array<{
    id: string;
    content: string;
    score: number;
  }>;
  entities?: Array<{
    text: string;
    type: "person" | "organization" | "location" | "concept" | "term" | "other";
    confidence: number;
    position: { start: number; end: number };
  }>;
  relationships?: Array<{
    subject: string;
    predicate: string;
    object: string;
    confidence: number;
  }>;
}

export interface ObsidianVaultAnalytics {
  totalDocuments: number;
  totalChunks: number;
  byContentType: Record<string, number>;
  byFolder: Record<string, number>;
  tagDistribution: Record<string, number>;
  lastUpdate: Date;
  success?: boolean;
  message?: string;
  performance?: {
    duration: number;
    throughput: number;
  };
}

export interface ObsidianValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ObsidianIngestionConfig {
  vaultPath: string;
  chunkSize: number;
  chunkOverlap: number;
  includeFrontmatter: boolean;
  processImages: boolean;
  processAudio: boolean;
  maxConcurrency: number;
}

// =============================================================================
// API REQUEST/RESPONSE INTERFACES
// =============================================================================

export interface SearchAPIRequest {
  query: string;
  context?: string;
  filters?: Record<string, any>;
  options?: Record<string, any>;
}

export interface SearchAPIResponse {
  results: ObsidianSearchResult[];
  total: number;
  facets?: Record<string, any>;
}

export interface IngestionAPIRequest {
  vaultPath: string;
  config?: Partial<ObsidianIngestionConfig>;
}

export interface IngestionAPIResponse {
  totalFiles: number;
  processedFiles: number;
  totalChunks: number;
  processedChunks: number;
  skippedChunks: number;
  errors: string[];
  success?: boolean;
  message?: string;
  performance?: {
    duration: number;
    throughput: number;
  };
}

export interface AnalyticsAPIResponse {
  totalChunks: number;
  byContentType: Record<string, number>;
  byFolder: Record<string, number>;
  tagDistribution: Record<string, number>;
  lastUpdate: Date;
}

export interface HealthAPIResponse {
  status: "healthy" | "degraded" | "unhealthy";
  database: boolean;
  embeddings: boolean;
  services: Record<string, boolean>;
}

// =============================================================================
// ADDITIONAL TYPE DEFINITIONS
// =============================================================================

export type ObsidianContentType =
  | "markdown"
  | "text"
  | "image"
  | "pdf"
  | "office"
  | "audio"
  | "video"
  | "unknown";

export interface ObsidianFrontmatterSchema {
  title?: string;
  tags?: string[];
  created?: string | Date;
  modified?: string | Date;
  [key: string]: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// =============================================================================
// UTILITIES
// =============================================================================

// Export utility class
export { ObsidianUtils } from "./types/obsidian-utils";
