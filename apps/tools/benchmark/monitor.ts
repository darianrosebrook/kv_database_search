#!/usr/bin/env tsx

import { performance } from "perf_hooks";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

interface PerformanceMetrics {
  timestamp: string;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  requestSize: number;
  responseSize: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage?: number;
}

interface PerformanceReport {
  period: {
    start: string;
    end: string;
    duration: number;
  };
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    throughput: number; // requests per second
  };
  endpoints: {
    [endpoint: string]: {
      count: number;
      averageTime: number;
      minTime: number;
      maxTime: number;
      errorCount: number;
    };
  };
  alerts: string[];
  recommendations: string[];
}

interface EndpointSummary {
  count: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  errorCount: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private startTime: number;
  private endTime?: number;

  constructor() {
    this.startTime = performance.now();
  }

  recordMetric(metric: Omit<PerformanceMetrics, "timestamp">): void {
    this.metrics.push({
      ...metric,
      timestamp: new Date().toISOString(),
    });
  }

  generateReport(): PerformanceReport {
    this.endTime = performance.now();
    const duration = (this.endTime - this.startTime) / 1000; // seconds

    // Calculate response times
    const responseTimes = this.metrics
      .map((m) => m.responseTime)
      .sort((a, b) => a - b);
    const totalRequests = this.metrics.length;
    const errorRequests = this.metrics.filter(
      (m) => m.statusCode >= 400
    ).length;

    // Calculate percentiles
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);

    // Group by endpoint
    const endpointStats: {
      [key: string]: { times: number[]; errors: number; count: number };
    } = {};
    for (const metric of this.metrics) {
      if (!endpointStats[metric.endpoint]) {
        endpointStats[metric.endpoint] = { times: [], errors: 0, count: 0 };
      }
      endpointStats[metric.endpoint].times.push(metric.responseTime);
      endpointStats[metric.endpoint].count++;
      if (metric.statusCode >= 400) {
        endpointStats[metric.endpoint].errors++;
      }
    }

    // Calculate endpoint summaries
    const endpoints: { [key: string]: EndpointSummary } = {};
    for (const [endpoint, stats] of Object.entries(endpointStats)) {
      const times = stats.times.sort((a, b) => a - b);
      endpoints[endpoint] = {
        count: stats.count,
        averageTime: times.reduce((a, b) => a + b, 0) / times.length,
        minTime: Math.min(...times),
        maxTime: Math.max(...times),
        errorCount: stats.errors,
      };
    }

    // Generate alerts and recommendations
    const alerts: string[] = [];
    const recommendations: string[] = [];

    const avgResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const errorRate = errorRequests / totalRequests;

    // Performance alerts
    if (avgResponseTime > 1000) {
      alerts.push(
        `High average response time: ${avgResponseTime.toFixed(2)}ms`
      );
      recommendations.push(
        "Consider optimizing database queries or implementing caching"
      );
    }

    if (responseTimes[p95Index] > 2000) {
      alerts.push(
        `High P95 response time: ${responseTimes[p95Index].toFixed(2)}ms`
      );
      recommendations.push("Investigate and optimize slow endpoints");
    }

