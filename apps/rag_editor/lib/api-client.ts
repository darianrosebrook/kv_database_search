/**
 * API client for connecting to Obsidian RAG kv_database
 *
 * @author @darianrosebrook
 */

export interface SearchRequest {
  query: string;
  limit?: number;
  searchMode?: "comprehensive" | "semantic" | "fulltext";
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

export interface SearchResult {
  id: string;
  text: string;
  meta: {
    contentType: "code" | "text" | "web" | "chat_session" | "unknown";
    section: string;
    breadcrumbs: string[];
    uri: string;
    updatedAt?: string;
    createdAt?: string;
    author?: string;
    sourceType?: string;
    webSource?: string;
    model?: string;
    messageCount?: number;
    topics?: string[];
  };
  source: {
    type: "web" | "chat";
    path: string;
    url: string;
  };
  cosineSimilarity: number;
  rank: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalFound: number;
  facets: Record<string, unknown>;
  graphInsights: {
    queryConcepts: string[];
    relatedConcepts: string[];
    knowledgeClusters: string[];
    webResults?: number;
    chatSessions?: number;
    hasChatResults?: boolean;
  };
  error?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: string;
  model?: string;
}

export interface ChatRequest {
  message: string;
  model?: string;
  context?: ChatMessage[];
  searchResults?: Array<{
    id: string;
    title: string;
    summary: string;
    text: string;
    meta: {
      contentType: "code" | "text" | "web" | "chat_session" | "unknown";
      section: string;
      breadcrumbs: string[];
      uri: string;
    };
    relevanceScore: number;
  }>;
  originalQuery?: string;
  searchMetadata?: {
    totalResults: number;
    searchTime: number;
    filters?: Array<{
      type: string;
      value: unknown;
    }>;
  };
}

export interface ChatResponse {
  response: string;
  context: ChatMessage[];
  suggestedActions?: Array<{
    type:
      | "refine_search"
      | "new_search"
      | "filter"
      | "explore"
      | "reason"
      | "find_similar";
    label: string;
    query?: string;
    filters?: Array<{
      type: string;
      value: unknown;
    }>;
  }>;
  timestamp: string;
  model?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
    model?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  model: string;
  messageCount: number;
  topics: string[];
}

export interface ChatHistoryResponse {
  sessions: ChatSession[];
  error?: string;
}

export interface SaveChatRequest {
  title?: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
    model?: string;
  }>;
  model?: string;
}

export interface WebSearchRequest {
  query: string;
  maxResults?: number;
  includeSnippets?: boolean;
  minRelevanceScore?: number;
  sources?: string[];
  timeRange?: {
    start?: string;
    end?: string;
  };
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet?: string;
  publishedDate?: string;
  source: string;
  relevanceScore: number;
}

export interface WebSearchResponse {
  query: string;
  results: WebSearchResult[];
  totalFound: number;
  searchTime: number;
  error?: string;
}

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

