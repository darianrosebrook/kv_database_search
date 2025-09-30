#!/usr/bin/env tsx

/**
 * CAWS Quality Gate Verification Tool
 * @author @darianrosebrook
 *
 * Verifies all quality gates and provides detailed reporting
 */

import { CawsGateChecker } from "./shared/gate-checker.ts";
import * as fs from "fs";
import * as path from "path";

interface VerificationResult {
  coverage: {
    passed: boolean;
    score: number;
    details: any;
  };
  mutation: {
    passed: boolean;
    score: number;
    details: any;
  };
  contracts: {
    passed: boolean;
    score: number;
    details: any;
  };
  trustScore: {
    passed: boolean;
    score: number;
    details: any;
  };
  overallPassed: boolean;
}

async function verifyQualityGates(
  tier: number = 2
): Promise<VerificationResult> {
  const checker = new CawsGateChecker();
  const workingDirectory = process.cwd();

  console.log("🔍 CAWS Quality Gate Verification");
  console.log("==================================");
  console.log("");
  console.log(`📂 Working Directory: ${workingDirectory}`);
  console.log(`🎯 Target Tier: ${tier}`);
  console.log("");

  // Check coverage
  console.log("📊 Checking Coverage...");
  const coverageResult = await checker.checkCoverage({
    tier,
    workingDirectory,
  });
  console.log(
    `   ${coverageResult.passed ? "✅" : "❌"} Coverage: ${(
      coverageResult.score * 100
    ).toFixed(1)}%`
  );
  if (coverageResult.details.error) {
    console.log(`   ⚠️  ${coverageResult.details.error}`);
  }
  console.log("");

  // Check mutation
  console.log("🧬 Checking Mutation Testing...");
  const mutationResult = await checker.checkMutation({
    tier,
    workingDirectory,
  });
  console.log(
    `   ${mutationResult.passed ? "✅" : "❌"} Mutation: ${(
      mutationResult.score * 100
    ).toFixed(1)}%`
  );
  if (mutationResult.details.error) {
    console.log(`   ⚠️  ${mutationResult.details.error}`);
  }
  console.log("");

  // Check contracts
  console.log("📋 Checking Contract Tests...");
  const contractsResult = await checker.checkContracts({
    tier,
    workingDirectory,
  });
  console.log(
    `   ${contractsResult.passed ? "✅" : "❌"} Contracts: ${
      contractsResult.passed ? "PASSED" : "FAILED"
    }`
  );
  if (contractsResult.details.error) {
    console.log(`   ⚠️  ${contractsResult.details.error}`);
  }
  console.log("");

  // Calculate trust score
  console.log("🔐 Calculating Trust Score...");
  const trustScoreResult = await checker.calculateTrustScore({
    tier,
    workingDirectory,
  });
  console.log(
    `   ${trustScoreResult.passed ? "✅" : "❌"} Trust Score: ${(
      trustScoreResult.score * 100
    ).toFixed(1)}%`
  );
  console.log("");

  // Overall result
  const overallPassed =
    coverageResult.passed &&
    mutationResult.passed &&
    contractsResult.passed &&
    trustScoreResult.passed;

  console.log("📈 Overall Result:");
  console.log(`   ${overallPassed ? "✅ PASSED" : "❌ FAILED"}`);
  console.log("");

  // Detailed breakdown
  console.log("📋 Detailed Breakdown:");
  console.log("----------------------");

  if (coverageResult.details.branch_coverage !== undefined) {
    console.log(`Coverage:`);
    console.log(
      `  • Branch: ${(coverageResult.details.branch_coverage * 100).toFixed(
        1
      )}%`
    );
    console.log(
      `  • Functions: ${(
        coverageResult.details.functions_coverage * 100
      ).toFixed(1)}%`
    );
    console.log(
      `  • Lines: ${(coverageResult.details.lines_coverage * 100).toFixed(1)}%`
    );
  }

  if (mutationResult.details.killed !== undefined) {
    console.log(`Mutation:`);
    console.log(`  • Killed: ${mutationResult.details.killed}`);
    console.log(`  • Survived: ${mutationResult.details.survived}`);
    console.log(`  • Total: ${mutationResult.details.total}`);
  }

  if (contractsResult.details.tests_total !== undefined) {
    console.log(`Contracts:`);
    console.log(`  • Passed: ${contractsResult.details.tests_passed}`);
    console.log(`  • Total: ${contractsResult.details.tests_total}`);
  }

  console.log("");

  return {
    coverage: {
      passed: coverageResult.passed,
      score: coverageResult.score,
      details: coverageResult.details,
    },
    mutation: {
      passed: mutationResult.passed,
      score: mutationResult.score,
      details: mutationResult.details,
    },
    contracts: {
      passed: contractsResult.passed,
      score: contractsResult.score,
      details: contractsResult.details,
    },
    trustScore: {
      passed: trustScoreResult.passed,
      score: trustScoreResult.score,
      details: trustScoreResult.details,
    },
    overallPassed,
  };
}

async function main() {
  const tier = parseInt(process.env.TIER || "2");

  try {
    const result = await verifyQualityGates(tier);

    // Save results to file
    const resultsPath = path.join(
      process.cwd(),
      "reports",
      "quality-gate-results.json"
    );
    fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
    fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));

    console.log(`💾 Results saved to: ${resultsPath}`);
    console.log("");

    // Exit with appropriate code
    process.exit(result.overallPassed ? 0 : 1);
  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  }
}

// Execute if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { verifyQualityGates };
