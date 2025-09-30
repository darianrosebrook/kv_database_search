import { Pool } from "pg";
import { ChatSession } from "../types/index";

/**
 * Extended ChatSession interface for database operations
 */
interface DatabaseChatSession extends ChatSession {
  isPublic?: boolean;
  embedding?: number[];
}

/**
 * Chat session management operations
 * @darianrosebrook
 */
export class ChatSessionManager {
  protected pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async saveChatSession(session: DatabaseChatSession): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO chat_sessions (id, title, summary, topics, user_id, is_public, embedding, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::vector, NOW())
         ON CONFLICT (id)
         DO UPDATE SET
           title = EXCLUDED.title,
           summary = EXCLUDED.summary,
           topics = EXCLUDED.topics,
           user_id = EXCLUDED.user_id,
           is_public = EXCLUDED.is_public,
           embedding = EXCLUDED.embedding,
           updated_at = NOW()`,
        [
          session.id,
          session.title,
          session.description,
          session.tags || [],
          session.userId,
          session.isPublic || false,
          session.embedding,
        ]
      );
    } finally {
      client.release();
    }
  }

  async getChatSessions(userId?: string, limit = 50): Promise<ChatSession[]> {
    const client = await this.pool.connect();
    try {
      let query = `
        SELECT
          id,
          title,
          summary as description,
          topics as tags,
          user_id as "userId",
          is_public,
          updated_at as "lastAccessed"
        FROM chat_sessions
        ORDER BY updated_at DESC
        LIMIT $1
      `;
      let params: any[] = [limit];

      if (userId) {
        query = `
          SELECT
            id,
            title,
            summary as description,
            topics as tags,
            user_id as "userId",
            is_public,
            updated_at as "lastAccessed"
          FROM chat_sessions
          WHERE user_id = $1 OR is_public = true
          ORDER BY updated_at DESC
          LIMIT $2
        `;
        params = [userId, limit];
      }

      const result = await client.query(query, params);

      return result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        messages: [], // TODO: Implement when chat messages are stored
        model: row.model || "llama3.2:3b",
        createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
        userId: row.userId,
        tags: row.tags || [],
        topics: row.topics || [],
      } as ChatSession));
    } finally {
      client.release();
    }
  }

  async getChatSessionById(id: string): Promise<DatabaseChatSession | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT
           id,
           title,
           summary as description,
           topics as tags,
           user_id as "userId",
           is_public,
           embedding,
           updated_at as "lastAccessed"
         FROM chat_sessions
         WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        messages: [], // TODO: Implement when chat messages are stored
        model: row.model || "llama3.2:3b",
        createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
        userId: row.userId,
        tags: row.tags || [],
        topics: row.topics || [],
      } as DatabaseChatSession;
    } finally {
      client.release();
    }
  }

  async searchChatSessions(
    query: string,
    userId?: string,
    options: {
      limit?: number;
      threshold?: number;
      embedding?: number[];
    } = {}
  ): Promise<ChatSession[]> {
    const { limit = 20, threshold = 0.7, embedding } = options;

    const client = await this.pool.connect();
    try {
      let whereConditions = [];
      let params: any[] = [];
      let paramIndex = 1;

      if (query && query.trim()) {
        // Text-based search
        whereConditions.push(
          `(title ILIKE $${paramIndex} OR summary ILIKE $${paramIndex})`
        );
        params.push(`%${query}%`);
        paramIndex++;
      }

      if (embedding && embedding.length > 0) {
        // Vector-based search
        whereConditions.push(
          `embedding <=> $${paramIndex}::vector >= $${paramIndex + 1}`
        );
        params.push(embedding, threshold);
        paramIndex += 2;
      }

      if (userId) {
        whereConditions.push(`(user_id = $${paramIndex} OR is_public = true)`);
        params.push(userId);
        paramIndex++;
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      const orderBy =
        embedding && embedding.length > 0
          ? `ORDER BY embedding <=> $${paramIndex}::vector`
          : "ORDER BY updated_at DESC";

      const result = await client.query(
        `SELECT
           id,
           title,
           summary as description,
           topics as tags,
           user_id as "userId",
           is_public,
           updated_at as "lastAccessed"
         FROM chat_sessions
         ${whereClause}
         ${orderBy}
         LIMIT $${paramIndex}`,
        [...params, limit]
      );

      return result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        messages: [], // TODO: Implement when chat messages are stored
        model: row.model || "llama3.2:3b",
        createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
        userId: row.userId,
        tags: row.tags || [],
        topics: row.topics || [],
      } as ChatSession));
    } finally {
      client.release();
    }
  }

  async deleteChatSession(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("DELETE FROM chat_sessions WHERE id = $1", [id]);
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
    publicSessions: number;
    privateSessions: number;
    averageSessionAge: number;
  }> {
    const client = await this.pool.connect();
    try {
      let whereClause = "";
      let params: any[] = [];

      if (userId) {
        whereClause = "WHERE user_id = $1";
        params = [userId];
      }

      const totalResult = await client.query(
        `SELECT COUNT(*) as count FROM chat_sessions ${whereClause}`,
        params
      );
      const totalSessions = parseInt(totalResult.rows[0].count);

      const publicResult = await client.query(
        `SELECT COUNT(*) as count FROM chat_sessions WHERE is_public = true ${
          userId ? "AND user_id = $1" : ""
        }`,
        userId ? [userId] : []
      );
      const publicSessions = parseInt(publicResult.rows[0].count);

      const privateSessions = totalSessions - publicSessions;

      const ageResult = await client.query(
        `SELECT AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) as avg_age
         FROM chat_sessions ${whereClause}`,
        params
      );
      const averageSessionAge = parseInt(ageResult.rows[0].avg_age) || 0;

      return {
        totalSessions,
        publicSessions,
        privateSessions,
        averageSessionAge,
      };
    } finally {
      client.release();
    }
  }
}
