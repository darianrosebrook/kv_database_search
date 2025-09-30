import { Pool } from "pg";
import { Workspace } from "./workspace-manager";
import { LoggerFactory } from "./shared/logger";

/**
 * Workspace management operations
 * @darianrosebrook
 */
export class WorkspaceManager {
  private logger = LoggerFactory.create("WorkspaceManager");
  protected pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async saveWorkspace(workspace: Workspace): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO workspaces (name, description, configuration, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (name)
         DO UPDATE SET
           description = EXCLUDED.description,
           configuration = EXCLUDED.configuration,
           created_by = EXCLUDED.created_by,
           updated_at = NOW()`,
        [
          workspace.name,
          workspace.description,
          workspace.configuration || {},
          workspace.metadata?.createdBy || "system",
        ]
      );
    } finally {
      client.release();
    }
  }

  async loadWorkspace(name: string): Promise<Workspace | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT
           name,
           description,
           configuration,
           created_by as "createdBy",
           created_at as "createdAt",
           updated_at as "updatedAt"
         FROM workspaces
         WHERE name = $1`,
        [name]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.name, // Use name as id for now
        name: row.name,
        description: row.description,
        type: {
          category: "personal",
          subtype: "default",
          scope: "private",
          domain: "general",
          restrictions: [],
        },
        status: {
          current: "active",
          lastActivity: row.updatedAt,
          healthScore: 100,
          issues: [],
          uptime: Date.now() - row.createdAt.getTime(),
          errorCount: 0,
        },
        configuration: row.configuration || {},
        metadata: {
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          size: 0, // TODO: Calculate actual size
          fileCount: 0, // TODO: Calculate actual file count
        },
        permissions: {
          read: ["*"],
          write: ["system"],
          admin: ["system"],
        },
        dataSources: [], // TODO: Implement data source tracking
        entityMappings: [], // TODO: Implement entity mapping tracking
        statistics: {
          totalDocuments: 0, // TODO: Calculate actual count
          totalChunks: 0, // TODO: Calculate actual count
          totalSize: 0, // TODO: Calculate actual size
          lastIndexed: row.updatedAt,
        },
      };
    } finally {
      client.release();
    }
  }

  async loadAllWorkspaces(): Promise<Workspace[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT
           name,
           description,
           configuration as config,
           created_at as "createdAt",
           updated_at as "updatedAt"
         FROM workspaces
         ORDER BY updated_at DESC`
      );

      return result.rows.map((row) => ({
        id: row.name, // Use name as id for now
        name: row.name,
        description: row.description,
        type: {
          category: "personal",
          subtype: "default",
          scope: "private",
          domain: "general",
          restrictions: [],
        },
        status: {
          current: "active",
          lastActivity: row.updatedAt,
          healthScore: 100,
          issues: [],
          uptime: Date.now() - row.createdAt.getTime(),
          errorCount: 0,
        },
        configuration: row.configuration || {},
        metadata: {
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          size: 0, // TODO: Calculate actual size
          fileCount: 0, // TODO: Calculate actual file count
        },
        permissions: {
          read: ["*"],
          write: ["system"],
          admin: ["system"],
        },
        dataSources: [], // TODO: Implement data source tracking
        entityMappings: [], // TODO: Implement entity mapping tracking
        statistics: {
          totalDocuments: 0, // TODO: Calculate actual count
          totalChunks: 0, // TODO: Calculate actual count
          totalSize: 0, // TODO: Calculate actual size
          lastIndexed: row.updatedAt,
        },
      }));
    } finally {
      client.release();
    }
  }

  async deleteWorkspace(name: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        "DELETE FROM workspaces WHERE name = $1",
        [name]
      );
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  async workspaceExists(name: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        "SELECT 1 FROM workspaces WHERE name = $1",
        [name]
      );
      return result.rows.length > 0;
    } finally {
      client.release();
    }
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
    const client = await this.pool.connect();
    try {
      let whereClause = "";
      let params: any[] = [];
      let paramIndex = 1;

      if (since) {
        whereClause = `WHERE meta->>'updatedAt' >= $${paramIndex}`;
        params.push(since.toISOString());
        paramIndex++;
      }

      const query = `
        SELECT
          meta->'obsidianFile'->>'fileName' as file_name,
          meta->>'contentType' as content_type,
          meta->>'updatedAt' as last_modified,
          COUNT(*) as chunk_count
        FROM document_chunks
        ${whereClause}
        GROUP BY meta->'obsidianFile'->>'fileName', meta->>'contentType', meta->>'updatedAt'
        ORDER BY MAX((meta->>'updatedAt')::timestamp) DESC
        LIMIT $${paramIndex}
      `;

      params.push(limit);

      const result = await client.query(query, params);

      return result.rows.map((row) => ({
        fileName: row.file_name,
        contentType: row.content_type,
        lastModified: new Date(row.last_modified),
        chunkCount: parseInt(row.chunk_count),
      }));
    } finally {
      client.release();
    }
  }

  async getWorkspaceStats(): Promise<{
    totalWorkspaces: number;
    totalDocuments: number;
    totalChunks: number;
    averageChunksPerDocument: number;
  }> {
    const client = await this.pool.connect();
    try {
      const workspaceResult = await client.query(
        "SELECT COUNT(*) as count FROM workspaces"
      );
      const totalWorkspaces = parseInt(workspaceResult.rows[0].count);

      const documentResult = await client.query(`
        SELECT COUNT(DISTINCT meta->'obsidianFile'->>'fileName') as count
        FROM document_chunks
      `);
      const totalDocuments = parseInt(documentResult.rows[0].count);

      const chunkResult = await client.query(
        "SELECT COUNT(*) as count FROM document_chunks"
      );
      const totalChunks = parseInt(chunkResult.rows[0].count);

      const averageChunksPerDocument =
        totalDocuments > 0 ? totalChunks / totalDocuments : 0;

      return {
        totalWorkspaces,
        totalDocuments,
        totalChunks,
        averageChunksPerDocument,
      };
    } finally {
      client.release();
    }
  }
}
