#!/usr/bin/env tsx

import * as fs from "fs";
import * as path from "path";
import { CawsBaseTool } from "./shared/base-tool";
import { ValidationResult } from "./shared/types";

interface TestQualityMetrics {
  totalTests: number;
  testsWithAssertions: number;
  assertionCount: number;
  averageAssertionsPerTest: number;
  specCoverage: {
    totalAcceptanceCriteria: number;
    coveredAcceptanceCriteria: number;
    coveragePercentage: number;
    missingTests: string[];
  };
  weakTests: Array<{
    testName: string;
    reason: string;
    suggestion: string;
  }>;
  propertyBasedTests: number;
  edgeCaseTests: number;
}

export class TestQualityAnalyzer extends CawsBaseTool {
  /**
   * Analyze test quality beyond just coverage metrics
   */
  async analyzeTestQuality(
    testDirectory: string,
    workingSpecPath?: string
  ): Promise<ValidationResult & { metrics?: TestQualityMetrics }> {
    try {
      const metrics: TestQualityMetrics = {
        totalTests: 0,
        testsWithAssertions: 0,
        assertionCount: 0,
        averageAssertionsPerTest: 0,
        specCoverage: {
          totalAcceptanceCriteria: 0,
          coveredAcceptanceCriteria: 0,
          coveragePercentage: 0,
          missingTests: [],
        },
        weakTests: [],
        propertyBasedTests: 0,
        edgeCaseTests: 0,
      };

      // Analyze test files
      const testFiles = this.findTestFiles(testDirectory);
      for (const file of testFiles) {
        const content = fs.readFileSync(file, "utf-8");
        this.analyzeTestFile(content, file, metrics);
      }

      // Calculate averages
      if (metrics.totalTests > 0) {
        metrics.averageAssertionsPerTest =
          metrics.assertionCount / metrics.totalTests;
      }

      // Check spec coverage if working spec provided
      if (workingSpecPath && this.pathExists(workingSpecPath)) {
        await this.checkSpecCoverage(workingSpecPath, testFiles, metrics);
      }

      // Calculate quality score
      const score = this.calculateQualityScore(metrics);
      const passed = score >= 0.7; // 70% quality threshold

      const recommendations: string[] = [];
      if (metrics.averageAssertionsPerTest < 2) {
        recommendations.push(
          "Average assertions per test is low. Consider adding more meaningful assertions."
        );
      }
      if (metrics.weakTests.length > 0) {
        recommendations.push(
          `Found ${metrics.weakTests.length} weak tests that need improvement.`
        );
      }
      if (metrics.specCoverage.coveragePercentage < 100) {
        recommendations.push(
          `${metrics.specCoverage.missingTests.length} acceptance criteria lack corresponding tests.`
        );
      }
      if (metrics.propertyBasedTests === 0) {
        recommendations.push(
          "No property-based tests found. Consider adding some for better edge case coverage."
        );
      }

      return {
        passed,
        score,
        details: { metrics },
        recommendations,
      };
    } catch (error) {
      return {
        passed: false,
        score: 0,
        details: { error: `Test quality analysis failed: ${error}` },
        errors: [`${error}`],
      };
    }
  }

