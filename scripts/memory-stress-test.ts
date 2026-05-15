#!/usr/bin/env tsx

/**
 * Memory Stress Test Script
 *
 * Simulates the actual conditions that occur during development with Cursor:
 * - Multiple file watchers
 * - Continuous test runs
 * - TypeScript compilation
 * - Database connections
 * - Large file processing
 */

import { performance } from "perf_hooks";
import { spawn, ChildProcess } from "child_process";
import * as fs from "fs";
import * as path from "path";
import chokidar from "chokidar";

interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
  phase: string;
}

class StressTestMonitor {
  private snapshots: MemorySnapshot[] = [];
  private processes: ChildProcess[] = [];
  private watchers: any[] = [];
  private isRunning: boolean = false;

  start(): void {
    this.isRunning = true;
    console.log("🔥 Starting Memory Stress Test");
    console.log("Simulating Cursor development environment...\n");

    this.takeSnapshot("start");
    this.simulateFileWatching();
    this.simulateContinuousTests();
    this.simulateTypeScriptCompilation();
    this.simulateDatabaseOperations();
    this.simulateLargeFileProcessing();
  }

  private takeSnapshot(phase: string): void {
    const memUsage = process.memoryUsage();
    const snapshot: MemorySnapshot = {
      timestamp: performance.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      arrayBuffers: memUsage.arrayBuffers,
      phase,
    };

    this.snapshots.push(snapshot);

    const memMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
    const rssMB = (memUsage.rss / 1024 / 1024).toFixed(2);
    console.log(`📊 [${phase.toUpperCase()}] Heap=${memMB}MB, RSS=${rssMB}MB`);
  }

  private simulateFileWatching(): void {
    console.log("👀 Starting file watchers...");

    // Watch multiple directories like Cursor does
    const watchDirs = ["apps/kv_database/src", "tests", "scripts"];

    watchDirs.forEach((dir) => {
      if (fs.existsSync(dir)) {
        const watcher = chokidar.watch(dir, {
          ignored: /(^|[/\\])\../, // ignore dotfiles
          persistent: true,
          ignoreInitial: true,
        });

        watcher.on("change", (path) => {
          this.takeSnapshot(`file-change-${path.split("/").pop()}`);
        });

        this.watchers.push(watcher);
      }
    });
  }

  private simulateContinuousTests(): void {
    console.log("🧪 Starting continuous test runs...");

    // Run tests in a loop to simulate continuous testing
    let testCount = 0;
    const runTests = () => {
      if (!this.isRunning) return;

      testCount++;
      this.takeSnapshot(`test-run-${testCount}-start`);

      const testProcess = spawn("npm", ["run", "test:unit:quick"], {
        stdio: "pipe",
        cwd: process.cwd(),
      });

      this.processes.push(testProcess);

      testProcess.on("close", () => {
        this.takeSnapshot(`test-run-${testCount}-end`);

        // Schedule next test run
        if (this.isRunning && testCount < 5) {
          setTimeout(runTests, 2000);
        }
      });
    };

    runTests();
  }

  private simulateTypeScriptCompilation(): void {
    console.log("🔨 Starting TypeScript compilation...");

    const compileProcess = spawn("npx", ["tsc", "--noEmit"], {
      stdio: "pipe",
      cwd: process.cwd(),
    });

    this.processes.push(compileProcess);

    compileProcess.on("close", () => {
      this.takeSnapshot("typescript-compile-end");
    });
  }

  private simulateDatabaseOperations(): void {
    console.log("🗄️ Simulating database operations...");

    // Simulate multiple database connections
    const simulateDbConnections = async () => {
      try {
        const { TestObsidianDatabase } = await import(
          "../apps/kv_database/src/lib/database.js"
        );

        const connections = [];
        for (let i = 0; i < 10; i++) {
          const db = new TestObsidianDatabase("sqlite::memory:");
          await db.initialize();
          connections.push(db);
          this.takeSnapshot(`db-connection-${i + 1}`);
        }

        // Simulate some operations
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Cleanup
        for (const conn of connections) {
          if (conn.close) await conn.close();
        }

        this.takeSnapshot("db-operations-end");
      } catch (error) {
        console.error("Database simulation failed:", error);
      }
    };

    simulateDbConnections();
  }

