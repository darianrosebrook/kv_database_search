#!/usr/bin/env tsx
// @ts-nocheck

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Tier policy configuration
const TIER_POLICY = {
  1: {
    min_branch: 0.9,
    min_mutation: 0.7,
    requires_contracts: true,
    requires_manual_review: true,
  },
  2: { min_branch: 0.8, min_mutation: 0.5, requires_contracts: true },
  3: { min_branch: 0.7, min_mutation: 0.3, requires_contracts: false },
};

interface GateResult {
  passed: boolean;
  score: number;
  details: Record<string, any>;
  errors?: string[];
}

export async function checkCoverage(tier: number): Promise<GateResult> {
  try {
    // Read coverage report
    const coveragePath = path.join(
      __dirname,
      "../../coverage/coverage-summary.json"
    );

    if (!fs.existsSync(coveragePath)) {
      return {
        passed: false,
        score: 0,
        details: {
          error: "Coverage report not found. Run tests with coverage first.",
        },
        errors: ["Coverage report not found"],
      };
    }

    const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf-8"));
    const totals = coverage.total;

    const branchCoverage = totals.branches.pct / 100;
    const requiredBranch =
      TIER_POLICY[tier as keyof typeof TIER_POLICY].min_branch;

    const passed = branchCoverage >= requiredBranch;

    return {
      passed,
      score: branchCoverage,
      details: {
        branch_coverage: branchCoverage,
        required_branch: requiredBranch,
        functions_coverage: totals.functions.pct / 100,
        lines_coverage: totals.lines.pct / 100,
        statements_coverage: totals.statements.pct / 100,
      },
    };
  } catch (error) {
    return {
      passed: false,
      score: 0,
      details: { error: `Coverage check failed: ${error}` },
      errors: [`Coverage check failed: ${error}`],
    };
  }
}

export async function checkMutation(tier: number): Promise<GateResult> {
  try {
    // Read Stryker report
    const mutationPath = path.join(
      __dirname,
      "../../reports/mutation/mutation.json"
    );

    if (!fs.existsSync(mutationPath)) {
      return {
        passed: false,
        score: 0,
        details: {
          error: "Mutation report not found. Run mutation tests first.",
        },
        errors: ["Mutation report not found"],
      };
    }

    const mutation = JSON.parse(fs.readFileSync(mutationPath, "utf-8"));

    // Calculate mutation score
    const killed = mutation.metrics.killed || 0;
    const total = mutation.metrics.totalDetected || 1;
    const mutationScore = killed / total;

    const requiredMutation =
      TIER_POLICY[tier as keyof typeof TIER_POLICY].min_mutation;
    const passed = mutationScore >= requiredMutation;

    return {
      passed,
      score: mutationScore,
      details: {
        mutation_score: mutationScore,
        required_mutation: requiredMutation,
        killed: killed,
        total: total,
        survived: mutation.metrics.survived || 0,
      },
    };
  } catch (error) {
    return {
      passed: false,
      score: 0,
      details: { error: `Mutation check failed: ${error}` },
      errors: [`Mutation check failed: ${error}`],
    };
  }
}

export async function checkContracts(tier: number): Promise<GateResult> {
  try {
    const policy = TIER_POLICY[tier as keyof typeof TIER_POLICY];

    if (!policy.requires_contracts) {
      return {
        passed: true,
        score: 1.0,
        details: { contracts_required: false, tier },
      };
    }

    // Check for contract test results
    const contractResultsPath = path.join(
      __dirname,
      "../../test-results/contract-results.json"
    );

    if (!fs.existsSync(contractResultsPath)) {
      return {
        passed: false,
        score: 0,
        details: { error: "Contract test results not found" },
        errors: ["Contract tests not run or results not found"],
      };
    }

    const results = JSON.parse(fs.readFileSync(contractResultsPath, "utf-8"));

    // Simple check - all tests passed
    const passed =
      results.numPassed === results.numTotal && results.numTotal > 0;

    return {
      passed,
      score: passed ? 1.0 : 0,
      details: {
        tests_passed: results.numPassed,
        tests_total: results.numTotal,
        consumer_tests: results.consumer || false,
        provider_tests: results.provider || false,
      },
    };
  } catch (error) {
    return {
      passed: false,
      score: 0,
      details: { error: `Contract check failed: ${error}` },
      errors: [`Contract check failed: ${error}`],
    };
  }
}

