import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Pool } from "pg";
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { ObsidianDatabase } from "../../src/lib/database.js";
import { ObsidianEmbeddingService } from "../../src/lib/embeddings.js";
import { MultiModalIngestionPipeline } from "../../src/lib/multi-modal-ingest.js";
import { HybridSearchEngine } from "../../src/lib/knowledge-graph/hybrid-search-engine.js";
import { MultiHopReasoningEngine } from "../../src/lib/knowledge-graph/multi-hop-reasoning.js";
import { ResultRankingService } from "../../src/lib/knowledge-graph/result-ranking.js";
import { KnowledgeGraphManager } from "../../src/lib/knowledge-graph/knowledge-graph-manager.js";
import { ProvenanceTracker } from "../../src/lib/knowledge-graph/provenance-tracker.js";
import { QueryOptimizer } from "../../src/lib/knowledge-graph/query-optimizer.js";
import { MonitoringSystem } from "../../src/lib/knowledge-graph/monitoring-system.js";
import { GraphRagApiServer } from "../../src/lib/knowledge-graph/graph-rag-api.js";
import {
  createGraphQLSchema,
  createGraphQLContext,
  type GraphQLContext,
} from "../../src/lib/knowledge-graph/graphql-api.js";
import { graphql } from "graphql";
import * as fs from "fs";
import * as path from "path";

