// =============================================================================
// CORE DATA STRUCTURES
// =============================================================================

import type { WebSocket } from "ws";

// Re-export all Obsidian-specific types from models
export type {
  ObsidianDocument,
  Wikilink,
  Backlink,
  ObsidianEmbeddingContext,
  ObsidianSearchQuery,
  ObsidianSearchOptions,
  ObsidianVaultAnalytics,
  ObsidianValidationResult,
  ObsidianIngestionConfig,
  SearchAPIRequest,
  SearchAPIResponse,
  IngestionAPIRequest,
  IngestionAPIResponse,
  AnalyticsAPIResponse,
  HealthAPIResponse,
  ObsidianContentType,
  ObsidianFrontmatterSchema,
  ValidationError,
  ValidationWarning,
} from "../lib/obsidian-models";

// =============================================================================
// DOMAIN TYPES - BRANDED PRIMITIVES & ENUMS
// =============================================================================

// Branded primitives for stronger semantics
export type ISODateString = string & { readonly __brand: "iso-date" };
export type URLString = string & { readonly __brand: "url" };
export type ModelName = string & { readonly __brand: "model" };

// Chat roles
export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

// Suggested actions
export const SuggestedActionTypes = [
  "refine_search",
  "new_search",
  "filter",
  "explore",
  "reason",
  "find_similar",
] as const;

export type SuggestedActionType = (typeof SuggestedActionTypes)[number];

// Content classification used in search/meta
export enum ContentType {
  CODE = "code",
  TEXT = "text",
  WEB = "web",
  CHAT_SESSION = "chat_session",
  UNKNOWN = "unknown",
  PDF = "pdf",
  RASTER_IMAGE = "raster_image",
  VECTOR_IMAGE = "vector_image",
  AUDIO = "audio",
  AUDIO_FILE = "audio_file",
  VIDEO = "video",
}

// Filters – NOTE: value can be scalar or array
export type FilterValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>;
export interface Filter {
  type: string;
  value: FilterValue;
}

// Search result coming from the KB
export interface SearchResult {
  id: string;
  title: string;
  summary: string;
  text: string;
  meta: {
    contentType: ContentType;
    section: string;
    breadcrumbs: string[];
    uri: URLString;
  };
  relevanceScore: number; // keep as score 0..1
}

export interface ChatRequest {
  message: string;
  model?: ModelName;
  context?: ChatMessage[];
  searchResults?: SearchResult[];
  originalQuery?: string;
  searchMetadata?: {
    totalResults: number;
    searchTime: number;
    filters?: Filter[];
  };
}

export interface ChatResponse {
  response: string;
  context: ChatMessage[];
  suggestedActions?: Array<{
    type: SuggestedActionType;
    label: string;
    query?: string;
    filters?: Filter[];
  }>;
  timestamp: ISODateString;
  model?: ModelName;
}

export interface ModelsResponse {
  models: Array<{
    name: string;
    size: number;
    modified_at: ISODateString;
    details?: {
      format?: string;
      family?: string;
      parameter_size?: string;
      quantization_level?: string;
    };
  }>;
  error?: string;
}

// Chat sessions (server view)
export interface ServerChatSession {
  id: string;
  title: string;
  messages: Array<
    ChatMessage & { timestamp: ISODateString; model?: ModelName }
  >;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  model?: ModelName;
  messageCount: number;
  topics?: string[];
  summary?: string;
}

export interface ChatHistoryResponse {
  sessions: ServerChatSession[];
  error?: string;
}

// Web search
export type TimeRange = "day" | "week" | "month" | "year" | "all";
export interface WebSearchRequest {
  query: string;
  maxResults?: number;
  includeSnippets?: boolean;
  minRelevanceScore?: number;
  sources?: string[];
  timeRange?: TimeRange;
  context?: string[];
}

export interface WebSearchResponse {
  query: string;
  results: Array<{
    title: string;
    url: URLString;
    snippet: string;
    publishedDate?: ISODateString;
    source: string;
    relevanceScore: number;
  }>;
  totalFound: number;
  searchTime: number;
  error?: string;
}

