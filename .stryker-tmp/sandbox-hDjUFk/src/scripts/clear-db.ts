#!/usr/bin/env tsx
// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import dotenv from "dotenv";
import { ObsidianDatabase } from "../lib/database";
import * as readline from "readline";

// Load environment variables
dotenv.config();
const DATABASE_URL = process.env.DATABASE_URL;
async function main() {
  if (stryMutAct_9fa48("4455")) {
    {}
  } else {
    stryCov_9fa48("4455");
    if (stryMutAct_9fa48("4458") ? false : stryMutAct_9fa48("4457") ? true : stryMutAct_9fa48("4456") ? DATABASE_URL : (stryCov_9fa48("4456", "4457", "4458"), !DATABASE_URL)) {
      if (stryMutAct_9fa48("4459")) {
        {}
      } else {
        stryCov_9fa48("4459");
        console.error(stryMutAct_9fa48("4460") ? "" : (stryCov_9fa48("4460"), "❌ DATABASE_URL environment variable is required"));
        process.exit(1);
      }
    }

    // Check for force flag
    const args = stryMutAct_9fa48("4461") ? process.argv : (stryCov_9fa48("4461"), process.argv.slice(2));
    const forceMode = stryMutAct_9fa48("4464") ? args.includes("-f") && args.includes("--force") : stryMutAct_9fa48("4463") ? false : stryMutAct_9fa48("4462") ? true : (stryCov_9fa48("4462", "4463", "4464"), args.includes(stryMutAct_9fa48("4465") ? "" : (stryCov_9fa48("4465"), "-f")) || args.includes(stryMutAct_9fa48("4466") ? "" : (stryCov_9fa48("4466"), "--force")));
    if (stryMutAct_9fa48("4469") ? false : stryMutAct_9fa48("4468") ? true : stryMutAct_9fa48("4467") ? forceMode : (stryCov_9fa48("4467", "4468", "4469"), !forceMode)) {
      if (stryMutAct_9fa48("4470")) {
        {}
      } else {
        stryCov_9fa48("4470");
        console.log(stryMutAct_9fa48("4471") ? "" : (stryCov_9fa48("4471"), "🧹 Database Clear Tool"));
        console.log(stryMutAct_9fa48("4472") ? "" : (stryCov_9fa48("4472"), "⚠️  This will delete ALL chunks and embeddings from the database"));
        console.log(stryMutAct_9fa48("4473") ? "" : (stryCov_9fa48("4473"), "⚠️  This action CANNOT be undone!"));
        console.log(stryMutAct_9fa48("4474") ? "Stryker was here!" : (stryCov_9fa48("4474"), ""));

        // Create readline interface for user input
        const rl = readline.createInterface(stryMutAct_9fa48("4475") ? {} : (stryCov_9fa48("4475"), {
          input: process.stdin,
          output: process.stdout
        }));
        const confirmation = await new Promise<string>(resolve => {
          if (stryMutAct_9fa48("4476")) {
            {}
          } else {
            stryCov_9fa48("4476");
            rl.question(stryMutAct_9fa48("4477") ? "" : (stryCov_9fa48("4477"), 'Type "clear all" to continue: '), answer => {
              if (stryMutAct_9fa48("4478")) {
                {}
              } else {
                stryCov_9fa48("4478");
                rl.close();
                resolve(stryMutAct_9fa48("4480") ? answer.toUpperCase().trim() : stryMutAct_9fa48("4479") ? answer.toLowerCase() : (stryCov_9fa48("4479", "4480"), answer.toLowerCase().trim()));
              }
            });
          }
        });
        if (stryMutAct_9fa48("4483") ? confirmation === "clear all" : stryMutAct_9fa48("4482") ? false : stryMutAct_9fa48("4481") ? true : (stryCov_9fa48("4481", "4482", "4483"), confirmation !== (stryMutAct_9fa48("4484") ? "" : (stryCov_9fa48("4484"), "clear all")))) {
          if (stryMutAct_9fa48("4485")) {
            {}
          } else {
            stryCov_9fa48("4485");
            console.log(stryMutAct_9fa48("4486") ? "" : (stryCov_9fa48("4486"), "❌ Operation cancelled. Type exactly 'clear all' to proceed."));
            process.exit(0);
          }
        }
      }
    }
    console.log(stryMutAct_9fa48("4487") ? "" : (stryCov_9fa48("4487"), "🧹 Clearing database..."));
    console.log(stryMutAct_9fa48("4488") ? `` : (stryCov_9fa48("4488"), `🔗 Database: ${DATABASE_URL.replace(stryMutAct_9fa48("4489") ? /\/\/.@/ : (stryCov_9fa48("4489"), /\/\/.*@/), stryMutAct_9fa48("4490") ? "" : (stryCov_9fa48("4490"), "//***@"))}`));
    try {
      if (stryMutAct_9fa48("4491")) {
        {}
      } else {
        stryCov_9fa48("4491");
        // Initialize database
        const database = new ObsidianDatabase(DATABASE_URL);
        await database.initialize();

        // Clear all data
        await database.clearAll();
        console.log(stryMutAct_9fa48("4492") ? "" : (stryCov_9fa48("4492"), "✅ Database cleared successfully!"));
        await database.close();
      }
    } catch (error) {
      if (stryMutAct_9fa48("4493")) {
        {}
      } else {
        stryCov_9fa48("4493");
        console.error(stryMutAct_9fa48("4494") ? "" : (stryCov_9fa48("4494"), "❌ Failed to clear database:"), error);
        process.exit(1);
      }
    }
  }
}

// Handle command line arguments
const args = stryMutAct_9fa48("4495") ? process.argv : (stryCov_9fa48("4495"), process.argv.slice(2));
if (stryMutAct_9fa48("4498") ? args.includes("--help") && args.includes("-h") : stryMutAct_9fa48("4497") ? false : stryMutAct_9fa48("4496") ? true : (stryCov_9fa48("4496", "4497", "4498"), args.includes(stryMutAct_9fa48("4499") ? "" : (stryCov_9fa48("4499"), "--help")) || args.includes(stryMutAct_9fa48("4500") ? "" : (stryCov_9fa48("4500"), "-h")))) {
  if (stryMutAct_9fa48("4501")) {
    {}
  } else {
    stryCov_9fa48("4501");
    console.log(stryMutAct_9fa48("4502") ? `` : (stryCov_9fa48("4502"), `
Database Clear Tool

Usage: tsx src/scripts/clear-db.ts [options]

Environment Variables:
  DATABASE_URL    PostgreSQL connection string (required)

Options:
  --help, -h      Show this help message
  -f, --force     Force clear without confirmation prompt

Description:
  Clears all chunks and embeddings from the Obsidian RAG database.

  ⚠️  WARNING: This will permanently delete all data!

  Without -f flag: Requires typing "clear all" to proceed
  With -f flag: Skips the confirmation prompt (for scripts/CI)

Example:
  export DATABASE_URL="postgresql://user:pass@localhost:5432/obsidian_rag"
  tsx src/scripts/clear-db.ts          # Requires "clear all" confirmation
  tsx src/scripts/clear-db.ts -f      # Force clear without prompt

Note: For npm scripts with arguments, use:
  npx tsx src/scripts/clear-db.ts -f  # Instead of npm run clear-db -f
`));
    process.exit(0);
  }
}

// Run the main function
main().catch(error => {
  if (stryMutAct_9fa48("4503")) {
    {}
  } else {
    stryCov_9fa48("4503");
    console.error(stryMutAct_9fa48("4504") ? "" : (stryCov_9fa48("4504"), "❌ Unhandled error:"), error);
    process.exit(1);
  }
});