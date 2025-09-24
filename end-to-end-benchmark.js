#!/usr/bin/env node

import http from "http";
import https from "https";

// Configuration
const BACKEND_URL = "http://localhost:3883";
const FRONTEND_URL = "http://localhost:3000";

// Test queries for end-to-end benchmarking
const testQueries = [
  "design tokens colors",
  "button component variants",
  "typography scale",
  "spacing grid",
  "accessibility contrast",
  "color palette",
  "responsive breakpoints",
  "component guidelines",
];

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https:") ? https : http;
    const req = protocol.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            data: data,
            latency: Date.now() - options.startTime,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data,
            latency: Date.now() - options.startTime,
          });
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (options.method === "POST" && options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function benchmarkBackendAPI() {
  console.log("🚀 Backend API End-to-End Benchmark\n");

  const results = [];

  for (const query of testQueries) {
    console.log(`🔍 Testing query: "${query}"`);

    const startTime = Date.now();
    try {
      const response = await makeRequest(`${BACKEND_URL}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          query,
          limit: 5,
          minSimilarity: 0.0,
        },
        startTime,
      });

      const totalLatency = Date.now() - startTime;

      if (response.status === 200) {
        const data = JSON.parse(response.data);
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📊 Results: ${data.results?.length || 0}`);
        console.log(`   ⚡ API Latency: ${response.latency}ms`);
        console.log(`   🏁 Total Latency: ${totalLatency}ms`);
      } else {
        console.log(`   ❌ Status: ${response.status}`);
        console.log(`   ⚠️  Response: ${response.data.substring(0, 100)}...`);
      }

      results.push({
        query,
        apiLatency: response.latency,
        totalLatency,
        status: response.status,
        resultsCount:
          response.status === 200
            ? JSON.parse(response.data).results?.length
            : 0,
      });
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        query,
        error: error.message,
        apiLatency: 0,
        totalLatency: Date.now() - startTime,
        status: "ERROR",
      });
    }

    console.log("");
  }

  return results;
}

async function benchmarkFrontendPageLoad() {
  console.log("🌐 Frontend Page Load Benchmark\n");

  const startTime = Date.now();
  try {
    const response = await makeRequest(FRONTEND_URL, {
      method: "GET",
      startTime,
    });

    const loadTime = Date.now() - startTime;

    console.log(`📄 Frontend Status: ${response.status}`);
    console.log(`⚡ Page Load Time: ${loadTime}ms`);
    console.log(`📊 Response Size: ${response.data.length} bytes`);

    return {
      loadTime,
      status: response.status,
      size: response.data.length,
    };
  } catch (error) {
    console.log(`❌ Frontend Error: ${error.message}`);
    return {
      error: error.message,
      loadTime: Date.now() - startTime,
    };
  }
}