// Generic discriminated result for DB/service ops
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

// =============================================================================
// WEBSOCKET TYPES - DISCRIMINATED UNIONS
// =============================================================================

export type WsEvent =
  | { type: "fileChange"; data: { path: string }; timestamp: ISODateString }
  | { type: "batchStart"; data: { batchId: string }; timestamp: ISODateString }
  | {
      type: "batchComplete";
      data: { batchId: string };
      timestamp: ISODateString;
    }
  | {
      type: "fileProcessed";
      data: { path: string; chunks: number };
      timestamp: ISODateString;
    }
  | { type: "fileDeleted"; data: { path: string }; timestamp: ISODateString }
  | { type: "error"; data: { message: string }; timestamp: ISODateString }
  | {
      type: "systemStatus";
      data: { message: string; clientId?: string };
      timestamp: ISODateString;
    }
  | {
      type: "conflictDetected";
      data: { path: string; reason: string };
      timestamp: ISODateString;
    }
  | {
      type: "rollbackComplete";
      data: { filePath: string; versionId: string; changeSummary?: string };
      timestamp: ISODateString;
    };

export type ClientMessage =
  | { type: "subscribe"; subscriptions?: string[] }
  | { type: "unsubscribe"; subscriptions?: string[] }
  | { type: "ping" };

export interface WebSocketClient {
  ws: WebSocket;
  subscriptions: string[];
  lastActivity: Date;
}

// Ollama response types
export type OllamaMessage = { role: ChatRole; content: string };
export type OllamaChatResponse = { message: OllamaMessage };

// =============================================================================
// MULTI-MODAL CONTENT TYPES
// =============================================================================

// Content type definitions (renamed to avoid conflict)
export enum MultiModalContentType {
  // Text-based
  MARKDOWN = "markdown",
  PLAIN_TEXT = "plain_text",
  RICH_TEXT = "rich_text",

  // Documents
  PDF = "pdf",
  OFFICE_DOC = "office_document",
  OFFICE_SHEET = "office_spreadsheet",
  OFFICE_PRESENTATION = "office_presentation",

  // Images
  RASTER_IMAGE = "raster_image",
  VECTOR_IMAGE = "vector_image",
  DOCUMENT_IMAGE = "document_image",

  // Audio
  AUDIO = "audio",
  AUDIO_FILE = "audio_file",
  SPEECH = "speech",

  // Video
  VIDEO = "video",

  // Structured Data
  JSON = "json",
  XML = "xml",
  CSV = "csv",

  // Binary/Other
  BINARY = "binary",
  UNKNOWN = "unknown",
}

// Universal metadata schema
export interface UniversalMetadata {
  file: FileMetadata | EnhancedFileMetadata;
  content: ContentMetadata;
  processing: ProcessingMetadata;
  quality: QualityMetadata;
  relationships: RelationshipMetadata;
  // Enhanced tracking (optional for backward compatibility)
  changeTracking?: FileChangeMetadata;
  version?: DocumentVersion;
  processingStatus?: ProcessingStatus;
  batchMetadata?: BatchProcessingMetadata;
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

  // Enhanced image classification metadata
  imageClassification?: {
    ocrAvailable: boolean;
    ocrConfidence: number;
    sceneDescriptionAvailable: boolean;
    sceneConfidence: number;
    objectsDetected: number;
    visualFeaturesAnalyzed: boolean;
    processingTime: number;
    modelUsed: string;
    keyFrames?: Array<{
      timestamp: number;
      description: string;
      confidence: number;
    }>;
  };

  // Scene description metadata
  sceneDescription?: {
    description: string;
    confidence: number;
    objects: string[];
    sceneType: string;
    visualFeatures: {
      colors: string[];
      composition: string;
      lighting: string;
      style: string;
    };
    relationships: string[];
    generatedAt: Date;
  };

