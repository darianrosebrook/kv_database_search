#!/usr/bin/env tsx

import * as fs from "fs";
import * as path from "path";

/**
 * CAWS Accessibility Validator
 * Performs static accessibility checks on design tokens and code
 */

interface AccessibilityResult {
  passed: boolean;
  violations: Array<{
    rule: string;
    severity: "error" | "warning" | "info";
    message: string;
    location?: string;
  }>;
  score: number;
  recommendations: string[];
}

class AccessibilityValidator {
  async validateDesignTokens(): Promise<AccessibilityResult> {
    const violations: AccessibilityResult["violations"] = [];
    const recommendations: string[] = [];

    try {
      // Check if design token validation exists
      const tokenValidatorPath = path.join(
        process.cwd(),
        "apps/rag_web_search_tool/utils/accessibility/tokenValidator.mjs"
      );

      if (!fs.existsSync(tokenValidatorPath)) {
        violations.push({
          rule: "missing-token-validator",
          severity: "error",
          message: "Design token accessibility validator not found",
          location: tokenValidatorPath,
        });
        recommendations.push("Implement design token accessibility validation");
      }

      // Check for accessibility validation reports
      const reportPath = path.join(
        process.cwd(),
        "apps/rag_web_search_tool/accessibility-report.txt"
      );

      if (fs.existsSync(reportPath)) {
        const report = fs.readFileSync(reportPath, "utf-8");
        const passingTests = (report.match(/✅/g) || []).length;
        const totalTests = (report.match(/✅|❌/g) || []).length;

        if (totalTests > 0) {
          const passRate = passingTests / totalTests;
          if (passRate < 0.9) {
            // Less than 90% pass rate
            violations.push({
              rule: "low-accessibility-score",
              severity: "warning",
              message: `Accessibility score: ${(passRate * 100).toFixed(
                1
              )}% (${passingTests}/${totalTests} tests passed)`,
              location: reportPath,
            });
            recommendations.push(
              "Improve design token accessibility compliance"
            );
          }
        }
      } else {
        violations.push({
          rule: "missing-accessibility-report",
          severity: "warning",
          message: "Accessibility validation report not found",
          location: reportPath,
        });
        recommendations.push("Generate accessibility validation report");
      }
    } catch (error) {
      violations.push({
        rule: "validation-error",
        severity: "error",
        message: `Accessibility validation failed: ${error}`,
      });
    }

    const passed =
      violations.filter((v) => v.severity === "error").length === 0;
    const score = Math.max(0, 100 - violations.length * 10); // Basic scoring

    return {
      passed,
      violations,
      score,
      recommendations,
    };
  }

  async validateCodeAccessibility(): Promise<AccessibilityResult> {
    const violations: AccessibilityResult["violations"] = [];
    const recommendations: string[] = [];

    try {
      // Check for axe-core tests
      const axeTestPath = path.join(
        process.cwd(),
        "tests/axe/accessibility.e2e.test.ts"
      );

      if (!fs.existsSync(axeTestPath)) {
        violations.push({
          rule: "missing-axe-tests",
          severity: "error",
          message: "Axe-core accessibility tests not found",
          location: axeTestPath,
        });
        recommendations.push(
          "Implement axe-core accessibility tests for web interfaces"
        );
      }

      // Check for ARIA usage in components
      const srcDir = path.join(process.cwd(), "src");
      if (fs.existsSync(srcDir)) {
        const ariaUsage = this.checkAriaUsage(srcDir);
        if (ariaUsage.ariaCount === 0) {
          violations.push({
            rule: "no-aria-usage",
            severity: "warning",
            message: "No ARIA attributes found in codebase",
            location: srcDir,
          });
          recommendations.push(
            "Consider adding ARIA attributes for complex UI components"
          );
        }
      }

      // Check for semantic HTML usage
      const semanticHtml = this.checkSemanticHtml(srcDir);
      if (semanticHtml.semanticElements.length === 0) {
        violations.push({
          rule: "no-semantic-html",
          severity: "warning",
          message: "Limited use of semantic HTML elements",
          location: srcDir,
        });
        recommendations.push(
          "Use more semantic HTML elements (header, nav, main, etc.)"
        );
      }
    } catch (error) {
      violations.push({
        rule: "code-validation-error",
        severity: "error",
        message: `Code accessibility validation failed: ${error}`,
      });
    }

    const passed =
      violations.filter((v) => v.severity === "error").length === 0;
    const score = Math.max(0, 100 - violations.length * 15); // Stricter scoring for code

    return {
      passed,
      violations,
      score,
      recommendations,
    };
  }