async function runConcurrentLoadTest() {
  console.log("🔥 Concurrent Load Test (10 parallel requests)\n");

  const concurrentQueries = Array(10)
    .fill()
    .map((_, i) => testQueries[i % testQueries.length]);

  const startTime = Date.now();
  const promises = concurrentQueries.map((query, index) =>
    makeRequest(`${BACKEND_URL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        query,
        limit: 5,
        minSimilarity: 0.0,
      },
      startTime: Date.now(),
    }).then((result) => ({ ...result, query, index }))
  );

  try {
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;

    const successful = results.filter((r) => r.status === 200);
    const failed = results.filter((r) => r.status !== 200);

    console.log(`📊 Total Requests: ${results.length}`);
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    console.log(
      `📈 Throughput: ${(results.length / (totalTime / 1000)).toFixed(
        2
      )} req/sec`
    );

    const latencies = successful.map((r) => r.latency);
    if (latencies.length > 0) {
      console.log(
        `⚡ Avg Latency: ${Math.round(
          latencies.reduce((a, b) => a + b, 0) / latencies.length
        )}ms`
      );
      console.log(`📉 Min Latency: ${Math.min(...latencies)}ms`);
      console.log(`📈 Max Latency: ${Math.max(...latencies)}ms`);
      console.log(
        `🎯 P95 Latency: ${Math.round(
          latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)]
        )}ms`
      );
    }

    return {
      totalRequests: results.length,
      successful: successful.length,
      failed: failed.length,
      totalTime,
      throughput: results.length / (totalTime / 1000),
      latencies,
    };
  } catch (error) {
    console.log(`❌ Load test failed: ${error.message}`);
    return { error: error.message };
  }
}

async function main() {
  console.log("🎯 DS-RAG End-to-End Benchmark Suite");
  console.log("=====================================\n");

  try {
    // Test backend health
    console.log("🏥 Checking Backend Health...");
    const healthResponse = await makeRequest(`${BACKEND_URL}/health`, {
      method: "GET",
      startTime: Date.now(),
    });

    if (healthResponse.status !== 200) {
      throw new Error(`Backend unhealthy: ${healthResponse.status}`);
    }

    const health = JSON.parse(healthResponse.data);
    console.log(`✅ Backend Status: ${health.status}`);
    console.log(`📊 Indexed Chunks: ${health.services.database.totalChunks}`);
    console.log(`🤖 Embedding Model: ${health.services.embeddings.model}\n`);

    // Run benchmarks
    const backendResults = await benchmarkBackendAPI();
    const frontendResults = await benchmarkFrontendPageLoad();
    const loadTestResults = await runConcurrentLoadTest();

    // Summary
    console.log("📊 BENCHMARK SUMMARY");
    console.log("===================\n");

    console.log("🔍 Backend API Performance:");
    const successfulQueries = backendResults.filter((r) => r.status === 200);
    const avgApiLatency =
      successfulQueries.reduce((sum, r) => sum + r.apiLatency, 0) /
      successfulQueries.length;
    const avgTotalLatency =
      successfulQueries.reduce((sum, r) => sum + r.totalLatency, 0) /
      successfulQueries.length;

    console.log(
      `   ✅ Success Rate: ${(
        (successfulQueries.length / backendResults.length) *
        100
      ).toFixed(1)}%`
    );
    console.log(`   ⚡ Avg API Latency: ${Math.round(avgApiLatency)}ms`);
    console.log(`   🏁 Avg Total Latency: ${Math.round(avgTotalLatency)}ms`);
    console.log(
      `   📊 Avg Results: ${Math.round(
        successfulQueries.reduce((sum, r) => sum + r.resultsCount, 0) /
          successfulQueries.length
      )}\n`
    );

    console.log("🌐 Frontend Performance:");
    if (frontendResults.error) {
      console.log(`   ❌ Error: ${frontendResults.error}`);
    } else {
      console.log(`   ✅ Status: ${frontendResults.status}`);
      console.log(`   ⚡ Load Time: ${frontendResults.loadTime}ms`);
      console.log(
        `   📊 Page Size: ${(frontendResults.size / 1024).toFixed(1)} KB\n`
      );
    }

    console.log("🔥 Load Test Performance:");
    if (loadTestResults.error) {
      console.log(`   ❌ Error: ${loadTestResults.error}`);
    } else {
      console.log(
        `   📈 Throughput: ${loadTestResults.throughput.toFixed(2)} req/sec`
      );
      console.log(
        `   🎯 P95 Latency: ${Math.round(
          loadTestResults.latencies.sort((a, b) => a - b)[
            Math.floor(loadTestResults.latencies.length * 0.95)
          ]
        )}ms`
      );
      console.log(
        `   ✅ Success Rate: ${(
          (loadTestResults.successful / loadTestResults.totalRequests) *
          100
        ).toFixed(1)}%\n`
      );
    }

    console.log("💡 Recommendations:");
    if (avgApiLatency < 100) {
      console.log("   ✅ Excellent API performance!");
    } else if (avgApiLatency < 500) {
      console.log("   ✅ Good API performance");
    } else {
      console.log("   ⚠️  Consider optimizing API performance");
    }

    if (loadTestResults.throughput > 10) {
      console.log("   ✅ Excellent throughput under load");
    } else if (loadTestResults.throughput > 5) {
      console.log("   ✅ Good throughput under load");
    } else {
      console.log("   ⚠️  Consider optimizing for concurrent requests");
    }
  } catch (error) {
    console.error(`❌ Benchmark failed: ${error.message}`);
    process.exit(1);
  }
}

main();
