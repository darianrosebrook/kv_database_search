import { Pool } from "pg";
import {
  DocumentChunk,
  SearchResult,
  ChatSession,
  DocumentVersion,
  FileChangeMetadata,
  ProcessingStatus,
} from "../types/index";
import { Workspace } from "./workspace-manager";
import { DatabaseSchemaManager } from "./database-schema";
import { DocumentOperations } from "./database-operations";
import { ChatSessionManager } from "./chat-sessions";
import { DocumentVersionManager } from "./document-versions";
import { WorkspaceManager } from "./workspace-management";

/**
 * Main database facade that coordinates all database operations
 * Refactored version using composition and single responsibility modules
 * @darianrosebrook
 */
export class DocumentDatabase {
  protected pool: Pool;
  protected readonly tableName: string;
  private schemaManager: DatabaseSchemaManager;
  private documentOps: DocumentOperations;
  private chatManager: ChatSessionManager;
  private versionManager: DocumentVersionManager;
  private workspaceManager: WorkspaceManager;

  constructor(connectionString: string, tableName: string = "document_chunks") {
    this.tableName = tableName;
    this.pool = new Pool({
      connectionString,
      max: 5, // Reduced from 20 to prevent memory issues
      min: 1, // Reduced from 5 to minimize memory usage
      idleTimeoutMillis: 10000, // Reduced from 30000 for faster cleanup
      connectionTimeoutMillis: 2000,
      allowExitOnIdle: true,
    });

    // Initialize specialized managers
    this.schemaManager = new DatabaseSchemaManager(this.pool, this.tableName);
    this.documentOps = new DocumentOperations(this.pool, this.tableName);
    this.chatManager = new ChatSessionManager(this.pool);
    this.versionManager = new DocumentVersionManager(this.pool);
    this.workspaceManager = new WorkspaceManager(this.pool);
  }

  async initialize(): Promise<void> {
    await this.schemaManager.initialize();
  }

  // Document operations
  async upsertChunk(chunk: DocumentChunk): Promise<void> {
    return this.documentOps.upsertChunk(chunk);
  }

  async batchUpsertChunks(chunks: DocumentChunk[]): Promise<void> {
    return this.documentOps.batchUpsertChunks(chunks);
  }

  async search(
    queryEmbedding: number[],
    options: {
      limit?: number;
      threshold?: number;
      minSimilarity?: number;
      contentType?: string;
      fileName?: string;
      tags?: string[];
      includeMetadata?: boolean;
    } = {}
  ): Promise<SearchResult[]> {
    // Map minSimilarity to threshold for backward compatibility
    const searchOptions = {
      ...options,
      threshold: options.minSimilarity ?? options.threshold,
    };
    return this.documentOps.search(queryEmbedding, searchOptions);
  }

  async getChunkById(id: string): Promise<DocumentChunk | null> {
    return this.documentOps.getChunkById(id);
  }

  async getChunksByFile(fileName: string): Promise<DocumentChunk[]> {
    return this.documentOps.getChunksByFile(fileName);
  }

  async getStats(): Promise<{
    totalChunks: number;
    totalFiles: number;
    contentTypes: Record<string, number>;
    averageChunkSize: number;
  }> {
    return this.documentOps.getStats();
  }

  async deleteChunksByFile(fileName: string): Promise<void> {
    return this.documentOps.deleteChunksByFile(fileName);
  }

  // Chat session operations
  async saveChatSession(
    session: ChatSession & { isPublic?: boolean; embedding?: number[] }
  ): Promise<void> {
    return this.chatManager.saveChatSession(session);
  }

  async getChatSessions(userId?: string, limit = 50): Promise<ChatSession[]> {
    return this.chatManager.getChatSessions(userId, limit);
  }

  async getChatSessionById(id: string): Promise<ChatSession | null> {
    return this.chatManager.getChatSessionById(id);
  }

  async searchChatSessions(
    query: string,
    userId?: string,
    options: {
      limit?: number;
      threshold?: number;
      embedding?: number[];
    } = {}
  ): Promise<ChatSession[]> {
    return this.chatManager.searchChatSessions(query, userId, options);
  }

  async deleteChatSession(id: string): Promise<void> {
    return this.chatManager.deleteChatSession(id);
  }

  async updateChatSessionTopics(
    sessionId: string,
    topics: string[]
  ): Promise<void> {
    return this.chatManager.updateChatSessionTopics(sessionId, topics);
  }

