import { Pool } from "pg";
import {
  DocumentChunk,
  SearchResult,
  DocumentMetadata,
  ChatSession,
  // ChatMessage, // Unused import
} from "../types/index";

// Extended ChatSession interface for database operations
interface DatabaseChatSession extends ChatSession {
  isPublic?: boolean;
  embedding?: number[];
}

export class DocumentDatabase {
  protected pool: Pool;
  protected readonly tableName: string;
  protected readonly dimension = 768;
  private performanceMetrics: {
    searchLatency: number[];
    totalQueries: number;
    slowQueries: number;
  } = {
    searchLatency: [],
    totalQueries: 0,
    slowQueries: 0,
  };

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
  }

  async initialize(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Enable pgvector extension
      await client.query("CREATE EXTENSION IF NOT EXISTS vector");

      // Create table with exact dimension pinned
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id TEXT PRIMARY KEY,
          text TEXT NOT NULL,
          meta JSONB NOT NULL,
          v VECTOR(${this.dimension}),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create HNSW index for fast ANN search
      await client.query(`
        CREATE INDEX IF NOT EXISTS ${this.tableName}_hnsw_idx
        ON ${this.tableName}
        USING hnsw (v vector_cosine_ops)
      `);

      // Create indexes on Obsidian-specific metadata
      await client.query(`
        CREATE INDEX IF NOT EXISTS ${this.tableName}_file_name_idx
        ON ${this.tableName}
        USING BTREE ((meta->'obsidianFile'->>'fileName'))
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS ${this.tableName}_content_type_idx
        ON ${this.tableName}
        USING BTREE ((meta->>'contentType'))
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS ${this.tableName}_tags_idx
        ON ${this.tableName}
        USING GIN ((meta->'obsidianFile'->'tags'))
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS ${this.tableName}_updated_at_idx
        ON ${this.tableName}
        USING BTREE ((meta->>'updatedAt'))
      `);

      // Create chat sessions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          messages JSONB NOT NULL,
          model TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          user_id TEXT,
          tags TEXT[],
          is_public BOOLEAN DEFAULT FALSE,
          embedding VECTOR(${this.dimension}),
          summary TEXT,
          message_count INTEGER DEFAULT 0,
          total_tokens INTEGER,
          topics TEXT[]
        )
      `);

      // Create indexes for chat sessions
      await client.query(`
        CREATE INDEX IF NOT EXISTS chat_sessions_created_at_idx
        ON chat_sessions (created_at DESC)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx
        ON chat_sessions (user_id)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS chat_sessions_model_idx
        ON chat_sessions (model)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS chat_sessions_hnsw_idx
        ON chat_sessions
        USING hnsw (embedding vector_cosine_ops)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS chat_sessions_topics_idx
        ON chat_sessions USING GIN (topics)
      `);

      console.log(
        `✅ Obsidian database initialized with tables ${this.tableName} and chat_sessions`
      );
    } finally {
      client.release();
    }
  }

  async upsertChunk(chunk: DocumentChunk): Promise<void> {
    if (!chunk.embedding || chunk.embedding.length !== this.dimension) {
      throw new Error(
        `Embedding dimension mismatch: expected ${this.dimension}, got ${
          chunk.embedding?.length || 0
        }`
      );
    }

    const client = await this.pool.connect();
    try {
      const vectorLiteral = `'[${chunk.embedding.join(",")}]'`;

      await client.query(
        `
        INSERT INTO ${this.tableName} (id, text, meta, v, updated_at)
        VALUES ($1, $2, $3::jsonb, ${vectorLiteral}::vector, NOW())
        ON CONFLICT (id) DO UPDATE SET 
          text = EXCLUDED.text,
          meta = EXCLUDED.meta,
          v = EXCLUDED.v,
          updated_at = NOW()
      `,
        [chunk.id, chunk.text, JSON.stringify(chunk.meta)]
      );
    } finally {
      client.release();
    }
  }

  async batchUpsertChunks(chunks: DocumentChunk[]): Promise<void> {
    if (chunks.length === 0) return;

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      for (const chunk of chunks) {
        await this.upsertChunk(chunk);
      }

      await client.query("COMMIT");
      console.log(`✅ Upserted ${chunks.length} chunks`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async search(
    queryEmbedding: number[],
    limit = 30,
    options: {
      fileTypes?: string[];
      tags?: string[];
      folders?: string[];
      hasWikilinks?: boolean;
      dateRange?: { start?: Date; end?: Date };
      minSimilarity?: number;
    } = {}
  ): Promise<SearchResult[]> {
    if (queryEmbedding.length !== this.dimension) {
      throw new Error(
        `Query embedding dimension mismatch: expected ${this.dimension}, got ${queryEmbedding.length}`
      );
    }

    const startTime = performance.now();
    this.performanceMetrics.totalQueries++;

    const client = await this.pool.connect();
    try {
      const vectorLiteral = `'[${queryEmbedding.join(",")}]'`;

      // Build query and parameters in sync
      const whereConditions = [];
      const params: any[] = [limit];
      let paramIndex = 2;

      // File type filter
      if (options.fileTypes && options.fileTypes.length > 0) {
        whereConditions.push(`meta->>'contentType' = ANY($${paramIndex})`);
        params.push(options.fileTypes);
        paramIndex++;
      }

      // Tags filter
      if (options.tags && options.tags.length > 0) {
        whereConditions.push(`meta->'obsidianFile'->'tags' ?| $${paramIndex}`);
        params.push(options.tags);
        paramIndex++;
      }

      // Folders filter
      if (options.folders && options.folders.length > 0) {
        whereConditions.push(`EXISTS (
          SELECT 1 FROM unnest($${paramIndex}::text[]) AS folder_pattern
          WHERE meta->'obsidianFile'->>'filePath' LIKE '%' || folder_pattern || '%'
        )`);
        params.push(options.folders);
        paramIndex++;
      }

      // Wikilinks filter
      if (options.hasWikilinks !== undefined) {
        if (options.hasWikilinks) {
          whereConditions.push(
            `jsonb_array_length(meta->'obsidianFile'->'wikilinks') > 0`
          );
        } else {
          whereConditions.push(
            `meta->'obsidianFile'->'wikilinks' IS NULL OR jsonb_array_length(meta->'obsidianFile'->'wikilinks') = 0`
          );
        }
      }

      // Date range filter
      if (options.dateRange?.start) {
        whereConditions.push(
          `(meta->>'updatedAt')::timestamp >= $${paramIndex}`
        );
        params.push(options.dateRange.start);
        paramIndex++;
      }
      if (options.dateRange?.end) {
        whereConditions.push(
          `(meta->>'updatedAt')::timestamp <= $${paramIndex}`
        );
        params.push(options.dateRange.end);
        paramIndex++;
      }

      // Min similarity filter
      if (options.minSimilarity !== undefined) {
        whereConditions.push(
          `1 - (v <#> ${vectorLiteral}::vector) >= $${paramIndex}`
        );
        params.push(options.minSimilarity);
        paramIndex++;
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      const query = `
        SELECT
          id,
          text,
          meta,
          1 - (v <#> ${vectorLiteral}::vector) AS cosine_similarity
        FROM ${this.tableName}
        ${whereClause}
        ORDER BY v <#> ${vectorLiteral}::vector
        LIMIT $1
      `;

      const result = await client.query(query, params);

      const results = result.rows.map((row, index) => ({
        id: row.id,
        text: row.text,
        meta: row.meta as DocumentMetadata,
        cosineSimilarity: parseFloat(row.cosine_similarity),
        rank: index + 1,
      }));

      // Performance monitoring
      const endTime = performance.now();
      const latency = endTime - startTime;
      this.performanceMetrics.searchLatency.push(latency);

      // Track slow queries (over 500ms target)
      if (latency > 500) {
        this.performanceMetrics.slowQueries++;
        console.warn(
          `⚠️ Slow search query detected: ${latency.toFixed(
            2
          )}ms (target: 500ms)`
        );
      }

      // Keep only last 1000 measurements for memory efficiency
      if (this.performanceMetrics.searchLatency.length > 1000) {
        this.performanceMetrics.searchLatency =
          this.performanceMetrics.searchLatency.slice(-500);
      }

      return results;
    } finally {
      client.release();
    }
  }

  async getChunkById(id: string): Promise<DocumentChunk | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `
        SELECT id, text, meta FROM ${this.tableName} WHERE id = $1
      `,
        [id]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id,
        text: row.text,
        meta: row.meta as DocumentMetadata,
      };
    } finally {
      client.release();
    }
  }

  async getChunksByFile(fileName: string): Promise<DocumentChunk[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `
        SELECT id, text, meta 
        FROM ${this.tableName} 
        WHERE meta->'obsidianFile'->>'fileName' = $1
        ORDER BY (meta->>'chunkIndex')::int ASC
        `,
        [fileName]
      );

      return result.rows.map((row) => ({
        id: row.id,
        text: row.text,
        meta: row.meta as DocumentMetadata,
      }));
    } finally {
      client.release();
    }
  }

  async getStats(): Promise<{
    totalChunks: number;
    byContentType: Record<string, number>;
    byFolder: Record<string, number>;
    tagDistribution: Record<string, number>;
  }> {
    const client = await this.pool.connect();
    try {
      // Total chunks
      const totalResult = await client.query(
        `SELECT COUNT(*) as count FROM ${this.tableName}`
      );

      // By content type
      const typeResult = await client.query(`
        SELECT meta->>'contentType' as content_type, COUNT(*) as count 
        FROM ${this.tableName} 
        GROUP BY meta->>'contentType'
      `);

      // By folder (extract from file path)
      const folderResult = await client.query(`
        SELECT 
          CASE 
            WHEN meta->'obsidianFile'->>'filePath' LIKE '%/%' 
            THEN split_part(meta->'obsidianFile'->>'filePath', '/', 1)
            ELSE 'Root'
          END as folder,
          COUNT(*) as count
        FROM ${this.tableName}
        GROUP BY folder
      `);

      // Tag distribution (flatten tags array)
      const tagResult = await client.query(`
        SELECT 
          jsonb_array_elements_text(meta->'obsidianFile'->'tags') as tag,
          COUNT(*) as count
        FROM ${this.tableName}
        WHERE meta->'obsidianFile'->'tags' IS NOT NULL
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 20
      `);

      const byContentType: Record<string, number> = {};
      typeResult.rows.forEach((row) => {
        byContentType[row.content_type] = parseInt(row.count);
      });

      const byFolder: Record<string, number> = {};
      folderResult.rows.forEach((row) => {
        byFolder[row.folder] = parseInt(row.count);
      });

      const tagDistribution: Record<string, number> = {};
      tagResult.rows.forEach((row) => {
        tagDistribution[row.tag] = parseInt(row.count);
      });

      return {
        totalChunks: parseInt(totalResult.rows[0].count),
        byContentType,
        byFolder,
        tagDistribution,
      };
    } finally {
      client.release();
    }
  }

  async clearAll(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`DELETE FROM ${this.tableName}`);
      console.log(`🗑️  Cleared all data from ${this.tableName}`);
    } finally {
      client.release();
    }
  }

  async deleteChunksByFile(fileName: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `
        DELETE FROM ${this.tableName}
        WHERE meta->'obsidianFile'->>'fileName' = $1
        `,
        [fileName]
      );

      console.log(
        `🗑️  Deleted ${result.rowCount} chunks for file: ${fileName}`
      );
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Get performance metrics for monitoring API latency requirements
   * @returns Performance statistics including p95 latency and slow query count
   */
  getPerformanceMetrics() {
    if (this.performanceMetrics.searchLatency.length === 0) {
      return {
        totalQueries: this.performanceMetrics.totalQueries,
        slowQueries: this.performanceMetrics.slowQueries,
        p95Latency: 0,
        averageLatency: 0,
        minLatency: 0,
        maxLatency: 0,
      };
    }

    const sorted = [...this.performanceMetrics.searchLatency].sort(
      (a, b) => a - b
    );
    const p95Index = Math.floor(sorted.length * 0.95);

    return {
      totalQueries: this.performanceMetrics.totalQueries,
      slowQueries: this.performanceMetrics.slowQueries,
      p95Latency: sorted[p95Index] || 0,
      averageLatency: sorted.reduce((sum, lat) => sum + lat, 0) / sorted.length,
      minLatency: sorted[0],
      maxLatency: sorted[sorted.length - 1],
    };
  }

  // Chat session methods
  async saveChatSession(session: DatabaseChatSession): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `
        INSERT INTO chat_sessions (
          id, title, messages, model, created_at, updated_at,
          user_id, tags, is_public, embedding, summary,
          message_count, total_tokens, topics
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          messages = EXCLUDED.messages,
          updated_at = EXCLUDED.updated_at,
          tags = EXCLUDED.tags,
          summary = EXCLUDED.summary,
          message_count = EXCLUDED.message_count,
          total_tokens = EXCLUDED.total_tokens,
          topics = EXCLUDED.topics
        `,
        [
          session.id,
          session.title,
          JSON.stringify(session.messages),
          session.model,
          session.createdAt,
          session.updatedAt,
          session.userId || null,
          session.tags || [],
          (session as any).isPublic || false,
          (session as any).embedding
            ? `[((session as any).embedding as number[]).join(",")]`
            : null,
          session.summary || null,
          session.messageCount,
          session.totalTokens || null,
          session.topics || [],
        ]
      );

      console.log(`💾 Saved chat session: ${session.title}`);
    } finally {
      client.release();
    }
  }

  async getChatSessions(userId?: string, limit = 50): Promise<ChatSession[]> {
    const client = await this.pool.connect();
    try {
      let query = `
        SELECT * FROM chat_sessions
        WHERE ($1::TEXT IS NULL OR user_id = $1)
        ORDER BY updated_at DESC
        LIMIT $2
      `;
      let params = [userId || null, limit];

      const result = await client.query(query, params);

      return result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        messages: row.messages,
        model: row.model,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        userId: row.user_id,
        tags: row.tags,
        isPublic: row.is_public,
        embedding: row.embedding
          ? row.embedding.slice(1, -1).split(",").map(Number)
          : undefined,
        summary: row.summary,
        messageCount: row.message_count,
        totalTokens: row.total_tokens,
        topics: row.topics,
      }));
    } finally {
      client.release();
    }
  }

  async getChatSessionById(id: string): Promise<DatabaseChatSession | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM chat_sessions WHERE id = $1",
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        messages: row.messages,
        model: row.model,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        userId: row.user_id,
        tags: row.tags,
        isPublic: row.is_public,
        embedding: row.embedding
          ? row.embedding.slice(1, -1).split(",").map(Number)
          : undefined,
        summary: row.summary,
        messageCount: row.message_count,
        totalTokens: row.total_tokens,
        topics: row.topics,
      };
    } finally {
      client.release();
    }
  }

  async searchChatSessions(
    query: string,
    embedding: number[],
    limit = 10
  ): Promise<Array<DatabaseChatSession & { similarity: number }>> {
    const client = await this.pool.connect();
    try {
      // Search using both semantic similarity and text matching
      const result = await client.query(
        `
        SELECT *,
               1 - (embedding <=> $1::VECTOR) as similarity
        FROM chat_sessions
        WHERE embedding IS NOT NULL
        AND (title ILIKE $2 OR summary ILIKE $2)
        ORDER BY similarity DESC, updated_at DESC
        LIMIT $3
        `,
        [`[${embedding.join(",")}]`, `%${query}%`, limit]
      );

      return result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        messages: row.messages,
        model: row.model,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        userId: row.user_id,
        tags: row.tags,
        isPublic: row.is_public,
        embedding: row.embedding
          ? row.embedding.slice(1, -1).split(",").map(Number)
          : undefined,
        summary: row.summary,
        messageCount: row.message_count,
        totalTokens: row.total_tokens,
        topics: row.topics,
        similarity: row.similarity,
      }));
    } finally {
      client.release();
    }
  }

  async deleteChatSession(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("DELETE FROM chat_sessions WHERE id = $1", [id]);
      console.log(`🗑️  Deleted chat session: ${id}`);
    } finally {
      client.release();
    }
  }

  async updateChatSessionTopics(
    sessionId: string,
    topics: string[]
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        "UPDATE chat_sessions SET topics = $1, updated_at = NOW() WHERE id = $2",
        [topics, sessionId]
      );
    } finally {
      client.release();
    }
  }

  async getChatSessionStats(userId?: string): Promise<{
    totalSessions: number;
    totalMessages: number;
    sessionsByModel: Record<string, number>;
    averageMessagesPerSession: number;
    mostActiveDay: string;
  }> {
    const client = await this.pool.connect();
    try {
      let whereClause = "";
      let params: any[] = [];

      if (userId) {
        whereClause = "WHERE user_id = $1";
        params = [userId];
      }

      const result = await client.query(
        `
        SELECT
          COUNT(*) as total_sessions,
          SUM(message_count) as total_messages,
          COUNT(CASE WHEN model = 'llama3.1' THEN 1 END) as llama_sessions,
          COUNT(CASE WHEN model = 'gpt-4' THEN 1 END) as gpt4_sessions,
          AVG(message_count) as avg_messages,
          MODE() WITHIN GROUP (ORDER BY DATE(created_at)) as most_active_day
        FROM chat_sessions
        ${whereClause}
        `,
        params
      );

      const row = result.rows[0];
      return {
        totalSessions: parseInt(row.total_sessions),
        totalMessages: parseInt(row.total_messages),
        sessionsByModel: {
          llama3_1: parseInt(row.llama_sessions || 0),
          gpt4: parseInt(row.gpt4_sessions || 0),
        },
        averageMessagesPerSession: parseFloat(row.avg_messages || 0),
        mostActiveDay: row.most_active_day || "No data",
      };
    } finally {
      client.release();
    }
  }

  // =============================================================================
  // VERSION MANAGEMENT METHODS
  // =============================================================================

  /**
   * Create a new document version
   */
  async createDocumentVersion(filePath: string, version: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO document_versions (
          file_path, version_id, content_hash, embedding_hash,
          created_at, change_summary, change_type, metadata,
          processing_metadata, chunks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          filePath,
          version.versionId,
          version.contentHash,
          version.embeddingHash,
          version.createdAt,
          version.changeSummary,
          version.changeType,
          JSON.stringify(version.metadata || {}),
          JSON.stringify(version.processingMetadata || {}),
          version.chunks || 0,
        ]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Update an existing document version
   */
  async updateDocumentVersion(filePath: string, version: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `UPDATE document_versions SET
          content_hash = $3,
          embedding_hash = $4,
          created_at = $5,
          change_summary = $6,
          change_type = $7,
          metadata = $8,
          processing_metadata = $9,
          chunks = $10
        WHERE file_path = $1 AND version_id = $2`,
        [
          filePath,
          version.versionId,
          version.contentHash,
          version.embeddingHash,
          version.createdAt,
          version.changeSummary,
          version.changeType,
          JSON.stringify(version.metadata || {}),
          JSON.stringify(version.processingMetadata || {}),
          version.chunks || 0,
        ]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Get all versions for a file
   */
  async getDocumentVersions(filePath: string): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM document_versions
         WHERE file_path = $1
         ORDER BY created_at DESC`,
        [filePath]
      );

      return result.rows.map((row) => ({
        versionId: row.version_id,
        contentHash: row.content_hash,
        embeddingHash: row.embedding_hash,
        createdAt: row.created_at,
        changeSummary: row.change_summary,
        changeType: row.change_type,
        metadata: row.metadata || {},
        processingMetadata: row.processing_metadata || {},
        chunks: parseInt(row.chunks || 0),
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get version content by version ID
   */
  async getVersionContent(versionId: string): Promise<{
    content: string;
    contentHash: string;
    embeddingHash: string;
  } | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT dv.*, dc.content
         FROM document_versions dv
         LEFT JOIN document_chunks dc ON dv.file_path = dc.file_name AND dv.version_id = dc.version_id
         WHERE dv.version_id = $1`,
        [versionId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        content: row.content || "",
        contentHash: row.content_hash,
        embeddingHash: row.embedding_hash,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get file change history
   */
  async getFileChangeHistory(filePath: string): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM file_changes
         WHERE file_path = $1
         ORDER BY change_timestamp DESC`,
        [filePath]
      );

      return result.rows.map((row) => ({
        changeType: row.change_type,
        previousPath: row.previous_path,
        changeTimestamp: row.change_timestamp,
        changeReason: row.change_reason,
        version: row.version_id,
        diffSummary: row.diff_summary,
        fileHash: row.file_hash,
        embeddingHash: row.embedding_hash,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Record a file change
   */
  async recordFileChange(
    filePath: string,
    changeType: "created" | "modified" | "deleted" | "moved" | "renamed",
    options: {
      previousPath?: string;
      changeReason?: string;
      version?: string;
      diffSummary?: string;
      fileHash: string;
      embeddingHash?: string;
    }
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO file_changes (
          file_path, change_type, previous_path, change_timestamp,
          change_reason, version_id, diff_summary, file_hash, embedding_hash
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          filePath,
          changeType,
          options.previousPath || null,
          new Date(),
          options.changeReason || null,
          options.version || null,
          options.diffSummary || null,
          options.fileHash,
          options.embeddingHash || null,
        ]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Get processing status for a file
   */
  async getFileProcessingStatus(filePath: string): Promise<any | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM processing_status
         WHERE file_path = $1
         ORDER BY last_updated DESC
         LIMIT 1`,
        [filePath]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        fileId: row.file_path,
        currentStep: row.current_step,
        progress: parseFloat(row.progress),
        estimatedTimeRemaining: parseInt(row.estimated_time_remaining),
        lastUpdated: row.last_updated,
        errors: row.errors || [],
        warnings: row.warnings || [],
        startedAt: row.started_at,
        completedAt: row.completed_at,
        status: row.status,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Update processing status for a file
   */
  async updateFileProcessingStatus(
    filePath: string,
    status: {
      currentStep?: string;
      progress?: number;
      estimatedTimeRemaining?: number;
      errors?: string[];
      warnings?: string[];
      completedAt?: Date;
      status?: "queued" | "processing" | "completed" | "failed" | "cancelled";
    }
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      // First check if a status record exists
      const existing = await client.query(
        `SELECT id FROM processing_status WHERE file_path = $1 ORDER BY last_updated DESC LIMIT 1`,
        [filePath]
      );

      if (existing.rows.length > 0) {
        // Update existing record
        await client.query(
          `UPDATE processing_status SET
            current_step = COALESCE($2, current_step),
            progress = COALESCE($3, progress),
            estimated_time_remaining = COALESCE($4, estimated_time_remaining),
            errors = COALESCE($5, errors),
            warnings = COALESCE($6, warnings),
            completed_at = COALESCE($7, completed_at),
            status = COALESCE($8, status),
            last_updated = $9
          WHERE id = $1`,
          [
            existing.rows[0].id,
            status.currentStep,
            status.progress,
            status.estimatedTimeRemaining,
            status.errors ? JSON.stringify(status.errors) : null,
            status.warnings ? JSON.stringify(status.warnings) : null,
            status.completedAt,
            status.status,
            new Date(),
          ]
        );
      } else {
        // Create new record
        await client.query(
          `INSERT INTO processing_status (
            file_path, current_step, progress, estimated_time_remaining,
            errors, warnings, started_at, status, last_updated
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            filePath,
            status.currentStep || "initializing",
            status.progress || 0,
            status.estimatedTimeRemaining || 0,
            JSON.stringify(status.errors || []),
            JSON.stringify(status.warnings || []),
            new Date(),
            status.status || "processing",
            new Date(),
          ]
        );
      }
    } finally {
      client.release();
    }
  }

  /**
   * Clean up old versions (keep only last N versions per file)
   */
  async cleanupOldVersions(
    filePath: string,
    keepVersions: number = 10
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `DELETE FROM document_versions
         WHERE file_path = $1
         AND version_id NOT IN (
           SELECT version_id FROM document_versions
           WHERE file_path = $1
           ORDER BY created_at DESC
           LIMIT $2
         )`,
        [filePath, keepVersions]
      );
    } finally {
      client.release();
    }
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
