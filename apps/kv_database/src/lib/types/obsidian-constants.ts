/**
 * Obsidian Constants
 * Constants and configuration values for Obsidian processing
 */

/**
 * Supported Obsidian content types
 */
export const OBSIDIAN_CONTENT_TYPES = Object.freeze([
  "note",
  "moc",
  "article",
  "conversation",
  "template",
  "book-note",
  "canvas",
  "dataview",
]);

export type ObsidianContentType = (typeof OBSIDIAN_CONTENT_TYPES)[number];

/**
 * Default processing configuration
 */
export const DEFAULT_PROCESSING_CONFIG = {
  chunkSize: 800,
  chunkOverlap: 100,
  batchSize: 5,
  rateLimitMs: 200,
  similarityThreshold: 0.8,
  maxSearchResults: 30,
  maxRelatedDocuments: 10,
} as const;

/**
 * Content type mappings for file extensions
 */
export const CONTENT_TYPE_MAPPINGS = {
  // Text-based
  ".md": "markdown",
  ".txt": "plain_text",
  ".rtf": "rich_text",

  // Documents
  ".pdf": "pdf",
  ".docx": "office_document",
  ".doc": "office_document",
  ".xlsx": "office_spreadsheet",
  ".xls": "office_spreadsheet",
  ".pptx": "office_presentation",
  ".ppt": "office_presentation",

  // Images
  ".jpg": "raster_image",
  ".jpeg": "raster_image",
  ".png": "raster_image",
  ".gif": "raster_image",
  ".bmp": "raster_image",
  ".tiff": "raster_image",
  ".webp": "raster_image",
  ".svg": "vector_image",

  // Audio
  ".mp3": "audio",
  ".wav": "audio",
  ".flac": "audio",
  ".m4a": "audio",
  ".ogg": "audio",

  // Video
  ".mp4": "video",
  ".avi": "video",
  ".mov": "video",
  ".wmv": "video",
  ".mkv": "video",

  // Structured Data
  ".json": "json",
  ".xml": "xml",
  ".csv": "csv",
} as const;

/**
 * MIME type mappings
 */
export const MIME_TYPE_MAPPINGS = {
  // Text
  "text/plain": "plain_text",
  "text/markdown": "markdown",
  "text/rtf": "rich_text",

  // Documents
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "office_document",
  "application/msword": "office_document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    "office_spreadsheet",
  "application/vnd.ms-excel": "office_spreadsheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "office_presentation",
  "application/vnd.ms-powerpoint": "office_presentation",

  // Images
  "image/jpeg": "raster_image",
  "image/png": "raster_image",
  "image/gif": "raster_image",
  "image/bmp": "raster_image",
  "image/tiff": "raster_image",
  "image/webp": "raster_image",
  "image/svg+xml": "vector_image",

  // Audio
  "audio/mpeg": "audio",
  "audio/wav": "audio",
  "audio/flac": "audio",
  "audio/mp4": "audio",
  "audio/ogg": "audio",

  // Video
  "video/mp4": "video",
  "video/avi": "video",
  "video/mov": "video",
  "video/wmv": "video",
  "video/mkv": "video",

  // Structured Data
  "application/json": "json",
  "application/xml": "xml",
  "text/xml": "xml",
  "text/csv": "csv",
} as const;

/**
 * Default folder patterns for content type detection
 */
export const FOLDER_PATTERNS = {
  moc: ["mocs", "maps", "maps-of-content"],
  article: ["articles", "posts", "blog"],
  conversation: ["chats", "conversations", "aichats"],
  book: ["books", "reading", "library"],
  template: ["templates", "template"],
} as const;

/**
 * Performance thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  // Processing time limits (ms)
  maxChunkProcessingTime: 1000,
  maxDocumentProcessingTime: 10000,
  maxSearchLatency: 500,
  maxEmbeddingTime: 1000,

  // Size limits
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxChunkSize: 800,
  minChunkSize: 50,

  // Quality thresholds
  minOcrConfidence: 30,
  minSimilarityScore: 0.3,
  minEmbeddingConfidence: 0.1,

  // Rate limiting
  defaultBatchSize: 5,
  defaultRateLimitMs: 200,
  maxConcurrency: 10,
} as const;

/**
 * Search configuration defaults
 */
export const SEARCH_DEFAULTS = {
  limit: 30,
  minSimilarity: 0.0,
  maxRelated: 3,
  includeRelated: true,
  searchMode: "comprehensive",
  sortBy: "relevance",
  sortOrder: "desc",
} as const;

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  maxFrontmatterSize: 10 * 1024, // 10KB
  maxTagLength: 100,
  maxWikilinkLength: 200,
  maxTitleLength: 200,
  minContentLength: 10,
  maxContentLength: 10 * 1024 * 1024, // 10MB
} as const;

/**
 * Error codes
 */
export const ERROR_CODES = {
  // Processing errors
  PROCESSING_FAILED: "PROCESSING_FAILED",
  PARSING_FAILED: "PARSING_FAILED",
  VALIDATION_FAILED: "VALIDATION_FAILED",

  // File errors
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  FILE_CORRUPTED: "FILE_CORRUPTED",

  // Content errors
  UNSUPPORTED_FORMAT: "UNSUPPORTED_FORMAT",
  EMPTY_CONTENT: "EMPTY_CONTENT",
  INVALID_FRONTMATTER: "INVALID_FRONTMATTER",

  // Database errors
  DATABASE_ERROR: "DATABASE_ERROR",
  CONNECTION_ERROR: "CONNECTION_ERROR",
  DUPLICATE_KEY: "DUPLICATE_KEY",

  // Embedding errors
  EMBEDDING_FAILED: "EMBEDDING_FAILED",
  MODEL_NOT_FOUND: "MODEL_NOT_FOUND",
  DIMENSION_MISMATCH: "DIMENSION_MISMATCH",
} as const;

/**
 * Success codes
 */
export const SUCCESS_CODES = {
  PROCESSED: "PROCESSED",
  SKIPPED: "SKIPPED",
  UPDATED: "UPDATED",
  VALIDATED: "VALIDATED",
} as const;

/**
 * Event types for logging and monitoring
 */
export const EVENT_TYPES = {
  // Processing events
  DOCUMENT_STARTED: "document.started",
  DOCUMENT_COMPLETED: "document.completed",
  DOCUMENT_FAILED: "document.failed",

  // Chunking events
  CHUNK_CREATED: "chunk.created",
  CHUNK_EMBEDDED: "chunk.embedded",

  // Search events
  SEARCH_STARTED: "search.started",
  SEARCH_COMPLETED: "search.completed",

  // Performance events
  SLOW_PROCESSING: "performance.slow",
  HIGH_MEMORY_USAGE: "performance.memory",
  RATE_LIMIT_HIT: "performance.rate_limit",
} as const;

/**
 * Quality score thresholds
 */
export const QUALITY_THRESHOLDS = {
  excellent: 0.9,
  good: 0.7,
  acceptable: 0.5,
  poor: 0.3,
  unusable: 0.1,
} as const;

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  maxSize: 10000,
  ttl: 3600000, // 1 hour in milliseconds
  cleanupInterval: 300000, // 5 minutes
} as const;
