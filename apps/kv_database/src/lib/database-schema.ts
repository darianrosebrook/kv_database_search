import { Pool } from "pg";
import { LoggerFactory } from "./shared/logger";

/**
 * Database schema initialization and management utilities
 * @darianrosebrook
 */
export class DatabaseSchemaManager {
  private logger = LoggerFactory.create("DatabaseSchemaManager");
  protected pool: Pool;
  protected readonly tableName: string;
  protected readonly dimension = 768;

  constructor(pool: Pool, tableName: string = "document_chunks") {
    this.pool = pool;
    this.tableName = tableName;
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
          summary TEXT,
          topics TEXT[],
          user_id TEXT,
          is_public BOOLEAN DEFAULT FALSE,
          embedding VECTOR(${this.dimension}),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create chat sessions indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx
        ON chat_sessions (user_id)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS chat_sessions_updated_at_idx
        ON chat_sessions (updated_at DESC)
      `);

      // Create document versions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS document_versions (
          id TEXT PRIMARY KEY,
          file_path TEXT NOT NULL,
          version_number INTEGER NOT NULL,
          content TEXT NOT NULL,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(file_path, version_number)
        )
      `);

      // Create document versions indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS document_versions_file_path_idx
        ON document_versions (file_path)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS document_versions_created_at_idx
        ON document_versions (created_at DESC)
      `);

      // Create file processing status table
      await client.query(`
        CREATE TABLE IF NOT EXISTS file_processing_status (
          file_path TEXT PRIMARY KEY,
          status TEXT NOT NULL,
          error_message TEXT,
          processed_at TIMESTAMP DEFAULT NOW(),
          retry_count INTEGER DEFAULT 0
        )
      `);

      // Create workspaces table
      await client.query(`
        CREATE TABLE IF NOT EXISTS workspaces (
          name TEXT PRIMARY KEY,
          description TEXT,
          config JSONB,
          created_by TEXT DEFAULT 'system',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      this.logger.info(
        `Database schema initialized for table: ${this.tableName}`
      );
    } finally {
      client.release();
    }
  }

  async clearAll(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`DROP TABLE IF EXISTS ${this.tableName}`);
      await client.query("DROP TABLE IF EXISTS chat_sessions");
      await client.query("DROP TABLE IF EXISTS document_versions");
      await client.query("DROP TABLE IF EXISTS file_processing_status");
      await client.query("DROP TABLE IF EXISTS workspaces");
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