  private simulateLargeFileProcessing(): void {
    console.log("📁 Simulating large file processing...");

    // Create and process large files
    const processLargeFiles = async () => {
      const tempDir = path.join(process.cwd(), "temp-stress-test");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const files = [];
      for (let i = 0; i < 5; i++) {
        const filePath = path.join(tempDir, `large-file-${i}.txt`);
        const content = "Large content block. ".repeat(10000); // ~200KB per file
        fs.writeFileSync(filePath, content);
        files.push(filePath);
        this.takeSnapshot(`large-file-${i + 1}-created`);
      }

      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Cleanup
      files.forEach((file) => {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      });
      if (fs.existsSync(tempDir)) {
        fs.rmdirSync(tempDir);
      }

      this.takeSnapshot("large-file-processing-end");
    };

    processLargeFiles();
  }

  async stop(): Promise<void> {
    console.log("\n🛑 Stopping stress test...");
    this.isRunning = false;

    // Kill all processes
    this.processes.forEach((proc) => {
      if (!proc.killed) {
        proc.kill();
      }
    });

    // Close all watchers
    this.watchers.forEach((watcher) => {
      watcher.close();
    });

    // Wait a bit for cleanup
    await new Promise((resolve) => setTimeout(resolve, 2000));

    this.takeSnapshot("cleanup-complete");
    this.generateReport();
  }

  private generateReport(): void {
    if (this.snapshots.length < 2) return;

    const start = this.snapshots[0];
    const end = this.snapshots[this.snapshots.length - 1];

    const heapIncrease = end.heapUsed - start.heapUsed;
    const rssIncrease = end.rss - start.rss;
    const maxHeap = Math.max(...this.snapshots.map((s) => s.heapUsed));
    const maxRss = Math.max(...this.snapshots.map((s) => s.rss));

    console.log("\n📈 STRESS TEST REPORT");
    console.log("=====================");
    console.log(
      `Duration: ${((end.timestamp - start.timestamp) / 1000).toFixed(2)}s`
    );
    console.log(`Snapshots: ${this.snapshots.length}`);
    console.log(`Processes: ${this.processes.length}`);
    console.log(`Watchers: ${this.watchers.length}`);
    console.log(`\nHeap Usage:`);
    console.log(`  Start: ${(start.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  End: ${(end.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Peak: ${(maxHeap / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Increase: ${(heapIncrease / 1024 / 1024).toFixed(2)}MB`);
    console.log(`\nRSS Usage:`);
    console.log(`  Start: ${(start.rss / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  End: ${(end.rss / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Peak: ${(maxRss / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Increase: ${(rssIncrease / 1024 / 1024).toFixed(2)}MB`);

    // Memory leak detection
    if (heapIncrease > 100 * 1024 * 1024) {
      // 100MB
      console.log(
        "\n⚠️  CRITICAL: Significant memory leak detected (>100MB heap increase)"
      );
      console.log("   This could definitely cause Cursor to crash!");
    } else if (heapIncrease > 50 * 1024 * 1024) {
      // 50MB
      console.log(
        "\n⚠️  WARNING: Moderate memory increase detected (>50MB heap increase)"
      );
      console.log("   This could cause issues with Cursor over time.");
    } else if (rssIncrease > 200 * 1024 * 1024) {
      // 200MB
      console.log("\n⚠️  WARNING: High RSS memory increase (>200MB)");
      console.log("   This could cause system memory pressure.");
    } else {
      console.log(
        "\n✅ Memory usage appears reasonable under stress conditions."
      );
    }

    // Show memory growth pattern
    console.log("\n📊 Memory Growth Pattern:");
    const phases = [...new Set(this.snapshots.map((s) => s.phase))];
    phases.forEach((phase) => {
      const phaseSnapshots = this.snapshots.filter((s) => s.phase === phase);
      if (phaseSnapshots.length > 0) {
        const avgHeap =
          phaseSnapshots.reduce((sum, s) => sum + s.heapUsed, 0) /
          phaseSnapshots.length;
        const avgRss =
          phaseSnapshots.reduce((sum, s) => sum + s.rss, 0) /
          phaseSnapshots.length;
        console.log(
          `  ${phase}: Avg Heap=${(avgHeap / 1024 / 1024).toFixed(
            2
          )}MB, Avg RSS=${(avgRss / 1024 / 1024).toFixed(2)}MB`
        );
      }
    });
  }
}

async function main(): Promise<void> {
  const monitor = new StressTestMonitor();

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n🛑 Received SIGINT, shutting down gracefully...");
    await monitor.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
    await monitor.stop();
    process.exit(0);
  });

  // Start the stress test
  monitor.start();

  // Run for 30 seconds then stop
  setTimeout(async () => {
    await monitor.stop();
    process.exit(0);
  }, 30000);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { StressTestMonitor };
