// @ts-nocheck
import { Pool } from "pg";
export class ObsidianDatabase {
    pool;
    tableName = "obsidian_chunks";
    dimension = 768;
    constructor(connectionString) {
        this.pool = new Pool({
            connectionString,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
    }
    async initialize() {
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
            console.log(`✅ Obsidian database initialized with table ${this.tableName}`);
        }
        finally {
            client.release();
        }
    }
    async upsertChunk(chunk) {
        if (!chunk.embedding || chunk.embedding.length !== this.dimension) {
            throw new Error(`Embedding dimension mismatch: expected ${this.dimension}, got ${chunk.embedding?.length || 0}`);
        }
        const client = await this.pool.connect();
        try {
            const vectorLiteral = `'[${chunk.embedding.join(",")}]'`;
            await client.query(`
        INSERT INTO ${this.tableName} (id, text, meta, v, updated_at)
        VALUES ($1, $2, $3::jsonb, ${vectorLiteral}::vector, NOW())
        ON CONFLICT (id) DO UPDATE SET 
          text = EXCLUDED.text,
          meta = EXCLUDED.meta,
          v = EXCLUDED.v,
          updated_at = NOW()
      `, [chunk.id, chunk.text, JSON.stringify(chunk.meta)]);
        }
        finally {
            client.release();
        }
    }
    async batchUpsertChunks(chunks) {
        if (chunks.length === 0)
            return;
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            for (const chunk of chunks) {
                await this.upsertChunk(chunk);
            }
            await client.query("COMMIT");
            console.log(`✅ Upserted ${chunks.length} chunks`);
        }
        catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
        finally {
            client.release();
        }
    }
    async search(queryEmbedding, limit = 30, options = {}) {
        if (queryEmbedding.length !== this.dimension) {
            throw new Error(`Query embedding dimension mismatch: expected ${this.dimension}, got ${queryEmbedding.length}`);
        }
        const client = await this.pool.connect();
        try {
            const vectorLiteral = `'[${queryEmbedding.join(",")}]'`;
            let whereClause = "";
            const params = [limit];
            let paramIndex = 2;
            // File type filter
            if (options.fileTypes && options.fileTypes.length > 0) {
                whereClause += ` WHERE meta->>'contentType' = ANY($${paramIndex})`;
                params.push(options.fileTypes);
                paramIndex++;
            }
            // Tags filter
            if (options.tags && options.tags.length > 0) {
                const prefix = whereClause ? " AND " : " WHERE ";
                whereClause += `${prefix} meta->'obsidianFile'->'tags' ?| $${paramIndex}`;
                params.push(options.tags);
                paramIndex++;
            }
            // Folders filter
            if (options.folders && options.folders.length > 0) {
                const prefix = whereClause ? " AND " : " WHERE ";
                whereClause += `${prefix} (`;
                const folderConditions = options.folders.map((_, i) => {
                    const currentParam = paramIndex + i;
                    return `meta->'obsidianFile'->>'filePath' LIKE $${currentParam}`;
                });
                whereClause += folderConditions.join(" OR ");
                whereClause += ")";
                options.folders.forEach((folder) => {
                    params.push(`%${folder}%`);
                });
                paramIndex += options.folders.length;
            }
            // Wikilinks filter
            if (options.hasWikilinks !== undefined) {
                const prefix = whereClause ? " AND " : " WHERE ";
                if (options.hasWikilinks) {
                    whereClause += `${prefix} jsonb_array_length(meta->'obsidianFile'->'wikilinks') > 0`;
                }
                else {
                    whereClause += `${prefix} (meta->'obsidianFile'->'wikilinks' IS NULL OR jsonb_array_length(meta->'obsidianFile'->'wikilinks') = 0)`;
                }
            }
            // Date range filter
            if (options.dateRange) {
                if (options.dateRange.start) {
                    const prefix = whereClause ? " AND " : " WHERE ";
                    whereClause += `${prefix} (meta->>'updatedAt')::timestamp >= $${paramIndex}`;
                    params.push(options.dateRange.start.toISOString());
                    paramIndex++;
                }
                if (options.dateRange.end) {
                    const prefix = whereClause ? " AND " : " WHERE ";
                    whereClause += `${prefix} (meta->>'updatedAt')::timestamp <= $${paramIndex}`;
                    params.push(options.dateRange.end.toISOString());
                    paramIndex++;
                }
            }
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
            let results = result.rows.map((row, index) => ({
                id: row.id,
                text: row.text,
                meta: row.meta,
                cosineSimilarity: parseFloat(row.cosine_similarity),
                rank: index + 1,
            }));
            // Apply minimum similarity filter if specified
            if (options.minSimilarity) {
                results = results.filter((r) => r.cosineSimilarity >= options.minSimilarity);
            }
            return results;
        }
        finally {
            client.release();
        }
    }
    async getChunkById(id) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        SELECT id, text, meta FROM ${this.tableName} WHERE id = $1
      `, [id]);
            if (result.rows.length === 0)
                return null;
            const row = result.rows[0];
            return {
                id: row.id,
                text: row.text,
                meta: row.meta,
            };
        }
        finally {
            client.release();
        }
    }
    async getChunksByFile(fileName) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        SELECT id, text, meta 
        FROM ${this.tableName} 
        WHERE meta->'obsidianFile'->>'fileName' = $1
        ORDER BY (meta->>'chunkIndex')::int ASC
        `, [fileName]);
            return result.rows.map((row) => ({
                id: row.id,
                text: row.text,
                meta: row.meta,
            }));
        }
        finally {
            client.release();
        }
    }
    async getStats() {
        const client = await this.pool.connect();
        try {
            // Total chunks
            const totalResult = await client.query(`SELECT COUNT(*) as count FROM ${this.tableName}`);
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
            const byContentType = {};
            typeResult.rows.forEach((row) => {
                byContentType[row.content_type] = parseInt(row.count);
            });
            const byFolder = {};
            folderResult.rows.forEach((row) => {
                byFolder[row.folder] = parseInt(row.count);
            });
            const tagDistribution = {};
            tagResult.rows.forEach((row) => {
                tagDistribution[row.tag] = parseInt(row.count);
            });
            return {
                totalChunks: parseInt(totalResult.rows[0].count),
                byContentType,
                byFolder,
                tagDistribution,
            };
        }
        finally {
            client.release();
        }
    }
    async clearAll() {
        const client = await this.pool.connect();
        try {
            await client.query(`DELETE FROM ${this.tableName}`);
            console.log(`🗑️  Cleared all data from ${this.tableName}`);
        }
        finally {
            client.release();
        }
    }
    async deleteChunksByFile(fileName) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
        DELETE FROM ${this.tableName}
        WHERE meta->'obsidianFile'->>'fileName' = $1
        `, [fileName]);
            console.log(`🗑️  Deleted ${result.rowCount} chunks for file: ${fileName}`);
        }
        finally {
            client.release();
        }
    }
    async close() {
        await this.pool.end();
    }
}
