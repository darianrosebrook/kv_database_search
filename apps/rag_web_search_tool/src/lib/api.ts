// API service for connecting to the RAG backend
const API_BASE_URL = "http://localhost:3001";

export interface SearchResult {
  id: string;
  text: string;
  meta: {
    contentType: string;
    section: string;
    breadcrumbs: string[];
    uri?: string;
    url?: string;
    updatedAt?: string;
    createdAt?: string;
  };
  source: {
    type: "documentation" | "component" | "guideline";
    path: string;
    url: string;
  };
  cosineSimilarity: number;
  rank: number;
}

export interface SearchResponse {
  query: string;
  originalQuery?: string;
  results: SearchResult[];
  totalFound: number;
  latencyMs: number;
  filters: {
    acl?: string;
    contentTypes?: string[];
    minSimilarity?: number;
  };
  embeddingInfo?: {
    model: string;
    confidence: number;
  };
}

export interface SearchOptions {
  limit?: number;
  contentType?: string;
  domainHint?: string;
  contentTypes?: string[];
  minSimilarity?: number;
  rerank?: boolean;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private transformMetaToSource(meta): SearchResult["source"] {
    // Extract external URL from meta.uri (this should be the Coda document URL)
    const url = meta.uri || meta.url || "#";

    // Determine source type based on content type or source info
    let type: "documentation" | "component" | "guideline" = "documentation";
    if (meta.sourceType === "coda") {
      if (
        meta.contentType === "component" ||
        meta.codaItemType === "component"
      ) {
        type = "component";
      } else if (
        meta.contentType === "guideline" ||
        meta.section?.toLowerCase().includes("guideline")
      ) {
        type = "guideline";
      }
    }

    // Create a readable path from breadcrumbs or section info
    let path = "";
    if (meta.breadcrumbs && meta.breadcrumbs.length > 0) {
      path = meta.breadcrumbs.join(" > ");
    } else if (meta.section) {
      path = meta.section;
    } else {
      path = meta.contentType || "Unknown";
    }

    return {
      type,
      path,
      url,
    };
  }

  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          ...options,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Search failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Transform backend response to frontend format
      const transformedResults = data.results.map((result) => ({
        ...result,
        source: this.transformMetaToSource(result.meta),
      }));

      return {
        ...data,
        results: transformedResults,
      };
    } catch (error) {
      console.error("Search API error:", error);
      throw new Error(
        `Failed to search: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async searchWithRationales(
    query: string,
    options: SearchOptions = {}
  ): Promise<
    SearchResponse & {
      resultsWithRationales?: Array<SearchResult & { rationale? }>;
    }
  > {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          ...options,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Search failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Transform backend response to frontend format
      if (data.results) {
        const transformedResults = data.results.map((result) => ({
          ...result,
          source: this.transformMetaToSource(result.meta),
        }));

        return {
          ...data,
          results: transformedResults,
          resultsWithRationales: data.resultsWithRationales?.map((result) => ({
            ...result,
            source: this.transformMetaToSource(result.meta),
          })),
        };
      }

      return data;
    } catch (error) {
      console.error("Search API error:", error);
      throw new Error(
        `Failed to search: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async generateRationale(query: string, resultId: string): Promise {
    try {
      const response = await fetch(`${this.baseUrl}/search/rationale`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          resultId,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Rationale generation failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Rationale generation error:", error);
      throw new Error(
        `Failed to generate rationale: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // New chat endpoint for conversational RAG
  async chat(
    message: string,
    options: {
      context?: Array<{ role: string; content: string }>;
      searchResults?: Array;
      originalQuery?: string;
      searchMetadata?: {
        totalResults: number;
        searchTime: number;
        filters?;
      };
      model?: string;
    } = {}
  ): Promise<{
    response: string;
    context: Array<{ role: string; content: string }>;
    suggestedActions?: Array<{
      type: "refine_search" | "new_search" | "filter" | "explore";
      label: string;
      query?: string;
      filters?;
    }>;
    timestamp: string;
    model?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          model: options.model,
          context: options.context || [],
          searchResults: options.searchResults || [],
          originalQuery: options.originalQuery,
          searchMetadata: options.searchMetadata,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Chat request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Chat error:", error);
      throw new Error(
        `Failed to generate chat response: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async explain(query: string, resultId: string): Promise {
    try {
      const response = await fetch(`${this.baseUrl}/search/explain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          resultId,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Explain failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Explain API error:", error);
      throw new Error(
        `Failed to explain: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getHealth(): Promise {
    try {
      const response = await fetch(`${this.baseUrl}/health`);

      if (!response.ok) {
        throw new Error(
          `Health check failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Health check error:", error);
      throw new Error(
        `Failed to check health: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getStats(): Promise {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);

      if (!response.ok) {
        throw new Error(
          `Stats failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Stats API error:", error);
      throw new Error(
        `Failed to get stats: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

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
    try {
      const response = await fetch(`${this.baseUrl}/models`);

      if (!response.ok) {
        throw new Error(
          `Models request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Models API error:", error);
      throw new Error(
        `Failed to get models: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

export const apiService = new ApiService();
export default apiService;
