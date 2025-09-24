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
  private readonly cacheExpiry = stryMutAct_9fa48("4210") ? 24 * 60 * 60 / 1000 : (stryCov_9fa48("4210"), (stryMutAct_9fa48("4211") ? 24 * 60 / 60 : (stryCov_9fa48("4211"), (stryMutAct_9fa48("4212") ? 24 / 60 : (stryCov_9fa48("4212"), 24 * 60)) * 60)) * 1000); // 24 hours

  constructor(embeddingService: ObsidianEmbeddingService) {
    if (stryMutAct_9fa48("4213")) {
      {}
    } else {
      stryCov_9fa48("4213");
      this.embeddingService = embeddingService;
      this.initializeProviders();
    }
  }
  enableSearXNG(baseUrl?: string): void {
    if (stryMutAct_9fa48("4214")) {
      {}
    } else {
      stryCov_9fa48("4214");
      const searxngProvider = new SearXNGProvider(baseUrl);
      this.providers.set(stryMutAct_9fa48("4215") ? "" : (stryCov_9fa48("4215"), "searxng"), searxngProvider);
      console.log(stryMutAct_9fa48("4216") ? `` : (stryCov_9fa48("4216"), `🔍 Enabled SearXNG provider at ${stryMutAct_9fa48("4219") ? baseUrl && "http://localhost:8888" : stryMutAct_9fa48("4218") ? false : stryMutAct_9fa48("4217") ? true : (stryCov_9fa48("4217", "4218", "4219"), baseUrl || (stryMutAct_9fa48("4220") ? "" : (stryCov_9fa48("4220"), "http://localhost:8888")))}`));
    }
  }
  enableGoogleSearch(apiKey: string, cx: string): void {
    if (stryMutAct_9fa48("4221")) {
      {}
    } else {
      stryCov_9fa48("4221");
      // Store credentials for the provider
      process.env.GOOGLE_SEARCH_API_KEY = apiKey;
      process.env.GOOGLE_SEARCH_CX = cx;
      this.providers.set(stryMutAct_9fa48("4222") ? "" : (stryCov_9fa48("4222"), "google"), new GoogleSearchProvider());
      console.log(stryMutAct_9fa48("4223") ? "" : (stryCov_9fa48("4223"), "🔍 Enabled Google Custom Search provider"));
    }
  }
  enableSerper(apiKey: string): void {
    if (stryMutAct_9fa48("4224")) {
      {}
    } else {
      stryCov_9fa48("4224");
      process.env.SERPER_API_KEY = apiKey;
      this.providers.set(stryMutAct_9fa48("4225") ? "" : (stryCov_9fa48("4225"), "serper"), new SerperSearchProvider());
      console.log(stryMutAct_9fa48("4226") ? "" : (stryCov_9fa48("4226"), "🔍 Enabled Serper provider"));
    }
  }
  private initializeProviders() {
    if (stryMutAct_9fa48("4227")) {
      {}
    } else {
      stryCov_9fa48("4227");
      // Mock providers for demonstration - in production, implement real APIs
      this.providers.set(stryMutAct_9fa48("4228") ? "" : (stryCov_9fa48("4228"), "mock"), stryMutAct_9fa48("4229") ? {} : (stryCov_9fa48("4229"), {
        name: stryMutAct_9fa48("4230") ? "" : (stryCov_9fa48("4230"), "Mock Search"),
        rateLimitDelay: 100,
        async search(query: string, options: WebSearchOptions): Promise<WebSearchResult[]> {
          if (stryMutAct_9fa48("4231")) {
            {}
          } else {
            stryCov_9fa48("4231");
            // Simulate web search with mock data
            const mockResults: WebSearchResult[] = stryMutAct_9fa48("4232") ? [] : (stryCov_9fa48("4232"), [stryMutAct_9fa48("4233") ? {} : (stryCov_9fa48("4233"), {
              title: stryMutAct_9fa48("4234") ? `` : (stryCov_9fa48("4234"), `Latest ${query} Information`),
              url: stryMutAct_9fa48("4235") ? `` : (stryCov_9fa48("4235"), `https://example.com/search?q=${encodeURIComponent(query)}`),
              snippet: stryMutAct_9fa48("4236") ? `` : (stryCov_9fa48("4236"), `This is a simulated search result for "${query}". In a real implementation, this would be actual web content from search engines.`),
              publishedDate: new Date().toISOString(),
              source: stryMutAct_9fa48("4237") ? "" : (stryCov_9fa48("4237"), "Mock Search Engine"),
              relevanceScore: 0.9
            }), stryMutAct_9fa48("4238") ? {} : (stryCov_9fa48("4238"), {
              title: stryMutAct_9fa48("4239") ? `` : (stryCov_9fa48("4239"), `${query} - Wikipedia`),
              url: stryMutAct_9fa48("4240") ? `` : (stryCov_9fa48("4240"), `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(stryMutAct_9fa48("4242") ? /\S+/g : stryMutAct_9fa48("4241") ? /\s/g : (stryCov_9fa48("4241", "4242"), /\s+/g), stryMutAct_9fa48("4243") ? "" : (stryCov_9fa48("4243"), "_")))}`),
              snippet: stryMutAct_9fa48("4244") ? `` : (stryCov_9fa48("4244"), `Wikipedia page about ${query}. Contains comprehensive information and references.`),
              publishedDate: new Date(stryMutAct_9fa48("4245") ? Date.now() + 7 * 24 * 60 * 60 * 1000 : (stryCov_9fa48("4245"), Date.now() - (stryMutAct_9fa48("4246") ? 7 * 24 * 60 * 60 / 1000 : (stryCov_9fa48("4246"), (stryMutAct_9fa48("4247") ? 7 * 24 * 60 / 60 : (stryCov_9fa48("4247"), (stryMutAct_9fa48("4248") ? 7 * 24 / 60 : (stryCov_9fa48("4248"), (stryMutAct_9fa48("4249") ? 7 / 24 : (stryCov_9fa48("4249"), 7 * 24)) * 60)) * 60)) * 1000)))).toISOString(),
              source: stryMutAct_9fa48("4250") ? "" : (stryCov_9fa48("4250"), "Wikipedia"),
              relevanceScore: 0.8
            }), stryMutAct_9fa48("4251") ? {} : (stryCov_9fa48("4251"), {
              title: stryMutAct_9fa48("4252") ? `` : (stryCov_9fa48("4252"), `Recent News about ${query}`),
              url: stryMutAct_9fa48("4253") ? `` : (stryCov_9fa48("4253"), `https://news.example.com/search?q=${encodeURIComponent(query)}`),
              snippet: stryMutAct_9fa48("4254") ? `` : (stryCov_9fa48("4254"), `Latest news articles and updates related to ${query} from various news sources.`),
              publishedDate: new Date(stryMutAct_9fa48("4255") ? Date.now() + 2 * 60 * 60 * 1000 : (stryCov_9fa48("4255"), Date.now() - (stryMutAct_9fa48("4256") ? 2 * 60 * 60 / 1000 : (stryCov_9fa48("4256"), (stryMutAct_9fa48("4257") ? 2 * 60 / 60 : (stryCov_9fa48("4257"), (stryMutAct_9fa48("4258") ? 2 / 60 : (stryCov_9fa48("4258"), 2 * 60)) * 60)) * 1000)))).toISOString(),
              source: stryMutAct_9fa48("4259") ? "" : (stryCov_9fa48("4259"), "News Aggregator"),
              relevanceScore: 0.7
            })]);

            // Apply filters
            let filteredResults = mockResults;
            if (stryMutAct_9fa48("4261") ? false : stryMutAct_9fa48("4260") ? true : (stryCov_9fa48("4260", "4261"), options.minRelevanceScore)) {
              if (stryMutAct_9fa48("4262")) {
                {}
              } else {
                stryCov_9fa48("4262");
                filteredResults = stryMutAct_9fa48("4263") ? filteredResults : (stryCov_9fa48("4263"), filteredResults.filter(stryMutAct_9fa48("4264") ? () => undefined : (stryCov_9fa48("4264"), r => stryMutAct_9fa48("4268") ? r.relevanceScore < options.minRelevanceScore! : stryMutAct_9fa48("4267") ? r.relevanceScore > options.minRelevanceScore! : stryMutAct_9fa48("4266") ? false : stryMutAct_9fa48("4265") ? true : (stryCov_9fa48("4265", "4266", "4267", "4268"), r.relevanceScore >= options.minRelevanceScore!))));
              }
            }
            if (stryMutAct_9fa48("4270") ? false : stryMutAct_9fa48("4269") ? true : (stryCov_9fa48("4269", "4270"), options.maxResults)) {
              if (stryMutAct_9fa48("4271")) {
                {}
              } else {
                stryCov_9fa48("4271");
                filteredResults = stryMutAct_9fa48("4272") ? filteredResults : (stryCov_9fa48("4272"), filteredResults.slice(0, options.maxResults));
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
    if (stryMutAct_9fa48("4273")) {
      {}
    } else {
      stryCov_9fa48("4273");
      const cacheKey = stryMutAct_9fa48("4274") ? `` : (stryCov_9fa48("4274"), `${query}:${JSON.stringify(options)}`);

      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (stryMutAct_9fa48("4277") ? cached || Date.now() - cached.timestamp < this.cacheExpiry : stryMutAct_9fa48("4276") ? false : stryMutAct_9fa48("4275") ? true : (stryCov_9fa48("4275", "4276", "4277"), cached && (stryMutAct_9fa48("4280") ? Date.now() - cached.timestamp >= this.cacheExpiry : stryMutAct_9fa48("4279") ? Date.now() - cached.timestamp <= this.cacheExpiry : stryMutAct_9fa48("4278") ? true : (stryCov_9fa48("4278", "4279", "4280"), (stryMutAct_9fa48("4281") ? Date.now() + cached.timestamp : (stryCov_9fa48("4281"), Date.now() - cached.timestamp)) < this.cacheExpiry)))) {
        if (stryMutAct_9fa48("4282")) {
          {}
        } else {
          stryCov_9fa48("4282");
          console.log(stryMutAct_9fa48("4283") ? `` : (stryCov_9fa48("4283"), `📋 Using cached web search results for: ${query}`));
          return cached.results;
        }
      }
      const searchPromises: Promise<WebSearchResult[]>[] = stryMutAct_9fa48("4284") ? ["Stryker was here"] : (stryCov_9fa48("4284"), []);

      // Use all available providers
      for (const [providerName, provider] of this.providers) {
        if (stryMutAct_9fa48("4285")) {
          {}
        } else {
          stryCov_9fa48("4285");
          searchPromises.push(provider.search(query, options).then(results => {
            if (stryMutAct_9fa48("4286")) {
              {}
            } else {
              stryCov_9fa48("4286");
              // Add provider name to results
              return results.map(stryMutAct_9fa48("4287") ? () => undefined : (stryCov_9fa48("4287"), result => stryMutAct_9fa48("4288") ? {} : (stryCov_9fa48("4288"), {
                ...result,
                source: stryMutAct_9fa48("4289") ? `` : (stryCov_9fa48("4289"), `${result.source} (${providerName})`)
              })));
            }
          }));
        }
      }
      try {
        if (stryMutAct_9fa48("4290")) {
          {}
        } else {
          stryCov_9fa48("4290");
          const allResults = await Promise.all(searchPromises);
          let combinedResults: WebSearchResult[] = stryMutAct_9fa48("4291") ? ["Stryker was here"] : (stryCov_9fa48("4291"), []);

          // Combine and deduplicate results
          for (const results of allResults) {
            if (stryMutAct_9fa48("4292")) {
              {}
            } else {
              stryCov_9fa48("4292");
              combinedResults.push(...results);
            }
          }

          // Remove duplicates based on URL
          combinedResults = stryMutAct_9fa48("4293") ? combinedResults : (stryCov_9fa48("4293"), combinedResults.filter(stryMutAct_9fa48("4294") ? () => undefined : (stryCov_9fa48("4294"), (result, index, self) => stryMutAct_9fa48("4297") ? index !== self.findIndex(r => r.url === result.url) : stryMutAct_9fa48("4296") ? false : stryMutAct_9fa48("4295") ? true : (stryCov_9fa48("4295", "4296", "4297"), index === self.findIndex(stryMutAct_9fa48("4298") ? () => undefined : (stryCov_9fa48("4298"), r => stryMutAct_9fa48("4301") ? r.url !== result.url : stryMutAct_9fa48("4300") ? false : stryMutAct_9fa48("4299") ? true : (stryCov_9fa48("4299", "4300", "4301"), r.url === result.url)))))));

          // Sort by relevance score
          stryMutAct_9fa48("4302") ? combinedResults : (stryCov_9fa48("4302"), combinedResults.sort(stryMutAct_9fa48("4303") ? () => undefined : (stryCov_9fa48("4303"), (a, b) => stryMutAct_9fa48("4304") ? b.relevanceScore + a.relevanceScore : (stryCov_9fa48("4304"), b.relevanceScore - a.relevanceScore))));

          // Limit results
          const maxResults = stryMutAct_9fa48("4307") ? options.maxResults && 10 : stryMutAct_9fa48("4306") ? false : stryMutAct_9fa48("4305") ? true : (stryCov_9fa48("4305", "4306", "4307"), options.maxResults || 10);
          combinedResults = stryMutAct_9fa48("4308") ? combinedResults : (stryCov_9fa48("4308"), combinedResults.slice(0, maxResults));

          // Generate embeddings for results
          const resultsWithEmbeddings = await this.addEmbeddingsToResults(combinedResults);

          // Cache the results
          this.cache.set(cacheKey, stryMutAct_9fa48("4309") ? {} : (stryCov_9fa48("4309"), {
            results: resultsWithEmbeddings,
            timestamp: Date.now()
          }));
          console.log(stryMutAct_9fa48("4310") ? `` : (stryCov_9fa48("4310"), `🌐 Web search completed for "${query}": ${resultsWithEmbeddings.length} results`));
          return resultsWithEmbeddings;
        }
      } catch (error) {
        if (stryMutAct_9fa48("4311")) {
          {}
        } else {
          stryCov_9fa48("4311");
          console.error(stryMutAct_9fa48("4312") ? "" : (stryCov_9fa48("4312"), "Web search failed:"), error);
          throw new Error(stryMutAct_9fa48("4313") ? `` : (stryCov_9fa48("4313"), `Web search failed: ${error instanceof Error ? error.message : stryMutAct_9fa48("4314") ? "" : (stryCov_9fa48("4314"), "Unknown error")}`));
        }
      }
    }
  }
  private async addEmbeddingsToResults(results: WebSearchResult[]): Promise<WebSearchResult[]> {
    if (stryMutAct_9fa48("4315")) {
      {}
    } else {
      stryCov_9fa48("4315");
      const textsToEmbed = results.map(stryMutAct_9fa48("4316") ? () => undefined : (stryCov_9fa48("4316"), r => stryMutAct_9fa48("4317") ? `` : (stryCov_9fa48("4317"), `${r.title}\n${r.snippet}`)));
      try {
        if (stryMutAct_9fa48("4318")) {
          {}
        } else {
          stryCov_9fa48("4318");
          const embeddings = await this.embeddingService.embedBatch(textsToEmbed);
          return results.map(stryMutAct_9fa48("4319") ? () => undefined : (stryCov_9fa48("4319"), (result, index) => stryMutAct_9fa48("4320") ? {} : (stryCov_9fa48("4320"), {
            ...result,
            embedding: embeddings[index]
          })));
        }
      } catch (error) {
        if (stryMutAct_9fa48("4321")) {
          {}
        } else {
          stryCov_9fa48("4321");
          console.warn(stryMutAct_9fa48("4322") ? "" : (stryCov_9fa48("4322"), "Failed to generate embeddings for web results:"), error);
          // Return results without embeddings
          return results;
        }
      }
    }
  }
  async searchWithContext(query: string, context: string[], options: WebSearchOptions = {}): Promise<WebSearchResult[]> {
    if (stryMutAct_9fa48("4323")) {
      {}
    } else {
      stryCov_9fa48("4323");
      // Create an enhanced query that includes context
      const enhancedQuery = (stryMutAct_9fa48("4327") ? context.length <= 0 : stryMutAct_9fa48("4326") ? context.length >= 0 : stryMutAct_9fa48("4325") ? false : stryMutAct_9fa48("4324") ? true : (stryCov_9fa48("4324", "4325", "4326", "4327"), context.length > 0)) ? stryMutAct_9fa48("4328") ? `` : (stryCov_9fa48("4328"), `${query} (context: ${context.join(stryMutAct_9fa48("4329") ? "" : (stryCov_9fa48("4329"), ", "))})`) : query;
      return this.search(enhancedQuery, options);
    }
  }
  getAvailableProviders(): string[] {
    if (stryMutAct_9fa48("4330")) {
      {}
    } else {
      stryCov_9fa48("4330");
      return Array.from(this.providers.keys());
    }
  }
  getProviderInfo(providerName: string): WebSearchProvider | undefined {
    if (stryMutAct_9fa48("4331")) {
      {}
    } else {
      stryCov_9fa48("4331");
      return this.providers.get(providerName);
    }
  }
  clearCache(): void {
    if (stryMutAct_9fa48("4332")) {
      {}
    } else {
      stryCov_9fa48("4332");
      this.cache.clear();
      console.log(stryMutAct_9fa48("4333") ? "" : (stryCov_9fa48("4333"), "🗑️  Web search cache cleared"));
    }
  }
  getCacheStats(): {
    size: number;
    hitRate: number;
    oldestEntry: number | null;
  } {
    if (stryMutAct_9fa48("4334")) {
      {}
    } else {
      stryCov_9fa48("4334");
      const entries = Array.from(this.cache.values());
      const now = Date.now();
      if (stryMutAct_9fa48("4337") ? entries.length !== 0 : stryMutAct_9fa48("4336") ? false : stryMutAct_9fa48("4335") ? true : (stryCov_9fa48("4335", "4336", "4337"), entries.length === 0)) {
        if (stryMutAct_9fa48("4338")) {
          {}
        } else {
          stryCov_9fa48("4338");
          return stryMutAct_9fa48("4339") ? {} : (stryCov_9fa48("4339"), {
            size: 0,
            hitRate: 0,
            oldestEntry: null
          });
        }
      }
      const oldestEntry = stryMutAct_9fa48("4340") ? Math.max(...entries.map(e => e.timestamp)) : (stryCov_9fa48("4340"), Math.min(...entries.map(stryMutAct_9fa48("4341") ? () => undefined : (stryCov_9fa48("4341"), e => e.timestamp))));
      const ageInHours = stryMutAct_9fa48("4342") ? (now - oldestEntry) * (1000 * 60 * 60) : (stryCov_9fa48("4342"), (stryMutAct_9fa48("4343") ? now + oldestEntry : (stryCov_9fa48("4343"), now - oldestEntry)) / (stryMutAct_9fa48("4344") ? 1000 * 60 / 60 : (stryCov_9fa48("4344"), (stryMutAct_9fa48("4345") ? 1000 / 60 : (stryCov_9fa48("4345"), 1000 * 60)) * 60)));
      return stryMutAct_9fa48("4346") ? {} : (stryCov_9fa48("4346"), {
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
  name = stryMutAct_9fa48("4347") ? "" : (stryCov_9fa48("4347"), "Google Search");
  rateLimitDelay = 1000; // 1 second between requests
  dailyLimit = 100; // Google's free tier limit

  async search(query: string, options: WebSearchOptions): Promise<WebSearchResult[]> {
    if (stryMutAct_9fa48("4348")) {
      {}
    } else {
      stryCov_9fa48("4348");
      // Implementation using Google Custom Search API
      // Requires API key: https://developers.google.com/custom-search/v1/overview
      const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
      const cx = process.env.GOOGLE_SEARCH_CX;
      if (stryMutAct_9fa48("4351") ? !apiKey && !cx : stryMutAct_9fa48("4350") ? false : stryMutAct_9fa48("4349") ? true : (stryCov_9fa48("4349", "4350", "4351"), (stryMutAct_9fa48("4352") ? apiKey : (stryCov_9fa48("4352"), !apiKey)) || (stryMutAct_9fa48("4353") ? cx : (stryCov_9fa48("4353"), !cx)))) {
        if (stryMutAct_9fa48("4354")) {
          {}
        } else {
          stryCov_9fa48("4354");
          throw new Error(stryMutAct_9fa48("4355") ? "" : (stryCov_9fa48("4355"), "Google Search API key and CX not configured"));
        }
      }
      const url = stryMutAct_9fa48("4356") ? `` : (stryCov_9fa48("4356"), `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=${stryMutAct_9fa48("4359") ? options.maxResults && 10 : stryMutAct_9fa48("4358") ? false : stryMutAct_9fa48("4357") ? true : (stryCov_9fa48("4357", "4358", "4359"), options.maxResults || 10)}`);
      const response = await fetch(url);
      const data = await response.json();
      if (stryMutAct_9fa48("4362") ? false : stryMutAct_9fa48("4361") ? true : stryMutAct_9fa48("4360") ? response.ok : (stryCov_9fa48("4360", "4361", "4362"), !response.ok)) {
        if (stryMutAct_9fa48("4363")) {
          {}
        } else {
          stryCov_9fa48("4363");
          throw new Error(stryMutAct_9fa48("4364") ? `` : (stryCov_9fa48("4364"), `Google Search API error: ${stryMutAct_9fa48("4367") ? data.error?.message && "Unknown error" : stryMutAct_9fa48("4366") ? false : stryMutAct_9fa48("4365") ? true : (stryCov_9fa48("4365", "4366", "4367"), (stryMutAct_9fa48("4368") ? data.error.message : (stryCov_9fa48("4368"), data.error?.message)) || (stryMutAct_9fa48("4369") ? "" : (stryCov_9fa48("4369"), "Unknown error")))}`));
        }
      }
      return (stryMutAct_9fa48("4372") ? data.items && [] : stryMutAct_9fa48("4371") ? false : stryMutAct_9fa48("4370") ? true : (stryCov_9fa48("4370", "4371", "4372"), data.items || (stryMutAct_9fa48("4373") ? ["Stryker was here"] : (stryCov_9fa48("4373"), [])))).map(stryMutAct_9fa48("4374") ? () => undefined : (stryCov_9fa48("4374"), (item: any) => stryMutAct_9fa48("4375") ? {} : (stryCov_9fa48("4375"), {
        title: item.title,
        url: item.link,
        snippet: stryMutAct_9fa48("4378") ? item.snippet && item.displayLink : stryMutAct_9fa48("4377") ? false : stryMutAct_9fa48("4376") ? true : (stryCov_9fa48("4376", "4377", "4378"), item.snippet || item.displayLink),
        publishedDate: stryMutAct_9fa48("4381") ? item.pagemap?.metatags?.[0]?.["article:published_time"] && item.pagemap?.metatags?.[0]?.["publishdate"] : stryMutAct_9fa48("4380") ? false : stryMutAct_9fa48("4379") ? true : (stryCov_9fa48("4379", "4380", "4381"), (stryMutAct_9fa48("4384") ? item.pagemap.metatags?.[0]?.["article:published_time"] : stryMutAct_9fa48("4383") ? item.pagemap?.metatags[0]?.["article:published_time"] : stryMutAct_9fa48("4382") ? item.pagemap?.metatags?.[0]["article:published_time"] : (stryCov_9fa48("4382", "4383", "4384"), item.pagemap?.metatags?.[0]?.[stryMutAct_9fa48("4385") ? "" : (stryCov_9fa48("4385"), "article:published_time")])) || (stryMutAct_9fa48("4388") ? item.pagemap.metatags?.[0]?.["publishdate"] : stryMutAct_9fa48("4387") ? item.pagemap?.metatags[0]?.["publishdate"] : stryMutAct_9fa48("4386") ? item.pagemap?.metatags?.[0]["publishdate"] : (stryCov_9fa48("4386", "4387", "4388"), item.pagemap?.metatags?.[0]?.[stryMutAct_9fa48("4389") ? "" : (stryCov_9fa48("4389"), "publishdate")]))),
        source: stryMutAct_9fa48("4390") ? "" : (stryCov_9fa48("4390"), "Google Search"),
        relevanceScore: 0.9
      })));
    }
  }
}
class SearXNGProvider implements WebSearchProvider {
  name = stryMutAct_9fa48("4391") ? "" : (stryCov_9fa48("4391"), "SearXNG");
  rateLimitDelay = 500; // Faster since it's local
  dailyLimit = 10000; // Much higher local limits

  private baseUrl: string;
  constructor(baseUrl: string = stryMutAct_9fa48("4392") ? "" : (stryCov_9fa48("4392"), "http://localhost:8888")) {
    if (stryMutAct_9fa48("4393")) {
      {}
    } else {
      stryCov_9fa48("4393");
      this.baseUrl = baseUrl;
    }
  }
  async search(query: string, options: WebSearchOptions): Promise<WebSearchResult[]> {
    if (stryMutAct_9fa48("4394")) {
      {}
    } else {
      stryCov_9fa48("4394");
      const params = new URLSearchParams(stryMutAct_9fa48("4395") ? {} : (stryCov_9fa48("4395"), {
        q: query,
        format: stryMutAct_9fa48("4396") ? "" : (stryCov_9fa48("4396"), "json"),
        categories: stryMutAct_9fa48("4397") ? "" : (stryCov_9fa48("4397"), "general"),
        engines: stryMutAct_9fa48("4398") ? "" : (stryCov_9fa48("4398"), "google,bing,duckduckgo,qwant,startpage"),
        ...(stryMutAct_9fa48("4401") ? options.maxResults || {
          results: options.maxResults.toString()
        } : stryMutAct_9fa48("4400") ? false : stryMutAct_9fa48("4399") ? true : (stryCov_9fa48("4399", "4400", "4401"), options.maxResults && (stryMutAct_9fa48("4402") ? {} : (stryCov_9fa48("4402"), {
          results: options.maxResults.toString()
        }))))
      }));
      const url = stryMutAct_9fa48("4403") ? `` : (stryCov_9fa48("4403"), `${this.baseUrl}/search?${params}`);
      const response = await fetch(url);
      if (stryMutAct_9fa48("4406") ? false : stryMutAct_9fa48("4405") ? true : stryMutAct_9fa48("4404") ? response.ok : (stryCov_9fa48("4404", "4405", "4406"), !response.ok)) {
        if (stryMutAct_9fa48("4407")) {
          {}
        } else {
          stryCov_9fa48("4407");
          throw new Error(stryMutAct_9fa48("4408") ? `` : (stryCov_9fa48("4408"), `SearXNG error: ${response.status} ${response.statusText}`));
        }
      }
      const data = await response.json();
      return (stryMutAct_9fa48("4411") ? data.results && [] : stryMutAct_9fa48("4410") ? false : stryMutAct_9fa48("4409") ? true : (stryCov_9fa48("4409", "4410", "4411"), data.results || (stryMutAct_9fa48("4412") ? ["Stryker was here"] : (stryCov_9fa48("4412"), [])))).map(stryMutAct_9fa48("4413") ? () => undefined : (stryCov_9fa48("4413"), (result: any) => stryMutAct_9fa48("4414") ? {} : (stryCov_9fa48("4414"), {
        title: result.title,
        url: result.url,
        snippet: result.content,
        publishedDate: result.publishedDate,
        source: stryMutAct_9fa48("4415") ? `` : (stryCov_9fa48("4415"), `SearXNG (${stryMutAct_9fa48("4418") ? result.engine && "unknown" : stryMutAct_9fa48("4417") ? false : stryMutAct_9fa48("4416") ? true : (stryCov_9fa48("4416", "4417", "4418"), result.engine || (stryMutAct_9fa48("4419") ? "" : (stryCov_9fa48("4419"), "unknown")))})`),
        relevanceScore: 0.8
      })));
    }
  }
}
class SerperSearchProvider implements WebSearchProvider {
  name = stryMutAct_9fa48("4420") ? "" : (stryCov_9fa48("4420"), "Serper");
  rateLimitDelay = 1000;
  dailyLimit = 2500;
  async search(query: string, options: WebSearchOptions): Promise<WebSearchResult[]> {
    if (stryMutAct_9fa48("4421")) {
      {}
    } else {
      stryCov_9fa48("4421");
      // Serper.dev API implementation
      const apiKey = process.env.SERPER_API_KEY;
      if (stryMutAct_9fa48("4424") ? false : stryMutAct_9fa48("4423") ? true : stryMutAct_9fa48("4422") ? apiKey : (stryCov_9fa48("4422", "4423", "4424"), !apiKey)) {
        if (stryMutAct_9fa48("4425")) {
          {}
        } else {
          stryCov_9fa48("4425");
          throw new Error(stryMutAct_9fa48("4426") ? "" : (stryCov_9fa48("4426"), "Serper API key not configured"));
        }
      }
      const url = stryMutAct_9fa48("4427") ? "" : (stryCov_9fa48("4427"), "https://google.serper.dev/search");
      const response = await fetch(url, stryMutAct_9fa48("4428") ? {} : (stryCov_9fa48("4428"), {
        method: stryMutAct_9fa48("4429") ? "" : (stryCov_9fa48("4429"), "POST"),
        headers: stryMutAct_9fa48("4430") ? {} : (stryCov_9fa48("4430"), {
          "X-API-KEY": apiKey,
          "Content-Type": stryMutAct_9fa48("4431") ? "" : (stryCov_9fa48("4431"), "application/json")
        }),
        body: JSON.stringify(stryMutAct_9fa48("4432") ? {} : (stryCov_9fa48("4432"), {
          q: query,
          num: stryMutAct_9fa48("4435") ? options.maxResults && 10 : stryMutAct_9fa48("4434") ? false : stryMutAct_9fa48("4433") ? true : (stryCov_9fa48("4433", "4434", "4435"), options.maxResults || 10),
          gl: stryMutAct_9fa48("4436") ? "" : (stryCov_9fa48("4436"), "us"),
          // Country code
          hl: stryMutAct_9fa48("4437") ? "" : (stryCov_9fa48("4437"), "en") // Language code
        }))
      }));
      if (stryMutAct_9fa48("4440") ? false : stryMutAct_9fa48("4439") ? true : stryMutAct_9fa48("4438") ? response.ok : (stryCov_9fa48("4438", "4439", "4440"), !response.ok)) {
        if (stryMutAct_9fa48("4441")) {
          {}
        } else {
          stryCov_9fa48("4441");
          throw new Error(stryMutAct_9fa48("4442") ? `` : (stryCov_9fa48("4442"), `Serper API error: ${response.status} ${response.statusText}`));
        }
      }
      const data = await response.json();
      return (stryMutAct_9fa48("4445") ? data.organic && [] : stryMutAct_9fa48("4444") ? false : stryMutAct_9fa48("4443") ? true : (stryCov_9fa48("4443", "4444", "4445"), data.organic || (stryMutAct_9fa48("4446") ? ["Stryker was here"] : (stryCov_9fa48("4446"), [])))).map(stryMutAct_9fa48("4447") ? () => undefined : (stryCov_9fa48("4447"), (result: any, index: number) => stryMutAct_9fa48("4448") ? {} : (stryCov_9fa48("4448"), {
        title: result.title,
        url: result.link,
        snippet: result.snippet,
        publishedDate: result.date,
        source: stryMutAct_9fa48("4449") ? "" : (stryCov_9fa48("4449"), "Serper"),
        relevanceScore: stryMutAct_9fa48("4450") ? 0.9 + index * 0.05 : (stryCov_9fa48("4450"), 0.9 - (stryMutAct_9fa48("4451") ? index / 0.05 : (stryCov_9fa48("4451"), index * 0.05))) // Decreasing relevance by position
      })));
    }
  }
}
class LocalWebCrawler implements WebSearchProvider {
  name = stryMutAct_9fa48("4452") ? "" : (stryCov_9fa48("4452"), "Local Web Crawler");
  rateLimitDelay = 2000; // Be respectful to websites
  dailyLimit = 500; // Conservative limit for crawling

  async search(query: string, options: WebSearchOptions): Promise<WebSearchResult[]> {
    if (stryMutAct_9fa48("4453")) {
      {}
    } else {
      stryCov_9fa48("4453");
      // This would implement a local web crawler using libraries like:
      // - Playwright for JavaScript rendering
      // - Cheerio for HTML parsing
      // - Puppeteer for browser automation

      throw new Error(stryMutAct_9fa48("4454") ? "" : (stryCov_9fa48("4454"), "Local web crawler not implemented - requires additional dependencies"));
    }
  }
}
export default WebSearchService;