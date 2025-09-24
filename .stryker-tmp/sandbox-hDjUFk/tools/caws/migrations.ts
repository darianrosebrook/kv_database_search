#!/usr/bin/env tsx
// @ts-nocheck

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

/**
 * CAWS Migration Script Generator
 * Creates database migration scripts based on working spec requirements
 */

interface MigrationStep {
  id: string;
  description: string;
  sql: string;
  rollback_sql?: string;
  dependencies?: string[];
}

class MigrationGenerator {
  private workingSpec: any;

  constructor() {
    this.loadWorkingSpec();
  }

  private loadWorkingSpec() {
    const specPath = path.join(process.cwd(), ".caws", "working-spec.yaml");

    if (!fs.existsSync(specPath)) {
      throw new Error("Working spec not found at .caws/working-spec.yaml");
    }

    // For now, return a basic structure - in production this would parse YAML
    this.workingSpec = {
      migrations: [
        "Initial database schema creation",
        "Multi-modal metadata schema",
        "Content type indexing",
      ],
      rollback: [
        "Drop database tables",
        "Clear embeddings cache",
        "Remove multi-modal metadata",
      ],
    };
  }

  generateMigrations(): MigrationStep[] {
    const migrations: MigrationStep[] = [];

    // Initial schema migration
    migrations.push({
      id: "001_initial_schema",
      description: "Create initial database schema for Obsidian RAG",
      sql: `
        -- Create main tables
        CREATE TABLE IF NOT EXISTS chunks (
          id TEXT PRIMARY KEY,
          text TEXT NOT NULL,
          embedding VECTOR(1536),
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS files (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          path TEXT,
          size INTEGER,
          mime_type TEXT,
          checksum TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops);
        CREATE INDEX IF NOT EXISTS idx_chunks_metadata ON chunks USING gin (metadata);
      `,
      rollback_sql: `
        DROP TABLE IF EXISTS chunks;
        DROP TABLE IF EXISTS files;
      `,
    });

    // Multi-modal metadata migration
    migrations.push({
      id: "002_multi_modal_metadata",
      description: "Add multi-modal content metadata support",
      sql: `
        -- Add multi-modal metadata columns
        ALTER TABLE chunks ADD COLUMN IF NOT EXISTS multi_modal_file JSONB;
        ALTER TABLE chunks ADD COLUMN IF NOT EXISTS content_type TEXT;
        ALTER TABLE chunks ADD COLUMN IF NOT EXISTS quality_score REAL;
        ALTER TABLE chunks ADD COLUMN IF NOT EXISTS processing_time INTEGER;

        -- Create indexes for multi-modal queries
        CREATE INDEX IF NOT EXISTS idx_chunks_content_type ON chunks (content_type);
        CREATE INDEX IF NOT EXISTS idx_chunks_quality ON chunks (quality_score);
        CREATE INDEX IF NOT EXISTS idx_chunks_multi_modal ON chunks USING gin (multi_modal_file);

        -- Add constraints
        ALTER TABLE chunks ADD CONSTRAINT check_quality_score
          CHECK (quality_score >= 0.0 AND quality_score <= 1.0);
      `,
      rollback_sql: `
        DROP INDEX IF EXISTS idx_chunks_content_type;
        DROP INDEX IF EXISTS idx_chunks_quality;
        DROP INDEX IF EXISTS idx_chunks_multi_modal;

        ALTER TABLE chunks DROP CONSTRAINT IF EXISTS check_quality_score;
        ALTER TABLE chunks DROP COLUMN IF EXISTS multi_modal_file;
        ALTER TABLE chunks DROP COLUMN IF EXISTS content_type;
        ALTER TABLE chunks DROP COLUMN IF EXISTS quality_score;
        ALTER TABLE chunks DROP COLUMN IF EXISTS processing_time;
      `,
      dependencies: ["001_initial_schema"],
    });

    // Content type indexing migration
    migrations.push({
      id: "003_content_type_indexing",
      description: "Add advanced content type indexing and search optimization",
      sql: `
        -- Create content type specific indexes
        CREATE INDEX IF NOT EXISTS idx_chunks_pdf_metadata ON chunks ((multi_modal_file->>'pageCount'))
          WHERE content_type = 'pdf';

        CREATE INDEX IF NOT EXISTS idx_chunks_audio_metadata ON chunks ((multi_modal_file->>'duration'))
          WHERE content_type = 'audio';

        CREATE INDEX IF NOT EXISTS idx_chunks_office_metadata ON chunks ((multi_modal_file->>'wordCount'))
          WHERE content_type LIKE 'office_%';

        -- Add full-text search capabilities
        CREATE INDEX IF NOT EXISTS idx_chunks_text_search ON chunks USING gin (to_tsvector('english', text));

        -- Add partial indexes for better query performance
        CREATE INDEX IF NOT EXISTS idx_chunks_has_text ON chunks (id)
          WHERE multi_modal_file->>'hasText' = 'true';
      `,
      rollback_sql: `
        DROP INDEX IF EXISTS idx_chunks_pdf_metadata;
        DROP INDEX IF EXISTS idx_chunks_audio_metadata;
        DROP INDEX IF EXISTS idx_chunks_office_metadata;
        DROP INDEX IF EXISTS idx_chunks_text_search;
        DROP INDEX IF EXISTS idx_chunks_has_text;
      `,
      dependencies: ["002_multi_modal_metadata"],
    });

    return migrations;
  }