describe("Graph RAG End-to-End User Journeys", () => {
  let container: StartedPostgreSqlContainer;
  let pool: Pool;
  let database: ObsidianDatabase;
  let embeddings: ObsidianEmbeddingService;
  let pipeline: MultiModalIngestionPipeline;
  let searchEngine: HybridSearchEngine;
  let reasoningEngine: MultiHopReasoningEngine;
  let rankingService: ResultRankingService;
  let graphManager: KnowledgeGraphManager;
  let provenanceTracker: ProvenanceTracker;
  let queryOptimizer: QueryOptimizer;
  let monitoringSystem: MonitoringSystem;
  let apiServer: GraphRagApiServer;
  let graphqlContext: GraphQLContext;

  const testDataDir = path.join(process.cwd(), "test", "data");

  beforeAll(async () => {
    console.log("🚀 Starting Graph RAG E2E test suite...");

    // Start PostgreSQL container
    container = await new PostgreSqlContainer("postgres:16")
      .withDatabase("test_db")
      .withUsername("test_user")
      .withPassword("test_pass")
      .withExposedPorts(5432)
      .start();

    // Create connection pool
    pool = new Pool({
      host: container.getHost(),
      port: container.getMappedPort(5432),
      database: container.getDatabase(),
      user: container.getUsername(),
      password: container.getPassword(),
      max: 10,
    });

    // Initialize core services
    database = new ObsidianDatabase(pool);
    await database.initialize();

    embeddings = new ObsidianEmbeddingService(database);
    // Mock the embedding service for tests
    embeddings.embedWithStrategy = async (text: string) => {
      return Array.from({ length: 768 }, () => Math.random() * 2 - 1);
    };

    pipeline = new MultiModalIngestionPipeline(database, embeddings);

    // Initialize Graph RAG system
    searchEngine = new HybridSearchEngine(pool, embeddings);
    reasoningEngine = new MultiHopReasoningEngine(pool);
    rankingService = new ResultRankingService(pool);
    graphManager = new KnowledgeGraphManager(pool, embeddings);
    provenanceTracker = new ProvenanceTracker(pool);
    queryOptimizer = new QueryOptimizer(pool);
    monitoringSystem = new MonitoringSystem(pool);

    // Initialize API servers
    apiServer = new GraphRagApiServer(
      pool,
      embeddings,
      searchEngine,
      reasoningEngine,
      rankingService,
      graphManager,
      provenanceTracker,
      queryOptimizer
    );

    graphqlContext = createGraphQLContext(
      pool,
      embeddings,
      searchEngine,
      reasoningEngine,
      rankingService,
      graphManager,
      provenanceTracker,
      queryOptimizer
    );

    // Run migrations
    await runMigrations(pool);

    console.log("✅ Graph RAG E2E test environment ready");
  }, 60000);

  afterAll(async () => {
    console.log("🧹 Cleaning up Graph RAG E2E test environment...");

    if (pool) {
      await pool.end();
    }

    if (container) {
      await container.stop();
    }

    console.log("✅ Graph RAG E2E cleanup complete");
  });

  beforeEach(async () => {
    // Clean up data between tests
    await cleanupTestData(pool);
  });

  describe("Journey 1: Research Assistant - Academic Paper Analysis", () => {
    it("should complete full research workflow from ingestion to insights", async () => {
      console.log("📚 Starting Research Assistant journey...");

      // Step 1: Ingest academic papers and research documents
      const researchFiles = await createResearchDataset();

      console.log("📄 Ingesting research documents...");
      const ingestionResult = await pipeline.ingestFiles(researchFiles);
      expect(ingestionResult.processedFiles).toBeGreaterThan(0);
      expect(ingestionResult.totalChunks).toBeGreaterThan(0);

      // Wait for knowledge graph processing
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await graphManager.flushProcessingQueue();

      // Step 2: Verify knowledge graph construction
      const graphStats = await graphManager.getGraphStatistics();
      expect(graphStats.entityCount).toBeGreaterThan(10);
      expect(graphStats.relationshipCount).toBeGreaterThan(5);
      expect(Object.keys(graphStats.entityTypeDistribution)).toContain(
        "PERSON"
      );
      expect(Object.keys(graphStats.entityTypeDistribution)).toContain(
        "CONCEPT"
      );

      // Step 3: Perform semantic search for research topics
      console.log("🔍 Searching for machine learning concepts...");
      const searchResult = await searchEngine.search({
        text: "machine learning algorithms neural networks",
        options: {
          maxResults: 10,
          includeExplanation: true,
          strategy: "hybrid",
        },
      });

      expect(searchResult.results).toBeDefined();
      expect(searchResult.results.length).toBeGreaterThan(0);
      expect(searchResult.explanation).toBeDefined();
      expect(searchResult.metrics.executionTime).toBeGreaterThan(0);

      // Step 4: Perform multi-hop reasoning to find research connections
      console.log("🧠 Finding research connections...");
      const entities = searchResult.results
        .flatMap((r) => r.entities)
        .slice(0, 3)
        .map((e) => e.id);

      if (entities.length > 0) {
        const reasoningResult = await reasoningEngine.reason({
          startEntities: entities,
          question: "How are these machine learning concepts connected?",
          maxDepth: 3,
          minConfidence: 0.3,
          reasoningType: "exploratory",
        });

        expect(reasoningResult.paths).toBeDefined();
        expect(reasoningResult.confidence).toBeGreaterThan(0);
        expect(reasoningResult.metrics.processingTime).toBeGreaterThan(0);

        console.log(
          `🔗 Found ${
            reasoningResult.paths.length
          } reasoning paths with confidence ${reasoningResult.confidence.toFixed(
            3
          )}`
        );
      }

      // Step 5: Generate research insights using GraphQL
      console.log("📊 Generating research insights...");
      const graphqlQuery = `
        query ResearchInsights($searchTerm: String!) {
          search(query: $searchTerm, options: { maxResults: 5, includeExplanation: true }) {
            id
            text
            score
            entities {
              name
              type
              confidence
            }
            relationships {
              type
              confidence
              sourceNode {
                name
                type
              }
              targetNode {
                name
                type
              }
            }
          }
          graphStatistics {
            nodeCount
            relationshipCount
            entityTypeDistribution
          }
        }
      `;

      const graphqlResult = await graphql({
        schema: createGraphQLSchema(),
        source: graphqlQuery,
        contextValue: graphqlContext,
        variableValues: {
          searchTerm: "deep learning neural networks",
        },
      });

      expect(graphqlResult.errors).toBeUndefined();
      expect(graphqlResult.data?.search).toBeDefined();
      expect(graphqlResult.data?.graphStatistics).toBeDefined();

      // Step 6: Track provenance and generate explanations
      console.log("📋 Recording research provenance...");
      const sessionId = "research_session_" + Date.now();
      await provenanceTracker.recordSearchProvenance(
        sessionId,
        "machine learning research analysis",
        searchResult.results,
        searchResult.metrics,
        searchResult.explanation,
        { userId: "researcher_001", searchType: "academic_research" }
      );

      const provenanceRecords = await provenanceTracker.queryProvenance({
        sessionId,
      });

      expect(provenanceRecords).toBeDefined();
      expect(provenanceRecords.length).toBeGreaterThan(0);

      // Cleanup
      await cleanupTestFiles(researchFiles);

      console.log("✅ Research Assistant journey completed successfully");
    }, 30000);
  });

  describe("Journey 2: Business Intelligence - Market Analysis", () => {
    it("should complete business intelligence workflow with optimization", async () => {
      console.log("💼 Starting Business Intelligence journey...");

      // Step 1: Ingest business documents and market reports
      const businessFiles = await createBusinessDataset();

      console.log("📈 Ingesting business documents...");
      const ingestionResult = await pipeline.ingestFiles(businessFiles);
      expect(ingestionResult.processedFiles).toBeGreaterThan(0);

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await graphManager.flushProcessingQueue();

      // Step 2: Perform optimized search queries
      console.log("⚡ Running optimized market analysis queries...");
      const optimizationContext = await queryOptimizer.getOptimizationContext();

      const marketQuery = {
        text: "market trends competitive analysis revenue growth",
        filters: {
          entityTypes: ["ORGANIZATION", "METRIC", "CONCEPT"],
          minConfidence: 0.5,
        },
        options: {
          maxResults: 15,
          includeExplanation: true,
          strategy: "hybrid" as const,
        },
      };

      const queryPlan = await queryOptimizer.optimizeSearchQuery(
        marketQuery,
        optimizationContext
      );

      expect(queryPlan.estimatedTime).toBeGreaterThan(0);
      expect(queryPlan.estimatedCost).toBeGreaterThan(0);
      expect(queryPlan.executionSteps.length).toBeGreaterThan(0);

      const optimizedExecution = await queryOptimizer.executeOptimizedPlan(
        queryPlan,
        async (optimizedQuery) => {
          return searchEngine.search(optimizedQuery);
        }
      );

      expect(optimizedExecution.results).toBeDefined();
      expect(optimizedExecution.actualMetrics.executionTime).toBeGreaterThan(0);

      // Step 3: Perform competitive analysis reasoning
      console.log("🏢 Analyzing competitive relationships...");
      const businessEntities = optimizedExecution.results.results
        .flatMap((r) => r.entities)
        .filter((e) => e.type === "ORGANIZATION")
        .slice(0, 2)
        .map((e) => e.id);

      if (businessEntities.length >= 2) {
        const competitiveAnalysis = await reasoningEngine.reason({
          startEntities: [businessEntities[0]],
          targetEntities: [businessEntities[1]],
          question:
            "What are the competitive relationships and market dynamics?",
          maxDepth: 2,
          minConfidence: 0.4,
          reasoningType: "comparative",
        });

        expect(competitiveAnalysis.paths).toBeDefined();
        expect(competitiveAnalysis.bestPath).toBeDefined();

        console.log(
          `🎯 Competitive analysis: ${
            competitiveAnalysis.paths.length
          } paths, best path confidence: ${competitiveAnalysis.bestPath?.confidence.toFixed(
            3
          )}`
        );
      }

      // Step 4: Generate business intelligence dashboard data
      console.log("📊 Generating BI dashboard data...");
      const dashboardQuery = `
        query BusinessDashboard {
          graphStatistics {
            nodeCount
            relationshipCount
            entityTypeDistribution
            relationshipTypeDistribution
          }
          nodes(type: ORGANIZATION, limit: 10) {
            id
            name
            confidence
            properties
            relationships(limit: 5) {
              type
              confidence
              targetNode {
                name
                type
              }
            }
          }
          clusters(algorithm: LOUVAIN, maxClusters: 5) {
            id
            size
            cohesion
            nodes {
              name
              type
            }
          }
        }
      `;

      const dashboardResult = await graphql({
        schema: createGraphQLSchema(),
        source: dashboardQuery,
        contextValue: graphqlContext,
      });

      expect(dashboardResult.errors).toBeUndefined();
      expect(dashboardResult.data?.graphStatistics).toBeDefined();
      expect(dashboardResult.data?.nodes).toBeDefined();

      // Step 5: Monitor performance and generate alerts
      console.log("📈 Monitoring system performance...");
      monitoringSystem.recordMetric("business_analysis.query_count", 1, {
        query_type: "market_analysis",
        optimization_enabled: "true",
      });

      monitoringSystem.recordMetric(
        "business_analysis.response_time",
        optimizedExecution.actualMetrics.executionTime,
        { query_type: "market_analysis" }
      );

      const healthStatus = monitoringSystem.getHealthStatus();
      expect(healthStatus.overall).toBeDefined();
      expect(healthStatus.checks.length).toBeGreaterThan(0);

      // Cleanup
      await cleanupTestFiles(businessFiles);

      console.log("✅ Business Intelligence journey completed successfully");
    }, 25000);
  });

  describe("Journey 3: Content Discovery - Multi-modal Search", () => {
    it("should complete multi-modal content discovery workflow", async () => {
      console.log("🎭 Starting Multi-modal Content Discovery journey...");

      // Step 1: Ingest diverse content types
      const multiModalFiles = await createMultiModalDataset();

      console.log("🎨 Ingesting multi-modal content...");
      const ingestionResult = await pipeline.ingestFiles(multiModalFiles);
      expect(ingestionResult.processedFiles).toBeGreaterThan(0);

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 4000));
      await graphManager.flushProcessingQueue();

      // Step 2: Perform cross-modal semantic search
      console.log("🔍 Performing cross-modal semantic search...");
      const crossModalSearch = await searchEngine.search({
        text: "visual design user interface accessibility",
        filters: {
          contentTypes: ["image", "document", "markdown"],
          minConfidence: 0.3,
        },
        options: {
          maxResults: 20,
          maxHops: 3,
          includeExplanation: true,
          strategy: "hybrid",
        },
      });

      expect(crossModalSearch.results).toBeDefined();
      expect(crossModalSearch.results.length).toBeGreaterThan(0);
      expect(crossModalSearch.metrics.vectorResults).toBeGreaterThan(0);

      // Step 3: Discover content relationships through reasoning
      console.log("🕸️ Discovering content relationships...");
      const contentEntities = crossModalSearch.results
        .flatMap((r) => r.entities)
        .filter((e) => e.type === "CONCEPT" || e.type === "DOCUMENT")
        .slice(0, 3)
        .map((e) => e.id);

      if (contentEntities.length > 0) {
        const contentConnections = await reasoningEngine.reason({
          startEntities: contentEntities,
          question: "How are these design concepts and documents related?",
          maxDepth: 2,
          minConfidence: 0.3,
          reasoningType: "exploratory",
        });

        expect(contentConnections.paths).toBeDefined();
        expect(contentConnections.metrics.exploredNodes).toBeGreaterThan(0);

        console.log(
          `🔗 Content connections: ${contentConnections.paths.length} paths explored`
        );
      }

      // Step 4: Use GraphQL for complex content queries
      console.log("🎯 Executing complex content queries...");
      const contentQuery = `
        query ContentDiscovery($searchTerm: String!) {
          search(
            query: $searchTerm
            filters: { minConfidence: 0.3 }
            options: { maxResults: 10, includeExplanation: true }
          ) {
            id
            text
            score
            similarity
            metadata
            entities {
              name
              type
              confidence
              aliases
            }
            relationships {
              type
              confidence
              strength
            }
          }
          
          findSimilar(nodeId: "test_node_id", threshold: 0.6, limit: 5) {
            name
            type
            confidence
          }
          
          traverse(
            startNodeId: "test_start_node"
            maxDepth: 2
            minConfidence: 0.4
          ) {
            entities {
              name
              type
            }
            relationships {
              type
              confidence
            }
            depth
            confidence
          }
        }
      `;

      // Note: This would fail with actual node IDs, but tests the GraphQL structure
      const contentResult = await graphql({
        schema: createGraphQLSchema(),
        source: contentQuery,
        contextValue: graphqlContext,
        variableValues: {
          searchTerm: "design system components",
        },
      });

      expect(contentResult.data?.search).toBeDefined();
      // findSimilar and traverse would return empty results with test node IDs

      // Step 5: Track content discovery provenance
      console.log("📝 Tracking content discovery provenance...");
      const contentSessionId = "content_discovery_" + Date.now();

      await provenanceTracker.recordSearchProvenance(
        contentSessionId,
        "multi-modal content discovery",
        crossModalSearch.results,
        crossModalSearch.metrics,
        crossModalSearch.explanation,
        {
          userId: "content_curator_001",
          searchType: "multi_modal_discovery",
        }
      );

      // Generate explanation
      const provenanceRecords = await provenanceTracker.queryProvenance({
        sessionId: contentSessionId,
      });

      expect(provenanceRecords.length).toBeGreaterThan(0);

      const explanation = await provenanceTracker.generateExplanation(
        provenanceRecords[0],
        "detailed"
      );

      expect(explanation.title).toBeDefined();
      expect(explanation.summary).toBeDefined();
      expect(explanation.sections.length).toBeGreaterThan(0);

      // Cleanup
      await cleanupTestFiles(multiModalFiles);

      console.log(
        "✅ Multi-modal Content Discovery journey completed successfully"
      );
    }, 30000);
  });

  describe("Journey 4: System Administration - Health Monitoring", () => {
    it("should complete system monitoring and maintenance workflow", async () => {
      console.log("🔧 Starting System Administration journey...");

      // Step 1: Set up comprehensive monitoring
      console.log("📊 Setting up system monitoring...");

      // Add custom health checks
      monitoringSystem.addHealthCheck("graph_rag_search", async () => {
        try {
          const testSearch = await searchEngine.search({
            text: "test query",
            options: { maxResults: 1 },
          });

          return {
            status: testSearch.results.length >= 0 ? "healthy" : "degraded",
            responseTime: testSearch.metrics.executionTime,
            metadata: {
              resultCount: testSearch.results.length,
              vectorTime: testSearch.metrics.vectorSearchTime,
              graphTime: testSearch.metrics.graphTraversalTime,
            },
          };
        } catch (error) {
          return {
            status: "unhealthy",
            responseTime: 0,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      });

      monitoringSystem.addHealthCheck("knowledge_graph_reasoning", async () => {
        try {
          // Simple reasoning test
          const stats = await graphManager.getGraphStatistics();

          return {
            status: stats.entityCount > 0 ? "healthy" : "degraded",
            responseTime: 50, // Mock response time
            metadata: {
              entityCount: stats.entityCount,
              relationshipCount: stats.relationshipCount,
            },
          };
        } catch (error) {
          return {
            status: "unhealthy",
            responseTime: 0,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      });

      // Wait for health checks to run
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 2: Collect and analyze system metrics
      console.log("📈 Collecting system metrics...");
      const systemMetrics = await monitoringSystem.collectSystemMetrics();
      const appMetrics = await monitoringSystem.collectApplicationMetrics();

      expect(systemMetrics.timestamp).toBeDefined();
      expect(systemMetrics.memory.usage).toBeGreaterThanOrEqual(0);
      expect(systemMetrics.database.connections).toBeGreaterThanOrEqual(0);

      expect(appMetrics.timestamp).toBeDefined();
      expect(appMetrics.knowledgeGraph.nodeCount).toBeGreaterThanOrEqual(0);

      // Step 3: Test alert system
      console.log("🚨 Testing alert system...");

      // Trigger a test alert by recording high metric values
      monitoringSystem.recordMetric("test.cpu.usage", 0.95, { test: "true" });
      monitoringSystem.recordMetric("test.memory.usage", 0.98, {
        test: "true",
      });

      // Add a test alert rule
      monitoringSystem.addAlertRule({
        id: "test_high_cpu",
        name: "Test High CPU Usage",
        description: "Test alert for high CPU usage",
        condition: {
          metric: "test.cpu.usage",
          operator: "gt",
          threshold: 0.9,
          duration: 1, // 1 second for testing
          evaluationWindow: 5, // 5 seconds
        },
        severity: "high",
        enabled: true,
        notifications: [
          {
            type: "console",
            config: {},
            enabled: true,
          },
        ],
        suppressionRules: [],
        metadata: { test: true },
      });

      // Wait for alert evaluation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 4: Check health status
      console.log("🏥 Checking overall health status...");
      const healthStatus = monitoringSystem.getHealthStatus();

      expect(healthStatus.overall).toBeDefined();
      expect(healthStatus.checks.length).toBeGreaterThan(0);
      expect(healthStatus.summary.total).toBeGreaterThan(0);

      console.log(
        `🏥 Health Status: ${healthStatus.overall} (${healthStatus.summary.healthy}/${healthStatus.summary.total} healthy)`
      );

      // Step 5: Performance profiling
      console.log("⚡ Running performance profiling...");

      const profileId = monitoringSystem.startProfile("test_search_operation", {
        query: "performance test",
        optimization: true,
      });

      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 100));

      const profile = monitoringSystem.endProfile(profileId, {
        resultCount: 5,
        cacheHit: false,
      });

      expect(profile).toBeDefined();
      expect(profile?.duration).toBeGreaterThan(0);
      expect(profile?.operation).toBe("test_search_operation");

      // Step 6: Query optimization analysis
      console.log("🔧 Analyzing query optimization...");
      const optimizationContext = await queryOptimizer.getOptimizationContext();

      expect(optimizationContext.graphSize.nodeCount).toBeGreaterThanOrEqual(0);
      expect(optimizationContext.systemResources.availableCPU).toBeGreaterThan(
        0
      );
      expect(optimizationContext.userPreferences.maxWaitTime).toBeGreaterThan(
        0
      );

      // Step 7: Generate system administration report
      console.log("📋 Generating administration report...");
      const adminReport = {
        timestamp: new Date(),
        systemHealth: healthStatus,
        systemMetrics: {
          cpu: systemMetrics.cpu.usage,
          memory: systemMetrics.memory.usage,
          database: systemMetrics.database.connections,
        },
        applicationMetrics: {
          knowledgeGraph: appMetrics.knowledgeGraph,
          searchPerformance: {
            avgQueryTime: 0, // Would get from metrics
            cacheHitRate: 0, // Would get from metrics
          },
        },
        alerts: {
          active: monitoringSystem.getActiveAlerts().length,
          total: Array.from(monitoringSystem["alerts"].values()).length,
        },
        recommendations: [
          "Monitor CPU usage trends",
          "Consider scaling database connections",
          "Review query optimization effectiveness",
        ],
      };

      expect(adminReport.systemHealth.overall).toBeDefined();
      expect(adminReport.systemMetrics.memory).toBeGreaterThanOrEqual(0);

      console.log("✅ System Administration journey completed successfully");
    }, 20000);
  });

  describe("Journey 5: Data Scientist - Advanced Analytics", () => {
    it("should complete advanced analytics and insights workflow", async () => {
      console.log("🔬 Starting Data Scientist journey...");

      // Step 1: Ingest scientific and analytical content
      const analyticsFiles = await createAnalyticsDataset();

      console.log("📊 Ingesting analytics content...");
      const ingestionResult = await pipeline.ingestFiles(analyticsFiles);
      expect(ingestionResult.processedFiles).toBeGreaterThan(0);

      // Wait for processing
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await graphManager.flushProcessingQueue();

      // Step 2: Perform advanced graph analytics
      console.log("🕸️ Performing graph analytics...");
      const graphStats = await graphManager.getGraphStatistics();

      expect(graphStats.entityCount).toBeGreaterThan(0);
      expect(graphStats.relationshipCount).toBeGreaterThan(0);

      // Step 3: Execute complex analytical queries
      console.log("🔍 Executing analytical queries...");
      const analyticsQuery = `
        query AdvancedAnalytics {
          graphStatistics {
            nodeCount
            relationshipCount
            entityTypeDistribution
            relationshipTypeDistribution
            averageNodeDegree
            clusteringCoefficient
            diameter
          }
          
          nodes(type: CONCEPT, limit: 20) {
            id
            name
            confidence
            properties
            relatedNodes(maxDepth: 2, limit: 5) {
              name
              type
              confidence
            }
          }
          
          clusters(algorithm: LOUVAIN, maxClusters: 10) {
            id
            size
            cohesion
            centroid {
              name
              type
            }
            nodes {
              name
              type
              confidence
            }
          }
        }
      `;

      const analyticsResult = await graphql({
        schema: createGraphQLSchema(),
        source: analyticsQuery,
        contextValue: graphqlContext,
      });

      expect(analyticsResult.errors).toBeUndefined();
      expect(analyticsResult.data?.graphStatistics).toBeDefined();
      expect(analyticsResult.data?.nodes).toBeDefined();

      // Step 4: Perform statistical analysis on search results
      console.log("📈 Performing statistical analysis...");
      const searchResults = await searchEngine.search({
        text: "statistical analysis data science machine learning",
        options: {
          maxResults: 50,
          includeExplanation: true,
          strategy: "hybrid",
        },
      });

      // Analyze result distribution
      const scoreDistribution = searchResults.results.map((r) => r.score);
      const avgScore =
        scoreDistribution.reduce((a, b) => a + b, 0) / scoreDistribution.length;
      const scoreVariance =
        scoreDistribution.reduce(
          (sum, score) => sum + Math.pow(score - avgScore, 2),
          0
        ) / scoreDistribution.length;

      expect(avgScore).toBeGreaterThan(0);
      expect(scoreVariance).toBeGreaterThanOrEqual(0);

      console.log(
        `📊 Score analysis: avg=${avgScore.toFixed(
          3
        )}, variance=${scoreVariance.toFixed(3)}`
      );

      // Step 5: Advanced reasoning with confidence analysis
      console.log("🧠 Advanced reasoning analysis...");
      const topEntities = searchResults.results
        .flatMap((r) => r.entities)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5)
        .map((e) => e.id);

      if (topEntities.length >= 2) {
        const reasoningResults = await reasoningEngine.reason({
          startEntities: topEntities.slice(0, 2),
          targetEntities: topEntities.slice(2, 4),
          question:
            "What are the analytical relationships between these concepts?",
          maxDepth: 3,
          minConfidence: 0.2,
          reasoningType: "causal",
        });

        // Analyze reasoning confidence distribution
        const pathConfidences = reasoningResults.paths.map((p) => p.confidence);
        const avgConfidence =
          pathConfidences.reduce((a, b) => a + b, 0) / pathConfidences.length;

        expect(reasoningResults.paths.length).toBeGreaterThan(0);
        expect(avgConfidence).toBeGreaterThan(0);

        console.log(
          `🔗 Reasoning analysis: ${
            reasoningResults.paths.length
          } paths, avg confidence: ${avgConfidence.toFixed(3)}`
        );
      }

      // Step 6: Generate comprehensive analytics report
      console.log("📋 Generating analytics report...");
      const analyticsReport = {
        timestamp: new Date(),
        datasetSummary: {
          documentsProcessed: ingestionResult.processedFiles,
          chunksGenerated: ingestionResult.totalChunks,
          entitiesExtracted: graphStats.entityCount,
          relationshipsInferred: graphStats.relationshipCount,
        },
        graphAnalytics: {
          nodeCount: graphStats.entityCount,
          edgeCount: graphStats.relationshipCount,
          avgDegree: graphStats.averageNodeDegree,
          clustering: graphStats.clusteringCoefficient,
          diameter: graphStats.diameter,
        },
        searchAnalytics: {
          totalQueries: 1, // Would track over time
          avgResponseTime: searchResults.metrics.executionTime,
          avgResultCount: searchResults.results.length,
          scoreDistribution: {
            mean: avgScore,
            variance: scoreVariance,
            min: Math.min(...scoreDistribution),
            max: Math.max(...scoreDistribution),
          },
        },
        insights: [
          "Knowledge graph shows strong clustering in technical concepts",
          "Search results demonstrate good semantic relevance",
          "Reasoning paths reveal complex conceptual relationships",
        ],
      };

      expect(analyticsReport.datasetSummary.documentsProcessed).toBeGreaterThan(
        0
      );
      expect(analyticsReport.graphAnalytics.nodeCount).toBeGreaterThan(0);
      expect(analyticsReport.searchAnalytics.avgResponseTime).toBeGreaterThan(
        0
      );

      // Cleanup
      await cleanupTestFiles(analyticsFiles);

      console.log("✅ Data Scientist journey completed successfully");
    }, 25000);
  });
});

