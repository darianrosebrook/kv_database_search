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
