import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ObsidianDatabase } from "../../src/lib/database.ts";
import { ObsidianEmbeddingService } from "../../src/lib/embeddings.ts";
import {
  ComprehensiveSearchService,
  ComprehensiveSearchQuery,
} from "../../src/lib/comprehensive-search-service.ts";
import { MultiModalIngestionPipeline } from "../../src/lib/multi-modal-ingest.ts";
import { ContentType } from "../../src/lib/multi-modal.ts";
import * as fs from "fs";
import * as path from "path";

// Use testcontainers for PostgreSQL
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";

describe("Comprehensive Search Integration Tests", () => {
  let postgresContainer: StartedPostgreSqlContainer;
  let database: ObsidianDatabase;
  let embeddings: ObsidianEmbeddingService;
  let pipeline: MultiModalIngestionPipeline;
  let searchService: ComprehensiveSearchService;

  const testFilesDir = path.join(process.cwd(), "test", "test-files");

  beforeEach(async () => {
    // Start PostgreSQL container with pgvector extension
    postgresContainer = await new PostgreSqlContainer("pgvector/pgvector:pg16")
      .withDatabase("testdb")
      .withUsername("testuser")
      .withPassword("testpass")
      .start();

    const connectionString = postgresContainer.getConnectionUri();

    // Initialize database
    database = new ObsidianDatabase(connectionString);
    await database.initialize();

    // Initialize embeddings (mock for integration tests)
    embeddings = new ObsidianEmbeddingService({
      model: "test-model",
      dimension: 768,
    });

    // Override the embedWithStrategy method for testing
    embeddings.embedWithStrategy = async (text: string) => ({
      embedding: new Array(768).fill(0.1),
      model: { name: "test-model" },
      confidence: 0.9,
    });

    // Create pipeline and search service
    pipeline = new MultiModalIngestionPipeline(database, embeddings);
    searchService = new ComprehensiveSearchService(database, embeddings);

    // Ingest test files for comprehensive testing
    if (fs.existsSync(testFilesDir)) {
      const files = fs.readdirSync(testFilesDir);
      const testFiles = files
        .filter((file) => file.match(/\.(pdf|md|txt|jpg|png|mp3|mp4|csv)$/i))
        .slice(0, 5) // Limit to 5 files for faster testing
        .map((file) => path.join(testFilesDir, file));

      if (testFiles.length > 0) {
        console.log(
          `🎯 Ingesting ${testFiles.length} test files for comprehensive search testing`
        );
        await pipeline.ingestFiles(testFiles, { batchSize: 2 });
      }
    }
  }, 60000);

  afterEach(async () => {
    if (postgresContainer) {
      await postgresContainer.stop();
    }
  });

  describe("Basic Search Mode", () => {
    it("should perform basic semantic search", async () => {
      const query: ComprehensiveSearchQuery = {
        text: "vector database search",
        mode: "basic",
        options: {
          limit: 10,
          minSimilarity: 0.1,
        },
      };

      const response = await searchService.search(query);

      expect(response).toBeDefined();
      expect(response.results).toBeDefined();
      expect(response.analytics).toBeDefined();
      expect(response.analytics.totalTime).toBeGreaterThan(0);
      expect(response.analytics.strategyScores.vector).toBe(1.0);
      expect(response.analytics.strategyScores.graph).toBe(0);

      console.log(`📊 Basic search found ${response.results.length} results`);
      console.log(`⏱️ Search completed in ${response.analytics.totalTime}ms`);
    });

    it("should handle queries with no results gracefully", async () => {
      const query: ComprehensiveSearchQuery = {
        text: "nonexistent extremely specific query that should match nothing",
        mode: "basic",
        options: {
          limit: 10,
          minSimilarity: 0.9, // High similarity threshold
        },
      };

      const response = await searchService.search(query);

      expect(response).toBeDefined();
      expect(response.results).toHaveLength(0);
      expect(response.analytics.totalTime).toBeGreaterThan(0);
    });
  });

  describe("Enhanced Search Mode", () => {
    it("should perform enhanced semantic search with entity extraction", async () => {
      const query: ComprehensiveSearchQuery = {
        text: "machine learning algorithms",
        mode: "enhanced",
        options: {
          limit: 15,
          experimental: {
            queryExpansion: true,
            entityLinking: true,
            graphRetrieval: false,
            crossModalSearch: false,
          },
          resultFormat: {
            includeScoring: true,
            includeGraphData: false,
            includeMultiModalInsights: false,
            includeQueryAnalysis: false,
          },
        },
      };

      const response = await searchService.search(query);

      expect(response).toBeDefined();
      expect(response.results).toBeDefined();
      expect(response.enhancedResults).toBeDefined();
      expect(response.analytics.strategyScores.vector).toBeGreaterThan(0.5);
      expect(response.analytics.strategyScores.entity).toBeGreaterThan(0);

      console.log(
        `🧠 Enhanced search found ${response.results.length} results`
      );
      console.log(`📈 Strategy scores:`, response.analytics.strategyScores);

      // Check that enhanced results have scoring information
      if (response.enhancedResults && response.enhancedResults.length > 0) {
        const firstResult = response.enhancedResults[0];
        expect(firstResult.scoring).toBeDefined();
        expect(firstResult.scoring.combined).toBeGreaterThan(0);

        console.log(`📊 First result scoring:`, firstResult.scoring);
      }
    });
  });

  describe("Graph Search Mode", () => {
    it("should perform graph-enhanced search with relationship analysis", async () => {
      const query: ComprehensiveSearchQuery = {
        text: "data processing pipeline",
        mode: "graph",
        options: {
          limit: 20,
          experimental: {
            queryExpansion: true,
            entityLinking: true,
            graphRetrieval: true,
            crossModalSearch: false,
          },
          resultFormat: {
            includeScoring: true,
            includeGraphData: true,
            includeMultiModalInsights: false,
            includeQueryAnalysis: false,
          },
        },
      };

      const response = await searchService.search(query);

      expect(response).toBeDefined();
      expect(response.results).toBeDefined();
      expect(response.knowledgeInsights).toBeDefined();
      expect(response.analytics.strategyScores.graph).toBe(1.0);

      console.log(`🕸️ Graph search found ${response.results.length} results`);

      if (response.knowledgeInsights) {
        console.log(
          `🔍 Key entities found: ${response.knowledgeInsights.keyEntities.length}`
        );
        console.log(
          `🔗 Key relationships found: ${response.knowledgeInsights.keyRelationships.length}`
        );
        console.log(
          `🎯 Content clusters: ${response.knowledgeInsights.clusters.length}`
        );

        // Verify knowledge insights structure
        expect(response.knowledgeInsights.keyEntities).toBeInstanceOf(Array);
        expect(response.knowledgeInsights.keyRelationships).toBeInstanceOf(
          Array
        );
        expect(response.knowledgeInsights.clusters).toBeInstanceOf(Array);
      }
    });
  });

  describe("Multi-Modal Search Mode", () => {
    it("should perform multi-modal search across different content types", async () => {
      const query: ComprehensiveSearchQuery = {
        text: "document analysis",
        mode: "multi_modal",
        options: {
          limit: 25,
          experimental: {
            queryExpansion: true,
            entityLinking: false,
            graphRetrieval: false,
            crossModalSearch: true,
          },
          resultFormat: {
            includeScoring: true,
            includeGraphData: false,
            includeMultiModalInsights: true,
            includeQueryAnalysis: false,
          },
        },
      };

      const response = await searchService.search(query);

      expect(response).toBeDefined();
      expect(response.results).toBeDefined();
      expect(response.multiModalAnalysis).toBeDefined();
      expect(response.analytics.strategyScores.multiModal).toBe(1.0);

      console.log(
        `🎭 Multi-modal search found ${response.results.length} results`
      );

      if (response.multiModalAnalysis) {
        console.log(
          `📊 Content distribution:`,
          response.multiModalAnalysis.contentDistribution
        );
        console.log(
          `⭐ Quality distribution:`,
          response.multiModalAnalysis.qualityDistribution
        );
        console.log(
          `🔗 Cross-modal correlations: ${response.multiModalAnalysis.correlations}`
        );

        // Verify multi-modal analysis structure
        expect(response.multiModalAnalysis.contentDistribution).toBeDefined();
        expect(response.multiModalAnalysis.qualityDistribution).toBeDefined();
        expect(typeof response.multiModalAnalysis.correlations).toBe("number");
      }
    });

    it("should filter results by content type", async () => {
      const query: ComprehensiveSearchQuery = {
        text: "content",
        mode: "multi_modal",
        options: {
          limit: 10,
          fileTypes: [ContentType.PDF, ContentType.RASTER_IMAGE],
          experimental: {
            crossModalSearch: true,
            queryExpansion: false,
            entityLinking: false,
            graphRetrieval: false,
          },
        },
      };

      const response = await searchService.search(query);

      expect(response).toBeDefined();
      expect(response.results).toBeDefined();

      // Check that results contain only specified content types
      response.results.forEach((result) => {
        const contentType =
          result.meta?.contentType || result.meta?.multiModalFile?.contentType;
        if (contentType) {
          expect([
            ContentType.PDF,
            ContentType.RASTER_IMAGE,
            "pdf",
            "image",
          ]).toContain(contentType);
        }
      });

      console.log(
        `🎯 Filtered multi-modal search found ${response.results.length} results`
      );
    });
  });

  describe("Comprehensive Search Mode", () => {
    it("should perform comprehensive search using all capabilities", async () => {
      const query: ComprehensiveSearchQuery = {
        text: "artificial intelligence and machine learning concepts",
        mode: "comprehensive",
        options: {
          limit: 30,
          experimental: {
            queryExpansion: true,
            entityLinking: true,
            graphRetrieval: true,
            crossModalSearch: true,
          },
          resultFormat: {
            includeScoring: true,
            includeGraphData: true,
            includeMultiModalInsights: true,
            includeQueryAnalysis: true,
          },
          performance: {
            maxSearchTime: 30000, // 30 seconds
            useCache: false,
            parallel: true,
          },
        },
      };

      const response = await searchService.search(query);

      expect(response).toBeDefined();
      expect(response.results).toBeDefined();
      expect(response.enhancedResults).toBeDefined();
      expect(response.knowledgeInsights).toBeDefined();
      expect(response.multiModalAnalysis).toBeDefined();
      expect(response.queryAnalysis).toBeDefined();
      expect(response.analytics.totalTime).toBeLessThan(30000);

      console.log(
        `🚀 Comprehensive search found ${response.results.length} results`
      );
      console.log(`⏱️ Total time: ${response.analytics.totalTime}ms`);
      console.log(`🔧 Time breakdown:`, response.analytics.timeBreakdown);
      console.log(
        `📈 Strategy effectiveness:`,
        response.analytics.strategyScores
      );

      // Verify all strategy scores are reasonable
      expect(response.analytics.strategyScores.vector).toBeGreaterThan(0.5);
      expect(response.analytics.strategyScores.graph).toBeGreaterThan(0.3);
      expect(response.analytics.strategyScores.entity).toBeGreaterThan(0.3);
      expect(response.analytics.strategyScores.multiModal).toBeGreaterThan(0.2);

      // Verify query analysis
      if (response.queryAnalysis) {
        expect(response.queryAnalysis.intent).toBeDefined();
        expect(response.queryAnalysis.complexity).toBeGreaterThan(0);
        expect(response.queryAnalysis.refinements).toBeInstanceOf(Array);

        console.log(`🧠 Query analysis:`, {
          intent: response.queryAnalysis.intent,
          complexity: response.queryAnalysis.complexity,
          refinements: response.queryAnalysis.refinements.length,
        });
      }
    });

    it("should handle complex queries with multiple entities and relationships", async () => {
      const query: ComprehensiveSearchQuery = {
        text: "neural networks in computer vision for image classification tasks",
        mode: "comprehensive",
        options: {
          limit: 20,
          experimental: {
            queryExpansion: true,
            entityLinking: true,
            graphRetrieval: true,
            crossModalSearch: true,
          },
        },
      };

      const response = await searchService.search(query);

      expect(response).toBeDefined();
      expect(response.results).toBeDefined();

      console.log(
        `🎯 Complex query search found ${response.results.length} results`
      );

      // Check for entity extraction in enhanced results
      if (response.enhancedResults && response.enhancedResults.length > 0) {
        const entitiesFound = response.enhancedResults.some(
          (result) => result.entities && result.entities.length > 0
        );

        if (entitiesFound) {
          console.log(`✅ Entity extraction working in enhanced results`);
        }
      }

      // Check for graph insights
      if (
        response.knowledgeInsights &&
        response.knowledgeInsights.keyEntities.length > 0
      ) {
        console.log(
          `📊 Top entities:`,
          response.knowledgeInsights.keyEntities.slice(0, 3)
        );
      }
    });
  });

  describe("Caching and Performance", () => {
    it("should cache repeated queries when caching is enabled", async () => {
      const query: ComprehensiveSearchQuery = {
        text: "cached query test",
        mode: "basic",
        options: {
          limit: 5,
          performance: {
            useCache: true,
            maxSearchTime: 10000,
            parallel: true,
          },
        },
      };

      // First search
      const start1 = Date.now();
      const response1 = await searchService.search(query);
      const time1 = Date.now() - start1;

      expect(response1).toBeDefined();

      // Second search (should be cached)
      const start2 = Date.now();
      const response2 = await searchService.search(query);
      const time2 = Date.now() - start2;

      expect(response2).toBeDefined();
      expect(time2).toBeLessThan(time1); // Cached response should be faster

      console.log(`🚀 First search: ${time1}ms, Cached search: ${time2}ms`);

      // Verify cache stats
      const cacheStats = searchService.getCacheStats();
      expect(cacheStats.size).toBeGreaterThan(0);

      console.log(`💾 Cache stats:`, cacheStats);
    });

    it("should clear cache when requested", async () => {
      const query: ComprehensiveSearchQuery = {
        text: "cache clear test",
        mode: "basic",
        options: {
          performance: {
            useCache: true,
            maxSearchTime: 10000,
            parallel: true,
          },
        },
      };

      // Perform search to populate cache
      await searchService.search(query);

      // Verify cache has content
      let cacheStats = searchService.getCacheStats();
      expect(cacheStats.size).toBeGreaterThan(0);

      // Clear cache
      searchService.clearCache();

      // Verify cache is empty
      cacheStats = searchService.getCacheStats();
      expect(cacheStats.size).toBe(0);

      console.log(`🧹 Cache cleared successfully`);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid search modes gracefully", async () => {
      const query = {
        text: "test query",
        mode: "invalid_mode",
      };

      await expect(searchService.search(query)).rejects.toThrow();
    });

    it("should handle empty queries gracefully", async () => {
      const query: ComprehensiveSearchQuery = {
        text: "",
        mode: "basic",
      };

      const response = await searchService.search(query);

      expect(response).toBeDefined();
      expect(response.results).toBeDefined();
      // Empty query should still return some results (or empty array)
    });
  });
});