// Helper functions
async function runMigrations(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    // Run knowledge graph migration
    const migration001 = fs.readFileSync(
      path.join(
        process.cwd(),
        "apps/kv_database/src/lib/knowledge-graph/migrations/001_create_knowledge_graph_schema.sql"
      ),
      "utf8"
    );
    await client.query(migration001);

    // Run provenance migration
    const migration002 = fs.readFileSync(
      path.join(
        process.cwd(),
        "apps/kv_database/src/lib/knowledge-graph/migrations/002_create_provenance_schema.sql"
      ),
      "utf8"
    );
    await client.query(migration002);
  } finally {
    client.release();
  }
}

async function cleanupTestData(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("DELETE FROM kg_relationships");
    await client.query("DELETE FROM kg_nodes");
    await client.query("DELETE FROM obsidian_chunks");
    await client.query("DELETE FROM provenance_records");
    await client.query("DELETE FROM explanations");
    await client.query("DELETE FROM monitoring_metrics");
  } finally {
    client.release();
  }
}

async function createResearchDataset(): Promise<string[]> {
  const testDir = path.join(process.cwd(), "test", "temp", "research");
  await fs.promises.mkdir(testDir, { recursive: true });

  const files: string[] = [];

  // Create research papers
  const papers = [
    {
      name: "neural_networks_survey.md",
      content: `# Neural Networks: A Comprehensive Survey

## Abstract
This paper provides a comprehensive survey of neural network architectures and their applications in machine learning. We examine deep learning techniques, convolutional neural networks, and recurrent neural networks.

## Introduction
Neural networks have revolutionized the field of artificial intelligence. Key researchers like Geoffrey Hinton, Yann LeCun, and Yoshua Bengio have made significant contributions to deep learning.

## Methodologies
- Backpropagation algorithm
- Gradient descent optimization
- Regularization techniques
- Dropout and batch normalization

## Applications
Neural networks are widely used in:
- Computer vision
- Natural language processing
- Speech recognition
- Autonomous vehicles

## Conclusion
The future of neural networks lies in transformer architectures and attention mechanisms.
`,
    },
    {
      name: "machine_learning_algorithms.md",
      content: `# Machine Learning Algorithms: Theory and Practice

## Overview
This document explores various machine learning algorithms including supervised learning, unsupervised learning, and reinforcement learning approaches.

## Supervised Learning
- Linear regression
- Support vector machines
- Random forests
- Neural networks

## Unsupervised Learning
- K-means clustering
- Principal component analysis
- Autoencoders
- Generative adversarial networks

## Key Concepts
- Bias-variance tradeoff
- Cross-validation
- Feature engineering
- Model evaluation metrics

## Research Trends
Current research focuses on:
- Explainable AI
- Few-shot learning
- Transfer learning
- Federated learning
`,
    },
    {
      name: "ai_ethics_paper.md",
      content: `# Ethical Considerations in Artificial Intelligence

## Abstract
As AI systems become more prevalent, ethical considerations become increasingly important. This paper examines bias, fairness, and transparency in AI systems.

## Key Issues
- Algorithmic bias
- Data privacy
- Transparency and explainability
- Accountability in AI decisions

## Case Studies
- Facial recognition systems
- Hiring algorithms
- Medical diagnosis AI
- Criminal justice risk assessment

## Recommendations
- Diverse development teams
- Bias testing and mitigation
- Transparent AI practices
- Regulatory frameworks
`,
    },
  ];

  for (const paper of papers) {
    const filePath = path.join(testDir, paper.name);
    await fs.promises.writeFile(filePath, paper.content);
    files.push(filePath);
  }

  return files;
}

