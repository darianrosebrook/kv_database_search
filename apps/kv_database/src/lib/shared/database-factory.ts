/**
 * Database Service Factory
 *
 * Provides centralized database connection management and health checks
 * for both main server and Graph RAG server.
 */

import { Pool } from "pg";
import { ObsidianDatabase } from "../database.js";
import { DependencyContainer, SERVICE_TOKENS } from "./dependency-container.js";
import { Logger } from "./logger.js";
import type { DatabaseConfig } from "./config.js";

export interface DatabaseServices {
  pool: Pool;
  database: ObsidianDatabase;
}

/**
 * Factory for creating and managing database connections
 */
export class DatabaseFactory {
  private container: DependencyContainer;
  private logger: Logger;

  constructor(container: DependencyContainer, logger: Logger) {
    this.container = container;
    this.logger = logger;
  }

  /**
   * Create database connections and services
   */
  async createDatabaseServices(
    config: DatabaseConfig
  ): Promise<DatabaseServices> {
    try {
      this.logger.info("🗄️ Creating database connections...");

      // Create PostgreSQL connection pool
      const pool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        ssl: config.ssl,
        max: config.maxConnections,
        connectionTimeoutMillis: config.connectionTimeoutMillis,
      });

      // Test connection
      await this.testConnection(pool);

      // Create ObsidianDatabase wrapper
      const database = new ObsidianDatabase(pool);
      await database.initialize();

      // Register in container
      this.container.register(SERVICE_TOKENS.DATABASE, database);
      this.container.register("databasePool", pool);

      this.logger.info("✅ Database services created successfully");
      return { pool, database };
    } catch (error) {
      this.logger.error("❌ Failed to create database services", error);
      throw new Error(`Database services creation failed: ${error}`);
    }
  }

  /**
   * Test database connection
   */
  private async testConnection(pool: Pool): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
      this.logger.info("✅ Database connection test successful");
    } finally {
      client.release();
    }
  }

  /**
   * Close database connections gracefully
   */
  async closeConnections(): Promise<void> {
    try {
      const pool = this.container.get<Pool>("databasePool");
      if (pool) {
        this.logger.info("🔄 Closing database connections...");
        await pool.end();
        this.logger.info("✅ Database connections closed");
      }
    } catch (error) {
      this.logger.error("❌ Error closing database connections", error);
    }
  }

  /**
   * Get database health status
   */
  async getHealthStatus(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    details: any;
  }> {
    try {
      const pool = this.container.get<Pool>("databasePool");
      if (!pool) {
        return {
          status: "unhealthy",
          details: { error: "No database pool available" },
        };
      }

      const client = await pool.connect();
      try {
        const result = await client.query(
          "SELECT version(), pg_stat_activity_count() as connection_count"
        );
        const version = result.rows[0].version;
        const connectionCount = result.rows[0].connection_count;

        return {
          status: "healthy",
          details: {
            version: version.split(" ")[0] + " " + version.split(" ")[1],
            connectionCount,
            maxConnections: pool.options.max,
          },
        };
      } finally {
        client.release();
      }
    } catch (error) {
      return {
        status: "unhealthy",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Get database service from container
   */
  getDatabase(): ObsidianDatabase {
    return this.container.get<ObsidianDatabase>(SERVICE_TOKENS.DATABASE);
  }

  /**
   * Get database pool from container
   */
  getPool(): Pool {
    return this.container.get<Pool>("databasePool");
  }
}
