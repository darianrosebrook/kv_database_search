import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  FederatedSearchSystem,
  FederatedQuery,
  FederatedSystem,
  SystemStatus,
  SystemCapabilities,
  SystemType,
  SearchQuery,
  FederatedSearchResult,
  RoutingStrategy,
  AggregationStrategy,
  ConflictResolutionStrategy,
  PerformanceRequirements,
  QueryMetadata,
  SearchResult,
  SystemHealth,
  SystemStatistics,
  SystemAdapter,
  SystemChange,
} from "../../src/lib/federated-search";

describe("FederatedSearchSystem", () => {
  let federatedSearch: FederatedSearchSystem;
  let mockDatabase: any;

  // Helper function to create mock FederatedSystem
  function createMockFederatedSystem(
    id: string,
    name: string,
    status: "active" | "inactive" | "error" | "maintenance" = "active"
  ): FederatedSystem {
    return {
      id,
      name,
      type: {
        category: "database",
        subtype: "postgresql",
        version: "14.0",
        vendor: "PostgreSQL",
      } as SystemType,
      status: {
        current: status,
        lastHealthCheck: new Date(),
        uptime: 86400000,
        errorCount: 0,
      } as SystemStatus,
      capabilities: {
        searchTypes: ["vector", "lexical", "hybrid"],
        queryComplexity: "complex",
        maxResults: 1000,
        supportedFilters: ["equals", "contains", "range"],
        aggregationSupport: true,
        realTimeSync: true,
        batchProcessing: true,
      } as SystemCapabilities,
      connection: {
        endpoint: "http://localhost:5432",
        authentication: {
          type: "basic",
          credentials: {},
        },
        connectionPool: {
          minConnections: 1,
          maxConnections: 10,
          idleTimeout: 30000,
          maxLifetime: 3600000,
        },
        timeout: 5000,
        retryPolicy: {
          maxRetries: 3,
          backoffStrategy: "exponential",
          baseDelay: 100,
          maxDelay: 5000,
        },
        rateLimits: {
          requestsPerSecond: 100,
          requestsPerMinute: 6000,
          requestsPerHour: 360000,
          burstLimit: 200,
        },
      },
      schema: {
        entities: [],
        relationships: [],
        properties: [],
        constraints: [],
        mappings: [],
      },
      reliability: {
        availability: 0.99,
        meanTimeBetweenFailures: 720,
        meanTimeToRecovery: 1,
        errorRate: 0.01,
        dataConsistency: 0.99,
      },
      performance: {
        averageQueryTime: 50,
        throughput: 100,
        concurrentUsers: 50,
        memoryUsage: 512,
        cpuUsage: 30,
      },
      metadata: {
        description: "Mock system",
        owner: "test",
        createdAt: new Date(),
        lastModified: new Date(),
        version: "1.0",
        tags: [],
        documentation: "",
      },
    };
  }

  // Helper function to create mock FederatedQuery
  function createMockFederatedQuery(
    queryText: string,
    systemIds: string[] = ["system-1"]
  ): FederatedQuery {
    return {
      id: "query-123",
      query: {
        text: queryText,
        filters: [],
        sorting: [],
        pagination: {
          offset: 0,
          limit: 10,
        },
        facets: [],
        highlights: [],
        context: {},
      } as SearchQuery,
      systems: systemIds,
      routingStrategy: {
        type: "broadcast",
        criteria: {},
        fallbackStrategy: {
          type: "best_effort",
          timeout: 5000,
          retryCount: 3,
        },
      } as RoutingStrategy,
      aggregationStrategy: {
        type: "merge",
        deduplication: {
          method: "exact",
          similarityThreshold: 0.9,
          fields: ["id"],
        },
        ranking: {
          type: "relevance",
          weights: {},
          systemWeight: 1.0,
        },
        cutoff: 0.5,
      } as AggregationStrategy,
      conflictResolution: {
        type: "confidence",
        confidenceThreshold: 0.8,
        authorityWeights: {},
        conflictTypes: [],
      } as ConflictResolutionStrategy,
      performanceRequirements: {
        maxLatency: 5000,
        minThroughput: 10,
        maxResourceUsage: 80,
        priority: "medium",
      } as PerformanceRequirements,
      metadata: {
        submittedAt: new Date(),
        estimatedComplexity: "medium",
        expectedSystems: systemIds,
        userContext: "test",
        businessValue: 5,
      } as QueryMetadata,
    };
  }

  beforeEach(() => {
    mockDatabase = {
      query: vi.fn(),
      close: vi.fn(),
    };

    federatedSearch = new FederatedSearchSystem(mockDatabase);
  });

  describe("Constructor", () => {
    it("should create a new FederatedSearchSystem instance", () => {
      expect(federatedSearch).toBeInstanceOf(FederatedSearchSystem);
    });

    it("should initialize with a database", () => {
      expect((federatedSearch as any).database).toBe(mockDatabase);
    });

    it("should initialize system registry", () => {
      expect((federatedSearch as any).systemRegistry).toBeDefined();
    });

    it("should initialize query router", () => {
      expect((federatedSearch as any).queryRouter).toBeDefined();
    });

    it("should initialize result aggregator", () => {
      expect((federatedSearch as any).resultAggregator).toBeDefined();
    });

    it("should initialize conflict resolver", () => {
      expect((federatedSearch as any).conflictResolver).toBeDefined();
    });

    it("should initialize performance monitor", () => {
      expect((federatedSearch as any).performanceMonitor).toBeDefined();
    });
  });

  describe("Query Validation", () => {
    it("should reject empty query text", async () => {
      const query = createMockFederatedQuery("");

      await expect(
        federatedSearch.executeFederatedSearch(query)
      ).rejects.toThrow("Query text is required for federated search");
    });

    it("should reject whitespace-only query text", async () => {
      const query = createMockFederatedQuery("   ");

      await expect(
        federatedSearch.executeFederatedSearch(query)
      ).rejects.toThrow("Query text is required for federated search");
    });

    it("should reject query with unregistered system", async () => {
      const query = createMockFederatedQuery("test query", ["nonexistent"]);

      // Mock getAvailableSystems to return empty array
      vi.spyOn(
        (federatedSearch as any).systemRegistry,
        "getAvailableSystems"
      ).mockResolvedValue([]);

      await expect(
        federatedSearch.executeFederatedSearch(query)
      ).rejects.toThrow("Requested system 'nonexistent' is not registered");
    });

    it("should reject query with inactive system", async () => {
      const query = createMockFederatedQuery("test query", ["system-1"]);
      const inactiveSystem = createMockFederatedSystem(
        "system-1",
        "Test System",
        "inactive"
      );

      vi.spyOn(
        (federatedSearch as any).systemRegistry,
        "getAvailableSystems"
      ).mockResolvedValue([inactiveSystem]);

      await expect(
        federatedSearch.executeFederatedSearch(query)
      ).rejects.toThrow("System 'system-1' is not active");
    });

    it("should reject query with unreliable system", async () => {
      const query = createMockFederatedQuery("test query", ["system-1"]);
      const unreliableSystem = createMockFederatedSystem(
        "system-1",
        "Test System",
        "active"
      );
      unreliableSystem.reliability.availability = 0.5; // Below threshold

      vi.spyOn(
        (federatedSearch as any).systemRegistry,
        "getAvailableSystems"
      ).mockResolvedValue([unreliableSystem]);

      await expect(
        federatedSearch.executeFederatedSearch(query)
      ).rejects.toThrow("System 'system-1' reliability below threshold");
    });

    it("should reject query with insufficient max latency", async () => {
      const query = createMockFederatedQuery("test query", ["system-1"]);
      query.performanceRequirements.maxLatency = 50; // Below 100ms minimum
      const mockSystem = createMockFederatedSystem(
        "system-1",
        "Test System",
        "active"
      );

      vi.spyOn(
        (federatedSearch as any).systemRegistry,
        "getAvailableSystems"
      ).mockResolvedValue([mockSystem]);

      await expect(
        federatedSearch.executeFederatedSearch(query)
      ).rejects.toThrow(
        "Maximum latency must be at least 100ms for federated queries"
      );
    });
  });

  describe("Federated Search Execution", () => {
    it("should execute federated search successfully", async () => {
      const query = createMockFederatedQuery("test query", ["system-1"]);
      const mockSystem = createMockFederatedSystem(
        "system-1",
        "Test System",
        "active"
      );

      // Mock system registry methods
      vi.spyOn(
        (federatedSearch as any).systemRegistry,
        "getAvailableSystems"
      ).mockResolvedValue([mockSystem]);
      vi.spyOn(
        (federatedSearch as any).systemRegistry,
        "getSystem"
      ).mockResolvedValue(mockSystem);

      // Mock query router
      vi.spyOn(
        (federatedSearch as any).queryRouter,
        "routeQuery"
      ).mockResolvedValue({
        selectedSystems: ["system-1"],
        availableSystems: ["system-1"],
        routingStrategy: query.routingStrategy,
      });

      const result = await federatedSearch.executeFederatedSearch(query);

      expect(result).toBeDefined();
      expect(result.queryId).toBe(query.id);
      expect(result.totalResults).toBeGreaterThanOrEqual(0);
      expect(result.results).toBeInstanceOf(Array);
      expect(result.performance).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it("should handle system failures gracefully", async () => {
      const query = createMockFederatedQuery("test query", ["system-1"]);
      const mockSystem = createMockFederatedSystem(
        "system-1",
        "Test System",
        "active"
      );

      // Mock system registry
      vi.spyOn(
        (federatedSearch as any).systemRegistry,
        "getAvailableSystems"
      ).mockResolvedValue([mockSystem]);
      vi.spyOn(
        (federatedSearch as any).systemRegistry,
        "getSystem"
      ).mockRejectedValue(new Error("System connection failed"));

      // Mock query router
      vi.spyOn(
        (federatedSearch as any).queryRouter,
        "routeQuery"
      ).mockResolvedValue({
        selectedSystems: ["system-1"],
        availableSystems: ["system-1"],
        routingStrategy: query.routingStrategy,
      });

      const result = await federatedSearch.executeFederatedSearch(query);

      expect(result).toBeDefined();
      expect(result.performance.systemsFailed).toBeGreaterThan(0);
    });
  });

  describe("Query Adaptation", () => {
    it("should adapt query filters for system schema", () => {
      const query: SearchQuery = {
        text: "test",
        filters: [
          {
            field: "title",
            operator: "contains",
            value: "test",
          },
        ],
        sorting: [],
        pagination: { offset: 0, limit: 10 },
        facets: [],
        highlights: [],
        context: {},
      };

      const system = createMockFederatedSystem("system-1", "Test System");
      system.schema.mappings = [
        {
          localEntity: "title",
          foreignEntity: "document_title",
          foreignSystem: "system-1",
          mappingType: "direct",
          transformationRules: [],
          confidence: 1.0,
        },
      ];

      const adaptedQuery = (federatedSearch as any).adaptQueryForSystem(
        query,
        system
      );

      expect(adaptedQuery.filters[0].field).toBe("document_title");
    });

    it("should preserve filters without mappings", () => {
      const query: SearchQuery = {
        text: "test",
        filters: [
          {
            field: "content",
            operator: "contains",
            value: "test",
          },
        ],
        sorting: [],
        pagination: { offset: 0, limit: 10 },
        facets: [],
        highlights: [],
        context: {},
      };

      const system = createMockFederatedSystem("system-1", "Test System");
      system.schema.mappings = [];

      const adaptedQuery = (federatedSearch as any).adaptQueryForSystem(
        query,
        system
      );

      expect(adaptedQuery.filters[0].field).toBe("content");
    });
  });

  describe("Field Mapping", () => {
    it("should find field mapping for cross-system compatibility", () => {
      const system = createMockFederatedSystem("system-1", "Test System");
      system.schema.mappings = [
        {
          localEntity: "title",
          foreignEntity: "doc_title",
          foreignSystem: "system-1",
          mappingType: "direct",
          transformationRules: [],
          confidence: 1.0,
        },
      ];

      const mapping = (federatedSearch as any).findFieldMapping(
        "title",
        system
      );

      expect(mapping).toBe("doc_title");
    });

    it("should return null for unmapped fields", () => {
      const system = createMockFederatedSystem("system-1", "Test System");
      system.schema.mappings = [];

      const mapping = (federatedSearch as any).findFieldMapping(
        "unknown_field",
        system
      );

      expect(mapping).toBeNull();
    });
  });

  describe("Timeout Handling", () => {
    it("should execute promise within timeout", async () => {
      const promise = Promise.resolve("success");
      const result = await (federatedSearch as any).executeWithTimeout(
        promise,
        1000
      );

      expect(result).toBe("success");
    });

    it("should reject promise that exceeds timeout", async () => {
      const promise = new Promise((resolve) => setTimeout(resolve, 2000));

      await expect(
        (federatedSearch as any).executeWithTimeout(promise, 100)
      ).rejects.toThrow("Query timeout");
    });
  });

  describe("Performance Metrics", () => {
    it("should calculate performance metrics correctly", () => {
      const startTime = Date.now() - 1000; // 1 second ago
      const systemResults = [
        {
          systemId: "system-1",
          results: [],
          success: true,
          executionTime: 500,
        },
        {
          systemId: "system-2",
          results: [],
          success: false,
          executionTime: 200,
          error: "Connection failed",
        },
      ];

      const metrics = (federatedSearch as any).calculatePerformanceMetrics(
        startTime,
        systemResults,
        { selectedSystems: ["system-1", "system-2"] }
      );

      expect(metrics.totalTime).toBeGreaterThan(0);
      expect(metrics.systemTimes["system-1"]).toBe(500);
      expect(metrics.systemTimes["system-2"]).toBe(200);
      expect(metrics.systemsContacted).toBe(2);
      expect(metrics.systemsFailed).toBe(1);
    });
  });

  describe("Performance Validation", () => {
    it("should validate performance requirements", () => {
      const performance = {
        totalTime: 500,
        systemTimes: {},
        routingTime: 50,
        aggregationTime: 30,
        conflictResolutionTime: 20,
        systemsContacted: 1,
        systemsFailed: 0,
        bytesTransferred: 1024,
      };

      const requirements: PerformanceRequirements = {
        maxLatency: 1000,
        minThroughput: 10,
        maxResourceUsage: 80,
        priority: "medium",
      };

      expect(() =>
        (federatedSearch as any).validatePerformanceRequirements(
          performance,
          requirements
        )
      ).not.toThrow();
    });

    it("should throw error when latency exceeds requirements", () => {
      const performance = {
        totalTime: 2000,
        systemTimes: {},
        routingTime: 50,
        aggregationTime: 30,
        conflictResolutionTime: 20,
        systemsContacted: 1,
        systemsFailed: 0,
        bytesTransferred: 1024,
      };

      const requirements: PerformanceRequirements = {
        maxLatency: 1000,
        minThroughput: 10,
        maxResourceUsage: 80,
        priority: "medium",
      };

      expect(() =>
        (federatedSearch as any).validatePerformanceRequirements(
          performance,
          requirements
        )
      ).toThrow("Query exceeded maximum latency");
    });
  });

  describe("Facet Generation", () => {
    it("should generate facets from results", () => {
      const results: SearchResult[] = [
        {
          id: "result-1",
          title: "Test 1",
          content: "Content 1",
          score: 0.9,
          sourceSystem: "system-1",
          sourceEntity: "entity-1",
          highlights: [],
          metadata: {
            relevanceScore: 0.9,
            authority: 0.8,
            completeness: 0.95,
          },
          provenance: {
            sourceSystem: "system-1",
            sourceId: "source-1",
            retrievedAt: new Date(),
            confidence: 0.9,
            validationStatus: "validated",
            processingSteps: [],
          },
          conflicts: [],
        },
        {
          id: "result-2",
          title: "Test 2",
          content: "Content 2",
          score: 0.85,
          sourceSystem: "system-1",
          sourceEntity: "entity-2",
          highlights: [],
          metadata: {
            relevanceScore: 0.85,
            authority: 0.8,
            completeness: 0.9,
          },
          provenance: {
            sourceSystem: "system-1",
            sourceId: "source-2",
            retrievedAt: new Date(),
            confidence: 0.85,
            validationStatus: "validated",
            processingSteps: [],
          },
          conflicts: [],
        },
      ];

      const facets = (federatedSearch as any).generateFacets(results);

      expect(facets).toBeInstanceOf(Array);
      expect(facets.length).toBeGreaterThan(0);
      expect(facets[0]).toHaveProperty("field");
      expect(facets[0]).toHaveProperty("values");
      expect(facets[0]).toHaveProperty("totalCount");
    });

    it("should handle empty results", () => {
      const facets = (federatedSearch as any).generateFacets([]);

      expect(facets).toEqual([]);
    });
  });

  describe("Suggestion Generation", () => {
    it("should generate search suggestions", () => {
      const query = createMockFederatedQuery("test");
      const results: SearchResult[] = [
        {
          id: "result-1",
          title: "Machine Learning Tutorial",
          content: "Learn machine learning with practical examples",
          score: 0.9,
          sourceSystem: "system-1",
          sourceEntity: "entity-1",
          highlights: [],
          metadata: { completeness: 0.95 },
          provenance: {
            sourceSystem: "system-1",
            sourceId: "source-1",
            retrievedAt: new Date(),
            confidence: 0.9,
            validationStatus: "validated",
            processingSteps: [],
          },
          conflicts: [],
        },
      ];

      const suggestions = (federatedSearch as any).generateSuggestions(
        query,
        results
      );

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeLessThanOrEqual(5);
      if (suggestions.length > 0) {
        expect(suggestions[0]).toHaveProperty("type");
        expect(suggestions[0]).toHaveProperty("text");
        expect(suggestions[0]).toHaveProperty("confidence");
        expect(suggestions[0]).toHaveProperty("source");
      }
    });
  });

  describe("Common Term Extraction", () => {
    it("should extract common terms from results", () => {
      const results: SearchResult[] = [
        {
          id: "result-1",
          title: "Machine Learning Tutorial",
          content: "Learn machine learning basics",
          score: 0.9,
          sourceSystem: "system-1",
          sourceEntity: "entity-1",
          highlights: [],
          metadata: { completeness: 0.95 },
          provenance: {
            sourceSystem: "system-1",
            sourceId: "source-1",
            retrievedAt: new Date(),
            confidence: 0.9,
            validationStatus: "validated",
            processingSteps: [],
          },
          conflicts: [],
        },
        {
          id: "result-2",
          title: "Machine Learning Advanced",
          content: "Advanced machine learning techniques",
          score: 0.85,
          sourceSystem: "system-1",
          sourceEntity: "entity-2",
          highlights: [],
          metadata: { completeness: 0.9 },
          provenance: {
            sourceSystem: "system-1",
            sourceId: "source-2",
            retrievedAt: new Date(),
            confidence: 0.85,
            validationStatus: "validated",
            processingSteps: [],
          },
          conflicts: [],
        },
        {
          id: "result-3",
          title: "Machine Learning Essentials",
          content: "Essential machine learning concepts",
          score: 0.8,
          sourceSystem: "system-1",
          sourceEntity: "entity-3",
          highlights: [],
          metadata: { completeness: 0.88 },
          provenance: {
            sourceSystem: "system-1",
            sourceId: "source-3",
            retrievedAt: new Date(),
            confidence: 0.8,
            validationStatus: "validated",
            processingSteps: [],
          },
          conflicts: [],
        },
      ];

      const terms = (federatedSearch as any).extractCommonTerms(results);

      expect(terms).toBeInstanceOf(Array);
      expect(terms).toContain("machine");
      expect(terms).toContain("learning");
    });

    it("should filter out short terms", () => {
      const results: SearchResult[] = [
        {
          id: "result-1",
          title: "A is the first letter",
          content: "A is a vowel",
          score: 0.9,
          sourceSystem: "system-1",
          sourceEntity: "entity-1",
          highlights: [],
          metadata: { completeness: 0.95 },
          provenance: {
            sourceSystem: "system-1",
            sourceId: "source-1",
            retrievedAt: new Date(),
            confidence: 0.9,
            validationStatus: "validated",
            processingSteps: [],
          },
          conflicts: [],
        },
      ];

      const terms = (federatedSearch as any).extractCommonTerms(results);

      expect(terms).not.toContain("a");
      expect(terms).not.toContain("is");
    });
  });

  describe("Quality Calculations", () => {
    it("should calculate result quality", () => {
      const results: SearchResult[] = [
        {
          id: "result-1",
          title: "Test 1",
          content: "Content 1",
          score: 0.9,
          sourceSystem: "system-1",
          sourceEntity: "entity-1",
          highlights: [],
          metadata: { completeness: 0.95 },
          provenance: {
            sourceSystem: "system-1",
            sourceId: "source-1",
            retrievedAt: new Date(),
            confidence: 0.9,
            validationStatus: "validated",
            processingSteps: [],
          },
          conflicts: [],
        },
        {
          id: "result-2",
          title: "Test 2",
          content: "Content 2",
          score: 0.8,
          sourceSystem: "system-1",
          sourceEntity: "entity-2",
          highlights: [],
          metadata: { completeness: 0.9 },
          provenance: {
            sourceSystem: "system-1",
            sourceId: "source-2",
            retrievedAt: new Date(),
            confidence: 0.8,
            validationStatus: "validated",
            processingSteps: [],
          },
          conflicts: [],
        },
      ];

      const quality = (federatedSearch as any).calculateResultQuality(results);

      expect(quality).toBeCloseTo(0.85, 5); // Average of 0.9 and 0.8
    });

    it("should return 0 for empty results", () => {
      const quality = (federatedSearch as any).calculateResultQuality([]);

      expect(quality).toBe(0);
    });

    it("should calculate system coverage", () => {
      const routingResult = {
        selectedSystems: ["system-1", "system-2"],
        availableSystems: ["system-1", "system-2", "system-3", "system-4"],
      };

      const coverage = (federatedSearch as any).calculateSystemCoverage(
        routingResult
      );

      expect(coverage).toBe(50); // 2/4 = 50%
    });

    it("should calculate data freshness", () => {
      const now = new Date();
      const results: SearchResult[] = [
        {
          id: "result-1",
          title: "Test 1",
          content: "Content 1",
          score: 0.9,
          sourceSystem: "system-1",
          sourceEntity: "entity-1",
          highlights: [],
          metadata: { completeness: 0.95 },
          provenance: {
            sourceSystem: "system-1",
            sourceId: "source-1",
            retrievedAt: now,
            confidence: 0.9,
            validationStatus: "validated",
            processingSteps: [],
          },
          conflicts: [],
        },
      ];

      const freshness = (federatedSearch as any).calculateDataFreshness(
        results
      );

      expect(freshness).toBeGreaterThan(0.99); // Very fresh data
      expect(freshness).toBeLessThanOrEqual(1);
    });

    it("should calculate result completeness", () => {
      const results: SearchResult[] = [
        {
          id: "result-1",
          title: "Test 1",
          content: "Content 1",
          score: 0.9,
          sourceSystem: "system-1",
          sourceEntity: "entity-1",
          highlights: [],
          metadata: { completeness: 0.9 },
          provenance: {
            sourceSystem: "system-1",
            sourceId: "source-1",
            retrievedAt: new Date(),
            confidence: 0.9,
            validationStatus: "validated",
            processingSteps: [],
          },
          conflicts: [],
        },
        {
          id: "result-2",
          title: "Test 2",
          content: "Content 2",
          score: 0.8,
          sourceSystem: "system-1",
          sourceEntity: "entity-2",
          highlights: [],
          metadata: { completeness: 0.8 },
          provenance: {
            sourceSystem: "system-1",
            sourceId: "source-2",
            retrievedAt: new Date(),
            confidence: 0.8,
            validationStatus: "validated",
            processingSteps: [],
          },
          conflicts: [],
        },
      ];

      const completeness = (federatedSearch as any).calculateResultCompleteness(
        results
      );

      expect(completeness).toBeCloseTo(0.85, 5); // Average of 0.9 and 0.8
    });

    it("should return 0 completeness for empty results", () => {
      const completeness = (federatedSearch as any).calculateResultCompleteness(
        []
      );

      expect(completeness).toBe(0);
    });
  });
});
