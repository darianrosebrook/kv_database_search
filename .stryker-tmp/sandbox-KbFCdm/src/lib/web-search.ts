/**
 * Web Search Service
 *
 * Integrates external web search capabilities to augment the knowledge base
 * with current information from the internet.
 *
 * @author @darianrosebrook
 */
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
import { ObsidianEmbeddingService } from "./embeddings";
export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  source: string;
  relevanceScore: number;
  embedding?: number[];
}
export interface WebSearchOptions {
  maxResults?: number;
  includeSnippets?: boolean;
  minRelevanceScore?: number;
  sources?: string[]; // e.g., ['google', 'bing', 'duckduckgo']
  timeRange?: "day" | "week" | "month" | "year" | "all";
}
export interface WebSearchProvider {
  name: string;
  search(query: string, options: WebSearchOptions): Promise<WebSearchResult[]>;
  rateLimitDelay: number; // milliseconds between requests
  dailyLimit?: number;
}
export class WebSearchService {
  private providers: Map<string, WebSearchProvider> = new Map();
  private embeddingService: ObsidianEmbeddingService;
  private cache: Map<string, {
    results: WebSearchResult[];
    timestamp: number;
  }> = new Map();
  private readonly cacheExpiry = stryMutAct_9fa48("4106") ? 24 * 60 * 60 / 1000 : (stryCov_9fa48("4106"), (stryMutAct_9fa48("4107") ? 24 * 60 / 60 : (stryCov_9fa48("4107"), (stryMutAct_9fa48("4108") ? 24 / 60 : (stryCov_9fa48("4108"), 24 * 60)) * 60)) * 1000); // 24 hours

