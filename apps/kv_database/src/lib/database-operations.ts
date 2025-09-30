import { Pool } from "pg";
import { DocumentChunk, SearchResult } from "../types/index";
import { LoggerFactory } from "./shared/logger";

/**
 * Document chunk operations for vector database
 * @darianrosebrook
 */
export class DocumentOperations {
  private logger = LoggerFactory.create("DocumentOperations");
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

  constructor(pool: Pool, tableName: string = "document_chunks") {
    this.pool = pool;
    this.tableName = tableName;
  }

  async upsertChunk(chunk: DocumentChunk): Promise<void> {
    if (!chunk.embedding || chunk.embedding.length !== this.dimension) {
      throw new Error(
        `Invalid embedding dimension. Expected ${this.dimension}, got ${
          chunk.embedding?.length || 0
        }`
      );
    }

    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO ${this.tableName} (id, text, meta, v, updated_at)
         VALUES ($1, $2, $3, $4::vector, NOW())
         ON CONFLICT (id)
         DO UPDATE SET
           text = EXCLUDED.text,
           meta = EXCLUDED.meta,
           v = EXCLUDED.v,
           updated_at = NOW()`,
        [chunk.id, chunk.text, chunk.meta, chunk.embedding]
      );
    } finally {
      client.release();
    }
  }

  async batchUpsertChunks(chunks: DocumentChunk[]): Promise<void> {
    if (chunks.length === 0) return;

    const client = await this.pool.connect();
    try {
      // Validate all chunks have proper embeddings
      for (const chunk of chunks) {
        if (!chunk.embedding || chunk.embedding.length !== this.dimension) {
          throw new Error(
            `Invalid embedding dimension for chunk ${chunk.id}. Expected ${
              this.dimension
            }, got ${chunk.embedding?.length || 0}`
          );
        }
      }

      // Use batch insert for better performance
      const values = chunks.flatMap((chunk, index) => [
        chunk.id,
        chunk.text,
        chunk.meta,
        chunk.embedding,
        index * 4 + 1,
        index * 4 + 2,
        index * 4 + 3,
        index * 4 + 4,
      ]);

      const placeholders = chunks
        .map(
          (_, i) =>
            `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${
              i * 4 + 4
            }::vector)`
        )
        .join(", ");

      await client.query(
        `INSERT INTO ${this.tableName} (id, text, meta, v)
         VALUES ${placeholders}
         ON CONFLICT (id)
         DO UPDATE SET
           text = EXCLUDED.text,
           meta = EXCLUDED.meta,
           v = EXCLUDED.v,
           updated_at = NOW()`,
        values
      );
    } finally {
      client.release();
    }
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
    const {
      limit = 10,
      threshold = 0.7,
      contentType,
      fileName,
      tags,
      includeMetadata = true,
    } = options;

    if (queryEmbedding.length !== this.dimension) {
      throw new Error(
        `Invalid query embedding dimension. Expected ${this.dimension}, got ${queryEmbedding.length}`
      );
    }

    const startTime = Date.now();
    const client = await this.pool.connect();

    try {
      let whereConditions = [`(1 - (v <=> $1::vector)) >= $2`];
      let params: any[] = [`[${queryEmbedding.join(",")}]`, threshold];
      let paramIndex = 3;

      if (contentType) {
        whereConditions.push(`meta->>'contentType' = $${paramIndex}`);
        params.push(contentType);
        paramIndex++;
      }

      if (fileName) {
        whereConditions.push(
          `meta->'obsidianFile'->>'fileName' = $${paramIndex}`
        );
        params.push(fileName);
        paramIndex++;
      }

      if (tags && tags.length > 0) {
        whereConditions.push(`meta->'obsidianFile'->'tags' ?& $${paramIndex}`);
        params.push(tags);
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
          (1 - (v <=> $1::vector)) as similarity
        FROM ${this.tableName}
        ${whereClause}
        ORDER BY v <=> $1::vector
        LIMIT $${paramIndex}
      `;

      params.push(limit);

      const result = await client.query(query, params);

      const latency = Date.now() - startTime;
      this.recordPerformanceMetric(latency);

