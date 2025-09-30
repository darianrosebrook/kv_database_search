#!/usr/bin/env tsx

/**
 * Memory Monitoring Script
 *
 * Tests our theory about what's causing high memory usage in Cursor.
 * Monitors memory consumption during database operations, test runs, and embedding operations.
 */

import { performance } from "perf_hooks";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
  operation: string;
  phase: "start" | "end" | "checkpoint";
}

class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private startTime: number = 0;
  private isMonitoring: boolean = false;

  start(operation: string): void {
    this.startTime = performance.now();
    this.isMonitoring = true;
    this.takeSnapshot(operation, "start");
    console.log(`🔍 Starting memory monitoring for: ${operation}`);
  }

  checkpoint(operation: string): void {
    this.takeSnapshot(operation, "checkpoint");
  }

  end(operation: string): void {
    this.takeSnapshot(operation, "end");
    this.isMonitoring = false;
    this.generateReport(operation);
  }

  private takeSnapshot(
    operation: string,
    phase: "start" | "end" | "checkpoint"
  ): void {
    const memUsage = process.memoryUsage();
    const snapshot: MemorySnapshot = {
      timestamp: performance.now() - this.startTime,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      arrayBuffers: memUsage.arrayBuffers,
      operation,
      phase,
    };

    this.snapshots.push(snapshot);

    const memMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
    const rssMB = (memUsage.rss / 1024 / 1024).toFixed(2);
    console.log(
      `📊 [${phase.toUpperCase()}] ${operation}: Heap=${memMB}MB, RSS=${rssMB}MB`
    );
  }

  private generateReport(operation: string): void {
    const operationSnapshots = this.snapshots.filter(
      (s) => s.operation === operation
    );

    if (operationSnapshots.length < 2) return;

    const start = operationSnapshots.find((s) => s.phase === "start");
    const end = operationSnapshots.find((s) => s.phase === "end");
    const checkpoints = operationSnapshots.filter(
      (s) => s.phase === "checkpoint"
    );

    if (!start || !end) return;

    const heapIncrease = end.heapUsed - start.heapUsed;
    const rssIncrease = end.rss - start.rss;
    const maxHeap = Math.max(...operationSnapshots.map((s) => s.heapUsed));
    const maxRss = Math.max(...operationSnapshots.map((s) => s.rss));

    console.log("\n📈 MEMORY REPORT");
    console.log("================");
    console.log(`Operation: ${operation}`);
    console.log(`Duration: ${end.timestamp.toFixed(2)}ms`);
    console.log(`Heap Usage:`);
    console.log(`  Start: ${(start.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  End: ${(end.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Peak: ${(maxHeap / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Increase: ${(heapIncrease / 1024 / 1024).toFixed(2)}MB`);
    console.log(`RSS Usage:`);
    console.log(`  Start: ${(start.rss / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  End: ${(end.rss / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Peak: ${(maxRss / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Increase: ${(rssIncrease / 1024 / 1024).toFixed(2)}MB`);

    // Memory leak detection
    if (heapIncrease > 50 * 1024 * 1024) {
      // 50MB
      console.log(
        "⚠️  WARNING: Potential memory leak detected (>50MB heap increase)"
      );
    }
    if (rssIncrease > 100 * 1024 * 1024) {
      // 100MB
      console.log("⚠️  WARNING: High RSS memory increase (>100MB)");
    }

    // Checkpoint analysis
    if (checkpoints.length > 0) {
      console.log("\n📊 Checkpoint Analysis:");
      checkpoints.forEach((cp, i) => {
        const heapMB = (cp.heapUsed / 1024 / 1024).toFixed(2);
        const rssMB = (cp.rss / 1024 / 1024).toFixed(2);
        console.log(`  Checkpoint ${i + 1}: Heap=${heapMB}MB, RSS=${rssMB}MB`);
      });
    }

    console.log("");
  }

  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  clear(): void {
    this.snapshots = [];
  }
}

