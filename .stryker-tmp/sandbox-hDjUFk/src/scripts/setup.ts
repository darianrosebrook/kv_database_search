#!/usr/bin/env tsx
// @ts-nocheck

/**
 * Obsidian RAG Setup Script
 *
 * Interactive setup script to configure and test all components
 * for the Obsidian RAG system.
 *
 * @author @darianrosebrook
 */
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
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { ObsidianDatabase } from "../lib/database";
import { ObsidianEmbeddingService } from "../lib/embeddings";

// Load environment variables
dotenv.config();
const rl = readline.createInterface(stryMutAct_9fa48("5396") ? {} : (stryCov_9fa48("5396"), {
  input: process.stdin,
  output: process.stdout
}));
const DATABASE_URL = process.env.DATABASE_URL;
const EMBEDDING_MODEL = stryMutAct_9fa48("5399") ? process.env.EMBEDDING_MODEL && "embeddinggemma" : stryMutAct_9fa48("5398") ? false : stryMutAct_9fa48("5397") ? true : (stryCov_9fa48("5397", "5398", "5399"), process.env.EMBEDDING_MODEL || (stryMutAct_9fa48("5400") ? "" : (stryCov_9fa48("5400"), "embeddinggemma")));
const EMBEDDING_DIMENSION = parseInt(stryMutAct_9fa48("5403") ? process.env.EMBEDDING_DIMENSION && "768" : stryMutAct_9fa48("5402") ? false : stryMutAct_9fa48("5401") ? true : (stryCov_9fa48("5401", "5402", "5403"), process.env.EMBEDDING_DIMENSION || (stryMutAct_9fa48("5404") ? "" : (stryCov_9fa48("5404"), "768"))));
const OBSIDIAN_VAULT_PATH = stryMutAct_9fa48("5407") ? process.env.OBSIDIAN_VAULT_PATH && "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault" : stryMutAct_9fa48("5406") ? false : stryMutAct_9fa48("5405") ? true : (stryCov_9fa48("5405", "5406", "5407"), process.env.OBSIDIAN_VAULT_PATH || (stryMutAct_9fa48("5408") ? "" : (stryCov_9fa48("5408"), "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault")));
function ask(question: string): Promise<string> {
  if (stryMutAct_9fa48("5409")) {
    {}
  } else {
    stryCov_9fa48("5409");
    return new Promise(resolve => {
      if (stryMutAct_9fa48("5410")) {
        {}
      } else {
        stryCov_9fa48("5410");
        rl.question(question, resolve);
      }
    });
  }
}
function logStep(step: number, message: string) {
  if (stryMutAct_9fa48("5411")) {
    {}
  } else {
    stryCov_9fa48("5411");
    console.log(stryMutAct_9fa48("5412") ? `` : (stryCov_9fa48("5412"), `\n📋 Step ${step}: ${message}`));
  }
}
function logSuccess(message: string) {
  if (stryMutAct_9fa48("5413")) {
    {}
  } else {
    stryCov_9fa48("5413");
    console.log(stryMutAct_9fa48("5414") ? `` : (stryCov_9fa48("5414"), `✅ ${message}`));
  }
}
function logError(message: string, hint?: string) {
  if (stryMutAct_9fa48("5415")) {
    {}
  } else {
    stryCov_9fa48("5415");
    console.log(stryMutAct_9fa48("5416") ? `` : (stryCov_9fa48("5416"), `❌ ${message}`));
    if (stryMutAct_9fa48("5418") ? false : stryMutAct_9fa48("5417") ? true : (stryCov_9fa48("5417", "5418"), hint)) {
      if (stryMutAct_9fa48("5419")) {
        {}
      } else {
        stryCov_9fa48("5419");
        console.log(stryMutAct_9fa48("5420") ? `` : (stryCov_9fa48("5420"), `💡 ${hint}`));
      }
    }
  }
}
function logWarning(message: string, hint?: string) {
  if (stryMutAct_9fa48("5421")) {
    {}
  } else {
    stryCov_9fa48("5421");
    console.log(stryMutAct_9fa48("5422") ? `` : (stryCov_9fa48("5422"), `⚠️  ${message}`));
    if (stryMutAct_9fa48("5424") ? false : stryMutAct_9fa48("5423") ? true : (stryCov_9fa48("5423", "5424"), hint)) {
      if (stryMutAct_9fa48("5425")) {
        {}
      } else {
        stryCov_9fa48("5425");
        console.log(stryMutAct_9fa48("5426") ? `` : (stryCov_9fa48("5426"), `💡 ${hint}`));
      }
    }
  }
}
async function main() {
  if (stryMutAct_9fa48("5427")) {
    {}
  } else {
    stryCov_9fa48("5427");
    console.log(stryMutAct_9fa48("5428") ? "" : (stryCov_9fa48("5428"), "🚀 Obsidian RAG Setup Wizard"));
    console.log((stryMutAct_9fa48("5429") ? "" : (stryCov_9fa48("5429"), "=")).repeat(50));
    console.log(stryMutAct_9fa48("5430") ? "" : (stryCov_9fa48("5430"), "This script will help you configure and test your Obsidian RAG system."));
    console.log(stryMutAct_9fa48("5431") ? "" : (stryCov_9fa48("5431"), "Press Ctrl+C at any time to exit.\n"));
    logStep(1, stryMutAct_9fa48("5432") ? "" : (stryCov_9fa48("5432"), "Environment Configuration"));
    if (stryMutAct_9fa48("5435") ? false : stryMutAct_9fa48("5434") ? true : stryMutAct_9fa48("5433") ? DATABASE_URL : (stryCov_9fa48("5433", "5434", "5435"), !DATABASE_URL)) {
      if (stryMutAct_9fa48("5436")) {
        {}
      } else {
        stryCov_9fa48("5436");
        logError(stryMutAct_9fa48("5437") ? "" : (stryCov_9fa48("5437"), "DATABASE_URL environment variable is required"));
        console.log(stryMutAct_9fa48("5438") ? "" : (stryCov_9fa48("5438"), "\nPlease set up your environment:"));
        console.log(stryMutAct_9fa48("5439") ? "" : (stryCov_9fa48("5439"), "1. Copy env.example to .env"));
        console.log(stryMutAct_9fa48("5440") ? "" : (stryCov_9fa48("5440"), "2. Edit .env file with your database connection"));
        console.log(stryMutAct_9fa48("5441") ? "" : (stryCov_9fa48("5441"), "3. Run this setup script again"));
        process.exit(1);
      }
    }

    // Check if .env exists and show current configuration
    console.log(stryMutAct_9fa48("5442") ? "" : (stryCov_9fa48("5442"), "Current Configuration:"));
    console.log(stryMutAct_9fa48("5443") ? `` : (stryCov_9fa48("5443"), `   🗄️  Database: ${DATABASE_URL ? stryMutAct_9fa48("5444") ? "" : (stryCov_9fa48("5444"), "✅ Configured") : stryMutAct_9fa48("5445") ? "" : (stryCov_9fa48("5445"), "❌ Missing")}`));
    console.log(stryMutAct_9fa48("5446") ? `` : (stryCov_9fa48("5446"), `   🤖 Embedding: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSION}d)`));
    console.log(stryMutAct_9fa48("5447") ? `` : (stryCov_9fa48("5447"), `   📁 Vault Path: ${OBSIDIAN_VAULT_PATH}`));
    const updateConfig = await ask(stryMutAct_9fa48("5448") ? "" : (stryCov_9fa48("5448"), "\nWould you like to update any configuration? (y/n): "));
    if (stryMutAct_9fa48("5451") ? updateConfig.toLowerCase() !== "y" : stryMutAct_9fa48("5450") ? false : stryMutAct_9fa48("5449") ? true : (stryCov_9fa48("5449", "5450", "5451"), (stryMutAct_9fa48("5452") ? updateConfig.toUpperCase() : (stryCov_9fa48("5452"), updateConfig.toLowerCase())) === (stryMutAct_9fa48("5453") ? "" : (stryCov_9fa48("5453"), "y")))) {
      if (stryMutAct_9fa48("5454")) {
        {}
      } else {
        stryCov_9fa48("5454");
        await updateConfiguration();
      }
    }
    logStep(2, stryMutAct_9fa48("5455") ? "" : (stryCov_9fa48("5455"), "Testing Database Connection"));
    await testDatabase();
    logStep(3, stryMutAct_9fa48("5456") ? "" : (stryCov_9fa48("5456"), "Testing Embedding Service"));
    await testEmbeddings();
    logStep(4, stryMutAct_9fa48("5457") ? "" : (stryCov_9fa48("5457"), "Testing Obsidian Vault"));
    await testVault();
    logStep(5, stryMutAct_9fa48("5458") ? "" : (stryCov_9fa48("5458"), "Final Setup"));
    console.log(stryMutAct_9fa48("5459") ? "" : (stryCov_9fa48("5459"), "\n🎉 Setup Complete!"));
    console.log(stryMutAct_9fa48("5460") ? "" : (stryCov_9fa48("5460"), "You can now start the server with:"));
    console.log(stryMutAct_9fa48("5461") ? "" : (stryCov_9fa48("5461"), "   npm run server"));
    console.log(stryMutAct_9fa48("5462") ? "" : (stryCov_9fa48("5462"), "   or"));
    console.log(stryMutAct_9fa48("5463") ? "" : (stryCov_9fa48("5463"), "   npx tsx src/server.ts"));
    rl.close();
  }
}
async function updateConfiguration() {
  if (stryMutAct_9fa48("5464")) {
    {}
  } else {
    stryCov_9fa48("5464");
    console.log(stryMutAct_9fa48("5465") ? "" : (stryCov_9fa48("5465"), "\n📝 Updating Configuration..."));
    const newDbUrl = stryMutAct_9fa48("5468") ? (await ask(`Database URL [${DATABASE_URL}]: `)) && DATABASE_URL! : stryMutAct_9fa48("5467") ? false : stryMutAct_9fa48("5466") ? true : (stryCov_9fa48("5466", "5467", "5468"), (await ask(stryMutAct_9fa48("5469") ? `` : (stryCov_9fa48("5469"), `Database URL [${DATABASE_URL}]: `))) || DATABASE_URL!);
    const newModel = stryMutAct_9fa48("5472") ? (await ask(`Embedding Model [${EMBEDDING_MODEL}]: `)) && EMBEDDING_MODEL : stryMutAct_9fa48("5471") ? false : stryMutAct_9fa48("5470") ? true : (stryCov_9fa48("5470", "5471", "5472"), (await ask(stryMutAct_9fa48("5473") ? `` : (stryCov_9fa48("5473"), `Embedding Model [${EMBEDDING_MODEL}]: `))) || EMBEDDING_MODEL);
    const newDimension = stryMutAct_9fa48("5476") ? (await ask(`Embedding Dimension [${EMBEDDING_DIMENSION}]: `)) && EMBEDDING_DIMENSION.toString() : stryMutAct_9fa48("5475") ? false : stryMutAct_9fa48("5474") ? true : (stryCov_9fa48("5474", "5475", "5476"), (await ask(stryMutAct_9fa48("5477") ? `` : (stryCov_9fa48("5477"), `Embedding Dimension [${EMBEDDING_DIMENSION}]: `))) || EMBEDDING_DIMENSION.toString());
    const newVaultPath = stryMutAct_9fa48("5480") ? (await ask(`Obsidian Vault Path [${OBSIDIAN_VAULT_PATH}]: `)) && OBSIDIAN_VAULT_PATH : stryMutAct_9fa48("5479") ? false : stryMutAct_9fa48("5478") ? true : (stryCov_9fa48("5478", "5479", "5480"), (await ask(stryMutAct_9fa48("5481") ? `` : (stryCov_9fa48("5481"), `Obsidian Vault Path [${OBSIDIAN_VAULT_PATH}]: `))) || OBSIDIAN_VAULT_PATH);

    // Update .env file
    let envContent = fs.readFileSync(stryMutAct_9fa48("5482") ? "" : (stryCov_9fa48("5482"), ".env"), stryMutAct_9fa48("5483") ? "" : (stryCov_9fa48("5483"), "utf-8"));
    envContent = envContent.replace(stryMutAct_9fa48("5484") ? /DATABASE_URL=./ : (stryCov_9fa48("5484"), /DATABASE_URL=.*/), stryMutAct_9fa48("5485") ? `` : (stryCov_9fa48("5485"), `DATABASE_URL=${newDbUrl}`));
    envContent = envContent.replace(stryMutAct_9fa48("5486") ? /EMBEDDING_MODEL=./ : (stryCov_9fa48("5486"), /EMBEDDING_MODEL=.*/), stryMutAct_9fa48("5487") ? `` : (stryCov_9fa48("5487"), `EMBEDDING_MODEL=${newModel}`));
    envContent = envContent.replace(stryMutAct_9fa48("5488") ? /EMBEDDING_DIMENSION=./ : (stryCov_9fa48("5488"), /EMBEDDING_DIMENSION=.*/), stryMutAct_9fa48("5489") ? `` : (stryCov_9fa48("5489"), `EMBEDDING_DIMENSION=${newDimension}`));
    envContent = envContent.replace(stryMutAct_9fa48("5490") ? /OBSIDIAN_VAULT_PATH=./ : (stryCov_9fa48("5490"), /OBSIDIAN_VAULT_PATH=.*/), stryMutAct_9fa48("5491") ? `` : (stryCov_9fa48("5491"), `OBSIDIAN_VAULT_PATH=${newVaultPath}`));
    fs.writeFileSync(stryMutAct_9fa48("5492") ? "" : (stryCov_9fa48("5492"), ".env"), envContent);
    logSuccess(stryMutAct_9fa48("5493") ? "" : (stryCov_9fa48("5493"), "Configuration updated. Please restart the setup script."));
    process.exit(0);
  }
}
async function testDatabase() {
  if (stryMutAct_9fa48("5494")) {
    {}
  } else {
    stryCov_9fa48("5494");
    try {
      if (stryMutAct_9fa48("5495")) {
        {}
      } else {
        stryCov_9fa48("5495");
        const db = new ObsidianDatabase(DATABASE_URL!);
        await db.initialize();
        const stats = await db.getStats();
        logSuccess(stryMutAct_9fa48("5496") ? "" : (stryCov_9fa48("5496"), "Database connection successful!"));
        console.log(stryMutAct_9fa48("5497") ? `` : (stryCov_9fa48("5497"), `   📊 Total chunks: ${stryMutAct_9fa48("5500") ? stats.totalChunks && 0 : stryMutAct_9fa48("5499") ? false : stryMutAct_9fa48("5498") ? true : (stryCov_9fa48("5498", "5499", "5500"), stats.totalChunks || 0)}`));
        console.log(stryMutAct_9fa48("5501") ? `` : (stryCov_9fa48("5501"), `   📅 Last update: ${stryMutAct_9fa48("5504") ? stats.lastUpdate && "Never" : stryMutAct_9fa48("5503") ? false : stryMutAct_9fa48("5502") ? true : (stryCov_9fa48("5502", "5503", "5504"), stats.lastUpdate || (stryMutAct_9fa48("5505") ? "" : (stryCov_9fa48("5505"), "Never")))}`));
        await db.close();
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5506")) {
        {}
      } else {
        stryCov_9fa48("5506");
        logError(stryMutAct_9fa48("5507") ? "" : (stryCov_9fa48("5507"), "Database connection failed"), error.message);
        if (stryMutAct_9fa48("5510") ? error.message.includes("role") || error.message.includes("does not exist") : stryMutAct_9fa48("5509") ? false : stryMutAct_9fa48("5508") ? true : (stryCov_9fa48("5508", "5509", "5510"), error.message.includes(stryMutAct_9fa48("5511") ? "" : (stryCov_9fa48("5511"), "role")) && error.message.includes(stryMutAct_9fa48("5512") ? "" : (stryCov_9fa48("5512"), "does not exist")))) {
          if (stryMutAct_9fa48("5513")) {
            {}
          } else {
            stryCov_9fa48("5513");
            logWarning(stryMutAct_9fa48("5514") ? "" : (stryCov_9fa48("5514"), "Database user doesn't exist"));
            console.log(stryMutAct_9fa48("5515") ? "" : (stryCov_9fa48("5515"), "   💡 You need to create a PostgreSQL user or update DATABASE_URL"));
            console.log(stryMutAct_9fa48("5516") ? "" : (stryCov_9fa48("5516"), "   💡 Options:"));
            console.log(stryMutAct_9fa48("5517") ? "" : (stryCov_9fa48("5517"), "      1. Create user: CREATE USER username WITH PASSWORD 'password'"));
            console.log(stryMutAct_9fa48("5518") ? "" : (stryCov_9fa48("5518"), "      2. Update .env with correct credentials"));
            console.log(stryMutAct_9fa48("5519") ? "" : (stryCov_9fa48("5519"), "      3. Use a different database user"));
          }
        } else if (stryMutAct_9fa48("5522") ? error.message.includes("database") || error.message.includes("does not exist") : stryMutAct_9fa48("5521") ? false : stryMutAct_9fa48("5520") ? true : (stryCov_9fa48("5520", "5521", "5522"), error.message.includes(stryMutAct_9fa48("5523") ? "" : (stryCov_9fa48("5523"), "database")) && error.message.includes(stryMutAct_9fa48("5524") ? "" : (stryCov_9fa48("5524"), "does not exist")))) {
          if (stryMutAct_9fa48("5525")) {
            {}
          } else {
            stryCov_9fa48("5525");
            logWarning(stryMutAct_9fa48("5526") ? "" : (stryCov_9fa48("5526"), "Database doesn't exist"));
            console.log(stryMutAct_9fa48("5527") ? "" : (stryCov_9fa48("5527"), "   💡 You need to create the database first"));
            console.log(stryMutAct_9fa48("5528") ? "" : (stryCov_9fa48("5528"), "   💡 Run: CREATE DATABASE obsidian_rag"));
          }
        }
        const setupDb = await ask(stryMutAct_9fa48("5529") ? "" : (stryCov_9fa48("5529"), "\nWould you like help setting up the database? (y/n): "));
        if (stryMutAct_9fa48("5532") ? setupDb.toLowerCase() !== "y" : stryMutAct_9fa48("5531") ? false : stryMutAct_9fa48("5530") ? true : (stryCov_9fa48("5530", "5531", "5532"), (stryMutAct_9fa48("5533") ? setupDb.toUpperCase() : (stryCov_9fa48("5533"), setupDb.toLowerCase())) === (stryMutAct_9fa48("5534") ? "" : (stryCov_9fa48("5534"), "y")))) {
          if (stryMutAct_9fa48("5535")) {
            {}
          } else {
            stryCov_9fa48("5535");
            await setupDatabaseInstructions();
          }
        }
        const retry = await ask(stryMutAct_9fa48("5536") ? "" : (stryCov_9fa48("5536"), "Would you like to continue anyway? (y/n): "));
        if (stryMutAct_9fa48("5539") ? retry.toLowerCase() === "y" : stryMutAct_9fa48("5538") ? false : stryMutAct_9fa48("5537") ? true : (stryCov_9fa48("5537", "5538", "5539"), (stryMutAct_9fa48("5540") ? retry.toUpperCase() : (stryCov_9fa48("5540"), retry.toLowerCase())) !== (stryMutAct_9fa48("5541") ? "" : (stryCov_9fa48("5541"), "y")))) {
          if (stryMutAct_9fa48("5542")) {
            {}
          } else {
            stryCov_9fa48("5542");
            process.exit(1);
          }
        }
      }
    }
  }
}
async function setupDatabaseInstructions() {
  if (stryMutAct_9fa48("5543")) {
    {}
  } else {
    stryCov_9fa48("5543");
    console.log(stryMutAct_9fa48("5544") ? "" : (stryCov_9fa48("5544"), "\n📋 Database Setup Instructions:"));
    console.log((stryMutAct_9fa48("5545") ? "" : (stryCov_9fa48("5545"), "=")).repeat(40));
    console.log(stryMutAct_9fa48("5546") ? "" : (stryCov_9fa48("5546"), "1. Connect to PostgreSQL:"));
    console.log(stryMutAct_9fa48("5547") ? "" : (stryCov_9fa48("5547"), "   psql -h localhost -U postgres"));
    console.log(stryMutAct_9fa48("5548") ? "Stryker was here!" : (stryCov_9fa48("5548"), ""));
    console.log(stryMutAct_9fa48("5549") ? "" : (stryCov_9fa48("5549"), "2. Create a database user:"));
    console.log(stryMutAct_9fa48("5550") ? "" : (stryCov_9fa48("5550"), "   CREATE USER obsidian_rag_user WITH PASSWORD 'your_secure_password';"));
    console.log(stryMutAct_9fa48("5551") ? "Stryker was here!" : (stryCov_9fa48("5551"), ""));
    console.log(stryMutAct_9fa48("5552") ? "" : (stryCov_9fa48("5552"), "3. Create the database:"));
    console.log(stryMutAct_9fa48("5553") ? "" : (stryCov_9fa48("5553"), "   CREATE DATABASE obsidian_rag OWNER obsidian_rag_user;"));
    console.log(stryMutAct_9fa48("5554") ? "Stryker was here!" : (stryCov_9fa48("5554"), ""));
    console.log(stryMutAct_9fa48("5555") ? "" : (stryCov_9fa48("5555"), "4. Grant privileges:"));
    console.log(stryMutAct_9fa48("5556") ? "" : (stryCov_9fa48("5556"), "   GRANT ALL PRIVILEGES ON DATABASE obsidian_rag TO obsidian_rag_user;"));
    console.log(stryMutAct_9fa48("5557") ? "Stryker was here!" : (stryCov_9fa48("5557"), ""));
    console.log(stryMutAct_9fa48("5558") ? "" : (stryCov_9fa48("5558"), "5. Update your .env file:"));
    console.log(stryMutAct_9fa48("5559") ? "" : (stryCov_9fa48("5559"), "   DATABASE_URL=postgresql://obsidian_rag_user:your_secure_password@localhost:5432/obsidian_rag"));
    console.log(stryMutAct_9fa48("5560") ? "Stryker was here!" : (stryCov_9fa48("5560"), ""));
    console.log(stryMutAct_9fa48("5561") ? "" : (stryCov_9fa48("5561"), "6. Test the connection:"));
    console.log(stryMutAct_9fa48("5562") ? "" : (stryCov_9fa48("5562"), "   npm run setup"));
    const newUrl = await ask(stryMutAct_9fa48("5563") ? "" : (stryCov_9fa48("5563"), "\nEnter your new DATABASE_URL: "));
    if (stryMutAct_9fa48("5565") ? false : stryMutAct_9fa48("5564") ? true : (stryCov_9fa48("5564", "5565"), newUrl)) {
      if (stryMutAct_9fa48("5566")) {
        {}
      } else {
        stryCov_9fa48("5566");
        // Update .env file
        let envContent = fs.readFileSync(stryMutAct_9fa48("5567") ? "" : (stryCov_9fa48("5567"), ".env"), stryMutAct_9fa48("5568") ? "" : (stryCov_9fa48("5568"), "utf-8"));
        envContent = envContent.replace(stryMutAct_9fa48("5569") ? /DATABASE_URL=./ : (stryCov_9fa48("5569"), /DATABASE_URL=.*/), stryMutAct_9fa48("5570") ? `` : (stryCov_9fa48("5570"), `DATABASE_URL=${newUrl}`));
        fs.writeFileSync(stryMutAct_9fa48("5571") ? "" : (stryCov_9fa48("5571"), ".env"), envContent);
        logSuccess(stryMutAct_9fa48("5572") ? "" : (stryCov_9fa48("5572"), "DATABASE_URL updated! Please run setup again."));
        process.exit(0);
      }
    }
  }
}
async function testEmbeddings() {
  if (stryMutAct_9fa48("5573")) {
    {}
  } else {
    stryCov_9fa48("5573");
    try {
      if (stryMutAct_9fa48("5574")) {
        {}
      } else {
        stryCov_9fa48("5574");
        const embeddingService = new ObsidianEmbeddingService(stryMutAct_9fa48("5575") ? {} : (stryCov_9fa48("5575"), {
          model: EMBEDDING_MODEL,
          dimension: EMBEDDING_DIMENSION
        }));
        const test = await embeddingService.testConnection();
        if (stryMutAct_9fa48("5577") ? false : stryMutAct_9fa48("5576") ? true : (stryCov_9fa48("5576", "5577"), test.success)) {
          if (stryMutAct_9fa48("5578")) {
            {}
          } else {
            stryCov_9fa48("5578");
            logSuccess(stryMutAct_9fa48("5579") ? "" : (stryCov_9fa48("5579"), "Embedding service ready!"));
            console.log(stryMutAct_9fa48("5580") ? `` : (stryCov_9fa48("5580"), `   🤖 Model: ${EMBEDDING_MODEL}`));
            console.log(stryMutAct_9fa48("5581") ? `` : (stryCov_9fa48("5581"), `   📐 Dimension: ${test.dimension}`));
          }
        } else {
          if (stryMutAct_9fa48("5582")) {
            {}
          } else {
            stryCov_9fa48("5582");
            logError(stryMutAct_9fa48("5583") ? "" : (stryCov_9fa48("5583"), "Embedding service test failed"));
          }
        }
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5584")) {
        {}
      } else {
        stryCov_9fa48("5584");
        logError(stryMutAct_9fa48("5585") ? "" : (stryCov_9fa48("5585"), "Embedding service connection failed"), error.message);
        logWarning(stryMutAct_9fa48("5586") ? "" : (stryCov_9fa48("5586"), "Make sure Ollama is running and the model is installed"));
        console.log(stryMutAct_9fa48("5587") ? "" : (stryCov_9fa48("5587"), "   Install: ollama pull embeddinggemma"));
      }
    }
  }
}
async function testVault() {
  if (stryMutAct_9fa48("5588")) {
    {}
  } else {
    stryCov_9fa48("5588");
    if (stryMutAct_9fa48("5591") ? false : stryMutAct_9fa48("5590") ? true : stryMutAct_9fa48("5589") ? fs.existsSync(OBSIDIAN_VAULT_PATH) : (stryCov_9fa48("5589", "5590", "5591"), !fs.existsSync(OBSIDIAN_VAULT_PATH))) {
      if (stryMutAct_9fa48("5592")) {
        {}
      } else {
        stryCov_9fa48("5592");
        logWarning(stryMutAct_9fa48("5593") ? "" : (stryCov_9fa48("5593"), "Obsidian vault directory not found"));
        console.log(stryMutAct_9fa48("5594") ? `` : (stryCov_9fa48("5594"), `   Path: ${OBSIDIAN_VAULT_PATH}`));
        const createVault = await ask(stryMutAct_9fa48("5595") ? "" : (stryCov_9fa48("5595"), "Would you like to create this directory? (y/n): "));
        if (stryMutAct_9fa48("5598") ? createVault.toLowerCase() !== "y" : stryMutAct_9fa48("5597") ? false : stryMutAct_9fa48("5596") ? true : (stryCov_9fa48("5596", "5597", "5598"), (stryMutAct_9fa48("5599") ? createVault.toUpperCase() : (stryCov_9fa48("5599"), createVault.toLowerCase())) === (stryMutAct_9fa48("5600") ? "" : (stryCov_9fa48("5600"), "y")))) {
          if (stryMutAct_9fa48("5601")) {
            {}
          } else {
            stryCov_9fa48("5601");
            fs.mkdirSync(OBSIDIAN_VAULT_PATH, stryMutAct_9fa48("5602") ? {} : (stryCov_9fa48("5602"), {
              recursive: stryMutAct_9fa48("5603") ? false : (stryCov_9fa48("5603"), true)
            }));
            logSuccess(stryMutAct_9fa48("5604") ? "" : (stryCov_9fa48("5604"), "Vault directory created"));
          }
        }
      }
    } else {
      if (stryMutAct_9fa48("5605")) {
        {}
      } else {
        stryCov_9fa48("5605");
        logSuccess(stryMutAct_9fa48("5606") ? "" : (stryCov_9fa48("5606"), "Obsidian vault directory found"));
        const files = fs.readdirSync(OBSIDIAN_VAULT_PATH);
        console.log(stryMutAct_9fa48("5607") ? `` : (stryCov_9fa48("5607"), `   📁 Contains: ${files.length} items`));
      }
    }

    // Check for typical Obsidian files
    const markdownFiles = stryMutAct_9fa48("5608") ? fs.readdirSync(OBSIDIAN_VAULT_PATH) : (stryCov_9fa48("5608"), fs.readdirSync(OBSIDIAN_VAULT_PATH).filter(stryMutAct_9fa48("5609") ? () => undefined : (stryCov_9fa48("5609"), f => stryMutAct_9fa48("5610") ? f.startsWith(".md") : (stryCov_9fa48("5610"), f.endsWith(stryMutAct_9fa48("5611") ? "" : (stryCov_9fa48("5611"), ".md"))))));
    if (stryMutAct_9fa48("5615") ? markdownFiles.length <= 0 : stryMutAct_9fa48("5614") ? markdownFiles.length >= 0 : stryMutAct_9fa48("5613") ? false : stryMutAct_9fa48("5612") ? true : (stryCov_9fa48("5612", "5613", "5614", "5615"), markdownFiles.length > 0)) {
      if (stryMutAct_9fa48("5616")) {
        {}
      } else {
        stryCov_9fa48("5616");
        logSuccess(stryMutAct_9fa48("5617") ? `` : (stryCov_9fa48("5617"), `Found ${markdownFiles.length} markdown files`));
      }
    } else {
      if (stryMutAct_9fa48("5618")) {
        {}
      } else {
        stryCov_9fa48("5618");
        logWarning(stryMutAct_9fa48("5619") ? "" : (stryCov_9fa48("5619"), "No markdown files found in vault"));
        console.log(stryMutAct_9fa48("5620") ? "" : (stryCov_9fa48("5620"), "   Add some .md files to your Obsidian vault to get started"));
      }
    }
  }
}