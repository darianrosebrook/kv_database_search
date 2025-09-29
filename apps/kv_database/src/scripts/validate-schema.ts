#!/usr/bin/env tsx

/**
 * Database Schema Validation Script
 *
 * Validates that all required database tables and indexes exist
 * and creates missing ones if needed.
 */

import { config as dotenvConfig } from "dotenv";
import { Pool } from "pg";
import { ObsidianDatabase } from "../lib/database";

// Load environment variables
dotenvConfig();

const DATABASE_URL = process.env.DATABASE_URL;

interface TableInfo {
  name: string;
  exists: boolean;
  rowCount?: number;
}

interface IndexInfo {
  name: string;
  table: string;
  exists: boolean;
}

async function validateSchema() {
  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  console.log("🔍 Validating database schema...");
  console.log(`📊 Database: ${DATABASE_URL.split("@")[1] || "localhost"}`);

  const database = new ObsidianDatabase(DATABASE_URL);

  try {
    // Initialize database (this creates tables if they don't exist)
    await database.initialize();
    console.log("✅ Database initialization completed");

    const client = await database.pool.connect();

    try {
      // Check required tables
      const requiredTables = [
        "document_chunks",
        "obsidian_chunks",
        "chat_sessions",
        "workspaces",
      ];

      const tableResults: TableInfo[] = [];

      for (const tableName of requiredTables) {
        const tableExists = await client.query(
          `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `,
          [tableName]
        );

        const exists = tableExists.rows[0].exists;
        let rowCount: number | undefined;

        if (exists) {
          const countResult = await client.query(
            `SELECT COUNT(*) FROM ${tableName}`
          );
          rowCount = parseInt(countResult.rows[0].count);
        }

        tableResults.push({
          name: tableName,
          exists,
          rowCount,
        });
      }

      // Check required indexes
      const requiredIndexes = [
        { name: "document_chunks_hnsw_idx", table: "document_chunks" },
        { name: "document_chunks_file_name_idx", table: "document_chunks" },
        { name: "document_chunks_content_type_idx", table: "document_chunks" },
        { name: "document_chunks_tags_idx", table: "document_chunks" },
        { name: "document_chunks_updated_at_idx", table: "document_chunks" },
        { name: "chat_sessions_created_at_idx", table: "chat_sessions" },
        { name: "chat_sessions_user_id_idx", table: "chat_sessions" },
        { name: "workspaces_name_idx", table: "workspaces" },
        { name: "workspaces_status_idx", table: "workspaces" },
        { name: "workspaces_created_at_idx", table: "workspaces" },
      ];

      const indexResults: IndexInfo[] = [];

      for (const index of requiredIndexes) {
        const indexExists = await client.query(
          `
          SELECT EXISTS (
            SELECT FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND indexname = $1
          );
        `,
          [index.name]
        );

        indexResults.push({
          name: index.name,
          table: index.table,
          exists: indexExists.rows[0].exists,
        });
      }

      // Check for pgvector extension
      const vectorExtension = await client.query(`
        SELECT EXISTS (
          SELECT FROM pg_extension 
          WHERE extname = 'vector'
        );
      `);

      // Report results
      console.log("\n📋 Schema Validation Results:");
      console.log("=".repeat(50));

      // Extensions
      console.log("\n🔌 Extensions:");
      console.log(
        `  pgvector: ${vectorExtension.rows[0].exists ? "✅" : "❌"}`
      );

      // Tables
      console.log("\n📊 Tables:");
      for (const table of tableResults) {
        const status = table.exists ? "✅" : "❌";
        const count =
          table.rowCount !== undefined
            ? ` (${table.rowCount.toLocaleString()} rows)`
            : "";
        console.log(`  ${table.name}: ${status}${count}`);
      }

      // Indexes
      console.log("\n🗂️  Indexes:");
      for (const index of indexResults) {
        const status = index.exists ? "✅" : "❌";
        console.log(`  ${index.name}: ${status}`);
      }

      // Summary
      const missingTables = tableResults.filter((t) => !t.exists);
      const missingIndexes = indexResults.filter((i) => !i.exists);
      const hasVector = vectorExtension.rows[0].exists;

      console.log("\n📈 Summary:");
      if (!hasVector) {
        console.log("❌ pgvector extension is missing");
      }
      if (missingTables.length > 0) {
        console.log(
          `❌ ${missingTables.length} missing tables: ${missingTables
            .map((t) => t.name)
            .join(", ")}`
        );
      }
      if (missingIndexes.length > 0) {
        console.log(
          `⚠️  ${missingIndexes.length} missing indexes: ${missingIndexes
            .map((i) => i.name)
            .join(", ")}`
        );
      }

      if (hasVector && missingTables.length === 0) {
        console.log("✅ All required tables exist");
        if (missingIndexes.length === 0) {
          console.log("✅ All required indexes exist");
          console.log("🎉 Database schema is fully validated!");
        } else {
          console.log("⚠️  Some indexes are missing but tables are ready");
        }
      }

      // Check for data
      const totalDocuments =
        tableResults.find((t) => t.name === "document_chunks")?.rowCount || 0;
      const totalChats =
        tableResults.find((t) => t.name === "chat_sessions")?.rowCount || 0;
      const totalWorkspaces =
        tableResults.find((t) => t.name === "workspaces")?.rowCount || 0;

      console.log("\n📊 Data Summary:");
      console.log(`  Documents: ${totalDocuments.toLocaleString()} chunks`);
      console.log(`  Chat Sessions: ${totalChats.toLocaleString()}`);
      console.log(`  Workspaces: ${totalWorkspaces.toLocaleString()}`);

      if (totalDocuments === 0) {
        console.log("\n💡 No documents found. Consider running:");
        console.log("   pnpm run ingest");
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Schema validation failed:", error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

// Dictionary schema validation
async function validateDictionarySchema() {
  if (!DATABASE_URL) return;

  console.log("\n🔍 Validating dictionary schema...");

  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    const dictionaryTables = [
      "dictionary_sources",
      "synsets",
      "lexical_entries",
      "lexical_relationships",
    ];

    const results: TableInfo[] = [];

    for (const tableName of dictionaryTables) {
      const tableExists = await client.query(
        `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `,
        [tableName]
      );

      const exists = tableExists.rows[0].exists;
      let rowCount: number | undefined;

      if (exists) {
        const countResult = await client.query(
          `SELECT COUNT(*) FROM ${tableName}`
        );
        rowCount = parseInt(countResult.rows[0].count);
      }

      results.push({
        name: tableName,
        exists,
        rowCount,
      });
    }

    console.log("📚 Dictionary Tables:");
    for (const table of results) {
      const status = table.exists ? "✅" : "❌";
      const count =
        table.rowCount !== undefined
          ? ` (${table.rowCount.toLocaleString()} rows)`
          : "";
      console.log(`  ${table.name}: ${status}${count}`);
    }

    const missingTables = results.filter((t) => !t.exists);
    if (missingTables.length > 0) {
      console.log(
        `\n⚠️  Dictionary tables missing: ${missingTables
          .map((t) => t.name)
          .join(", ")}`
      );
      console.log("💡 Dictionary service will use fallback mode");
    } else {
      console.log("✅ Dictionary schema is ready");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  console.log("🚀 Database Schema Validation");
  console.log("=".repeat(50));

  await validateSchema();
  await validateDictionarySchema();

  console.log("\n✨ Schema validation complete!");
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("💥 Validation failed:", error);
    process.exit(1);
  });
}