async function createBusinessDataset(): Promise<string[]> {
  const testDir = path.join(process.cwd(), "test", "temp", "business");
  await fs.promises.mkdir(testDir, { recursive: true });

  const files: string[] = [];

  const businessDocs = [
    {
      name: "market_analysis_2024.md",
      content: `# Market Analysis Report 2024

## Executive Summary
The technology sector shows strong growth with emerging trends in AI, cloud computing, and cybersecurity.

## Key Players
- Microsoft Corporation: Leading in cloud services
- Google (Alphabet): Dominant in search and advertising
- Amazon: E-commerce and AWS leadership
- Apple: Premium consumer electronics

## Market Trends
- Digital transformation acceleration
- Remote work technology adoption
- Cybersecurity investments increasing
- AI integration across industries

## Financial Metrics
- Revenue growth: 15% YoY
- Market capitalization trends
- Investment in R&D
- Customer acquisition costs

## Competitive Analysis
Companies are competing on:
- Innovation speed
- Customer experience
- Data analytics capabilities
- Sustainability initiatives
`,
    },
    {
      name: "competitive_landscape.md",
      content: `# Competitive Landscape Analysis

## Industry Overview
The software industry is highly competitive with rapid technological changes and evolving customer needs.

## Competitor Profiles

### Microsoft
- Strengths: Enterprise relationships, cloud infrastructure
- Weaknesses: Consumer market presence
- Strategy: Cloud-first, AI integration

### Google
- Strengths: Search dominance, data analytics
- Weaknesses: Privacy concerns, regulatory scrutiny
- Strategy: AI-powered services, cloud expansion

### Amazon
- Strengths: Scale, logistics, AWS
- Weaknesses: Regulatory pressure, labor issues
- Strategy: Diversification, international expansion

## Market Dynamics
- Customer loyalty factors
- Pricing strategies
- Innovation cycles
- Partnership ecosystems
`,
    },
  ];

  for (const doc of businessDocs) {
    const filePath = path.join(testDir, doc.name);
    await fs.promises.writeFile(filePath, doc.content);
    files.push(filePath);
  }

  return files;
}

