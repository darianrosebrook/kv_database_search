// Centralized type definitions for the RAG Web Search Tool
// This file consolidates all shared types to eliminate duplication

// ============================================================================
// CORE SEARCH TYPES
// ============================================================================

export interface BaseSearchResult {
  id: string;
  title: string;
  summary: string;
  highlights: string[];
  confidenceScore: number;
  rationale: string;
  tags: string[];
  lastUpdated: string;
}

export interface SearchResultSource {
  type:
    | "documentation"
    | "component"
    | "guideline"
    | "note"
    | "article"
    | "book"
    | "conversation"
    | "moc";
  path: string;
  url: string;
}

export interface SearchResult extends BaseSearchResult {
  source: SearchResultSource;
  // Additional data from the actual API
  text?: string;
  meta?: {
    contentType: string;
    section: string;
    breadcrumbs: string[];
    uri?: string;
  };
}

// ============================================================================
// GRAPH RAG TYPES (Re-exported from graph-rag-api)
// ============================================================================

export type {
  GraphRagEntity,
  GraphRagRelationship,
  GraphRagSearchResult,
  ReasoningResult,
  ReasoningPath,
  GraphRagSearchResponse,
  GraphStatistics,
  ProvenanceRecord,
} from "../lib/graph-rag-api";

// ============================================================================
// CHAT & MESSAGING TYPES
// ============================================================================

export interface BaseMessage {
  id: string;
  type: "user" | "assistant" | "error" | "system";
  content: string;
  timestamp: Date;
}

