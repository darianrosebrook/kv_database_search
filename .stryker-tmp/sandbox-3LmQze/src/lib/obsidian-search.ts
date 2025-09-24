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
import { ObsidianDatabase } from "./database";
import { ObsidianEmbeddingService } from "./embeddings";
import { detectLanguage } from "./utils";
import { SearchResult, ObsidianSearchOptions, ObsidianSearchResult, ObsidianSearchResponse, ContentType } from "../types/index";
export class ObsidianSearchService {
  private db: ObsidianDatabase;
  private embeddings: ObsidianEmbeddingService;
  constructor(database: ObsidianDatabase, embeddingService: ObsidianEmbeddingService) {
    if (stryMutAct_9fa48("2432")) {
      {}
    } else {
      stryCov_9fa48("2432");
      this.db = database;
      this.embeddings = embeddingService;
    }
  }
  async search(query: string, options: ObsidianSearchOptions = {}): Promise<ObsidianSearchResponse> {
    if (stryMutAct_9fa48("2433")) {
      {}
    } else {
      stryCov_9fa48("2433");
      const {
        searchMode = stryMutAct_9fa48("2434") ? "" : (stryCov_9fa48("2434"), "comprehensive"),
        includeRelated = stryMutAct_9fa48("2435") ? false : (stryCov_9fa48("2435"), true),
        maxRelated = 3,
        limit = 20,
        minSimilarity = 0.0,
        multiModalTypes,
        minQuality,
        languages,
        hasText,
        fileSizeRange,
        ...filterOptions
      } = options;
      console.log(stryMutAct_9fa48("2436") ? `` : (stryCov_9fa48("2436"), `🔍 Obsidian search: "${query}" (mode: ${searchMode})`));
      const startTime = Date.now();
      try {
        if (stryMutAct_9fa48("2437")) {
          {}
        } else {
          stryCov_9fa48("2437");
          // Generate query embedding with strategy
          const embeddingResult = await this.embeddings.embedWithStrategy(query, undefined, stryMutAct_9fa48("2438") ? "" : (stryCov_9fa48("2438"), "knowledge-base"));
          console.log(stryMutAct_9fa48("2439") ? `` : (stryCov_9fa48("2439"), `🎯 Using model: ${embeddingResult.model.name} (confidence: ${(stryMutAct_9fa48("2440") ? embeddingResult.confidence / 100 : (stryCov_9fa48("2440"), embeddingResult.confidence * 100)).toFixed(1)}%)`));

          // Perform vector search with Obsidian-specific filters
          const searchResults = await this.db.search(embeddingResult.embedding, stryMutAct_9fa48("2441") ? limit / 2 : (stryCov_9fa48("2441"), limit * 2), // Get more results for post-processing
          stryMutAct_9fa48("2442") ? {} : (stryCov_9fa48("2442"), {
            ...filterOptions,
            minSimilarity
          }));

          // Apply multi-modal specific filters
          let filteredResults = searchResults;
          if (stryMutAct_9fa48("2445") ? (multiModalTypes || minQuality || languages || hasText !== undefined) && fileSizeRange : stryMutAct_9fa48("2444") ? false : stryMutAct_9fa48("2443") ? true : (stryCov_9fa48("2443", "2444", "2445"), (stryMutAct_9fa48("2447") ? (multiModalTypes || minQuality || languages) && hasText !== undefined : stryMutAct_9fa48("2446") ? false : (stryCov_9fa48("2446", "2447"), (stryMutAct_9fa48("2449") ? (multiModalTypes || minQuality) && languages : stryMutAct_9fa48("2448") ? false : (stryCov_9fa48("2448", "2449"), (stryMutAct_9fa48("2451") ? multiModalTypes && minQuality : stryMutAct_9fa48("2450") ? false : (stryCov_9fa48("2450", "2451"), multiModalTypes || minQuality)) || languages)) || (stryMutAct_9fa48("2453") ? hasText === undefined : stryMutAct_9fa48("2452") ? false : (stryCov_9fa48("2452", "2453"), hasText !== undefined)))) || fileSizeRange)) {
            if (stryMutAct_9fa48("2454")) {
              {}
            } else {
              stryCov_9fa48("2454");
              filteredResults = this.applyMultiModalFilters(searchResults, stryMutAct_9fa48("2455") ? {} : (stryCov_9fa48("2455"), {
                multiModalTypes,
                minQuality,
                languages,
                hasText,
                fileSizeRange
              }));
            }
          }

          // Enhance results with Obsidian-specific data
          const enhancedResults = await this.enhanceResults(stryMutAct_9fa48("2456") ? filteredResults : (stryCov_9fa48("2456"), filteredResults.slice(0, limit)), query, stryMutAct_9fa48("2457") ? {} : (stryCov_9fa48("2457"), {
            includeRelated,
            maxRelated
          }));

          // Generate facets for filtering
          const facets = await this.generateFacets(enhancedResults);

          // Generate graph insights
          const graphInsights = await this.generateGraphInsights(query, enhancedResults);
          const latencyMs = stryMutAct_9fa48("2458") ? Date.now() + startTime : (stryCov_9fa48("2458"), Date.now() - startTime);
          console.log(stryMutAct_9fa48("2459") ? `` : (stryCov_9fa48("2459"), `✅ Obsidian search completed: ${enhancedResults.length} results in ${latencyMs}ms`));
          return stryMutAct_9fa48("2460") ? {} : (stryCov_9fa48("2460"), {
            query,
            results: enhancedResults,
            totalFound: searchResults.length,
            latencyMs,
            facets,
            graphInsights
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("2461")) {
          {}
        } else {
          stryCov_9fa48("2461");
          console.error(stryMutAct_9fa48("2462") ? `` : (stryCov_9fa48("2462"), `❌ Obsidian search failed: ${error}`));
          throw new Error(stryMutAct_9fa48("2463") ? `` : (stryCov_9fa48("2463"), `Obsidian search failed: ${error}`));
        }
      }
    }
  }
  private async enhanceResults(results: SearchResult[], query: string, options: {
    includeRelated: boolean;
    maxRelated: number;
  }): Promise<ObsidianSearchResult[]> {
    if (stryMutAct_9fa48("2464")) {
      {}
    } else {
      stryCov_9fa48("2464");
      const enhanced: ObsidianSearchResult[] = stryMutAct_9fa48("2465") ? ["Stryker was here"] : (stryCov_9fa48("2465"), []);
      for (const result of results) {
        if (stryMutAct_9fa48("2466")) {
          {}
        } else {
          stryCov_9fa48("2466");
          // Handle both Obsidian files and multi-modal files
          const obsidianMeta = result.meta.obsidianFile;
          const multiModalMeta = result.meta.multiModalFile;
          if (stryMutAct_9fa48("2469") ? !obsidianMeta || !multiModalMeta : stryMutAct_9fa48("2468") ? false : stryMutAct_9fa48("2467") ? true : (stryCov_9fa48("2467", "2468", "2469"), (stryMutAct_9fa48("2470") ? obsidianMeta : (stryCov_9fa48("2470"), !obsidianMeta)) && (stryMutAct_9fa48("2471") ? multiModalMeta : (stryCov_9fa48("2471"), !multiModalMeta)))) continue;

          // Generate highlights
          const highlights = this.generateHighlights(result.text, query);

          // Find related chunks if requested
          let relatedChunks: Array<{
            id: string;
            content: string;
            score: number;
          }> = stryMutAct_9fa48("2472") ? ["Stryker was here"] : (stryCov_9fa48("2472"), []);
          if (stryMutAct_9fa48("2475") ? options.includeRelated || obsidianMeta?.wikilinks : stryMutAct_9fa48("2474") ? false : stryMutAct_9fa48("2473") ? true : (stryCov_9fa48("2473", "2474", "2475"), options.includeRelated && (stryMutAct_9fa48("2476") ? obsidianMeta.wikilinks : (stryCov_9fa48("2476"), obsidianMeta?.wikilinks)))) {
            if (stryMutAct_9fa48("2477")) {
              {}
            } else {
              stryCov_9fa48("2477");
              const searchResults = await this.findRelatedChunks(obsidianMeta.wikilinks, options.maxRelated);
              relatedChunks = searchResults.map(stryMutAct_9fa48("2478") ? () => undefined : (stryCov_9fa48("2478"), r => stryMutAct_9fa48("2479") ? {} : (stryCov_9fa48("2479"), {
                id: r.id,
                content: stryMutAct_9fa48("2482") ? (r.text || r.content) && "" : stryMutAct_9fa48("2481") ? false : stryMutAct_9fa48("2480") ? true : (stryCov_9fa48("2480", "2481", "2482"), (stryMutAct_9fa48("2484") ? r.text && r.content : stryMutAct_9fa48("2483") ? false : (stryCov_9fa48("2483", "2484"), r.text || r.content)) || (stryMutAct_9fa48("2485") ? "Stryker was here!" : (stryCov_9fa48("2485"), ""))),
                score: stryMutAct_9fa48("2488") ? r.score && 0 : stryMutAct_9fa48("2487") ? false : stryMutAct_9fa48("2486") ? true : (stryCov_9fa48("2486", "2487", "2488"), r.score || 0)
              })));
            }
          }

          // Generate graph context
          const graphContext = await this.generateChunkGraphContext(result, query);

          // Generate multi-modal metadata for enhanced results
          const multiModalInfo = this.generateMultiModalInfo(multiModalMeta);
          enhanced.push(stryMutAct_9fa48("2489") ? {} : (stryCov_9fa48("2489"), {
            ...result,
            obsidianMeta: obsidianMeta ? stryMutAct_9fa48("2490") ? {} : (stryCov_9fa48("2490"), {
              tags: stryMutAct_9fa48("2493") ? obsidianMeta.tags && [] : stryMutAct_9fa48("2492") ? false : stryMutAct_9fa48("2491") ? true : (stryCov_9fa48("2491", "2492", "2493"), obsidianMeta.tags || (stryMutAct_9fa48("2494") ? ["Stryker was here"] : (stryCov_9fa48("2494"), []))),
              wikilinks: stryMutAct_9fa48("2497") ? obsidianMeta.wikilinks && [] : stryMutAct_9fa48("2496") ? false : stryMutAct_9fa48("2495") ? true : (stryCov_9fa48("2495", "2496", "2497"), obsidianMeta.wikilinks || (stryMutAct_9fa48("2498") ? ["Stryker was here"] : (stryCov_9fa48("2498"), []))),
              frontmatter: stryMutAct_9fa48("2501") ? obsidianMeta.frontmatter && {} : stryMutAct_9fa48("2500") ? false : stryMutAct_9fa48("2499") ? true : (stryCov_9fa48("2499", "2500", "2501"), obsidianMeta.frontmatter || {})
            }) : undefined,
            multiModalMeta: multiModalInfo,
            highlights,
            relatedChunks,
            graphContext
          }));
        }
      }
      return enhanced;
    }
  }
  private generateHighlights(text: string, query: string): string[] {
    if (stryMutAct_9fa48("2502")) {
      {}
    } else {
      stryCov_9fa48("2502");
      const queryTerms = stryMutAct_9fa48("2504") ? query.toUpperCase().split(/\s+/).filter(term => term.length > 2) : stryMutAct_9fa48("2503") ? query.toLowerCase().split(/\s+/) : (stryCov_9fa48("2503", "2504"), query.toLowerCase().split(stryMutAct_9fa48("2506") ? /\S+/ : stryMutAct_9fa48("2505") ? /\s/ : (stryCov_9fa48("2505", "2506"), /\s+/)).filter(stryMutAct_9fa48("2507") ? () => undefined : (stryCov_9fa48("2507"), term => stryMutAct_9fa48("2511") ? term.length <= 2 : stryMutAct_9fa48("2510") ? term.length >= 2 : stryMutAct_9fa48("2509") ? false : stryMutAct_9fa48("2508") ? true : (stryCov_9fa48("2508", "2509", "2510", "2511"), term.length > 2))));
      const highlights: string[] = stryMutAct_9fa48("2512") ? ["Stryker was here"] : (stryCov_9fa48("2512"), []);
      for (const term of queryTerms) {
        if (stryMutAct_9fa48("2513")) {
          {}
        } else {
          stryCov_9fa48("2513");
          const regex = new RegExp(stryMutAct_9fa48("2514") ? `` : (stryCov_9fa48("2514"), `(.{0,50}${term}.{0,50})`), stryMutAct_9fa48("2515") ? "" : (stryCov_9fa48("2515"), "gi"));
          const matches = text.match(regex);
          if (stryMutAct_9fa48("2517") ? false : stryMutAct_9fa48("2516") ? true : (stryCov_9fa48("2516", "2517"), matches)) {
            if (stryMutAct_9fa48("2518")) {
              {}
            } else {
              stryCov_9fa48("2518");
              highlights.push(...(stryMutAct_9fa48("2519") ? matches : (stryCov_9fa48("2519"), matches.slice(0, 2)))); // Limit to 2 highlights per term
            }
          }
        }
      }
      return stryMutAct_9fa48("2520") ? [...new Set(highlights)] : (stryCov_9fa48("2520"), (stryMutAct_9fa48("2521") ? [] : (stryCov_9fa48("2521"), [...new Set(highlights)])).slice(0, 5)); // Dedupe and limit total highlights
    }
  }
  private generateMultiModalInfo(multiModalMeta?: any) {
    if (stryMutAct_9fa48("2522")) {
      {}
    } else {
      stryCov_9fa48("2522");
      if (stryMutAct_9fa48("2525") ? false : stryMutAct_9fa48("2524") ? true : stryMutAct_9fa48("2523") ? multiModalMeta : (stryCov_9fa48("2523", "2524", "2525"), !multiModalMeta)) return undefined;

      // Generate human-readable content type labels and metadata
      const contentTypeLabels: Record<string, string> = stryMutAct_9fa48("2526") ? {} : (stryCov_9fa48("2526"), {
        [ContentType.PDF]: stryMutAct_9fa48("2527") ? "" : (stryCov_9fa48("2527"), "PDF Document"),
        [ContentType.OFFICE_DOC]: stryMutAct_9fa48("2528") ? "" : (stryCov_9fa48("2528"), "Word Document"),
        [ContentType.OFFICE_SHEET]: stryMutAct_9fa48("2529") ? "" : (stryCov_9fa48("2529"), "Excel Spreadsheet"),
        [ContentType.OFFICE_PRESENTATION]: stryMutAct_9fa48("2530") ? "" : (stryCov_9fa48("2530"), "PowerPoint Presentation"),
        [ContentType.AUDIO]: stryMutAct_9fa48("2531") ? "" : (stryCov_9fa48("2531"), "Audio File"),
        [ContentType.VIDEO]: stryMutAct_9fa48("2532") ? "" : (stryCov_9fa48("2532"), "Video File"),
        [ContentType.RASTER_IMAGE]: stryMutAct_9fa48("2533") ? "" : (stryCov_9fa48("2533"), "Image"),
        [ContentType.VECTOR_IMAGE]: stryMutAct_9fa48("2534") ? "" : (stryCov_9fa48("2534"), "Vector Image")
      });
      return stryMutAct_9fa48("2535") ? {} : (stryCov_9fa48("2535"), {
        fileId: multiModalMeta.fileId,
        contentType: multiModalMeta.contentType,
        contentTypeLabel: stryMutAct_9fa48("2538") ? contentTypeLabels[multiModalMeta.contentType] && multiModalMeta.contentType : stryMutAct_9fa48("2537") ? false : stryMutAct_9fa48("2536") ? true : (stryCov_9fa48("2536", "2537", "2538"), contentTypeLabels[multiModalMeta.contentType] || multiModalMeta.contentType),
        mimeType: multiModalMeta.mimeType,
        checksum: multiModalMeta.checksum,
        quality: multiModalMeta.quality,
        processing: multiModalMeta.processing,
        // Add specific metadata based on content type
        ...(stryMutAct_9fa48("2541") ? multiModalMeta.contentType === ContentType.AUDIO || {
          duration: multiModalMeta.duration,
          sampleRate: multiModalMeta.sampleRate,
          channels: multiModalMeta.channels,
          confidence: multiModalMeta.confidence,
          language: multiModalMeta.language
        } : stryMutAct_9fa48("2540") ? false : stryMutAct_9fa48("2539") ? true : (stryCov_9fa48("2539", "2540", "2541"), (stryMutAct_9fa48("2543") ? multiModalMeta.contentType !== ContentType.AUDIO : stryMutAct_9fa48("2542") ? true : (stryCov_9fa48("2542", "2543"), multiModalMeta.contentType === ContentType.AUDIO)) && (stryMutAct_9fa48("2544") ? {} : (stryCov_9fa48("2544"), {
          duration: multiModalMeta.duration,
          sampleRate: multiModalMeta.sampleRate,
          channels: multiModalMeta.channels,
          confidence: multiModalMeta.confidence,
          language: multiModalMeta.language
        })))),
        ...(stryMutAct_9fa48("2547") ? multiModalMeta.contentType === ContentType.PDF || {
          pageCount: multiModalMeta.pageCount,
          hasText: multiModalMeta.hasText,
          wordCount: multiModalMeta.wordCount
        } : stryMutAct_9fa48("2546") ? false : stryMutAct_9fa48("2545") ? true : (stryCov_9fa48("2545", "2546", "2547"), (stryMutAct_9fa48("2549") ? multiModalMeta.contentType !== ContentType.PDF : stryMutAct_9fa48("2548") ? true : (stryCov_9fa48("2548", "2549"), multiModalMeta.contentType === ContentType.PDF)) && (stryMutAct_9fa48("2550") ? {} : (stryCov_9fa48("2550"), {
          pageCount: multiModalMeta.pageCount,
          hasText: multiModalMeta.hasText,
          wordCount: multiModalMeta.wordCount
        })))),
        ...(stryMutAct_9fa48("2553") ? multiModalMeta.contentType?.startsWith("OFFICE_") || {
          wordCount: multiModalMeta.wordCount,
          hasText: multiModalMeta.hasText,
          language: multiModalMeta.language
        } : stryMutAct_9fa48("2552") ? false : stryMutAct_9fa48("2551") ? true : (stryCov_9fa48("2551", "2552", "2553"), (stryMutAct_9fa48("2555") ? multiModalMeta.contentType.startsWith("OFFICE_") : stryMutAct_9fa48("2554") ? multiModalMeta.contentType?.endsWith("OFFICE_") : (stryCov_9fa48("2554", "2555"), multiModalMeta.contentType?.startsWith(stryMutAct_9fa48("2556") ? "" : (stryCov_9fa48("2556"), "OFFICE_")))) && (stryMutAct_9fa48("2557") ? {} : (stryCov_9fa48("2557"), {
          wordCount: multiModalMeta.wordCount,
          hasText: multiModalMeta.hasText,
          language: multiModalMeta.language
        }))))
      });
    }
  }
  private applyMultiModalFilters(results: SearchResult[], filters: {
    multiModalTypes?: string[];
    minQuality?: number;
    languages?: string[];
    hasText?: boolean;
    fileSizeRange?: {
      min?: number;
      max?: number;
    };
  }): SearchResult[] {
    if (stryMutAct_9fa48("2558")) {
      {}
    } else {
      stryCov_9fa48("2558");
      return stryMutAct_9fa48("2559") ? results : (stryCov_9fa48("2559"), results.filter(result => {
        if (stryMutAct_9fa48("2560")) {
          {}
        } else {
          stryCov_9fa48("2560");
          const multiModalMeta = result.meta.multiModalFile;

          // If no multi-modal metadata and we have multi-modal filters, skip
          if (stryMutAct_9fa48("2563") ? !multiModalMeta || filters.multiModalTypes || filters.minQuality || filters.languages || filters.hasText !== undefined : stryMutAct_9fa48("2562") ? false : stryMutAct_9fa48("2561") ? true : (stryCov_9fa48("2561", "2562", "2563"), (stryMutAct_9fa48("2564") ? multiModalMeta : (stryCov_9fa48("2564"), !multiModalMeta)) && (stryMutAct_9fa48("2566") ? (filters.multiModalTypes || filters.minQuality || filters.languages) && filters.hasText !== undefined : stryMutAct_9fa48("2565") ? true : (stryCov_9fa48("2565", "2566"), (stryMutAct_9fa48("2568") ? (filters.multiModalTypes || filters.minQuality) && filters.languages : stryMutAct_9fa48("2567") ? false : (stryCov_9fa48("2567", "2568"), (stryMutAct_9fa48("2570") ? filters.multiModalTypes && filters.minQuality : stryMutAct_9fa48("2569") ? false : (stryCov_9fa48("2569", "2570"), filters.multiModalTypes || filters.minQuality)) || filters.languages)) || (stryMutAct_9fa48("2572") ? filters.hasText === undefined : stryMutAct_9fa48("2571") ? false : (stryCov_9fa48("2571", "2572"), filters.hasText !== undefined)))))) {
            if (stryMutAct_9fa48("2573")) {
              {}
            } else {
              stryCov_9fa48("2573");
              return stryMutAct_9fa48("2574") ? false : (stryCov_9fa48("2574"), true); // Keep Obsidian files if no multi-modal filters
            }
          }
          if (stryMutAct_9fa48("2577") ? false : stryMutAct_9fa48("2576") ? true : stryMutAct_9fa48("2575") ? multiModalMeta : (stryCov_9fa48("2575", "2576", "2577"), !multiModalMeta)) return stryMutAct_9fa48("2578") ? false : (stryCov_9fa48("2578"), true);

          // Filter by multi-modal content type
          if (stryMutAct_9fa48("2581") ? filters.multiModalTypes || filters.multiModalTypes.length > 0 : stryMutAct_9fa48("2580") ? false : stryMutAct_9fa48("2579") ? true : (stryCov_9fa48("2579", "2580", "2581"), filters.multiModalTypes && (stryMutAct_9fa48("2584") ? filters.multiModalTypes.length <= 0 : stryMutAct_9fa48("2583") ? filters.multiModalTypes.length >= 0 : stryMutAct_9fa48("2582") ? true : (stryCov_9fa48("2582", "2583", "2584"), filters.multiModalTypes.length > 0)))) {
            if (stryMutAct_9fa48("2585")) {
              {}
            } else {
              stryCov_9fa48("2585");
              const contentTypeLabel = this.getContentTypeLabel(multiModalMeta.contentType);
              if (stryMutAct_9fa48("2588") ? false : stryMutAct_9fa48("2587") ? true : stryMutAct_9fa48("2586") ? filters.multiModalTypes.some(type => type.toLowerCase() === multiModalMeta.contentType.toLowerCase() || type.toLowerCase() === contentTypeLabel.toLowerCase()) : (stryCov_9fa48("2586", "2587", "2588"), !(stryMutAct_9fa48("2589") ? filters.multiModalTypes.every(type => type.toLowerCase() === multiModalMeta.contentType.toLowerCase() || type.toLowerCase() === contentTypeLabel.toLowerCase()) : (stryCov_9fa48("2589"), filters.multiModalTypes.some(stryMutAct_9fa48("2590") ? () => undefined : (stryCov_9fa48("2590"), type => stryMutAct_9fa48("2593") ? type.toLowerCase() === multiModalMeta.contentType.toLowerCase() && type.toLowerCase() === contentTypeLabel.toLowerCase() : stryMutAct_9fa48("2592") ? false : stryMutAct_9fa48("2591") ? true : (stryCov_9fa48("2591", "2592", "2593"), (stryMutAct_9fa48("2595") ? type.toLowerCase() !== multiModalMeta.contentType.toLowerCase() : stryMutAct_9fa48("2594") ? false : (stryCov_9fa48("2594", "2595"), (stryMutAct_9fa48("2596") ? type.toUpperCase() : (stryCov_9fa48("2596"), type.toLowerCase())) === (stryMutAct_9fa48("2597") ? multiModalMeta.contentType.toUpperCase() : (stryCov_9fa48("2597"), multiModalMeta.contentType.toLowerCase())))) || (stryMutAct_9fa48("2599") ? type.toLowerCase() !== contentTypeLabel.toLowerCase() : stryMutAct_9fa48("2598") ? false : (stryCov_9fa48("2598", "2599"), (stryMutAct_9fa48("2600") ? type.toUpperCase() : (stryCov_9fa48("2600"), type.toLowerCase())) === (stryMutAct_9fa48("2601") ? contentTypeLabel.toUpperCase() : (stryCov_9fa48("2601"), contentTypeLabel.toLowerCase()))))))))))) {
                if (stryMutAct_9fa48("2602")) {
                  {}
                } else {
                  stryCov_9fa48("2602");
                  return stryMutAct_9fa48("2603") ? true : (stryCov_9fa48("2603"), false);
                }
              }
            }
          }

          // Filter by quality score
          if (stryMutAct_9fa48("2606") ? filters.minQuality !== undefined || multiModalMeta.quality : stryMutAct_9fa48("2605") ? false : stryMutAct_9fa48("2604") ? true : (stryCov_9fa48("2604", "2605", "2606"), (stryMutAct_9fa48("2608") ? filters.minQuality === undefined : stryMutAct_9fa48("2607") ? true : (stryCov_9fa48("2607", "2608"), filters.minQuality !== undefined)) && multiModalMeta.quality)) {
            if (stryMutAct_9fa48("2609")) {
              {}
            } else {
              stryCov_9fa48("2609");
              const qualityScore = this.extractQualityScore(multiModalMeta.quality);
              if (stryMutAct_9fa48("2613") ? qualityScore >= filters.minQuality : stryMutAct_9fa48("2612") ? qualityScore <= filters.minQuality : stryMutAct_9fa48("2611") ? false : stryMutAct_9fa48("2610") ? true : (stryCov_9fa48("2610", "2611", "2612", "2613"), qualityScore < filters.minQuality)) {
                if (stryMutAct_9fa48("2614")) {
                  {}
                } else {
                  stryCov_9fa48("2614");
                  return stryMutAct_9fa48("2615") ? true : (stryCov_9fa48("2615"), false);
                }
              }
            }
          }

          // Filter by language
          if (stryMutAct_9fa48("2618") ? filters.languages || filters.languages.length > 0 : stryMutAct_9fa48("2617") ? false : stryMutAct_9fa48("2616") ? true : (stryCov_9fa48("2616", "2617", "2618"), filters.languages && (stryMutAct_9fa48("2621") ? filters.languages.length <= 0 : stryMutAct_9fa48("2620") ? filters.languages.length >= 0 : stryMutAct_9fa48("2619") ? true : (stryCov_9fa48("2619", "2620", "2621"), filters.languages.length > 0)))) {
            if (stryMutAct_9fa48("2622")) {
              {}
            } else {
              stryCov_9fa48("2622");
              const contentLanguage = detectLanguage(result.text);
              if (stryMutAct_9fa48("2625") ? false : stryMutAct_9fa48("2624") ? true : stryMutAct_9fa48("2623") ? filters.languages.some(lang => lang.toLowerCase() === contentLanguage.toLowerCase()) : (stryCov_9fa48("2623", "2624", "2625"), !(stryMutAct_9fa48("2626") ? filters.languages.every(lang => lang.toLowerCase() === contentLanguage.toLowerCase()) : (stryCov_9fa48("2626"), filters.languages.some(stryMutAct_9fa48("2627") ? () => undefined : (stryCov_9fa48("2627"), lang => stryMutAct_9fa48("2630") ? lang.toLowerCase() !== contentLanguage.toLowerCase() : stryMutAct_9fa48("2629") ? false : stryMutAct_9fa48("2628") ? true : (stryCov_9fa48("2628", "2629", "2630"), (stryMutAct_9fa48("2631") ? lang.toUpperCase() : (stryCov_9fa48("2631"), lang.toLowerCase())) === (stryMutAct_9fa48("2632") ? contentLanguage.toUpperCase() : (stryCov_9fa48("2632"), contentLanguage.toLowerCase()))))))))) {
                if (stryMutAct_9fa48("2633")) {
                  {}
                } else {
                  stryCov_9fa48("2633");
                  return stryMutAct_9fa48("2634") ? true : (stryCov_9fa48("2634"), false);
                }
              }
            }
          }

          // Filter by text extraction availability
          if (stryMutAct_9fa48("2637") ? filters.hasText === undefined : stryMutAct_9fa48("2636") ? false : stryMutAct_9fa48("2635") ? true : (stryCov_9fa48("2635", "2636", "2637"), filters.hasText !== undefined)) {
            if (stryMutAct_9fa48("2638")) {
              {}
            } else {
              stryCov_9fa48("2638");
              const hasExtractedText = stryMutAct_9fa48("2641") ? result.text && result.text.length > 10 && !result.text.includes("No speech detected") || !result.text.includes("Error:") : stryMutAct_9fa48("2640") ? false : stryMutAct_9fa48("2639") ? true : (stryCov_9fa48("2639", "2640", "2641"), (stryMutAct_9fa48("2643") ? result.text && result.text.length > 10 || !result.text.includes("No speech detected") : stryMutAct_9fa48("2642") ? true : (stryCov_9fa48("2642", "2643"), (stryMutAct_9fa48("2645") ? result.text || result.text.length > 10 : stryMutAct_9fa48("2644") ? true : (stryCov_9fa48("2644", "2645"), result.text && (stryMutAct_9fa48("2648") ? result.text.length <= 10 : stryMutAct_9fa48("2647") ? result.text.length >= 10 : stryMutAct_9fa48("2646") ? true : (stryCov_9fa48("2646", "2647", "2648"), result.text.length > 10)))) && (stryMutAct_9fa48("2649") ? result.text.includes("No speech detected") : (stryCov_9fa48("2649"), !result.text.includes(stryMutAct_9fa48("2650") ? "" : (stryCov_9fa48("2650"), "No speech detected")))))) && (stryMutAct_9fa48("2651") ? result.text.includes("Error:") : (stryCov_9fa48("2651"), !result.text.includes(stryMutAct_9fa48("2652") ? "" : (stryCov_9fa48("2652"), "Error:")))));
              if (stryMutAct_9fa48("2655") ? filters.hasText || !hasExtractedText : stryMutAct_9fa48("2654") ? false : stryMutAct_9fa48("2653") ? true : (stryCov_9fa48("2653", "2654", "2655"), filters.hasText && (stryMutAct_9fa48("2656") ? hasExtractedText : (stryCov_9fa48("2656"), !hasExtractedText)))) {
                if (stryMutAct_9fa48("2657")) {
                  {}
                } else {
                  stryCov_9fa48("2657");
                  return stryMutAct_9fa48("2658") ? true : (stryCov_9fa48("2658"), false);
                }
              }
              if (stryMutAct_9fa48("2661") ? !filters.hasText || hasExtractedText : stryMutAct_9fa48("2660") ? false : stryMutAct_9fa48("2659") ? true : (stryCov_9fa48("2659", "2660", "2661"), (stryMutAct_9fa48("2662") ? filters.hasText : (stryCov_9fa48("2662"), !filters.hasText)) && hasExtractedText)) {
                if (stryMutAct_9fa48("2663")) {
                  {}
                } else {
                  stryCov_9fa48("2663");
                  return stryMutAct_9fa48("2664") ? true : (stryCov_9fa48("2664"), false);
                }
              }
            }
          }

          // Filter by file size
          if (stryMutAct_9fa48("2666") ? false : stryMutAct_9fa48("2665") ? true : (stryCov_9fa48("2665", "2666"), filters.fileSizeRange)) {
            // Note: File size information might not be available in metadata
            // This would need to be added to the ingestion process
            // For now, skip this filter
          }
          return stryMutAct_9fa48("2667") ? false : (stryCov_9fa48("2667"), true);
        }
      }));
    }
  }
  private getContentTypeLabel(contentType: string): string {
    if (stryMutAct_9fa48("2668")) {
      {}
    } else {
      stryCov_9fa48("2668");
      const labels: Record<string, string> = stryMutAct_9fa48("2669") ? {} : (stryCov_9fa48("2669"), {
        [ContentType.PDF]: stryMutAct_9fa48("2670") ? "" : (stryCov_9fa48("2670"), "PDF Document"),
        [ContentType.OFFICE_DOC]: stryMutAct_9fa48("2671") ? "" : (stryCov_9fa48("2671"), "Word Document"),
        [ContentType.OFFICE_SHEET]: stryMutAct_9fa48("2672") ? "" : (stryCov_9fa48("2672"), "Excel Spreadsheet"),
        [ContentType.OFFICE_PRESENTATION]: stryMutAct_9fa48("2673") ? "" : (stryCov_9fa48("2673"), "PowerPoint Presentation"),
        [ContentType.AUDIO]: stryMutAct_9fa48("2674") ? "" : (stryCov_9fa48("2674"), "Audio File"),
        [ContentType.VIDEO]: stryMutAct_9fa48("2675") ? "" : (stryCov_9fa48("2675"), "Video File"),
        [ContentType.RASTER_IMAGE]: stryMutAct_9fa48("2676") ? "" : (stryCov_9fa48("2676"), "Image"),
        [ContentType.VECTOR_IMAGE]: stryMutAct_9fa48("2677") ? "" : (stryCov_9fa48("2677"), "Vector Image")
      });
      return stryMutAct_9fa48("2680") ? labels[contentType] && contentType : stryMutAct_9fa48("2679") ? false : stryMutAct_9fa48("2678") ? true : (stryCov_9fa48("2678", "2679", "2680"), labels[contentType] || contentType);
    }
  }
  private extractQualityScore(quality: any): number {
    if (stryMutAct_9fa48("2681")) {
      {}
    } else {
      stryCov_9fa48("2681");
      if (stryMutAct_9fa48("2684") ? typeof quality !== "number" : stryMutAct_9fa48("2683") ? false : stryMutAct_9fa48("2682") ? true : (stryCov_9fa48("2682", "2683", "2684"), typeof quality === (stryMutAct_9fa48("2685") ? "" : (stryCov_9fa48("2685"), "number")))) return quality;
      if (stryMutAct_9fa48("2688") ? quality || typeof quality.score === "number" : stryMutAct_9fa48("2687") ? false : stryMutAct_9fa48("2686") ? true : (stryCov_9fa48("2686", "2687", "2688"), quality && (stryMutAct_9fa48("2690") ? typeof quality.score !== "number" : stryMutAct_9fa48("2689") ? true : (stryCov_9fa48("2689", "2690"), typeof quality.score === (stryMutAct_9fa48("2691") ? "" : (stryCov_9fa48("2691"), "number")))))) return quality.score;
      if (stryMutAct_9fa48("2694") ? quality || typeof quality.confidence === "number" : stryMutAct_9fa48("2693") ? false : stryMutAct_9fa48("2692") ? true : (stryCov_9fa48("2692", "2693", "2694"), quality && (stryMutAct_9fa48("2696") ? typeof quality.confidence !== "number" : stryMutAct_9fa48("2695") ? true : (stryCov_9fa48("2695", "2696"), typeof quality.confidence === (stryMutAct_9fa48("2697") ? "" : (stryCov_9fa48("2697"), "number")))))) return quality.confidence;
      return 0.5; // Default neutral score
    }
  }
  private async findRelatedChunks(wikilinks: string[], maxRelated: number): Promise<SearchResult[]> {
    if (stryMutAct_9fa48("2698")) {
      {}
    } else {
      stryCov_9fa48("2698");
      if (stryMutAct_9fa48("2701") ? !wikilinks && wikilinks.length === 0 : stryMutAct_9fa48("2700") ? false : stryMutAct_9fa48("2699") ? true : (stryCov_9fa48("2699", "2700", "2701"), (stryMutAct_9fa48("2702") ? wikilinks : (stryCov_9fa48("2702"), !wikilinks)) || (stryMutAct_9fa48("2704") ? wikilinks.length !== 0 : stryMutAct_9fa48("2703") ? false : (stryCov_9fa48("2703", "2704"), wikilinks.length === 0)))) return stryMutAct_9fa48("2705") ? ["Stryker was here"] : (stryCov_9fa48("2705"), []);
      try {
        if (stryMutAct_9fa48("2706")) {
          {}
        } else {
          stryCov_9fa48("2706");
          // Search for chunks from files mentioned in wikilinks
          const relatedQuery = stryMutAct_9fa48("2707") ? wikilinks.join(" ") : (stryCov_9fa48("2707"), wikilinks.slice(0, 3).join(stryMutAct_9fa48("2708") ? "" : (stryCov_9fa48("2708"), " "))); // Use first 3 wikilinks
          const embedding = await this.embeddings.embed(relatedQuery);
          const results = await this.db.search(embedding, stryMutAct_9fa48("2709") ? maxRelated / 2 : (stryCov_9fa48("2709"), maxRelated * 2));

          // Filter to only include chunks from wikilinked files
          return stryMutAct_9fa48("2711") ? results.slice(0, maxRelated) : stryMutAct_9fa48("2710") ? results.filter(result => {
            const fileName = result.meta.obsidianFile?.fileName;
            return fileName && wikilinks.some(link => link.toLowerCase().includes(fileName.toLowerCase()) || fileName.toLowerCase().includes(link.toLowerCase()));
          }) : (stryCov_9fa48("2710", "2711"), results.filter(result => {
            if (stryMutAct_9fa48("2712")) {
              {}
            } else {
              stryCov_9fa48("2712");
              const fileName = stryMutAct_9fa48("2713") ? result.meta.obsidianFile.fileName : (stryCov_9fa48("2713"), result.meta.obsidianFile?.fileName);
              return stryMutAct_9fa48("2716") ? fileName || wikilinks.some(link => link.toLowerCase().includes(fileName.toLowerCase()) || fileName.toLowerCase().includes(link.toLowerCase())) : stryMutAct_9fa48("2715") ? false : stryMutAct_9fa48("2714") ? true : (stryCov_9fa48("2714", "2715", "2716"), fileName && (stryMutAct_9fa48("2717") ? wikilinks.every(link => link.toLowerCase().includes(fileName.toLowerCase()) || fileName.toLowerCase().includes(link.toLowerCase())) : (stryCov_9fa48("2717"), wikilinks.some(stryMutAct_9fa48("2718") ? () => undefined : (stryCov_9fa48("2718"), link => stryMutAct_9fa48("2721") ? link.toLowerCase().includes(fileName.toLowerCase()) && fileName.toLowerCase().includes(link.toLowerCase()) : stryMutAct_9fa48("2720") ? false : stryMutAct_9fa48("2719") ? true : (stryCov_9fa48("2719", "2720", "2721"), (stryMutAct_9fa48("2722") ? link.toUpperCase().includes(fileName.toLowerCase()) : (stryCov_9fa48("2722"), link.toLowerCase().includes(stryMutAct_9fa48("2723") ? fileName.toUpperCase() : (stryCov_9fa48("2723"), fileName.toLowerCase())))) || (stryMutAct_9fa48("2724") ? fileName.toUpperCase().includes(link.toLowerCase()) : (stryCov_9fa48("2724"), fileName.toLowerCase().includes(stryMutAct_9fa48("2725") ? link.toUpperCase() : (stryCov_9fa48("2725"), link.toLowerCase()))))))))));
            }
          }).slice(0, maxRelated));
        }
      } catch (error) {
        if (stryMutAct_9fa48("2726")) {
          {}
        } else {
          stryCov_9fa48("2726");
          console.warn(stryMutAct_9fa48("2727") ? "" : (stryCov_9fa48("2727"), "Failed to find related chunks:"), error);
          return stryMutAct_9fa48("2728") ? ["Stryker was here"] : (stryCov_9fa48("2728"), []);
        }
      }
    }
  }
  private async generateChunkGraphContext(result: SearchResult, query: string): Promise<{
    connectedConcepts: string[];
    pathsToQuery: number;
    centralityScore: number;
  }> {
    if (stryMutAct_9fa48("2729")) {
      {}
    } else {
      stryCov_9fa48("2729");
      // Extract concepts from tags and content
      const tags = stryMutAct_9fa48("2732") ? result.meta.obsidianFile?.tags && [] : stryMutAct_9fa48("2731") ? false : stryMutAct_9fa48("2730") ? true : (stryCov_9fa48("2730", "2731", "2732"), (stryMutAct_9fa48("2733") ? result.meta.obsidianFile.tags : (stryCov_9fa48("2733"), result.meta.obsidianFile?.tags)) || (stryMutAct_9fa48("2734") ? ["Stryker was here"] : (stryCov_9fa48("2734"), [])));
      const wikilinks = stryMutAct_9fa48("2737") ? result.meta.obsidianFile?.wikilinks && [] : stryMutAct_9fa48("2736") ? false : stryMutAct_9fa48("2735") ? true : (stryCov_9fa48("2735", "2736", "2737"), (stryMutAct_9fa48("2738") ? result.meta.obsidianFile.wikilinks : (stryCov_9fa48("2738"), result.meta.obsidianFile?.wikilinks)) || (stryMutAct_9fa48("2739") ? ["Stryker was here"] : (stryCov_9fa48("2739"), [])));

      // Simple concept extraction from query
      const queryTerms = stryMutAct_9fa48("2741") ? query.toUpperCase().split(/\s+/).filter(term => term.length > 3) : stryMutAct_9fa48("2740") ? query.toLowerCase().split(/\s+/) : (stryCov_9fa48("2740", "2741"), query.toLowerCase().split(stryMutAct_9fa48("2743") ? /\S+/ : stryMutAct_9fa48("2742") ? /\s/ : (stryCov_9fa48("2742", "2743"), /\s+/)).filter(stryMutAct_9fa48("2744") ? () => undefined : (stryCov_9fa48("2744"), term => stryMutAct_9fa48("2748") ? term.length <= 3 : stryMutAct_9fa48("2747") ? term.length >= 3 : stryMutAct_9fa48("2746") ? false : stryMutAct_9fa48("2745") ? true : (stryCov_9fa48("2745", "2746", "2747", "2748"), term.length > 3))));

      // Find connected concepts (tags that relate to query terms)
      const connectedConcepts = stryMutAct_9fa48("2749") ? tags : (stryCov_9fa48("2749"), tags.filter(stryMutAct_9fa48("2750") ? () => undefined : (stryCov_9fa48("2750"), tag => stryMutAct_9fa48("2751") ? queryTerms.every(term => tag.toLowerCase().includes(term) || term.includes(tag.toLowerCase())) : (stryCov_9fa48("2751"), queryTerms.some(stryMutAct_9fa48("2752") ? () => undefined : (stryCov_9fa48("2752"), term => stryMutAct_9fa48("2755") ? tag.toLowerCase().includes(term) && term.includes(tag.toLowerCase()) : stryMutAct_9fa48("2754") ? false : stryMutAct_9fa48("2753") ? true : (stryCov_9fa48("2753", "2754", "2755"), (stryMutAct_9fa48("2756") ? tag.toUpperCase().includes(term) : (stryCov_9fa48("2756"), tag.toLowerCase().includes(term))) || term.includes(stryMutAct_9fa48("2757") ? tag.toUpperCase() : (stryCov_9fa48("2757"), tag.toLowerCase())))))))));

      // Calculate centrality based on number of wikilinks and tags
      const centralityScore = stryMutAct_9fa48("2758") ? Math.max(1.0, wikilinks.length * 0.1 + tags.length * 0.05) : (stryCov_9fa48("2758"), Math.min(1.0, stryMutAct_9fa48("2759") ? wikilinks.length * 0.1 - tags.length * 0.05 : (stryCov_9fa48("2759"), (stryMutAct_9fa48("2760") ? wikilinks.length / 0.1 : (stryCov_9fa48("2760"), wikilinks.length * 0.1)) + (stryMutAct_9fa48("2761") ? tags.length / 0.05 : (stryCov_9fa48("2761"), tags.length * 0.05)))));
      return stryMutAct_9fa48("2762") ? {} : (stryCov_9fa48("2762"), {
        connectedConcepts: stryMutAct_9fa48("2763") ? connectedConcepts : (stryCov_9fa48("2763"), connectedConcepts.slice(0, 5)),
        pathsToQuery: connectedConcepts.length,
        centralityScore
      });
    }
  }
  private async generateFacets(results: ObsidianSearchResult[]): Promise<{
    fileTypes: Array<{
      type: string;
      count: number;
    }>;
    tags: Array<{
      tag: string;
      count: number;
    }>;
    dateDistribution: Array<{
      period: string;
      count: number;
    }>;
    contentTypes: Array<{
      type: string;
      count: number;
    }>;
    multiModalTypes: Array<{
      type: string;
      count: number;
    }>;
  }> {
    if (stryMutAct_9fa48("2764")) {
      {}
    } else {
      stryCov_9fa48("2764");
      const fileTypeCounts = new Map<string, number>();
      const tagCounts = new Map<string, number>();
      const folderCounts = new Map<string, number>();
      const dateCounts = new Map<string, number>();
      const contentTypeCounts = new Map<string, number>();
      const multiModalTypeCounts = new Map<string, number>();
      for (const result of results) {
        if (stryMutAct_9fa48("2765")) {
          {}
        } else {
          stryCov_9fa48("2765");
          // File type facets (legacy)
          const contentType = stryMutAct_9fa48("2768") ? result.meta?.contentType && "unknown" : stryMutAct_9fa48("2767") ? false : stryMutAct_9fa48("2766") ? true : (stryCov_9fa48("2766", "2767", "2768"), (stryMutAct_9fa48("2769") ? result.meta.contentType : (stryCov_9fa48("2769"), result.meta?.contentType)) || (stryMutAct_9fa48("2770") ? "" : (stryCov_9fa48("2770"), "unknown")));
          fileTypeCounts.set(contentType, stryMutAct_9fa48("2771") ? (fileTypeCounts.get(contentType) || 0) - 1 : (stryCov_9fa48("2771"), (stryMutAct_9fa48("2774") ? fileTypeCounts.get(contentType) && 0 : stryMutAct_9fa48("2773") ? false : stryMutAct_9fa48("2772") ? true : (stryCov_9fa48("2772", "2773", "2774"), fileTypeCounts.get(contentType) || 0)) + 1));

          // Enhanced content type facets (including multi-modal)
          if (stryMutAct_9fa48("2776") ? false : stryMutAct_9fa48("2775") ? true : (stryCov_9fa48("2775", "2776"), result.multiModalMeta)) {
            if (stryMutAct_9fa48("2777")) {
              {}
            } else {
              stryCov_9fa48("2777");
              const multiModalType = stryMutAct_9fa48("2780") ? result.multiModalMeta.contentType && "unknown" : stryMutAct_9fa48("2779") ? false : stryMutAct_9fa48("2778") ? true : (stryCov_9fa48("2778", "2779", "2780"), result.multiModalMeta.contentType || (stryMutAct_9fa48("2781") ? "" : (stryCov_9fa48("2781"), "unknown")));
              multiModalTypeCounts.set(multiModalType, stryMutAct_9fa48("2782") ? (multiModalTypeCounts.get(multiModalType) || 0) - 1 : (stryCov_9fa48("2782"), (stryMutAct_9fa48("2785") ? multiModalTypeCounts.get(multiModalType) && 0 : stryMutAct_9fa48("2784") ? false : stryMutAct_9fa48("2783") ? true : (stryCov_9fa48("2783", "2784", "2785"), multiModalTypeCounts.get(multiModalType) || 0)) + 1));
              contentTypeCounts.set(stryMutAct_9fa48("2786") ? "" : (stryCov_9fa48("2786"), "Multi-modal"), stryMutAct_9fa48("2787") ? (contentTypeCounts.get("Multi-modal") || 0) - 1 : (stryCov_9fa48("2787"), (stryMutAct_9fa48("2790") ? contentTypeCounts.get("Multi-modal") && 0 : stryMutAct_9fa48("2789") ? false : stryMutAct_9fa48("2788") ? true : (stryCov_9fa48("2788", "2789", "2790"), contentTypeCounts.get(stryMutAct_9fa48("2791") ? "" : (stryCov_9fa48("2791"), "Multi-modal")) || 0)) + 1));
            }
          } else {
            if (stryMutAct_9fa48("2792")) {
              {}
            } else {
              stryCov_9fa48("2792");
              contentTypeCounts.set(stryMutAct_9fa48("2793") ? "" : (stryCov_9fa48("2793"), "Obsidian"), stryMutAct_9fa48("2794") ? (contentTypeCounts.get("Obsidian") || 0) - 1 : (stryCov_9fa48("2794"), (stryMutAct_9fa48("2797") ? contentTypeCounts.get("Obsidian") && 0 : stryMutAct_9fa48("2796") ? false : stryMutAct_9fa48("2795") ? true : (stryCov_9fa48("2795", "2796", "2797"), contentTypeCounts.get(stryMutAct_9fa48("2798") ? "" : (stryCov_9fa48("2798"), "Obsidian")) || 0)) + 1));
            }
          }

          // Tag facets (only for Obsidian files)
          if (stryMutAct_9fa48("2801") ? result.obsidianMeta.tags : stryMutAct_9fa48("2800") ? false : stryMutAct_9fa48("2799") ? true : (stryCov_9fa48("2799", "2800", "2801"), result.obsidianMeta?.tags)) {
            if (stryMutAct_9fa48("2802")) {
              {}
            } else {
              stryCov_9fa48("2802");
              for (const tag of result.obsidianMeta.tags) {
                if (stryMutAct_9fa48("2803")) {
                  {}
                } else {
                  stryCov_9fa48("2803");
                  tagCounts.set(tag, stryMutAct_9fa48("2804") ? (tagCounts.get(tag) || 0) - 1 : (stryCov_9fa48("2804"), (stryMutAct_9fa48("2807") ? tagCounts.get(tag) && 0 : stryMutAct_9fa48("2806") ? false : stryMutAct_9fa48("2805") ? true : (stryCov_9fa48("2805", "2806", "2807"), tagCounts.get(tag) || 0)) + 1));
                }
              }
            }
          }

          // Date distribution facets
          const date = stryMutAct_9fa48("2810") ? result.meta?.updatedAt && result.meta?.createdAt : stryMutAct_9fa48("2809") ? false : stryMutAct_9fa48("2808") ? true : (stryCov_9fa48("2808", "2809", "2810"), (stryMutAct_9fa48("2811") ? result.meta.updatedAt : (stryCov_9fa48("2811"), result.meta?.updatedAt)) || (stryMutAct_9fa48("2812") ? result.meta.createdAt : (stryCov_9fa48("2812"), result.meta?.createdAt)));
          if (stryMutAct_9fa48("2814") ? false : stryMutAct_9fa48("2813") ? true : (stryCov_9fa48("2813", "2814"), date)) {
            if (stryMutAct_9fa48("2815")) {
              {}
            } else {
              stryCov_9fa48("2815");
              const period = new Date(date).getFullYear().toString();
              dateCounts.set(period, stryMutAct_9fa48("2816") ? (dateCounts.get(period) || 0) - 1 : (stryCov_9fa48("2816"), (stryMutAct_9fa48("2819") ? dateCounts.get(period) && 0 : stryMutAct_9fa48("2818") ? false : stryMutAct_9fa48("2817") ? true : (stryCov_9fa48("2817", "2818", "2819"), dateCounts.get(period) || 0)) + 1));
            }
          }
        }
      }
      return stryMutAct_9fa48("2820") ? {} : (stryCov_9fa48("2820"), {
        fileTypes: stryMutAct_9fa48("2822") ? Array.from(fileTypeCounts.entries()).map(([type, count]) => ({
          type,
          count
        })).slice(0, 10) : stryMutAct_9fa48("2821") ? Array.from(fileTypeCounts.entries()).map(([type, count]) => ({
          type,
          count
        })).sort((a, b) => b.count - a.count) : (stryCov_9fa48("2821", "2822"), Array.from(fileTypeCounts.entries()).map(stryMutAct_9fa48("2823") ? () => undefined : (stryCov_9fa48("2823"), ([type, count]) => stryMutAct_9fa48("2824") ? {} : (stryCov_9fa48("2824"), {
          type,
          count
        }))).sort(stryMutAct_9fa48("2825") ? () => undefined : (stryCov_9fa48("2825"), (a, b) => stryMutAct_9fa48("2826") ? b.count + a.count : (stryCov_9fa48("2826"), b.count - a.count))).slice(0, 10)),
        tags: stryMutAct_9fa48("2828") ? Array.from(tagCounts.entries()).map(([tag, count]) => ({
          tag,
          count
        })).slice(0, 15) : stryMutAct_9fa48("2827") ? Array.from(tagCounts.entries()).map(([tag, count]) => ({
          tag,
          count
        })).sort((a, b) => b.count - a.count) : (stryCov_9fa48("2827", "2828"), Array.from(tagCounts.entries()).map(stryMutAct_9fa48("2829") ? () => undefined : (stryCov_9fa48("2829"), ([tag, count]) => stryMutAct_9fa48("2830") ? {} : (stryCov_9fa48("2830"), {
          tag,
          count
        }))).sort(stryMutAct_9fa48("2831") ? () => undefined : (stryCov_9fa48("2831"), (a, b) => stryMutAct_9fa48("2832") ? b.count + a.count : (stryCov_9fa48("2832"), b.count - a.count))).slice(0, 15)),
        dateDistribution: stryMutAct_9fa48("2834") ? Array.from(dateCounts.entries()).map(([period, count]) => ({
          period,
          count
        })).slice(0, 5) : stryMutAct_9fa48("2833") ? Array.from(dateCounts.entries()).map(([period, count]) => ({
          period,
          count
        })).sort((a, b) => b.period.localeCompare(a.period)) : (stryCov_9fa48("2833", "2834"), Array.from(dateCounts.entries()).map(stryMutAct_9fa48("2835") ? () => undefined : (stryCov_9fa48("2835"), ([period, count]) => stryMutAct_9fa48("2836") ? {} : (stryCov_9fa48("2836"), {
          period,
          count
        }))).sort(stryMutAct_9fa48("2837") ? () => undefined : (stryCov_9fa48("2837"), (a, b) => b.period.localeCompare(a.period))).slice(0, 5)),
        contentTypes: stryMutAct_9fa48("2838") ? Array.from(contentTypeCounts.entries()).map(([type, count]) => ({
          type,
          count
        })) : (stryCov_9fa48("2838"), Array.from(contentTypeCounts.entries()).map(stryMutAct_9fa48("2839") ? () => undefined : (stryCov_9fa48("2839"), ([type, count]) => stryMutAct_9fa48("2840") ? {} : (stryCov_9fa48("2840"), {
          type,
          count
        }))).sort(stryMutAct_9fa48("2841") ? () => undefined : (stryCov_9fa48("2841"), (a, b) => stryMutAct_9fa48("2842") ? b.count + a.count : (stryCov_9fa48("2842"), b.count - a.count)))),
        multiModalTypes: stryMutAct_9fa48("2844") ? Array.from(multiModalTypeCounts.entries()).map(([type, count]) => ({
          type,
          count
        })).slice(0, 10) : stryMutAct_9fa48("2843") ? Array.from(multiModalTypeCounts.entries()).map(([type, count]) => ({
          type,
          count
        })).sort((a, b) => b.count - a.count) : (stryCov_9fa48("2843", "2844"), Array.from(multiModalTypeCounts.entries()).map(stryMutAct_9fa48("2845") ? () => undefined : (stryCov_9fa48("2845"), ([type, count]) => stryMutAct_9fa48("2846") ? {} : (stryCov_9fa48("2846"), {
          type,
          count
        }))).sort(stryMutAct_9fa48("2847") ? () => undefined : (stryCov_9fa48("2847"), (a, b) => stryMutAct_9fa48("2848") ? b.count + a.count : (stryCov_9fa48("2848"), b.count - a.count))).slice(0, 10))
      });
    }
  }
  private async generateGraphInsights(query: string, results: ObsidianSearchResult[]): Promise<{
    queryConcepts: string[];
    relatedConcepts: string[];
    knowledgeClusters: Array<{
      name: string;
      files: string[];
      centrality: number;
    }>;
  }> {
    if (stryMutAct_9fa48("2849")) {
      {}
    } else {
      stryCov_9fa48("2849");
      // Extract concepts from query and results
      const queryConcepts = this.extractConcepts(query);
      const allTags = results.flatMap(stryMutAct_9fa48("2850") ? () => undefined : (stryCov_9fa48("2850"), r => stryMutAct_9fa48("2853") ? r.obsidianMeta?.tags && [] : stryMutAct_9fa48("2852") ? false : stryMutAct_9fa48("2851") ? true : (stryCov_9fa48("2851", "2852", "2853"), (stryMutAct_9fa48("2854") ? r.obsidianMeta.tags : (stryCov_9fa48("2854"), r.obsidianMeta?.tags)) || (stryMutAct_9fa48("2855") ? ["Stryker was here"] : (stryCov_9fa48("2855"), [])))));
      const relatedConcepts = stryMutAct_9fa48("2857") ? [...new Set(allTags)].slice(0, 10) : stryMutAct_9fa48("2856") ? [...new Set(allTags)].filter(tag => !queryConcepts.includes(tag)) : (stryCov_9fa48("2856", "2857"), (stryMutAct_9fa48("2858") ? [] : (stryCov_9fa48("2858"), [...new Set(allTags)])).filter(stryMutAct_9fa48("2859") ? () => undefined : (stryCov_9fa48("2859"), tag => stryMutAct_9fa48("2860") ? queryConcepts.includes(tag) : (stryCov_9fa48("2860"), !queryConcepts.includes(tag)))).slice(0, 10));

      // Group results by common tags to find knowledge clusters
      const tagGroups = new Map<string, string[]>();
      for (const result of results) {
        if (stryMutAct_9fa48("2861")) {
          {}
        } else {
          stryCov_9fa48("2861");
          if (stryMutAct_9fa48("2864") ? result.obsidianMeta.tags : stryMutAct_9fa48("2863") ? false : stryMutAct_9fa48("2862") ? true : (stryCov_9fa48("2862", "2863", "2864"), result.obsidianMeta?.tags)) {
            if (stryMutAct_9fa48("2865")) {
              {}
            } else {
              stryCov_9fa48("2865");
              for (const tag of result.obsidianMeta.tags) {
                if (stryMutAct_9fa48("2866")) {
                  {}
                } else {
                  stryCov_9fa48("2866");
                  if (stryMutAct_9fa48("2869") ? false : stryMutAct_9fa48("2868") ? true : stryMutAct_9fa48("2867") ? tagGroups.has(tag) : (stryCov_9fa48("2867", "2868", "2869"), !tagGroups.has(tag))) {
                    if (stryMutAct_9fa48("2870")) {
                      {}
                    } else {
                      stryCov_9fa48("2870");
                      tagGroups.set(tag, stryMutAct_9fa48("2871") ? ["Stryker was here"] : (stryCov_9fa48("2871"), []));
                    }
                  }
                  tagGroups.get(tag)!.push(result.id);
                }
              }
            }
          }
        }
      }
      const knowledgeClusters = stryMutAct_9fa48("2874") ? Array.from(tagGroups.entries())
      // Only clusters with 2+ files
      .map(([tag, files]) => ({
        name: tag,
        files: [...new Set(files)],
        // Dedupe files
        centrality: files.length / results.length // Simple centrality measure
      })).sort((a, b) => b.centrality - a.centrality).slice(0, 5) : stryMutAct_9fa48("2873") ? Array.from(tagGroups.entries()).filter(([_, files]) => files.length >= 2) // Only clusters with 2+ files
      .map(([tag, files]) => ({
        name: tag,
        files: [...new Set(files)],
        // Dedupe files
        centrality: files.length / results.length // Simple centrality measure
      })).slice(0, 5) : stryMutAct_9fa48("2872") ? Array.from(tagGroups.entries()).filter(([_, files]) => files.length >= 2) // Only clusters with 2+ files
      .map(([tag, files]) => ({
        name: tag,
        files: [...new Set(files)],
        // Dedupe files
        centrality: files.length / results.length // Simple centrality measure
      })).sort((a, b) => b.centrality - a.centrality) : (stryCov_9fa48("2872", "2873", "2874"), Array.from(tagGroups.entries()).filter(stryMutAct_9fa48("2875") ? () => undefined : (stryCov_9fa48("2875"), ([_, files]) => stryMutAct_9fa48("2879") ? files.length < 2 : stryMutAct_9fa48("2878") ? files.length > 2 : stryMutAct_9fa48("2877") ? false : stryMutAct_9fa48("2876") ? true : (stryCov_9fa48("2876", "2877", "2878", "2879"), files.length >= 2))) // Only clusters with 2+ files
      .map(stryMutAct_9fa48("2880") ? () => undefined : (stryCov_9fa48("2880"), ([tag, files]) => stryMutAct_9fa48("2881") ? {} : (stryCov_9fa48("2881"), {
        name: tag,
        files: stryMutAct_9fa48("2882") ? [] : (stryCov_9fa48("2882"), [...new Set(files)]),
        // Dedupe files
        centrality: stryMutAct_9fa48("2883") ? files.length * results.length : (stryCov_9fa48("2883"), files.length / results.length) // Simple centrality measure
      }))).sort(stryMutAct_9fa48("2884") ? () => undefined : (stryCov_9fa48("2884"), (a, b) => stryMutAct_9fa48("2885") ? b.centrality + a.centrality : (stryCov_9fa48("2885"), b.centrality - a.centrality))).slice(0, 5));
      return stryMutAct_9fa48("2886") ? {} : (stryCov_9fa48("2886"), {
        queryConcepts,
        relatedConcepts,
        knowledgeClusters
      });
    }
  }
  private extractConcepts(text: string): string[] {
    if (stryMutAct_9fa48("2887")) {
      {}
    } else {
      stryCov_9fa48("2887");
      // Simple concept extraction - could be enhanced with NLP
      const words = stryMutAct_9fa48("2888") ? text.toUpperCase().split(/\s+/) : (stryCov_9fa48("2888"), text.toLowerCase().split(stryMutAct_9fa48("2890") ? /\S+/ : stryMutAct_9fa48("2889") ? /\s/ : (stryCov_9fa48("2889", "2890"), /\s+/)));
      const concepts = stryMutAct_9fa48("2891") ? words : (stryCov_9fa48("2891"), words.filter(stryMutAct_9fa48("2892") ? () => undefined : (stryCov_9fa48("2892"), word => stryMutAct_9fa48("2895") ? word.length > 3 || !["this", "that", "with", "from", "they", "have", "been", "were"].includes(word) : stryMutAct_9fa48("2894") ? false : stryMutAct_9fa48("2893") ? true : (stryCov_9fa48("2893", "2894", "2895"), (stryMutAct_9fa48("2898") ? word.length <= 3 : stryMutAct_9fa48("2897") ? word.length >= 3 : stryMutAct_9fa48("2896") ? true : (stryCov_9fa48("2896", "2897", "2898"), word.length > 3)) && (stryMutAct_9fa48("2899") ? ["this", "that", "with", "from", "they", "have", "been", "were"].includes(word) : (stryCov_9fa48("2899"), !(stryMutAct_9fa48("2900") ? [] : (stryCov_9fa48("2900"), [stryMutAct_9fa48("2901") ? "" : (stryCov_9fa48("2901"), "this"), stryMutAct_9fa48("2902") ? "" : (stryCov_9fa48("2902"), "that"), stryMutAct_9fa48("2903") ? "" : (stryCov_9fa48("2903"), "with"), stryMutAct_9fa48("2904") ? "" : (stryCov_9fa48("2904"), "from"), stryMutAct_9fa48("2905") ? "" : (stryCov_9fa48("2905"), "they"), stryMutAct_9fa48("2906") ? "" : (stryCov_9fa48("2906"), "have"), stryMutAct_9fa48("2907") ? "" : (stryCov_9fa48("2907"), "been"), stryMutAct_9fa48("2908") ? "" : (stryCov_9fa48("2908"), "were")])).includes(word)))))));
      return stryMutAct_9fa48("2909") ? [...new Set(concepts)] : (stryCov_9fa48("2909"), (stryMutAct_9fa48("2910") ? [] : (stryCov_9fa48("2910"), [...new Set(concepts)])).slice(0, 5));
    }
  }

  // Specialized search methods for common Obsidian use cases
  async searchByTag(tag: string, options: ObsidianSearchOptions = {}): Promise<ObsidianSearchResponse> {
    if (stryMutAct_9fa48("2911")) {
      {}
    } else {
      stryCov_9fa48("2911");
      return this.search(stryMutAct_9fa48("2912") ? `` : (stryCov_9fa48("2912"), `tag:${tag}`), stryMutAct_9fa48("2913") ? {} : (stryCov_9fa48("2913"), {
        ...options,
        tags: stryMutAct_9fa48("2914") ? [] : (stryCov_9fa48("2914"), [tag]),
        searchMode: stryMutAct_9fa48("2915") ? "" : (stryCov_9fa48("2915"), "hybrid")
      }));
    }
  }
  async searchMOCs(query?: string, options: ObsidianSearchOptions = {}): Promise<ObsidianSearchResponse> {
    if (stryMutAct_9fa48("2916")) {
      {}
    } else {
      stryCov_9fa48("2916");
      const searchQuery = query ? stryMutAct_9fa48("2917") ? `` : (stryCov_9fa48("2917"), `MOC ${query}`) : stryMutAct_9fa48("2918") ? "" : (stryCov_9fa48("2918"), "MOC map of content");
      return this.search(searchQuery, stryMutAct_9fa48("2919") ? {} : (stryCov_9fa48("2919"), {
        ...options,
        contentTypes: stryMutAct_9fa48("2920") ? [] : (stryCov_9fa48("2920"), [stryMutAct_9fa48("2921") ? "" : (stryCov_9fa48("2921"), "moc")]),
        searchMode: stryMutAct_9fa48("2922") ? "" : (stryCov_9fa48("2922"), "comprehensive")
      }));
    }
  }
  async searchConversations(query: string, options: ObsidianSearchOptions = {}): Promise<ObsidianSearchResponse> {
    if (stryMutAct_9fa48("2923")) {
      {}
    } else {
      stryCov_9fa48("2923");
      return this.search(query, stryMutAct_9fa48("2924") ? {} : (stryCov_9fa48("2924"), {
        ...options,
        contentTypes: stryMutAct_9fa48("2925") ? [] : (stryCov_9fa48("2925"), [stryMutAct_9fa48("2926") ? "" : (stryCov_9fa48("2926"), "conversation")]),
        searchMode: stryMutAct_9fa48("2927") ? "" : (stryCov_9fa48("2927"), "semantic")
      }));
    }
  }
  async findRelatedNotes(fileName: string, options: ObsidianSearchOptions = {}): Promise<ObsidianSearchResponse> {
    if (stryMutAct_9fa48("2928")) {
      {}
    } else {
      stryCov_9fa48("2928");
      // Search for notes that reference this file or share similar content
      return this.search(fileName, stryMutAct_9fa48("2929") ? {} : (stryCov_9fa48("2929"), {
        ...options,
        includeRelated: stryMutAct_9fa48("2930") ? false : (stryCov_9fa48("2930"), true),
        maxRelated: 10,
        searchMode: stryMutAct_9fa48("2931") ? "" : (stryCov_9fa48("2931"), "graph")
      }));
    }
  }
  async exploreKnowledgeCluster(concept: string, options: ObsidianSearchOptions = {}): Promise<ObsidianSearchResponse> {
    if (stryMutAct_9fa48("2932")) {
      {}
    } else {
      stryCov_9fa48("2932");
      return this.search(concept, stryMutAct_9fa48("2933") ? {} : (stryCov_9fa48("2933"), {
        ...options,
        searchMode: stryMutAct_9fa48("2934") ? "" : (stryCov_9fa48("2934"), "comprehensive"),
        includeRelated: stryMutAct_9fa48("2935") ? false : (stryCov_9fa48("2935"), true),
        limit: 20
      }));
    }
  }

  // Multi-modal specialized search methods
  async searchMultiModal(query: string, contentTypes: ContentType[], options: ObsidianSearchOptions = {}): Promise<ObsidianSearchResponse> {
    if (stryMutAct_9fa48("2936")) {
      {}
    } else {
      stryCov_9fa48("2936");
      return this.search(query, stryMutAct_9fa48("2937") ? {} : (stryCov_9fa48("2937"), {
        ...options,
        contentTypes: contentTypes.map(stryMutAct_9fa48("2938") ? () => undefined : (stryCov_9fa48("2938"), type => type.toString())),
        searchMode: stryMutAct_9fa48("2939") ? "" : (stryCov_9fa48("2939"), "semantic")
      }));
    }
  }
  async searchPDFs(query: string, options: ObsidianSearchOptions = {}): Promise<ObsidianSearchResponse> {
    if (stryMutAct_9fa48("2940")) {
      {}
    } else {
      stryCov_9fa48("2940");
      return this.searchMultiModal(query, stryMutAct_9fa48("2941") ? [] : (stryCov_9fa48("2941"), [ContentType.PDF]), stryMutAct_9fa48("2942") ? {} : (stryCov_9fa48("2942"), {
        ...options,
        searchMode: stryMutAct_9fa48("2943") ? "" : (stryCov_9fa48("2943"), "semantic")
      }));
    }
  }
  async searchOfficeDocuments(query: string, options: ObsidianSearchOptions = {}): Promise<ObsidianSearchResponse> {
    if (stryMutAct_9fa48("2944")) {
      {}
    } else {
      stryCov_9fa48("2944");
      return this.searchMultiModal(query, stryMutAct_9fa48("2945") ? [] : (stryCov_9fa48("2945"), [ContentType.OFFICE_DOC, ContentType.OFFICE_SHEET, ContentType.OFFICE_PRESENTATION]), stryMutAct_9fa48("2946") ? {} : (stryCov_9fa48("2946"), {
        ...options,
        searchMode: stryMutAct_9fa48("2947") ? "" : (stryCov_9fa48("2947"), "semantic")
      }));
    }
  }
  async searchAudioTranscripts(query: string, options: ObsidianSearchOptions = {}): Promise<ObsidianSearchResponse> {
    if (stryMutAct_9fa48("2948")) {
      {}
    } else {
      stryCov_9fa48("2948");
      return this.searchMultiModal(query, stryMutAct_9fa48("2949") ? [] : (stryCov_9fa48("2949"), [ContentType.AUDIO]), stryMutAct_9fa48("2950") ? {} : (stryCov_9fa48("2950"), {
        ...options,
        searchMode: stryMutAct_9fa48("2951") ? "" : (stryCov_9fa48("2951"), "semantic")
      }));
    }
  }
  async searchImages(query: string, options: ObsidianSearchOptions = {}): Promise<ObsidianSearchResponse> {
    if (stryMutAct_9fa48("2952")) {
      {}
    } else {
      stryCov_9fa48("2952");
      return this.searchMultiModal(query, stryMutAct_9fa48("2953") ? [] : (stryCov_9fa48("2953"), [ContentType.RASTER_IMAGE, ContentType.VECTOR_IMAGE]), stryMutAct_9fa48("2954") ? {} : (stryCov_9fa48("2954"), {
        ...options,
        searchMode: stryMutAct_9fa48("2955") ? "" : (stryCov_9fa48("2955"), "semantic")
      }));
    }
  }
  async searchByMultiModalType(contentType: ContentType, query?: string, options: ObsidianSearchOptions = {}): Promise<ObsidianSearchResponse> {
    if (stryMutAct_9fa48("2956")) {
      {}
    } else {
      stryCov_9fa48("2956");
      const searchQuery = stryMutAct_9fa48("2959") ? query && `${contentType} content` : stryMutAct_9fa48("2958") ? false : stryMutAct_9fa48("2957") ? true : (stryCov_9fa48("2957", "2958", "2959"), query || (stryMutAct_9fa48("2960") ? `` : (stryCov_9fa48("2960"), `${contentType} content`)));
      return this.search(searchQuery, stryMutAct_9fa48("2961") ? {} : (stryCov_9fa48("2961"), {
        ...options,
        contentTypes: stryMutAct_9fa48("2962") ? [] : (stryCov_9fa48("2962"), [contentType.toString()]),
        searchMode: stryMutAct_9fa48("2963") ? "" : (stryCov_9fa48("2963"), "semantic"),
        limit: 50 // More results for browsing by type
      }));
    }
  }

  // Utility methods
  async getFileChunks(fileName: string): Promise<SearchResult[]> {
    if (stryMutAct_9fa48("2964")) {
      {}
    } else {
      stryCov_9fa48("2964");
      const chunks = await this.db.getChunksByFile(fileName);
      return chunks.map(stryMutAct_9fa48("2965") ? () => undefined : (stryCov_9fa48("2965"), (chunk, index) => stryMutAct_9fa48("2966") ? {} : (stryCov_9fa48("2966"), {
        id: chunk.id,
        text: chunk.text,
        meta: chunk.meta,
        cosineSimilarity: 1.0,
        // Perfect match since it's the same file
        rank: stryMutAct_9fa48("2967") ? index - 1 : (stryCov_9fa48("2967"), index + 1)
      })));
    }
  }
  async getStats() {
    if (stryMutAct_9fa48("2968")) {
      {}
    } else {
      stryCov_9fa48("2968");
      return this.db.getStats();
    }
  }
}