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
  if (stryMutAct_9fa48("4351")) {
    {}
  } else {
    stryCov_9fa48("4351");
    if (stryMutAct_9fa48("4354") ? false : stryMutAct_9fa48("4353") ? true : stryMutAct_9fa48("4352") ? DATABASE_URL : (stryCov_9fa48("4352", "4353", "4354"), !DATABASE_URL)) {
      if (stryMutAct_9fa48("4355")) {
        {}
      } else {
        stryCov_9fa48("4355");
        console.error(stryMutAct_9fa48("4356") ? "" : (stryCov_9fa48("4356"), "❌ DATABASE_URL environment variable is required"));
        process.exit(1);
      }
    }

    // Check for force flag
    const args = stryMutAct_9fa48("4357") ? process.argv : (stryCov_9fa48("4357"), process.argv.slice(2));
    const forceMode = stryMutAct_9fa48("4360") ? args.includes("-f") && args.includes("--force") : stryMutAct_9fa48("4359") ? false : stryMutAct_9fa48("4358") ? true : (stryCov_9fa48("4358", "4359", "4360"), args.includes(stryMutAct_9fa48("4361") ? "" : (stryCov_9fa48("4361"), "-f")) || args.includes(stryMutAct_9fa48("4362") ? "" : (stryCov_9fa48("4362"), "--force")));
    if (stryMutAct_9fa48("4365") ? false : stryMutAct_9fa48("4364") ? true : stryMutAct_9fa48("4363") ? forceMode : (stryCov_9fa48("4363", "4364", "4365"), !forceMode)) {
      if (stryMutAct_9fa48("4366")) {
        {}
      } else {
        stryCov_9fa48("4366");
        console.log(stryMutAct_9fa48("4367") ? "" : (stryCov_9fa48("4367"), "🧹 Database Clear Tool"));
        console.log(stryMutAct_9fa48("4368") ? "" : (stryCov_9fa48("4368"), "⚠️  This will delete ALL chunks and embeddings from the database"));
        console.log(stryMutAct_9fa48("4369") ? "" : (stryCov_9fa48("4369"), "⚠️  This action CANNOT be undone!"));
        console.log(stryMutAct_9fa48("4370") ? "Stryker was here!" : (stryCov_9fa48("4370"), ""));

        // Create readline interface for user input
        const rl = readline.createInterface(stryMutAct_9fa48("4371") ? {} : (stryCov_9fa48("4371"), {
          input: process.stdin,
          output: process.stdout
        }));
        const confirmation = await new Promise<string>(resolve => {
          if (stryMutAct_9fa48("4372")) {
            {}
          } else {
            stryCov_9fa48("4372");
            rl.question(stryMutAct_9fa48("4373") ? "" : (stryCov_9fa48("4373"), 'Type "clear all" to continue: '), answer => {
              if (stryMutAct_9fa48("4374")) {
                {}
              } else {
                stryCov_9fa48("4374");
                rl.close();
                resolve(stryMutAct_9fa48("4376") ? answer.toUpperCase().trim() : stryMutAct_9fa48("4375") ? answer.toLowerCase() : (stryCov_9fa48("4375", "4376"), answer.toLowerCase().trim()));
              }
            });
          }
        });
        if (stryMutAct_9fa48("4379") ? confirmation === "clear all" : stryMutAct_9fa48("4378") ? false : stryMutAct_9fa48("4377") ? true : (stryCov_9fa48("4377", "4378", "4379"), confirmation !== (stryMutAct_9fa48("4380") ? "" : (stryCov_9fa48("4380"), "clear all")))) {
          if (stryMutAct_9fa48("4381")) {
            {}
          } else {
            stryCov_9fa48("4381");
            console.log(stryMutAct_9fa48("4382") ? "" : (stryCov_9fa48("4382"), "❌ Operation cancelled. Type exactly 'clear all' to proceed."));
            process.exit(0);
          }
        }
      }
    }
    console.log(stryMutAct_9fa48("4383") ? "" : (stryCov_9fa48("4383"), "🧹 Clearing database..."));
    console.log(stryMutAct_9fa48("4384") ? `` : (stryCov_9fa48("4384"), `🔗 Database: ${DATABASE_URL.replace(stryMutAct_9fa48("4385") ? /\/\/.@/ : (stryCov_9fa48("4385"), /\/\/.*@/), stryMutAct_9fa48("4386") ? "" : (stryCov_9fa48("4386"), "//***@"))}`));
    try {
      if (stryMutAct_9fa48("4387")) {
        {}
      } else {
        stryCov_9fa48("4387");
        // Initialize database
        const database = new ObsidianDatabase(DATABASE_URL);
        await database.initialize();

        // Clear all data
        await database.clearAll();
        console.log(stryMutAct_9fa48("4388") ? "" : (stryCov_9fa48("4388"), "✅ Database cleared successfully!"));
        await database.close();
      }
    } catch (error) {
      if (stryMutAct_9fa48("4389")) {
        {}
      } else {
        stryCov_9fa48("4389");
        console.error(stryMutAct_9fa48("4390") ? "" : (stryCov_9fa48("4390"), "❌ Failed to clear database:"), error);
        process.exit(1);
      }
    }
  }
}

// Handle command line arguments
const args = stryMutAct_9fa48("4391") ? process.argv : (stryCov_9fa48("4391"), process.argv.slice(2));
if (stryMutAct_9fa48("4394") ? args.includes("--help") && args.includes("-h") : stryMutAct_9fa48("4393") ? false : stryMutAct_9fa48("4392") ? true : (stryCov_9fa48("4392", "4393", "4394"), args.includes(stryMutAct_9fa48("4395") ? "" : (stryCov_9fa48("4395"), "--help")) || args.includes(stryMutAct_9fa48("4396") ? "" : (stryCov_9fa48("4396"), "-h")))) {
  if (stryMutAct_9fa48("4397")) {
    {}
  } else {
    stryCov_9fa48("4397");
    console.log(stryMutAct_9fa48("4398") ? `` : (stryCov_9fa48("4398"), `
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
  if (stryMutAct_9fa48("4399")) {
    {}
  } else {
    stryCov_9fa48("4399");
    console.error(stryMutAct_9fa48("4400") ? "" : (stryCov_9fa48("4400"), "❌ Unhandled error:"), error);
    process.exit(1);
  }
});