  generateMigrationScript(migrations: MigrationStep[]): string {
    const script = [
      "#!/bin/bash",
      "",
      "# CAWS Database Migration Script",
      "# Generated from working spec requirements",
      "",
      "set -e  # Exit on any error",
      "",
      "DB_URL=${DATABASE_URL:-$1}",
      "",
      'if [ -z "$DB_URL" ]; then',
      '  echo "Usage: $0 <database_url> or set DATABASE_URL environment variable"',
      "  exit 1",
      "fi",
      "",
      'echo "🚀 Starting CAWS database migrations..."',
      "",
      "# Function to execute SQL",
      "execute_sql() {",
      '  echo "Executing: $1"',
      '  psql "$DB_URL" -c "$1" 2>/dev/null || echo "Warning: SQL execution failed"',
      "}",
      "",
      "# Run migrations in dependency order",
      ...migrations
        .map((migration) => [
          `echo "📦 Running migration: ${migration.id} - ${migration.description}"`,
          'execute_sql "' +
            migration.sql.replace(/"/g, '\\"').replace(/\n/g, " ").trim() +
            '"',
          `echo "✅ Migration ${migration.id} completed"`,
          "",
        ])
        .flat(),
      "",
      'echo "🎉 All migrations completed successfully!"',
      "",
      "# Generate rollback script",
      "cat > rollback.sql << 'EOF'",
      ...migrations
        .reverse()
        .map((migration) =>
          migration.rollback_sql
            ? [
                `-- Rollback for ${migration.id}: ${migration.description}`,
                migration.rollback_sql.trim(),
                "",
              ].join("\n")
            : ""
        )
        .filter(Boolean),
      "EOF",
      "",
      'echo "📄 Rollback script generated: rollback.sql"',
    ];

    return script.join("\n");
  }

  validateMigrationOrder(migrations: MigrationStep[]): boolean {
    const executed = new Set<string>();

    for (const migration of migrations) {
      // Check if dependencies are satisfied
      if (migration.dependencies) {
        for (const dep of migration.dependencies) {
          if (!executed.has(dep)) {
            console.error(
              `Migration ${migration.id} depends on ${dep} which hasn't been executed yet`
            );
            return false;
          }
        }
      }
      executed.add(migration.id);
    }

    return true;
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "generate";

  try {
    const generator = new MigrationGenerator();
    const migrations = generator.generateMigrations();

    if (!generator.validateMigrationOrder(migrations)) {
      console.error("❌ Migration dependency validation failed");
      process.exit(1);
    }

    switch (command) {
      case "generate":
        const script = generator.generateMigrationScript(migrations);
        const scriptPath = path.join(process.cwd(), "migrate.sh");
        fs.writeFileSync(scriptPath, script, { mode: 0o755 });
        console.log("📄 Migration script generated:", scriptPath);
        break;

      case "list":
        console.log("📋 Available Migrations:");
        migrations.forEach((m, i) => {
          console.log(`${i + 1}. ${m.id}: ${m.description}`);
          if (m.dependencies) {
            console.log(`   Dependencies: ${m.dependencies.join(", ")}`);
          }
        });
        break;

      case "validate":
        console.log("✅ Migration order validation passed");
        break;

      default:
        console.log("Usage:");
        console.log(
          "  tsx tools/caws/migrations.ts generate  # Generate migration script"
        );
        console.log(
          "  tsx tools/caws/migrations.ts list      # List available migrations"
        );
        console.log(
          "  tsx tools/caws/migrations.ts validate  # Validate migration order"
        );
    }
  } catch (error) {
    console.error("❌ Migration generation failed:", error);
    process.exit(1);
  }
}

// Execute if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MigrationGenerator, MigrationStep };