  async getChatSessionStats(userId?: string): Promise<{
    totalSessions: number;
    publicSessions: number;
    privateSessions: number;
    averageSessionAge: number;
  }> {
    return this.chatManager.getChatSessionStats(userId);
  }

  // Document version operations
  async createDocumentVersion(
    filePath: string,
    content: string,
    versionNumber: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    return this.versionManager.createDocumentVersion(
      filePath,
      content,
      versionNumber,
      metadata
    );
  }

  async updateDocumentVersion(
    filePath: string,
    content: string,
    versionNumber: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    return this.versionManager.updateDocumentVersion(
      filePath,
      content,
      versionNumber,
      metadata
    );
  }

  async getDocumentVersions(filePath: string): Promise<DocumentVersion[]> {
    return this.versionManager.getDocumentVersions(filePath);
  }

  async getVersionContent(versionId: string): Promise<{
    content: string;
    metadata: Record<string, unknown>;
  }> {
    return this.versionManager.getVersionContent(versionId);
  }

  async getFileChangeHistory(filePath: string): Promise<FileChangeMetadata[]> {
    return this.versionManager.getFileChangeHistory(filePath);
  }

  async recordFileChange(
    filePath: string,
    changeType: string,
    author: string,
    description?: string,
    versionNumber?: number
  ): Promise<void> {
    return this.versionManager.recordFileChange(
      filePath,
      changeType,
      author,
      description,
      versionNumber
    );
  }

  async getFileProcessingStatus(
    filePath: string
  ): Promise<ProcessingStatus | null> {
    return this.versionManager.getFileProcessingStatus(filePath);
  }

  async updateFileProcessingStatus(
    filePath: string,
    status: ProcessingStatus["status"],
    errorMessage?: string,
    retryCount?: number
  ): Promise<void> {
    return this.versionManager.updateFileProcessingStatus(
      filePath,
      status,
      errorMessage,
      retryCount
    );
  }

  async cleanupOldVersions(
    filePath: string,
    keepVersions: number = 10
  ): Promise<number> {
    return this.versionManager.cleanupOldVersions(filePath, keepVersions);
  }

  async getFilesByProcessingStatus(status: string): Promise<string[]> {
    return this.versionManager.getFilesByProcessingStatus(status);
  }

  async getProcessingStats(): Promise<{
    totalFiles: number;
    byStatus: Record<string, number>;
    errors: number;
    averageProcessingTime: number;
  }> {
    return this.versionManager.getProcessingStats();
  }

  // Workspace operations
  async saveWorkspace(workspace: Workspace): Promise<void> {
    return this.workspaceManager.saveWorkspace(workspace);
  }

  async loadWorkspace(name: string): Promise<Workspace | null> {
    return this.workspaceManager.loadWorkspace(name);
  }

  async loadAllWorkspaces(): Promise<Workspace[]> {
    return this.workspaceManager.loadAllWorkspaces();
  }

  async deleteWorkspace(name: string): Promise<boolean> {
    return this.workspaceManager.deleteWorkspace(name);
  }

  async workspaceExists(name: string): Promise<boolean> {
    return this.workspaceManager.workspaceExists(name);
  }

  async getRecentDocuments(
    limit: number = 20,
    since?: Date
  ): Promise<
    Array<{
      fileName: string;
      contentType: string;
      lastModified: Date;
      chunkCount: number;
    }>
  > {
    return this.workspaceManager.getRecentDocuments(limit, since);
  }

  async getWorkspaceStats(): Promise<{
    totalWorkspaces: number;
    totalDocuments: number;
    totalChunks: number;
    averageChunksPerDocument: number;
  }> {
    return this.workspaceManager.getWorkspaceStats();
  }

  // Utility methods
  async clearAll(): Promise<void> {
    return this.schemaManager.clearAll();
  }

  async close(): Promise<void> {
    await this.schemaManager.close();
  }

  getPerformanceMetrics() {
    return this.documentOps.getPerformanceMetrics();
  }

  /**
   * Health check method for monitoring database connectivity
   */
  async healthCheck(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("SELECT 1");
    } finally {
      client.release();
    }
  }
}

/**
 * Test version of DocumentDatabase that supports SQLite for faster testing
 */
export class TestDocumentDatabase {
  private db: any;
  public tableName: string;
  public dimension: number;
  private isSQLite: boolean;
  private connectionString: string;
  private initialized: boolean = false;

