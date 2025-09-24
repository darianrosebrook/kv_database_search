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
import { ObsidianSearchService } from "../lib/obsidian-search";

// Load environment variables
dotenv.config();
const DATABASE_URL = process.env.DATABASE_URL;
const EMBEDDING_MODEL = stryMutAct_9fa48("5234") ? process.env.EMBEDDING_MODEL && "embeddinggemma" : stryMutAct_9fa48("5233") ? false : stryMutAct_9fa48("5232") ? true : (stryCov_9fa48("5232", "5233", "5234"), process.env.EMBEDDING_MODEL || (stryMutAct_9fa48("5235") ? "" : (stryCov_9fa48("5235"), "embeddinggemma")));
const EMBEDDING_DIMENSION = parseInt(stryMutAct_9fa48("5238") ? process.env.EMBEDDING_DIMENSION && "768" : stryMutAct_9fa48("5237") ? false : stryMutAct_9fa48("5236") ? true : (stryCov_9fa48("5236", "5237", "5238"), process.env.EMBEDDING_DIMENSION || (stryMutAct_9fa48("5239") ? "" : (stryCov_9fa48("5239"), "768"))));
async function main() {
  if (stryMutAct_9fa48("5240")) {
    {}
  } else {
    stryCov_9fa48("5240");
    if (stryMutAct_9fa48("5243") ? false : stryMutAct_9fa48("5242") ? true : stryMutAct_9fa48("5241") ? DATABASE_URL : (stryCov_9fa48("5241", "5242", "5243"), !DATABASE_URL)) {
      if (stryMutAct_9fa48("5244")) {
        {}
      } else {
        stryCov_9fa48("5244");
        console.error(stryMutAct_9fa48("5245") ? "" : (stryCov_9fa48("5245"), "❌ DATABASE_URL environment variable is required"));
        process.exit(1);
      }
    }

    // Get query from command line arguments
    const args = stryMutAct_9fa48("5246") ? process.argv : (stryCov_9fa48("5246"), process.argv.slice(2));
    const query = args.join(stryMutAct_9fa48("5247") ? "" : (stryCov_9fa48("5247"), " "));
    if (stryMutAct_9fa48("5250") ? false : stryMutAct_9fa48("5249") ? true : stryMutAct_9fa48("5248") ? query : (stryCov_9fa48("5248", "5249", "5250"), !query)) {
      if (stryMutAct_9fa48("5251")) {
        {}
      } else {
        stryCov_9fa48("5251");
        console.log(stryMutAct_9fa48("5252") ? `` : (stryCov_9fa48("5252"), `
Obsidian Search Tool

Usage: tsx src/scripts/search.ts <query>

Examples:
  tsx src/scripts/search.ts "design systems"
  tsx src/scripts/search.ts "accessibility guidelines"
  tsx src/scripts/search.ts "MOC maps of content"
`));
        process.exit(0);
      }
    }
    console.log(stryMutAct_9fa48("5253") ? "" : (stryCov_9fa48("5253"), "🔍 Initializing Obsidian search..."));
    console.log(stryMutAct_9fa48("5254") ? `` : (stryCov_9fa48("5254"), `🔗 Database: ${DATABASE_URL.replace(stryMutAct_9fa48("5255") ? /\/\/.@/ : (stryCov_9fa48("5255"), /\/\/.*@/), stryMutAct_9fa48("5256") ? "" : (stryCov_9fa48("5256"), "//***@"))}`));
    console.log(stryMutAct_9fa48("5257") ? `` : (stryCov_9fa48("5257"), `🧠 Embedding model: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSION}d)`));
    try {
      if (stryMutAct_9fa48("5258")) {
        {}
      } else {
        stryCov_9fa48("5258");
        // Initialize services
        const database = new ObsidianDatabase(DATABASE_URL);
        await database.initialize();
        const embeddingService = new ObsidianEmbeddingService(stryMutAct_9fa48("5259") ? {} : (stryCov_9fa48("5259"), {
          model: EMBEDDING_MODEL,
          dimension: EMBEDDING_DIMENSION
        }));

        // Test embedding service
        const embeddingTest = await embeddingService.testConnection();
        if (stryMutAct_9fa48("5262") ? false : stryMutAct_9fa48("5261") ? true : stryMutAct_9fa48("5260") ? embeddingTest.success : (stryCov_9fa48("5260", "5261", "5262"), !embeddingTest.success)) {
          if (stryMutAct_9fa48("5263")) {
            {}
          } else {
            stryCov_9fa48("5263");
            throw new Error(stryMutAct_9fa48("5264") ? "" : (stryCov_9fa48("5264"), "Embedding service connection failed"));
          }
        }
        const searchService = new ObsidianSearchService(database, embeddingService);

        // Perform search
        console.log(stryMutAct_9fa48("5265") ? `` : (stryCov_9fa48("5265"), `\n🔍 Searching for: "${query}"`));
        const startTime = Date.now();
        const searchResponse = await searchService.search(query, stryMutAct_9fa48("5266") ? {} : (stryCov_9fa48("5266"), {
          limit: 10,
          searchMode: stryMutAct_9fa48("5267") ? "" : (stryCov_9fa48("5267"), "comprehensive"),
          includeRelated: stryMutAct_9fa48("5268") ? false : (stryCov_9fa48("5268"), true),
          maxRelated: 3
        }));
        const duration = stryMutAct_9fa48("5269") ? Date.now() + startTime : (stryCov_9fa48("5269"), Date.now() - startTime);

        // Display results
        console.log((stryMutAct_9fa48("5270") ? "" : (stryCov_9fa48("5270"), "\n")) + (stryMutAct_9fa48("5271") ? "" : (stryCov_9fa48("5271"), "=")).repeat(80));
        console.log(stryMutAct_9fa48("5272") ? `` : (stryCov_9fa48("5272"), `📊 SEARCH RESULTS (${duration}ms)`));
        console.log((stryMutAct_9fa48("5273") ? "" : (stryCov_9fa48("5273"), "=")).repeat(80));
        console.log(stryMutAct_9fa48("5274") ? `` : (stryCov_9fa48("5274"), `Query: "${searchResponse.query}"`));
        console.log(stryMutAct_9fa48("5275") ? `` : (stryCov_9fa48("5275"), `Results: ${searchResponse.results.length}/${searchResponse.totalFound} found`));
        if (stryMutAct_9fa48("5278") ? searchResponse.results.length !== 0 : stryMutAct_9fa48("5277") ? false : stryMutAct_9fa48("5276") ? true : (stryCov_9fa48("5276", "5277", "5278"), searchResponse.results.length === 0)) {
          if (stryMutAct_9fa48("5279")) {
            {}
          } else {
            stryCov_9fa48("5279");
            console.log(stryMutAct_9fa48("5280") ? "" : (stryCov_9fa48("5280"), "\n❌ No results found. Try:"));
            console.log(stryMutAct_9fa48("5281") ? "" : (stryCov_9fa48("5281"), "  - Using different keywords"));
            console.log(stryMutAct_9fa48("5282") ? "" : (stryCov_9fa48("5282"), "  - Checking if content has been ingested"));
            console.log(stryMutAct_9fa48("5283") ? "" : (stryCov_9fa48("5283"), "  - Using broader search terms"));
          }
        } else {
          if (stryMutAct_9fa48("5284")) {
            {}
          } else {
            stryCov_9fa48("5284");
            // Display top results
            console.log(stryMutAct_9fa48("5285") ? "" : (stryCov_9fa48("5285"), "\n📋 Top Results:"));
            stryMutAct_9fa48("5286") ? searchResponse.results.forEach((result, i) => {
              console.log(`\n${i + 1}. ${result.meta.section}`);
              console.log(`   File: ${result.obsidianMeta?.fileName || "unknown"}`);
              console.log(`   Type: ${result.meta.contentType}`);
              console.log(`   Score: ${(result.cosineSimilarity * 100).toFixed(1)}%`);
              if (result.obsidianMeta?.tags?.length) {
                console.log(`   Tags: ${result.obsidianMeta.tags.slice(0, 5).join(", ")}`);
              }
              if (result.highlights?.length) {
                console.log(`   Highlights: ${result.highlights[0].slice(0, 100)}...`);
              } else {
                console.log(`   Preview: ${result.text.slice(0, 150)}...`);
              }
              if (result.relatedChunks?.length) {
                console.log(`   Related: ${result.relatedChunks.length} connected chunks`);
              }
            }) : (stryCov_9fa48("5286"), searchResponse.results.slice(0, 5).forEach((result, i) => {
              if (stryMutAct_9fa48("5287")) {
                {}
              } else {
                stryCov_9fa48("5287");
                console.log(stryMutAct_9fa48("5288") ? `` : (stryCov_9fa48("5288"), `\n${stryMutAct_9fa48("5289") ? i - 1 : (stryCov_9fa48("5289"), i + 1)}. ${result.meta.section}`));
                console.log(stryMutAct_9fa48("5290") ? `` : (stryCov_9fa48("5290"), `   File: ${stryMutAct_9fa48("5293") ? result.obsidianMeta?.fileName && "unknown" : stryMutAct_9fa48("5292") ? false : stryMutAct_9fa48("5291") ? true : (stryCov_9fa48("5291", "5292", "5293"), (stryMutAct_9fa48("5294") ? result.obsidianMeta.fileName : (stryCov_9fa48("5294"), result.obsidianMeta?.fileName)) || (stryMutAct_9fa48("5295") ? "" : (stryCov_9fa48("5295"), "unknown")))}`));
                console.log(stryMutAct_9fa48("5296") ? `` : (stryCov_9fa48("5296"), `   Type: ${result.meta.contentType}`));
                console.log(stryMutAct_9fa48("5297") ? `` : (stryCov_9fa48("5297"), `   Score: ${(stryMutAct_9fa48("5298") ? result.cosineSimilarity / 100 : (stryCov_9fa48("5298"), result.cosineSimilarity * 100)).toFixed(1)}%`));
                if (stryMutAct_9fa48("5302") ? result.obsidianMeta.tags?.length : stryMutAct_9fa48("5301") ? result.obsidianMeta?.tags.length : stryMutAct_9fa48("5300") ? false : stryMutAct_9fa48("5299") ? true : (stryCov_9fa48("5299", "5300", "5301", "5302"), result.obsidianMeta?.tags?.length)) {
                  if (stryMutAct_9fa48("5303")) {
                    {}
                  } else {
                    stryCov_9fa48("5303");
                    console.log(stryMutAct_9fa48("5304") ? `` : (stryCov_9fa48("5304"), `   Tags: ${stryMutAct_9fa48("5305") ? result.obsidianMeta.tags.join(", ") : (stryCov_9fa48("5305"), result.obsidianMeta.tags.slice(0, 5).join(stryMutAct_9fa48("5306") ? "" : (stryCov_9fa48("5306"), ", ")))}`));
                  }
                }
                if (stryMutAct_9fa48("5309") ? result.highlights.length : stryMutAct_9fa48("5308") ? false : stryMutAct_9fa48("5307") ? true : (stryCov_9fa48("5307", "5308", "5309"), result.highlights?.length)) {
                  if (stryMutAct_9fa48("5310")) {
                    {}
                  } else {
                    stryCov_9fa48("5310");
                    console.log(stryMutAct_9fa48("5311") ? `` : (stryCov_9fa48("5311"), `   Highlights: ${stryMutAct_9fa48("5312") ? result.highlights[0] : (stryCov_9fa48("5312"), result.highlights[0].slice(0, 100))}...`));
                  }
                } else {
                  if (stryMutAct_9fa48("5313")) {
                    {}
                  } else {
                    stryCov_9fa48("5313");
                    console.log(stryMutAct_9fa48("5314") ? `` : (stryCov_9fa48("5314"), `   Preview: ${stryMutAct_9fa48("5315") ? result.text : (stryCov_9fa48("5315"), result.text.slice(0, 150))}...`));
                  }
                }
                if (stryMutAct_9fa48("5318") ? result.relatedChunks.length : stryMutAct_9fa48("5317") ? false : stryMutAct_9fa48("5316") ? true : (stryCov_9fa48("5316", "5317", "5318"), result.relatedChunks?.length)) {
                  if (stryMutAct_9fa48("5319")) {
                    {}
                  } else {
                    stryCov_9fa48("5319");
                    console.log(stryMutAct_9fa48("5320") ? `` : (stryCov_9fa48("5320"), `   Related: ${result.relatedChunks.length} connected chunks`));
                  }
                }
              }
            }));

            // Display facets
            if (stryMutAct_9fa48("5322") ? false : stryMutAct_9fa48("5321") ? true : (stryCov_9fa48("5321", "5322"), searchResponse.facets)) {
              if (stryMutAct_9fa48("5323")) {
                {}
              } else {
                stryCov_9fa48("5323");
                console.log(stryMutAct_9fa48("5324") ? "" : (stryCov_9fa48("5324"), "\n📊 Content Distribution:"));
                if (stryMutAct_9fa48("5327") ? searchResponse.facets.fileTypes || searchResponse.facets.fileTypes.length > 0 : stryMutAct_9fa48("5326") ? false : stryMutAct_9fa48("5325") ? true : (stryCov_9fa48("5325", "5326", "5327"), searchResponse.facets.fileTypes && (stryMutAct_9fa48("5330") ? searchResponse.facets.fileTypes.length <= 0 : stryMutAct_9fa48("5329") ? searchResponse.facets.fileTypes.length >= 0 : stryMutAct_9fa48("5328") ? true : (stryCov_9fa48("5328", "5329", "5330"), searchResponse.facets.fileTypes.length > 0)))) {
                  if (stryMutAct_9fa48("5331")) {
                    {}
                  } else {
                    stryCov_9fa48("5331");
                    console.log(stryMutAct_9fa48("5332") ? "" : (stryCov_9fa48("5332"), "  By Type:"));
                    stryMutAct_9fa48("5333") ? searchResponse.facets.fileTypes.forEach(facet => {
                      console.log(`    ${facet.type}: ${facet.count}`);
                    }) : (stryCov_9fa48("5333"), searchResponse.facets.fileTypes.slice(0, 5).forEach(facet => {
                      if (stryMutAct_9fa48("5334")) {
                        {}
                      } else {
                        stryCov_9fa48("5334");
                        console.log(stryMutAct_9fa48("5335") ? `` : (stryCov_9fa48("5335"), `    ${facet.type}: ${facet.count}`));
                      }
                    }));
                  }
                }
                if (stryMutAct_9fa48("5338") ? searchResponse.facets.tags || searchResponse.facets.tags.length > 0 : stryMutAct_9fa48("5337") ? false : stryMutAct_9fa48("5336") ? true : (stryCov_9fa48("5336", "5337", "5338"), searchResponse.facets.tags && (stryMutAct_9fa48("5341") ? searchResponse.facets.tags.length <= 0 : stryMutAct_9fa48("5340") ? searchResponse.facets.tags.length >= 0 : stryMutAct_9fa48("5339") ? true : (stryCov_9fa48("5339", "5340", "5341"), searchResponse.facets.tags.length > 0)))) {
                  if (stryMutAct_9fa48("5342")) {
                    {}
                  } else {
                    stryCov_9fa48("5342");
                    console.log(stryMutAct_9fa48("5343") ? "" : (stryCov_9fa48("5343"), "  By Tags:"));
                    stryMutAct_9fa48("5344") ? searchResponse.facets.tags.forEach(facet => {
                      console.log(`    #${facet.tag}: ${facet.count}`);
                    }) : (stryCov_9fa48("5344"), searchResponse.facets.tags.slice(0, 5).forEach(facet => {
                      if (stryMutAct_9fa48("5345")) {
                        {}
                      } else {
                        stryCov_9fa48("5345");
                        console.log(stryMutAct_9fa48("5346") ? `` : (stryCov_9fa48("5346"), `    #${facet.tag}: ${facet.count}`));
                      }
                    }));
                  }
                }
                if (stryMutAct_9fa48("5349") ? searchResponse.facets.folders || searchResponse.facets.folders.length > 0 : stryMutAct_9fa48("5348") ? false : stryMutAct_9fa48("5347") ? true : (stryCov_9fa48("5347", "5348", "5349"), searchResponse.facets.folders && (stryMutAct_9fa48("5352") ? searchResponse.facets.folders.length <= 0 : stryMutAct_9fa48("5351") ? searchResponse.facets.folders.length >= 0 : stryMutAct_9fa48("5350") ? true : (stryCov_9fa48("5350", "5351", "5352"), searchResponse.facets.folders.length > 0)))) {
                  if (stryMutAct_9fa48("5353")) {
                    {}
                  } else {
                    stryCov_9fa48("5353");
                    console.log(stryMutAct_9fa48("5354") ? "" : (stryCov_9fa48("5354"), "  By Folders:"));
                    stryMutAct_9fa48("5355") ? searchResponse.facets.folders.forEach(facet => {
                      console.log(`    ${facet.folder}: ${facet.count}`);
                    }) : (stryCov_9fa48("5355"), searchResponse.facets.folders.slice(0, 5).forEach(facet => {
                      if (stryMutAct_9fa48("5356")) {
                        {}
                      } else {
                        stryCov_9fa48("5356");
                        console.log(stryMutAct_9fa48("5357") ? `` : (stryCov_9fa48("5357"), `    ${facet.folder}: ${facet.count}`));
                      }
                    }));
                  }
                }
              }
            }

            // Display graph insights
            if (stryMutAct_9fa48("5359") ? false : stryMutAct_9fa48("5358") ? true : (stryCov_9fa48("5358", "5359"), searchResponse.graphInsights)) {
              if (stryMutAct_9fa48("5360")) {
                {}
              } else {
                stryCov_9fa48("5360");
                console.log(stryMutAct_9fa48("5361") ? "" : (stryCov_9fa48("5361"), "\n🔗 Knowledge Graph Insights:"));
                if (stryMutAct_9fa48("5365") ? searchResponse.graphInsights.queryConcepts.length <= 0 : stryMutAct_9fa48("5364") ? searchResponse.graphInsights.queryConcepts.length >= 0 : stryMutAct_9fa48("5363") ? false : stryMutAct_9fa48("5362") ? true : (stryCov_9fa48("5362", "5363", "5364", "5365"), searchResponse.graphInsights.queryConcepts.length > 0)) {
                  if (stryMutAct_9fa48("5366")) {
                    {}
                  } else {
                    stryCov_9fa48("5366");
                    console.log(stryMutAct_9fa48("5367") ? `` : (stryCov_9fa48("5367"), `  Query concepts: ${searchResponse.graphInsights.queryConcepts.join(stryMutAct_9fa48("5368") ? "" : (stryCov_9fa48("5368"), ", "))}`));
                  }
                }
                if (stryMutAct_9fa48("5372") ? searchResponse.graphInsights.relatedConcepts.length <= 0 : stryMutAct_9fa48("5371") ? searchResponse.graphInsights.relatedConcepts.length >= 0 : stryMutAct_9fa48("5370") ? false : stryMutAct_9fa48("5369") ? true : (stryCov_9fa48("5369", "5370", "5371", "5372"), searchResponse.graphInsights.relatedConcepts.length > 0)) {
                  if (stryMutAct_9fa48("5373")) {
                    {}
                  } else {
                    stryCov_9fa48("5373");
                    console.log(stryMutAct_9fa48("5374") ? `` : (stryCov_9fa48("5374"), `  Related concepts: ${stryMutAct_9fa48("5375") ? searchResponse.graphInsights.relatedConcepts.join(", ") : (stryCov_9fa48("5375"), searchResponse.graphInsights.relatedConcepts.slice(0, 5).join(stryMutAct_9fa48("5376") ? "" : (stryCov_9fa48("5376"), ", ")))}`));
                  }
                }
                if (stryMutAct_9fa48("5380") ? searchResponse.graphInsights.knowledgeClusters.length <= 0 : stryMutAct_9fa48("5379") ? searchResponse.graphInsights.knowledgeClusters.length >= 0 : stryMutAct_9fa48("5378") ? false : stryMutAct_9fa48("5377") ? true : (stryCov_9fa48("5377", "5378", "5379", "5380"), searchResponse.graphInsights.knowledgeClusters.length > 0)) {
                  if (stryMutAct_9fa48("5381")) {
                    {}
                  } else {
                    stryCov_9fa48("5381");
                    console.log(stryMutAct_9fa48("5382") ? "" : (stryCov_9fa48("5382"), "  Knowledge clusters:"));
                    stryMutAct_9fa48("5383") ? searchResponse.graphInsights.knowledgeClusters.forEach(cluster => {
                      console.log(`    ${cluster.name}: ${cluster.files.length} files (${(cluster.centrality * 100).toFixed(1)}% centrality)`);
                    }) : (stryCov_9fa48("5383"), searchResponse.graphInsights.knowledgeClusters.slice(0, 3).forEach(cluster => {
                      if (stryMutAct_9fa48("5384")) {
                        {}
                      } else {
                        stryCov_9fa48("5384");
                        console.log(stryMutAct_9fa48("5385") ? `` : (stryCov_9fa48("5385"), `    ${cluster.name}: ${cluster.files.length} files (${(stryMutAct_9fa48("5386") ? cluster.centrality / 100 : (stryCov_9fa48("5386"), cluster.centrality * 100)).toFixed(1)}% centrality)`));
                      }
                    }));
                  }
                }
              }
            }
          }
        }

        // Suggest specialized searches
        console.log(stryMutAct_9fa48("5387") ? "" : (stryCov_9fa48("5387"), "\n💡 Try specialized searches:"));
        console.log(stryMutAct_9fa48("5388") ? "" : (stryCov_9fa48("5388"), "  MOCs: tsx src/scripts/search.ts MOC"));
        console.log(stryMutAct_9fa48("5389") ? "" : (stryCov_9fa48("5389"), "  By tag: tsx src/scripts/search.ts '#design'"));
        console.log(stryMutAct_9fa48("5390") ? "" : (stryCov_9fa48("5390"), "  Conversations: tsx src/scripts/search.ts 'AI chat'"));
        console.log(stryMutAct_9fa48("5391") ? "" : (stryCov_9fa48("5391"), "  Articles: tsx src/scripts/search.ts 'article design system'"));
        await database.close();
      }
    } catch (error) {
      if (stryMutAct_9fa48("5392")) {
        {}
      } else {
        stryCov_9fa48("5392");
        console.error(stryMutAct_9fa48("5393") ? "" : (stryCov_9fa48("5393"), "❌ Search failed:"), error);
        process.exit(1);
      }
    }
  }
}

// Run the main function
main().catch(error => {
  if (stryMutAct_9fa48("5394")) {
    {}
  } else {
    stryCov_9fa48("5394");
    console.error(stryMutAct_9fa48("5395") ? "" : (stryCov_9fa48("5395"), "❌ Unhandled error:"), error);
    process.exit(1);
  }
});