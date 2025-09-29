/**
 * Search Routes
 *
 * Handles all search-related HTTP endpoints including basic search,
 * strategic search, rationale generation, and explain endpoints.
 */

import { FastifyInstance } from "fastify";
import type { SearchRequest, SearchResponse } from "../../types/index";

/**
 * Register search routes
 */
export function registerSearchRoutes(server: FastifyInstance): void {
  /**
   * Basic search endpoint
   */
  server.post("/search", async (request, reply): Promise<SearchResponse> => {
    const { searchService } = request.server.services;
    const searchRequest = request.body as SearchRequest;

    try {
      const searchResponse = await searchService.search(searchRequest.query, {
        limit: searchRequest.limit || 10,
        searchMode: searchRequest.searchMode || "comprehensive",
        includeRelated: searchRequest.includeRelated !== false,
        maxRelated: searchRequest.maxRelated || 3,
        fileTypes: searchRequest.fileTypes,
        tags: searchRequest.tags,
        folders: searchRequest.folders,
        minSimilarity: searchRequest.minSimilarity || 0.1,
        dateRange: searchRequest.dateRange
          ? {
              start: searchRequest.dateRange.start
                ? new Date(searchRequest.dateRange.start)
                : undefined,
              end: searchRequest.dateRange.end
                ? new Date(searchRequest.dateRange.end)
                : undefined,
            }
          : undefined,
      });

      reply.code(200);
      return searchResponse;
    } catch (e) {
      const error = e as Error;
      console.error("Search failed:", error);
      reply.code(500);
      return {
        query: searchRequest.query,
        results: [],
        totalFound: 0,
        facets: {},
        graphInsights: {
          queryConcepts: [],
          relatedConcepts: [],
          knowledgeClusters: [],
        },
        error: error.message,
      };
    }
  });

  /**
   * Strategic search endpoint (alias for search)
   */
  server.post(
    "/search/strategic",
    async (request, reply): Promise<SearchResponse> => {
      const { searchService } = request.server.services;
      const searchRequest = request.body as SearchRequest;

      try {
        const searchResponse = await searchService.search(searchRequest.query, {
          limit: searchRequest.limit || 10,
          searchMode: searchRequest.searchMode || "comprehensive",
          includeRelated: searchRequest.includeRelated !== false,
          maxRelated: searchRequest.maxRelated || 3,
          fileTypes: searchRequest.fileTypes,
          tags: searchRequest.tags,
          folders: searchRequest.folders,
          minSimilarity: searchRequest.minSimilarity || 0.1,
          dateRange: searchRequest.dateRange
            ? {
                start: searchRequest.dateRange.start
                  ? new Date(searchRequest.dateRange.start)
                  : undefined,
                end: searchRequest.dateRange.end
                  ? new Date(searchRequest.dateRange.end)
                  : undefined,
              }
            : undefined,
        });

        reply.code(200);
        return searchResponse;
      } catch (e) {
        const error = e as Error;
        console.error("Strategic search failed:", error);
        reply.code(500);
        return {
          query: searchRequest.query,
          results: [],
          totalFound: 0,
          facets: {},
          graphInsights: {
            queryConcepts: [],
            relatedConcepts: [],
            knowledgeClusters: [],
          },
          error: error.message,
        };
      }
    }
  );

  /**
   * Search with rationales endpoint
   */
  server.post("/search/rationale", async (request, reply) => {
    const { searchService } = request.server.services;
    const {
      query,
      limit = 10,
      includeContent = false,
    } = request.body as {
      query: string;
      limit?: number;
      includeContent?: boolean;
    };

    try {
      const searchResponse = await searchService.search(query, {
        limit,
        searchMode: "comprehensive",
        includeRelated: true,
        maxRelated: 5,
      });

      // Add rationale information to results
      const resultsWithRationales = searchResponse.results.map((result) => ({
        ...result,
        rationale: `Found via comprehensive search for "${query}". Score: ${result.score}`,
        content: includeContent ? result.content : undefined,
      }));

      reply.code(200);
      return {
        ...searchResponse,
        results: resultsWithRationales,
        rationale: `Comprehensive search across ${searchResponse.totalFound} documents`,
      };
    } catch (e) {
      const error = e as Error;
      console.error("Search with rationale failed:", error);
      reply.code(500);
      return {
        error: "Search failed",
        message: error.message,
      };
    }
  });

  /**
   * Explain endpoint
   */
  server.post("/search/explain", async (request, reply) => {
    const { searchService } = request.server.services;
    const { query, limit = 5 } = request.body as {
      query: string;
      limit?: number;
    };

    try {
      const searchResponse = await searchService.search(query, {
        limit,
        searchMode: "comprehensive",
        includeRelated: true,
        maxRelated: 3,
      });

      // Generate explanation for the search
      const explanation = {
        query: query,
        strategy: "comprehensive",
        totalResults: searchResponse.totalFound,
        searchCriteria: {
          limit,
          mode: "comprehensive",
          includeRelated: true,
        },
        reasoning: `Performed comprehensive search across all indexed documents for query "${query}". Found ${searchResponse.totalFound} results.`,
        results: searchResponse.results.map((result, index) => ({
          rank: index + 1,
          title: result.title,
          score: result.score,
          rationale: `Matched query "${query}" with relevance score ${result.score}`,
        })),
      };

      reply.code(200);
      return explanation;
    } catch (e) {
      const error = e as Error;
      console.error("Search explain failed:", error);
      reply.code(500);
      return {
        error: "Explanation generation failed",
        message: error.message,
      };
    }
  });
}
