/**
 * Web Search Service
 *
 * Integrates external web search capabilities to augment the knowledge base
 * with current information from the internet.
 *
 * @author @darianrosebrook
 */

import { ObsidianEmbeddingService } from "./embeddings";

// Add fetch polyfill for Node.js
import fetch from "node-fetch";
import { URLSearchParams } from "url";

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
  private cache: Map<
    string,
    { results: WebSearchResult[]; timestamp: number }
  > = new Map();
  private readonly cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  constructor(embeddingService: ObsidianEmbeddingService) {
    this.embeddingService = embeddingService;
    this.initializeProviders();
  }

  enableSearXNG(baseUrl?: string): void {
    const searxngProvider = new SearXNGProvider(baseUrl);
    this.providers.set("searxng", searxngProvider);
    console.log(
      `🔍 Enabled SearXNG provider at ${baseUrl || "http://localhost:8888"}`
    );
  }

  enableGoogleSearch(apiKey: string, cx: string): void {
    // Store credentials for the provider
    process.env.GOOGLE_SEARCH_API_KEY = apiKey;
    process.env.GOOGLE_SEARCH_CX = cx;
    this.providers.set("google", new GoogleSearchProvider());
    console.log("🔍 Enabled Google Custom Search provider");
  }

  enableSerper(apiKey: string): void {
    process.env.SERPER_API_KEY = apiKey;
    this.providers.set("serper", new SerperSearchProvider());
    console.log("🔍 Enabled Serper provider");
  }

  private initializeProviders() {
    // Mock providers for demonstration - in production, implement real APIs
    this.providers.set("mock", {
      name: "Mock Search",
      rateLimitDelay: 100,
      async search(
        query: string,
        options: WebSearchOptions
      ): Promise<WebSearchResult[]> {
        // Simulate web search with mock data
        const mockResults: WebSearchResult[] = [
          {
            title: `Latest ${query} Information`,
            url: `https://example.com/search?q=${encodeURIComponent(query)}`,
            snippet: `This is a simulated search result for "${query}". In a real implementation, this would be actual web content from search engines.`,
            publishedDate: new Date().toISOString(),
            source: "Mock Search Engine",
            relevanceScore: 0.9,
          },
          {
            title: `${query} - Wikipedia`,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(
              query.replace(/\s+/g, "_")
            )}`,
            snippet: `Wikipedia page about ${query}. Contains comprehensive information and references.`,
            publishedDate: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            source: "Wikipedia",
            relevanceScore: 0.8,
          },
          {
            title: `Recent News about ${query}`,
            url: `https://news.example.com/search?q=${encodeURIComponent(
              query
            )}`,
            snippet: `Latest news articles and updates related to ${query} from various news sources.`,
            publishedDate: new Date(
              Date.now() - 2 * 60 * 60 * 1000
            ).toISOString(),
            source: "News Aggregator",
            relevanceScore: 0.7,
          },
        ];

        // Apply filters
        let filteredResults = mockResults;
        if (options.minRelevanceScore) {
          filteredResults = filteredResults.filter(
            (r) => r.relevanceScore >= options.minRelevanceScore!
          );
        }

        if (options.maxResults) {
          filteredResults = filteredResults.slice(0, options.maxResults);
        }

        return filteredResults;
      },
    });

    // In a real implementation, you would add actual providers:
    // this.providers.set('google', new GoogleSearchProvider());
    // this.providers.set('bing', new BingSearchProvider());
    // this.providers.set('serper', new SerperSearchProvider());
  }

  async search(
    query: string,
    options: WebSearchOptions = {}
  ): Promise<WebSearchResult[]> {
    const cacheKey = `${query}:${JSON.stringify(options)}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log(`📋 Using cached web search results for: ${query}`);
      return cached.results;
    }

    const searchPromises: Promise<WebSearchResult[]>[] = [];

    // Use all available providers
    for (const [providerName, provider] of Array.from(
      this.providers.entries()
    )) {
      searchPromises.push(
        provider.search(query, options).then((results) => {
          // Add provider name to results
          return results.map((result) => ({
            ...result,
            source: `${result.source} (${providerName})`,
          }));
        })
      );
    }

    try {
      const allResults = await Promise.all(searchPromises);
      let combinedResults: WebSearchResult[] = [];

      // Combine and deduplicate results
      for (const results of allResults) {
        combinedResults.push(...results);
      }

      // Remove duplicates based on URL
      combinedResults = combinedResults.filter(
        (result, index, self) =>
          index === self.findIndex((r) => r.url === result.url)
      );

      // Sort by relevance score
      combinedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Limit results
      const maxResults = options.maxResults || 10;
      combinedResults = combinedResults.slice(0, maxResults);

      // Generate embeddings for results
      const resultsWithEmbeddings = await this.addEmbeddingsToResults(
        combinedResults
      );

      // Cache the results
      this.cache.set(cacheKey, {
        results: resultsWithEmbeddings,
        timestamp: Date.now(),
      });

      console.log(
        `🌐 Web search completed for "${query}": ${resultsWithEmbeddings.length} results`
      );
      return resultsWithEmbeddings;
    } catch (error) {
      console.error("Web search failed:", error);
      throw new Error(
        `Web search failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async addEmbeddingsToResults(
    results: WebSearchResult[]
  ): Promise<WebSearchResult[]> {
    const textsToEmbed = results.map((r) => `${r.title}\n${r.snippet}`);

    try {
      const embeddings = await this.embeddingService.embedBatch(textsToEmbed);

      return results.map((result, index) => ({
        ...result,
        embedding: embeddings[index],
      }));
    } catch (error) {
      console.warn("Failed to generate embeddings for web results:", error);
      // Return results without embeddings
      return results;
    }
  }

  async searchWithContext(
    query: string,
    context: string[],
    options: WebSearchOptions = {}
  ): Promise<WebSearchResult[]> {
    // Create an enhanced query that includes context
    const enhancedQuery =
      context.length > 0 ? `${query} (context: ${context.join(", ")})` : query;

    return this.search(enhancedQuery, options);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getProviderInfo(providerName: string): WebSearchProvider | undefined {
    return this.providers.get(providerName);
  }

  clearCache(): void {
    this.cache.clear();
    console.log("🗑️  Web search cache cleared");
  }

  getCacheStats(): {
    size: number;
    hitRate: number;
    oldestEntry: number | null;
  } {
    const entries = Array.from(this.cache.values());
    const now = Date.now();

    if (entries.length === 0) {
      return { size: 0, hitRate: 0, oldestEntry: null };
    }

    const oldestEntry = Math.min(...entries.map((e) => e.timestamp));
    const ageInHours = (now - oldestEntry) / (1000 * 60 * 60);

    return {
      size: entries.length,
      hitRate: 0, // Would need to track hits vs misses for accurate rate
      oldestEntry: ageInHours,
    };
  }
}

// Example real provider implementations (commented out for demo)
class GoogleSearchProvider implements WebSearchProvider {
  name = "Google Search";
  rateLimitDelay = 1000; // 1 second between requests
  dailyLimit = 100; // Google's free tier limit

  async search(
    query: string,
    options: WebSearchOptions
  ): Promise<WebSearchResult[]> {
    // Implementation using Google Custom Search API
    // Requires API key: https://developers.google.com/custom-search/v1/overview
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;

    if (!apiKey || !cx) {
      throw new Error("Google Search API key and CX not configured");
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(
      query
    )}&num=${options.maxResults || 10}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Google Search API error: ${data.error?.message || "Unknown error"}`
      );
    }

    return (data.items || []).map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet || item.displayLink,
      publishedDate:
        item.pagemap?.metatags?.[0]?.["article:published_time"] ||
        item.pagemap?.metatags?.[0]?.["publishdate"],
      source: "Google Search",
      relevanceScore: 0.9,
    }));
  }
}

