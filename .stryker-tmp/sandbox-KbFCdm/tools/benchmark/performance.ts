#!/usr/bin/env tsx
// @ts-nocheck

import { performance } from "perf_hooks";
import fs from "fs";
import path from "path";
import { ObsidianDatabase } from "../../src/lib/database.js";
import { ObsidianEmbeddingService } from "../../src/lib/embeddings.js";
import { ObsidianIngestionService } from "../../src/lib/obsidian-ingest.js";

interface BenchmarkResult {
  name: string;
  duration: number;
  memoryUsage?: NodeJS.MemoryUsage;
  operationsPerSecond?: number;
  averageLatency?: number;
  p50Latency?: number;
  p95Latency?: number;
  p99Latency?: number;
  success: boolean;
  error?: string;
}

interface PerformanceBudget {
  searchLatency: {
    p50: number; // milliseconds
    p95: number;
    p99: number;
  };
  ingestionRate: {
    documentsPerSecond: number;
    chunksPerSecond: number;
  };
  memoryUsage: {
    maxHeapMB: number;
    maxExternalMB: number;
  };
  concurrentUsers: number;
}

class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];
  private budget: PerformanceBudget;

  constructor(budget: PerformanceBudget) {
    this.budget = budget;
  }

  async runAllBenchmarks(
    database: ObsidianDatabase,
    embeddings: ObsidianEmbeddingService
  ): Promise<void> {
    console.log("🚀 Starting Performance Benchmarks...\n");

    // Search Performance Benchmarks
    await this.benchmarkSearchLatency(database);
    await this.benchmarkSearchThroughput(database);
    await this.benchmarkConcurrentSearches(database);

    // Ingestion Performance Benchmarks
    await this.benchmarkIngestionPerformance(embeddings);

    // Memory Usage Benchmarks
    await this.benchmarkMemoryUsage(database);

    // Generate Report
    this.generateReport();
  }

  private async benchmarkSearchLatency(
    database: ObsidianDatabase
  ): Promise<void> {
    console.log("📊 Benchmarking Search Latency...");

    const queries = [
      "design system",
      "atomic design methodology",
      "UI components",
      "testing strategies",
      "performance optimization",
      "machine learning algorithms",
      "database indexing techniques",
      "user interface design patterns",
    ];

    const latencies: number[] = [];
    const startTime = performance.now();

    for (let i = 0; i < 100; i++) {
      const query = queries[Math.floor(Math.random() * queries.length)];
      const queryStart = performance.now();

      try {
        // Generate random embedding for search
        const embedding = Array.from(
          { length: 768 },
          () => Math.random() - 0.5
        );
        await database.search(embedding, 10);
        const queryEnd = performance.now();
        latencies.push(queryEnd - queryStart);
      } catch (error) {
        console.warn(`Search query failed: ${error}`);
      }
    }

    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    // Calculate percentiles
    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    const result: BenchmarkResult = {
      name: "Search Latency (100 queries)",
      duration: totalDuration,
      operationsPerSecond: 100 / (totalDuration / 1000),
      averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p50Latency: p50,
      p95Latency: p95,
      p99Latency: p99,
      success: true,
    };

    this.results.push(result);
    this.checkBudget("searchLatency", result);
  }

  private async benchmarkSearchThroughput(
    database: ObsidianDatabase
  ): Promise<void> {
    console.log("📈 Benchmarking Search Throughput...");

    const concurrentRequests = 10;
    const totalQueries = 200;
    const latencies: number[] = [];

    const runQuery = async (): Promise<void> => {
      for (let i = 0; i < totalQueries / concurrentRequests; i++) {
        const queryStart = performance.now();

        try {
          const embedding = Array.from(
            { length: 768 },
            () => Math.random() - 0.5
          );
          await database.search(embedding, 5);
          const queryEnd = performance.now();
          latencies.push(queryEnd - queryStart);
        } catch (error) {
          console.warn(`Search query failed: ${error}`);
        }
      }
    };

    const startTime = performance.now();

    // Run concurrent queries
    const promises = Array.from({ length: concurrentRequests }, () =>
      runQuery()
    );
    await Promise.all(promises);

    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    const result: BenchmarkResult = {
      name: "Search Throughput (200 queries, 10 concurrent)",
      duration: totalDuration,
      operationsPerSecond: totalQueries / (totalDuration / 1000),
      success: true,
    };

    this.results.push(result);
  }

  private async benchmarkConcurrentSearches(
    database: ObsidianDatabase
  ): Promise<void> {
    console.log("🔄 Benchmarking Concurrent Search Load...");

    const userLoads = [1, 5, 10, 25, 50];
    const queriesPerUser = 20;

    for (const userCount of userLoads) {
      console.log(`  Testing ${userCount} concurrent users...`);

      const startTime = performance.now();
      const allLatencies: number[] = [];

      // Simulate concurrent users
      const userPromises = Array.from(
        { length: userCount },
        async (_, userIndex) => {
          const userLatencies: number[] = [];

          for (let i = 0; i < queriesPerUser; i++) {
            const queryStart = performance.now();

            try {
              const embedding = Array.from(
                { length: 768 },
                () => Math.random() - 0.5
              );
              await database.search(embedding, 5);
              const queryEnd = performance.now();
              userLatencies.push(queryEnd - queryStart);
            } catch (error) {
              console.warn(`User ${userIndex} query ${i} failed: ${error}`);
            }

            // Small delay to simulate realistic usage
            await new Promise((resolve) =>
              setTimeout(resolve, Math.random() * 100)
            );
          }

          return userLatencies;
        }
      );

      const userResults = await Promise.all(userPromises);
      const endTime = performance.now();

      allLatencies = userResults.flat();
      const totalDuration = endTime - startTime;

      // Calculate metrics
      allLatencies.sort((a, b) => a - b);
      const p95 = allLatencies[Math.floor(allLatencies.length * 0.95)];

      const result: BenchmarkResult = {
        name: `Concurrent Load (${userCount} users, ${queriesPerUser} queries each)`,
        duration: totalDuration,
        operationsPerSecond:
          (userCount * queriesPerUser) / (totalDuration / 1000),
        p95Latency: p95,
        success: true,
      };

      this.results.push(result);

      // Check if we can handle this load
      if (p95 > this.budget.searchLatency.p95) {
        console.warn(
          `⚠️  P95 latency (${p95.toFixed(2)}ms) exceeds budget (${
            this.budget.searchLatency.p95
          }ms)`
        );
      }
    }
  }

  private async benchmarkIngestionPerformance(
    embeddings: ObsidianEmbeddingService
  ): Promise<void> {
    console.log("📥 Benchmarking Ingestion Performance...");

    // Create test documents
    const testDocuments = Array.from({ length: 50 }, (_, i) => ({
      id: `test-doc-${i}`,
      path: `test-doc-${i}.md`,
      name: `Test Document ${i}`,
      extension: "md",
      content: `# Test Document ${i}\n\nThis is a test document for performance benchmarking. It contains some content that will be processed and embedded.\n\n## Section 1\n\nSome content here with various words and concepts.\n\n## Section 2\n\nMore content with different terminology and ideas.`,
      frontmatter: {
        title: `Test Document ${i}`,
        created: new Date().toISOString(),
      },
      stats: {
        wordCount: 45,
        characterCount: 280,
        lineCount: 8,
        headingCount: 2,
        linkCount: 0,
        tagCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      relationships: {
        wikilinks: [],
        tags: ["test", "benchmark"],
        backlinks: [],
      },
      metadata: {
        created: new Date(),
        modified: new Date(),
        checksum: `checksum-${i}`,
        lastIndexed: new Date(),
        processingErrors: [],
      },
    }));

    const startTime = performance.now();

    // Process documents in batches
    const batchSize = 10;
    for (let i = 0; i < testDocuments.length; i += batchSize) {
      const batch = testDocuments.slice(i, i + batchSize);

      // Embed batch
      const texts = batch.map((doc) => doc.content);
      await embeddings.embedBatch(texts);

      console.log(
        `  Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          testDocuments.length / batchSize
        )}`
      );
    }

    const endTime = performance.now();
    const totalDuration = endTime - startTime;

    const result: BenchmarkResult = {
      name: "Ingestion Performance (50 documents)",
      duration: totalDuration,
      operationsPerSecond: testDocuments.length / (totalDuration / 1000),
      success: true,
    };

    this.results.push(result);

    // Check ingestion rate budget
    const docsPerSecond = testDocuments.length / (totalDuration / 1000);
    if (docsPerSecond < this.budget.ingestionRate.documentsPerSecond) {
      console.warn(
        `⚠️  Ingestion rate (${docsPerSecond.toFixed(
          2
        )} docs/sec) below budget (${
          this.budget.ingestionRate.documentsPerSecond
        } docs/sec)`
      );
    }
  }

  private async benchmarkMemoryUsage(
    database: ObsidianDatabase
  ): Promise<void> {
    console.log("🧠 Benchmarking Memory Usage...");

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const initialMemory = process.memoryUsage();

    // Perform intensive operations
    const promises = Array.from({ length: 100 }, async () => {
      const embedding = Array.from({ length: 768 }, () => Math.random() - 0.5);
      return database.search(embedding, 10);
    });

    await Promise.all(promises);

    // Force garbage collection again
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage();

    const result: BenchmarkResult = {
      name: "Memory Usage (100 search operations)",
      duration: 0,
      memoryUsage: finalMemory,
      success: true,
    };

    this.results.push(result);

    // Check memory budget
    const heapUsedMB = finalMemory.heapUsed / 1024 / 1024;
    const externalMB = finalMemory.external / 1024 / 1024;

    if (heapUsedMB > this.budget.memoryUsage.maxHeapMB) {
      console.warn(
        `⚠️  Heap usage (${heapUsedMB.toFixed(2)}MB) exceeds budget (${
          this.budget.memoryUsage.maxHeapMB
        }MB)`
      );
    }

    if (externalMB > this.budget.memoryUsage.maxExternalMB) {
      console.warn(
        `⚠️  External memory usage (${externalMB.toFixed(
          2
        )}MB) exceeds budget (${this.budget.memoryUsage.maxExternalMB}MB)`
      );
    }
  }

  private checkBudget(
    category: keyof PerformanceBudget,
    result: BenchmarkResult
  ): void {
    const budget = this.budget[category] as any;

    if (category === "searchLatency") {
      if (result.p95Latency && result.p95Latency > budget.p95) {
        console.warn(
          `⚠️  P95 latency (${result.p95Latency.toFixed(
            2
          )}ms) exceeds budget (${budget.p95}ms)`
        );
      }
      if (result.p99Latency && result.p99Latency > budget.p99) {
        console.warn(
          `⚠️  P99 latency (${result.p99Latency.toFixed(
            2
          )}ms) exceeds budget (${budget.p99}ms)`
        );
      }
    }
  }

  private generateReport(): void {
    console.log("\n" + "=".repeat(80));
    console.log("📊 PERFORMANCE BENCHMARK REPORT");
    console.log("=".repeat(80));

    console.log("\n🎯 BUDGET TARGETS:");
    console.log(`  Search P95 Latency: ${this.budget.searchLatency.p95}ms`);
    console.log(`  Search P99 Latency: ${this.budget.searchLatency.p99}ms`);
    console.log(
      `  Ingestion Rate: ${this.budget.ingestionRate.documentsPerSecond} docs/sec`
    );
    console.log(`  Max Heap Memory: ${this.budget.memoryUsage.maxHeapMB}MB`);
    console.log(`  Concurrent Users: ${this.budget.concurrentUsers}`);

    console.log("\n📈 BENCHMARK RESULTS:");

    this.results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.name}`);
      console.log(`   Duration: ${result.duration.toFixed(2)}ms`);

      if (result.operationsPerSecond) {
        console.log(
          `   Throughput: ${result.operationsPerSecond.toFixed(2)} ops/sec`
        );
      }

      if (result.averageLatency) {
        console.log(`   Avg Latency: ${result.averageLatency.toFixed(2)}ms`);
      }

      if (result.p50Latency) {
        console.log(`   P50 Latency: ${result.p50Latency.toFixed(2)}ms`);
      }

      if (result.p95Latency) {
        console.log(`   P95 Latency: ${result.p95Latency.toFixed(2)}ms`);
      }

      if (result.p99Latency) {
        console.log(`   P99 Latency: ${result.p99Latency.toFixed(2)}ms`);
      }

      if (result.memoryUsage) {
        console.log(
          `   Heap Used: ${(result.memoryUsage.heapUsed / 1024 / 1024).toFixed(
            2
          )}MB`
        );
        console.log(
          `   External: ${(result.memoryUsage.external / 1024 / 1024).toFixed(
            2
          )}MB`
        );
      }

      console.log(`   Status: ${result.success ? "✅ PASS" : "❌ FAIL"}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    // Save detailed report
    const reportPath = path.join(process.cwd(), "performance-report.json");
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          budget: this.budget,
          results: this.results,
          timestamp: new Date().toISOString(),
          summary: {
            totalBenchmarks: this.results.length,
            passedBenchmarks: this.results.filter((r) => r.success).length,
            failedBenchmarks: this.results.filter((r) => !r.success).length,
          },
        },
        null,
        2
      )
    );

    console.log(`\n💾 Detailed report saved to: ${reportPath}`);

    // Performance recommendations
    this.generateRecommendations();

    console.log("\n✅ Benchmarking Complete!");
  }

  private generateRecommendations(): void {
    console.log("\n💡 PERFORMANCE RECOMMENDATIONS:");

    const failedResults = this.results.filter((r) => !r.success);
    const slowResults = this.results.filter(
      (r) => r.p95Latency && r.p95Latency > this.budget.searchLatency.p95
    );

    if (failedResults.length > 0) {
      console.log("❌ Critical Issues:");
      failedResults.forEach((result) => {
        console.log(`   - ${result.name}: ${result.error}`);
      });
    }

    if (slowResults.length > 0) {
      console.log("🐌 Performance Optimizations Needed:");
      console.log("   - Consider query result caching");
      console.log("   - Optimize vector similarity search");
      console.log("   - Implement query result pagination");
      console.log("   - Add database query optimization");
    }

    console.log("✅ Best Practices:");
    console.log("   - Monitor memory usage in production");
    console.log("   - Implement request rate limiting");
    console.log("   - Add performance monitoring dashboards");
    console.log("   - Set up automated performance regression tests");
  }
}

