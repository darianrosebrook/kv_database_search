// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { Pool, Client } from "pg";
import { DocumentChunk, SearchResult, DocumentMetadata } from "../types/index.js";
export class ObsidianDatabase {
  private pool: Pool;
  private readonly tableName = stryMutAct_9fa48("0") ? "" : (stryCov_9fa48("0"), "obsidian_chunks");
  private readonly dimension = 768;
  constructor(connectionString: string) {
    if (stryMutAct_9fa48("1")) {
      {}
    } else {
      stryCov_9fa48("1");
      this.pool = new Pool(stryMutAct_9fa48("2") ? {} : (stryCov_9fa48("2"), {
        connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      }));
    }
  }
  async initialize(): Promise<void> {
    if (stryMutAct_9fa48("3")) {
      {}
    } else {
      stryCov_9fa48("3");
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("4")) {
          {}
        } else {
          stryCov_9fa48("4");
          // Enable pgvector extension
          await client.query(stryMutAct_9fa48("5") ? "" : (stryCov_9fa48("5"), "CREATE EXTENSION IF NOT EXISTS vector"));

          // Create table with exact dimension pinned
          await client.query(stryMutAct_9fa48("6") ? `` : (stryCov_9fa48("6"), `
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id TEXT PRIMARY KEY,
          text TEXT NOT NULL,
          meta JSONB NOT NULL,
          v VECTOR(${this.dimension}),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `));

          // Create HNSW index for fast ANN search
          await client.query(stryMutAct_9fa48("7") ? `` : (stryCov_9fa48("7"), `
        CREATE INDEX IF NOT EXISTS ${this.tableName}_hnsw_idx 
        ON ${this.tableName} 
        USING hnsw (v vector_cosine_ops)
      `));

          // Create indexes on Obsidian-specific metadata
          await client.query(stryMutAct_9fa48("8") ? `` : (stryCov_9fa48("8"), `
        CREATE INDEX IF NOT EXISTS ${this.tableName}_file_name_idx 
        ON ${this.tableName} 
        USING BTREE ((meta->'obsidianFile'->>'fileName'))
      `));
          await client.query(stryMutAct_9fa48("9") ? `` : (stryCov_9fa48("9"), `
        CREATE INDEX IF NOT EXISTS ${this.tableName}_content_type_idx 
        ON ${this.tableName} 
        USING BTREE ((meta->>'contentType'))
      `));
          await client.query(stryMutAct_9fa48("10") ? `` : (stryCov_9fa48("10"), `
        CREATE INDEX IF NOT EXISTS ${this.tableName}_tags_idx 
        ON ${this.tableName} 
        USING GIN ((meta->'obsidianFile'->'tags'))
      `));
          await client.query(stryMutAct_9fa48("11") ? `` : (stryCov_9fa48("11"), `
        CREATE INDEX IF NOT EXISTS ${this.tableName}_updated_at_idx 
        ON ${this.tableName} 
        USING BTREE ((meta->>'updatedAt'))
      `));
          console.log(stryMutAct_9fa48("12") ? `` : (stryCov_9fa48("12"), `✅ Obsidian database initialized with table ${this.tableName}`));
        }
      } finally {
        if (stryMutAct_9fa48("13")) {
          {}
        } else {
          stryCov_9fa48("13");
          client.release();
        }
      }
    }
  }
  async upsertChunk(chunk: DocumentChunk): Promise<void> {
    if (stryMutAct_9fa48("14")) {
      {}
    } else {
      stryCov_9fa48("14");
      if (stryMutAct_9fa48("17") ? !chunk.embedding && chunk.embedding.length !== this.dimension : stryMutAct_9fa48("16") ? false : stryMutAct_9fa48("15") ? true : (stryCov_9fa48("15", "16", "17"), (stryMutAct_9fa48("18") ? chunk.embedding : (stryCov_9fa48("18"), !chunk.embedding)) || (stryMutAct_9fa48("20") ? chunk.embedding.length === this.dimension : stryMutAct_9fa48("19") ? false : (stryCov_9fa48("19", "20"), chunk.embedding.length !== this.dimension)))) {
        if (stryMutAct_9fa48("21")) {
          {}
        } else {
          stryCov_9fa48("21");
          throw new Error(stryMutAct_9fa48("22") ? `` : (stryCov_9fa48("22"), `Embedding dimension mismatch: expected ${this.dimension}, got ${stryMutAct_9fa48("25") ? chunk.embedding?.length && 0 : stryMutAct_9fa48("24") ? false : stryMutAct_9fa48("23") ? true : (stryCov_9fa48("23", "24", "25"), (stryMutAct_9fa48("26") ? chunk.embedding.length : (stryCov_9fa48("26"), chunk.embedding?.length)) || 0)}`));
        }
      }
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("27")) {
          {}
        } else {
          stryCov_9fa48("27");
          const vectorLiteral = stryMutAct_9fa48("28") ? `` : (stryCov_9fa48("28"), `'[${chunk.embedding.join(stryMutAct_9fa48("29") ? "" : (stryCov_9fa48("29"), ","))}]'`);
          await client.query(stryMutAct_9fa48("30") ? `` : (stryCov_9fa48("30"), `
        INSERT INTO ${this.tableName} (id, text, meta, v, updated_at)
        VALUES ($1, $2, $3::jsonb, ${vectorLiteral}::vector, NOW())
        ON CONFLICT (id) DO UPDATE SET 
          text = EXCLUDED.text,
          meta = EXCLUDED.meta,
          v = EXCLUDED.v,
          updated_at = NOW()
      `), stryMutAct_9fa48("31") ? [] : (stryCov_9fa48("31"), [chunk.id, chunk.text, JSON.stringify(chunk.meta)]));
        }
      } finally {
        if (stryMutAct_9fa48("32")) {
          {}
        } else {
          stryCov_9fa48("32");
          client.release();
        }
      }
    }
  }
  async batchUpsertChunks(chunks: DocumentChunk[]): Promise<void> {
    if (stryMutAct_9fa48("33")) {
      {}
    } else {
      stryCov_9fa48("33");
      if (stryMutAct_9fa48("36") ? chunks.length !== 0 : stryMutAct_9fa48("35") ? false : stryMutAct_9fa48("34") ? true : (stryCov_9fa48("34", "35", "36"), chunks.length === 0)) return;
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("37")) {
          {}
        } else {
          stryCov_9fa48("37");
          await client.query(stryMutAct_9fa48("38") ? "" : (stryCov_9fa48("38"), "BEGIN"));
          for (const chunk of chunks) {
            if (stryMutAct_9fa48("39")) {
              {}
            } else {
              stryCov_9fa48("39");
              await this.upsertChunk(chunk);
            }
          }
          await client.query(stryMutAct_9fa48("40") ? "" : (stryCov_9fa48("40"), "COMMIT"));
          console.log(stryMutAct_9fa48("41") ? `` : (stryCov_9fa48("41"), `✅ Upserted ${chunks.length} chunks`));
        }
      } catch (error) {
        if (stryMutAct_9fa48("42")) {
          {}
        } else {
          stryCov_9fa48("42");
          await client.query(stryMutAct_9fa48("43") ? "" : (stryCov_9fa48("43"), "ROLLBACK"));
          throw error;
        }
      } finally {
        if (stryMutAct_9fa48("44")) {
          {}
        } else {
          stryCov_9fa48("44");
          client.release();
        }
      }
    }
  }
  async search(queryEmbedding: number[], limit = 30, options: {
    fileTypes?: string[];
    tags?: string[];
    folders?: string[];
    hasWikilinks?: boolean;
    dateRange?: {
      start?: Date;
      end?: Date;
    };
    minSimilarity?: number;
  } = {}): Promise<SearchResult[]> {
    if (stryMutAct_9fa48("45")) {
      {}
    } else {
      stryCov_9fa48("45");
      if (stryMutAct_9fa48("48") ? queryEmbedding.length === this.dimension : stryMutAct_9fa48("47") ? false : stryMutAct_9fa48("46") ? true : (stryCov_9fa48("46", "47", "48"), queryEmbedding.length !== this.dimension)) {
        if (stryMutAct_9fa48("49")) {
          {}
        } else {
          stryCov_9fa48("49");
          throw new Error(stryMutAct_9fa48("50") ? `` : (stryCov_9fa48("50"), `Query embedding dimension mismatch: expected ${this.dimension}, got ${queryEmbedding.length}`));
        }
      }
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("51")) {
          {}
        } else {
          stryCov_9fa48("51");
          const vectorLiteral = stryMutAct_9fa48("52") ? `` : (stryCov_9fa48("52"), `'[${queryEmbedding.join(stryMutAct_9fa48("53") ? "" : (stryCov_9fa48("53"), ","))}]'`);
          let whereClause = stryMutAct_9fa48("54") ? "Stryker was here!" : (stryCov_9fa48("54"), "");
          const params: any[] = stryMutAct_9fa48("55") ? [] : (stryCov_9fa48("55"), [limit]);
          let paramIndex = 2;

          // File type filter
          if (stryMutAct_9fa48("58") ? options.fileTypes || options.fileTypes.length > 0 : stryMutAct_9fa48("57") ? false : stryMutAct_9fa48("56") ? true : (stryCov_9fa48("56", "57", "58"), options.fileTypes && (stryMutAct_9fa48("61") ? options.fileTypes.length <= 0 : stryMutAct_9fa48("60") ? options.fileTypes.length >= 0 : stryMutAct_9fa48("59") ? true : (stryCov_9fa48("59", "60", "61"), options.fileTypes.length > 0)))) {
            if (stryMutAct_9fa48("62")) {
              {}
            } else {
              stryCov_9fa48("62");
              whereClause += stryMutAct_9fa48("63") ? `` : (stryCov_9fa48("63"), ` WHERE meta->>'contentType' = ANY($${paramIndex})`);
              params.push(options.fileTypes);
              stryMutAct_9fa48("64") ? paramIndex-- : (stryCov_9fa48("64"), paramIndex++);
            }
          }

          // Tags filter
          if (stryMutAct_9fa48("67") ? options.tags || options.tags.length > 0 : stryMutAct_9fa48("66") ? false : stryMutAct_9fa48("65") ? true : (stryCov_9fa48("65", "66", "67"), options.tags && (stryMutAct_9fa48("70") ? options.tags.length <= 0 : stryMutAct_9fa48("69") ? options.tags.length >= 0 : stryMutAct_9fa48("68") ? true : (stryCov_9fa48("68", "69", "70"), options.tags.length > 0)))) {
            if (stryMutAct_9fa48("71")) {
              {}
            } else {
              stryCov_9fa48("71");
              const prefix = whereClause ? stryMutAct_9fa48("72") ? "" : (stryCov_9fa48("72"), " AND ") : stryMutAct_9fa48("73") ? "" : (stryCov_9fa48("73"), " WHERE ");
              whereClause += stryMutAct_9fa48("74") ? `` : (stryCov_9fa48("74"), `${prefix} meta->'obsidianFile'->'tags' ?| $${paramIndex}`);
              params.push(options.tags);
              stryMutAct_9fa48("75") ? paramIndex-- : (stryCov_9fa48("75"), paramIndex++);
            }
          }

          // Folders filter
          if (stryMutAct_9fa48("78") ? options.folders || options.folders.length > 0 : stryMutAct_9fa48("77") ? false : stryMutAct_9fa48("76") ? true : (stryCov_9fa48("76", "77", "78"), options.folders && (stryMutAct_9fa48("81") ? options.folders.length <= 0 : stryMutAct_9fa48("80") ? options.folders.length >= 0 : stryMutAct_9fa48("79") ? true : (stryCov_9fa48("79", "80", "81"), options.folders.length > 0)))) {
            if (stryMutAct_9fa48("82")) {
              {}
            } else {
              stryCov_9fa48("82");
              const prefix = whereClause ? stryMutAct_9fa48("83") ? "" : (stryCov_9fa48("83"), " AND ") : stryMutAct_9fa48("84") ? "" : (stryCov_9fa48("84"), " WHERE ");
              whereClause += stryMutAct_9fa48("85") ? `` : (stryCov_9fa48("85"), `${prefix} (`);
              const folderConditions = options.folders.map((_, i) => {
                if (stryMutAct_9fa48("86")) {
                  {}
                } else {
                  stryCov_9fa48("86");
                  const currentParam = stryMutAct_9fa48("87") ? paramIndex - i : (stryCov_9fa48("87"), paramIndex + i);
                  return stryMutAct_9fa48("88") ? `` : (stryCov_9fa48("88"), `meta->'obsidianFile'->>'filePath' LIKE $${currentParam}`);
                }
              });
              stryMutAct_9fa48("89") ? whereClause -= folderConditions.join(" OR ") : (stryCov_9fa48("89"), whereClause += folderConditions.join(stryMutAct_9fa48("90") ? "" : (stryCov_9fa48("90"), " OR ")));
              whereClause += stryMutAct_9fa48("91") ? "" : (stryCov_9fa48("91"), ")");
              options.folders.forEach(folder => {
                if (stryMutAct_9fa48("92")) {
                  {}
                } else {
                  stryCov_9fa48("92");
                  params.push(stryMutAct_9fa48("93") ? `` : (stryCov_9fa48("93"), `%${folder}%`));
                }
              });
              stryMutAct_9fa48("94") ? paramIndex -= options.folders.length : (stryCov_9fa48("94"), paramIndex += options.folders.length);
            }
          }

          // Wikilinks filter
          if (stryMutAct_9fa48("97") ? options.hasWikilinks === undefined : stryMutAct_9fa48("96") ? false : stryMutAct_9fa48("95") ? true : (stryCov_9fa48("95", "96", "97"), options.hasWikilinks !== undefined)) {
            if (stryMutAct_9fa48("98")) {
              {}
            } else {
              stryCov_9fa48("98");
              const prefix = whereClause ? stryMutAct_9fa48("99") ? "" : (stryCov_9fa48("99"), " AND ") : stryMutAct_9fa48("100") ? "" : (stryCov_9fa48("100"), " WHERE ");
              if (stryMutAct_9fa48("102") ? false : stryMutAct_9fa48("101") ? true : (stryCov_9fa48("101", "102"), options.hasWikilinks)) {
                if (stryMutAct_9fa48("103")) {
                  {}
                } else {
                  stryCov_9fa48("103");
                  whereClause += stryMutAct_9fa48("104") ? `` : (stryCov_9fa48("104"), `${prefix} jsonb_array_length(meta->'obsidianFile'->'wikilinks') > 0`);
                }
              } else {
                if (stryMutAct_9fa48("105")) {
                  {}
                } else {
                  stryCov_9fa48("105");
                  whereClause += stryMutAct_9fa48("106") ? `` : (stryCov_9fa48("106"), `${prefix} (meta->'obsidianFile'->'wikilinks' IS NULL OR jsonb_array_length(meta->'obsidianFile'->'wikilinks') = 0)`);
                }
              }
            }
          }

          // Date range filter
          if (stryMutAct_9fa48("108") ? false : stryMutAct_9fa48("107") ? true : (stryCov_9fa48("107", "108"), options.dateRange)) {
            if (stryMutAct_9fa48("109")) {
              {}
            } else {
              stryCov_9fa48("109");
              if (stryMutAct_9fa48("111") ? false : stryMutAct_9fa48("110") ? true : (stryCov_9fa48("110", "111"), options.dateRange.start)) {
                if (stryMutAct_9fa48("112")) {
                  {}
                } else {
                  stryCov_9fa48("112");
                  const prefix = whereClause ? stryMutAct_9fa48("113") ? "" : (stryCov_9fa48("113"), " AND ") : stryMutAct_9fa48("114") ? "" : (stryCov_9fa48("114"), " WHERE ");
                  whereClause += stryMutAct_9fa48("115") ? `` : (stryCov_9fa48("115"), `${prefix} (meta->>'updatedAt')::timestamp >= $${paramIndex}`);
                  params.push(options.dateRange.start.toISOString());
                  stryMutAct_9fa48("116") ? paramIndex-- : (stryCov_9fa48("116"), paramIndex++);
                }
              }
              if (stryMutAct_9fa48("118") ? false : stryMutAct_9fa48("117") ? true : (stryCov_9fa48("117", "118"), options.dateRange.end)) {
                if (stryMutAct_9fa48("119")) {
                  {}
                } else {
                  stryCov_9fa48("119");
                  const prefix = whereClause ? stryMutAct_9fa48("120") ? "" : (stryCov_9fa48("120"), " AND ") : stryMutAct_9fa48("121") ? "" : (stryCov_9fa48("121"), " WHERE ");
                  whereClause += stryMutAct_9fa48("122") ? `` : (stryCov_9fa48("122"), `${prefix} (meta->>'updatedAt')::timestamp <= $${paramIndex}`);
                  params.push(options.dateRange.end.toISOString());
                  stryMutAct_9fa48("123") ? paramIndex-- : (stryCov_9fa48("123"), paramIndex++);
                }
              }
            }
          }
          const query = stryMutAct_9fa48("124") ? `` : (stryCov_9fa48("124"), `
        SELECT 
          id, 
          text, 
          meta, 
          1 - (v <#> ${vectorLiteral}::vector) AS cosine_similarity
        FROM ${this.tableName}
        ${whereClause}
        ORDER BY v <#> ${vectorLiteral}::vector
        LIMIT $1
      `);
          const result = await client.query(query, params);
          let results = result.rows.map(stryMutAct_9fa48("125") ? () => undefined : (stryCov_9fa48("125"), (row, index) => stryMutAct_9fa48("126") ? {} : (stryCov_9fa48("126"), {
            id: row.id,
            text: row.text,
            meta: row.meta as DocumentMetadata,
            cosineSimilarity: parseFloat(row.cosine_similarity),
            rank: stryMutAct_9fa48("127") ? index - 1 : (stryCov_9fa48("127"), index + 1)
          })));

          // Apply minimum similarity filter if specified
          if (stryMutAct_9fa48("129") ? false : stryMutAct_9fa48("128") ? true : (stryCov_9fa48("128", "129"), options.minSimilarity)) {
            if (stryMutAct_9fa48("130")) {
              {}
            } else {
              stryCov_9fa48("130");
              results = stryMutAct_9fa48("131") ? results : (stryCov_9fa48("131"), results.filter(stryMutAct_9fa48("132") ? () => undefined : (stryCov_9fa48("132"), r => stryMutAct_9fa48("136") ? r.cosineSimilarity < options.minSimilarity! : stryMutAct_9fa48("135") ? r.cosineSimilarity > options.minSimilarity! : stryMutAct_9fa48("134") ? false : stryMutAct_9fa48("133") ? true : (stryCov_9fa48("133", "134", "135", "136"), r.cosineSimilarity >= options.minSimilarity!))));
            }
          }
          return results;
        }
      } finally {
        if (stryMutAct_9fa48("137")) {
          {}
        } else {
          stryCov_9fa48("137");
          client.release();
        }
      }
    }
  }
  async getChunkById(id: string): Promise<DocumentChunk | null> {
    if (stryMutAct_9fa48("138")) {
      {}
    } else {
      stryCov_9fa48("138");
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("139")) {
          {}
        } else {
          stryCov_9fa48("139");
          const result = await client.query(stryMutAct_9fa48("140") ? `` : (stryCov_9fa48("140"), `
        SELECT id, text, meta FROM ${this.tableName} WHERE id = $1
      `), stryMutAct_9fa48("141") ? [] : (stryCov_9fa48("141"), [id]));
          if (stryMutAct_9fa48("144") ? result.rows.length !== 0 : stryMutAct_9fa48("143") ? false : stryMutAct_9fa48("142") ? true : (stryCov_9fa48("142", "143", "144"), result.rows.length === 0)) return null;
          const row = result.rows[0];
          return stryMutAct_9fa48("145") ? {} : (stryCov_9fa48("145"), {
            id: row.id,
            text: row.text,
            meta: row.meta as DocumentMetadata
          });
        }
      } finally {
        if (stryMutAct_9fa48("146")) {
          {}
        } else {
          stryCov_9fa48("146");
          client.release();
        }
      }
    }
  }
  async getChunksByFile(fileName: string): Promise<DocumentChunk[]> {
    if (stryMutAct_9fa48("147")) {
      {}
    } else {
      stryCov_9fa48("147");
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("148")) {
          {}
        } else {
          stryCov_9fa48("148");
          const result = await client.query(stryMutAct_9fa48("149") ? `` : (stryCov_9fa48("149"), `
        SELECT id, text, meta 
        FROM ${this.tableName} 
        WHERE meta->'obsidianFile'->>'fileName' = $1
        ORDER BY (meta->>'chunkIndex')::int ASC
        `), stryMutAct_9fa48("150") ? [] : (stryCov_9fa48("150"), [fileName]));
          return result.rows.map(stryMutAct_9fa48("151") ? () => undefined : (stryCov_9fa48("151"), row => stryMutAct_9fa48("152") ? {} : (stryCov_9fa48("152"), {
            id: row.id,
            text: row.text,
            meta: row.meta as DocumentMetadata
          })));
        }
      } finally {
        if (stryMutAct_9fa48("153")) {
          {}
        } else {
          stryCov_9fa48("153");
          client.release();
        }
      }
    }
  }
  async getStats(): Promise<{
    totalChunks: number;
    byContentType: Record<string, number>;
    byFolder: Record<string, number>;
    tagDistribution: Record<string, number>;
  }> {
    if (stryMutAct_9fa48("154")) {
      {}
    } else {
      stryCov_9fa48("154");
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("155")) {
          {}
        } else {
          stryCov_9fa48("155");
          // Total chunks
          const totalResult = await client.query(stryMutAct_9fa48("156") ? `` : (stryCov_9fa48("156"), `SELECT COUNT(*) as count FROM ${this.tableName}`));

          // By content type
          const typeResult = await client.query(stryMutAct_9fa48("157") ? `` : (stryCov_9fa48("157"), `
        SELECT meta->>'contentType' as content_type, COUNT(*) as count 
        FROM ${this.tableName} 
        GROUP BY meta->>'contentType'
      `));

          // By folder (extract from file path)
          const folderResult = await client.query(stryMutAct_9fa48("158") ? `` : (stryCov_9fa48("158"), `
        SELECT 
          CASE 
            WHEN meta->'obsidianFile'->>'filePath' LIKE '%/%' 
            THEN split_part(meta->'obsidianFile'->>'filePath', '/', 1)
            ELSE 'Root'
          END as folder,
          COUNT(*) as count
        FROM ${this.tableName}
        GROUP BY folder
      `));

          // Tag distribution (flatten tags array)
          const tagResult = await client.query(stryMutAct_9fa48("159") ? `` : (stryCov_9fa48("159"), `
        SELECT 
          jsonb_array_elements_text(meta->'obsidianFile'->'tags') as tag,
          COUNT(*) as count
        FROM ${this.tableName}
        WHERE meta->'obsidianFile'->'tags' IS NOT NULL
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 20
      `));
          const byContentType: Record<string, number> = {};
          typeResult.rows.forEach(row => {
            if (stryMutAct_9fa48("160")) {
              {}
            } else {
              stryCov_9fa48("160");
              byContentType[row.content_type] = parseInt(row.count);
            }
          });
          const byFolder: Record<string, number> = {};
          folderResult.rows.forEach(row => {
            if (stryMutAct_9fa48("161")) {
              {}
            } else {
              stryCov_9fa48("161");
              byFolder[row.folder] = parseInt(row.count);
            }
          });
          const tagDistribution: Record<string, number> = {};
          tagResult.rows.forEach(row => {
            if (stryMutAct_9fa48("162")) {
              {}
            } else {
              stryCov_9fa48("162");
              tagDistribution[row.tag] = parseInt(row.count);
            }
          });
          return stryMutAct_9fa48("163") ? {} : (stryCov_9fa48("163"), {
            totalChunks: parseInt(totalResult.rows[0].count),
            byContentType,
            byFolder,
            tagDistribution
          });
        }
      } finally {
        if (stryMutAct_9fa48("164")) {
          {}
        } else {
          stryCov_9fa48("164");
          client.release();
        }
      }
    }
  }
  async clearAll(): Promise<void> {
    if (stryMutAct_9fa48("165")) {
      {}
    } else {
      stryCov_9fa48("165");
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("166")) {
          {}
        } else {
          stryCov_9fa48("166");
          await client.query(stryMutAct_9fa48("167") ? `` : (stryCov_9fa48("167"), `DELETE FROM ${this.tableName}`));
          console.log(stryMutAct_9fa48("168") ? `` : (stryCov_9fa48("168"), `🗑️  Cleared all data from ${this.tableName}`));
        }
      } finally {
        if (stryMutAct_9fa48("169")) {
          {}
        } else {
          stryCov_9fa48("169");
          client.release();
        }
      }
    }
  }
  async deleteChunksByFile(fileName: string): Promise<void> {
    if (stryMutAct_9fa48("170")) {
      {}
    } else {
      stryCov_9fa48("170");
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("171")) {
          {}
        } else {
          stryCov_9fa48("171");
          const result = await client.query(stryMutAct_9fa48("172") ? `` : (stryCov_9fa48("172"), `
        DELETE FROM ${this.tableName}
        WHERE meta->'obsidianFile'->>'fileName' = $1
        `), stryMutAct_9fa48("173") ? [] : (stryCov_9fa48("173"), [fileName]));
          console.log(stryMutAct_9fa48("174") ? `` : (stryCov_9fa48("174"), `🗑️  Deleted ${result.rowCount} chunks for file: ${fileName}`));
        }
      } finally {
        if (stryMutAct_9fa48("175")) {
          {}
        } else {
          stryCov_9fa48("175");
          client.release();
        }
      }
    }
  }
  async close(): Promise<void> {
    if (stryMutAct_9fa48("176")) {
      {}
    } else {
      stryCov_9fa48("176");
      await this.pool.end();
    }
  }
}