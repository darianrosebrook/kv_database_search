#!/usr/bin/env tsx

/**
 * WordNet Data Ingestion Script
 *
 * Ingests WordNet 3.1 dictionary data into the database for enhanced semantic search.
 *
 * Process:
 * 1. Extract WordNet data from tar.gz archive
 * 2. Parse synset data files (noun, verb, adj, adv)
 * 3. Insert dictionary source metadata
 * 4. Insert synsets and lexical entries
 * 5. Insert semantic relationships
 */

import { config as dotenvConfig } from "dotenv";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process";

// Load environment variables
dotenvConfig();

const DATABASE_URL = process.env.DATABASE_URL;
const WORDNET_ARCHIVE = path.join(
  process.cwd(),
  "..",
  "..",
  "external-resources",
  "wn3.1.dict.tar.gz"
);
const TEMP_DIR = "/tmp/wordnet_ingestion";

interface SynsetData {
  synsetId: string;
  lexFileNum: number;
  partOfSpeech: "noun" | "verb" | "adjective" | "adverb";
  lemmas: string[];
  definition: string;
  examples: string[];
  relationships: RelationshipData[];
}

interface RelationshipData {
  type: string;
  targetSynsetId: string;
  targetPos: string;
}

class WordNetIngester {
  private pool: Pool;
  private tempDir: string;

  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl });
    this.tempDir = TEMP_DIR;
  }

  async initialize(): Promise<void> {
    console.log("🔧 Initializing WordNet ingestion...");

    // Clean up any existing temp directory
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }

    // Create temp directory
    fs.mkdirSync(this.tempDir, { recursive: true });

    // Test database connection
    const client = await this.pool.connect();
    try {
      await client.query("SELECT 1");
      console.log("✅ Database connection established");
    } finally {
      client.release();
    }
  }

  async extractWordNetData(): Promise<void> {
    console.log("📦 Extracting WordNet data...");

    if (!fs.existsSync(WORDNET_ARCHIVE)) {
      throw new Error(`WordNet archive not found: ${WORDNET_ARCHIVE}`);
    }

    // Extract the archive
    child_process.execSync(
      `tar -xzf "${WORDNET_ARCHIVE}" -C "${this.tempDir}"`,
      {
        stdio: "inherit",
      }
    );

    console.log("✅ WordNet data extracted");
  }

  async insertDictionarySource(): Promise<string> {
    console.log("📚 Inserting dictionary source metadata...");

    const client = await this.pool.connect();
    try {
      // First check if source already exists
      const existingResult = await client.query(`
        SELECT id FROM dictionary_sources
        WHERE name = 'wordnet' AND version = '3.1' AND language = 'en'
      `);

      let sourceId: string;
      if (existingResult.rows.length > 0) {
        sourceId = existingResult.rows[0].id;
        console.log(`✅ WordNet source already exists with ID: ${sourceId}`);
      } else {
        // Insert new source
        const insertResult = await client.query(`
          INSERT INTO dictionary_sources (
            name, version, language, status, capabilities, entry_count
          ) VALUES (
            'wordnet', '3.1', 'en', 'available',
            ARRAY['definitions', 'synonyms', 'relationships'],
            0
          )
          RETURNING id
        `);
        sourceId = insertResult.rows[0].id;
        console.log(`✅ Dictionary source inserted with ID: ${sourceId}`);
      }

      return sourceId;
    } finally {
      client.release();
    }
  }

  parseSynsetLine(line: string): SynsetData | null {
    // Skip comments and empty lines
    if (!line || line.startsWith(" ") || !/^\d/.test(line)) {
      return null;
    }

    const parts = line.split(" | ");
    if (parts.length !== 2) return null;

    const [synsetPart, definition] = parts;
    const tokens = synsetPart.split(/\s+/);

    if (tokens.length < 4) return null;

    const synsetId = tokens[0];
    const lexFileNum = parseInt(tokens[1]);
    const pos = tokens[2] as "n" | "v" | "a" | "r";
    const lemmaCount = parseInt(tokens[3]);

    // Map part of speech
    const partOfSpeech = {
      n: "noun",
      v: "verb",
      a: "adjective",
      r: "adverb",
    }[pos] as "noun" | "verb" | "adjective" | "adverb";

    // Extract lemmas
    const lemmas: string[] = [];
    for (let i = 0; i < lemmaCount; i++) {
      const lemmaIndex = 4 + i * 2;
      if (lemmaIndex < tokens.length) {
        lemmas.push(tokens[lemmaIndex].replace(/_/g, " "));
      }
    }

    // Skip synsets with no lemmas
    if (lemmas.length === 0) {
      return null;
    }

    // Parse relationships (pointers)
    const relationships: RelationshipData[] = [];
    let pointerStart = 4 + lemmaCount * 2;

    while (pointerStart + 3 < tokens.length) {
      const pointerSymbol = tokens[pointerStart];
      const targetSynsetId = tokens[pointerStart + 1];
      const targetPos = tokens[pointerStart + 2];

      relationships.push({
        type: pointerSymbol,
        targetSynsetId,
        targetPos,
      });

      pointerStart += 4; // Each pointer has 4 tokens: symbol, synset, pos, source/target
    }

    return {
      synsetId,
      lexFileNum,
      partOfSpeech,
      lemmas,
      definition,
      examples: [], // WordNet 3.1 doesn't have examples in data files
      relationships,
    };
  }

  async processDataFile(
    filePath: string,
    sourceId: string,
    pos: "noun" | "verb" | "adjective" | "adverb"
  ): Promise<number> {
    console.log(`📖 Processing ${pos} data from ${filePath}...`);

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const lines = fileContent.split("\n");

    const client = await this.pool.connect();
    let processedCount = 0;

    try {
      await client.query("BEGIN");

      for (const line of lines) {
        const synsetData = this.parseSynsetLine(line);
        if (!synsetData || synsetData.partOfSpeech !== pos) continue;

        // Insert synset
        const synsetResult = await client.query(
          `
          INSERT INTO synsets (
            synset_id, source_id, lemma, part_of_speech, definition,
            confidence
          ) VALUES (
            $1, $2, $3, $4, $5, 0.9
          )
          RETURNING id
        `,
          [
            synsetData.synsetId,
            sourceId,
            synsetData.lemmas[0], // Use first lemma as canonical
            synsetData.partOfSpeech,
            synsetData.definition,
          ]
        );

        const synsetDbId = synsetResult.rows[0].id;

        // Insert lexical entries for all lemmas
        for (const lemma of synsetData.lemmas) {
          await client.query(
            `
            INSERT INTO lexical_entries (
              synset_id, word_form
            ) VALUES (
              $1, $2
            )
          `,
            [synsetDbId, lemma]
          );
        }

        processedCount++;

        // Log progress every 1000 synsets
        if (processedCount % 1000 === 0) {
          console.log(`  Processed ${processedCount} ${pos} synsets...`);
        }
      }

      await client.query("COMMIT");
      console.log(`✅ Processed ${processedCount} ${pos} synsets`);
      return processedCount;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async processRelationships(sourceId: string): Promise<void> {
    console.log("🔗 Processing semantic relationships...");

    const client = await this.pool.connect();

    try {
      // Get all synsets with their IDs
      const synsetsResult = await client.query(
        `
        SELECT id, synset_id FROM synsets WHERE source_id = $1
      `,
        [sourceId]
      );

      const synsetMap = new Map<string, string>();
      for (const row of synsetsResult.rows) {
        synsetMap.set(row.synset_id, row.id);
      }

      console.log(
        `📊 Found ${synsetMap.size} synsets for relationship processing`
      );

      // Process relationships for each data file
      const dataFiles = [
        { file: "data.noun", pos: "noun" },
        { file: "data.verb", pos: "verb" },
        { file: "data.adj", pos: "adjective" },
        { file: "data.adv", pos: "adverb" },
      ];

      let totalRelationships = 0;

      for (const { file, pos } of dataFiles) {
        const filePath = path.join(this.tempDir, "dict", file);
        if (!fs.existsSync(filePath)) continue;

        console.log(`🔗 Processing relationships in ${file}...`);

        const fileContent = fs.readFileSync(filePath, "utf-8");
        const lines = fileContent.split("\n");

        await client.query("BEGIN");

        for (const line of lines) {
          const synsetData = this.parseSynsetLine(line);
          if (!synsetData) continue;

          const sourceSynsetId = synsetMap.get(synsetData.synsetId);
          if (!sourceSynsetId) continue;

          // Insert relationships
          for (const rel of synsetData.relationships) {
            const targetSynsetId = synsetMap.get(rel.targetSynsetId);
            if (!targetSynsetId) continue;

            // Map WordNet pointer symbols to our relationship types
            const relationshipType = this.mapPointerSymbol(rel.type);

            try {
              await client.query(
                `
                INSERT INTO lexical_relationships (
                  source_synset_id, target_synset_id, relationship_type, confidence
                ) VALUES (
                  $1, $2, $3, 0.8
                )
              `,
                [sourceSynsetId, targetSynsetId, relationshipType]
              );
            } catch (error) {
              // Skip if constraint violation (duplicate relationship)
            }
          }
        }

        await client.query("COMMIT");

        // Count relationships for this file
        const countResult = await client.query(
          `
          SELECT COUNT(*) as count FROM lexical_relationships lr
          JOIN synsets s ON lr.source_synset_id = s.id
          WHERE s.source_id = $1
        `,
          [sourceId]
        );

        const relationshipCount = parseInt(countResult.rows[0].count);
        console.log(
          `✅ Processed relationships for ${file}: ${
            relationshipCount - totalRelationships
          }`
        );
        totalRelationships = relationshipCount;
      }

      console.log(`🎯 Total relationships processed: ${totalRelationships}`);
    } finally {
      client.release();
    }
  }

  mapPointerSymbol(pointer: string): string {
    const mapping: { [key: string]: string } = {
      "@": "hypernym", // is-a (more general)
      "~": "hyponym", // is-a (more specific)
      "#m": "member_meronym", // member of
      "#s": "substance_meronym", // substance of
      "#p": "part_meronym", // part of
      "%m": "member_holonym", // has member
      "%s": "substance_holonym", // has substance
      "%p": "part_holonym", // has part
      "=": "attribute", // attribute
      "+": "derivationally_related", // morphologically related
      ";c": "domain_topic", // domain category
      "-c": "member_of_domain_topic",
      ";r": "domain_region", // domain region
      "-r": "member_of_domain_region",
      ";u": "domain_usage", // domain usage
      "-u": "member_of_domain_usage",
      "*": "entailment", // verb entailment
      ">": "cause", // cause
      "^": "also_see", // see also
      $: "verb_group", // verb group
      "&": "similar_to", // similar
      "<": "participle", // participle
      "\\": "pertainym", // pertainym
    };

    return mapping[pointer] || "related_to";
  }

  async updateSourceStats(sourceId: string): Promise<void> {
    console.log("📊 Updating dictionary source statistics...");

    const client = await this.pool.connect();

    try {
      // Update entry count
      const countResult = await client.query(
        `
        SELECT COUNT(*) as count FROM synsets WHERE source_id = $1
      `,
        [sourceId]
      );

      const entryCount = parseInt(countResult.rows[0].count);

      await client.query(
        `
        UPDATE dictionary_sources
        SET entry_count = $1, last_sync = NOW()
        WHERE id = $2
      `,
        [entryCount, sourceId]
      );

      console.log(`✅ Updated source stats: ${entryCount} entries`);
    } finally {
      client.release();
    }
  }

  async clearExistingWordNetData(sourceId: string): Promise<void> {
    console.log("🗑️ Clearing existing WordNet data...");

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Get count of existing synsets for logging
      const countResult = await client.query(
        `SELECT COUNT(*) as count FROM synsets WHERE source_id = $1`,
        [sourceId]
      );
      const existingCount = parseInt(countResult.rows[0].count);

      if (existingCount > 0) {
        console.log(`🗑️ Found ${existingCount} existing synsets to clear`);

        // Delete lexical entries first (due to foreign key constraints)
        await client.query(
          `
          DELETE FROM lexical_entries
          WHERE synset_id IN (SELECT id FROM synsets WHERE source_id = $1)
        `,
          [sourceId]
        );

        // Delete synsets
        await client.query(
          `
          DELETE FROM synsets WHERE source_id = $1
        `,
          [sourceId]
        );

        console.log(`✅ Cleared ${existingCount} existing synsets`);
      } else {
        console.log("✅ No existing WordNet data to clear");
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async cleanup(): Promise<void> {
    console.log("🧹 Cleaning up temporary files...");

    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }

    console.log("✅ Cleanup completed");
  }

  async run(): Promise<void> {
    try {
      await this.initialize();
      await this.extractWordNetData();

      const sourceId = await this.insertDictionarySource();

      // Clear existing WordNet data before ingesting
      await this.clearExistingWordNetData(sourceId);

      // Process each part of speech
      const dataFiles = [
        { file: "data.noun", pos: "noun" as const },
        { file: "data.verb", pos: "verb" as const },
        { file: "data.adj", pos: "adjective" as const },
        { file: "data.adv", pos: "adverb" as const },
      ];

      for (const { file, pos } of dataFiles) {
        const filePath = path.join(this.tempDir, "dict", file);
        if (fs.existsSync(filePath)) {
          await this.processDataFile(filePath, sourceId, pos);
        } else {
          console.log(`⚠️  ${file} not found, skipping ${pos} processing`);
        }
      }

      await this.processRelationships(sourceId);
      await this.updateSourceStats(sourceId);
      await this.cleanup();

      console.log("🎉 WordNet ingestion completed successfully!");
    } catch (error) {
      console.error("❌ WordNet ingestion failed:", error);
      await this.cleanup();
      throw error;
    } finally {
      await this.pool.end();
    }
  }
}

async function main() {
  console.log("🚀 WordNet Data Ingestion");
  console.log("=".repeat(50));

  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const ingester = new WordNetIngester(DATABASE_URL);
  await ingester.run();

  console.log("\n✨ WordNet data successfully ingested!");
  console.log("You can now use enhanced semantic search with dictionary data.");
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("💥 Ingestion failed:", error);
    process.exit(1);
  });
}
