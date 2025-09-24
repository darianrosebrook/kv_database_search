#!/usr/bin/env tsx
// @ts-nocheck

import * as fs from "fs";
import * as path from "path";

/**
 * CAWS Trust Score Calculator
 * Computes trust score based on provenance data and quality metrics
 */

interface TrustScoreComponents {
  coverage_branch: number;
  mutation_score: number;
  contracts_consumer: boolean;
  contracts_provider: boolean;
  a11y_passed: boolean;
  perf_within_budget: boolean;
  flake_rate: number;
}

interface TrustScoreResult {
  total_score: number;
  tier: string;
  components: TrustScoreComponents;
  breakdown: {
    coverage: number;
    mutation: number;
    contracts: number;
    a11y: number;
    perf: number;
    flake: number;
  };
  recommendations: string[];
}

class TrustScoreCalculator {
  private tierPolicies: Record<string, any>;

  constructor() {
    this.loadTierPolicies();
  }

  private loadTierPolicies() {
    const policyPath = path.join(
      process.cwd(),
      ".caws",
      "policy",
      "tier-policy.json"
    );

    if (!fs.existsSync(policyPath)) {
      throw new Error("Tier policy not found at .caws/policy/tier-policy.json");
    }

    this.tierPolicies = JSON.parse(fs.readFileSync(policyPath, "utf-8"));
  }

  calculateTrustScore(provenance: any, tier: string = "2"): TrustScoreResult {
    const policy = this.tierPolicies[tier];
    if (!policy) {
      throw new Error(`Unknown tier: ${tier}`);
    }

    // Extract metrics from provenance
    const results = provenance.results || {};
    const components: TrustScoreComponents = {
      coverage_branch: results.coverage_branch || 0,
      mutation_score: results.mutation_score || 0,
      contracts_consumer: results.contracts?.consumer || false,
      contracts_provider: results.contracts?.provider || false,
      a11y_passed: results.a11y === "pass",
      perf_within_budget: results.perf?.within_budget || false,
      flake_rate: results.flake_rate || 0,
    };

    // Calculate component scores (0-1 scale)
    const breakdown = {
      coverage: Math.min(components.coverage_branch / policy.min_branch, 1),
      mutation: Math.min(components.mutation_score / policy.min_mutation, 1),
      contracts: policy.requires_contracts
        ? components.contracts_consumer && components.contracts_provider
          ? 1
          : 0
        : 1,
      a11y: components.a11y_passed ? 1 : 0,
      perf: components.perf_within_budget ? 1 : 0,
      flake: Math.max(0, 1 - components.flake_rate), // Lower flake rate = higher score
    };

    // Weighted calculation (matches CAWS spec)
    const weights = {
      coverage: 0.25,
      mutation: 0.25,
      contracts: 0.2,
      a11y: 0.1,
      perf: 0.1,
      flake: 0.1,
    };

    const total_score = Math.round(
      Object.entries(breakdown).reduce(
        (sum, [key, score]) => sum + (weights as any)[key] * score,
        0
      ) * 100
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      breakdown,
      components,
      policy,
      total_score
    );

    return {
      total_score,
      tier,
      components,
      breakdown,
      recommendations,
    };
  }

  private generateRecommendations(
    breakdown: any,
    components: TrustScoreComponents,
    policy: any,
    totalScore: number
  ): string[] {
    const recommendations: string[] = [];

    // Coverage recommendations
    if (breakdown.coverage < 0.8) {
      recommendations.push(
        `Increase branch coverage to ${policy.min_branch}% (currently ${(
          components.coverage_branch * 100
        ).toFixed(1)}%)`
      );
    }

    // Mutation recommendations
    if (breakdown.mutation < 0.8) {
      recommendations.push(
        `Improve mutation score to ${policy.min_mutation}% (currently ${(
          components.mutation_score * 100
        ).toFixed(1)}%)`
      );
    }

    // Contract recommendations
    if (policy.requires_contracts && breakdown.contracts < 1) {
      if (!components.contracts_consumer) {
        recommendations.push("Implement consumer contract tests");
      }
      if (!components.contracts_provider) {
        recommendations.push("Implement provider contract tests");
      }
    }

    // A11y recommendations
    if (!components.a11y_passed) {
      recommendations.push(
        "Fix accessibility violations and implement axe-core tests"
      );
    }

    // Performance recommendations
    if (!components.perf_within_budget) {
      recommendations.push(
        "Optimize performance to meet API budget requirements"
      );
    }

    // Flake recommendations
    if (components.flake_rate > 0.05) {
      recommendations.push(
        `Reduce test flake rate below 5% (currently ${(
          components.flake_rate * 100
        ).toFixed(1)}%)`
      );
    }

    // Overall score recommendations
    if (totalScore < 80) {
      recommendations.push(
        `Address critical issues to achieve Tier ${policy.tier} compliance (80+ score required)`
      );
    }

    return recommendations;
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: tsx tools/caws/trust.ts <provenance.json> [tier]");
    console.log("Example: tsx tools/caws/trust.ts .agent/provenance.json 2");
    process.exit(1);
  }

  try {
    const provenancePath = args[0];
    const tier = args[1] || "2";

    const provenance = JSON.parse(fs.readFileSync(provenancePath, "utf-8"));
    const calculator = new TrustScoreCalculator();
    const result = calculator.calculateTrustScore(provenance, tier);

    console.log("🔒 CAWS Trust Score Assessment");
    console.log("================================");
    console.log();

    console.log(`📊 Overall Trust Score: ${result.total_score}/100`);
    console.log(`🎯 Target Tier: ${result.tier} (≥80 required)`);
    console.log(`✅ Status: ${result.total_score >= 80 ? "PASS" : "FAIL"}`);
    console.log();

    console.log("📈 Component Breakdown:");
    console.log(
      `  • Coverage: ${(result.breakdown.coverage * 100).toFixed(1)}%`
    );
    console.log(
      `  • Mutation: ${(result.breakdown.mutation * 100).toFixed(1)}%`
    );
    console.log(
      `  • Contracts: ${result.breakdown.contracts === 1 ? "✅" : "❌"}`
    );
    console.log(`  • A11y: ${result.breakdown.a11y === 1 ? "✅" : "❌"}`);
    console.log(
      `  • Performance: ${result.breakdown.perf === 1 ? "✅" : "❌"}`
    );
    console.log(
      `  • Flake Rate: ${(result.breakdown.flake * 100).toFixed(1)}%`
    );
    console.log();

    if (result.recommendations.length > 0) {
      console.log("💡 Recommendations:");
      result.recommendations.forEach((rec) => console.log(`  • ${rec}`));
      console.log();
    }

    // Exit with appropriate code for CI/CD
    process.exit(result.total_score >= 80 ? 0 : 1);
  } catch (error) {
    console.error("❌ Trust score calculation failed:", error);
    process.exit(1);
  }
}

// Execute if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { TrustScoreCalculator, TrustScoreComponents, TrustScoreResult };
