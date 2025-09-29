// Centralized type definitions for the RAG Editor
// Based on the implementation from rag_web_search_tool

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
// GRAPH RAG TYPES
// ============================================================================

export interface GraphRagEntity {
  id: string;
  name: string;
  type:
    | "PERSON"
    | "ORGANIZATION"
    | "CONCEPT"
    | "DOCUMENT"
    | "EVENT"
    | "LOCATION"
    | "TECHNOLOGY"
    | "PROCESS"
    | "METRIC"
    | "PRODUCT";
  confidence: number;
  aliases?: string[];
  properties?: Record<string, unknown>;
  contextualRelevance?: number;
}

export interface GraphRagRelationship {
  id: string;
  type:
    | "MENTIONS"
    | "CONTAINS"
    | "RELATES_TO"
    | "DEPENDS_ON"
    | "CAUSES"
    | "PART_OF"
    | "SIMILAR_TO"
    | "OPPOSITE_OF"
    | "TEMPORAL_BEFORE"
    | "TEMPORAL_AFTER";
  sourceEntityId: string;
  targetEntityId: string;
  confidence: number;
  strength: number;
  isDirectional: boolean;
  contextualImportance?: number;
  sourceNode?: GraphRagEntity;
  targetNode?: GraphRagEntity;
}

export interface GraphRagSearchResult {
  id: string;
  text: string;
  score: number;
  similarity: number;
  rankingScore?: number;
  metadata: {
    chunkId: string;
    sourceFile: string;
    contentType: string;
    processingTime: string;
    characterCount: number;
    section?: string;
    breadcrumbs?: string[];
    uri?: string;
    url?: string;
    updatedAt?: string;
    createdAt?: string;
  };
  entities: GraphRagEntity[];
  relationships: GraphRagRelationship[];
  explanation?: string;
  provenance?: {
    searchStrategy: string;
    vectorSearchTime: number;
    graphTraversalTime: number;
    resultFusionTime: number;
    totalExecutionTime: number;
  };
}

export interface ReasoningResult {
  paths: Array<{
    entities: GraphRagEntity[];
    relationships: GraphRagRelationship[];
    confidence: number;
    strength: number;
    depth: number;
    explanation: string;
    evidence: Array<{
      id: string;
      type: string;
      content: string;
      confidence: number;
      sourceChunkIds: string[];
      supportingEntities: string[];
    }>;
    logicalSteps: Array<{
      step: number;
      type: string;
      description: string;
      confidence: number;
      premises: string[];
      conclusion: string;
      logicalRule: string;
    }>;
  }>;
  bestPath?: {
    entities: GraphRagEntity[];
    relationships: GraphRagRelationship[];
    confidence: number;
    strength: number;
    depth: number;
    explanation: string;
    evidence: Array<{
      id: string;
      type: string;
      content: string;
      confidence: number;
      sourceChunkIds: string[];
      supportingEntities: string[];
    }>;
    logicalSteps: Array<{
      step: number;
      type: string;
      description: string;
      confidence: number;
      premises: string[];
      conclusion: string;
      logicalRule: string;
    }>;
  };
  confidence: number;
  explanation: string;
  metrics: {
    totalPaths: number;
    averageDepth: number;
    processingTime: number;
    exploredNodes: number;
    exploredRelationships: number;
  };
  alternativeHypotheses: Array<{
    hypothesis: string;
    confidence: number;
    supportingPaths: string[];
    evidence: string[];
  }>;
  contradictions: Array<{
    description: string;
    conflictingPaths: string[];
    evidence: string[];
  }>;
}

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
  entities?: GraphRagEntity[];
  reasoning?: ReasoningResult;
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
  topics?: string[];
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
  showMultiModalInterface: boolean;
  selectedModel: string;
  currentSession: ChatSession | null;

  // Graph RAG state
  useGraphRag: boolean;
  graphRagResults: GraphRagSearchResult[];
  selectedGraphRagResult: GraphRagSearchResult | null;
  reasoningResults?: ReasoningResult;
  allEntities: GraphRagEntity[];

  // Tab state
  tabs: AppTab[];
  activeTabId: string | null;
}

// ============================================================================
// TAB TYPES
// ============================================================================

export interface AppTab {
  id: string;
  title: string;
  type: "search" | "chat" | "document" | "workspace";
  isActive?: boolean;
  isDirty?: boolean;
  openTime: number;
  // Content-specific data
  content?: {
    // For search tabs
    query?: string;
    // For chat tabs
    sessionId?: string;
    // For document tabs
    documentId?: string;
    documentPath?: string;
    // For workspace tabs
    workspaceId?: string;
  };
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
  onExploreEntity: (entity: GraphRagEntity) => void;
  onExploreRelationship: (relationship: GraphRagRelationship) => void;
  onReasonAbout: (entities: GraphRagEntity[]) => void;
  onSelectGraphRagResult: (result: GraphRagSearchResult) => void;
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