// Performance budget aligned with CAWS requirements
const PERFORMANCE_BUDGET: PerformanceBudget = {
  searchLatency: {
    p50: 100, // 100ms for 50th percentile
    p95: 500, // 500ms for 95th percentile
    p99: 1000, // 1 second for 99th percentile
  },
  ingestionRate: {
    documentsPerSecond: 5, // 5 documents per second
    chunksPerSecond: 50, // 50 chunks per second
  },
  memoryUsage: {
    maxHeapMB: 512, // 512MB max heap
    maxExternalMB: 256, // 256MB max external memory
  },
  concurrentUsers: 50, // Support 50 concurrent users
};

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  // Enable garbage collection for memory benchmarks
  if (typeof global.gc === "undefined") {
    console.log(
      "⚠️  Garbage collection not available. Run with --expose-gc for accurate memory measurements."
    );
  }

  const benchmark = new PerformanceBenchmark(PERFORMANCE_BUDGET);

  // For now, we'll create mock services since we need a database connection
  // In a real scenario, this would connect to actual services
  console.log("🚀 Performance Benchmark Suite");
  console.log("Note: This is a framework for performance testing.");
  console.log(
    "To run actual benchmarks, integrate with your database and services."
  );
  console.log("");
  console.log("Available benchmarks:");
  console.log("- Search latency testing");
  console.log("- Throughput analysis");
  console.log("- Concurrent load testing");
  console.log("- Memory usage monitoring");
  console.log("- Ingestion performance");
  console.log("");
  console.log("Budget targets:");
  console.log(
    `- P95 Search Latency: ${PERFORMANCE_BUDGET.searchLatency.p95}ms`
  );
  console.log(`- Concurrent Users: ${PERFORMANCE_BUDGET.concurrentUsers}`);
  console.log(`- Memory Limit: ${PERFORMANCE_BUDGET.memoryUsage.maxHeapMB}MB`);
}
