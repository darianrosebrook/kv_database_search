// Workspace Management Service - UI integration for multi-source data management
const WORKSPACE_API_BASE = "http://localhost:3001/workspaces";

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

export interface WorkspaceServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  processedFiles: number;
  totalChunks: number;
  errors: string[];
  performance: {
    startTime: string;
    endTime: string;
    durationMs: number;
    throughput: number;
  };
}

export interface EntityResolutionResult {
  resolvedEntity: string;
  confidence: number;
  sources: Array<{
    workspace: string;
    entity: string;
    confidence: number;
  }>;
  explanation: string;
}

export interface CrossWorkspaceSearchResult {
  query: string;
  totalResults: number;
  results: Array<{
    workspace: string;
    resultCount: number;
    topResults: Array<{
      id: string;
      title: string;
      summary: string;
      source: string;
      confidence: number;
    }>;
  }>;
  facets: Array<{
    name: string;
    values: Array<{
      value: string;
      count: number;
    }>;
  }>;
  suggestions: Array<{
    type: "query" | "entity" | "relationship";
    value: string;
    confidence: number;
  }>;
  performance: {
    totalTime: number;
    workspaceTimes: Record<string, number>;
  };
}

export class WorkspaceService {
  private static instance: WorkspaceService;
  private baseUrl: string;

  private constructor(baseUrl: string = WORKSPACE_API_BASE) {
    this.baseUrl = baseUrl;
  }

  static getInstance(): WorkspaceService {
    if (!WorkspaceService.instance) {
      WorkspaceService.instance = new WorkspaceService();
    }
    return WorkspaceService.instance;
  }

  // ============================================================================
  // WORKSPACE MANAGEMENT
  // ============================================================================

  async createWorkspace(
    name: string,
    description?: string,
    settings?: Partial<Workspace["settings"]>
  ): Promise<WorkspaceServiceResponse<Workspace>> {
    try {
      const response = await fetch(`${this.baseUrl}/workspaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          settings: {
            isPublic: false,
            allowAutoSync: true,
            syncIntervalMinutes: 60,
            retentionDays: 365,
            ...settings,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create workspace: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.workspace,
        message: `Workspace "${name}" created successfully`,
      };
    } catch (error) {
      console.error("Workspace creation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getWorkspace(identifier: string): Promise<WorkspaceServiceResponse<Workspace>> {
    try {
      const response = await fetch(`${this.baseUrl}/workspaces/${identifier}`);

      if (!response.ok) {
        throw new Error(`Failed to get workspace: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.workspace,
      };
    } catch (error) {
      console.error("Workspace retrieval failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async listWorkspaces(): Promise<WorkspaceServiceResponse<Workspace[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/workspaces`);

      if (!response.ok) {
        throw new Error(`Failed to list workspaces: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.workspaces,
      };
    } catch (error) {
      console.error("Workspace listing failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async updateWorkspace(
    identifier: string,
    updates: Partial<Workspace>
  ): Promise<WorkspaceServiceResponse<Workspace>> {
    try {
      const response = await fetch(`${this.baseUrl}/workspaces/${identifier}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update workspace: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.workspace,
        message: "Workspace updated successfully",
      };
    } catch (error) {
      console.error("Workspace update failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async deleteWorkspace(identifier: string): Promise<WorkspaceServiceResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/workspaces/${identifier}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete workspace: ${response.statusText}`);
      }

      return {
        success: true,
        message: "Workspace deleted successfully",
      };
    } catch (error) {
      console.error("Workspace deletion failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ============================================================================
  // DATA SOURCE MANAGEMENT
  // ============================================================================

  async addDataSource(
    workspaceName: string,
    dataSource: Omit<DataSource, "id" | "metadata">
  ): Promise<WorkspaceServiceResponse<DataSource>> {
    try {
      const response = await fetch(`${this.baseUrl}/workspaces/${workspaceName}/datasources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataSource),
      });

      if (!response.ok) {
        throw new Error(`Failed to add data source: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.dataSource,
        message: "Data source added successfully",
      };
    } catch (error) {
      console.error("Data source addition failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async removeDataSource(
    workspaceName: string,
    dataSourceId: string
  ): Promise<WorkspaceServiceResponse<void>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/workspaces/${workspaceName}/datasources/${dataSourceId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to remove data source: ${response.statusText}`);
      }

      return {
        success: true,
        message: "Data source removed successfully",
      };
    } catch (error) {
      console.error("Data source removal failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async syncDataSource(
    workspaceName: string,
    dataSourceId: string
  ): Promise<WorkspaceServiceResponse<SyncResult>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/workspaces/${workspaceName}/datasources/${dataSourceId}/sync`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to sync data source: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.result,
        message: "Data source synced successfully",
      };
    } catch (error) {
      console.error("Data source sync failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ============================================================================
  // ENTITY MAPPING & RESOLUTION
  // ============================================================================

  async createEntityMapping(
    workspaceName: string,
    mapping: Omit<EntityMapping, "id" | "createdAt" | "createdBy">
  ): Promise<WorkspaceServiceResponse<EntityMapping>> {
    try {
      const response = await fetch(`${this.baseUrl}/workspaces/${workspaceName}/mappings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mapping),
      });

      if (!response.ok) {
        throw new Error(`Failed to create entity mapping: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.mapping,
        message: "Entity mapping created successfully",
      };
    } catch (error) {
      console.error("Entity mapping creation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async resolveEntity(
    workspaceName: string,
    entityText: string
  ): Promise<WorkspaceServiceResponse<EntityResolutionResult>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/workspaces/${workspaceName}/resolve/${encodeURIComponent(entityText)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to resolve entity: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.result,
      };
    } catch (error) {
      console.error("Entity resolution failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ============================================================================
  // CROSS-WORKSPACE SEARCH
  // ============================================================================

  async searchAcrossWorkspaces(
    query: string,
    workspaceNames: string[]
  ): Promise<WorkspaceServiceResponse<CrossWorkspaceSearchResult>> {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          workspaceNames,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to search across workspaces: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.result,
      };
    } catch (error) {
      console.error("Cross-workspace search failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async getWorkspaceStatistics(
    workspaceName: string
  ): Promise<WorkspaceServiceResponse<Workspace["statistics"]>> {
    try {
      const response = await fetch(`${this.baseUrl}/workspaces/${workspaceName}/statistics`);

      if (!response.ok) {
        throw new Error(`Failed to get workspace statistics: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.statistics,
      };
    } catch (error) {
      console.error("Statistics retrieval failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getWorkspaceHealth(
    workspaceName: string
  ): Promise<WorkspaceServiceResponse<{ status: string; message: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);

      if (!response.ok) {
        throw new Error(`Failed to get workspace health: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error("Health check failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instance
export const workspaceService = WorkspaceService.getInstance();
