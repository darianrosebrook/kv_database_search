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
import { Pool } from "pg";
import { DocumentChunk, SearchResult, DocumentMetadata, ChatSession, ChatMessage } from "../types/index";
export class ObsidianDatabase {
  private pool: Pool;
  private readonly tableName = stryMutAct_9fa48("231") ? "" : (stryCov_9fa48("231"), "obsidian_chunks");
  private readonly dimension = 768;
  private performanceMetrics: {
    searchLatency: number[];
    totalQueries: number;
    slowQueries: number;
  } = stryMutAct_9fa48("232") ? {} : (stryCov_9fa48("232"), {
    searchLatency: stryMutAct_9fa48("233") ? ["Stryker was here"] : (stryCov_9fa48("233"), []),
    totalQueries: 0,
    slowQueries: 0
  });
  constructor(connectionString: string) {
    if (stryMutAct_9fa48("234")) {
      {}
    } else {
      stryCov_9fa48("234");
      this.pool = new Pool(stryMutAct_9fa48("235") ? {} : (stryCov_9fa48("235"), {
        connectionString,
        max: 20,
        // Increased for better concurrency
        min: 5,
        // Keep minimum connections for faster response
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        allowExitOnIdle: stryMutAct_9fa48("236") ? false : (stryCov_9fa48("236"), true)
      }));
    }
  }
  async initialize(): Promise<void> {
    if (stryMutAct_9fa48("237")) {
      {}
    } else {
      stryCov_9fa48("237");
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("238")) {
          {}
        } else {
          stryCov_9fa48("238");
          // Enable pgvector extension
          await client.query(stryMutAct_9fa48("239") ? "" : (stryCov_9fa48("239"), "CREATE EXTENSION IF NOT EXISTS vector"));

          // Create table with exact dimension pinned
          await client.query(stryMutAct_9fa48("240") ? `` : (stryCov_9fa48("240"), `
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
          await client.query(stryMutAct_9fa48("241") ? `` : (stryCov_9fa48("241"), `
        CREATE INDEX IF NOT EXISTS ${this.tableName}_hnsw_idx
        ON ${this.tableName}
        USING hnsw (v vector_cosine_ops)
      `));

          // Create indexes on Obsidian-specific metadata
          await client.query(stryMutAct_9fa48("242") ? `` : (stryCov_9fa48("242"), `
        CREATE INDEX IF NOT EXISTS ${this.tableName}_file_name_idx
        ON ${this.tableName}
        USING BTREE ((meta->'obsidianFile'->>'fileName'))
      `));
          await client.query(stryMutAct_9fa48("243") ? `` : (stryCov_9fa48("243"), `
        CREATE INDEX IF NOT EXISTS ${this.tableName}_content_type_idx
        ON ${this.tableName}
        USING BTREE ((meta->>'contentType'))
      `));
          await client.query(stryMutAct_9fa48("244") ? `` : (stryCov_9fa48("244"), `
        CREATE INDEX IF NOT EXISTS ${this.tableName}_tags_idx
        ON ${this.tableName}
        USING GIN ((meta->'obsidianFile'->'tags'))
      `));
          await client.query(stryMutAct_9fa48("245") ? `` : (stryCov_9fa48("245"), `
        CREATE INDEX IF NOT EXISTS ${this.tableName}_updated_at_idx
        ON ${this.tableName}
        USING BTREE ((meta->>'updatedAt'))
      `));

          // Create chat sessions table
          await client.query(stryMutAct_9fa48("246") ? `` : (stryCov_9fa48("246"), `
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
      `));

          // Create indexes for chat sessions
          await client.query(stryMutAct_9fa48("247") ? `` : (stryCov_9fa48("247"), `
        CREATE INDEX IF NOT EXISTS chat_sessions_created_at_idx
        ON chat_sessions (created_at DESC)
      `));
          await client.query(stryMutAct_9fa48("248") ? `` : (stryCov_9fa48("248"), `
        CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx
        ON chat_sessions (user_id)
      `));
          await client.query(stryMutAct_9fa48("249") ? `` : (stryCov_9fa48("249"), `
        CREATE INDEX IF NOT EXISTS chat_sessions_model_idx
        ON chat_sessions (model)
      `));
          await client.query(stryMutAct_9fa48("250") ? `` : (stryCov_9fa48("250"), `
        CREATE INDEX IF NOT EXISTS chat_sessions_hnsw_idx
        ON chat_sessions
        USING hnsw (embedding vector_cosine_ops)
      `));
          await client.query(stryMutAct_9fa48("251") ? `` : (stryCov_9fa48("251"), `
        CREATE INDEX IF NOT EXISTS chat_sessions_topics_idx
        ON chat_sessions USING GIN (topics)
      `));
          console.log(stryMutAct_9fa48("252") ? `` : (stryCov_9fa48("252"), `✅ Obsidian database initialized with tables ${this.tableName} and chat_sessions`));
        }
      } finally {
        if (stryMutAct_9fa48("253")) {
          {}
        } else {
          stryCov_9fa48("253");
          client.release();
        }
      }
    }
  }
  async upsertChunk(chunk: DocumentChunk): Promise<void> {
    if (stryMutAct_9fa48("254")) {
      {}
    } else {
      stryCov_9fa48("254");
      if (stryMutAct_9fa48("257") ? !chunk.embedding && chunk.embedding.length !== this.dimension : stryMutAct_9fa48("256") ? false : stryMutAct_9fa48("255") ? true : (stryCov_9fa48("255", "256", "257"), (stryMutAct_9fa48("258") ? chunk.embedding : (stryCov_9fa48("258"), !chunk.embedding)) || (stryMutAct_9fa48("260") ? chunk.embedding.length === this.dimension : stryMutAct_9fa48("259") ? false : (stryCov_9fa48("259", "260"), chunk.embedding.length !== this.dimension)))) {
        if (stryMutAct_9fa48("261")) {
          {}
        } else {
          stryCov_9fa48("261");
          throw new Error(stryMutAct_9fa48("262") ? `` : (stryCov_9fa48("262"), `Embedding dimension mismatch: expected ${this.dimension}, got ${stryMutAct_9fa48("265") ? chunk.embedding?.length && 0 : stryMutAct_9fa48("264") ? false : stryMutAct_9fa48("263") ? true : (stryCov_9fa48("263", "264", "265"), (stryMutAct_9fa48("266") ? chunk.embedding.length : (stryCov_9fa48("266"), chunk.embedding?.length)) || 0)}`));
        }
      }
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("267")) {
          {}
        } else {
          stryCov_9fa48("267");
          const vectorLiteral = stryMutAct_9fa48("268") ? `` : (stryCov_9fa48("268"), `'[${chunk.embedding.join(stryMutAct_9fa48("269") ? "" : (stryCov_9fa48("269"), ","))}]'`);
          await client.query(stryMutAct_9fa48("270") ? `` : (stryCov_9fa48("270"), `
        INSERT INTO ${this.tableName} (id, text, meta, v, updated_at)
        VALUES ($1, $2, $3::jsonb, ${vectorLiteral}::vector, NOW())
        ON CONFLICT (id) DO UPDATE SET 
          text = EXCLUDED.text,
          meta = EXCLUDED.meta,
          v = EXCLUDED.v,
          updated_at = NOW()
      `), stryMutAct_9fa48("271") ? [] : (stryCov_9fa48("271"), [chunk.id, chunk.text, JSON.stringify(chunk.meta)]));
        }
      } finally {
        if (stryMutAct_9fa48("272")) {
          {}
        } else {
          stryCov_9fa48("272");
          client.release();
        }
      }
    }
  }
  async batchUpsertChunks(chunks: DocumentChunk[]): Promise<void> {
    if (stryMutAct_9fa48("273")) {
      {}
    } else {
      stryCov_9fa48("273");
      if (stryMutAct_9fa48("276") ? chunks.length !== 0 : stryMutAct_9fa48("275") ? false : stryMutAct_9fa48("274") ? true : (stryCov_9fa48("274", "275", "276"), chunks.length === 0)) return;
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("277")) {
          {}
        } else {
          stryCov_9fa48("277");
          await client.query(stryMutAct_9fa48("278") ? "" : (stryCov_9fa48("278"), "BEGIN"));
          for (const chunk of chunks) {
            if (stryMutAct_9fa48("279")) {
              {}
            } else {
              stryCov_9fa48("279");
              await this.upsertChunk(chunk);
            }
          }
          await client.query(stryMutAct_9fa48("280") ? "" : (stryCov_9fa48("280"), "COMMIT"));
          console.log(stryMutAct_9fa48("281") ? `` : (stryCov_9fa48("281"), `✅ Upserted ${chunks.length} chunks`));
        }
      } catch (error) {
        if (stryMutAct_9fa48("282")) {
          {}
        } else {
          stryCov_9fa48("282");
          await client.query(stryMutAct_9fa48("283") ? "" : (stryCov_9fa48("283"), "ROLLBACK"));
          throw error;
        }
      } finally {
        if (stryMutAct_9fa48("284")) {
          {}
        } else {
          stryCov_9fa48("284");
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
    if (stryMutAct_9fa48("285")) {
      {}
    } else {
      stryCov_9fa48("285");
      if (stryMutAct_9fa48("288") ? queryEmbedding.length === this.dimension : stryMutAct_9fa48("287") ? false : stryMutAct_9fa48("286") ? true : (stryCov_9fa48("286", "287", "288"), queryEmbedding.length !== this.dimension)) {
        if (stryMutAct_9fa48("289")) {
          {}
        } else {
          stryCov_9fa48("289");
          throw new Error(stryMutAct_9fa48("290") ? `` : (stryCov_9fa48("290"), `Query embedding dimension mismatch: expected ${this.dimension}, got ${queryEmbedding.length}`));
        }
      }
      const startTime = performance.now();
      stryMutAct_9fa48("291") ? this.performanceMetrics.totalQueries-- : (stryCov_9fa48("291"), this.performanceMetrics.totalQueries++);
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("292")) {
          {}
        } else {
          stryCov_9fa48("292");
          const vectorLiteral = stryMutAct_9fa48("293") ? `` : (stryCov_9fa48("293"), `'[${queryEmbedding.join(stryMutAct_9fa48("294") ? "" : (stryCov_9fa48("294"), ","))}]'`);

          // Build query and parameters in sync
          const whereConditions = stryMutAct_9fa48("295") ? ["Stryker was here"] : (stryCov_9fa48("295"), []);
          const params: any[] = stryMutAct_9fa48("296") ? [] : (stryCov_9fa48("296"), [limit]);
          let paramIndex = 2;

          // File type filter
          if (stryMutAct_9fa48("299") ? options.fileTypes || options.fileTypes.length > 0 : stryMutAct_9fa48("298") ? false : stryMutAct_9fa48("297") ? true : (stryCov_9fa48("297", "298", "299"), options.fileTypes && (stryMutAct_9fa48("302") ? options.fileTypes.length <= 0 : stryMutAct_9fa48("301") ? options.fileTypes.length >= 0 : stryMutAct_9fa48("300") ? true : (stryCov_9fa48("300", "301", "302"), options.fileTypes.length > 0)))) {
            if (stryMutAct_9fa48("303")) {
              {}
            } else {
              stryCov_9fa48("303");
              whereConditions.push(stryMutAct_9fa48("304") ? `` : (stryCov_9fa48("304"), `meta->>'contentType' = ANY($${paramIndex})`));
              params.push(options.fileTypes);
              stryMutAct_9fa48("305") ? paramIndex-- : (stryCov_9fa48("305"), paramIndex++);
            }
          }

          // Tags filter
          if (stryMutAct_9fa48("308") ? options.tags || options.tags.length > 0 : stryMutAct_9fa48("307") ? false : stryMutAct_9fa48("306") ? true : (stryCov_9fa48("306", "307", "308"), options.tags && (stryMutAct_9fa48("311") ? options.tags.length <= 0 : stryMutAct_9fa48("310") ? options.tags.length >= 0 : stryMutAct_9fa48("309") ? true : (stryCov_9fa48("309", "310", "311"), options.tags.length > 0)))) {
            if (stryMutAct_9fa48("312")) {
              {}
            } else {
              stryCov_9fa48("312");
              whereConditions.push(stryMutAct_9fa48("313") ? `` : (stryCov_9fa48("313"), `meta->'obsidianFile'->'tags' ?| $${paramIndex}`));
              params.push(options.tags);
              stryMutAct_9fa48("314") ? paramIndex-- : (stryCov_9fa48("314"), paramIndex++);
            }
          }

          // Folders filter
          if (stryMutAct_9fa48("317") ? options.folders || options.folders.length > 0 : stryMutAct_9fa48("316") ? false : stryMutAct_9fa48("315") ? true : (stryCov_9fa48("315", "316", "317"), options.folders && (stryMutAct_9fa48("320") ? options.folders.length <= 0 : stryMutAct_9fa48("319") ? options.folders.length >= 0 : stryMutAct_9fa48("318") ? true : (stryCov_9fa48("318", "319", "320"), options.folders.length > 0)))) {
            if (stryMutAct_9fa48("321")) {
              {}
            } else {
              stryCov_9fa48("321");
              whereConditions.push(stryMutAct_9fa48("322") ? `` : (stryCov_9fa48("322"), `EXISTS (
          SELECT 1 FROM unnest($${paramIndex}::text[]) AS folder_pattern
          WHERE meta->'obsidianFile'->>'filePath' LIKE '%' || folder_pattern || '%'
        )`));
              params.push(options.folders);
              stryMutAct_9fa48("323") ? paramIndex-- : (stryCov_9fa48("323"), paramIndex++);
            }
          }

          // Wikilinks filter
          if (stryMutAct_9fa48("326") ? options.hasWikilinks === undefined : stryMutAct_9fa48("325") ? false : stryMutAct_9fa48("324") ? true : (stryCov_9fa48("324", "325", "326"), options.hasWikilinks !== undefined)) {
            if (stryMutAct_9fa48("327")) {
              {}
            } else {
              stryCov_9fa48("327");
              if (stryMutAct_9fa48("329") ? false : stryMutAct_9fa48("328") ? true : (stryCov_9fa48("328", "329"), options.hasWikilinks)) {
                if (stryMutAct_9fa48("330")) {
                  {}
                } else {
                  stryCov_9fa48("330");
                  whereConditions.push(stryMutAct_9fa48("331") ? `` : (stryCov_9fa48("331"), `jsonb_array_length(meta->'obsidianFile'->'wikilinks') > 0`));
                }
              } else {
                if (stryMutAct_9fa48("332")) {
                  {}
                } else {
                  stryCov_9fa48("332");
                  whereConditions.push(stryMutAct_9fa48("333") ? `` : (stryCov_9fa48("333"), `meta->'obsidianFile'->'wikilinks' IS NULL OR jsonb_array_length(meta->'obsidianFile'->'wikilinks') = 0`));
                }
              }
            }
          }

          // Date range filter
          if (stryMutAct_9fa48("336") ? options.dateRange.start : stryMutAct_9fa48("335") ? false : stryMutAct_9fa48("334") ? true : (stryCov_9fa48("334", "335", "336"), options.dateRange?.start)) {
            if (stryMutAct_9fa48("337")) {
              {}
            } else {
              stryCov_9fa48("337");
              whereConditions.push(stryMutAct_9fa48("338") ? `` : (stryCov_9fa48("338"), `(meta->>'updatedAt')::timestamp >= $${paramIndex}`));
              params.push(options.dateRange.start);
              stryMutAct_9fa48("339") ? paramIndex-- : (stryCov_9fa48("339"), paramIndex++);
            }
          }
          if (stryMutAct_9fa48("342") ? options.dateRange.end : stryMutAct_9fa48("341") ? false : stryMutAct_9fa48("340") ? true : (stryCov_9fa48("340", "341", "342"), options.dateRange?.end)) {
            if (stryMutAct_9fa48("343")) {
              {}
            } else {
              stryCov_9fa48("343");
              whereConditions.push(stryMutAct_9fa48("344") ? `` : (stryCov_9fa48("344"), `(meta->>'updatedAt')::timestamp <= $${paramIndex}`));
              params.push(options.dateRange.end);
              stryMutAct_9fa48("345") ? paramIndex-- : (stryCov_9fa48("345"), paramIndex++);
            }
          }

          // Min similarity filter
          if (stryMutAct_9fa48("348") ? options.minSimilarity === undefined : stryMutAct_9fa48("347") ? false : stryMutAct_9fa48("346") ? true : (stryCov_9fa48("346", "347", "348"), options.minSimilarity !== undefined)) {
            if (stryMutAct_9fa48("349")) {
              {}
            } else {
              stryCov_9fa48("349");
              whereConditions.push(stryMutAct_9fa48("350") ? `` : (stryCov_9fa48("350"), `1 - (v <#> ${vectorLiteral}::vector) >= $${paramIndex}`));
              params.push(options.minSimilarity);
              stryMutAct_9fa48("351") ? paramIndex-- : (stryCov_9fa48("351"), paramIndex++);
            }
          }
          const whereClause = (stryMutAct_9fa48("355") ? whereConditions.length <= 0 : stryMutAct_9fa48("354") ? whereConditions.length >= 0 : stryMutAct_9fa48("353") ? false : stryMutAct_9fa48("352") ? true : (stryCov_9fa48("352", "353", "354", "355"), whereConditions.length > 0)) ? stryMutAct_9fa48("356") ? `` : (stryCov_9fa48("356"), `WHERE ${whereConditions.join(stryMutAct_9fa48("357") ? "" : (stryCov_9fa48("357"), " AND "))}`) : stryMutAct_9fa48("358") ? "Stryker was here!" : (stryCov_9fa48("358"), "");
          const query = stryMutAct_9fa48("359") ? `` : (stryCov_9fa48("359"), `
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
          const results = result.rows.map(stryMutAct_9fa48("360") ? () => undefined : (stryCov_9fa48("360"), (row, index) => stryMutAct_9fa48("361") ? {} : (stryCov_9fa48("361"), {
            id: row.id,
            text: row.text,
            meta: row.meta as DocumentMetadata,
            cosineSimilarity: parseFloat(row.cosine_similarity),
            rank: stryMutAct_9fa48("362") ? index - 1 : (stryCov_9fa48("362"), index + 1)
          })));

          // Performance monitoring
          const endTime = performance.now();
          const latency = stryMutAct_9fa48("363") ? endTime + startTime : (stryCov_9fa48("363"), endTime - startTime);
          this.performanceMetrics.searchLatency.push(latency);

          // Track slow queries (over 500ms target)
          if (stryMutAct_9fa48("367") ? latency <= 500 : stryMutAct_9fa48("366") ? latency >= 500 : stryMutAct_9fa48("365") ? false : stryMutAct_9fa48("364") ? true : (stryCov_9fa48("364", "365", "366", "367"), latency > 500)) {
            if (stryMutAct_9fa48("368")) {
              {}
            } else {
              stryCov_9fa48("368");
              stryMutAct_9fa48("369") ? this.performanceMetrics.slowQueries-- : (stryCov_9fa48("369"), this.performanceMetrics.slowQueries++);
              console.warn(stryMutAct_9fa48("370") ? `` : (stryCov_9fa48("370"), `⚠️ Slow search query detected: ${latency.toFixed(2)}ms (target: 500ms)`));
            }
          }

          // Keep only last 1000 measurements for memory efficiency
          if (stryMutAct_9fa48("374") ? this.performanceMetrics.searchLatency.length <= 1000 : stryMutAct_9fa48("373") ? this.performanceMetrics.searchLatency.length >= 1000 : stryMutAct_9fa48("372") ? false : stryMutAct_9fa48("371") ? true : (stryCov_9fa48("371", "372", "373", "374"), this.performanceMetrics.searchLatency.length > 1000)) {
            if (stryMutAct_9fa48("375")) {
              {}
            } else {
              stryCov_9fa48("375");
              this.performanceMetrics.searchLatency = stryMutAct_9fa48("376") ? this.performanceMetrics.searchLatency : (stryCov_9fa48("376"), this.performanceMetrics.searchLatency.slice(stryMutAct_9fa48("377") ? +500 : (stryCov_9fa48("377"), -500)));
            }
          }
          return results;
        }
      } finally {
        if (stryMutAct_9fa48("378")) {
          {}
        } else {
          stryCov_9fa48("378");
          client.release();
        }
      }
    }
  }
  async getChunkById(id: string): Promise<DocumentChunk | null> {
    if (stryMutAct_9fa48("379")) {
      {}
    } else {
      stryCov_9fa48("379");
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("380")) {
          {}
        } else {
          stryCov_9fa48("380");
          const result = await client.query(stryMutAct_9fa48("381") ? `` : (stryCov_9fa48("381"), `
        SELECT id, text, meta FROM ${this.tableName} WHERE id = $1
      `), stryMutAct_9fa48("382") ? [] : (stryCov_9fa48("382"), [id]));
          if (stryMutAct_9fa48("385") ? result.rows.length !== 0 : stryMutAct_9fa48("384") ? false : stryMutAct_9fa48("383") ? true : (stryCov_9fa48("383", "384", "385"), result.rows.length === 0)) return null;
          const row = result.rows[0];
          return stryMutAct_9fa48("386") ? {} : (stryCov_9fa48("386"), {
            id: row.id,
            text: row.text,
            meta: row.meta as DocumentMetadata
          });
        }
      } finally {
        if (stryMutAct_9fa48("387")) {
          {}
        } else {
          stryCov_9fa48("387");
          client.release();
        }
      }
    }
  }
  async getChunksByFile(fileName: string): Promise<DocumentChunk[]> {
    if (stryMutAct_9fa48("388")) {
      {}
    } else {
      stryCov_9fa48("388");
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("389")) {
          {}
        } else {
          stryCov_9fa48("389");
          const result = await client.query(stryMutAct_9fa48("390") ? `` : (stryCov_9fa48("390"), `
        SELECT id, text, meta 
        FROM ${this.tableName} 
        WHERE meta->'obsidianFile'->>'fileName' = $1
        ORDER BY (meta->>'chunkIndex')::int ASC
        `), stryMutAct_9fa48("391") ? [] : (stryCov_9fa48("391"), [fileName]));
          return result.rows.map(stryMutAct_9fa48("392") ? () => undefined : (stryCov_9fa48("392"), row => stryMutAct_9fa48("393") ? {} : (stryCov_9fa48("393"), {
            id: row.id,
            text: row.text,
            meta: row.meta as DocumentMetadata
          })));
        }
      } finally {
        if (stryMutAct_9fa48("394")) {
          {}
        } else {
          stryCov_9fa48("394");
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
    if (stryMutAct_9fa48("395")) {
      {}
    } else {
      stryCov_9fa48("395");
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("396")) {
          {}
        } else {
          stryCov_9fa48("396");
          // Total chunks
          const totalResult = await client.query(stryMutAct_9fa48("397") ? `` : (stryCov_9fa48("397"), `SELECT COUNT(*) as count FROM ${this.tableName}`));

          // By content type
          const typeResult = await client.query(stryMutAct_9fa48("398") ? `` : (stryCov_9fa48("398"), `
        SELECT meta->>'contentType' as content_type, COUNT(*) as count 
        FROM ${this.tableName} 
        GROUP BY meta->>'contentType'
      `));

          // By folder (extract from file path)
          const folderResult = await client.query(stryMutAct_9fa48("399") ? `` : (stryCov_9fa48("399"), `
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
          const tagResult = await client.query(stryMutAct_9fa48("400") ? `` : (stryCov_9fa48("400"), `
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
            if (stryMutAct_9fa48("401")) {
              {}
            } else {
              stryCov_9fa48("401");
              byContentType[row.content_type] = parseInt(row.count);
            }
          });
          const byFolder: Record<string, number> = {};
          folderResult.rows.forEach(row => {
            if (stryMutAct_9fa48("402")) {
              {}
            } else {
              stryCov_9fa48("402");
              byFolder[row.folder] = parseInt(row.count);
            }
          });
          const tagDistribution: Record<string, number> = {};
          tagResult.rows.forEach(row => {
            if (stryMutAct_9fa48("403")) {
              {}
            } else {
              stryCov_9fa48("403");
              tagDistribution[row.tag] = parseInt(row.count);
            }
          });
          return stryMutAct_9fa48("404") ? {} : (stryCov_9fa48("404"), {
            totalChunks: parseInt(totalResult.rows[0].count),
            byContentType,
            byFolder,
            tagDistribution
          });
        }
      } finally {
        if (stryMutAct_9fa48("405")) {
          {}
        } else {
          stryCov_9fa48("405");
          client.release();
        }
      }
    }
  }
  async clearAll(): Promise<void> {
    if (stryMutAct_9fa48("406")) {
      {}
    } else {
      stryCov_9fa48("406");
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("407")) {
          {}
        } else {
          stryCov_9fa48("407");
          await client.query(stryMutAct_9fa48("408") ? `` : (stryCov_9fa48("408"), `DELETE FROM ${this.tableName}`));
          console.log(stryMutAct_9fa48("409") ? `` : (stryCov_9fa48("409"), `🗑️  Cleared all data from ${this.tableName}`));
        }
      } finally {
        if (stryMutAct_9fa48("410")) {
          {}
        } else {
          stryCov_9fa48("410");
          client.release();
        }
      }
    }
  }
  async deleteChunksByFile(fileName: string): Promise<void> {
    if (stryMutAct_9fa48("411")) {
      {}
    } else {
      stryCov_9fa48("411");
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("412")) {
          {}
        } else {
          stryCov_9fa48("412");
          const result = await client.query(stryMutAct_9fa48("413") ? `` : (stryCov_9fa48("413"), `
        DELETE FROM ${this.tableName}
        WHERE meta->'obsidianFile'->>'fileName' = $1
        `), stryMutAct_9fa48("414") ? [] : (stryCov_9fa48("414"), [fileName]));
          console.log(stryMutAct_9fa48("415") ? `` : (stryCov_9fa48("415"), `🗑️  Deleted ${result.rowCount} chunks for file: ${fileName}`));
        }
      } finally {
        if (stryMutAct_9fa48("416")) {
          {}
        } else {
          stryCov_9fa48("416");
          client.release();
        }
      }
    }
  }
  async close(): Promise<void> {
    if (stryMutAct_9fa48("417")) {
      {}
    } else {
      stryCov_9fa48("417");
      await this.pool.end();
    }
  }

  /**
   * Get performance metrics for monitoring API latency requirements
   * @returns Performance statistics including p95 latency and slow query count
   */
  getPerformanceMetrics() {
    if (stryMutAct_9fa48("418")) {
      {}
    } else {
      stryCov_9fa48("418");
      if (stryMutAct_9fa48("421") ? this.performanceMetrics.searchLatency.length !== 0 : stryMutAct_9fa48("420") ? false : stryMutAct_9fa48("419") ? true : (stryCov_9fa48("419", "420", "421"), this.performanceMetrics.searchLatency.length === 0)) {
        if (stryMutAct_9fa48("422")) {
          {}
        } else {
          stryCov_9fa48("422");
          return stryMutAct_9fa48("423") ? {} : (stryCov_9fa48("423"), {
            totalQueries: this.performanceMetrics.totalQueries,
            slowQueries: this.performanceMetrics.slowQueries,
            p95Latency: 0,
            averageLatency: 0,
            minLatency: 0,
            maxLatency: 0
          });
        }
      }
      const sorted = stryMutAct_9fa48("424") ? [...this.performanceMetrics.searchLatency] : (stryCov_9fa48("424"), (stryMutAct_9fa48("425") ? [] : (stryCov_9fa48("425"), [...this.performanceMetrics.searchLatency])).sort(stryMutAct_9fa48("426") ? () => undefined : (stryCov_9fa48("426"), (a, b) => stryMutAct_9fa48("427") ? a + b : (stryCov_9fa48("427"), a - b))));
      const p95Index = Math.floor(stryMutAct_9fa48("428") ? sorted.length / 0.95 : (stryCov_9fa48("428"), sorted.length * 0.95));
      return stryMutAct_9fa48("429") ? {} : (stryCov_9fa48("429"), {
        totalQueries: this.performanceMetrics.totalQueries,
        slowQueries: this.performanceMetrics.slowQueries,
        p95Latency: stryMutAct_9fa48("432") ? sorted[p95Index] && 0 : stryMutAct_9fa48("431") ? false : stryMutAct_9fa48("430") ? true : (stryCov_9fa48("430", "431", "432"), sorted[p95Index] || 0),
        averageLatency: stryMutAct_9fa48("433") ? sorted.reduce((sum, lat) => sum + lat, 0) * sorted.length : (stryCov_9fa48("433"), sorted.reduce(stryMutAct_9fa48("434") ? () => undefined : (stryCov_9fa48("434"), (sum, lat) => stryMutAct_9fa48("435") ? sum - lat : (stryCov_9fa48("435"), sum + lat)), 0) / sorted.length),
        minLatency: sorted[0],
        maxLatency: sorted[stryMutAct_9fa48("436") ? sorted.length + 1 : (stryCov_9fa48("436"), sorted.length - 1)]
      });
    }
  }

  // Chat session methods
  async saveChatSession(session: ChatSession): Promise<void> {
    if (stryMutAct_9fa48("437")) {
      {}
    } else {
      stryCov_9fa48("437");
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("438")) {
          {}
        } else {
          stryCov_9fa48("438");
          await client.query(stryMutAct_9fa48("439") ? `` : (stryCov_9fa48("439"), `
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
        `), stryMutAct_9fa48("440") ? [] : (stryCov_9fa48("440"), [session.id, session.title, JSON.stringify(session.messages), session.model, session.createdAt, session.updatedAt, stryMutAct_9fa48("443") ? session.userId && null : stryMutAct_9fa48("442") ? false : stryMutAct_9fa48("441") ? true : (stryCov_9fa48("441", "442", "443"), session.userId || null), stryMutAct_9fa48("446") ? session.tags && [] : stryMutAct_9fa48("445") ? false : stryMutAct_9fa48("444") ? true : (stryCov_9fa48("444", "445", "446"), session.tags || (stryMutAct_9fa48("447") ? ["Stryker was here"] : (stryCov_9fa48("447"), []))), stryMutAct_9fa48("450") ? session.isPublic && false : stryMutAct_9fa48("449") ? false : stryMutAct_9fa48("448") ? true : (stryCov_9fa48("448", "449", "450"), session.isPublic || (stryMutAct_9fa48("451") ? true : (stryCov_9fa48("451"), false))), session.embedding ? stryMutAct_9fa48("452") ? `` : (stryCov_9fa48("452"), `[${session.embedding.join(stryMutAct_9fa48("453") ? "" : (stryCov_9fa48("453"), ","))}]`) : null, stryMutAct_9fa48("456") ? session.summary && null : stryMutAct_9fa48("455") ? false : stryMutAct_9fa48("454") ? true : (stryCov_9fa48("454", "455", "456"), session.summary || null), session.messageCount, stryMutAct_9fa48("459") ? session.totalTokens && null : stryMutAct_9fa48("458") ? false : stryMutAct_9fa48("457") ? true : (stryCov_9fa48("457", "458", "459"), session.totalTokens || null), stryMutAct_9fa48("462") ? session.topics && [] : stryMutAct_9fa48("461") ? false : stryMutAct_9fa48("460") ? true : (stryCov_9fa48("460", "461", "462"), session.topics || (stryMutAct_9fa48("463") ? ["Stryker was here"] : (stryCov_9fa48("463"), [])))]));
          console.log(stryMutAct_9fa48("464") ? `` : (stryCov_9fa48("464"), `💾 Saved chat session: ${session.title}`));
        }
      } finally {
        if (stryMutAct_9fa48("465")) {
          {}
        } else {
          stryCov_9fa48("465");
          client.release();
        }
      }
    }
  }
  async getChatSessions(userId?: string, limit = 50): Promise<ChatSession[]> {
    if (stryMutAct_9fa48("466")) {
      {}
    } else {
      stryCov_9fa48("466");
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("467")) {
          {}
        } else {
          stryCov_9fa48("467");
          let query = stryMutAct_9fa48("468") ? `` : (stryCov_9fa48("468"), `
        SELECT * FROM chat_sessions
        WHERE ($1::TEXT IS NULL OR user_id = $1)
        ORDER BY updated_at DESC
        LIMIT $2
      `);
          let params = stryMutAct_9fa48("469") ? [] : (stryCov_9fa48("469"), [stryMutAct_9fa48("472") ? userId && null : stryMutAct_9fa48("471") ? false : stryMutAct_9fa48("470") ? true : (stryCov_9fa48("470", "471", "472"), userId || null), limit]);
          const result = await client.query(query, params);
          return result.rows.map(stryMutAct_9fa48("473") ? () => undefined : (stryCov_9fa48("473"), row => stryMutAct_9fa48("474") ? {} : (stryCov_9fa48("474"), {
            id: row.id,
            title: row.title,
            messages: row.messages,
            model: row.model,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            userId: row.user_id,
            tags: row.tags,
            isPublic: row.is_public,
            embedding: row.embedding ? stryMutAct_9fa48("475") ? row.embedding.split(",").map(Number) : (stryCov_9fa48("475"), row.embedding.slice(1, stryMutAct_9fa48("476") ? +1 : (stryCov_9fa48("476"), -1)).split(stryMutAct_9fa48("477") ? "" : (stryCov_9fa48("477"), ",")).map(Number)) : undefined,
            summary: row.summary,
            messageCount: row.message_count,
            totalTokens: row.total_tokens,
            topics: row.topics
          })));
        }
      } finally {
        if (stryMutAct_9fa48("478")) {
          {}
        } else {
          stryCov_9fa48("478");
          client.release();
        }
      }
    }
  }
  async getChatSessionById(id: string): Promise<ChatSession | null> {
    if (stryMutAct_9fa48("479")) {
      {}
    } else {
      stryCov_9fa48("479");
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("480")) {
          {}
        } else {
          stryCov_9fa48("480");
          const result = await client.query(stryMutAct_9fa48("481") ? "" : (stryCov_9fa48("481"), "SELECT * FROM chat_sessions WHERE id = $1"), stryMutAct_9fa48("482") ? [] : (stryCov_9fa48("482"), [id]));
          if (stryMutAct_9fa48("485") ? result.rows.length !== 0 : stryMutAct_9fa48("484") ? false : stryMutAct_9fa48("483") ? true : (stryCov_9fa48("483", "484", "485"), result.rows.length === 0)) {
            if (stryMutAct_9fa48("486")) {
              {}
            } else {
              stryCov_9fa48("486");
              return null;
            }
          }
          const row = result.rows[0];
          return stryMutAct_9fa48("487") ? {} : (stryCov_9fa48("487"), {
            id: row.id,
            title: row.title,
            messages: row.messages,
            model: row.model,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            userId: row.user_id,
            tags: row.tags,
            isPublic: row.is_public,
            embedding: row.embedding ? stryMutAct_9fa48("488") ? row.embedding.split(",").map(Number) : (stryCov_9fa48("488"), row.embedding.slice(1, stryMutAct_9fa48("489") ? +1 : (stryCov_9fa48("489"), -1)).split(stryMutAct_9fa48("490") ? "" : (stryCov_9fa48("490"), ",")).map(Number)) : undefined,
            summary: row.summary,
            messageCount: row.message_count,
            totalTokens: row.total_tokens,
            topics: row.topics
          });
        }
      } finally {
        if (stryMutAct_9fa48("491")) {
          {}
        } else {
          stryCov_9fa48("491");
          client.release();
        }
      }
    }
  }
  async searchChatSessions(query: string, embedding: number[], limit = 10): Promise<Array<ChatSession & {
    similarity: number;
  }>> {
    if (stryMutAct_9fa48("492")) {
      {}
    } else {
      stryCov_9fa48("492");
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("493")) {
          {}
        } else {
          stryCov_9fa48("493");
          // Search using both semantic similarity and text matching
          const result = await client.query(stryMutAct_9fa48("494") ? `` : (stryCov_9fa48("494"), `
        SELECT *,
               1 - (embedding <=> $1::VECTOR) as similarity
        FROM chat_sessions
        WHERE embedding IS NOT NULL
        AND (title ILIKE $2 OR summary ILIKE $2)
        ORDER BY similarity DESC, updated_at DESC
        LIMIT $3
        `), stryMutAct_9fa48("495") ? [] : (stryCov_9fa48("495"), [stryMutAct_9fa48("496") ? `` : (stryCov_9fa48("496"), `[${embedding.join(stryMutAct_9fa48("497") ? "" : (stryCov_9fa48("497"), ","))}]`), stryMutAct_9fa48("498") ? `` : (stryCov_9fa48("498"), `%${query}%`), limit]));
          return result.rows.map(stryMutAct_9fa48("499") ? () => undefined : (stryCov_9fa48("499"), row => stryMutAct_9fa48("500") ? {} : (stryCov_9fa48("500"), {
            id: row.id,
            title: row.title,
            messages: row.messages,
            model: row.model,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            userId: row.user_id,
            tags: row.tags,
            isPublic: row.is_public,
            embedding: row.embedding ? stryMutAct_9fa48("501") ? row.embedding.split(",").map(Number) : (stryCov_9fa48("501"), row.embedding.slice(1, stryMutAct_9fa48("502") ? +1 : (stryCov_9fa48("502"), -1)).split(stryMutAct_9fa48("503") ? "" : (stryCov_9fa48("503"), ",")).map(Number)) : undefined,
            summary: row.summary,
            messageCount: row.message_count,
            totalTokens: row.total_tokens,
            topics: row.topics,
            similarity: row.similarity
          })));
        }
      } finally {
        if (stryMutAct_9fa48("504")) {
          {}
        } else {
          stryCov_9fa48("504");
          client.release();
        }
      }
    }
  }
  async deleteChatSession(id: string): Promise<void> {
    if (stryMutAct_9fa48("505")) {
      {}
    } else {
      stryCov_9fa48("505");
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("506")) {
          {}
        } else {
          stryCov_9fa48("506");
          await client.query(stryMutAct_9fa48("507") ? "" : (stryCov_9fa48("507"), "DELETE FROM chat_sessions WHERE id = $1"), stryMutAct_9fa48("508") ? [] : (stryCov_9fa48("508"), [id]));
          console.log(stryMutAct_9fa48("509") ? `` : (stryCov_9fa48("509"), `🗑️  Deleted chat session: ${id}`));
        }
      } finally {
        if (stryMutAct_9fa48("510")) {
          {}
        } else {
          stryCov_9fa48("510");
          client.release();
        }
      }
    }
  }
  async updateChatSessionTopics(sessionId: string, topics: string[]): Promise<void> {
    if (stryMutAct_9fa48("511")) {
      {}
    } else {
      stryCov_9fa48("511");
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("512")) {
          {}
        } else {
          stryCov_9fa48("512");
          await client.query(stryMutAct_9fa48("513") ? "" : (stryCov_9fa48("513"), "UPDATE chat_sessions SET topics = $1, updated_at = NOW() WHERE id = $2"), stryMutAct_9fa48("514") ? [] : (stryCov_9fa48("514"), [topics, sessionId]));
        }
      } finally {
        if (stryMutAct_9fa48("515")) {
          {}
        } else {
          stryCov_9fa48("515");
          client.release();
        }
      }
    }
  }
  async getChatSessionStats(userId?: string): Promise<{
    totalSessions: number;
    totalMessages: number;
    sessionsByModel: Record<string, number>;
    averageMessagesPerSession: number;
    mostActiveDay: string;
  }> {
    if (stryMutAct_9fa48("516")) {
      {}
    } else {
      stryCov_9fa48("516");
      const client = await this.pool.connect();
      try {
        if (stryMutAct_9fa48("517")) {
          {}
        } else {
          stryCov_9fa48("517");
          let whereClause = stryMutAct_9fa48("518") ? "Stryker was here!" : (stryCov_9fa48("518"), "");
          let params: any[] = stryMutAct_9fa48("519") ? ["Stryker was here"] : (stryCov_9fa48("519"), []);
          if (stryMutAct_9fa48("521") ? false : stryMutAct_9fa48("520") ? true : (stryCov_9fa48("520", "521"), userId)) {
            if (stryMutAct_9fa48("522")) {
              {}
            } else {
              stryCov_9fa48("522");
              whereClause = stryMutAct_9fa48("523") ? "" : (stryCov_9fa48("523"), "WHERE user_id = $1");
              params = stryMutAct_9fa48("524") ? [] : (stryCov_9fa48("524"), [userId]);
            }
          }
          const result = await client.query(stryMutAct_9fa48("525") ? `` : (stryCov_9fa48("525"), `
        SELECT
          COUNT(*) as total_sessions,
          SUM(message_count) as total_messages,
          COUNT(CASE WHEN model = 'llama3.1' THEN 1 END) as llama_sessions,
          COUNT(CASE WHEN model = 'gpt-4' THEN 1 END) as gpt4_sessions,
          AVG(message_count) as avg_messages,
          MODE() WITHIN GROUP (ORDER BY DATE(created_at)) as most_active_day
        FROM chat_sessions
        ${whereClause}
        `), params);
          const row = result.rows[0];
          return stryMutAct_9fa48("526") ? {} : (stryCov_9fa48("526"), {
            totalSessions: parseInt(row.total_sessions),
            totalMessages: parseInt(row.total_messages),
            sessionsByModel: stryMutAct_9fa48("527") ? {} : (stryCov_9fa48("527"), {
              llama3_1: parseInt(stryMutAct_9fa48("530") ? row.llama_sessions && 0 : stryMutAct_9fa48("529") ? false : stryMutAct_9fa48("528") ? true : (stryCov_9fa48("528", "529", "530"), row.llama_sessions || 0)),
              gpt4: parseInt(stryMutAct_9fa48("533") ? row.gpt4_sessions && 0 : stryMutAct_9fa48("532") ? false : stryMutAct_9fa48("531") ? true : (stryCov_9fa48("531", "532", "533"), row.gpt4_sessions || 0))
            }),
            averageMessagesPerSession: parseFloat(stryMutAct_9fa48("536") ? row.avg_messages && 0 : stryMutAct_9fa48("535") ? false : stryMutAct_9fa48("534") ? true : (stryCov_9fa48("534", "535", "536"), row.avg_messages || 0)),
            mostActiveDay: stryMutAct_9fa48("539") ? row.most_active_day && "No data" : stryMutAct_9fa48("538") ? false : stryMutAct_9fa48("537") ? true : (stryCov_9fa48("537", "538", "539"), row.most_active_day || (stryMutAct_9fa48("540") ? "" : (stryCov_9fa48("540"), "No data")))
          });
        }
      } finally {
        if (stryMutAct_9fa48("541")) {
          {}
        } else {
          stryCov_9fa48("541");
          client.release();
        }
      }
    }
  }
}