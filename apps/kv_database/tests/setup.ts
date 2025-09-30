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
      // In local development, use SQLite in-memory database for faster testing
      if (process.env.USE_SQLITE_TESTS === "true") {
        console.log("🗄️ Using SQLite in-memory database for tests...");
        this.connectionString = ":memory:";
        console.log("✅ SQLite database ready");
      } else {
        // Check for existing PostgreSQL database
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
            "⚠️ Local database not available. Set USE_SQLITE_TESTS=true for faster local testing, or start Docker for full integration tests."
          );
          // Use a mock connection string that will fail gracefully
          this.connectionString = "postgresql://mock:mock@localhost:5432/mock";
        }
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