export async function calculateTrustScore(tier: number): Promise<GateResult> {
  try {
    // Run all gate checks
    const [coverageResult, mutationResult, contractResult] = await Promise.all([
      checkCoverage(tier),
      checkMutation(tier),
      checkContracts(tier),
    ]);

    // Load provenance if available
    let provenance = null;
    try {
      const provenancePath = path.join(
        __dirname,
        "../../.agent/provenance.json"
      );
      if (fs.existsSync(provenancePath)) {
        provenance = JSON.parse(fs.readFileSync(provenancePath, "utf-8"));
      }
    } catch (e) {
      // Provenance not available
    }

    // CAWS trust score weights
    const weights = {
      coverage: 0.3,
      mutation: 0.3,
      contracts: 0.2,
      a11y: 0.1,
      perf: 0.1,
    };

    // Calculate weighted score
    let totalScore = 0;
    let totalWeight = 0;

    // Coverage component
    totalScore += coverageResult.score * weights.coverage;
    totalWeight += weights.coverage;

    // Mutation component
    totalScore += mutationResult.score * weights.mutation;
    totalWeight += weights.mutation;

    // Contracts component
    totalScore += contractResult.score * weights.contracts;
    totalWeight += weights.contracts;

    // A11y component (placeholder - would check axe results)
    const a11yScore = provenance?.results?.a11y === "pass" ? 1.0 : 0.5;
    totalScore += a11yScore * weights.a11y;
    totalWeight += weights.a11y;

    // Performance component (placeholder - would check perf budgets)
    const perfScore = provenance?.results?.perf ? 0.8 : 0.5; // Assume passing if perf data exists
    totalScore += perfScore * weights.perf;
    totalWeight += weights.perf;

    const finalScore = totalScore / totalWeight;
    const tierPolicy = TIER_POLICY[tier as keyof typeof TIER_POLICY];
    const passed = finalScore >= 0.8; // CAWS target is ≥80

    // Apply tier-specific penalties
    let adjustedScore = finalScore;
    if (tier <= 2 && !contractResult.passed) {
      adjustedScore *= 0.8; // 20% penalty for missing contracts on high tiers
    }

    return {
      passed,
      score: adjustedScore,
      details: {
        tier,
        tier_policy: tierPolicy,
        coverage: coverageResult,
        mutation: mutationResult,
        contracts: contractResult,
        a11y: { score: a11yScore, details: provenance?.results?.a11y },
        perf: { score: perfScore, details: provenance?.results?.perf },
        raw_score: finalScore,
        weights,
      },
    };
  } catch (error) {
    return {
      passed: false,
      score: 0,
      details: { error: `Trust score calculation failed: ${error}` },
      errors: [`Trust score calculation failed: ${error}`],
    };
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const tier = parseInt(process.argv[3] || "2");

  if (!command) {
    console.log("Usage: gates <coverage|mutation|contracts|trust> [tier]");
    console.log("Available commands:");
    console.log(
      "  coverage <tier>  - Check branch coverage against tier requirements"
    );
    console.log("  mutation <tier>  - Check mutation testing score");
    console.log("  contracts <tier> - Check contract test compliance");
    console.log("  trust <tier>     - Calculate overall trust score");
    process.exit(1);
  }

  if (tier < 1 || tier > 3) {
    console.error("Tier must be 1, 2, or 3");
    process.exit(1);
  }

  let result: GateResult;

  switch (command) {
    case "coverage":
      result = await checkCoverage(tier);
      break;
    case "mutation":
      result = await checkMutation(tier);
      break;
    case "contracts":
      result = await checkContracts(tier);
      break;
    case "trust":
      result = await calculateTrustScore(tier);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }

  console.log(`\n🔍 CAWS Gate Check: ${command.toUpperCase()} (Tier ${tier})`);
  console.log("=".repeat(50));

  if (result.passed) {
    console.log(`✅ PASSED - Score: ${(result.score * 100).toFixed(1)}%`);
  } else {
    console.log(`❌ FAILED - Score: ${(result.score * 100).toFixed(1)}%`);
  }

  console.log("\n📊 Details:");
  Object.entries(result.details).forEach(([key, value]) => {
    if (typeof value === "object" && value !== null) {
      console.log(`  ${key}:`);
      Object.entries(value).forEach(([subKey, subValue]) => {
        console.log(`    ${subKey}: ${JSON.stringify(subValue)}`);
      });
    } else {
      console.log(`  ${key}: ${JSON.stringify(value)}`);
    }
  });

  if (result.errors) {
    console.log("\n🚨 Errors:");
    result.errors.forEach((error) => console.log(`  ${error}`));
  }

  process.exit(result.passed ? 0 : 1);
}
