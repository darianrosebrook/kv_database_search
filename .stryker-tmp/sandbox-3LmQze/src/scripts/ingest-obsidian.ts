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
const OBSIDIAN_VAULT_PATH = stryMutAct_9fa48("4769") ? process.env.OBSIDIAN_VAULT_PATH && "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault" : stryMutAct_9fa48("4768") ? false : stryMutAct_9fa48("4767") ? true : (stryCov_9fa48("4767", "4768", "4769"), process.env.OBSIDIAN_VAULT_PATH || (stryMutAct_9fa48("4770") ? "" : (stryCov_9fa48("4770"), "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault")));
const DATABASE_URL = process.env.DATABASE_URL;
const EMBEDDING_MODEL = stryMutAct_9fa48("4773") ? process.env.EMBEDDING_MODEL && "embeddinggemma" : stryMutAct_9fa48("4772") ? false : stryMutAct_9fa48("4771") ? true : (stryCov_9fa48("4771", "4772", "4773"), process.env.EMBEDDING_MODEL || (stryMutAct_9fa48("4774") ? "" : (stryCov_9fa48("4774"), "embeddinggemma")));
const EMBEDDING_DIMENSION = parseInt(stryMutAct_9fa48("4777") ? process.env.EMBEDDING_DIMENSION && "768" : stryMutAct_9fa48("4776") ? false : stryMutAct_9fa48("4775") ? true : (stryCov_9fa48("4775", "4776", "4777"), process.env.EMBEDDING_DIMENSION || (stryMutAct_9fa48("4778") ? "" : (stryCov_9fa48("4778"), "768"))));
async function main() {
  if (stryMutAct_9fa48("4779")) {
    {}
  } else {
    stryCov_9fa48("4779");
    if (stryMutAct_9fa48("4782") ? false : stryMutAct_9fa48("4781") ? true : stryMutAct_9fa48("4780") ? DATABASE_URL : (stryCov_9fa48("4780", "4781", "4782"), !DATABASE_URL)) {
      if (stryMutAct_9fa48("4783")) {
        {}
      } else {
        stryCov_9fa48("4783");
        console.error(stryMutAct_9fa48("4784") ? "" : (stryCov_9fa48("4784"), "❌ DATABASE_URL environment variable is required"));
        process.exit(1);
      }
    }
    console.log(stryMutAct_9fa48("4785") ? "" : (stryCov_9fa48("4785"), "🚀 Starting Obsidian vault ingestion..."));
    console.log(stryMutAct_9fa48("4786") ? `` : (stryCov_9fa48("4786"), `📁 Vault path: ${OBSIDIAN_VAULT_PATH}`));
    console.log(stryMutAct_9fa48("4787") ? `` : (stryCov_9fa48("4787"), `🔗 Database: ${DATABASE_URL.replace(stryMutAct_9fa48("4788") ? /\/\/.@/ : (stryCov_9fa48("4788"), /\/\/.*@/), stryMutAct_9fa48("4789") ? "" : (stryCov_9fa48("4789"), "//***@"))}`));
    console.log(stryMutAct_9fa48("4790") ? `` : (stryCov_9fa48("4790"), `🧠 Embedding model: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSION}d)`));
    try {
      if (stryMutAct_9fa48("4791")) {
        {}
      } else {
        stryCov_9fa48("4791");
        // Initialize services
        console.log(stryMutAct_9fa48("4792") ? "" : (stryCov_9fa48("4792"), "🔧 Initializing services..."));
        const database = new ObsidianDatabase(DATABASE_URL);
        await database.initialize();
        const embeddingService = new ObsidianEmbeddingService(stryMutAct_9fa48("4793") ? {} : (stryCov_9fa48("4793"), {
          model: EMBEDDING_MODEL,
          dimension: EMBEDDING_DIMENSION
        }));

        // Test embedding service
        const embeddingTest = await embeddingService.testConnection();
        if (stryMutAct_9fa48("4796") ? false : stryMutAct_9fa48("4795") ? true : stryMutAct_9fa48("4794") ? embeddingTest.success : (stryCov_9fa48("4794", "4795", "4796"), !embeddingTest.success)) {
          if (stryMutAct_9fa48("4797")) {
            {}
          } else {
            stryCov_9fa48("4797");
            throw new Error(stryMutAct_9fa48("4798") ? "" : (stryCov_9fa48("4798"), "Embedding service connection failed"));
          }
        }
        console.log(stryMutAct_9fa48("4799") ? `` : (stryCov_9fa48("4799"), `✅ Embedding service ready (${embeddingTest.dimension}d)`));

        // Initialize Obsidian ingestion pipeline
        const obsidianPipeline = new ObsidianIngestionPipeline(database, embeddingService, OBSIDIAN_VAULT_PATH);

        // Configure ingestion options
        const ingestionOptions = stryMutAct_9fa48("4800") ? {} : (stryCov_9fa48("4800"), {
          batchSize: 1,
          // Process one file at a time for debugging
          rateLimitMs: 300,
          // Be gentle with the embedding service
          skipExisting: stryMutAct_9fa48("4801") ? false : (stryCov_9fa48("4801"), true),
          includePatterns: stryMutAct_9fa48("4802") ? [] : (stryCov_9fa48("4802"), [stryMutAct_9fa48("4803") ? "" : (stryCov_9fa48("4803"), "**/*.md")]),
          excludePatterns: stryMutAct_9fa48("4804") ? [] : (stryCov_9fa48("4804"), [stryMutAct_9fa48("4805") ? "" : (stryCov_9fa48("4805"), "**/.obsidian/**"), stryMutAct_9fa48("4806") ? "" : (stryCov_9fa48("4806"), "**/node_modules/**"), stryMutAct_9fa48("4807") ? "" : (stryCov_9fa48("4807"), "**/.git/**"), stryMutAct_9fa48("4808") ? "" : (stryCov_9fa48("4808"), "**/Attachments/**"), // Skip binary attachments
          stryMutAct_9fa48("4809") ? "" : (stryCov_9fa48("4809"), "**/assets/**"), // Skip asset files
          stryMutAct_9fa48("4810") ? "" : (stryCov_9fa48("4810"), "**/wp-content/**") // Skip WordPress content
          ]),
          chunkingOptions: stryMutAct_9fa48("4811") ? {} : (stryCov_9fa48("4811"), {
            maxChunkSize: 800,
            // Smaller chunks for better semantic search
            chunkOverlap: 100,
            preserveStructure: stryMutAct_9fa48("4812") ? false : (stryCov_9fa48("4812"), true),
            // Respect Obsidian's heading structure
            includeContext: stryMutAct_9fa48("4813") ? false : (stryCov_9fa48("4813"), true),
            // Include frontmatter and wikilink context
            cleanContent: stryMutAct_9fa48("4814") ? false : (stryCov_9fa48("4814"), true) // Clean markdown for better embeddings
          })
        });
        console.log(stryMutAct_9fa48("4815") ? "" : (stryCov_9fa48("4815"), "📊 Ingestion configuration:"), stryMutAct_9fa48("4816") ? {} : (stryCov_9fa48("4816"), {
          batchSize: ingestionOptions.batchSize,
          maxChunkSize: ingestionOptions.chunkingOptions.maxChunkSize,
          preserveStructure: ingestionOptions.chunkingOptions.preserveStructure,
          includeContext: ingestionOptions.chunkingOptions.includeContext,
          cleanContent: ingestionOptions.chunkingOptions.cleanContent
        }));

        // Start ingestion
        const startTime = Date.now();
        const result = await obsidianPipeline.ingestVault(ingestionOptions);
        const duration = stryMutAct_9fa48("4817") ? Date.now() + startTime : (stryCov_9fa48("4817"), Date.now() - startTime);

        // Display results
        console.log((stryMutAct_9fa48("4818") ? "" : (stryCov_9fa48("4818"), "\n")) + (stryMutAct_9fa48("4819") ? "" : (stryCov_9fa48("4819"), "=")).repeat(60));
        console.log(stryMutAct_9fa48("4820") ? "" : (stryCov_9fa48("4820"), "📈 OBSIDIAN INGESTION RESULTS"));
        console.log((stryMutAct_9fa48("4821") ? "" : (stryCov_9fa48("4821"), "=")).repeat(60));
        console.log(stryMutAct_9fa48("4822") ? `` : (stryCov_9fa48("4822"), `⏱️  Duration: ${Math.round(stryMutAct_9fa48("4823") ? duration * 1000 : (stryCov_9fa48("4823"), duration / 1000))}s`));
        console.log(stryMutAct_9fa48("4824") ? `` : (stryCov_9fa48("4824"), `📄 Files processed: ${result.processedFiles}/${result.totalFiles}`));
        console.log(stryMutAct_9fa48("4825") ? `` : (stryCov_9fa48("4825"), `📦 Chunks created: ${result.totalChunks}`));
        console.log(stryMutAct_9fa48("4826") ? `` : (stryCov_9fa48("4826"), `✅ Chunks processed: ${result.processedChunks}`));
        console.log(stryMutAct_9fa48("4827") ? `` : (stryCov_9fa48("4827"), `⏭️  Chunks skipped: ${result.skippedChunks}`));
        console.log(stryMutAct_9fa48("4828") ? `` : (stryCov_9fa48("4828"), `❌ Errors: ${result.errors.length}`));
        if (stryMutAct_9fa48("4832") ? result.errors.length <= 0 : stryMutAct_9fa48("4831") ? result.errors.length >= 0 : stryMutAct_9fa48("4830") ? false : stryMutAct_9fa48("4829") ? true : (stryCov_9fa48("4829", "4830", "4831", "4832"), result.errors.length > 0)) {
          if (stryMutAct_9fa48("4833")) {
            {}
          } else {
            stryCov_9fa48("4833");
            console.log(stryMutAct_9fa48("4834") ? "" : (stryCov_9fa48("4834"), "\n🚨 ERRORS:"));
            stryMutAct_9fa48("4835") ? result.errors.forEach((error, i) => {
              console.log(`  ${i + 1}. ${error}`);
            }) : (stryCov_9fa48("4835"), result.errors.slice(0, 5).forEach((error, i) => {
              if (stryMutAct_9fa48("4836")) {
                {}
              } else {
                stryCov_9fa48("4836");
                console.log(stryMutAct_9fa48("4837") ? `` : (stryCov_9fa48("4837"), `  ${stryMutAct_9fa48("4838") ? i - 1 : (stryCov_9fa48("4838"), i + 1)}. ${error}`));
              }
            }));
            if (stryMutAct_9fa48("4842") ? result.errors.length <= 5 : stryMutAct_9fa48("4841") ? result.errors.length >= 5 : stryMutAct_9fa48("4840") ? false : stryMutAct_9fa48("4839") ? true : (stryCov_9fa48("4839", "4840", "4841", "4842"), result.errors.length > 5)) {
              if (stryMutAct_9fa48("4843")) {
                {}
              } else {
                stryCov_9fa48("4843");
                console.log(stryMutAct_9fa48("4844") ? `` : (stryCov_9fa48("4844"), `  ... and ${stryMutAct_9fa48("4845") ? result.errors.length + 5 : (stryCov_9fa48("4845"), result.errors.length - 5)} more errors`));
              }
            }
          }
        }

        // Validation
        console.log(stryMutAct_9fa48("4846") ? "" : (stryCov_9fa48("4846"), "\n🔍 Validating ingestion..."));
        const validation = await obsidianPipeline.validateIngestion(10);
        if (stryMutAct_9fa48("4848") ? false : stryMutAct_9fa48("4847") ? true : (stryCov_9fa48("4847", "4848"), validation.isValid)) {
          if (stryMutAct_9fa48("4849")) {
            {}
          } else {
            stryCov_9fa48("4849");
            console.log(stryMutAct_9fa48("4850") ? "" : (stryCov_9fa48("4850"), "✅ Validation passed!"));
          }
        } else {
          if (stryMutAct_9fa48("4851")) {
            {}
          } else {
            stryCov_9fa48("4851");
            console.log(stryMutAct_9fa48("4852") ? "" : (stryCov_9fa48("4852"), "⚠️  Validation issues found:"));
            validation.issues.forEach((issue, i) => {
              if (stryMutAct_9fa48("4853")) {
                {}
              } else {
                stryCov_9fa48("4853");
                console.log(stryMutAct_9fa48("4854") ? `` : (stryCov_9fa48("4854"), `  ${stryMutAct_9fa48("4855") ? i - 1 : (stryCov_9fa48("4855"), i + 1)}. ${issue}`));
              }
            });
          }
        }

        // Sample results
        if (stryMutAct_9fa48("4859") ? validation.sampleResults.length <= 0 : stryMutAct_9fa48("4858") ? validation.sampleResults.length >= 0 : stryMutAct_9fa48("4857") ? false : stryMutAct_9fa48("4856") ? true : (stryCov_9fa48("4856", "4857", "4858", "4859"), validation.sampleResults.length > 0)) {
          if (stryMutAct_9fa48("4860")) {
            {}
          } else {
            stryCov_9fa48("4860");
            console.log(stryMutAct_9fa48("4861") ? "" : (stryCov_9fa48("4861"), "\n📋 Sample results:"));
            stryMutAct_9fa48("4862") ? validation.sampleResults.forEach((sample, i) => {
              console.log(`  ${i + 1}. ${sample.id}`);
              console.log(`     Text: ${sample.textPreview}`);
              console.log(`     Valid: ${sample.metadataValid ? "✅" : "❌"}`);
              if (sample.obsidianMetadata) {
                console.log(`     File: ${sample.obsidianMetadata.fileName}`);
                console.log(`     Tags: ${sample.obsidianMetadata.tags?.slice(0, 3).join(", ") || "none"}`);
              }
              console.log("");
            }) : (stryCov_9fa48("4862"), validation.sampleResults.slice(0, 3).forEach((sample, i) => {
              if (stryMutAct_9fa48("4863")) {
                {}
              } else {
                stryCov_9fa48("4863");
                console.log(stryMutAct_9fa48("4864") ? `` : (stryCov_9fa48("4864"), `  ${stryMutAct_9fa48("4865") ? i - 1 : (stryCov_9fa48("4865"), i + 1)}. ${sample.id}`));
                console.log(stryMutAct_9fa48("4866") ? `` : (stryCov_9fa48("4866"), `     Text: ${sample.textPreview}`));
                console.log(stryMutAct_9fa48("4867") ? `` : (stryCov_9fa48("4867"), `     Valid: ${sample.metadataValid ? stryMutAct_9fa48("4868") ? "" : (stryCov_9fa48("4868"), "✅") : stryMutAct_9fa48("4869") ? "" : (stryCov_9fa48("4869"), "❌")}`));
                if (stryMutAct_9fa48("4871") ? false : stryMutAct_9fa48("4870") ? true : (stryCov_9fa48("4870", "4871"), sample.obsidianMetadata)) {
                  if (stryMutAct_9fa48("4872")) {
                    {}
                  } else {
                    stryCov_9fa48("4872");
                    console.log(stryMutAct_9fa48("4873") ? `` : (stryCov_9fa48("4873"), `     File: ${sample.obsidianMetadata.fileName}`));
                    console.log(stryMutAct_9fa48("4874") ? `` : (stryCov_9fa48("4874"), `     Tags: ${stryMutAct_9fa48("4877") ? sample.obsidianMetadata.tags?.slice(0, 3).join(", ") && "none" : stryMutAct_9fa48("4876") ? false : stryMutAct_9fa48("4875") ? true : (stryCov_9fa48("4875", "4876", "4877"), (stryMutAct_9fa48("4879") ? sample.obsidianMetadata.tags.slice(0, 3).join(", ") : stryMutAct_9fa48("4878") ? sample.obsidianMetadata.tags.join(", ") : (stryCov_9fa48("4878", "4879"), sample.obsidianMetadata.tags?.slice(0, 3).join(stryMutAct_9fa48("4880") ? "" : (stryCov_9fa48("4880"), ", ")))) || (stryMutAct_9fa48("4881") ? "" : (stryCov_9fa48("4881"), "none")))}`));
                  }
                }
                console.log(stryMutAct_9fa48("4882") ? "Stryker was here!" : (stryCov_9fa48("4882"), ""));
              }
            }));
          }
        }

        // Database statistics
        const dbStats = await database.getStats();
        console.log(stryMutAct_9fa48("4883") ? "" : (stryCov_9fa48("4883"), "\n📊 Database statistics:"));
        console.log(stryMutAct_9fa48("4884") ? `` : (stryCov_9fa48("4884"), `  Total chunks: ${dbStats.totalChunks}`));
        console.log(stryMutAct_9fa48("4885") ? "" : (stryCov_9fa48("4885"), "  By content type:"));
        Object.entries(dbStats.byContentType).forEach(([type, count]) => {
          if (stryMutAct_9fa48("4886")) {
            {}
          } else {
            stryCov_9fa48("4886");
            console.log(stryMutAct_9fa48("4887") ? `` : (stryCov_9fa48("4887"), `    ${type}: ${count}`));
          }
        });
        console.log(stryMutAct_9fa48("4888") ? "" : (stryCov_9fa48("4888"), "  By folder:"));
        stryMutAct_9fa48("4889") ? Object.entries(dbStats.byFolder).forEach(([folder, count]) => {
          console.log(`    ${folder}: ${count}`);
        }) : (stryCov_9fa48("4889"), Object.entries(dbStats.byFolder).slice(0, 5).forEach(([folder, count]) => {
          if (stryMutAct_9fa48("4890")) {
            {}
          } else {
            stryCov_9fa48("4890");
            console.log(stryMutAct_9fa48("4891") ? `` : (stryCov_9fa48("4891"), `    ${folder}: ${count}`));
          }
        }));
        console.log(stryMutAct_9fa48("4892") ? "" : (stryCov_9fa48("4892"), "  Top tags:"));
        stryMutAct_9fa48("4893") ? Object.entries(dbStats.tagDistribution).forEach(([tag, count]) => {
          console.log(`    #${tag}: ${count}`);
        }) : (stryCov_9fa48("4893"), Object.entries(dbStats.tagDistribution).slice(0, 5).forEach(([tag, count]) => {
          if (stryMutAct_9fa48("4894")) {
            {}
          } else {
            stryCov_9fa48("4894");
            console.log(stryMutAct_9fa48("4895") ? `` : (stryCov_9fa48("4895"), `    #${tag}: ${count}`));
          }
        }));

        // Test search functionality
        console.log(stryMutAct_9fa48("4896") ? "" : (stryCov_9fa48("4896"), "\n🔍 Testing search functionality..."));
        const testQueries = stryMutAct_9fa48("4897") ? [] : (stryCov_9fa48("4897"), [stryMutAct_9fa48("4898") ? "" : (stryCov_9fa48("4898"), "design systems holistic requirements"), stryMutAct_9fa48("4899") ? "" : (stryCov_9fa48("4899"), "MOC maps of content"), stryMutAct_9fa48("4900") ? "" : (stryCov_9fa48("4900"), "accessibility guidelines"), stryMutAct_9fa48("4901") ? "" : (stryCov_9fa48("4901"), "AI chat conversations"), stryMutAct_9fa48("4902") ? "" : (stryCov_9fa48("4902"), "design thinking process")]);
        for (const query of testQueries) {
          if (stryMutAct_9fa48("4903")) {
            {}
          } else {
            stryCov_9fa48("4903");
            try {
              if (stryMutAct_9fa48("4904")) {
                {}
              } else {
                stryCov_9fa48("4904");
                const queryEmbedding = await embeddingService.embed(query);
                const searchResults = await database.search(queryEmbedding, 3);
                console.log(stryMutAct_9fa48("4905") ? `` : (stryCov_9fa48("4905"), `\n  Query: "${query}"`));
                console.log(stryMutAct_9fa48("4906") ? `` : (stryCov_9fa48("4906"), `  Results: ${searchResults.length}`));
                if (stryMutAct_9fa48("4910") ? searchResults.length <= 0 : stryMutAct_9fa48("4909") ? searchResults.length >= 0 : stryMutAct_9fa48("4908") ? false : stryMutAct_9fa48("4907") ? true : (stryCov_9fa48("4907", "4908", "4909", "4910"), searchResults.length > 0)) {
                  if (stryMutAct_9fa48("4911")) {
                    {}
                  } else {
                    stryCov_9fa48("4911");
                    const topResult = searchResults[0];
                    console.log(stryMutAct_9fa48("4912") ? `` : (stryCov_9fa48("4912"), `    Top: ${topResult.meta.section} (${(stryMutAct_9fa48("4913") ? topResult.cosineSimilarity / 100 : (stryCov_9fa48("4913"), topResult.cosineSimilarity * 100)).toFixed(1)}%)`));
                    console.log(stryMutAct_9fa48("4914") ? `` : (stryCov_9fa48("4914"), `    File: ${stryMutAct_9fa48("4917") ? topResult.meta.obsidianFile?.fileName && "unknown" : stryMutAct_9fa48("4916") ? false : stryMutAct_9fa48("4915") ? true : (stryCov_9fa48("4915", "4916", "4917"), (stryMutAct_9fa48("4918") ? topResult.meta.obsidianFile.fileName : (stryCov_9fa48("4918"), topResult.meta.obsidianFile?.fileName)) || (stryMutAct_9fa48("4919") ? "" : (stryCov_9fa48("4919"), "unknown")))}`));
                    console.log(stryMutAct_9fa48("4920") ? `` : (stryCov_9fa48("4920"), `    Type: ${topResult.meta.contentType}`));
                    if (stryMutAct_9fa48("4924") ? topResult.meta.obsidianFile.tags?.length : stryMutAct_9fa48("4923") ? topResult.meta.obsidianFile?.tags.length : stryMutAct_9fa48("4922") ? false : stryMutAct_9fa48("4921") ? true : (stryCov_9fa48("4921", "4922", "4923", "4924"), topResult.meta.obsidianFile?.tags?.length)) {
                      if (stryMutAct_9fa48("4925")) {
                        {}
                      } else {
                        stryCov_9fa48("4925");
                        console.log(stryMutAct_9fa48("4926") ? `` : (stryCov_9fa48("4926"), `    Tags: ${stryMutAct_9fa48("4927") ? topResult.meta.obsidianFile.tags.join(", ") : (stryCov_9fa48("4927"), topResult.meta.obsidianFile.tags.slice(0, 3).join(stryMutAct_9fa48("4928") ? "" : (stryCov_9fa48("4928"), ", ")))}`));
                      }
                    }
                  }
                }
              }
            } catch (error) {
              if (stryMutAct_9fa48("4929")) {
                {}
              } else {
                stryCov_9fa48("4929");
                console.log(stryMutAct_9fa48("4930") ? `` : (stryCov_9fa48("4930"), `  ❌ Search failed for "${query}": ${error}`));
              }
            }
          }
        }
        console.log(stryMutAct_9fa48("4931") ? "" : (stryCov_9fa48("4931"), "\n🎉 Obsidian ingestion completed successfully!"));
        console.log(stryMutAct_9fa48("4932") ? "" : (stryCov_9fa48("4932"), "\n💡 Next steps:"));
        console.log(stryMutAct_9fa48("4933") ? "" : (stryCov_9fa48("4933"), "  1. Run search queries: tsx src/scripts/search.ts"));
        console.log(stryMutAct_9fa48("4934") ? "" : (stryCov_9fa48("4934"), "  2. Start the web interface: npm run dev"));
        console.log(stryMutAct_9fa48("4935") ? "" : (stryCov_9fa48("4935"), "  3. Set up periodic re-ingestion for updated files"));
        console.log(stryMutAct_9fa48("4936") ? "" : (stryCov_9fa48("4936"), "  4. Explore knowledge clusters and connections"));
        await database.close();
      }
    } catch (error) {
      if (stryMutAct_9fa48("4937")) {
        {}
      } else {
        stryCov_9fa48("4937");
        console.error(stryMutAct_9fa48("4938") ? "" : (stryCov_9fa48("4938"), "❌ Ingestion failed:"), error);
        process.exit(1);
      }
    }
  }
}

// Handle command line arguments
const args = stryMutAct_9fa48("4939") ? process.argv : (stryCov_9fa48("4939"), process.argv.slice(2));
if (stryMutAct_9fa48("4942") ? args.includes("--help") && args.includes("-h") : stryMutAct_9fa48("4941") ? false : stryMutAct_9fa48("4940") ? true : (stryCov_9fa48("4940", "4941", "4942"), args.includes(stryMutAct_9fa48("4943") ? "" : (stryCov_9fa48("4943"), "--help")) || args.includes(stryMutAct_9fa48("4944") ? "" : (stryCov_9fa48("4944"), "-h")))) {
  if (stryMutAct_9fa48("4945")) {
    {}
  } else {
    stryCov_9fa48("4945");
    console.log(stryMutAct_9fa48("4946") ? `` : (stryCov_9fa48("4946"), `
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
  if (stryMutAct_9fa48("4947")) {
    {}
  } else {
    stryCov_9fa48("4947");
    console.error(stryMutAct_9fa48("4948") ? "" : (stryCov_9fa48("4948"), "❌ Unhandled error:"), error);
    process.exit(1);
  }
});