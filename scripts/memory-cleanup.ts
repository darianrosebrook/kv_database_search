#!/usr/bin/env tsx

/**
 * Memory Cleanup Script
 *
 * Provides utilities to clean up memory and prevent Cursor crashes
 */

import { spawn } from "child_process";

class MemoryCleanup {
  /**
   * Force garbage collection if available
   */
  static forceGC(): void {
    if (global.gc) {
      console.log("🧹 Running garbage collection...");
      global.gc();
      console.log("✅ Garbage collection completed");
    } else {
      console.log(
        "⚠️  Garbage collection not available. Run with --expose-gc flag"
      );
    }
  }

  /**
   * Get current memory usage
   */
  static getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  /**
   * Log memory usage in a readable format
   */
  static logMemoryUsage(label: string = "Memory Usage"): void {
    const mem = this.getMemoryUsage();
    console.log(`📊 ${label}:`);
    console.log(`  Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  RSS: ${(mem.rss / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  External: ${(mem.external / 1024 / 1024).toFixed(2)}MB`);
    console.log(
      `  Array Buffers: ${(mem.arrayBuffers / 1024 / 1024).toFixed(2)}MB`
    );
  }

  /**
   * Check if memory usage is high
   */
  static isMemoryHigh(thresholdMB: number = 500): boolean {
    const mem = this.getMemoryUsage();
    const heapMB = mem.heapUsed / 1024 / 1024;
    const rssMB = mem.rss / 1024 / 1024;

    return heapMB > thresholdMB || rssMB > thresholdMB * 2;
  }

  /**
   * Clean up and restart if memory is too high
   */
  static async cleanupIfNeeded(thresholdMB: number = 500): Promise<boolean> {
    if (this.isMemoryHigh(thresholdMB)) {
      console.log("⚠️  High memory usage detected, cleaning up...");
      this.forceGC();

      // Wait a bit for GC to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (this.isMemoryHigh(thresholdMB)) {
        console.log(
          "❌ Memory still high after cleanup. Consider restarting Cursor."
        );
        return false;
      } else {
        console.log("✅ Memory usage reduced after cleanup.");
        return true;
      }
    }

    return true;
  }

  /**
   * Run tests with memory monitoring
   */
  static async runTestsWithMemoryMonitoring(): Promise<void> {
    console.log("🧪 Running tests with memory monitoring...");

    this.logMemoryUsage("Before Tests");

    const testProcess = spawn("npm", ["run", "test:unit:quick"], {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    return new Promise((resolve, reject) => {
      testProcess.on("close", (code) => {
        this.logMemoryUsage("After Tests");

        if (code === 0) {
          console.log("✅ Tests completed successfully");
          resolve();
        } else {
          console.log(`❌ Tests failed with code ${code}`);
          reject(new Error(`Tests failed with code ${code}`));
        }
      });

      testProcess.on("error", (error) => {
        console.error("❌ Test process error:", error);
        reject(error);
      });
    });
  }
}

// CLI interface
async function main(): Promise<void> {
  const command = process.argv[2];

  switch (command) {
    case "gc":
      MemoryCleanup.forceGC();
      break;

    case "status":
      MemoryCleanup.logMemoryUsage();
      break;

    case "check":
      const isHigh = MemoryCleanup.isMemoryHigh();
      console.log(`Memory status: ${isHigh ? "HIGH" : "OK"}`);
      break;

    case "cleanup":
      await MemoryCleanup.cleanupIfNeeded();
      break;

    case "test":
      await MemoryCleanup.runTestsWithMemoryMonitoring();
      break;

    default:
      console.log("Memory Cleanup Tool");
      console.log("Usage:");
      console.log(
        "  npm run memory:cleanup gc      - Force garbage collection"
      );
      console.log("  npm run memory:cleanup status  - Show memory usage");
      console.log("  npm run memory:cleanup check   - Check if memory is high");
      console.log(
        "  npm run memory:cleanup cleanup - Clean up if memory is high"
      );
      console.log(
        "  npm run memory:cleanup test    - Run tests with monitoring"
      );
      break;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MemoryCleanup };