class SearXNGProvider implements WebSearchProvider {
  name = "SearXNG";
  rateLimitDelay = 500; // Faster since it's local
  dailyLimit = 10000; // Much higher local limits

  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:8888") {
    this.baseUrl = baseUrl;
  }

  async search(
    query: string,
    options: WebSearchOptions
  ): Promise<WebSearchResult[]> {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      categories: "general",
      engines: "google,bing,duckduckgo,qwant,startpage",
      ...(options.maxResults && { results: options.maxResults.toString() }),
    });

    const url = `${this.baseUrl}/search?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `SearXNG error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    return (data.results || []).map((result: any) => ({
      title: result.title,
      url: result.url,
      snippet: result.content,
      publishedDate: result.publishedDate,
      source: `SearXNG (${result.engine || "unknown"})`,
      relevanceScore: 0.8,
    }));
  }
}

class SerperSearchProvider implements WebSearchProvider {
  name = "Serper";
  rateLimitDelay = 1000;
  dailyLimit = 2500;

  async search(
    query: string,
    options: WebSearchOptions
  ): Promise<WebSearchResult[]> {
    // Serper.dev API implementation
    const apiKey = process.env.SERPER_API_KEY;

    if (!apiKey) {
      throw new Error("Serper API key not configured");
    }

    const url = "https://google.serper.dev/search";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        num: options.maxResults || 10,
        gl: "us", // Country code
        hl: "en", // Language code
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Serper API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    return (data.organic || []).map((result: any, index: number) => ({
      title: result.title,
      url: result.link,
      snippet: result.snippet,
      publishedDate: result.date,
      source: "Serper",
      relevanceScore: 0.9 - index * 0.05, // Decreasing relevance by position
    }));
  }
}

class LocalWebCrawler implements WebSearchProvider {
  name = "Local Web Crawler";
  rateLimitDelay = 2000; // Be respectful to websites
  dailyLimit = 500; // Conservative limit for crawling

  async search(
    query: string,
    options: WebSearchOptions
  ): Promise<WebSearchResult[]> {
    // This would implement a local web crawler using libraries like:
    // - Playwright for JavaScript rendering
    // - Cheerio for HTML parsing
    // - Puppeteer for browser automation

    throw new Error(
      "Local web crawler not implemented - requires additional dependencies"
    );
  }
}

export default WebSearchService;
