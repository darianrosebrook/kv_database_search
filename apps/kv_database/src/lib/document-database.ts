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
      max: 20, // Increased for better concurrency
      min: 5, // Keep minimum connections for faster response
      idleTimeoutMillis: 30000,
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
      contentType?: string;
      fileName?: string;
      tags?: string[];
      includeMetadata?: boolean;
    } = {}
  ): Promise<SearchResult[]> {
    return this.documentOps.search(queryEmbedding, options);
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
    retryCount?: number
  ): Promise<void> {
    return this.versionManager.updateFileProcessingStatus(
      filePath,
      status,
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
}

/**
 * Backward compatibility class for Obsidian-specific usage
 * @deprecated Use DocumentDatabase instead
 */
export class ObsidianDatabase extends DocumentDatabase {
  constructor(connectionString: string) {
    super(connectionString, "obsidian_chunks");
  }
}