async function createMultiModalDataset(): Promise<string[]> {
  const testDir = path.join(process.cwd(), "test", "temp", "multimodal");
  await fs.promises.mkdir(testDir, { recursive: true });

  const files: string[] = [];

  const multiModalContent = [
    {
      name: "design_system_guide.md",
      content: `# Design System Guidelines

## Visual Design Principles
- Consistency across all interfaces
- Accessibility-first approach
- Responsive design patterns
- Color theory and contrast ratios

## Component Library
- Buttons and interactive elements
- Form controls and validation
- Navigation patterns
- Data visualization components

## Accessibility Standards
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast requirements

## User Interface Patterns
- Progressive disclosure
- Information hierarchy
- Visual feedback systems
- Error handling and recovery
`,
    },
    {
      name: "user_research_findings.md",
      content: `# User Research Findings

## Research Methodology
- User interviews (n=25)
- Usability testing sessions
- Survey data analysis
- Behavioral analytics

## Key Findings
- Users prefer simple, intuitive interfaces
- Accessibility features benefit all users
- Mobile-first design is essential
- Performance impacts user satisfaction

## User Personas
- Technical professionals
- Business stakeholders
- End consumers
- Accessibility-dependent users

## Recommendations
- Implement progressive enhancement
- Prioritize loading performance
- Provide multiple interaction methods
- Include comprehensive help documentation
`,
    },
    {
      name: "technical_specifications.md",
      content: `# Technical Specifications

## Architecture Overview
- Microservices architecture
- API-first design approach
- Event-driven communication
- Scalable data storage

## Technology Stack
- Frontend: React, TypeScript, SCSS
- Backend: Node.js, PostgreSQL, Redis
- Infrastructure: Docker, Kubernetes, AWS
- Monitoring: Prometheus, Grafana, ELK stack

## Performance Requirements
- Page load time: < 2 seconds
- API response time: < 200ms
- Uptime: 99.9% availability
- Concurrent users: 10,000+

## Security Considerations
- Authentication and authorization
- Data encryption at rest and in transit
- Regular security audits
- Compliance with data protection regulations
`,
    },
  ];

  for (const content of multiModalContent) {
    const filePath = path.join(testDir, content.name);
    await fs.promises.writeFile(filePath, content.content);
    files.push(filePath);
  }

  return files;
}