class ApiClient {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to localhost
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  // Health check
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/health");
  }

  // Search endpoints
  async search(request: SearchRequest): Promise<SearchResponse> {
    return this.request<SearchResponse>("/search", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async searchStrategic(request: SearchRequest): Promise<SearchResponse> {
    return this.request<SearchResponse>("/search/strategic", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async searchWithRationales(request: SearchRequest): Promise<SearchResponse> {
    return this.request<SearchResponse>("/search/with-rationales", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getRationale(
    query: string,
    resultId: string
  ): Promise<{
    query: string;
    resultId: string;
    rationale: string;
    model: string;
    timestamp: string;
  }> {
    return this.request("/search/rationale", {
      method: "POST",
      body: JSON.stringify({ query, resultId }),
    });
  }

  async explainSearch(
    query: string,
    resultId: string
  ): Promise<{
    query: string;
    resultId: string;
    explanation: string;
    model: string;
    timestamp: string;
  }> {
    return this.request("/search/explain", {
      method: "POST",
      body: JSON.stringify({ query, resultId }),
    });
  }

  // Graph RAG search
  async graphRagSearch(
    query: string,
    options?: {
      limit?: number;
      threshold?: number;
      includeContent?: boolean;
      rerank?: boolean;
    }
  ): Promise<{
    results: Array<{
      id: string;
      text: string;
      score: number;
      similarity: number;
      rankingScore: number;
      metadata: {
        chunkId: string;
        sourceFile: string;
        contentType: string;
        processingTime: string;
        characterCount: number;
        section: string;
        breadcrumbs: string[];
        uri: string;
        updatedAt: string;
        createdAt: string;
      };
      entities: Array<{
        id: string;
        name: string;
        type: string;
        confidence: number;
      }>;
      relationships: Array<{
        id: string;
        source: string;
        target: string;
        type: string;
        confidence: number;
      }>;
      explanation: string;
    }>;
    metrics: {
      totalResults: number;
      executionTime: number;
      vectorResults: number;
      graphResults: number;
      entitiesFound: number;
      relationshipsTraversed: number;
      vectorSearchTime: number;
      graphTraversalTime: number;
      resultFusionTime: number;
    };
    explanation: {
      queryEntities: string[];
      searchStrategy: string;
      reasoningSteps: string[];
      qualityMetrics: {
        completeness: number;
        accuracy: number;
        consistency: number;
        freshness: number;
        relevance: number;
      };
    };
  }> {
    return this.request("/api/graph-rag/search", {
      method: "POST",
      body: JSON.stringify({ query, options }),
    });
  }

  // Chat endpoints
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getChatHistory(): Promise<ChatHistoryResponse> {
    return this.request<ChatHistoryResponse>("/chat/history");
  }

  async saveChatSession(request: SaveChatRequest): Promise<{
    success: boolean;
    sessionId?: string;
    error?: string;
  }> {
    return this.request("/chat/save", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getChatSession(id: string): Promise<{
    session?: ChatSession;
    error?: string;
  }> {
    return this.request(`/chat/session/${id}`);
  }

  async deleteChatSession(id: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    return this.request(`/chat/session/${id}`, {
      method: "DELETE",
    });
  }

  // Web search
  async webSearch(request: WebSearchRequest): Promise<WebSearchResponse> {
    return this.request<WebSearchResponse>("/search/web", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Enhanced search
  async enhancedSearch(request: SearchRequest): Promise<SearchResponse> {
    return this.request<SearchResponse>("/search/enhanced", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Context search
  async contextSearch(request: SearchRequest): Promise<SearchResponse> {
    return this.request<SearchResponse>("/search/context", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Context suggestions
  async getContextSuggestions(
    query: string,
    context: string[] = []
  ): Promise<{
    suggestions: Array<{
      suggestion: string;
      confidence: number;
      context?: string;
    }>;
    error?: string;
  }> {
    return this.request("/context/suggestions", {
      method: "POST",
      body: JSON.stringify({ query, context }),
    });
  }

  // Chat session search
  async searchChatSessions(
    query: string,
    limit = 10
  ): Promise<{
    query: string;
    results: Array<{
      id: string;
      title: string;
      summary: string;
      source: string;
      relevanceScore: number;
    }>;
    totalFound: number;
    error?: string;
  }> {
    return this.request("/search/chat-sessions", {
      method: "POST",
      body: JSON.stringify({ query, limit }),
    });
  }

  // Combined search
  async combinedSearch(request: SearchRequest): Promise<SearchResponse> {
    return this.request<SearchResponse>("/search/combined", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Graph endpoints
  async getGraphData(
    centerDocument?: string,
    maxNodes = 50
  ): Promise<{
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      importance: number;
      topics?: string[];
    }>;
    edges: Array<{
      source: string;
      target: string;
      type: string;
      strength: number;
    }>;
    context?: {
      centerDocument?: string;
      relatedTopics: string[];
      relationshipStats: Record<string, number>;
    };
    error?: string;
  }> {
    const params = new URLSearchParams();
    if (centerDocument) params.set("centerDocument", centerDocument);
    params.set("maxNodes", maxNodes.toString());

    return this.request(`/graph/context?${params}`);
  }

  // Statistics
  async getStats(): Promise<{
    totalChunks: number;
    byContentType: Record<string, number>;
    byFolder: Record<string, number>;
    lastUpdate: string | null;
    performance?: Record<string, unknown>;
    error?: string;
  }> {
    return this.request("/stats");
  }

  // Models
  async getModels(): Promise<{
    models: Array<{
      name: string;
      size: number;
      modified_at: string;
      details?: {
        format?: string;
        family?: string;
        parameter_size?: string;
        quantization_level?: string;
      };
    }>;
    error?: string;
  }> {
    return this.request("/models");
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
