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
import { ObsidianEmbeddingService } from "../lib/embeddings";
import { ObsidianIngestionPipeline } from "../lib/obsidian-ingest";

// Load environment variables
dotenv.config();
const OBSIDIAN_VAULT_PATH = stryMutAct_9fa48("4665") ? process.env.OBSIDIAN_VAULT_PATH && "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault" : stryMutAct_9fa48("4664") ? false : stryMutAct_9fa48("4663") ? true : (stryCov_9fa48("4663", "4664", "4665"), process.env.OBSIDIAN_VAULT_PATH || (stryMutAct_9fa48("4666") ? "" : (stryCov_9fa48("4666"), "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault")));
const DATABASE_URL = process.env.DATABASE_URL;
const EMBEDDING_MODEL = stryMutAct_9fa48("4669") ? process.env.EMBEDDING_MODEL && "embeddinggemma" : stryMutAct_9fa48("4668") ? false : stryMutAct_9fa48("4667") ? true : (stryCov_9fa48("4667", "4668", "4669"), process.env.EMBEDDING_MODEL || (stryMutAct_9fa48("4670") ? "" : (stryCov_9fa48("4670"), "embeddinggemma")));
const EMBEDDING_DIMENSION = parseInt(stryMutAct_9fa48("4673") ? process.env.EMBEDDING_DIMENSION && "768" : stryMutAct_9fa48("4672") ? false : stryMutAct_9fa48("4671") ? true : (stryCov_9fa48("4671", "4672", "4673"), process.env.EMBEDDING_DIMENSION || (stryMutAct_9fa48("4674") ? "" : (stryCov_9fa48("4674"), "768"))));
async function main() {
  if (stryMutAct_9fa48("4675")) {
    {}
  } else {
    stryCov_9fa48("4675");
    if (stryMutAct_9fa48("4678") ? false : stryMutAct_9fa48("4677") ? true : stryMutAct_9fa48("4676") ? DATABASE_URL : (stryCov_9fa48("4676", "4677", "4678"), !DATABASE_URL)) {
      if (stryMutAct_9fa48("4679")) {
        {}
      } else {
        stryCov_9fa48("4679");
        console.error(stryMutAct_9fa48("4680") ? "" : (stryCov_9fa48("4680"), "❌ DATABASE_URL environment variable is required"));
        process.exit(1);
      }
    }
    console.log(stryMutAct_9fa48("4681") ? "" : (stryCov_9fa48("4681"), "🚀 Starting Obsidian vault ingestion..."));
    console.log(stryMutAct_9fa48("4682") ? `` : (stryCov_9fa48("4682"), `📁 Vault path: ${OBSIDIAN_VAULT_PATH}`));
    console.log(stryMutAct_9fa48("4683") ? `` : (stryCov_9fa48("4683"), `🔗 Database: ${DATABASE_URL.replace(stryMutAct_9fa48("4684") ? /\/\/.@/ : (stryCov_9fa48("4684"), /\/\/.*@/), stryMutAct_9fa48("4685") ? "" : (stryCov_9fa48("4685"), "//***@"))}`));
    console.log(stryMutAct_9fa48("4686") ? `` : (stryCov_9fa48("4686"), `🧠 Embedding model: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSION}d)`));
    try {
      if (stryMutAct_9fa48("4687")) {
        {}
      } else {
        stryCov_9fa48("4687");
        // Initialize services
        console.log(stryMutAct_9fa48("4688") ? "" : (stryCov_9fa48("4688"), "🔧 Initializing services..."));
        const database = new ObsidianDatabase(DATABASE_URL);
        await database.initialize();
        const embeddingService = new ObsidianEmbeddingService(stryMutAct_9fa48("4689") ? {} : (stryCov_9fa48("4689"), {
          model: EMBEDDING_MODEL,
          dimension: EMBEDDING_DIMENSION
        }));

        // Test embedding service
        const embeddingTest = await embeddingService.testConnection();
        if (stryMutAct_9fa48("4692") ? false : stryMutAct_9fa48("4691") ? true : stryMutAct_9fa48("4690") ? embeddingTest.success : (stryCov_9fa48("4690", "4691", "4692"), !embeddingTest.success)) {
          if (stryMutAct_9fa48("4693")) {
            {}
          } else {
            stryCov_9fa48("4693");
            throw new Error(stryMutAct_9fa48("4694") ? "" : (stryCov_9fa48("4694"), "Embedding service connection failed"));
          }
        }
        console.log(stryMutAct_9fa48("4695") ? `` : (stryCov_9fa48("4695"), `✅ Embedding service ready (${embeddingTest.dimension}d)`));

        // Initialize Obsidian ingestion pipeline
        const obsidianPipeline = new ObsidianIngestionPipeline(database, embeddingService, OBSIDIAN_VAULT_PATH);

        // Configure ingestion options
        const ingestionOptions = stryMutAct_9fa48("4696") ? {} : (stryCov_9fa48("4696"), {
          batchSize: 1,
          // Process one file at a time for debugging
          rateLimitMs: 300,
          // Be gentle with the embedding service
          skipExisting: stryMutAct_9fa48("4697") ? false : (stryCov_9fa48("4697"), true),
          includePatterns: stryMutAct_9fa48("4698") ? [] : (stryCov_9fa48("4698"), [stryMutAct_9fa48("4699") ? "" : (stryCov_9fa48("4699"), "**/*.md")]),
          excludePatterns: stryMutAct_9fa48("4700") ? [] : (stryCov_9fa48("4700"), [stryMutAct_9fa48("4701") ? "" : (stryCov_9fa48("4701"), "**/.obsidian/**"), stryMutAct_9fa48("4702") ? "" : (stryCov_9fa48("4702"), "**/node_modules/**"), stryMutAct_9fa48("4703") ? "" : (stryCov_9fa48("4703"), "**/.git/**"), stryMutAct_9fa48("4704") ? "" : (stryCov_9fa48("4704"), "**/Attachments/**"), // Skip binary attachments
          stryMutAct_9fa48("4705") ? "" : (stryCov_9fa48("4705"), "**/assets/**"), // Skip asset files
          stryMutAct_9fa48("4706") ? "" : (stryCov_9fa48("4706"), "**/wp-content/**") // Skip WordPress content
          ]),
          chunkingOptions: stryMutAct_9fa48("4707") ? {} : (stryCov_9fa48("4707"), {
            maxChunkSize: 800,
            // Smaller chunks for better semantic search
            chunkOverlap: 100,
            preserveStructure: stryMutAct_9fa48("4708") ? false : (stryCov_9fa48("4708"), true),
            // Respect Obsidian's heading structure
            includeContext: stryMutAct_9fa48("4709") ? false : (stryCov_9fa48("4709"), true),
            // Include frontmatter and wikilink context
            cleanContent: stryMutAct_9fa48("4710") ? false : (stryCov_9fa48("4710"), true) // Clean markdown for better embeddings
          })
        });
        console.log(stryMutAct_9fa48("4711") ? "" : (stryCov_9fa48("4711"), "📊 Ingestion configuration:"), stryMutAct_9fa48("4712") ? {} : (stryCov_9fa48("4712"), {
          batchSize: ingestionOptions.batchSize,
          maxChunkSize: ingestionOptions.chunkingOptions.maxChunkSize,
          preserveStructure: ingestionOptions.chunkingOptions.preserveStructure,
          includeContext: ingestionOptions.chunkingOptions.includeContext,
          cleanContent: ingestionOptions.chunkingOptions.cleanContent
        }));

        // Start ingestion
        const startTime = Date.now();
        const result = await obsidianPipeline.ingestVault(ingestionOptions);
        const duration = stryMutAct_9fa48("4713") ? Date.now() + startTime : (stryCov_9fa48("4713"), Date.now() - startTime);

        // Display results
        console.log((stryMutAct_9fa48("4714") ? "" : (stryCov_9fa48("4714"), "\n")) + (stryMutAct_9fa48("4715") ? "" : (stryCov_9fa48("4715"), "=")).repeat(60));
        console.log(stryMutAct_9fa48("4716") ? "" : (stryCov_9fa48("4716"), "📈 OBSIDIAN INGESTION RESULTS"));
        console.log((stryMutAct_9fa48("4717") ? "" : (stryCov_9fa48("4717"), "=")).repeat(60));
        console.log(stryMutAct_9fa48("4718") ? `` : (stryCov_9fa48("4718"), `⏱️  Duration: ${Math.round(stryMutAct_9fa48("4719") ? duration * 1000 : (stryCov_9fa48("4719"), duration / 1000))}s`));
        console.log(stryMutAct_9fa48("4720") ? `` : (stryCov_9fa48("4720"), `📄 Files processed: ${result.processedFiles}/${result.totalFiles}`));
        console.log(stryMutAct_9fa48("4721") ? `` : (stryCov_9fa48("4721"), `📦 Chunks created: ${result.totalChunks}`));
        console.log(stryMutAct_9fa48("4722") ? `` : (stryCov_9fa48("4722"), `✅ Chunks processed: ${result.processedChunks}`));
        console.log(stryMutAct_9fa48("4723") ? `` : (stryCov_9fa48("4723"), `⏭️  Chunks skipped: ${result.skippedChunks}`));
        console.log(stryMutAct_9fa48("4724") ? `` : (stryCov_9fa48("4724"), `❌ Errors: ${result.errors.length}`));
        if (stryMutAct_9fa48("4728") ? result.errors.length <= 0 : stryMutAct_9fa48("4727") ? result.errors.length >= 0 : stryMutAct_9fa48("4726") ? false : stryMutAct_9fa48("4725") ? true : (stryCov_9fa48("4725", "4726", "4727", "4728"), result.errors.length > 0)) {
          if (stryMutAct_9fa48("4729")) {
            {}
          } else {
            stryCov_9fa48("4729");
            console.log(stryMutAct_9fa48("4730") ? "" : (stryCov_9fa48("4730"), "\n🚨 ERRORS:"));
            stryMutAct_9fa48("4731") ? result.errors.forEach((error, i) => {
              console.log(`  ${i + 1}. ${error}`);
            }) : (stryCov_9fa48("4731"), result.errors.slice(0, 5).forEach((error, i) => {
              if (stryMutAct_9fa48("4732")) {
                {}
              } else {
                stryCov_9fa48("4732");
                console.log(stryMutAct_9fa48("4733") ? `` : (stryCov_9fa48("4733"), `  ${stryMutAct_9fa48("4734") ? i - 1 : (stryCov_9fa48("4734"), i + 1)}. ${error}`));
              }
            }));
            if (stryMutAct_9fa48("4738") ? result.errors.length <= 5 : stryMutAct_9fa48("4737") ? result.errors.length >= 5 : stryMutAct_9fa48("4736") ? false : stryMutAct_9fa48("4735") ? true : (stryCov_9fa48("4735", "4736", "4737", "4738"), result.errors.length > 5)) {
              if (stryMutAct_9fa48("4739")) {
                {}
              } else {
                stryCov_9fa48("4739");
                console.log(stryMutAct_9fa48("4740") ? `` : (stryCov_9fa48("4740"), `  ... and ${stryMutAct_9fa48("4741") ? result.errors.length + 5 : (stryCov_9fa48("4741"), result.errors.length - 5)} more errors`));
              }
            }
          }
        }

        // Validation
        console.log(stryMutAct_9fa48("4742") ? "" : (stryCov_9fa48("4742"), "\n🔍 Validating ingestion..."));
        const validation = await obsidianPipeline.validateIngestion(10);
        if (stryMutAct_9fa48("4744") ? false : stryMutAct_9fa48("4743") ? true : (stryCov_9fa48("4743", "4744"), validation.isValid)) {
          if (stryMutAct_9fa48("4745")) {
            {}
          } else {
            stryCov_9fa48("4745");
            console.log(stryMutAct_9fa48("4746") ? "" : (stryCov_9fa48("4746"), "✅ Validation passed!"));
          }
        } else {
          if (stryMutAct_9fa48("4747")) {
            {}
          } else {
            stryCov_9fa48("4747");
            console.log(stryMutAct_9fa48("4748") ? "" : (stryCov_9fa48("4748"), "⚠️  Validation issues found:"));
            validation.issues.forEach((issue, i) => {
              if (stryMutAct_9fa48("4749")) {
                {}
              } else {
                stryCov_9fa48("4749");
                console.log(stryMutAct_9fa48("4750") ? `` : (stryCov_9fa48("4750"), `  ${stryMutAct_9fa48("4751") ? i - 1 : (stryCov_9fa48("4751"), i + 1)}. ${issue}`));
              }
            });
          }
        }

        // Sample results
        if (stryMutAct_9fa48("4755") ? validation.sampleResults.length <= 0 : stryMutAct_9fa48("4754") ? validation.sampleResults.length >= 0 : stryMutAct_9fa48("4753") ? false : stryMutAct_9fa48("4752") ? true : (stryCov_9fa48("4752", "4753", "4754", "4755"), validation.sampleResults.length > 0)) {
          if (stryMutAct_9fa48("4756")) {
            {}
          } else {
            stryCov_9fa48("4756");
            console.log(stryMutAct_9fa48("4757") ? "" : (stryCov_9fa48("4757"), "\n📋 Sample results:"));
            stryMutAct_9fa48("4758") ? validation.sampleResults.forEach((sample, i) => {
              console.log(`  ${i + 1}. ${sample.id}`);
              console.log(`     Text: ${sample.textPreview}`);
              console.log(`     Valid: ${sample.metadataValid ? "✅" : "❌"}`);
              if (sample.obsidianMetadata) {
                console.log(`     File: ${sample.obsidianMetadata.fileName}`);
                console.log(`     Tags: ${sample.obsidianMetadata.tags?.slice(0, 3).join(", ") || "none"}`);
              }
              console.log("");
            }) : (stryCov_9fa48("4758"), validation.sampleResults.slice(0, 3).forEach((sample, i) => {
              if (stryMutAct_9fa48("4759")) {
                {}
              } else {
                stryCov_9fa48("4759");
                console.log(stryMutAct_9fa48("4760") ? `` : (stryCov_9fa48("4760"), `  ${stryMutAct_9fa48("4761") ? i - 1 : (stryCov_9fa48("4761"), i + 1)}. ${sample.id}`));
                console.log(stryMutAct_9fa48("4762") ? `` : (stryCov_9fa48("4762"), `     Text: ${sample.textPreview}`));
                console.log(stryMutAct_9fa48("4763") ? `` : (stryCov_9fa48("4763"), `     Valid: ${sample.metadataValid ? stryMutAct_9fa48("4764") ? "" : (stryCov_9fa48("4764"), "✅") : stryMutAct_9fa48("4765") ? "" : (stryCov_9fa48("4765"), "❌")}`));
                if (stryMutAct_9fa48("4767") ? false : stryMutAct_9fa48("4766") ? true : (stryCov_9fa48("4766", "4767"), sample.obsidianMetadata)) {
                  if (stryMutAct_9fa48("4768")) {
                    {}
                  } else {
                    stryCov_9fa48("4768");
                    console.log(stryMutAct_9fa48("4769") ? `` : (stryCov_9fa48("4769"), `     File: ${sample.obsidianMetadata.fileName}`));
                    console.log(stryMutAct_9fa48("4770") ? `` : (stryCov_9fa48("4770"), `     Tags: ${stryMutAct_9fa48("4773") ? sample.obsidianMetadata.tags?.slice(0, 3).join(", ") && "none" : stryMutAct_9fa48("4772") ? false : stryMutAct_9fa48("4771") ? true : (stryCov_9fa48("4771", "4772", "4773"), (stryMutAct_9fa48("4775") ? sample.obsidianMetadata.tags.slice(0, 3).join(", ") : stryMutAct_9fa48("4774") ? sample.obsidianMetadata.tags.join(", ") : (stryCov_9fa48("4774", "4775"), sample.obsidianMetadata.tags?.slice(0, 3).join(stryMutAct_9fa48("4776") ? "" : (stryCov_9fa48("4776"), ", ")))) || (stryMutAct_9fa48("4777") ? "" : (stryCov_9fa48("4777"), "none")))}`));
                  }
                }
                console.log(stryMutAct_9fa48("4778") ? "Stryker was here!" : (stryCov_9fa48("4778"), ""));
              }
            }));
          }
        }

        // Database statistics
        const dbStats = await database.getStats();
        console.log(stryMutAct_9fa48("4779") ? "" : (stryCov_9fa48("4779"), "\n📊 Database statistics:"));
        console.log(stryMutAct_9fa48("4780") ? `` : (stryCov_9fa48("4780"), `  Total chunks: ${dbStats.totalChunks}`));
        console.log(stryMutAct_9fa48("4781") ? "" : (stryCov_9fa48("4781"), "  By content type:"));
        Object.entries(dbStats.byContentType).forEach(([type, count]) => {
          if (stryMutAct_9fa48("4782")) {
            {}
          } else {
            stryCov_9fa48("4782");
            console.log(stryMutAct_9fa48("4783") ? `` : (stryCov_9fa48("4783"), `    ${type}: ${count}`));
          }
        });
        console.log(stryMutAct_9fa48("4784") ? "" : (stryCov_9fa48("4784"), "  By folder:"));
        stryMutAct_9fa48("4785") ? Object.entries(dbStats.byFolder).forEach(([folder, count]) => {
          console.log(`    ${folder}: ${count}`);
        }) : (stryCov_9fa48("4785"), Object.entries(dbStats.byFolder).slice(0, 5).forEach(([folder, count]) => {
          if (stryMutAct_9fa48("4786")) {
            {}
          } else {
            stryCov_9fa48("4786");
            console.log(stryMutAct_9fa48("4787") ? `` : (stryCov_9fa48("4787"), `    ${folder}: ${count}`));
          }
        }));
        console.log(stryMutAct_9fa48("4788") ? "" : (stryCov_9fa48("4788"), "  Top tags:"));
        stryMutAct_9fa48("4789") ? Object.entries(dbStats.tagDistribution).forEach(([tag, count]) => {
          console.log(`    #${tag}: ${count}`);
        }) : (stryCov_9fa48("4789"), Object.entries(dbStats.tagDistribution).slice(0, 5).forEach(([tag, count]) => {
          if (stryMutAct_9fa48("4790")) {
            {}
          } else {
            stryCov_9fa48("4790");
            console.log(stryMutAct_9fa48("4791") ? `` : (stryCov_9fa48("4791"), `    #${tag}: ${count}`));
          }
        }));

        // Test search functionality
        console.log(stryMutAct_9fa48("4792") ? "" : (stryCov_9fa48("4792"), "\n🔍 Testing search functionality..."));
        const testQueries = stryMutAct_9fa48("4793") ? [] : (stryCov_9fa48("4793"), [stryMutAct_9fa48("4794") ? "" : (stryCov_9fa48("4794"), "design systems holistic requirements"), stryMutAct_9fa48("4795") ? "" : (stryCov_9fa48("4795"), "MOC maps of content"), stryMutAct_9fa48("4796") ? "" : (stryCov_9fa48("4796"), "accessibility guidelines"), stryMutAct_9fa48("4797") ? "" : (stryCov_9fa48("4797"), "AI chat conversations"), stryMutAct_9fa48("4798") ? "" : (stryCov_9fa48("4798"), "design thinking process")]);
        for (const query of testQueries) {
          if (stryMutAct_9fa48("4799")) {
            {}
          } else {
            stryCov_9fa48("4799");
            try {
              if (stryMutAct_9fa48("4800")) {
                {}
              } else {
                stryCov_9fa48("4800");
                const queryEmbedding = await embeddingService.embed(query);
                const searchResults = await database.search(queryEmbedding, 3);
                console.log(stryMutAct_9fa48("4801") ? `` : (stryCov_9fa48("4801"), `\n  Query: "${query}"`));
                console.log(stryMutAct_9fa48("4802") ? `` : (stryCov_9fa48("4802"), `  Results: ${searchResults.length}`));
                if (stryMutAct_9fa48("4806") ? searchResults.length <= 0 : stryMutAct_9fa48("4805") ? searchResults.length >= 0 : stryMutAct_9fa48("4804") ? false : stryMutAct_9fa48("4803") ? true : (stryCov_9fa48("4803", "4804", "4805", "4806"), searchResults.length > 0)) {
                  if (stryMutAct_9fa48("4807")) {
                    {}
                  } else {
                    stryCov_9fa48("4807");
                    const topResult = searchResults[0];
                    console.log(stryMutAct_9fa48("4808") ? `` : (stryCov_9fa48("4808"), `    Top: ${topResult.meta.section} (${(stryMutAct_9fa48("4809") ? topResult.cosineSimilarity / 100 : (stryCov_9fa48("4809"), topResult.cosineSimilarity * 100)).toFixed(1)}%)`));
                    console.log(stryMutAct_9fa48("4810") ? `` : (stryCov_9fa48("4810"), `    File: ${stryMutAct_9fa48("4813") ? topResult.meta.obsidianFile?.fileName && "unknown" : stryMutAct_9fa48("4812") ? false : stryMutAct_9fa48("4811") ? true : (stryCov_9fa48("4811", "4812", "4813"), (stryMutAct_9fa48("4814") ? topResult.meta.obsidianFile.fileName : (stryCov_9fa48("4814"), topResult.meta.obsidianFile?.fileName)) || (stryMutAct_9fa48("4815") ? "" : (stryCov_9fa48("4815"), "unknown")))}`));
                    console.log(stryMutAct_9fa48("4816") ? `` : (stryCov_9fa48("4816"), `    Type: ${topResult.meta.contentType}`));
                    if (stryMutAct_9fa48("4820") ? topResult.meta.obsidianFile.tags?.length : stryMutAct_9fa48("4819") ? topResult.meta.obsidianFile?.tags.length : stryMutAct_9fa48("4818") ? false : stryMutAct_9fa48("4817") ? true : (stryCov_9fa48("4817", "4818", "4819", "4820"), topResult.meta.obsidianFile?.tags?.length)) {
                      if (stryMutAct_9fa48("4821")) {
                        {}
                      } else {
                        stryCov_9fa48("4821");
                        console.log(stryMutAct_9fa48("4822") ? `` : (stryCov_9fa48("4822"), `    Tags: ${stryMutAct_9fa48("4823") ? topResult.meta.obsidianFile.tags.join(", ") : (stryCov_9fa48("4823"), topResult.meta.obsidianFile.tags.slice(0, 3).join(stryMutAct_9fa48("4824") ? "" : (stryCov_9fa48("4824"), ", ")))}`));
                      }
                    }
                  }
                }
              }
            } catch (error) {
              if (stryMutAct_9fa48("4825")) {
                {}
              } else {
                stryCov_9fa48("4825");
                console.log(stryMutAct_9fa48("4826") ? `` : (stryCov_9fa48("4826"), `  ❌ Search failed for "${query}": ${error}`));
              }
            }
          }
        }
        console.log(stryMutAct_9fa48("4827") ? "" : (stryCov_9fa48("4827"), "\n🎉 Obsidian ingestion completed successfully!"));
        console.log(stryMutAct_9fa48("4828") ? "" : (stryCov_9fa48("4828"), "\n💡 Next steps:"));
        console.log(stryMutAct_9fa48("4829") ? "" : (stryCov_9fa48("4829"), "  1. Run search queries: tsx src/scripts/search.ts"));
        console.log(stryMutAct_9fa48("4830") ? "" : (stryCov_9fa48("4830"), "  2. Start the web interface: npm run dev"));
        console.log(stryMutAct_9fa48("4831") ? "" : (stryCov_9fa48("4831"), "  3. Set up periodic re-ingestion for updated files"));
        console.log(stryMutAct_9fa48("4832") ? "" : (stryCov_9fa48("4832"), "  4. Explore knowledge clusters and connections"));
        await database.close();
      }
    } catch (error) {
      if (stryMutAct_9fa48("4833")) {
        {}
      } else {
        stryCov_9fa48("4833");
        console.error(stryMutAct_9fa48("4834") ? "" : (stryCov_9fa48("4834"), "❌ Ingestion failed:"), error);
        process.exit(1);
      }
    }
  }
}

