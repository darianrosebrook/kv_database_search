/**
 * API utilities for connecting to the backend
 */

// Cache for discovered server configuration
let cachedServerConfig: { url: string; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Discover the backend server by checking common ports for the health endpoint
 */
async function discoverBackendServer(): Promise<string> {
  // Check cache first
  if (
    cachedServerConfig &&
    Date.now() - cachedServerConfig.timestamp < CACHE_DURATION
  ) {
    return cachedServerConfig.url;
  }

  const commonPorts = [3001, 3002, 3003, 3004, 3005];
  const protocols = ["http://", "https://"];

  for (const protocol of protocols) {
    for (const port of commonPorts) {
      const baseUrl = `${protocol}localhost:${port}`;

      try {
        const response = await fetch(`${baseUrl}/health`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          // Short timeout to avoid hanging
          signal: AbortSignal.timeout(2000),
        });

        if (response.ok) {
          const healthData = await response.json();

          // Verify this is our backend server by checking for expected fields
          if (healthData.services && healthData.version) {
            console.log(`✅ Discovered backend server at ${baseUrl}`);

            // Cache the result
            cachedServerConfig = {
              url: baseUrl,
              timestamp: Date.now(),
            };

            return baseUrl;
          }
        }
      } catch (error) {
        // Continue to next port
        continue;
      }
    }
  }

  // If no server found, fall back to default
  console.warn(
    "⚠️ Could not discover backend server, using default localhost:3001"
  );
  return "http://localhost:3001";
}

/**
 * Get the API base URL, discovering the server if needed
 */
export async function getApiBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  return await discoverBackendServer();
}

// Initialize API_BASE_URL
let API_BASE_URL: string;
getApiBaseUrl()
  .then((url) => {
    API_BASE_URL = url;
  })
  .catch((error) => {
    console.error("Failed to discover API server:", error);
    API_BASE_URL = "http://localhost:3001"; // Fallback
  });

/**
 * Clear the cached server configuration to force rediscovery
 */
export function clearServerCache(): void {
  cachedServerConfig = null;
  console.log("🗑️ Cleared server cache - will rediscover on next request");
}

/**
 * Manually refresh server discovery
 */
export async function refreshServerDiscovery(): Promise<string> {
  clearServerCache();
  const url = await getApiBaseUrl();
  if (API_BASE_URL) {
    API_BASE_URL = url;
  }
  return url;
}

export interface RecentDocument {
  id: string;
  title: string;
  description: string;
  lastAccessed: string;
  tags?: string[];
}

export interface RecentDocumentsResponse {
  documents: RecentDocument[];
  total: number;
  timestamp: string;
  error?: string;
}