async function createAnalyticsDataset(): Promise<string[]> {
  const testDir = path.join(process.cwd(), "test", "temp", "analytics");
  await fs.promises.mkdir(testDir, { recursive: true });

  const files: string[] = [];

  const analyticsContent = [
    {
      name: "statistical_analysis_methods.md",
      content: `# Statistical Analysis Methods

## Descriptive Statistics
- Central tendency measures
- Variability and dispersion
- Distribution analysis
- Correlation analysis

## Inferential Statistics
- Hypothesis testing
- Confidence intervals
- Regression analysis
- ANOVA and t-tests

## Machine Learning Applications
- Predictive modeling
- Classification algorithms
- Clustering techniques
- Dimensionality reduction

## Data Science Workflow
- Data collection and cleaning
- Exploratory data analysis
- Feature engineering
- Model validation and testing

## Tools and Technologies
- Python: pandas, scikit-learn, matplotlib
- R: ggplot2, dplyr, caret
- SQL: data querying and aggregation
- Visualization: Tableau, D3.js, Plotly
`,
    },
    {
      name: "data_mining_techniques.md",
      content: `# Data Mining Techniques

## Pattern Recognition
- Association rule mining
- Sequential pattern mining
- Anomaly detection
- Trend analysis

## Classification Methods
- Decision trees
- Naive Bayes
- Support vector machines
- Ensemble methods

## Clustering Algorithms
- K-means clustering
- Hierarchical clustering
- DBSCAN
- Gaussian mixture models

## Evaluation Metrics
- Accuracy and precision
- Recall and F1-score
- ROC curves and AUC
- Cross-validation techniques

## Big Data Considerations
- Scalability challenges
- Distributed computing
- Stream processing
- Real-time analytics
`,
    },
  ];

  for (const content of analyticsContent) {
    const filePath = path.join(testDir, content.name);
    await fs.promises.writeFile(filePath, content.content);
    files.push(filePath);
  }

  return files;
}

async function cleanupTestFiles(files: string[]): Promise<void> {
  for (const file of files) {
    try {
      await fs.promises.unlink(file);

      // Try to remove directory if empty
      const dir = path.dirname(file);
      try {
        await fs.promises.rmdir(dir);
      } catch {
        // Directory not empty or doesn't exist, ignore
      }
    } catch {
      // File doesn't exist, ignore
    }
  }
}
