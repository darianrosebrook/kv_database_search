/**
 * Shared Configuration Management
 *
 * Centralized configuration with environment variable support
 * and validation for both main server and Graph RAG server.
 */

import { config as dotenvConfig } from "dotenv";
import * as path from "path";

// Load environment variables
dotenvConfig();

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  maxConnections: number;
  connectionTimeoutMillis: number;
}

export interface EmbeddingConfig {
  model: string;
  dimension: number;
  baseUrl?: string;
  timeout: number;
}

export interface GraphRagConfig {
  port: number;
  host: string;
  corsOrigins: string[];
  enableMetrics: boolean;
  enableHealthChecks: boolean;
  requestTimeout: number;
  maxRequestSize: string;
}

export interface MainServerConfig {
  port: number;
  host: string;
  corsOrigins: string[];
  enableMetrics: boolean;
  enableHealthChecks: boolean;
  requestTimeout: number;
  maxRequestSize: string;
  obsidianVaultPath: string;
}

export interface AppConfig {
  database: DatabaseConfig;
  embedding: EmbeddingConfig;
  graphRag: GraphRagConfig;
  mainServer: MainServerConfig;
  environment: "development" | "production" | "test";
  logLevel: "debug" | "info" | "warn" | "error";
}

/**
 * Configuration loader with validation
 */
export class ConfigManager {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): AppConfig {
    const env = (process.env.NODE_ENV ||
      "development") as AppConfig["environment"];

    return {
      environment: env,
      logLevel: (process.env.LOG_LEVEL || "info") as AppConfig["logLevel"],

      database: {
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432"),
        database: process.env.DB_NAME || "obsidian_rag",
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "password",
        ssl: process.env.DB_SSL === "true",
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || "20"),
        connectionTimeoutMillis: parseInt(
          process.env.DB_CONNECTION_TIMEOUT || "10000"
        ),
      },

      embedding: {
        model: process.env.EMBEDDING_MODEL || "embeddinggemma",
        dimension: parseInt(process.env.EMBEDDING_DIMENSION || "768"),
        baseUrl: process.env.OLLAMA_BASE_URL,
        timeout: parseInt(process.env.EMBEDDING_TIMEOUT || "30000"),
      },

      graphRag: {
        port: parseInt(process.env.GRAPH_RAG_PORT || "3002"),
        host: process.env.GRAPH_RAG_HOST || "localhost",
        corsOrigins: this.parseCorsOrigins(
          process.env.GRAPH_RAG_CORS_ORIGINS || "http://localhost:3000"
        ),
        enableMetrics: process.env.GRAPH_RAG_METRICS === "true",
        enableHealthChecks: process.env.GRAPH_RAG_HEALTH_CHECKS !== "false",
        requestTimeout: parseInt(
          process.env.GRAPH_RAG_REQUEST_TIMEOUT || "30000"
        ),
        maxRequestSize: process.env.GRAPH_RAG_MAX_REQUEST_SIZE || "10mb",
      },

      mainServer: {
        port: parseInt(process.env.PORT || "3001"),
        host: process.env.HOST || "localhost",
        corsOrigins: this.parseCorsOrigins(
          process.env.CORS_ORIGINS || "http://localhost:3000"
        ),
        enableMetrics: process.env.METRICS === "true",
        enableHealthChecks: process.env.HEALTH_CHECKS !== "false",
        requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || "30000"),
        maxRequestSize: process.env.MAX_REQUEST_SIZE || "50mb",
        obsidianVaultPath:
          process.env.OBSIDIAN_VAULT_PATH || path.join(process.cwd(), "vault"),
      },
    };
  }

  private parseCorsOrigins(origins: string): string[] {
    return origins
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // Database validation
    if (!this.config.database.host) {
      errors.push("Database host is required");
    }
    if (this.config.database.port < 1 || this.config.database.port > 65535) {
      errors.push("Database port must be between 1 and 65535");
    }

    // Embedding validation
    if (!this.config.embedding.model) {
      errors.push("Embedding model is required");
    }
    if (this.config.embedding.dimension < 1) {
      errors.push("Embedding dimension must be positive");
    }

    // Port validation
    if (this.config.mainServer.port === this.config.graphRag.port) {
      errors.push("Main server and Graph RAG server cannot use the same port");
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join("\n")}`);
    }
  }

  /**
   * Get the complete configuration
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Get database configuration
   */
  getDatabaseConfig(): DatabaseConfig {
    return { ...this.config.database };
  }

  /**
   * Get embedding configuration
   */
  getEmbeddingConfig(): EmbeddingConfig {
    return { ...this.config.embedding };
  }

  /**
   * Get Graph RAG server configuration
   */
  getGraphRagConfig(): GraphRagConfig {
    return { ...this.config.graphRag };
  }

  /**
   * Get main server configuration
   */
  getMainServerConfig(): MainServerConfig {
    return { ...this.config.mainServer };
  }

  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    return this.config.environment === "development";
  }

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    return this.config.environment === "production";
  }

  /**
   * Check if running in test mode
   */
  isTest(): boolean {
    return this.config.environment === "test";
  }
}

/**
 * Global configuration instance
 */
export const config = new ConfigManager();
