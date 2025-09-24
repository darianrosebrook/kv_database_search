#!/usr/bin/env tsx

import * as fs from "fs";
import * as path from "path";

/**
 * CAWS Performance Budget Validation
 * Validates API performance against working spec budgets
 */

interface PerformanceBudget {
  api_p95_ms: number;
  ingestion_rate?: number;
  ocr_processing_ms?: number;
  speech_processing_per_second?: number;
}

interface PerformanceResult {
  endpoint: string;
  p95_ms: number;
  budget_ms: number;
  passed: boolean;
  deviation_percent: number;
}

class PerformanceBudgetValidator {
  private workingSpec: any;
  private budgets: PerformanceBudget;

  constructor() {
    this.loadWorkingSpec();
  }

  private loadWorkingSpec(): void {
    const specPath = path.join(process.cwd(), ".caws", "working-spec.yaml");

    if (!fs.existsSync(specPath)) {
      throw new Error("Working spec not found at .caws/working-spec.yaml");
    }

    // Simple YAML parsing (for basic key-value structure)
    const content = fs.readFileSync(specPath, "utf-8");
    const perfSection = this.extractPerfSection(content);

    if (!perfSection) {
      throw new Error("Performance budgets not found in working spec");
    }

    this.budgets = perfSection;
  }

  private extractPerfSection(content: string): PerformanceBudget | null {
    const lines = content.split("\n");
    let inPerfSection = false;
    const perfData: any = {};

    for (const line of lines) {
      if (line.includes("perf:")) {
        inPerfSection = true;
        continue;
      }

      if (inPerfSection && line.startsWith("  security:")) {
        break; // End of perf section
      }

      if (inPerfSection && line.includes(":")) {
        const [key, value] = line.split(":").map((s) => s.trim());
        if (key && value) {
          // Remove quotes and convert to number
          const numValue = parseFloat(value.replace(/['"]/g, ""));
          if (!isNaN(numValue)) {
            perfData[key] = numValue;
          }
        }
      }
    }

    return Object.keys(perfData).length > 0
      ? (perfData as PerformanceBudget)
      : null;
  }

  async validateBudgets(): Promise<{
    results: PerformanceResult[];
    overall_passed: boolean;
    summary: string;
  }> {
    const results: PerformanceResult[] = [];

    // Mock performance measurements (in real implementation, these would come from actual metrics)
    const mockMeasurements = this.getMockMeasurements();

    for (const measurement of mockMeasurements) {
      const budget = this.budgets.api_p95_ms || 500; // Default 500ms budget
      const passed = measurement.p95_ms <= budget;
      const deviation_percent = ((measurement.p95_ms - budget) / budget) * 100;

      results.push({
        endpoint: measurement.endpoint,
        p95_ms: measurement.p95_ms,
        budget_ms: budget,
        passed,
        deviation_percent,
      });
    }

    const overall_passed = results.every((r) => r.passed);
    const passed_count = results.filter((r) => r.passed).length;
    const failed_count = results.length - passed_count;

    let summary = `Performance Budget Validation: ${passed_count}/${results.length} endpoints passed`;

    if (!overall_passed) {
      summary += `\n❌ FAILED: ${failed_count} endpoints exceeded budget`;
      results
        .filter((r) => !r.passed)
        .forEach((r) => {
          summary += `\n  • ${r.endpoint}: ${r.p95_ms}ms > ${
            r.budget_ms
          }ms budget (${r.deviation_percent.toFixed(1)}% over)`;
        });
    } else {
      summary += "\n✅ PASSED: All endpoints within performance budgets";
    }

    return {
      results,
      overall_passed,
      summary,
    };
  }

  private getMockMeasurements(): Array<{ endpoint: string; p95_ms: number }> {
    // Mock measurements - in real implementation, these would come from:
    // - Application Performance Monitoring (APM) data
    // - Load testing results
    // - Real user monitoring (RUM) data
    // - CI/CD performance metrics

    return [
      { endpoint: "/search", p95_ms: 350 },
      { endpoint: "/documents", p95_ms: 200 },
      { endpoint: "/analytics", p95_ms: 450 },
      { endpoint: "/ingest", p95_ms: 800 }, // This might fail the 500ms budget
    ];
  }
}

// CLI execution
async function main() {
  try {
    const validator = new PerformanceBudgetValidator();
    const validation = await validator.validateBudgets();

    console.log("🚀 CAWS Performance Budget Validation");
    console.log("=====================================");
    console.log();

    console.log("📊 Budgets from Working Spec:");
    console.log(`  • API p95: ${validator["budgets"].api_p95_ms}ms`);
    if (validator["budgets"].ingestion_rate) {
      console.log(
        `  • Ingestion rate: ${validator["budgets"].ingestion_rate} files/sec`
      );
    }
    if (validator["budgets"].ocr_processing_ms) {
      console.log(
        `  • OCR processing: ${validator["budgets"].ocr_processing_ms}ms per image`
      );
    }
    if (validator["budgets"].speech_processing_per_second) {
      console.log(
        `  • Speech processing: ${validator["budgets"].speech_processing_per_second} sec/sec`
      );
    }

    console.log();
    console.log("📈 Validation Results:");
    validation.results.forEach((result) => {
      const status = result.passed ? "✅" : "❌";
      const deviation =
        result.deviation_percent > 0
          ? `(+${result.deviation_percent.toFixed(1)}%)`
          : "";
      console.log(
        `  ${status} ${result.endpoint}: ${result.p95_ms}ms ${deviation}`
      );
    });

    console.log();
    console.log(validation.summary);

    // Exit with appropriate code for CI/CD
    process.exit(validation.overall_passed ? 0 : 1);
  } catch (error) {
    console.error("❌ Performance budget validation failed:", error);
    process.exit(1);
  }
}

// Execute if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { PerformanceBudgetValidator, PerformanceBudget, PerformanceResult };