  constructor(embeddingService: ObsidianEmbeddingService) {
    if (stryMutAct_9fa48("4109")) {
      {}
    } else {
      stryCov_9fa48("4109");
      this.embeddingService = embeddingService;
      this.initializeProviders();
    }
  }
  enableSearXNG(baseUrl?: string): void {
    if (stryMutAct_9fa48("4110")) {
      {}
    } else {
      stryCov_9fa48("4110");
      const searxngProvider = new SearXNGProvider(baseUrl);
      this.providers.set(stryMutAct_9fa48("4111") ? "" : (stryCov_9fa48("4111"), "searxng"), searxngProvider);
      console.log(stryMutAct_9fa48("4112") ? `` : (stryCov_9fa48("4112"), `🔍 Enabled SearXNG provider at ${stryMutAct_9fa48("4115") ? baseUrl && "http://localhost:8888" : stryMutAct_9fa48("4114") ? false : stryMutAct_9fa48("4113") ? true : (stryCov_9fa48("4113", "4114", "4115"), baseUrl || (stryMutAct_9fa48("4116") ? "" : (stryCov_9fa48("4116"), "http://localhost:8888")))}`));
    }
  }
  enableGoogleSearch(apiKey: string, cx: string): void {
    if (stryMutAct_9fa48("4117")) {
      {}
    } else {
      stryCov_9fa48("4117");
      // Store credentials for the provider
      process.env.GOOGLE_SEARCH_API_KEY = apiKey;
      process.env.GOOGLE_SEARCH_CX = cx;
      this.providers.set(stryMutAct_9fa48("4118") ? "" : (stryCov_9fa48("4118"), "google"), new GoogleSearchProvider());
      console.log(stryMutAct_9fa48("4119") ? "" : (stryCov_9fa48("4119"), "🔍 Enabled Google Custom Search provider"));
    }
  }
  enableSerper(apiKey: string): void {
    if (stryMutAct_9fa48("4120")) {
      {}
    } else {
      stryCov_9fa48("4120");
      process.env.SERPER_API_KEY = apiKey;
      this.providers.set(stryMutAct_9fa48("4121") ? "" : (stryCov_9fa48("4121"), "serper"), new SerperSearchProvider());
      console.log(stryMutAct_9fa48("4122") ? "" : (stryCov_9fa48("4122"), "🔍 Enabled Serper provider"));
    }
  }
  private initializeProviders() {
    if (stryMutAct_9fa48("4123")) {
      {}
    } else {
      stryCov_9fa48("4123");
      // Mock providers for demonstration - in production, implement real APIs
      this.providers.set(stryMutAct_9fa48("4124") ? "" : (stryCov_9fa48("4124"), "mock"), stryMutAct_9fa48("4125") ? {} : (stryCov_9fa48("4125"), {
        name: stryMutAct_9fa48("4126") ? "" : (stryCov_9fa48("4126"), "Mock Search"),
        rateLimitDelay: 100,
        async search(query: string, options: WebSearchOptions): Promise<WebSearchResult[]> {
          if (stryMutAct_9fa48("4127")) {
            {}
          } else {
            stryCov_9fa48("4127");
            // Simulate web search with mock data
            const mockResults: WebSearchResult[] = stryMutAct_9fa48("4128") ? [] : (stryCov_9fa48("4128"), [stryMutAct_9fa48("4129") ? {} : (stryCov_9fa48("4129"), {
              title: stryMutAct_9fa48("4130") ? `` : (stryCov_9fa48("4130"), `Latest ${query} Information`),
              url: stryMutAct_9fa48("4131") ? `` : (stryCov_9fa48("4131"), `https://example.com/search?q=${encodeURIComponent(query)}`),
              snippet: stryMutAct_9fa48("4132") ? `` : (stryCov_9fa48("4132"), `This is a simulated search result for "${query}". In a real implementation, this would be actual web content from search engines.`),
              publishedDate: new Date().toISOString(),
              source: stryMutAct_9fa48("4133") ? "" : (stryCov_9fa48("4133"), "Mock Search Engine"),
              relevanceScore: 0.9
            }), stryMutAct_9fa48("4134") ? {} : (stryCov_9fa48("4134"), {
              title: stryMutAct_9fa48("4135") ? `` : (stryCov_9fa48("4135"), `${query} - Wikipedia`),
              url: stryMutAct_9fa48("4136") ? `` : (stryCov_9fa48("4136"), `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(stryMutAct_9fa48("4138") ? /\S+/g : stryMutAct_9fa48("4137") ? /\s/g : (stryCov_9fa48("4137", "4138"), /\s+/g), stryMutAct_9fa48("4139") ? "" : (stryCov_9fa48("4139"), "_")))}`),
              snippet: stryMutAct_9fa48("4140") ? `` : (stryCov_9fa48("4140"), `Wikipedia page about ${query}. Contains comprehensive information and references.`),
              publishedDate: new Date(stryMutAct_9fa48("4141") ? Date.now() + 7 * 24 * 60 * 60 * 1000 : (stryCov_9fa48("4141"), Date.now() - (stryMutAct_9fa48("4142") ? 7 * 24 * 60 * 60 / 1000 : (stryCov_9fa48("4142"), (stryMutAct_9fa48("4143") ? 7 * 24 * 60 / 60 : (stryCov_9fa48("4143"), (stryMutAct_9fa48("4144") ? 7 * 24 / 60 : (stryCov_9fa48("4144"), (stryMutAct_9fa48("4145") ? 7 / 24 : (stryCov_9fa48("4145"), 7 * 24)) * 60)) * 60)) * 1000)))).toISOString(),
              source: stryMutAct_9fa48("4146") ? "" : (stryCov_9fa48("4146"), "Wikipedia"),
              relevanceScore: 0.8
            }), stryMutAct_9fa48("4147") ? {} : (stryCov_9fa48("4147"), {
              title: stryMutAct_9fa48("4148") ? `` : (stryCov_9fa48("4148"), `Recent News about ${query}`),
              url: stryMutAct_9fa48("4149") ? `` : (stryCov_9fa48("4149"), `https://news.example.com/search?q=${encodeURIComponent(query)}`),
              snippet: stryMutAct_9fa48("4150") ? `` : (stryCov_9fa48("4150"), `Latest news articles and updates related to ${query} from various news sources.`),
              publishedDate: new Date(stryMutAct_9fa48("4151") ? Date.now() + 2 * 60 * 60 * 1000 : (stryCov_9fa48("4151"), Date.now() - (stryMutAct_9fa48("4152") ? 2 * 60 * 60 / 1000 : (stryCov_9fa48("4152"), (stryMutAct_9fa48("4153") ? 2 * 60 / 60 : (stryCov_9fa48("4153"), (stryMutAct_9fa48("4154") ? 2 / 60 : (stryCov_9fa48("4154"), 2 * 60)) * 60)) * 1000)))).toISOString(),
              source: stryMutAct_9fa48("4155") ? "" : (stryCov_9fa48("4155"), "News Aggregator"),
              relevanceScore: 0.7
            })]);

            // Apply filters
            let filteredResults = mockResults;
            if (stryMutAct_9fa48("4157") ? false : stryMutAct_9fa48("4156") ? true : (stryCov_9fa48("4156", "4157"), options.minRelevanceScore)) {
              if (stryMutAct_9fa48("4158")) {
                {}
              } else {
                stryCov_9fa48("4158");
                filteredResults = stryMutAct_9fa48("4159") ? filteredResults : (stryCov_9fa48("4159"), filteredResults.filter(stryMutAct_9fa48("4160") ? () => undefined : (stryCov_9fa48("4160"), r => stryMutAct_9fa48("4164") ? r.relevanceScore < options.minRelevanceScore! : stryMutAct_9fa48("4163") ? r.relevanceScore > options.minRelevanceScore! : stryMutAct_9fa48("4162") ? false : stryMutAct_9fa48("4161") ? true : (stryCov_9fa48("4161", "4162", "4163", "4164"), r.relevanceScore >= options.minRelevanceScore!))));
              }
            }
            if (stryMutAct_9fa48("4166") ? false : stryMutAct_9fa48("4165") ? true : (stryCov_9fa48("4165", "4166"), options.maxResults)) {
              if (stryMutAct_9fa48("4167")) {
                {}
              } else {
                stryCov_9fa48("4167");
                filteredResults = stryMutAct_9fa48("4168") ? filteredResults : (stryCov_9fa48("4168"), filteredResults.slice(0, options.maxResults));
              }
            }
            return filteredResults;
          }
        }
      }));

      // In a real implementation, you would add actual providers:
      // this.providers.set('google', new GoogleSearchProvider());
      // this.providers.set('bing', new BingSearchProvider());
      // this.providers.set('serper', new SerperSearchProvider());
    }
  }
  async search(query: string, options: WebSearchOptions = {}): Promise<WebSearchResult[]> {
    if (stryMutAct_9fa48("4169")) {
      {}
    } else {
      stryCov_9fa48("4169");
      const cacheKey = stryMutAct_9fa48("4170") ? `` : (stryCov_9fa48("4170"), `${query}:${JSON.stringify(options)}`);

      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (stryMutAct_9fa48("4173") ? cached || Date.now() - cached.timestamp < this.cacheExpiry : stryMutAct_9fa48("4172") ? false : stryMutAct_9fa48("4171") ? true : (stryCov_9fa48("4171", "4172", "4173"), cached && (stryMutAct_9fa48("4176") ? Date.now() - cached.timestamp >= this.cacheExpiry : stryMutAct_9fa48("4175") ? Date.now() - cached.timestamp <= this.cacheExpiry : stryMutAct_9fa48("4174") ? true : (stryCov_9fa48("4174", "4175", "4176"), (stryMutAct_9fa48("4177") ? Date.now() + cached.timestamp : (stryCov_9fa48("4177"), Date.now() - cached.timestamp)) < this.cacheExpiry)))) {
        if (stryMutAct_9fa48("4178")) {
          {}
        } else {
          stryCov_9fa48("4178");
          console.log(stryMutAct_9fa48("4179") ? `` : (stryCov_9fa48("4179"), `📋 Using cached web search results for: ${query}`));
          return cached.results;
        }
      }
      const searchPromises: Promise<WebSearchResult[]>[] = stryMutAct_9fa48("4180") ? ["Stryker was here"] : (stryCov_9fa48("4180"), []);

      // Use all available providers
      for (const [providerName, provider] of this.providers) {
        if (stryMutAct_9fa48("4181")) {
          {}
        } else {
          stryCov_9fa48("4181");
          searchPromises.push(provider.search(query, options).then(results => {
            if (stryMutAct_9fa48("4182")) {
              {}
            } else {
              stryCov_9fa48("4182");
              // Add provider name to results
              return results.map(stryMutAct_9fa48("4183") ? () => undefined : (stryCov_9fa48("4183"), result => stryMutAct_9fa48("4184") ? {} : (stryCov_9fa48("4184"), {
                ...result,
                source: stryMutAct_9fa48("4185") ? `` : (stryCov_9fa48("4185"), `${result.source} (${providerName})`)
              })));
            }
          }));
        }
      }
      try {
        if (stryMutAct_9fa48("4186")) {
          {}
        } else {
          stryCov_9fa48("4186");
          const allResults = await Promise.all(searchPromises);
          let combinedResults: WebSearchResult[] = stryMutAct_9fa48("4187") ? ["Stryker was here"] : (stryCov_9fa48("4187"), []);

          // Combine and deduplicate results
          for (const results of allResults) {
            if (stryMutAct_9fa48("4188")) {
              {}
            } else {
              stryCov_9fa48("4188");
              combinedResults.push(...results);
            }
          }

          // Remove duplicates based on URL
          combinedResults = stryMutAct_9fa48("4189") ? combinedResults : (stryCov_9fa48("4189"), combinedResults.filter(stryMutAct_9fa48("4190") ? () => undefined : (stryCov_9fa48("4190"), (result, index, self) => stryMutAct_9fa48("4193") ? index !== self.findIndex(r => r.url === result.url) : stryMutAct_9fa48("4192") ? false : stryMutAct_9fa48("4191") ? true : (stryCov_9fa48("4191", "4192", "4193"), index === self.findIndex(stryMutAct_9fa48("4194") ? () => undefined : (stryCov_9fa48("4194"), r => stryMutAct_9fa48("4197") ? r.url !== result.url : stryMutAct_9fa48("4196") ? false : stryMutAct_9fa48("4195") ? true : (stryCov_9fa48("4195", "4196", "4197"), r.url === result.url)))))));

          // Sort by relevance score
          stryMutAct_9fa48("4198") ? combinedResults : (stryCov_9fa48("4198"), combinedResults.sort(stryMutAct_9fa48("4199") ? () => undefined : (stryCov_9fa48("4199"), (a, b) => stryMutAct_9fa48("4200") ? b.relevanceScore + a.relevanceScore : (stryCov_9fa48("4200"), b.relevanceScore - a.relevanceScore))));

          // Limit results
          const maxResults = stryMutAct_9fa48("4203") ? options.maxResults && 10 : stryMutAct_9fa48("4202") ? false : stryMutAct_9fa48("4201") ? true : (stryCov_9fa48("4201", "4202", "4203"), options.maxResults || 10);
          combinedResults = stryMutAct_9fa48("4204") ? combinedResults : (stryCov_9fa48("4204"), combinedResults.slice(0, maxResults));

          // Generate embeddings for results
          const resultsWithEmbeddings = await this.addEmbeddingsToResults(combinedResults);

          // Cache the results
          this.cache.set(cacheKey, stryMutAct_9fa48("4205") ? {} : (stryCov_9fa48("4205"), {
            results: resultsWithEmbeddings,
            timestamp: Date.now()
          }));
          console.log(stryMutAct_9fa48("4206") ? `` : (stryCov_9fa48("4206"), `🌐 Web search completed for "${query}": ${resultsWithEmbeddings.length} results`));
          return resultsWithEmbeddings;
        }
      } catch (error) {
        if (stryMutAct_9fa48("4207")) {
          {}
        } else {
          stryCov_9fa48("4207");
          console.error(stryMutAct_9fa48("4208") ? "" : (stryCov_9fa48("4208"), "Web search failed:"), error);
          throw new Error(stryMutAct_9fa48("4209") ? `` : (stryCov_9fa48("4209"), `Web search failed: ${error instanceof Error ? error.message : stryMutAct_9fa48("4210") ? "" : (stryCov_9fa48("4210"), "Unknown error")}`));
        }
      }
    }
  }
  private async addEmbeddingsToResults(results: WebSearchResult[]): Promise<WebSearchResult[]> {
    if (stryMutAct_9fa48("4211")) {
      {}
    } else {
      stryCov_9fa48("4211");
      const textsToEmbed = results.map(stryMutAct_9fa48("4212") ? () => undefined : (stryCov_9fa48("4212"), r => stryMutAct_9fa48("4213") ? `` : (stryCov_9fa48("4213"), `${r.title}\n${r.snippet}`)));
      try {
        if (stryMutAct_9fa48("4214")) {
          {}
        } else {
          stryCov_9fa48("4214");
          const embeddings = await this.embeddingService.embedBatch(textsToEmbed);
          return results.map(stryMutAct_9fa48("4215") ? () => undefined : (stryCov_9fa48("4215"), (result, index) => stryMutAct_9fa48("4216") ? {} : (stryCov_9fa48("4216"), {
            ...result,
            embedding: embeddings[index]
          })));
        }
      } catch (error) {
        if (stryMutAct_9fa48("4217")) {
          {}
        } else {
          stryCov_9fa48("4217");
          console.warn(stryMutAct_9fa48("4218") ? "" : (stryCov_9fa48("4218"), "Failed to generate embeddings for web results:"), error);
          // Return results without embeddings
          return results;
        }
      }
    }
  }
  async searchWithContext(query: string, context: string[], options: WebSearchOptions = {}): Promise<WebSearchResult[]> {
    if (stryMutAct_9fa48("4219")) {
      {}
    } else {
      stryCov_9fa48("4219");
      // Create an enhanced query that includes context
      const enhancedQuery = (stryMutAct_9fa48("4223") ? context.length <= 0 : stryMutAct_9fa48("4222") ? context.length >= 0 : stryMutAct_9fa48("4221") ? false : stryMutAct_9fa48("4220") ? true : (stryCov_9fa48("4220", "4221", "4222", "4223"), context.length > 0)) ? stryMutAct_9fa48("4224") ? `` : (stryCov_9fa48("4224"), `${query} (context: ${context.join(stryMutAct_9fa48("4225") ? "" : (stryCov_9fa48("4225"), ", "))})`) : query;
      return this.search(enhancedQuery, options);
    }
  }
  getAvailableProviders(): string[] {
    if (stryMutAct_9fa48("4226")) {
      {}
    } else {
      stryCov_9fa48("4226");
      return Array.from(this.providers.keys());
    }
  }
  getProviderInfo(providerName: string): WebSearchProvider | undefined {
    if (stryMutAct_9fa48("4227")) {
      {}
    } else {
      stryCov_9fa48("4227");
      return this.providers.get(providerName);
    }
  }
  clearCache(): void {
    if (stryMutAct_9fa48("4228")) {
      {}
    } else {
      stryCov_9fa48("4228");
      this.cache.clear();
      console.log(stryMutAct_9fa48("4229") ? "" : (stryCov_9fa48("4229"), "🗑️  Web search cache cleared"));
    }
  }
  getCacheStats(): {
    size: number;
    hitRate: number;
    oldestEntry: number | null;
  } {
    if (stryMutAct_9fa48("4230")) {
      {}
    } else {
      stryCov_9fa48("4230");
      const entries = Array.from(this.cache.values());
      const now = Date.now();
      if (stryMutAct_9fa48("4233") ? entries.length !== 0 : stryMutAct_9fa48("4232") ? false : stryMutAct_9fa48("4231") ? true : (stryCov_9fa48("4231", "4232", "4233"), entries.length === 0)) {
        if (stryMutAct_9fa48("4234")) {
          {}
        } else {
          stryCov_9fa48("4234");
          return stryMutAct_9fa48("4235") ? {} : (stryCov_9fa48("4235"), {
            size: 0,
            hitRate: 0,
            oldestEntry: null
          });
        }
      }
      const oldestEntry = stryMutAct_9fa48("4236") ? Math.max(...entries.map(e => e.timestamp)) : (stryCov_9fa48("4236"), Math.min(...entries.map(stryMutAct_9fa48("4237") ? () => undefined : (stryCov_9fa48("4237"), e => e.timestamp))));
      const ageInHours = stryMutAct_9fa48("4238") ? (now - oldestEntry) * (1000 * 60 * 60) : (stryCov_9fa48("4238"), (stryMutAct_9fa48("4239") ? now + oldestEntry : (stryCov_9fa48("4239"), now - oldestEntry)) / (stryMutAct_9fa48("4240") ? 1000 * 60 / 60 : (stryCov_9fa48("4240"), (stryMutAct_9fa48("4241") ? 1000 / 60 : (stryCov_9fa48("4241"), 1000 * 60)) * 60)));
      return stryMutAct_9fa48("4242") ? {} : (stryCov_9fa48("4242"), {
        size: entries.length,
        hitRate: 0,
        // Would need to track hits vs misses for accurate rate
        oldestEntry: ageInHours
      });
    }
  }
}