    if (errorRate > 0.05) {
      alerts.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`);
      recommendations.push("Review error handling and fix failing endpoints");
    }

    const throughput = totalRequests / duration;
    if (throughput < 10) {
      recommendations.push("Consider optimizing concurrent request handling");
    }

    // Memory usage alerts
    if (this.metrics.length > 0) {
      const lastMetric = this.metrics[this.metrics.length - 1];
      const heapUsedMB = lastMetric.memoryUsage.heapUsed / 1024 / 1024;
      if (heapUsedMB > 256) {
        alerts.push(`High memory usage: ${heapUsedMB.toFixed(2)}MB heap`);
        recommendations.push(
          "Monitor for memory leaks and optimize memory usage"
        );
      }
    }

    return {
      period: {
        start: new Date(this.startTime + performance.timeOrigin).toISOString(),
        end: new Date(this.endTime + performance.timeOrigin).toISOString(),
        duration,
      },
      summary: {
        totalRequests,
        averageResponseTime: avgResponseTime,
        p95ResponseTime: responseTimes[p95Index] || 0,
        p99ResponseTime: responseTimes[p99Index] || 0,
        errorRate,
        throughput,
      },
      endpoints,
      alerts,
      recommendations,
    };
  }

  saveReport(filename?: string): void {
    const report = this.generateReport();
    const reportPath =
      filename ||
      path.join(process.cwd(), `performance-report-${Date.now()}.json`);

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 Performance report saved to: ${reportPath}`);
  }

  printReport(): void {
    const report = this.generateReport();

    console.log("\n" + "=".repeat(80));
    console.log("📊 PERFORMANCE MONITORING REPORT");
    console.log("=".repeat(80));

    console.log(`\n📅 Period: ${report.period.start} to ${report.period.end}`);
    console.log(`⏱️  Duration: ${report.period.duration.toFixed(2)}s`);

    console.log("\n📈 SUMMARY:");
    console.log(`  Total Requests: ${report.summary.totalRequests}`);
    console.log(
      `  Average Response Time: ${report.summary.averageResponseTime.toFixed(
        2
      )}ms`
    );
    console.log(
      `  P95 Response Time: ${report.summary.p95ResponseTime.toFixed(2)}ms`
    );
    console.log(
      `  P99 Response Time: ${report.summary.p99ResponseTime.toFixed(2)}ms`
    );
    console.log(
      `  Error Rate: ${(report.summary.errorRate * 100).toFixed(2)}%`
    );
    console.log(
      `  Throughput: ${report.summary.throughput.toFixed(2)} req/sec`
    );

    console.log("\n🔗 ENDPOINT BREAKDOWN:");
    for (const [endpoint, stats] of Object.entries(report.endpoints)) {
      console.log(`  ${endpoint}:`);
      console.log(`    Requests: ${stats.count}`);
      console.log(`    Avg Time: ${stats.averageTime.toFixed(2)}ms`);
      console.log(
        `    Min/Max: ${stats.minTime.toFixed(2)}ms / ${stats.maxTime.toFixed(
          2
        )}ms`
      );
      console.log(`    Errors: ${stats.errorCount}`);
    }

    if (report.alerts.length > 0) {
      console.log("\n🚨 ALERTS:");
      report.alerts.forEach((alert) => console.log(`  ⚠️  ${alert}`));
    }

    if (report.recommendations.length > 0) {
      console.log("\n💡 RECOMMENDATIONS:");
      report.recommendations.forEach((rec) => console.log(`  💡 ${rec}`));
    }

    console.log("\n✅ Monitoring Complete!");
  }

  // Helper method to simulate API monitoring
  async monitorAPI(
    baseUrl: string,
    endpoints: string[],
    duration: number = 30000
  ): Promise<void> {
    console.log(`🔍 Starting API monitoring for ${duration / 1000}s...`);

    const monitoringPromises: Promise<void>[] = [];
    const endTime = Date.now() + duration;

    for (const endpoint of endpoints) {
      monitoringPromises.push(this.monitorEndpoint(baseUrl, endpoint, endTime));
    }

    await Promise.all(monitoringPromises);
  }

  private async monitorEndpoint(
    baseUrl: string,
    endpoint: string,
    endTime: number
  ): Promise<void> {
    while (Date.now() < endTime) {
      const startTime = performance.now();

      try {
        const response = await fetch(`${baseUrl}${endpoint}`);
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        // Get response size (approximate)
        const responseText = await response.text();
        const responseSize = Buffer.byteLength(responseText, "utf8");

        this.recordMetric({
          endpoint,
          method: "GET",
          responseTime,
          statusCode: response.status,
          requestSize: 0, // Would need to calculate for POST requests
          responseSize,
          memoryUsage: process.memoryUsage(),
        });

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Failed to monitor ${endpoint}:`, error);
        break;
      }
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new PerformanceMonitor();

  const command = process.argv[2];
  const baseUrl = process.argv[3] || "http://localhost:3001";
  const duration = parseInt(process.argv[4]) || 30000;
  let filename: string;
  if (!command) {
    console.log("Performance Monitor CLI");
    console.log("");
    console.log("Usage:");
    console.log(
      "  monitor api <baseUrl> <durationMs>  - Monitor API endpoints"
    );
    console.log(
      "  report                             - Generate and display report"
    );
    console.log("  save [filename]                    - Save report to file");
    console.log("");
    console.log("Examples:");
    console.log("  monitor api http://localhost:3001 30000");
    console.log("  monitor report");
    console.log("  monitor save my-report.json");
    process.exit(0);
  }

  switch (command) {
    case "api":
      {
        const endpoints = ["/health", "/search", "/analytics"];
        monitor.monitorAPI(baseUrl, endpoints, duration).then(() => {
          monitor.printReport();
        });
      }
      break;

    case "report":
      monitor.printReport();
      break;

    case "save":
      filename = process.argv[3];
      monitor.saveReport(filename);
      break;

    default:
      console.error("Unknown command:", command);
      process.exit(1);
  }
}

export { PerformanceMonitor, PerformanceMetrics, PerformanceReport };