// Test scenarios to validate our theory
async function testDatabaseConnectionPools(): Promise<void> {
  console.log("\n🧪 Testing Database Connection Pool Memory Usage");
  console.log("================================================");

  const monitor = new MemoryMonitor();

  try {
    // Test 1: Create multiple database instances (simulating the issue)
    monitor.start("Multiple Database Instances");

    const { DocumentDatabase } = await import(
      "../apps/kv_database/src/lib/database.js"
    );
    const { TestObsidianDatabase } = await import(
      "../apps/kv_database/src/lib/database.js"
    );

    // Simulate creating multiple database instances like in tests
    const instances = [];
    for (let i = 0; i < 5; i++) {
      const db = new TestObsidianDatabase("sqlite::memory:");
      await db.initialize();
      instances.push(db);
      monitor.checkpoint(`Database Instance ${i + 1}`);
    }

    monitor.end("Multiple Database Instances");

    // Cleanup
    for (const instance of instances) {
      if (instance.close) await instance.close();
    }
  } catch (error) {
    console.error("❌ Database test failed:", error);
  }
}

async function testLargeDataProcessing(): Promise<void> {
  console.log("\n🧪 Testing Large Data Processing Memory Usage");
  console.log("==============================================");

  const monitor = new MemoryMonitor();

  try {
    monitor.start("Large Data Processing");

    // Simulate large data processing like in tests
    const largeBuffers = [];
    for (let i = 0; i < 10; i++) {
      const buffer = Buffer.alloc(10 * 1024 * 1024); // 10MB buffer
      largeBuffers.push(buffer);
      monitor.checkpoint(`Large Buffer ${i + 1}`);
    }

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    monitor.end("Large Data Processing");

    // Cleanup
    largeBuffers.length = 0;
  } catch (error) {
    console.error("❌ Large data test failed:", error);
  }
}

async function testEmbeddingOperations(): Promise<void> {
  console.log("\n🧪 Testing Embedding Operations Memory Usage");
  console.log("=============================================");

  const monitor = new MemoryMonitor();

  try {
    monitor.start("Embedding Operations");

    // Simulate embedding operations
    const embeddings = [];
    for (let i = 0; i < 100; i++) {
      const embedding = Array.from(
        { length: 768 },
        () => Math.random() * 2 - 1
      );
      embeddings.push(embedding);
      monitor.checkpoint(`Embedding ${i + 1}`);
    }

    monitor.end("Embedding Operations");

    // Cleanup
    embeddings.length = 0;
  } catch (error) {
    console.error("❌ Embedding test failed:", error);
  }
}

async function runTestSuite(): Promise<void> {
  console.log("\n🧪 Testing Test Suite Memory Usage");
  console.log("===================================");

  const monitor = new MemoryMonitor();

  try {
    monitor.start("Test Suite Execution");

    // Run a subset of tests to monitor memory
    const testProcess = spawn("npm", ["run", "test:unit:quick"], {
      stdio: "pipe",
      cwd: process.cwd(),
    });

    testProcess.stdout?.on("data", (data) => {
      console.log(data.toString());
    });

    testProcess.stderr?.on("data", (data) => {
      console.error(data.toString());
    });

    await new Promise((resolve, reject) => {
      testProcess.on("close", (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Test process exited with code ${code}`));
        }
      });
    });

    monitor.end("Test Suite Execution");
  } catch (error) {
    console.error("❌ Test suite failed:", error);
  }
}

async function main(): Promise<void> {
  console.log("🔍 Memory Monitoring Script");
  console.log("============================");
  console.log("Testing our theory about Cursor memory issues...\n");

  const initialMemory = process.memoryUsage();
  console.log(
    `Initial Memory: Heap=${(initialMemory.heapUsed / 1024 / 1024).toFixed(
      2
    )}MB, RSS=${(initialMemory.rss / 1024 / 1024).toFixed(2)}MB\n`
  );

  try {
    await testDatabaseConnectionPools();
    await testLargeDataProcessing();
    await testEmbeddingOperations();
    await runTestSuite();

    const finalMemory = process.memoryUsage();
    const totalIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    const rssIncrease = finalMemory.rss - initialMemory.rss;

    console.log("\n📊 FINAL SUMMARY");
    console.log("================");
    console.log(
      `Total Heap Increase: ${(totalIncrease / 1024 / 1024).toFixed(2)}MB`
    );
    console.log(
      `Total RSS Increase: ${(rssIncrease / 1024 / 1024).toFixed(2)}MB`
    );

    if (totalIncrease > 100 * 1024 * 1024) {
      console.log(
        "⚠️  CONFIRMED: Significant memory increase detected - our theory is likely correct!"
      );
    } else {
      console.log(
        "✅ Memory usage appears reasonable - our theory may need refinement."
      );
    }
  } catch (error) {
    console.error("❌ Monitoring failed:", error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  MemoryMonitor,
  testDatabaseConnectionPools,
  testLargeDataProcessing,
  testEmbeddingOperations,
};