// Example real provider implementations (commented out for demo)
class GoogleSearchProvider implements WebSearchProvider {
  name = stryMutAct_9fa48("4243") ? "" : (stryCov_9fa48("4243"), "Google Search");
  rateLimitDelay = 1000; // 1 second between requests
  dailyLimit = 100; // Google's free tier limit

  async search(query: string, options: WebSearchOptions): Promise<WebSearchResult[]> {
    if (stryMutAct_9fa48("4244")) {
      {}
    } else {
      stryCov_9fa48("4244");
      // Implementation using Google Custom Search API
      // Requires API key: https://developers.google.com/custom-search/v1/overview
      const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
      const cx = process.env.GOOGLE_SEARCH_CX;
      if (stryMutAct_9fa48("4247") ? !apiKey && !cx : stryMutAct_9fa48("4246") ? false : stryMutAct_9fa48("4245") ? true : (stryCov_9fa48("4245", "4246", "4247"), (stryMutAct_9fa48("4248") ? apiKey : (stryCov_9fa48("4248"), !apiKey)) || (stryMutAct_9fa48("4249") ? cx : (stryCov_9fa48("4249"), !cx)))) {
        if (stryMutAct_9fa48("4250")) {
          {}
        } else {
          stryCov_9fa48("4250");
          throw new Error(stryMutAct_9fa48("4251") ? "" : (stryCov_9fa48("4251"), "Google Search API key and CX not configured"));
        }
      }
      const url = stryMutAct_9fa48("4252") ? `` : (stryCov_9fa48("4252"), `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=${stryMutAct_9fa48("4255") ? options.maxResults && 10 : stryMutAct_9fa48("4254") ? false : stryMutAct_9fa48("4253") ? true : (stryCov_9fa48("4253", "4254", "4255"), options.maxResults || 10)}`);
      const response = await fetch(url);
      const data = await response.json();
      if (stryMutAct_9fa48("4258") ? false : stryMutAct_9fa48("4257") ? true : stryMutAct_9fa48("4256") ? response.ok : (stryCov_9fa48("4256", "4257", "4258"), !response.ok)) {
        if (stryMutAct_9fa48("4259")) {
          {}
        } else {
          stryCov_9fa48("4259");
          throw new Error(stryMutAct_9fa48("4260") ? `` : (stryCov_9fa48("4260"), `Google Search API error: ${stryMutAct_9fa48("4263") ? data.error?.message && "Unknown error" : stryMutAct_9fa48("4262") ? false : stryMutAct_9fa48("4261") ? true : (stryCov_9fa48("4261", "4262", "4263"), (stryMutAct_9fa48("4264") ? data.error.message : (stryCov_9fa48("4264"), data.error?.message)) || (stryMutAct_9fa48("4265") ? "" : (stryCov_9fa48("4265"), "Unknown error")))}`));
        }
      }
      return (stryMutAct_9fa48("4268") ? data.items && [] : stryMutAct_9fa48("4267") ? false : stryMutAct_9fa48("4266") ? true : (stryCov_9fa48("4266", "4267", "4268"), data.items || (stryMutAct_9fa48("4269") ? ["Stryker was here"] : (stryCov_9fa48("4269"), [])))).map(stryMutAct_9fa48("4270") ? () => undefined : (stryCov_9fa48("4270"), (item: any) => stryMutAct_9fa48("4271") ? {} : (stryCov_9fa48("4271"), {
        title: item.title,
        url: item.link,
        snippet: stryMutAct_9fa48("4274") ? item.snippet && item.displayLink : stryMutAct_9fa48("4273") ? false : stryMutAct_9fa48("4272") ? true : (stryCov_9fa48("4272", "4273", "4274"), item.snippet || item.displayLink),
        publishedDate: stryMutAct_9fa48("4277") ? item.pagemap?.metatags?.[0]?.["article:published_time"] && item.pagemap?.metatags?.[0]?.["publishdate"] : stryMutAct_9fa48("4276") ? false : stryMutAct_9fa48("4275") ? true : (stryCov_9fa48("4275", "4276", "4277"), (stryMutAct_9fa48("4280") ? item.pagemap.metatags?.[0]?.["article:published_time"] : stryMutAct_9fa48("4279") ? item.pagemap?.metatags[0]?.["article:published_time"] : stryMutAct_9fa48("4278") ? item.pagemap?.metatags?.[0]["article:published_time"] : (stryCov_9fa48("4278", "4279", "4280"), item.pagemap?.metatags?.[0]?.[stryMutAct_9fa48("4281") ? "" : (stryCov_9fa48("4281"), "article:published_time")])) || (stryMutAct_9fa48("4284") ? item.pagemap.metatags?.[0]?.["publishdate"] : stryMutAct_9fa48("4283") ? item.pagemap?.metatags[0]?.["publishdate"] : stryMutAct_9fa48("4282") ? item.pagemap?.metatags?.[0]["publishdate"] : (stryCov_9fa48("4282", "4283", "4284"), item.pagemap?.metatags?.[0]?.[stryMutAct_9fa48("4285") ? "" : (stryCov_9fa48("4285"), "publishdate")]))),
        source: stryMutAct_9fa48("4286") ? "" : (stryCov_9fa48("4286"), "Google Search"),
        relevanceScore: 0.9
      })));
    }
  }
}
class SearXNGProvider implements WebSearchProvider {
  name = stryMutAct_9fa48("4287") ? "" : (stryCov_9fa48("4287"), "SearXNG");
  rateLimitDelay = 500; // Faster since it's local
  dailyLimit = 10000; // Much higher local limits

