#!/usr/bin/env tsx

import * as fs from "fs";
import { CawsGateChecker } from "./shared/gate-checker.ts";
import { GateResult } from "./shared/types.ts";

/**
 * CAWS Trust Score Calculator
 * Computes trust score based on provenance data and quality metrics
 * (Now uses shared gate checker implementation)
 */

// CLI execution
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let provenancePath: string | null = null;
  let tier = 2;
  let workingDirectory = process.cwd();

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--tier":
        tier = parseInt(args[++i] || "2");
        break;
      case "--working-directory":
        workingDirectory = args[++i] || workingDirectory;
        break;
      default:
        if (!arg.startsWith("--")) {
          provenancePath = arg;
        }
        break;
    }
  }

  // Use default provenance path if not provided
  if (!provenancePath) {
    provenancePath = ".agent/provenance.json";
  }

  try {
    // Use the shared gate checker
    const checker = new CawsGateChecker();
    const result = await checker.calculateTrustScore({
      tier,
      workingDirectory,
    });

    console.log("🔒 CAWS Trust Score Assessment");
    console.log("================================");
    console.log();

    console.log(`📊 Overall Trust Score: ${(result.score * 100).toFixed(1)}%`);
    console.log(`🎯 Target Tier: ${tier} (≥80% required)`);
    console.log(`✅ Status: ${result.passed ? "PASS" : "FAIL"}`);
    console.log();

    console.log("📈 Component Breakdown:");
    const details = result.details;
    if (details.coverage) {
      console.log(
        `  • Coverage: ${(details.coverage.score * 100).toFixed(1)}%`
      );
    }
    if (details.mutation) {
      console.log(
        `  • Mutation: ${(details.mutation.score * 100).toFixed(1)}%`
      );
    }
    if (details.contracts) {
      console.log(
        `  • Contracts: ${details.contracts.score === 1 ? "✅" : "❌"}`
      );
    }
    if (details.a11y) {
      console.log(`  • A11y: ${details.a11y.score === 1 ? "✅" : "❌"}`);
    }
    if (details.perf) {
      console.log(`  • Performance: ${details.perf.score === 1 ? "✅" : "❌"}`);
    }
    console.log();

    if (result.errors) {
      console.log("🚨 Errors:");
      result.errors.forEach((error) => console.log(`  ${error}`));
      console.log();
    }

    // Exit with appropriate code for CI/CD
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error("❌ Trust score calculation failed:", error);
    process.exit(1);
  }
}

// Execute if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