  private findTestFiles(directory: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory() && !entry.name.includes("node_modules")) {
        files.push(...this.findTestFiles(fullPath));
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".test.ts") ||
          entry.name.endsWith(".test.js") ||
          entry.name.endsWith(".spec.ts") ||
          entry.name.endsWith(".spec.js"))
      ) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private analyzeTestFile(
    content: string,
    filePath: string,
    metrics: TestQualityMetrics
  ): void {
    // Count tests
    const testMatches = content.match(/(it|test|describe)\s*\(['"](.*?)['"]/g);
    if (testMatches) {
      metrics.totalTests += testMatches.length;
    }

    // Count assertions
    const assertionPatterns = [
      /expect\(/g,
      /assert\./g,
      /should\./g,
      /\.to\.(equal|be|have|include)/g,
      /toBe\(/g,
      /toEqual\(/g,
      /toHaveBeenCalled/g,
    ];

    let fileAssertionCount = 0;
    for (const pattern of assertionPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        fileAssertionCount += matches.length;
      }
    }

    metrics.assertionCount += fileAssertionCount;
    if (fileAssertionCount > 0) {
      metrics.testsWithAssertions += testMatches?.length || 0;
    }

    // Detect weak tests
    this.detectWeakTests(content, filePath, metrics);

    // Count property-based tests
    if (content.includes("fc.assert") || content.includes("fast-check")) {
      const propertyTests = content.match(/fc\.assert/g);
      if (propertyTests) {
        metrics.propertyBasedTests += propertyTests.length;
      }
    }

    // Count edge case tests
    const edgeCaseIndicators = [
      /edge case/i,
      /boundary/i,
      /null|undefined|empty/i,
      /zero|negative|max|min/i,
    ];
    for (const pattern of edgeCaseIndicators) {
      const matches = content.match(pattern);
      if (matches) {
        metrics.edgeCaseTests += matches.length;
      }
    }
  }

  private detectWeakTests(
    content: string,
    filePath: string,
    metrics: TestQualityMetrics
  ): void {
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Test without assertions
      if (line.match(/(it|test)\s*\(['"](.*?)['"]/)) {
        const testName = line.match(/['"](.*?)['"]/)?.[1] || "unknown";
        const testBlock = this.extractTestBlock(lines, i);

        // Check for assertions in test block
        const hasAssertion = assertionPatterns.some((pattern) =>
          pattern.test(testBlock)
        );

        if (!hasAssertion) {
          metrics.weakTests.push({
            testName,
            reason: "No assertions found",
            suggestion: "Add meaningful assertions to verify behavior",
          });
        }

        // Check for trivial assertions
        if (testBlock.match(/expect\(true\)\.toBe\(true\)/)) {
          metrics.weakTests.push({
            testName,
            reason: "Trivial assertion (always true)",
            suggestion: "Replace with meaningful behavior verification",
          });
        }

        // Check for only checking function runs
        if (
          testBlock.match(/expect\(\(\) => .*\)\.not\.toThrow/) &&
          !testBlock.match(/expect\(.*\)\.toBe/)
        ) {
          metrics.weakTests.push({
            testName,
            reason: "Only checks that function doesn't throw",
            suggestion:
              "Add assertions to verify the function's actual behavior",
          });
        }
      }
    }
  }

  private extractTestBlock(lines: string[], startIndex: number): string {
    let braceCount = 0;
    let blockLines: string[] = [];
    let started = false;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      blockLines.push(line);

      for (const char of line) {
        if (char === "{") {
          braceCount++;
          started = true;
        }
        if (char === "}") {
          braceCount--;
        }
      }

      if (started && braceCount === 0) {
        break;
      }
    }

    return blockLines.join("\n");
  }

  private async checkSpecCoverage(
    specPath: string,
    testFiles: string[],
    metrics: TestQualityMetrics
  ): Promise<void> {
    const spec = this.readYamlFile(specPath);
    if (!spec || !spec.acceptance) {
      return;
    }

    const acceptanceCriteria = spec.acceptance as Array<{
      id: string;
      given: string;
      when: string;
      then: string;
    }>;
    metrics.specCoverage.totalAcceptanceCriteria = acceptanceCriteria.length;

    // Check if each acceptance criterion has corresponding tests
    const allTestContent = testFiles
      .map((file) => fs.readFileSync(file, "utf-8"))
      .join("\n");

    for (const criterion of acceptanceCriteria) {
      const hasTest =
        allTestContent.includes(criterion.id) ||
        allTestContent.includes(criterion.given) ||
        allTestContent.includes(criterion.when) ||
        allTestContent.includes(criterion.then);

      if (hasTest) {
        metrics.specCoverage.coveredAcceptanceCriteria++;
      } else {
        metrics.specCoverage.missingTests.push(
          `${criterion.id}: ${criterion.given} → ${criterion.when} → ${criterion.then}`
        );
      }
    }

    if (metrics.specCoverage.totalAcceptanceCriteria > 0) {
      metrics.specCoverage.coveragePercentage =
        (metrics.specCoverage.coveredAcceptanceCriteria /
          metrics.specCoverage.totalAcceptanceCriteria) *
        100;
    }
  }

  private calculateQualityScore(metrics: TestQualityMetrics): number {
    const weights = {
      assertions: 0.25,
      specCoverage: 0.35,
      propertyTests: 0.15,
      edgeCases: 0.15,
      weakTests: 0.1,
    };

    // Assertion score (0-1 based on average)
    const assertionScore = Math.min(metrics.averageAssertionsPerTest / 3, 1);

    // Spec coverage score (0-1)
    const specScore = metrics.specCoverage.coveragePercentage / 100;

    // Property test score (0-1, bonus for having them)
    const propertyScore = metrics.propertyBasedTests > 0 ? 1 : 0;

    // Edge case score (0-1, based on presence)
    const edgeScore = metrics.edgeCaseTests > 0 ? 1 : 0;

    // Weak test penalty (0-1, lower is better)
    const weakTestRatio =
      metrics.totalTests > 0
        ? metrics.weakTests.length / metrics.totalTests
        : 0;
    const weakTestScore = 1 - Math.min(weakTestRatio, 1);

    return (
      weights.assertions * assertionScore +
      weights.specCoverage * specScore +
      weights.propertyTests * propertyScore +
      weights.edgeCases * edgeScore +
      weights.weakTests * weakTestScore
    );
  }
}

const assertionPatterns = [
  /expect\(/g,
  /assert\./g,
  /should\./g,
  /\.to\.(equal|be|have|include)/g,
  /toBe\(/g,
  /toEqual\(/g,
  /toHaveBeenCalled/g,
];

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const command = process.argv[2];
    const testDir = process.argv[3] || "tests";
    const specPath = process.argv[4];

    const analyzer = new TestQualityAnalyzer();

    switch (command) {
      case "analyze": {
        try {
          const result = await analyzer.analyzeTestQuality(testDir, specPath);

          console.log("\n🧪 Test Quality Analysis");
          console.log("=".repeat(50));
          console.log(
            `\n${result.passed ? "✅" : "❌"} Quality Score: ${(
              result.score * 100
            ).toFixed(1)}%`
          );

          if (result.details?.metrics) {
            const m = result.details.metrics as TestQualityMetrics;
            console.log(`\n📊 Metrics:`);
            console.log(`  Total Tests: ${m.totalTests}`);
            console.log(
              `  Tests with Assertions: ${m.testsWithAssertions} (${(
                (m.testsWithAssertions / m.totalTests) *
                100
              ).toFixed(1)}%)`
            );
            console.log(`  Total Assertions: ${m.assertionCount}`);
            console.log(
              `  Avg Assertions/Test: ${m.averageAssertionsPerTest.toFixed(2)}`
            );
            console.log(`  Property-Based Tests: ${m.propertyBasedTests}`);
            console.log(`  Edge Case Tests: ${m.edgeCaseTests}`);

            console.log(`\n📋 Spec Coverage:`);
            console.log(
              `  Acceptance Criteria: ${m.specCoverage.totalAcceptanceCriteria}`
            );
            console.log(
              `  Covered: ${
                m.specCoverage.coveredAcceptanceCriteria
              } (${m.specCoverage.coveragePercentage.toFixed(1)}%)`
            );

            if (m.specCoverage.missingTests.length > 0) {
              console.log(`\n⚠️  Missing Tests for Acceptance Criteria:`);
              m.specCoverage.missingTests.forEach((missing) => {
                console.log(`    - ${missing}`);
              });
            }

            if (m.weakTests.length > 0) {
              console.log(`\n🔍 Weak Tests Found:`);
              m.weakTests.slice(0, 5).forEach((weak) => {
                console.log(`    - ${weak.testName}`);
                console.log(`      Reason: ${weak.reason}`);
                console.log(`      Suggestion: ${weak.suggestion}`);
              });
              if (m.weakTests.length > 5) {
                console.log(`    ... and ${m.weakTests.length - 5} more`);
              }
            }
          }

          if (result.recommendations && result.recommendations.length > 0) {
            console.log(`\n💡 Recommendations:`);
            result.recommendations.forEach((rec) => {
              console.log(`  - ${rec}`);
            });
          }

          process.exit(result.passed ? 0 : 1);
        } catch (error) {
          console.error(`❌ Analysis failed: ${error}`);
          process.exit(1);
        }
        break;
      }

      default:
        console.log("CAWS Test Quality Analyzer");
        console.log("");
        console.log("Usage:");
        console.log(
          "  test-quality analyze [test-dir] [spec-path]  - Analyze test quality"
        );
        console.log("");
        console.log("Examples:");
        console.log("  test-quality analyze tests .caws/working-spec.yml");
        console.log("  test-quality analyze apps/kv_database/tests");
        break;
    }
  })();
}
