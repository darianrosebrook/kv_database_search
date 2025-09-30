import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export class SQLiteTestDatabase {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor(dbPath: string = ':memory:') {
    this.dbPath = dbPath;
  }

  async initialize(): Promise<string> {
    // Create in-memory database or file-based for testing
    this.db = new Database(this.dbPath);

    // Create basic schema for testing
    this.createTables();

    return `sqlite:${this.dbPath}`;
  }

  private createTables(): void {
    if (!this.db) throw new Error('Database not initialized');

    // Create obsidian_chunks table (simplified version)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS obsidian_chunks (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        embedding TEXT, -- JSON array as string
        metadata TEXT, -- JSON as string
        file_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_file_path ON obsidian_chunks(file_path);
      CREATE INDEX IF NOT EXISTS idx_content ON obsidian_chunks(content);
    `);

    // Create vector extension support (simplified)
    this.db.function('vector_distance', (a: string, b: string) => {
      // Simple mock distance function - in real implementation this would use vector extensions
      if (!a || !b) return 1.0;
      try {
        const vecA = JSON.parse(a);
        const vecB = JSON.parse(b);
        if (vecA.length !== vecB.length) return 1.0;

        // Cosine distance (1 - cosine similarity)
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
          dotProduct += vecA[i] * vecB[i];
          normA += vecA[i] * vecA[i];
          normB += vecB[i] * vecB[i];
        }

        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);

        if (normA === 0 || normB === 0) return 1.0;

        const cosineSimilarity = dotProduct / (normA * normB);
        return 1.0 - cosineSimilarity; // Convert to distance
      } catch {
        return 1.0;
      }
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    // Clean up file if it's not in-memory
    if (this.dbPath !== ':memory:' && fs.existsSync(this.dbPath)) {
      try {
        fs.unlinkSync(this.dbPath);
      } catch (error) {
        console.warn('Failed to cleanup test database file:', error);
      }
    }
  }

  // Mock some basic operations for testing
  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    const stmt = this.db.prepare(sql);
    return stmt.all(params);
  }

  async execute(sql: string, params: any[] = []): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const stmt = this.db.prepare(sql);
    stmt.run(params);
  }
}


