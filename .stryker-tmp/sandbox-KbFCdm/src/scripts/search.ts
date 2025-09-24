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
const EMBEDDING_MODEL = stryMutAct_9fa48("5130") ? process.env.EMBEDDING_MODEL && "embeddinggemma" : stryMutAct_9fa48("5129") ? false : stryMutAct_9fa48("5128") ? true : (stryCov_9fa48("5128", "5129", "5130"), process.env.EMBEDDING_MODEL || (stryMutAct_9fa48("5131") ? "" : (stryCov_9fa48("5131"), "embeddinggemma")));
const EMBEDDING_DIMENSION = parseInt(stryMutAct_9fa48("5134") ? process.env.EMBEDDING_DIMENSION && "768" : stryMutAct_9fa48("5133") ? false : stryMutAct_9fa48("5132") ? true : (stryCov_9fa48("5132", "5133", "5134"), process.env.EMBEDDING_DIMENSION || (stryMutAct_9fa48("5135") ? "" : (stryCov_9fa48("5135"), "768"))));
async function main() {
  if (stryMutAct_9fa48("5136")) {
    {}
  } else {
    stryCov_9fa48("5136");
    if (stryMutAct_9fa48("5139") ? false : stryMutAct_9fa48("5138") ? true : stryMutAct_9fa48("5137") ? DATABASE_URL : (stryCov_9fa48("5137", "5138", "5139"), !DATABASE_URL)) {
      if (stryMutAct_9fa48("5140")) {
        {}
      } else {
        stryCov_9fa48("5140");
        console.error(stryMutAct_9fa48("5141") ? "" : (stryCov_9fa48("5141"), "❌ DATABASE_URL environment variable is required"));
        process.exit(1);
      }
    }

    // Get query from command line arguments
    const args = stryMutAct_9fa48("5142") ? process.argv : (stryCov_9fa48("5142"), process.argv.slice(2));
    const query = args.join(stryMutAct_9fa48("5143") ? "" : (stryCov_9fa48("5143"), " "));
    if (stryMutAct_9fa48("5146") ? false : stryMutAct_9fa48("5145") ? true : stryMutAct_9fa48("5144") ? query : (stryCov_9fa48("5144", "5145", "5146"), !query)) {
      if (stryMutAct_9fa48("5147")) {
        {}
      } else {
        stryCov_9fa48("5147");
        console.log(stryMutAct_9fa48("5148") ? `` : (stryCov_9fa48("5148"), `
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
    console.log(stryMutAct_9fa48("5149") ? "" : (stryCov_9fa48("5149"), "🔍 Initializing Obsidian search..."));
    console.log(stryMutAct_9fa48("5150") ? `` : (stryCov_9fa48("5150"), `🔗 Database: ${DATABASE_URL.replace(stryMutAct_9fa48("5151") ? /\/\/.@/ : (stryCov_9fa48("5151"), /\/\/.*@/), stryMutAct_9fa48("5152") ? "" : (stryCov_9fa48("5152"), "//***@"))}`));
    console.log(stryMutAct_9fa48("5153") ? `` : (stryCov_9fa48("5153"), `🧠 Embedding model: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSION}d)`));
    try {
      if (stryMutAct_9fa48("5154")) {
        {}
      } else {
        stryCov_9fa48("5154");
        // Initialize services
        const database = new ObsidianDatabase(DATABASE_URL);
        await database.initialize();
        const embeddingService = new ObsidianEmbeddingService(stryMutAct_9fa48("5155") ? {} : (stryCov_9fa48("5155"), {
          model: EMBEDDING_MODEL,
          dimension: EMBEDDING_DIMENSION
        }));

        // Test embedding service
        const embeddingTest = await embeddingService.testConnection();
        if (stryMutAct_9fa48("5158") ? false : stryMutAct_9fa48("5157") ? true : stryMutAct_9fa48("5156") ? embeddingTest.success : (stryCov_9fa48("5156", "5157", "5158"), !embeddingTest.success)) {
          if (stryMutAct_9fa48("5159")) {
            {}
          } else {
            stryCov_9fa48("5159");
            throw new Error(stryMutAct_9fa48("5160") ? "" : (stryCov_9fa48("5160"), "Embedding service connection failed"));
          }
        }
        const searchService = new ObsidianSearchService(database, embeddingService);

        // Perform search
        console.log(stryMutAct_9fa48("5161") ? `` : (stryCov_9fa48("5161"), `\n🔍 Searching for: "${query}"`));
        const startTime = Date.now();
        const searchResponse = await searchService.search(query, stryMutAct_9fa48("5162") ? {} : (stryCov_9fa48("5162"), {
          limit: 10,
          searchMode: stryMutAct_9fa48("5163") ? "" : (stryCov_9fa48("5163"), "comprehensive"),
          includeRelated: stryMutAct_9fa48("5164") ? false : (stryCov_9fa48("5164"), true),
          maxRelated: 3
        }));
        const duration = stryMutAct_9fa48("5165") ? Date.now() + startTime : (stryCov_9fa48("5165"), Date.now() - startTime);

        // Display results
        console.log((stryMutAct_9fa48("5166") ? "" : (stryCov_9fa48("5166"), "\n")) + (stryMutAct_9fa48("5167") ? "" : (stryCov_9fa48("5167"), "=")).repeat(80));
        console.log(stryMutAct_9fa48("5168") ? `` : (stryCov_9fa48("5168"), `📊 SEARCH RESULTS (${duration}ms)`));
        console.log((stryMutAct_9fa48("5169") ? "" : (stryCov_9fa48("5169"), "=")).repeat(80));
        console.log(stryMutAct_9fa48("5170") ? `` : (stryCov_9fa48("5170"), `Query: "${searchResponse.query}"`));
        console.log(stryMutAct_9fa48("5171") ? `` : (stryCov_9fa48("5171"), `Results: ${searchResponse.results.length}/${searchResponse.totalFound} found`));
        if (stryMutAct_9fa48("5174") ? searchResponse.results.length !== 0 : stryMutAct_9fa48("5173") ? false : stryMutAct_9fa48("5172") ? true : (stryCov_9fa48("5172", "5173", "5174"), searchResponse.results.length === 0)) {
          if (stryMutAct_9fa48("5175")) {
            {}
          } else {
            stryCov_9fa48("5175");
            console.log(stryMutAct_9fa48("5176") ? "" : (stryCov_9fa48("5176"), "\n❌ No results found. Try:"));
            console.log(stryMutAct_9fa48("5177") ? "" : (stryCov_9fa48("5177"), "  - Using different keywords"));
            console.log(stryMutAct_9fa48("5178") ? "" : (stryCov_9fa48("5178"), "  - Checking if content has been ingested"));
            console.log(stryMutAct_9fa48("5179") ? "" : (stryCov_9fa48("5179"), "  - Using broader search terms"));
          }
        } else {
          if (stryMutAct_9fa48("5180")) {
            {}
          } else {
            stryCov_9fa48("5180");
            // Display top results
            console.log(stryMutAct_9fa48("5181") ? "" : (stryCov_9fa48("5181"), "\n📋 Top Results:"));
            stryMutAct_9fa48("5182") ? searchResponse.results.forEach((result, i) => {
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
            }) : (stryCov_9fa48("5182"), searchResponse.results.slice(0, 5).forEach((result, i) => {
              if (stryMutAct_9fa48("5183")) {
                {}
              } else {
                stryCov_9fa48("5183");
                console.log(stryMutAct_9fa48("5184") ? `` : (stryCov_9fa48("5184"), `\n${stryMutAct_9fa48("5185") ? i - 1 : (stryCov_9fa48("5185"), i + 1)}. ${result.meta.section}`));
                console.log(stryMutAct_9fa48("5186") ? `` : (stryCov_9fa48("5186"), `   File: ${stryMutAct_9fa48("5189") ? result.obsidianMeta?.fileName && "unknown" : stryMutAct_9fa48("5188") ? false : stryMutAct_9fa48("5187") ? true : (stryCov_9fa48("5187", "5188", "5189"), (stryMutAct_9fa48("5190") ? result.obsidianMeta.fileName : (stryCov_9fa48("5190"), result.obsidianMeta?.fileName)) || (stryMutAct_9fa48("5191") ? "" : (stryCov_9fa48("5191"), "unknown")))}`));
                console.log(stryMutAct_9fa48("5192") ? `` : (stryCov_9fa48("5192"), `   Type: ${result.meta.contentType}`));
                console.log(stryMutAct_9fa48("5193") ? `` : (stryCov_9fa48("5193"), `   Score: ${(stryMutAct_9fa48("5194") ? result.cosineSimilarity / 100 : (stryCov_9fa48("5194"), result.cosineSimilarity * 100)).toFixed(1)}%`));
                if (stryMutAct_9fa48("5198") ? result.obsidianMeta.tags?.length : stryMutAct_9fa48("5197") ? result.obsidianMeta?.tags.length : stryMutAct_9fa48("5196") ? false : stryMutAct_9fa48("5195") ? true : (stryCov_9fa48("5195", "5196", "5197", "5198"), result.obsidianMeta?.tags?.length)) {
                  if (stryMutAct_9fa48("5199")) {
                    {}
                  } else {
                    stryCov_9fa48("5199");
                    console.log(stryMutAct_9fa48("5200") ? `` : (stryCov_9fa48("5200"), `   Tags: ${stryMutAct_9fa48("5201") ? result.obsidianMeta.tags.join(", ") : (stryCov_9fa48("5201"), result.obsidianMeta.tags.slice(0, 5).join(stryMutAct_9fa48("5202") ? "" : (stryCov_9fa48("5202"), ", ")))}`));
                  }
                }
                if (stryMutAct_9fa48("5205") ? result.highlights.length : stryMutAct_9fa48("5204") ? false : stryMutAct_9fa48("5203") ? true : (stryCov_9fa48("5203", "5204", "5205"), result.highlights?.length)) {
                  if (stryMutAct_9fa48("5206")) {
                    {}
                  } else {
                    stryCov_9fa48("5206");
                    console.log(stryMutAct_9fa48("5207") ? `` : (stryCov_9fa48("5207"), `   Highlights: ${stryMutAct_9fa48("5208") ? result.highlights[0] : (stryCov_9fa48("5208"), result.highlights[0].slice(0, 100))}...`));
                  }
                } else {
                  if (stryMutAct_9fa48("5209")) {
                    {}
                  } else {
                    stryCov_9fa48("5209");
                    console.log(stryMutAct_9fa48("5210") ? `` : (stryCov_9fa48("5210"), `   Preview: ${stryMutAct_9fa48("5211") ? result.text : (stryCov_9fa48("5211"), result.text.slice(0, 150))}...`));
                  }
                }
                if (stryMutAct_9fa48("5214") ? result.relatedChunks.length : stryMutAct_9fa48("5213") ? false : stryMutAct_9fa48("5212") ? true : (stryCov_9fa48("5212", "5213", "5214"), result.relatedChunks?.length)) {
                  if (stryMutAct_9fa48("5215")) {
                    {}
                  } else {
                    stryCov_9fa48("5215");
                    console.log(stryMutAct_9fa48("5216") ? `` : (stryCov_9fa48("5216"), `   Related: ${result.relatedChunks.length} connected chunks`));
                  }
                }
              }
            }));

            // Display facets
            if (stryMutAct_9fa48("5218") ? false : stryMutAct_9fa48("5217") ? true : (stryCov_9fa48("5217", "5218"), searchResponse.facets)) {
              if (stryMutAct_9fa48("5219")) {
                {}
              } else {
                stryCov_9fa48("5219");
                console.log(stryMutAct_9fa48("5220") ? "" : (stryCov_9fa48("5220"), "\n📊 Content Distribution:"));
                if (stryMutAct_9fa48("5223") ? searchResponse.facets.fileTypes || searchResponse.facets.fileTypes.length > 0 : stryMutAct_9fa48("5222") ? false : stryMutAct_9fa48("5221") ? true : (stryCov_9fa48("5221", "5222", "5223"), searchResponse.facets.fileTypes && (stryMutAct_9fa48("5226") ? searchResponse.facets.fileTypes.length <= 0 : stryMutAct_9fa48("5225") ? searchResponse.facets.fileTypes.length >= 0 : stryMutAct_9fa48("5224") ? true : (stryCov_9fa48("5224", "5225", "5226"), searchResponse.facets.fileTypes.length > 0)))) {
                  if (stryMutAct_9fa48("5227")) {
                    {}
                  } else {
                    stryCov_9fa48("5227");
                    console.log(stryMutAct_9fa48("5228") ? "" : (stryCov_9fa48("5228"), "  By Type:"));
                    stryMutAct_9fa48("5229") ? searchResponse.facets.fileTypes.forEach(facet => {
                      console.log(`    ${facet.type}: ${facet.count}`);
                    }) : (stryCov_9fa48("5229"), searchResponse.facets.fileTypes.slice(0, 5).forEach(facet => {
                      if (stryMutAct_9fa48("5230")) {
                        {}
                      } else {
                        stryCov_9fa48("5230");
                        console.log(stryMutAct_9fa48("5231") ? `` : (stryCov_9fa48("5231"), `    ${facet.type}: ${facet.count}`));
                      }
                    }));
                  }
                }
                if (stryMutAct_9fa48("5234") ? searchResponse.facets.tags || searchResponse.facets.tags.length > 0 : stryMutAct_9fa48("5233") ? false : stryMutAct_9fa48("5232") ? true : (stryCov_9fa48("5232", "5233", "5234"), searchResponse.facets.tags && (stryMutAct_9fa48("5237") ? searchResponse.facets.tags.length <= 0 : stryMutAct_9fa48("5236") ? searchResponse.facets.tags.length >= 0 : stryMutAct_9fa48("5235") ? true : (stryCov_9fa48("5235", "5236", "5237"), searchResponse.facets.tags.length > 0)))) {
                  if (stryMutAct_9fa48("5238")) {
                    {}
                  } else {
                    stryCov_9fa48("5238");
                    console.log(stryMutAct_9fa48("5239") ? "" : (stryCov_9fa48("5239"), "  By Tags:"));
                    stryMutAct_9fa48("5240") ? searchResponse.facets.tags.forEach(facet => {
                      console.log(`    #${facet.tag}: ${facet.count}`);
                    }) : (stryCov_9fa48("5240"), searchResponse.facets.tags.slice(0, 5).forEach(facet => {
                      if (stryMutAct_9fa48("5241")) {
                        {}
                      } else {
                        stryCov_9fa48("5241");
                        console.log(stryMutAct_9fa48("5242") ? `` : (stryCov_9fa48("5242"), `    #${facet.tag}: ${facet.count}`));
                      }
                    }));
                  }
                }
                if (stryMutAct_9fa48("5245") ? searchResponse.facets.folders || searchResponse.facets.folders.length > 0 : stryMutAct_9fa48("5244") ? false : stryMutAct_9fa48("5243") ? true : (stryCov_9fa48("5243", "5244", "5245"), searchResponse.facets.folders && (stryMutAct_9fa48("5248") ? searchResponse.facets.folders.length <= 0 : stryMutAct_9fa48("5247") ? searchResponse.facets.folders.length >= 0 : stryMutAct_9fa48("5246") ? true : (stryCov_9fa48("5246", "5247", "5248"), searchResponse.facets.folders.length > 0)))) {
                  if (stryMutAct_9fa48("5249")) {
                    {}
                  } else {
                    stryCov_9fa48("5249");
                    console.log(stryMutAct_9fa48("5250") ? "" : (stryCov_9fa48("5250"), "  By Folders:"));
                    stryMutAct_9fa48("5251") ? searchResponse.facets.folders.forEach(facet => {
                      console.log(`    ${facet.folder}: ${facet.count}`);
                    }) : (stryCov_9fa48("5251"), searchResponse.facets.folders.slice(0, 5).forEach(facet => {
                      if (stryMutAct_9fa48("5252")) {
                        {}
                      } else {
                        stryCov_9fa48("5252");
                        console.log(stryMutAct_9fa48("5253") ? `` : (stryCov_9fa48("5253"), `    ${facet.folder}: ${facet.count}`));
                      }
                    }));
                  }
                }
              }
            }

            // Display graph insights
            if (stryMutAct_9fa48("5255") ? false : stryMutAct_9fa48("5254") ? true : (stryCov_9fa48("5254", "5255"), searchResponse.graphInsights)) {
              if (stryMutAct_9fa48("5256")) {
                {}
              } else {
                stryCov_9fa48("5256");
                console.log(stryMutAct_9fa48("5257") ? "" : (stryCov_9fa48("5257"), "\n🔗 Knowledge Graph Insights:"));
                if (stryMutAct_9fa48("5261") ? searchResponse.graphInsights.queryConcepts.length <= 0 : stryMutAct_9fa48("5260") ? searchResponse.graphInsights.queryConcepts.length >= 0 : stryMutAct_9fa48("5259") ? false : stryMutAct_9fa48("5258") ? true : (stryCov_9fa48("5258", "5259", "5260", "5261"), searchResponse.graphInsights.queryConcepts.length > 0)) {
                  if (stryMutAct_9fa48("5262")) {
                    {}
                  } else {
                    stryCov_9fa48("5262");
                    console.log(stryMutAct_9fa48("5263") ? `` : (stryCov_9fa48("5263"), `  Query concepts: ${searchResponse.graphInsights.queryConcepts.join(stryMutAct_9fa48("5264") ? "" : (stryCov_9fa48("5264"), ", "))}`));
                  }
                }
                if (stryMutAct_9fa48("5268") ? searchResponse.graphInsights.relatedConcepts.length <= 0 : stryMutAct_9fa48("5267") ? searchResponse.graphInsights.relatedConcepts.length >= 0 : stryMutAct_9fa48("5266") ? false : stryMutAct_9fa48("5265") ? true : (stryCov_9fa48("5265", "5266", "5267", "5268"), searchResponse.graphInsights.relatedConcepts.length > 0)) {
                  if (stryMutAct_9fa48("5269")) {
                    {}
                  } else {
                    stryCov_9fa48("5269");
                    console.log(stryMutAct_9fa48("5270") ? `` : (stryCov_9fa48("5270"), `  Related concepts: ${stryMutAct_9fa48("5271") ? searchResponse.graphInsights.relatedConcepts.join(", ") : (stryCov_9fa48("5271"), searchResponse.graphInsights.relatedConcepts.slice(0, 5).join(stryMutAct_9fa48("5272") ? "" : (stryCov_9fa48("5272"), ", ")))}`));
                  }
                }
                if (stryMutAct_9fa48("5276") ? searchResponse.graphInsights.knowledgeClusters.length <= 0 : stryMutAct_9fa48("5275") ? searchResponse.graphInsights.knowledgeClusters.length >= 0 : stryMutAct_9fa48("5274") ? false : stryMutAct_9fa48("5273") ? true : (stryCov_9fa48("5273", "5274", "5275", "5276"), searchResponse.graphInsights.knowledgeClusters.length > 0)) {
                  if (stryMutAct_9fa48("5277")) {
                    {}
                  } else {
                    stryCov_9fa48("5277");
                    console.log(stryMutAct_9fa48("5278") ? "" : (stryCov_9fa48("5278"), "  Knowledge clusters:"));
                    stryMutAct_9fa48("5279") ? searchResponse.graphInsights.knowledgeClusters.forEach(cluster => {
                      console.log(`    ${cluster.name}: ${cluster.files.length} files (${(cluster.centrality * 100).toFixed(1)}% centrality)`);
                    }) : (stryCov_9fa48("5279"), searchResponse.graphInsights.knowledgeClusters.slice(0, 3).forEach(cluster => {
                      if (stryMutAct_9fa48("5280")) {
                        {}
                      } else {
                        stryCov_9fa48("5280");
                        console.log(stryMutAct_9fa48("5281") ? `` : (stryCov_9fa48("5281"), `    ${cluster.name}: ${cluster.files.length} files (${(stryMutAct_9fa48("5282") ? cluster.centrality / 100 : (stryCov_9fa48("5282"), cluster.centrality * 100)).toFixed(1)}% centrality)`));
                      }
                    }));
                  }
                }
              }
            }
          }
        }

        // Suggest specialized searches
        console.log(stryMutAct_9fa48("5283") ? "" : (stryCov_9fa48("5283"), "\n💡 Try specialized searches:"));
        console.log(stryMutAct_9fa48("5284") ? "" : (stryCov_9fa48("5284"), "  MOCs: tsx src/scripts/search.ts MOC"));
        console.log(stryMutAct_9fa48("5285") ? "" : (stryCov_9fa48("5285"), "  By tag: tsx src/scripts/search.ts '#design'"));
        console.log(stryMutAct_9fa48("5286") ? "" : (stryCov_9fa48("5286"), "  Conversations: tsx src/scripts/search.ts 'AI chat'"));
        console.log(stryMutAct_9fa48("5287") ? "" : (stryCov_9fa48("5287"), "  Articles: tsx src/scripts/search.ts 'article design system'"));
        await database.close();
      }
    } catch (error) {
      if (stryMutAct_9fa48("5288")) {
        {}
      } else {
        stryCov_9fa48("5288");
        console.error(stryMutAct_9fa48("5289") ? "" : (stryCov_9fa48("5289"), "❌ Search failed:"), error);
        process.exit(1);
      }
    }
  }
}

// Run the main function
main().catch(error => {
  if (stryMutAct_9fa48("5290")) {
    {}
  } else {
    stryCov_9fa48("5290");
    console.error(stryMutAct_9fa48("5291") ? "" : (stryCov_9fa48("5291"), "❌ Unhandled error:"), error);
    process.exit(1);
  }
});