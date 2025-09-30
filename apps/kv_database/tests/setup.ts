// Setup for vitest

// Test database management utilities
export class TestDatabaseManager {
  private static container: any = null;
  private static connectionString: string = "";
  private static isInitialized = false;

  static async ensureDatabase(): Promise<string> {
    if (this.isInitialized && this.connectionString) {
      return this.connectionString;
    }

    if (
      process.env.CI ||
      process.env.USE_TESTCONTAINERS ||
      process.env.FORCE_TESTCONTAINERS
    ) {
      // In CI or when explicitly requested, use testcontainers
      console.log("🐳 Starting test database container...");
      const { PostgreSqlContainer } = await import(
        "@testcontainers/postgresql"
      );
      this.container = await new PostgreSqlContainer("pgvector/pgvector:pg16")
        .withDatabase("testdb")
        .withUsername("testuser")
        .withPassword("testpass")
        .start();
      this.connectionString = this.container.getConnectionUri();
      console.log("✅ Test database container ready");
    } else {
      // In local development, check for existing database
      this.connectionString =
        process.env.DATABASE_URL ||
        "postgresql://postgres:password@localhost:5432/obsidian_rag_test";

      console.log("🔍 Checking local database connection...");
      const { Client } = await import("pg");
      const client = new Client({ connectionString: this.connectionString });
      try {
        await client.connect();
        await client.end();
        console.log("✅ Local database available");
      } catch (error) {
        console.warn(
          "⚠️ Local database not available, starting test container..."
        );
        // Fall back to testcontainers if local DB not available
        const { PostgreSqlContainer } = await import(
          "@testcontainers/postgresql"
        );
        this.container = await new PostgreSqlContainer("pgvector/pgvector:pg16")
          .withDatabase("testdb")
          .withUsername("testuser")
          .withPassword("testpass")
          .start();
        this.connectionString = this.container.getConnectionUri();
        console.log("✅ Test database container ready");
      }
    }

    this.isInitialized = true;
    process.env.DATABASE_URL = this.connectionString;
    return this.connectionString;
  }

  static async cleanup() {
    if (this.container) {
      console.log("🛑 Stopping test database container...");
      await this.container.stop();
      this.container = null;
      console.log("✅ Test database container stopped");
    }
    this.isInitialized = false;
    this.connectionString = "";
  }

  static getConnectionString(): string {
    if (!this.isInitialized) {
      throw new Error("Database not initialized. Call ensureDatabase() first.");
    }
    return this.connectionString;
  }
}