  constructor(
    connectionString: string,
    tableName: string = "obsidian_chunks",
    dimension: number = 768
  ) {
    this.tableName = tableName;
    this.dimension = dimension;
    this.isSQLite = connectionString.startsWith("sqlite:");
    this.connectionString = connectionString;

    // Don't initialize database in constructor - do it lazily
    this.db = null;
  }

  private async initializeDatabase() {
    if (this.initialized) return;

    if (this.isSQLite) {
      // Use in-memory database for testing (avoids native compilation issues)
      try {
        const { InMemoryTestDatabase } = await import(
          "../../../../tests/in-memory-db"
        );
        this.db = new InMemoryTestDatabase();
      } catch {
        // Fallback - create a simple mock
        this.db = {
          initialize: async () => "sqlite::memory:",
          close: async () => {},
          query: async () => [],
          execute: async () => {},
        };
      }
    } else {
      // Use PostgreSQL
      this.db = new Pool({
        connectionString: this.connectionString,
        max: 5,
        min: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        allowExitOnIdle: true,
      });
    }

    this.initialized = true;
  }

  // No initialization needed for in-memory database

  async initialize(): Promise<void> {
    await this.initializeDatabase();

    if (!this.isSQLite) {
      // For PostgreSQL, we would normally initialize schema here
      // For testing, we'll skip complex schema setup
    }
  }

  async close(): Promise<void> {
    await this.initializeDatabase();

    if (this.isSQLite) {
      await this.db.close();
    } else {
      await this.db.end();
    }
  }

  // Mock methods for testing - simplified versions
  async upsertChunk(chunk: any): Promise<void> {
    await this.initializeDatabase();

    if (this.isSQLite) {
      await this.db.execute(
        `INSERT OR REPLACE INTO ${this.tableName} (id, content, embedding, metadata, file_path) VALUES (?, ?, ?, ?, ?)`,
        [
          chunk.id,
          chunk.content,
          chunk.embedding ? JSON.stringify(chunk.embedding) : null,
          chunk.metadata ? JSON.stringify(chunk.metadata) : null,
          chunk.file_path,
        ]
      );
    } else {
      // Mock PostgreSQL operation - just succeed for testing
    }
  }

  async search(
    queryEmbedding: number[] | null,
    options: any = {}
  ): Promise<any[]> {
    await this.initializeDatabase();

    if (this.isSQLite) {
      // Simple mock search for testing - return some chunks
      const limit = options.limit || 10;
      const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} LIMIT ?`);
      return stmt.all(limit);
    } else {
      // Mock search results
      return [];
    }
  }

  async getStats(): Promise<any> {
    await this.initializeDatabase();

    if (this.isSQLite) {
      const stmt = this.db.prepare(
        `SELECT COUNT(*) as total_chunks FROM ${this.tableName}`
      );
      const result = stmt.get();
      return {
        totalChunks: result.total_chunks || 0,
        totalFiles: 0,
        contentTypes: {},
        averageChunkSize: 0,
        byContentType: {},
        byFolder: {},
      };
    } else {
      return {
        totalChunks: 0,
        totalFiles: 0,
        contentTypes: {},
        averageChunkSize: 0,
        byContentType: {},
        byFolder: {},
      };
    }
  }

  // Expose pool for testing
  get pool(): any {
    return this.isSQLite ? null : this.db;
  }

  // Additional methods for testing
  async getChunkById(id: string): Promise<any> {
    await this.initializeDatabase();

    if (this.isSQLite) {
      const stmt = this.db.prepare(
        `SELECT * FROM ${this.tableName} WHERE id = ?`
      );
      return stmt.get(id);
    } else {
      // Mock implementation
      return null;
    }
  }

  async batchUpsertChunks(chunks: any[]): Promise<void> {
    for (const chunk of chunks) {
      await this.upsertChunk(chunk);
    }
  }

  async getChunksByFile(filePath: string): Promise<any[]> {
    await this.initializeDatabase();

    if (this.isSQLite) {
      const stmt = this.db.prepare(
        `SELECT * FROM ${this.tableName} WHERE file_path = ?`
      );
      return stmt.all(filePath);
    } else {
      return [];
    }
  }

  async deleteChunksByFile(filePath: string): Promise<void> {
    if (this.isSQLite) {
      const stmt = this.db.prepare(
        `DELETE FROM ${this.tableName} WHERE file_path = ?`
      );
      stmt.run(filePath);
    }
  }
}