  private checkAriaUsage(dirPath: string): {
    ariaCount: number;
    files: string[];
  } {
    const results = { ariaCount: 0, files: [] as string[] };

    function scanDirectory(dir: string) {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (
          stat.isDirectory() &&
          !file.startsWith(".") &&
          file !== "node_modules"
        ) {
          scanDirectory(filePath);
        } else if (
          file.endsWith(".tsx") ||
          file.endsWith(".ts") ||
          file.endsWith(".jsx") ||
          file.endsWith(".js")
        ) {
          try {
            const content = fs.readFileSync(filePath, "utf-8");
            const ariaMatches = content.match(/aria-[a-zA-Z-]+/g);
            if (ariaMatches) {
              results.ariaCount += ariaMatches.length;
              results.files.push(filePath);
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    }

    scanDirectory(dirPath);
    return results;
  }

  private checkSemanticHtml(dirPath: string): {
    semanticElements: string[];
    files: string[];
  } {
    const semanticElements = [
      "header",
      "nav",
      "main",
      "section",
      "article",
      "aside",
      "footer",
    ];
    const results = { semanticElements: [] as string[], files: [] as string[] };

    function scanDirectory(dir: string) {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (
          stat.isDirectory() &&
          !file.startsWith(".") &&
          file !== "node_modules"
        ) {
          scanDirectory(filePath);
        } else if (
          file.endsWith(".tsx") ||
          file.endsWith(".ts") ||
          file.endsWith(".jsx") ||
          file.endsWith(".js")
        ) {
          try {
            const content = fs.readFileSync(filePath, "utf-8");
            for (const element of semanticElements) {
              if (
                content.includes(`<${element}`) &&
                !results.semanticElements.includes(element)
              ) {
                results.semanticElements.push(element);
                results.files.push(filePath);
              }
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    }

    scanDirectory(dirPath);
    return results;
  }

  async validateAll(): Promise<{
    designTokens: AccessibilityResult;
    codeAccessibility: AccessibilityResult;
    overall: {
      passed: boolean;
      score: number;
      recommendations: string[];
    };
  }> {
    const [designTokens, codeAccessibility] = await Promise.all([
      this.validateDesignTokens(),
      this.validateCodeAccessibility(),
    ]);

    const overallPassed = designTokens.passed && codeAccessibility.passed;
    const overallScore = Math.round(
      (designTokens.score + codeAccessibility.score) / 2
    );
    const allRecommendations = [
      ...designTokens.recommendations,
      ...codeAccessibility.recommendations,
    ];

    return {
      designTokens,
      codeAccessibility,
      overall: {
        passed: overallPassed,
        score: overallScore,
        recommendations: allRecommendations,
      },
    };
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const scope = args[0] || "all";

  try {
    const validator = new AccessibilityValidator();

    console.log("♿ CAWS Accessibility Validation");
    console.log("================================");
    console.log();

    switch (scope) {
      case "tokens":
        const tokenResult = await validator.validateDesignTokens();
        printResult("Design Tokens", tokenResult);
        break;

      case "code":
        const codeResult = await validator.validateCodeAccessibility();
        printResult("Code Accessibility", codeResult);
        break;

      case "all":
      default:
        const allResults = await validator.validateAll();
        printResult("Design Tokens", allResults.designTokens);
        printResult("Code Accessibility", allResults.codeAccessibility);
        console.log();
        console.log("📊 Overall Results:");
        console.log(`  Score: ${allResults.overall.score}/100`);
        console.log(
          `  Status: ${allResults.overall.passed ? "✅ PASS" : "❌ FAIL"}`
        );
        if (allResults.overall.recommendations.length > 0) {
          console.log("  Recommendations:");
          allResults.overall.recommendations.forEach((rec) =>
            console.log(`    • ${rec}`)
          );
        }
        break;
    }

    // Exit with appropriate code for CI/CD
    const exitCode =
      scope === "all"
        ? (await validator.validateAll()).overall.passed
          ? 0
          : 1
        : scope === "tokens"
        ? (await validator.validateDesignTokens()).passed
          ? 0
          : 1
        : (await validator.validateCodeAccessibility()).passed
        ? 0
        : 1;

    process.exit(exitCode);
  } catch (error) {
    console.error("❌ Accessibility validation failed:", error);
    process.exit(1);
  }
}

function printResult(name: string, result: AccessibilityResult) {
  console.log(`${name}:`);
  console.log(`  Score: ${result.score}/100`);
  console.log(`  Status: ${result.passed ? "✅ PASS" : "❌ FAIL"}`);

  if (result.violations.length > 0) {
    console.log("  Violations:");
    result.violations.forEach((v) => {
      const icon =
        v.severity === "error" ? "❌" : v.severity === "warning" ? "⚠️" : "ℹ️";
      console.log(`    ${icon} ${v.rule}: ${v.message}`);
      if (v.location) console.log(`       Location: ${v.location}`);
    });
  }

  if (result.recommendations.length > 0) {
    console.log("  Recommendations:");
    result.recommendations.forEach((rec) => console.log(`    • ${rec}`));
  }

  console.log();
}

// Execute if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { AccessibilityValidator, AccessibilityResult };