export interface EnhancedMessage extends BaseMessage {
  entities?: import("../lib/graph-rag-api").GraphRagEntity[];
  reasoning?: import("../lib/graph-rag-api").ReasoningResult;
  searchCount?: number;
  confidence?: number;
  provenance?: {
    operationId: string;
    qualityMetrics: Record<string, number>;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: BaseMessage[];
  createdAt: string;
  updatedAt: string;
  model?: string;
  messageCount: number;
}

// ============================================================================
// ACTION & INTERACTION TYPES
// ============================================================================

export type SuggestedActionType =
  | "refine_search"
  | "new_search"
  | "filter"
  | "explore"
  | "reason"
  | "find_similar";

export type QueryType =
  | "component"
  | "pattern"
  | "token"
  | "general"
  | "reasoning"
  | "exploration";

export type ReasoningType =
  | "exploratory"
  | "targeted"
  | "comparative"
  | "causal";

export interface SuggestedAction {
  type: SuggestedActionType;
  label: string;
  query?: string;
  entityIds?: string[];
  filters?: any;
  reasoning?: {
    question: string;
    type: ReasoningType;
  };
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface SearchOptions {
  contextResults?: SearchResult[];
  pastedContent?: string;
  queryType?: QueryType;
  autoSearch?: boolean;
  enableReasoning?: boolean;
  entityIds?: string[];
}

export interface ChatContext {
  role: string;
  content: string;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface AppState {
  // Search state
  query: string;
  hasSearched: boolean;
  isLoading: boolean;
  searchStartTime: number;

  // Results state
  results: SearchResult[];
  selectedResult: SearchResult | null;
  contextResults: SearchResult[];

  // Chat state
  messages: EnhancedMessage[];
  chatContext: ChatContext[];
  suggestedActions: SuggestedAction[];

  // UI state
  showTestMode: boolean;
  showChatHistory: boolean;
  selectedModel: string;
  currentSession: ChatSession | null;

  // Graph RAG state
  useGraphRag: boolean;
  graphRagResults: import("../lib/graph-rag-api").GraphRagSearchResult[];
  selectedGraphRagResult:
    | import("../lib/graph-rag-api").GraphRagSearchResult
    | null;
  reasoningResults?: import("../lib/graph-rag-api").ReasoningResult;
  allEntities: import("../lib/graph-rag-api").GraphRagEntity[];
}

// ============================================================================
// EVENT HANDLER TYPES
// ============================================================================

export interface SearchHandlers {
  onSearch: () => void;
  onSendMessage: (message: string, options?: SearchOptions) => void;
  onSelectResult: (result: SearchResult) => void;
  onViewDocument: (url: string) => void;
  onAddToContext: (result: SearchResult) => void;
  onRemoveContext: (resultId: string) => void;
  onAskFollowUp: (question: string, context: SearchResult) => void;
  onRefineSearch: (query: string) => void;
  onSuggestedAction: (action: SuggestedAction) => void;
}

export interface GraphRagHandlers extends SearchHandlers {
  onExploreEntity: (
    entity: import("../lib/graph-rag-api").GraphRagEntity
  ) => void;
  onExploreRelationship: (
    relationship: import("../lib/graph-rag-api").GraphRagRelationship
  ) => void;
  onReasonAbout: (
    entities: import("../lib/graph-rag-api").GraphRagEntity[]
  ) => void;
  onSelectGraphRagResult: (
    result: import("../lib/graph-rag-api").GraphRagSearchResult
  ) => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface EntityTypeColorMap {
  [key: string]: string;
}

export interface RelationshipTypeColorMap {
  [key: string]: string;
}

export interface TransformationOptions {
  includeMetadata?: boolean;
  includeProvenance?: boolean;
  maxSummaryLength?: number;
  maxHighlights?: number;
}

// ============================================================================
// WORKSPACE & MULTI-MODAL TYPES
// ============================================================================

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  status: {
    current: "active" | "inactive" | "archived";
    lastActivity?: string;
    dataSourcesCount: number;
  };
  statistics: {
    totalDocuments: number;
    totalEntities: number;
    totalRelationships: number;
    totalSize: number;
    entityDiversity: number;
    relationshipDensity: number;
    lastActivity: string;
  };
  dataSources: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    lastSync?: string;
    statistics: {
      totalDocuments: number;
      totalEntities: number;
      totalRelationships: number;
      dataSize: number;
    };
  }>;
  settings: {
    isPublic: boolean;
    allowAutoSync: boolean;
    syncIntervalMinutes: number;
    retentionDays: number;
  };
}

export interface DataSource {
  id: string;
  name: string;
  type: "database" | "file_system" | "api" | "web" | "document" | "stream" | "custom";
  subtype: string;
  format: string;
  protocol: string;
  capabilities: string[];
  connectionConfig: {
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    baseUrl?: string;
    path?: string;
    authentication?: {
      type: "basic" | "bearer" | "api_key" | "oauth2" | "none";
      credentials: Record<string, any>;
    };
    retryPolicy?: {
      maxRetries: number;
      backoffMs: number;
      timeoutMs: number;
    };
    rateLimit?: {
      requestsPerMinute: number;
      burstLimit: number;
    };
  };
  schema: {
    entities: Array<{
      name: string;
      type: string;
      properties: Record<string, any>;
    }>;
    relationships: Array<{
      name: string;
      sourceEntity: string;
      targetEntity: string;
      properties: Record<string, any>;
    }>;
    constraints: Array<{
      type: "unique" | "required" | "foreign_key" | "index";
      entity: string;
      property: string;
      references?: string;
    }>;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    version: string;
    tags: string[];
  };
}

export interface EntityMapping {
  id: string;
  sourceEntity: string;
  targetEntity: string;
  confidence: number;
  mappingType: "exact" | "fuzzy" | "semantic" | "manual";
  sourceWorkspace: string;
  targetWorkspace: string;
  createdAt: string;
  createdBy: string;
}

export interface MultiModalContentType {
  PDF = "pdf";
  OFFICE_DOC = "office_document";
  OFFICE_SHEET = "office_spreadsheet";
  OFFICE_PRESENTATION = "office_presentation";
  RASTER_IMAGE = "raster_image";
  VECTOR_IMAGE = "vector_image";
  DOCUMENT_IMAGE = "document_image";
  AUDIO = "audio";
  AUDIO_FILE = "audio_file";
  SPEECH = "speech";
  VIDEO = "video";
  JSON = "json";
  XML = "xml";
  CSV = "csv";
  MARKDOWN = "markdown";
  PLAIN_TEXT = "plain_text";
  RICH_TEXT = "rich_text";
  BINARY = "binary";
  UNKNOWN = "unknown";
}

export interface ProcessorOptions {
  enableOCR?: boolean;
  enableImageClassification?: boolean;
  enableAudioTranscription?: boolean;
  enableVideoProcessing?: boolean;
  enableSpeechRecognition?: boolean;
  extractMetadata?: boolean;
  chunkSize?: number;
  chunkOverlap?: number;
  maxEntities?: number;
  minConfidence?: number;
  language?: string;
  domain?: string;
  customProcessing?: Record<string, any>;
}

export interface ContentMetadata {
  type: string;
  language: string;
  encoding: string;
  size: number;
  mimeType: string;
  fileName: string;
  uploadDate: string;
  checksum: string;
  tags: string[];
  customFields: Record<string, any>;
}

export interface ProcessorResult {
  text: string;
  metadata: ContentMetadata;
  success: boolean;
  errors: string[];
  processingTime: number;
  chunks?: Array<{
    text: string;
    start: number;
    end: number;
    metadata: Record<string, any>;
  }>;
  entities?: Array<{
    text: string;
    type: string;
    confidence: number;
    position: {
      start: number;
      end: number;
    };
    metadata: Record<string, any>;
  }>;
  images?: Array<{
    url: string;
    description: string;
    metadata: Record<string, any>;
  }>;
  audio?: {
    transcription: string;
    duration: number;
    language: string;
    confidence: number;
  };
  video?: {
    transcription: string;
    duration: number;
    frames: number;
    metadata: Record<string, any>;
  };
  structured?: {
    format: string;
    schema: Record<string, any>;
    data: Record<string, any>;
  };
}

export interface MultiModalProcessingResult {
  fileId: string;
  fileName: string;
  contentType: string;
  results: ProcessorResult[];
  summary: {
    totalTextLength: number;
    totalChunks: number;
    totalEntities: number;
    totalImages: number;
    processingTime: number;
    success: boolean;
    errors: string[];
  };
  metadata: {
    uploadedAt: string;
    processedAt: string;
    version: string;
    processorVersions: Record<string, string>;
  };
}

export interface ContentTypeInfo {
  type: string;
  name: string;
  description: string;
  supportedFormats: string[];
  processor: string;
  capabilities: string[];
  icon: string;
}

export interface ProcessingStatus {
  fileId: string;
  fileName: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  currentStep?: string;
  estimatedTimeRemaining?: number;
  result?: ProcessorResult;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

// ============================================================================
// GRAPH QUERY TYPES
// ============================================================================

export interface GraphQuery {
  id: string;
  naturalLanguage: string;
  intent: {
    primary: "relationship_discovery" | "path_finding" | "pattern_matching" | "similarity_search" | "recommendation" | "analysis";
    secondary: string[];
    confidence: number;
    parameters: Record<string, any>;
    domain: string;
  };
  graphPatterns: Array<{
    nodes: Array<{
      id: string;
      type: string;
      properties: Record<string, any>;
      constraints: Record<string, any>;
    }>;
    edges: Array<{
      source: string;
      target: string;
      type: string;
      properties: Record<string, any>;
      direction: "unidirectional" | "bidirectional";
    }>;
    constraints: {
      maxDepth?: number;
      maxEntities?: number;
      requiredTypes?: string[];
      forbiddenTypes?: string[];
    };
  }>;
  traversalStrategy: {
    algorithm: "dfs" | "bfs" | "dijkstra" | "astar" | "random_walk" | "pagerank";
    maxDepth: number;
    maxNodes: number;
    maxEdges: number;
    direction: "outbound" | "inbound" | "bidirectional";
    weights: Record<string, number>;
  };
  constraints: {
    maxExecutionTime: number;
    maxMemoryUsage: number;
    maxResults: number;
    minConfidence: number;
    enableCaching: boolean;
    timeout: number;
  };
  context: {
    workspaceName?: string;
    userId?: string;
    sessionId?: string;
    previousQueries?: string[];
    userPreferences?: Record<string, any>;
    domainContext?: Record<string, any>;
  };
  metadata: {
    createdAt: string;
    complexity: "low" | "medium" | "high";
    estimatedCost: number;
    priority: "low" | "medium" | "high" | "critical";
    tags: string[];
    notes: string;
  };
}

export interface GraphQueryResult {
  query: GraphQuery;
  results: {
    nodes: Array<{
      id: string;
      text: string;
      type: string;
      confidence: number;
      metadata: Record<string, any>;
      position: {
        start: number;
        end: number;
        line: number;
        column: number;
        contextWindow: string;
        documentId: string;
        section: string;
      };
      relationships: Array<{
        id: string;
        sourceEntity: string;
        targetEntity: string;
        type: {
          category: string;
          subcategory: string;
          confidence: number;
        };
        context: string;
        strength: number;
        evidence: string[];
      }>;
      hierarchical: {
        level: number;
        parent: string | null;
        children: string[];
        siblings: string[];
        root: string;
        path: string[];
        depth: number;
      };
      context: {
        documentContext: string;
        sectionContext: string;
        sentenceContext: string;
        topicContext: string[];
        coOccurrences: string[];
        discourseRole: string;
      };
      provenance: {
        extractor: string;
        extractionMethod: string;
        confidence: number;
        validationStatus: string;
        validationSources: string[];
        lastUpdated: string;
        version: number;
      };
    }>;
    edges: Array<{
      source: string;
      target: string;
      type: string;
      confidence: number;
      context: string;
      strength: number;
      evidence: string[];
      id: string;
    }>;
    clusters: Array<{
      id: string;
      entities: Array<{
        text: string;
        type: string;
        confidence: number;
        position: {
          start: number;
          end: number;
          line: number;
          column: number;
          contextWindow: string;
          documentId: string;
          section: string;
        };
        metadata: {
          frequency: number;
          tfIdf: number;
          centrality: number;
          sentiment: {
            polarity: number;
            subjectivity: number;
            intensity: number;
            emotions: {
              joy: number;
              anger: number;
              fear: number;
              sadness: number;
              surprise: number;
              disgust: number;
            };
          };
          importance: number;
          novelty: number;
        };
        relationships: Array<{
          id: string;
          sourceEntity: string;
          targetEntity: string;
          type: {
            category: string;
            subcategory: string;
            confidence: number;
          };
          context: string;
          strength: number;
          evidence: string[];
        }>;
        hierarchical: {
          level: number;
          parent: string | null;
          children: string[];
          siblings: string[];
          root: string;
          path: string[];
          depth: number;
        };
        context: {
          documentContext: string;
          sectionContext: string;
          sentenceContext: string;
          topicContext: string[];
          coOccurrences: string[];
          discourseRole: string;
        };
        provenance: {
          extractor: string;
          extractionMethod: string;
          confidence: number;
          validationStatus: string;
          validationSources: string[];
          lastUpdated: string;
          version: number;
        };
      }>;
      centralEntity: {
        text: string;
        type: string;
        confidence: number;
        position: {
          start: number;
          end: number;
          line: number;
          column: number;
          contextWindow: string;
          documentId: string;
          section: string;
        };
        metadata: {
          frequency: number;
          tfIdf: number;
          centrality: number;
          sentiment: {
            polarity: number;
            subjectivity: number;
            intensity: number;
            emotions: {
              joy: number;
              anger: number;
              fear: number;
              sadness: number;
              surprise: number;
              disgust: number;
            };
          };
          importance: number;
          novelty: number;
        };
        relationships: Array<{
          id: string;
          sourceEntity: string;
          targetEntity: string;
          type: {
            category: string;
            subcategory: string;
            confidence: number;
          };
          context: string;
          strength: number;
          evidence: string[];
        }>;
        hierarchical: {
          level: number;
          parent: string | null;
          children: string[];
          siblings: string[];
          root: string;
          path: string[];
          depth: number;
        };
        context: {
          documentContext: string;
          sectionContext: string;
          sentenceContext: string;
          topicContext: string[];
          coOccurrences: string[];
          discourseRole: string;
        };
        provenance: {
          extractor: string;
          extractionMethod: string;
          confidence: number;
          validationStatus: string;
          validationSources: string[];
          lastUpdated: string;
          version: number;
        };
      };
      coherenceScore: number;
      topic: string;
    }>;
    metadata: {
      processingTime: number;
      entitiesExtracted: number;
      relationshipsFound: number;
      clustersCreated: number;
      averageConfidence: number;
      processingStages: string[];
    };
    quality: {
      entityCoverage: number;
      relationshipDensity: number;
      clusterCohesion: number;
      topicCoverage: number;
    };
  };
  performance: {
    totalTime: number;
    intentClassificationTime: number;
    patternGenerationTime: number;
    optimizationTime: number;
    executionTime: number;
    rankingTime: number;
  };
  metadata: {
    queryId: string;
    success: boolean;
    warnings: string[];
    suggestions: Array<{
      type: "query_refinement" | "entity_expansion" | "relationship_exploration";
      suggestion: string;
      confidence: number;
    }>;
  };
}

export interface PathFindingOptions {
  startEntity: string;
  endEntity: string;
  maxDepth?: number;
  algorithm?: "dfs" | "bfs" | "dijkstra" | "astar";
  relationshipTypes?: string[];
  direction?: "outbound" | "inbound" | "bidirectional";
  maxPaths?: number;
  includeWeights?: boolean;
}

export interface PathFindingResult {
  paths: Array<{
    nodes: string[];
    edges: Array<{
      source: string;
      target: string;
      type: string;
      weight: number;
    }>;
    totalWeight: number;
    length: number;
    confidence: number;
  }>;
  metadata: {
    totalPathsFound: number;
    maxPathLength: number;
    averagePathLength: number;
    executionTime: number;
  };
  suggestions: Array<{
    type: "alternative_path" | "relationship_expansion" | "entity_suggestion";
    suggestion: string;
    confidence: number;
  }>;
}

export interface PatternAnalysisResult {
  patterns: Array<{
    pattern: string;
    frequency: number;
    confidence: number;
    examples: string[];
    significance: number;
  }>;
  insights: Array<{
    type: "trend" | "anomaly" | "correlation" | "causality";
    description: string;
    confidence: number;
    entities: string[];
    relationships: string[];
  }>;
  statistics: {
    totalPatterns: number;
    averageFrequency: number;
    averageConfidence: number;
    mostFrequentPattern: string;
    leastFrequentPattern: string;
  };
}

export interface QueryContext {
  workspaceName?: string;
  userId?: string;
  sessionId?: string;
  previousQueries?: string[];
  userPreferences?: Record<string, any>;
  domainContext?: Record<string, any>;
  temporalContext?: {
    timeRange?: {
      start: string;
      end: string;
    };
    granularity?: "second" | "minute" | "hour" | "day" | "week" | "month" | "year";
    referenceTime?: string;
  };
  spatialContext?: {
    location?: string;
    radius?: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}