export interface VaultDocument {
  path: string;
  name: string;
  size: number;
  modified: string;
  created: string;
  extension: string;
  isMarkdown: boolean;
  content: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

export interface VaultDocumentResponse extends VaultDocument {
  error?: string;
}

export interface VaultFilesResponse {
  type: "directory" | "file";
  path: string;
  files: Array<{
    name: string;
    path: string;
    type: "directory" | "file";
    size?: number;
    modified: string;
    created: string;
    extension?: string;
    isMarkdown: boolean;
  }>;
  total: number;
  error?: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface SearchResult {
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
}

export interface ChatRequest {
  message: string;
  model?: string;
  context?: ChatMessage[];
  searchResults?: SearchResult[];
  sessionId?: string;
}

export interface ChatResponse {
  response: string;
  context: ChatMessage[];
  suggestedActions?: Array<{
    type: "refine_search" | "new_search" | "filter" | "explore";
    label: string;
    query?: string;
    description: string;
  }>;
  timestamp: string;
  model: string;
  error?: string;
}

/**
 * Fetch recent documents from the backend
 */
export async function fetchRecentDocuments(): Promise<RecentDocumentsResponse> {
  try {
    // Ensure API_BASE_URL is initialized
    if (!API_BASE_URL) {
      API_BASE_URL = await getApiBaseUrl();
    }

    const response = await fetch(`${API_BASE_URL}/api/recent-documents`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Filter out documents with null or invalid IDs
    if (data.documents) {
      data.documents = data.documents.filter(
        (doc: RecentDocument) =>
          doc.id && doc.id !== "null" && doc.id !== "undefined"
      );
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch recent documents:", error);
    return {
      documents: [],
      total: 0,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch a document from the vault by its path
 */
export async function fetchVaultDocument(
  documentPath: string
): Promise<VaultDocumentResponse> {
  try {
    // Ensure API_BASE_URL is initialized
    if (!API_BASE_URL) {
      API_BASE_URL = await getApiBaseUrl();
    }

    // URL encode the path to handle special characters and spaces
    const encodedPath = encodeURIComponent(documentPath);
    const response = await fetch(
      `${API_BASE_URL}/api/vault/file/${encodedPath}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Document not found");
      } else if (response.status === 403) {
        throw new Error("Access denied");
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch document:", error);
    return {
      path: documentPath,
      name: "Error",
      size: 0,
      modified: new Date().toISOString(),
      created: new Date().toISOString(),
      extension: "",
      isMarkdown: false,
      content: "",
      frontmatter: {},
      body: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Save a document to the vault
 */
export async function saveVaultDocument(
  documentPath: string,
  content: string,
  frontmatter?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Ensure API_BASE_URL is initialized
    if (!API_BASE_URL) {
      API_BASE_URL = await getApiBaseUrl();
    }

    const encodedPath = encodeURIComponent(documentPath);
    const response = await fetch(
      `${API_BASE_URL}/api/vault/file/${encodedPath}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          frontmatter,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: data.success };
  } catch (error) {
    console.error("Failed to save document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch files and directories from the vault
 */
export async function fetchVaultFiles(
  path?: string
): Promise<VaultFilesResponse> {
  try {
    // Ensure API_BASE_URL is initialized
    if (!API_BASE_URL) {
      API_BASE_URL = await getApiBaseUrl();
    }

    const queryParams = path ? `?path=${encodeURIComponent(path)}` : "";
    const response = await fetch(
      `${API_BASE_URL}/api/vault/files${queryParams}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Path not found");
      } else if (response.status === 403) {
        throw new Error("Access denied");
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch vault files:", error);
    return {
      type: "directory",
      path: path || "",
      files: [],
      total: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Format relative time for display
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return "Just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Send a chat message to the AI assistant
 */
export async function sendChatMessage(
  request: ChatRequest
): Promise<ChatResponse> {
  try {
    // Ensure API_BASE_URL is initialized
    if (!API_BASE_URL) {
      API_BASE_URL = await getApiBaseUrl();
    }

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to send chat message:", error);
    return {
      response: `Sorry, I encountered an error while processing your message: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      context: request.context || [],
      timestamp: new Date().toISOString(),
      model: request.model || "unknown",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get contextually relevant search results for a query using embeddings
 */
export async function getChatContext(
  query: string,
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    // Ensure API_BASE_URL is initialized
    if (!API_BASE_URL) {
      API_BASE_URL = await getApiBaseUrl();
    }

    // First perform a search to get relevant documents using embeddings
    const searchResponse = await fetch(`${API_BASE_URL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit,
        mode: "comprehensive",
      }),
    });

    if (!searchResponse.ok) {
      throw new Error(`Search failed with status: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    // Convert search results to the format expected by chat
    return (searchData.results || []).map((result: any) => ({
      id: result.id || result.filePath || `result-${Math.random()}`,
      title: result.title || result.fileName || "Untitled Document",
      summary: result.summary || result.text?.substring(0, 200) + "..." || "",
      text: result.text || result.content || "",
      meta: {
        contentType: result.contentType || "text",
        section: result.section || "",
        breadcrumbs: result.breadcrumbs || [],
        uri: result.uri || result.filePath || `file://${result.filePath}`,
      },
      relevanceScore: result.score || result.relevanceScore || 0.5,
    }));
  } catch (error) {
    console.error("Failed to get chat context:", error);
    return [];
  }
}