      return result.rows.map(
        (row) =>
          ({
            id: row.id,
            title: row.meta?.title || row.meta?.fileName || "Untitled",
            summary:
              row.text?.substring(0, 200) +
              (row.text?.length > 200 ? "..." : ""),
            text: row.text,
            meta: includeMetadata
              ? {
                  contentType: row.meta?.contentType || "text",
                  section: row.meta?.section || "",
                  breadcrumbs: row.meta?.breadcrumbs || [],
                  uri:
                    row.meta?.uri ||
                    `file://${row.meta?.fileName || "unknown"}`,
                }
              : {
                  contentType: row.meta?.contentType || "text",
                  section: row.meta?.section || "",
                  breadcrumbs: row.meta?.breadcrumbs || [],
                  uri:
                    row.meta?.uri ||
                    `file://${row.meta?.fileName || "unknown"}`,
                },
            relevanceScore: row.similarity,
          } as SearchResult)
      );
    } finally {
      client.release();
    }
  }

  async getChunkById(id: string): Promise<DocumentChunk | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT id, text, meta, v FROM ${this.tableName} WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id,
        text: row.text,
        meta: row.meta,
        embedding: row.v,
      };
    } finally {
      client.release();
    }
  }

  async getChunksByFile(fileName: string): Promise<DocumentChunk[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT id, text, meta, v FROM ${this.tableName}
         WHERE meta->'obsidianFile'->>'fileName' = $1
         ORDER BY meta->'obsidianFile'->'chunkIndex'`,
        [fileName]
      );

      return result.rows.map((row) => ({
        id: row.id,
        text: row.text,
        meta: row.meta,
        embedding: row.v,
      }));
    } finally {
      client.release();
    }
  }

  async getStats(): Promise<{
    totalChunks: number;
    totalFiles: number;
    contentTypes: Record<string, number>;
    averageChunkSize: number;
  }> {
    const client = await this.pool.connect();
    try {
      const totalResult = await client.query(
        `SELECT COUNT(*) as count FROM ${this.tableName}`
      );
      const totalChunks = parseInt(totalResult.rows[0].count);

      const filesResult = await client.query(`
        SELECT COUNT(DISTINCT meta->'obsidianFile'->>'fileName') as count
        FROM ${this.tableName}
      `);
      const totalFiles = parseInt(filesResult.rows[0].count);

      const contentTypesResult = await client.query(`
        SELECT meta->>'contentType' as content_type, COUNT(*) as count
        FROM ${this.tableName}
        GROUP BY meta->>'contentType'
      `);

      const contentTypes: Record<string, number> = {};
      for (const row of contentTypesResult.rows) {
        contentTypes[row.content_type] = parseInt(row.count);
      }

      const sizeResult = await client.query(`
        SELECT AVG(LENGTH(text)) as avg_size FROM ${this.tableName}
      `);
      const averageChunkSize = parseInt(sizeResult.rows[0].avg_size) || 0;

      return {
        totalChunks,
        totalFiles,
        contentTypes,
        averageChunkSize,
      };
    } finally {
      client.release();
    }
  }

  async deleteChunksByFile(fileName: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `DELETE FROM ${this.tableName} WHERE meta->'obsidianFile'->>'fileName' = $1`,
        [fileName]
      );
    } finally {
      client.release();
    }
  }

  private recordPerformanceMetric(latency: number): void {
    this.performanceMetrics.searchLatency.push(latency);
    this.performanceMetrics.totalQueries++;

    if (latency > 1000) {
      this.performanceMetrics.slowQueries++;
    }

    // Keep only last 100 measurements
    if (this.performanceMetrics.searchLatency.length > 100) {
      this.performanceMetrics.searchLatency.shift();
    }
  }

  getPerformanceMetrics() {
    const avgLatency =
      this.performanceMetrics.searchLatency.reduce((a, b) => a + b, 0) /
        this.performanceMetrics.searchLatency.length || 0;

    return {
      averageSearchLatency: avgLatency,
      totalQueries: this.performanceMetrics.totalQueries,
      slowQueries: this.performanceMetrics.slowQueries,
      slowQueryPercentage:
        this.performanceMetrics.totalQueries > 0
          ? (this.performanceMetrics.slowQueries /
              this.performanceMetrics.totalQueries) *
            100
          : 0,
    };
  }
}