  // Video processing metadata
  videoMetadata?: {
    duration: number;
    frameRate: number;
    resolution: string;
    keyframesExtracted: number;
    audioAvailable: boolean;
    subtitlesAvailable: boolean;
  };
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface ProcessingMetadata {
  processedAt: Date;
  processor: string;
  version: string;
  parameters: Record<string, unknown>;
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
  type: "completeness" | "accuracy" | "consistency" | "timeliness";
  field: string;
  severity: "low" | "medium" | "high";
  description: string;
}

export interface RelationshipMetadata {
  parentFile?: string;
  relatedFiles: string[];
  tags: string[];
  categories: string[];
  topics: string[];
}

// File change tracking metadata
export interface FileChangeMetadata {
  changeType: "created" | "modified" | "deleted" | "moved" | "renamed";
  previousPath?: string;
  changeTimestamp: Date;
  changeReason?: string; // git commit, manual edit, etc.
  version?: string;
  diffSummary?: string; // brief summary of changes
  fileHash: string; // content hash for change detection
  embeddingHash?: string; // embedding hash for change detection
}

// Document version history
export interface DocumentVersion {
  versionId: string;
  contentHash: string;
  embeddingHash: string;
  createdAt: Date;
  parentVersion?: string;
  changeSummary: string;
  changeType: FileChangeMetadata["changeType"];
  metadata: Record<string, unknown>;
  processingMetadata: ProcessingMetadata;
  chunks: number; // number of chunks in this version
}

// Processing status tracking
export interface ProcessingStatus {
  fileId: string;
  currentStep: string;
  progress: number; // 0-100
  estimatedTimeRemaining: number; // milliseconds
  lastUpdated: Date;
  errors: string[];
  warnings: string[];
  startedAt: Date;
  completedAt?: Date;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
}

// Enhanced file metadata with change tracking
export interface EnhancedFileMetadata extends FileMetadata {
  changeHistory: FileChangeMetadata[];
  versions: DocumentVersion[];
  processingStatus?: ProcessingStatus;
  lastProcessed?: Date;
  processingAttempts: number;
  isStale: boolean; // if file needs reprocessing
}

// Batch processing metadata
export interface BatchProcessingMetadata {
  batchId: string;
  batchType: "initial" | "incremental" | "reindex" | "manual";
  files: string[];
  startTime: Date;
  endTime?: Date;
  processedFiles: number;
  failedFiles: number;
  totalChunks: number;
  errors: string[];
  status: "running" | "completed" | "failed" | "partial";
}

// Content type detection result
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

// Enhanced entity extraction types
export interface ExtractedEntity {
  text: string;
  type: "person" | "organization" | "location" | "concept" | "term" | "other";
  confidence: number;
  position: { start: number; end: number };
}

export interface EntityRelationship {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
}

export interface EntityCluster {
  id: string;
  name: string;
  entities: ExtractedEntity[];
  centrality: number;
  relationships: EntityRelationship[];
}

// Ingestion types
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

// Import and export ObsidianSearchResult from models
import type { ObsidianSearchResult as ObsidianSearchResultType } from "../lib/obsidian-models";
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
  // Enhanced Obsidian-specific metadata
  obsidianFile?: {
    fileName: string;
    filePath: string;
    frontmatter: Record<string, unknown>;
    wikilinks: string[];
    tags: string[];
    checksum: string;
    stats: {
      wordCount: number;
      characterCount: number;
      lineCount: number;
    };
  };
  // Multi-modal file metadata
  multiModalFile?: {
    fileId: string;
    contentType: ContentType;
    mimeType: string;
    checksum: string;
    quality: QualityMetadata;
    processing: ProcessingMetadata;
  };
}

export interface LegacySearchResult {
  id: string;
  text: string;
  meta: DocumentMetadata;
  cosineSimilarity: number;
  rank: number;
  // Additional properties for compatibility
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
}

export interface EmbeddingConfig {
  model: string;
  dimension: number;
}