// Handle command line arguments
const args = stryMutAct_9fa48("4835") ? process.argv : (stryCov_9fa48("4835"), process.argv.slice(2));
if (stryMutAct_9fa48("4838") ? args.includes("--help") && args.includes("-h") : stryMutAct_9fa48("4837") ? false : stryMutAct_9fa48("4836") ? true : (stryCov_9fa48("4836", "4837", "4838"), args.includes(stryMutAct_9fa48("4839") ? "" : (stryCov_9fa48("4839"), "--help")) || args.includes(stryMutAct_9fa48("4840") ? "" : (stryCov_9fa48("4840"), "-h")))) {
  if (stryMutAct_9fa48("4841")) {
    {}
  } else {
    stryCov_9fa48("4841");
    console.log(stryMutAct_9fa48("4842") ? `` : (stryCov_9fa48("4842"), `
Obsidian Vault Ingestion Tool

Usage: tsx src/scripts/ingest-obsidian.ts [options]

Environment Variables:
  OBSIDIAN_VAULT_PATH    Path to your Obsidian vault (default: iCloud path)
  DATABASE_URL           PostgreSQL connection string (required)
  EMBEDDING_MODEL        Ollama model name (default: embeddinggemma)
  EMBEDDING_DIMENSION    Embedding dimension (default: 768)

Options:
  --help, -h             Show this help message

Example:
  export DATABASE_URL="postgresql://user:pass@localhost:5432/obsidian_rag"
  export OBSIDIAN_VAULT_PATH="/path/to/your/vault"
  tsx src/scripts/ingest-obsidian.ts
`));
    process.exit(0);
  }
}

// Run the main function
main().catch(error => {
  if (stryMutAct_9fa48("4843")) {
    {}
  } else {
    stryCov_9fa48("4843");
    console.error(stryMutAct_9fa48("4844") ? "" : (stryCov_9fa48("4844"), "❌ Unhandled error:"), error);
    process.exit(1);
  }
});