  private baseUrl: string;
  constructor(baseUrl: string = stryMutAct_9fa48("4288") ? "" : (stryCov_9fa48("4288"), "http://localhost:8888")) {
    if (stryMutAct_9fa48("4289")) {
      {}
    } else {
      stryCov_9fa48("4289");
      this.baseUrl = baseUrl;
    }
  }
  async search(query: string, options: WebSearchOptions): Promise<WebSearchResult[]> {
    if (stryMutAct_9fa48("4290")) {
      {}
    } else {
      stryCov_9fa48("4290");
      const params = new URLSearchParams(stryMutAct_9fa48("4291") ? {} : (stryCov_9fa48("4291"), {
        q: query,
        format: stryMutAct_9fa48("4292") ? "" : (stryCov_9fa48("4292"), "json"),
        categories: stryMutAct_9fa48("4293") ? "" : (stryCov_9fa48("4293"), "general"),
        engines: stryMutAct_9fa48("4294") ? "" : (stryCov_9fa48("4294"), "google,bing,duckduckgo,qwant,startpage"),
        ...(stryMutAct_9fa48("4297") ? options.maxResults || {
          results: options.maxResults.toString()
        } : stryMutAct_9fa48("4296") ? false : stryMutAct_9fa48("4295") ? true : (stryCov_9fa48("4295", "4296", "4297"), options.maxResults && (stryMutAct_9fa48("4298") ? {} : (stryCov_9fa48("4298"), {
          results: options.maxResults.toString()
        }))))
      }));
      const url = stryMutAct_9fa48("4299") ? `` : (stryCov_9fa48("4299"), `${this.baseUrl}/search?${params}`);
      const response = await fetch(url);
      if (stryMutAct_9fa48("4302") ? false : stryMutAct_9fa48("4301") ? true : stryMutAct_9fa48("4300") ? response.ok : (stryCov_9fa48("4300", "4301", "4302"), !response.ok)) {
        if (stryMutAct_9fa48("4303")) {
          {}
        } else {
          stryCov_9fa48("4303");
          throw new Error(stryMutAct_9fa48("4304") ? `` : (stryCov_9fa48("4304"), `SearXNG error: ${response.status} ${response.statusText}`));
        }
      }
      const data = await response.json();
      return (stryMutAct_9fa48("4307") ? data.results && [] : stryMutAct_9fa48("4306") ? false : stryMutAct_9fa48("4305") ? true : (stryCov_9fa48("4305", "4306", "4307"), data.results || (stryMutAct_9fa48("4308") ? ["Stryker was here"] : (stryCov_9fa48("4308"), [])))).map(stryMutAct_9fa48("4309") ? () => undefined : (stryCov_9fa48("4309"), (result: any) => stryMutAct_9fa48("4310") ? {} : (stryCov_9fa48("4310"), {
        title: result.title,
        url: result.url,
        snippet: result.content,
        publishedDate: result.publishedDate,
        source: stryMutAct_9fa48("4311") ? `` : (stryCov_9fa48("4311"), `SearXNG (${stryMutAct_9fa48("4314") ? result.engine && "unknown" : stryMutAct_9fa48("4313") ? false : stryMutAct_9fa48("4312") ? true : (stryCov_9fa48("4312", "4313", "4314"), result.engine || (stryMutAct_9fa48("4315") ? "" : (stryCov_9fa48("4315"), "unknown")))})`),
        relevanceScore: 0.8
      })));
    }
  }
}
class SerperSearchProvider implements WebSearchProvider {
  name = stryMutAct_9fa48("4316") ? "" : (stryCov_9fa48("4316"), "Serper");
  rateLimitDelay = 1000;
  dailyLimit = 2500;
  async search(query: string, options: WebSearchOptions): Promise<WebSearchResult[]> {
    if (stryMutAct_9fa48("4317")) {
      {}
    } else {
      stryCov_9fa48("4317");
      // Serper.dev API implementation
      const apiKey = process.env.SERPER_API_KEY;
      if (stryMutAct_9fa48("4320") ? false : stryMutAct_9fa48("4319") ? true : stryMutAct_9fa48("4318") ? apiKey : (stryCov_9fa48("4318", "4319", "4320"), !apiKey)) {
        if (stryMutAct_9fa48("4321")) {
          {}
        } else {
          stryCov_9fa48("4321");
          throw new Error(stryMutAct_9fa48("4322") ? "" : (stryCov_9fa48("4322"), "Serper API key not configured"));
        }
      }
      const url = stryMutAct_9fa48("4323") ? "" : (stryCov_9fa48("4323"), "https://google.serper.dev/search");
      const response = await fetch(url, stryMutAct_9fa48("4324") ? {} : (stryCov_9fa48("4324"), {
        method: stryMutAct_9fa48("4325") ? "" : (stryCov_9fa48("4325"), "POST"),
        headers: stryMutAct_9fa48("4326") ? {} : (stryCov_9fa48("4326"), {
          "X-API-KEY": apiKey,
          "Content-Type": stryMutAct_9fa48("4327") ? "" : (stryCov_9fa48("4327"), "application/json")
        }),
        body: JSON.stringify(stryMutAct_9fa48("4328") ? {} : (stryCov_9fa48("4328"), {
          q: query,
          num: stryMutAct_9fa48("4331") ? options.maxResults && 10 : stryMutAct_9fa48("4330") ? false : stryMutAct_9fa48("4329") ? true : (stryCov_9fa48("4329", "4330", "4331"), options.maxResults || 10),
          gl: stryMutAct_9fa48("4332") ? "" : (stryCov_9fa48("4332"), "us"),
          // Country code
          hl: stryMutAct_9fa48("4333") ? "" : (stryCov_9fa48("4333"), "en") // Language code
        }))
      }));
      if (stryMutAct_9fa48("4336") ? false : stryMutAct_9fa48("4335") ? true : stryMutAct_9fa48("4334") ? response.ok : (stryCov_9fa48("4334", "4335", "4336"), !response.ok)) {
        if (stryMutAct_9fa48("4337")) {
          {}
        } else {
          stryCov_9fa48("4337");
          throw new Error(stryMutAct_9fa48("4338") ? `` : (stryCov_9fa48("4338"), `Serper API error: ${response.status} ${response.statusText}`));
        }
      }
      const data = await response.json();
      return (stryMutAct_9fa48("4341") ? data.organic && [] : stryMutAct_9fa48("4340") ? false : stryMutAct_9fa48("4339") ? true : (stryCov_9fa48("4339", "4340", "4341"), data.organic || (stryMutAct_9fa48("4342") ? ["Stryker was here"] : (stryCov_9fa48("4342"), [])))).map(stryMutAct_9fa48("4343") ? () => undefined : (stryCov_9fa48("4343"), (result: any, index: number) => stryMutAct_9fa48("4344") ? {} : (stryCov_9fa48("4344"), {
        title: result.title,
        url: result.link,
        snippet: result.snippet,
        publishedDate: result.date,
        source: stryMutAct_9fa48("4345") ? "" : (stryCov_9fa48("4345"), "Serper"),
        relevanceScore: stryMutAct_9fa48("4346") ? 0.9 + index * 0.05 : (stryCov_9fa48("4346"), 0.9 - (stryMutAct_9fa48("4347") ? index / 0.05 : (stryCov_9fa48("4347"), index * 0.05))) // Decreasing relevance by position
      })));
    }
  }
}
class LocalWebCrawler implements WebSearchProvider {
  name = stryMutAct_9fa48("4348") ? "" : (stryCov_9fa48("4348"), "Local Web Crawler");
  rateLimitDelay = 2000; // Be respectful to websites
  dailyLimit = 500; // Conservative limit for crawling

  async search(query: string, options: WebSearchOptions): Promise<WebSearchResult[]> {
    if (stryMutAct_9fa48("4349")) {
      {}
    } else {
      stryCov_9fa48("4349");
      // This would implement a local web crawler using libraries like:
      // - Playwright for JavaScript rendering
      // - Cheerio for HTML parsing
      // - Puppeteer for browser automation

      throw new Error(stryMutAct_9fa48("4350") ? "" : (stryCov_9fa48("4350"), "Local web crawler not implemented - requires additional dependencies"));
    }
  }
}
export default WebSearchService;