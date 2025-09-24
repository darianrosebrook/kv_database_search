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
const rl = readline.createInterface(stryMutAct_9fa48("5292") ? {} : (stryCov_9fa48("5292"), {
  input: process.stdin,
  output: process.stdout
}));
const DATABASE_URL = process.env.DATABASE_URL;
const EMBEDDING_MODEL = stryMutAct_9fa48("5295") ? process.env.EMBEDDING_MODEL && "embeddinggemma" : stryMutAct_9fa48("5294") ? false : stryMutAct_9fa48("5293") ? true : (stryCov_9fa48("5293", "5294", "5295"), process.env.EMBEDDING_MODEL || (stryMutAct_9fa48("5296") ? "" : (stryCov_9fa48("5296"), "embeddinggemma")));
const EMBEDDING_DIMENSION = parseInt(stryMutAct_9fa48("5299") ? process.env.EMBEDDING_DIMENSION && "768" : stryMutAct_9fa48("5298") ? false : stryMutAct_9fa48("5297") ? true : (stryCov_9fa48("5297", "5298", "5299"), process.env.EMBEDDING_DIMENSION || (stryMutAct_9fa48("5300") ? "" : (stryCov_9fa48("5300"), "768"))));
const OBSIDIAN_VAULT_PATH = stryMutAct_9fa48("5303") ? process.env.OBSIDIAN_VAULT_PATH && "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault" : stryMutAct_9fa48("5302") ? false : stryMutAct_9fa48("5301") ? true : (stryCov_9fa48("5301", "5302", "5303"), process.env.OBSIDIAN_VAULT_PATH || (stryMutAct_9fa48("5304") ? "" : (stryCov_9fa48("5304"), "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault")));
function ask(question: string): Promise<string> {
  if (stryMutAct_9fa48("5305")) {
    {}
  } else {
    stryCov_9fa48("5305");
    return new Promise(resolve => {
      if (stryMutAct_9fa48("5306")) {
        {}
      } else {
        stryCov_9fa48("5306");
        rl.question(question, resolve);
      }
    });
  }
}
function logStep(step: number, message: string) {
  if (stryMutAct_9fa48("5307")) {
    {}
  } else {
    stryCov_9fa48("5307");
    console.log(stryMutAct_9fa48("5308") ? `` : (stryCov_9fa48("5308"), `\n📋 Step ${step}: ${message}`));
  }
}
function logSuccess(message: string) {
  if (stryMutAct_9fa48("5309")) {
    {}
  } else {
    stryCov_9fa48("5309");
    console.log(stryMutAct_9fa48("5310") ? `` : (stryCov_9fa48("5310"), `✅ ${message}`));
  }
}
function logError(message: string, hint?: string) {
  if (stryMutAct_9fa48("5311")) {
    {}
  } else {
    stryCov_9fa48("5311");
    console.log(stryMutAct_9fa48("5312") ? `` : (stryCov_9fa48("5312"), `❌ ${message}`));
    if (stryMutAct_9fa48("5314") ? false : stryMutAct_9fa48("5313") ? true : (stryCov_9fa48("5313", "5314"), hint)) {
      if (stryMutAct_9fa48("5315")) {
        {}
      } else {
        stryCov_9fa48("5315");
        console.log(stryMutAct_9fa48("5316") ? `` : (stryCov_9fa48("5316"), `💡 ${hint}`));
      }
    }
  }
}
function logWarning(message: string, hint?: string) {
  if (stryMutAct_9fa48("5317")) {
    {}
  } else {
    stryCov_9fa48("5317");
    console.log(stryMutAct_9fa48("5318") ? `` : (stryCov_9fa48("5318"), `⚠️  ${message}`));
    if (stryMutAct_9fa48("5320") ? false : stryMutAct_9fa48("5319") ? true : (stryCov_9fa48("5319", "5320"), hint)) {
      if (stryMutAct_9fa48("5321")) {
        {}
      } else {
        stryCov_9fa48("5321");
        console.log(stryMutAct_9fa48("5322") ? `` : (stryCov_9fa48("5322"), `💡 ${hint}`));
      }
    }
  }
}
async function main() {
  if (stryMutAct_9fa48("5323")) {
    {}
  } else {
    stryCov_9fa48("5323");
    console.log(stryMutAct_9fa48("5324") ? "" : (stryCov_9fa48("5324"), "🚀 Obsidian RAG Setup Wizard"));
    console.log((stryMutAct_9fa48("5325") ? "" : (stryCov_9fa48("5325"), "=")).repeat(50));
    console.log(stryMutAct_9fa48("5326") ? "" : (stryCov_9fa48("5326"), "This script will help you configure and test your Obsidian RAG system."));
    console.log(stryMutAct_9fa48("5327") ? "" : (stryCov_9fa48("5327"), "Press Ctrl+C at any time to exit.\n"));
    logStep(1, stryMutAct_9fa48("5328") ? "" : (stryCov_9fa48("5328"), "Environment Configuration"));
    if (stryMutAct_9fa48("5331") ? false : stryMutAct_9fa48("5330") ? true : stryMutAct_9fa48("5329") ? DATABASE_URL : (stryCov_9fa48("5329", "5330", "5331"), !DATABASE_URL)) {
      if (stryMutAct_9fa48("5332")) {
        {}
      } else {
        stryCov_9fa48("5332");
        logError(stryMutAct_9fa48("5333") ? "" : (stryCov_9fa48("5333"), "DATABASE_URL environment variable is required"));
        console.log(stryMutAct_9fa48("5334") ? "" : (stryCov_9fa48("5334"), "\nPlease set up your environment:"));
        console.log(stryMutAct_9fa48("5335") ? "" : (stryCov_9fa48("5335"), "1. Copy env.example to .env"));
        console.log(stryMutAct_9fa48("5336") ? "" : (stryCov_9fa48("5336"), "2. Edit .env file with your database connection"));
        console.log(stryMutAct_9fa48("5337") ? "" : (stryCov_9fa48("5337"), "3. Run this setup script again"));
        process.exit(1);
      }
    }

    // Check if .env exists and show current configuration
    console.log(stryMutAct_9fa48("5338") ? "" : (stryCov_9fa48("5338"), "Current Configuration:"));
    console.log(stryMutAct_9fa48("5339") ? `` : (stryCov_9fa48("5339"), `   🗄️  Database: ${DATABASE_URL ? stryMutAct_9fa48("5340") ? "" : (stryCov_9fa48("5340"), "✅ Configured") : stryMutAct_9fa48("5341") ? "" : (stryCov_9fa48("5341"), "❌ Missing")}`));
    console.log(stryMutAct_9fa48("5342") ? `` : (stryCov_9fa48("5342"), `   🤖 Embedding: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSION}d)`));
    console.log(stryMutAct_9fa48("5343") ? `` : (stryCov_9fa48("5343"), `   📁 Vault Path: ${OBSIDIAN_VAULT_PATH}`));
    const updateConfig = await ask(stryMutAct_9fa48("5344") ? "" : (stryCov_9fa48("5344"), "\nWould you like to update any configuration? (y/n): "));
    if (stryMutAct_9fa48("5347") ? updateConfig.toLowerCase() !== "y" : stryMutAct_9fa48("5346") ? false : stryMutAct_9fa48("5345") ? true : (stryCov_9fa48("5345", "5346", "5347"), (stryMutAct_9fa48("5348") ? updateConfig.toUpperCase() : (stryCov_9fa48("5348"), updateConfig.toLowerCase())) === (stryMutAct_9fa48("5349") ? "" : (stryCov_9fa48("5349"), "y")))) {
      if (stryMutAct_9fa48("5350")) {
        {}
      } else {
        stryCov_9fa48("5350");
        await updateConfiguration();
      }
    }
    logStep(2, stryMutAct_9fa48("5351") ? "" : (stryCov_9fa48("5351"), "Testing Database Connection"));
    await testDatabase();
    logStep(3, stryMutAct_9fa48("5352") ? "" : (stryCov_9fa48("5352"), "Testing Embedding Service"));
    await testEmbeddings();
    logStep(4, stryMutAct_9fa48("5353") ? "" : (stryCov_9fa48("5353"), "Testing Obsidian Vault"));
    await testVault();
    logStep(5, stryMutAct_9fa48("5354") ? "" : (stryCov_9fa48("5354"), "Final Setup"));
    console.log(stryMutAct_9fa48("5355") ? "" : (stryCov_9fa48("5355"), "\n🎉 Setup Complete!"));
    console.log(stryMutAct_9fa48("5356") ? "" : (stryCov_9fa48("5356"), "You can now start the server with:"));
    console.log(stryMutAct_9fa48("5357") ? "" : (stryCov_9fa48("5357"), "   npm run server"));
    console.log(stryMutAct_9fa48("5358") ? "" : (stryCov_9fa48("5358"), "   or"));
    console.log(stryMutAct_9fa48("5359") ? "" : (stryCov_9fa48("5359"), "   npx tsx src/server.ts"));
    rl.close();
  }
}
async function updateConfiguration() {
  if (stryMutAct_9fa48("5360")) {
    {}
  } else {
    stryCov_9fa48("5360");
    console.log(stryMutAct_9fa48("5361") ? "" : (stryCov_9fa48("5361"), "\n📝 Updating Configuration..."));
    const newDbUrl = stryMutAct_9fa48("5364") ? (await ask(`Database URL [${DATABASE_URL}]: `)) && DATABASE_URL! : stryMutAct_9fa48("5363") ? false : stryMutAct_9fa48("5362") ? true : (stryCov_9fa48("5362", "5363", "5364"), (await ask(stryMutAct_9fa48("5365") ? `` : (stryCov_9fa48("5365"), `Database URL [${DATABASE_URL}]: `))) || DATABASE_URL!);
    const newModel = stryMutAct_9fa48("5368") ? (await ask(`Embedding Model [${EMBEDDING_MODEL}]: `)) && EMBEDDING_MODEL : stryMutAct_9fa48("5367") ? false : stryMutAct_9fa48("5366") ? true : (stryCov_9fa48("5366", "5367", "5368"), (await ask(stryMutAct_9fa48("5369") ? `` : (stryCov_9fa48("5369"), `Embedding Model [${EMBEDDING_MODEL}]: `))) || EMBEDDING_MODEL);
    const newDimension = stryMutAct_9fa48("5372") ? (await ask(`Embedding Dimension [${EMBEDDING_DIMENSION}]: `)) && EMBEDDING_DIMENSION.toString() : stryMutAct_9fa48("5371") ? false : stryMutAct_9fa48("5370") ? true : (stryCov_9fa48("5370", "5371", "5372"), (await ask(stryMutAct_9fa48("5373") ? `` : (stryCov_9fa48("5373"), `Embedding Dimension [${EMBEDDING_DIMENSION}]: `))) || EMBEDDING_DIMENSION.toString());
    const newVaultPath = stryMutAct_9fa48("5376") ? (await ask(`Obsidian Vault Path [${OBSIDIAN_VAULT_PATH}]: `)) && OBSIDIAN_VAULT_PATH : stryMutAct_9fa48("5375") ? false : stryMutAct_9fa48("5374") ? true : (stryCov_9fa48("5374", "5375", "5376"), (await ask(stryMutAct_9fa48("5377") ? `` : (stryCov_9fa48("5377"), `Obsidian Vault Path [${OBSIDIAN_VAULT_PATH}]: `))) || OBSIDIAN_VAULT_PATH);

    // Update .env file
    let envContent = fs.readFileSync(stryMutAct_9fa48("5378") ? "" : (stryCov_9fa48("5378"), ".env"), stryMutAct_9fa48("5379") ? "" : (stryCov_9fa48("5379"), "utf-8"));
    envContent = envContent.replace(stryMutAct_9fa48("5380") ? /DATABASE_URL=./ : (stryCov_9fa48("5380"), /DATABASE_URL=.*/), stryMutAct_9fa48("5381") ? `` : (stryCov_9fa48("5381"), `DATABASE_URL=${newDbUrl}`));
    envContent = envContent.replace(stryMutAct_9fa48("5382") ? /EMBEDDING_MODEL=./ : (stryCov_9fa48("5382"), /EMBEDDING_MODEL=.*/), stryMutAct_9fa48("5383") ? `` : (stryCov_9fa48("5383"), `EMBEDDING_MODEL=${newModel}`));
    envContent = envContent.replace(stryMutAct_9fa48("5384") ? /EMBEDDING_DIMENSION=./ : (stryCov_9fa48("5384"), /EMBEDDING_DIMENSION=.*/), stryMutAct_9fa48("5385") ? `` : (stryCov_9fa48("5385"), `EMBEDDING_DIMENSION=${newDimension}`));
    envContent = envContent.replace(stryMutAct_9fa48("5386") ? /OBSIDIAN_VAULT_PATH=./ : (stryCov_9fa48("5386"), /OBSIDIAN_VAULT_PATH=.*/), stryMutAct_9fa48("5387") ? `` : (stryCov_9fa48("5387"), `OBSIDIAN_VAULT_PATH=${newVaultPath}`));
    fs.writeFileSync(stryMutAct_9fa48("5388") ? "" : (stryCov_9fa48("5388"), ".env"), envContent);
    logSuccess(stryMutAct_9fa48("5389") ? "" : (stryCov_9fa48("5389"), "Configuration updated. Please restart the setup script."));
    process.exit(0);
  }
}
async function testDatabase() {
  if (stryMutAct_9fa48("5390")) {
    {}
  } else {
    stryCov_9fa48("5390");
    try {
      if (stryMutAct_9fa48("5391")) {
        {}
      } else {
        stryCov_9fa48("5391");
        const db = new ObsidianDatabase(DATABASE_URL!);
        await db.initialize();
        const stats = await db.getStats();
        logSuccess(stryMutAct_9fa48("5392") ? "" : (stryCov_9fa48("5392"), "Database connection successful!"));
        console.log(stryMutAct_9fa48("5393") ? `` : (stryCov_9fa48("5393"), `   📊 Total chunks: ${stryMutAct_9fa48("5396") ? stats.totalChunks && 0 : stryMutAct_9fa48("5395") ? false : stryMutAct_9fa48("5394") ? true : (stryCov_9fa48("5394", "5395", "5396"), stats.totalChunks || 0)}`));
        console.log(stryMutAct_9fa48("5397") ? `` : (stryCov_9fa48("5397"), `   📅 Last update: ${stryMutAct_9fa48("5400") ? stats.lastUpdate && "Never" : stryMutAct_9fa48("5399") ? false : stryMutAct_9fa48("5398") ? true : (stryCov_9fa48("5398", "5399", "5400"), stats.lastUpdate || (stryMutAct_9fa48("5401") ? "" : (stryCov_9fa48("5401"), "Never")))}`));
        await db.close();
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5402")) {
        {}
      } else {
        stryCov_9fa48("5402");
        logError(stryMutAct_9fa48("5403") ? "" : (stryCov_9fa48("5403"), "Database connection failed"), error.message);
        if (stryMutAct_9fa48("5406") ? error.message.includes("role") || error.message.includes("does not exist") : stryMutAct_9fa48("5405") ? false : stryMutAct_9fa48("5404") ? true : (stryCov_9fa48("5404", "5405", "5406"), error.message.includes(stryMutAct_9fa48("5407") ? "" : (stryCov_9fa48("5407"), "role")) && error.message.includes(stryMutAct_9fa48("5408") ? "" : (stryCov_9fa48("5408"), "does not exist")))) {
          if (stryMutAct_9fa48("5409")) {
            {}
          } else {
            stryCov_9fa48("5409");
            logWarning(stryMutAct_9fa48("5410") ? "" : (stryCov_9fa48("5410"), "Database user doesn't exist"));
            console.log(stryMutAct_9fa48("5411") ? "" : (stryCov_9fa48("5411"), "   💡 You need to create a PostgreSQL user or update DATABASE_URL"));
            console.log(stryMutAct_9fa48("5412") ? "" : (stryCov_9fa48("5412"), "   💡 Options:"));
            console.log(stryMutAct_9fa48("5413") ? "" : (stryCov_9fa48("5413"), "      1. Create user: CREATE USER username WITH PASSWORD 'password'"));
            console.log(stryMutAct_9fa48("5414") ? "" : (stryCov_9fa48("5414"), "      2. Update .env with correct credentials"));
            console.log(stryMutAct_9fa48("5415") ? "" : (stryCov_9fa48("5415"), "      3. Use a different database user"));
          }
        } else if (stryMutAct_9fa48("5418") ? error.message.includes("database") || error.message.includes("does not exist") : stryMutAct_9fa48("5417") ? false : stryMutAct_9fa48("5416") ? true : (stryCov_9fa48("5416", "5417", "5418"), error.message.includes(stryMutAct_9fa48("5419") ? "" : (stryCov_9fa48("5419"), "database")) && error.message.includes(stryMutAct_9fa48("5420") ? "" : (stryCov_9fa48("5420"), "does not exist")))) {
          if (stryMutAct_9fa48("5421")) {
            {}
          } else {
            stryCov_9fa48("5421");
            logWarning(stryMutAct_9fa48("5422") ? "" : (stryCov_9fa48("5422"), "Database doesn't exist"));
            console.log(stryMutAct_9fa48("5423") ? "" : (stryCov_9fa48("5423"), "   💡 You need to create the database first"));
            console.log(stryMutAct_9fa48("5424") ? "" : (stryCov_9fa48("5424"), "   💡 Run: CREATE DATABASE obsidian_rag"));
          }
        }
        const setupDb = await ask(stryMutAct_9fa48("5425") ? "" : (stryCov_9fa48("5425"), "\nWould you like help setting up the database? (y/n): "));
        if (stryMutAct_9fa48("5428") ? setupDb.toLowerCase() !== "y" : stryMutAct_9fa48("5427") ? false : stryMutAct_9fa48("5426") ? true : (stryCov_9fa48("5426", "5427", "5428"), (stryMutAct_9fa48("5429") ? setupDb.toUpperCase() : (stryCov_9fa48("5429"), setupDb.toLowerCase())) === (stryMutAct_9fa48("5430") ? "" : (stryCov_9fa48("5430"), "y")))) {
          if (stryMutAct_9fa48("5431")) {
            {}
          } else {
            stryCov_9fa48("5431");
            await setupDatabaseInstructions();
          }
        }
        const retry = await ask(stryMutAct_9fa48("5432") ? "" : (stryCov_9fa48("5432"), "Would you like to continue anyway? (y/n): "));
        if (stryMutAct_9fa48("5435") ? retry.toLowerCase() === "y" : stryMutAct_9fa48("5434") ? false : stryMutAct_9fa48("5433") ? true : (stryCov_9fa48("5433", "5434", "5435"), (stryMutAct_9fa48("5436") ? retry.toUpperCase() : (stryCov_9fa48("5436"), retry.toLowerCase())) !== (stryMutAct_9fa48("5437") ? "" : (stryCov_9fa48("5437"), "y")))) {
          if (stryMutAct_9fa48("5438")) {
            {}
          } else {
            stryCov_9fa48("5438");
            process.exit(1);
          }
        }
      }
    }
  }
}
async function setupDatabaseInstructions() {
  if (stryMutAct_9fa48("5439")) {
    {}
  } else {
    stryCov_9fa48("5439");
    console.log(stryMutAct_9fa48("5440") ? "" : (stryCov_9fa48("5440"), "\n📋 Database Setup Instructions:"));
    console.log((stryMutAct_9fa48("5441") ? "" : (stryCov_9fa48("5441"), "=")).repeat(40));
    console.log(stryMutAct_9fa48("5442") ? "" : (stryCov_9fa48("5442"), "1. Connect to PostgreSQL:"));
    console.log(stryMutAct_9fa48("5443") ? "" : (stryCov_9fa48("5443"), "   psql -h localhost -U postgres"));
    console.log(stryMutAct_9fa48("5444") ? "Stryker was here!" : (stryCov_9fa48("5444"), ""));
    console.log(stryMutAct_9fa48("5445") ? "" : (stryCov_9fa48("5445"), "2. Create a database user:"));
    console.log(stryMutAct_9fa48("5446") ? "" : (stryCov_9fa48("5446"), "   CREATE USER obsidian_rag_user WITH PASSWORD 'your_secure_password';"));
    console.log(stryMutAct_9fa48("5447") ? "Stryker was here!" : (stryCov_9fa48("5447"), ""));
    console.log(stryMutAct_9fa48("5448") ? "" : (stryCov_9fa48("5448"), "3. Create the database:"));
    console.log(stryMutAct_9fa48("5449") ? "" : (stryCov_9fa48("5449"), "   CREATE DATABASE obsidian_rag OWNER obsidian_rag_user;"));
    console.log(stryMutAct_9fa48("5450") ? "Stryker was here!" : (stryCov_9fa48("5450"), ""));
    console.log(stryMutAct_9fa48("5451") ? "" : (stryCov_9fa48("5451"), "4. Grant privileges:"));
    console.log(stryMutAct_9fa48("5452") ? "" : (stryCov_9fa48("5452"), "   GRANT ALL PRIVILEGES ON DATABASE obsidian_rag TO obsidian_rag_user;"));
    console.log(stryMutAct_9fa48("5453") ? "Stryker was here!" : (stryCov_9fa48("5453"), ""));
    console.log(stryMutAct_9fa48("5454") ? "" : (stryCov_9fa48("5454"), "5. Update your .env file:"));
    console.log(stryMutAct_9fa48("5455") ? "" : (stryCov_9fa48("5455"), "   DATABASE_URL=postgresql://obsidian_rag_user:your_secure_password@localhost:5432/obsidian_rag"));
    console.log(stryMutAct_9fa48("5456") ? "Stryker was here!" : (stryCov_9fa48("5456"), ""));
    console.log(stryMutAct_9fa48("5457") ? "" : (stryCov_9fa48("5457"), "6. Test the connection:"));
    console.log(stryMutAct_9fa48("5458") ? "" : (stryCov_9fa48("5458"), "   npm run setup"));
    const newUrl = await ask(stryMutAct_9fa48("5459") ? "" : (stryCov_9fa48("5459"), "\nEnter your new DATABASE_URL: "));
    if (stryMutAct_9fa48("5461") ? false : stryMutAct_9fa48("5460") ? true : (stryCov_9fa48("5460", "5461"), newUrl)) {
      if (stryMutAct_9fa48("5462")) {
        {}
      } else {
        stryCov_9fa48("5462");
        // Update .env file
        let envContent = fs.readFileSync(stryMutAct_9fa48("5463") ? "" : (stryCov_9fa48("5463"), ".env"), stryMutAct_9fa48("5464") ? "" : (stryCov_9fa48("5464"), "utf-8"));
        envContent = envContent.replace(stryMutAct_9fa48("5465") ? /DATABASE_URL=./ : (stryCov_9fa48("5465"), /DATABASE_URL=.*/), stryMutAct_9fa48("5466") ? `` : (stryCov_9fa48("5466"), `DATABASE_URL=${newUrl}`));
        fs.writeFileSync(stryMutAct_9fa48("5467") ? "" : (stryCov_9fa48("5467"), ".env"), envContent);
        logSuccess(stryMutAct_9fa48("5468") ? "" : (stryCov_9fa48("5468"), "DATABASE_URL updated! Please run setup again."));
        process.exit(0);
      }
    }
  }
}
async function testEmbeddings() {
  if (stryMutAct_9fa48("5469")) {
    {}
  } else {
    stryCov_9fa48("5469");
    try {
      if (stryMutAct_9fa48("5470")) {
        {}
      } else {
        stryCov_9fa48("5470");
        const embeddingService = new ObsidianEmbeddingService(stryMutAct_9fa48("5471") ? {} : (stryCov_9fa48("5471"), {
          model: EMBEDDING_MODEL,
          dimension: EMBEDDING_DIMENSION
        }));
        const test = await embeddingService.testConnection();
        if (stryMutAct_9fa48("5473") ? false : stryMutAct_9fa48("5472") ? true : (stryCov_9fa48("5472", "5473"), test.success)) {
          if (stryMutAct_9fa48("5474")) {
            {}
          } else {
            stryCov_9fa48("5474");
            logSuccess(stryMutAct_9fa48("5475") ? "" : (stryCov_9fa48("5475"), "Embedding service ready!"));
            console.log(stryMutAct_9fa48("5476") ? `` : (stryCov_9fa48("5476"), `   🤖 Model: ${EMBEDDING_MODEL}`));
            console.log(stryMutAct_9fa48("5477") ? `` : (stryCov_9fa48("5477"), `   📐 Dimension: ${test.dimension}`));
          }
        } else {
          if (stryMutAct_9fa48("5478")) {
            {}
          } else {
            stryCov_9fa48("5478");
            logError(stryMutAct_9fa48("5479") ? "" : (stryCov_9fa48("5479"), "Embedding service test failed"));
          }
        }
      }
    } catch (error: any) {
      if (stryMutAct_9fa48("5480")) {
        {}
      } else {
        stryCov_9fa48("5480");
        logError(stryMutAct_9fa48("5481") ? "" : (stryCov_9fa48("5481"), "Embedding service connection failed"), error.message);
        logWarning(stryMutAct_9fa48("5482") ? "" : (stryCov_9fa48("5482"), "Make sure Ollama is running and the model is installed"));
        console.log(stryMutAct_9fa48("5483") ? "" : (stryCov_9fa48("5483"), "   Install: ollama pull embeddinggemma"));
      }
    }
  }
}
async function testVault() {
  if (stryMutAct_9fa48("5484")) {
    {}
  } else {
    stryCov_9fa48("5484");
    if (stryMutAct_9fa48("5487") ? false : stryMutAct_9fa48("5486") ? true : stryMutAct_9fa48("5485") ? fs.existsSync(OBSIDIAN_VAULT_PATH) : (stryCov_9fa48("5485", "5486", "5487"), !fs.existsSync(OBSIDIAN_VAULT_PATH))) {
      if (stryMutAct_9fa48("5488")) {
        {}
      } else {
        stryCov_9fa48("5488");
        logWarning(stryMutAct_9fa48("5489") ? "" : (stryCov_9fa48("5489"), "Obsidian vault directory not found"));
        console.log(stryMutAct_9fa48("5490") ? `` : (stryCov_9fa48("5490"), `   Path: ${OBSIDIAN_VAULT_PATH}`));
        const createVault = await ask(stryMutAct_9fa48("5491") ? "" : (stryCov_9fa48("5491"), "Would you like to create this directory? (y/n): "));
        if (stryMutAct_9fa48("5494") ? createVault.toLowerCase() !== "y" : stryMutAct_9fa48("5493") ? false : stryMutAct_9fa48("5492") ? true : (stryCov_9fa48("5492", "5493", "5494"), (stryMutAct_9fa48("5495") ? createVault.toUpperCase() : (stryCov_9fa48("5495"), createVault.toLowerCase())) === (stryMutAct_9fa48("5496") ? "" : (stryCov_9fa48("5496"), "y")))) {
          if (stryMutAct_9fa48("5497")) {
            {}
          } else {
            stryCov_9fa48("5497");
            fs.mkdirSync(OBSIDIAN_VAULT_PATH, stryMutAct_9fa48("5498") ? {} : (stryCov_9fa48("5498"), {
              recursive: stryMutAct_9fa48("5499") ? false : (stryCov_9fa48("5499"), true)
            }));
            logSuccess(stryMutAct_9fa48("5500") ? "" : (stryCov_9fa48("5500"), "Vault directory created"));
          }
        }
      }
    } else {
      if (stryMutAct_9fa48("5501")) {
        {}
      } else {
        stryCov_9fa48("5501");
        logSuccess(stryMutAct_9fa48("5502") ? "" : (stryCov_9fa48("5502"), "Obsidian vault directory found"));
        const files = fs.readdirSync(OBSIDIAN_VAULT_PATH);
        console.log(stryMutAct_9fa48("5503") ? `` : (stryCov_9fa48("5503"), `   📁 Contains: ${files.length} items`));
      }
    }

    // Check for typical Obsidian files
    const markdownFiles = stryMutAct_9fa48("5504") ? fs.readdirSync(OBSIDIAN_VAULT_PATH) : (stryCov_9fa48("5504"), fs.readdirSync(OBSIDIAN_VAULT_PATH).filter(stryMutAct_9fa48("5505") ? () => undefined : (stryCov_9fa48("5505"), f => stryMutAct_9fa48("5506") ? f.startsWith(".md") : (stryCov_9fa48("5506"), f.endsWith(stryMutAct_9fa48("5507") ? "" : (stryCov_9fa48("5507"), ".md"))))));
    if (stryMutAct_9fa48("5511") ? markdownFiles.length <= 0 : stryMutAct_9fa48("5510") ? markdownFiles.length >= 0 : stryMutAct_9fa48("5509") ? false : stryMutAct_9fa48("5508") ? true : (stryCov_9fa48("5508", "5509", "5510", "5511"), markdownFiles.length > 0)) {
      if (stryMutAct_9fa48("5512")) {
        {}
      } else {
        stryCov_9fa48("5512");
        logSuccess(stryMutAct_9fa48("5513") ? `` : (stryCov_9fa48("5513"), `Found ${markdownFiles.length} markdown files`));
      }
    } else {
      if (stryMutAct_9fa48("5514")) {
        {}
      } else {
        stryCov_9fa48("5514");
        logWarning(stryMutAct_9fa48("5515") ? "" : (stryCov_9fa48("5515"), "No markdown files found in vault"));
        console.log(stryMutAct_9fa48("5516") ? "" : (stryCov_9fa48("5516"), "   Add some .md files to your Obsidian vault to get started"));
      }
    }
  }
}