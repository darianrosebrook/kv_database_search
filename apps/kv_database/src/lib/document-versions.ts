import { Pool } from "pg";
import {
  DocumentVersion,
  FileChangeMetadata,
  ProcessingStatus,
} from "../types/index";
import { LoggerFactory } from "./shared/logger";
import { createHash } from "./utils";

/**
 * Document version and file processing management operations
 * @darianrosebrook
 */
export class DocumentVersionManager {
  private logger = LoggerFactory.create("DocumentVersionManager");
  protected pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createDocumentVersion(
    filePath: string,
    content: string,
    versionNumber: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO document_versions (id, file_path, version_number, content, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (file_path, version_number)
         DO UPDATE SET
           content = EXCLUDED.content,
           metadata = EXCLUDED.metadata,
           created_at = NOW()`,
        [
          `${filePath}#v${versionNumber}`,
          filePath,
          versionNumber,
          content,
          metadata || {},
        ]
      );
    } finally {
      client.release();
    }
  }

  async updateDocumentVersion(
    filePath: string,
    content: string,
    versionNumber: number,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.createDocumentVersion(
      filePath,
      content,
      versionNumber,
      metadata
    );
  }

  async getDocumentVersions(filePath: string): Promise<DocumentVersion[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT
           id,
           file_path as "filePath",
           version_number as "versionNumber",
           content,
           metadata,
           created_at as "createdAt"
         FROM document_versions
         WHERE file_path = $1
         ORDER BY version_number DESC`,
        [filePath]
      );

      return result.rows.map(
        (row) =>
          ({
            versionId: row.id,
            contentHash: this.generateContentHash(row.content),
            embeddingHash: this.generateEmbeddingHash(row.content),
            createdAt: row.createdAt,
            parentVersion: undefined, // TODO: Implement parent version tracking
            changeSummary: `Version ${row.versionNumber}`,
            changeType: "modified",
            metadata: row.metadata || {},
            processingMetadata: {
              processedAt: row.createdAt,
              processor: "obsidian-processor",
              version: "1.0.0",
              parameters: {},
              processingTime: 0,
              success: true,
            },
            chunks: 1, // TODO: Calculate actual chunk count
          } as DocumentVersion)
      );
    } finally {
      client.release();
    }
  }

  async getVersionContent(versionId: string): Promise<{
    content: string;
    metadata: Record<string, unknown>;
  }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT content, metadata FROM document_versions WHERE id = $1`,
        [versionId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Version not found: ${versionId}`);
      }

      const row = result.rows[0];
      return {
        content: row.content,
        metadata: row.metadata || {},
      };
    } finally {
      client.release();
    }
  }

  async getFileChangeHistory(filePath: string): Promise<FileChangeMetadata[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT
           dv.version_number as "versionNumber",
           dv.created_at as "timestamp",
           dv.metadata->>'changeType' as "changeType",
           dv.metadata->>'author' as "author",
           dv.metadata->>'description' as "description"
         FROM document_versions dv
         WHERE dv.file_path = $1
         ORDER BY dv.version_number ASC`,
        [filePath]
      );

      return result.rows.map((row) => ({
        changeType: row.changeType || "modified",
        previousPath: undefined, // TODO: Implement path tracking
        changeTimestamp: row.timestamp,
        changeReason: row.description || "No description",
        version: `v${row.versionNumber}`,
        diffSummary: row.description || "No summary",
        fileHash: this.generateContentHash(""), // TODO: Implement proper file hashing
        embeddingHash: this.generateEmbeddingHash(""), // TODO: Implement proper embedding hashing
      }));
    } finally {
      client.release();
    }
  }

  async recordFileChange(
    filePath: string,
    changeType: string,
    author: string,
    description?: string,
    versionNumber?: number
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Get next version number if not provided
      if (!versionNumber) {
        const maxResult = await client.query(
          `SELECT MAX(version_number) as max_version FROM document_versions WHERE file_path = $1`,
          [filePath]
        );
        versionNumber = (maxResult.rows[0].max_version || 0) + 1;
      }

      await client.query(
        `INSERT INTO document_versions (id, file_path, version_number, content, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          `${filePath}#v${versionNumber}`,
          filePath,
          versionNumber,
          "", // Empty content for change tracking
          {
            changeType,
            author,
            description: description || `File ${changeType}`,
          },
        ]
      );
    } finally {
      client.release();
    }
  }

  async getFileProcessingStatus(
    filePath: string
  ): Promise<ProcessingStatus | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT
           status,
           error_message as "errorMessage",
           processed_at as "processedAt",
           retry_count as "retryCount"
         FROM file_processing_status
         WHERE file_path = $1`,
        [filePath]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        fileId: filePath,
        currentStep: "unknown",
        progress: row.status === "completed" ? 100 : 0,
        estimatedTimeRemaining: 0,
        lastUpdated: row.processedAt || new Date(),
        errors: row.errorMessage ? [row.errorMessage] : [],
        warnings: [],
        startedAt: row.processedAt || new Date(),
        completedAt: row.status === "completed" ? row.processedAt : undefined,
        status: row.status as ProcessingStatus["status"],
      } as ProcessingStatus;
    } finally {
      client.release();
    }
  }

  async updateFileProcessingStatus(
    filePath: string,
    status: ProcessingStatus["status"],
    errorMessage?: string,
    retryCount?: number
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO file_processing_status (file_path, status, error_message, processed_at, retry_count)
         VALUES ($1, $2, $3, NOW(), $4)
         ON CONFLICT (file_path)
         DO UPDATE SET
           status = EXCLUDED.status,
           error_message = EXCLUDED.error_message,
           processed_at = EXCLUDED.processed_at,
           retry_count = EXCLUDED.retry_count`,
        [filePath, status, errorMessage || null, retryCount || 0]
      );
    } finally {
      client.release();
    }
  }

  async cleanupOldVersions(
    filePath: string,
    keepVersions: number = 10
  ): Promise<number> {
    const client = await this.pool.connect();
    try {
      // Delete old versions, keeping the most recent ones
      const result = await client.query(
        `DELETE FROM document_versions
         WHERE file_path = $1
         AND version_number NOT IN (
           SELECT version_number FROM document_versions
           WHERE file_path = $1
           ORDER BY version_number DESC
           LIMIT $2
         )`,
        [filePath, keepVersions]
      );

      return result.rowCount || 0;
    } finally {
      client.release();
    }
  }

  async getFilesByProcessingStatus(status: string): Promise<string[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT file_path FROM file_processing_status WHERE status = $1`,
        [status]
      );

      return result.rows.map((row) => row.file_path);
    } finally {
      client.release();
    }
  }

  async getProcessingStats(): Promise<{
    totalFiles: number;
    byStatus: Record<string, number>;
    errors: number;
    averageProcessingTime: number;
  }> {
    const client = await this.pool.connect();
    try {
      const totalResult = await client.query(
        "SELECT COUNT(*) as count FROM file_processing_status"
      );
      const totalFiles = parseInt(totalResult.rows[0].count);

      const statusResult = await client.query(`
        SELECT status, COUNT(*) as count
        FROM file_processing_status
        GROUP BY status
      `);

      const byStatus: Record<string, number> = {};
      for (const row of statusResult.rows) {
        byStatus[row.status] = parseInt(row.count);
      }

      const errorsResult = await client.query(
        `SELECT COUNT(*) as count FROM file_processing_status WHERE error_message IS NOT NULL`
      );
      const errors = parseInt(errorsResult.rows[0].count);

      const timeResult = await client.query(`
        SELECT AVG(EXTRACT(EPOCH FROM (NOW() - processed_at))) as avg_time
        FROM file_processing_status
        WHERE processed_at IS NOT NULL
      `);
      const averageProcessingTime = parseInt(timeResult.rows[0].avg_time) || 0;

      return {
        totalFiles,
        byStatus,
        errors,
        averageProcessingTime,
      };
    } finally {
      client.release();
    }
  }

  private generateContentHash(content: string): string {
    return createHash("sha256", content);
  }

  private generateEmbeddingHash(content: string): string {
    return createHash("md5", content);
  }
}
