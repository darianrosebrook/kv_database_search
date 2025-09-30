/**
 * Simple in-memory database mock for testing
 * Avoids native compilation issues
 */
export class InMemoryTestDatabase {
  private data: Map<string, any> = new Map();
  private idCounter: number = 0;

  constructor(private dbPath: string = ':memory:') {}

  async initialize(): Promise<string> {
    // Initialize in-memory data store
    this.data.clear();
    this.idCounter = 0;
    return `sqlite:${this.dbPath}`;
  }

  async close(): Promise<void> {
    this.data.clear();
    this.idCounter = 0;
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    // Very basic SQL simulation for testing
    if (sql.includes('SELECT COUNT(*) as total_chunks FROM obsidian_chunks')) {
      return [{ total_chunks: this.data.size }];
    }

    if (sql.includes('SELECT * FROM obsidian_chunks WHERE content LIKE')) {
      const searchTerm = params[0]?.replace(/%/g, '') || '';
      const results: any[] = [];
      for (const [id, chunk] of this.data) {
        if (chunk.content?.includes(searchTerm)) {
          results.push(chunk);
        }
      }
      return results.slice(0, params[1] || 10); // LIMIT
    }

    return [];
  }

  async execute(sql: string, params: any[] = []): Promise<void> {
    if (sql.includes('INSERT OR REPLACE INTO obsidian_chunks')) {
      const [id, content, embedding, metadata, file_path] = params;
      this.data.set(id, {
        id,
        content,
        embedding,
        metadata,
        file_path,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }
}