// Legacy type for backward compatibility
export interface ObsidianFile {
  filePath: string;
  fileName: string;
  content: string;
  frontmatter: Record<string, unknown>;
  wikilinks: string[];
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ObsidianSearchResponse {
  query: string;
  results: ObsidianSearchResult[];
  totalFound: number;
  latencyMs: number;
  facets?: {
    contentTypes?: Array<{ type: string; count: number }>;
    tags?: Array<{ tag: string; count: number }>;
    folders?: Array<{ folder: string; count: number }>;
    temporal?: Array<{ period: string; count: number }>;
    fileTypes?: Array<{ type: string; count: number }>;
  };
  graphInsights?: {
    queryConcepts: string[];
    relatedConcepts: string[];
    knowledgeClusters: Array<{
      name: string;
      files: string[];
      centrality: number;
    }>;
    webResults?: number;
    contextDocuments?: number;
    chatSessions?: number;
  };
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

export interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  services: {
    database: boolean;
    embeddings: boolean;
    search: boolean;
    ingestion: boolean;
  };
  database?: {
    totalChunks: number;
    lastUpdate: string | null;
  };
  embeddings?: {
    model: string;
    dimension: number;
    available: boolean;
  };
}

export interface SearchRequest {
  query: string;
  limit?: number;
  searchMode?: "semantic" | "keyword" | "comprehensive";
  includeRelated?: boolean;
  maxRelated?: number;
  fileTypes?: string[];
  tags?: string[];
  folders?: string[];
  minSimilarity?: number;
  dateRange?: {
    start?: string;
    end?: string;
  };
  includeWebResults?: boolean;
  includeChatSessions?: boolean;
}

export interface SearchResponse {
  query: string;
  results: ObsidianSearchResult[];
  totalFound: number;
  facets?: {
    contentTypes?: Array<{ type: string; count: number }>;
    tags?: Array<{ tag: string; count: number }>;
    folders?: Array<{ folder: string; count: number }>;
    temporal?: Array<{ period: string; count: number }>;
    fileTypes?: Array<{ type: string; count: number }>;
  };
  graphInsights?: {
    queryConcepts: string[];
    relatedConcepts: string[];
    knowledgeClusters: Array<{
      name: string;
      files: string[];
      centrality: number;
    }>;
    webResults?: number;
    contextDocuments?: number;
    chatSessions?: number;
  };
  error?: string;
}

export interface IngestRequest {
  path?: string;
  forceRefresh?: boolean;
  fileTypes?: string[];
  tags?: string[];
  folders?: string[];
}

export interface IngestResponse {
  success: boolean;
  message: string;
  processedFiles: number;
  totalFiles: number;
  totalChunks: number;
  errors: string[];
  performance?: {
    totalTime: number;
    filesPerSecond: number;
    chunksPerSecond: number;
  };
}

export interface GraphResponse {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    count: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: string;
    weight: number;
  }>;
  clusters: Array<{
    id: string;
    name: string;
    nodes: string[];
    centrality: number;
  }>;
  metadata?: {
    totalNodes: number;
    totalEdges: number;
    generatedAt: string;
  };
  error?: string;
}

export interface StatsResponse {
  totalChunks: number;
  byContentType: Record<string, number>;
  byFolder: Record<string, number>;
  lastUpdate: string | null;
  performance?: {
    totalQueries: number;
    slowQueries: number;
    p95Latency: number;
    averageLatency: number;
    minLatency: number;
    maxLatency: number;
  };
  error?: string;
}

// Chat session types for database storage
export interface LegacyChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  model?: string;
  metadata?: {
    searchResults?;
    context?;
    suggestedActions?;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: LegacyChatMessage[];
  model: string;
  createdAt: string;
  updatedAt: string;
  userId?: string; // For multi-user support
  tags?: string[];
  topics?: string[];
  webResults?;
  contextDocuments?;
  chatSessions?: ChatSession[];
  queryConcepts?: string[];
  relatedConcepts?: string[];
  knowledgeClusters?: Array<{
    name: string;
    files: string[];
    centrality: number;
  }>;
  summary?: string; // AI-generated summary of the conversation
  messageCount: number;
  totalTokens?: number;
}

export interface ChatSessionSearchResult {
  id: string;
  title: string;
  summary: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  topics?: string[];
  relevanceScore?: number;
  preview?: string; // Preview of the conversation
}
