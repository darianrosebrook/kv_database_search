#!/usr/bin/env tsx
// @ts-nocheck

import fs from "fs";
import path from "path";

interface ProvenanceManifest {
  agent: string;
  model?: string;
  prompts?: string[];
  commit: string;
  timestamp: string;
  artifacts: string[];
  results: {
    coverage_branch: number;
    mutation_score: number;
    tests_passed: number;
    contracts?: {
      consumer: boolean;
      provider: boolean;
    };
    a11y?: string;
    perf?: any;
  };
  approvals: string[];
}

interface TierPolicy {
  [tier: string]: {
    min_branch: number;
    min_mutation: number;
    requires_contracts: boolean;
    requires_manual_review: boolean;
  };
}

const TIER_POLICY: TierPolicy = {
  "1": { min_branch: 0.90, min_mutation: 0.70, requires_contracts: true, requires_manual_review: true },
  "2": { min_branch: 0.80, min_mutation: 0.50, requires_contracts: true, requires_manual_review: false },
  "3": { min_branch: 0.70, min_mutation: 0.30, requires_contracts: false, requires_manual_review: false }
};

const WEIGHTS = {
  coverage: 0.25,
  mutation: 0.25,
  contracts: 0.20,
  a11y: 0.10,
  perf: 0.10,
  flake_penalty: 0.10
};

function calculateTrustScore(prov: ProvenanceManifest, tier: string = "2"): {
  score: number;
  breakdown: Record<string, number>;
  passed: boolean;
  tier: string;
  recommendations: string[];
} {
  const tierConfig = TIER_POLICY[tier];
  if (!tierConfig) {
    throw new Error(`Invalid tier: ${tier}`);
  }

  const breakdown: Record<string, number> = {};
  const recommendations: string[] = [];

  // Coverage score (0-1, normalized to tier target)
  const coverageScore = Math.min(prov.results.coverage_branch / tierConfig.min_branch, 1);
  breakdown.coverage = coverageScore;
  if (coverageScore < 0.8) {
    recommendations.push(`Increase branch coverage to ${tierConfig.min_branch * 100}% (currently ${(prov.results.coverage_branch * 100).toFixed(1)}%)`);
  }

  // Mutation score (0-1, normalized to tier target)
  const mutationScore = Math.min(prov.results.mutation_score / tierConfig.min_mutation, 1);
  breakdown.mutation = mutationScore;
  if (mutationScore < 0.8) {
    recommendations.push(`Improve mutation score to ${tierConfig.min_mutation * 100}% (currently ${(prov.results.mutation_score * 100).toFixed(1)}%)`);
  }

  // Contract compliance (0 or 1)
  const contractScore = tierConfig.requires_contracts
    ? (prov.results.contracts?.consumer && prov.results.contracts?.provider ? 1 : 0)
    : 1;
  breakdown.contracts = contractScore;
  if (tierConfig.requires_contracts && contractScore === 0) {
    recommendations.push("Implement and pass contract tests for all API boundaries");
  }

  // Accessibility score (0 or 1)
  const a11yScore = prov.results.a11y === "pass" ? 1 : 0.5; // Placeholder logic
  breakdown.a11y = a11yScore;
  if (a11yScore < 1) {
    recommendations.push("Implement accessibility testing (axe-core integration)");
  }

  // Performance score (0 or 1) - placeholder
  const perfScore = prov.results.perf && Object.keys(prov.results.perf).length > 0 ? 1 : 0.5;
  breakdown.perf = perfScore;
  if (perfScore < 1) {
    recommendations.push("Implement performance budget validation");
  }

  // Flake penalty (0 or 1) - placeholder for now
  const flakePenalty = 1; // Assume no flakes until we implement tracking
  breakdown.flake_penalty = flakePenalty;

  // Calculate weighted score
  const weightedScore =
    WEIGHTS.coverage * breakdown.coverage +
    WEIGHTS.mutation * breakdown.mutation +
    WEIGHTS.contracts * breakdown.contracts +
    WEIGHTS.a11y * breakdown.a11y +
    WEIGHTS.perf * breakdown.perf +
    WEIGHTS.flake_penalty * flakePenalty;

  const finalScore = Math.round(weightedScore * 100);

  // Determine if requirements are met
  const passed = finalScore >= 80; // CAWS target

  return {
    score: finalScore,
    breakdown,
    passed,
    tier,
    recommendations
  };
}

function loadProvenance(provenancePath?: string): ProvenanceManifest {
  const defaultPath = path.join(process.cwd(), ".agent", "provenance.json");
  const targetPath = provenancePath || defaultPath;

  if (!fs.existsSync(targetPath)) {
    throw new Error(`Provenance manifest not found: ${targetPath}`);
  }

  const content = fs.readFileSync(targetPath, "utf-8");
  return JSON.parse(content);
}

function loadWorkingSpecTier(): string {
  const specPath = path.join(process.cwd(), ".caws", "working-spec.yaml");

  if (!fs.existsSync(specPath)) {
    console.warn("Working spec not found, defaulting to tier 2");
    return "2";
  }

  try {
    // Simple YAML parsing for tier extraction
    const content = fs.readFileSync(specPath, "utf-8");
    const tierMatch = content.match(/risk_tier:\s*(\d+)/);
    return tierMatch ? tierMatch[1] : "2";
  } catch (e) {
    console.warn("Could not parse working spec tier, defaulting to 2");
    return "2";
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  if (!command || command === "calculate") {
    try {
      const provenancePath = process.argv[3];
      const prov = loadProvenance(provenancePath);
      const tier = loadWorkingSpecTier();

      console.log("🔍 CAWS Trust Score Calculation");
      console.log("=".repeat(50));
      console.log(`📋 Tier: ${tier}`);
      console.log(`📅 Timestamp: ${prov.timestamp}`);
      console.log(`🔗 Commit: ${prov.commit}`);
      console.log(`📦 Artifacts: ${prov.artifacts.length}`);
      console.log();

      const result = calculateTrustScore(prov, tier);

      console.log("📊 METRICS:");
      console.log(`  Branch Coverage: ${(prov.results.coverage_branch * 100).toFixed(1)}%`);
      console.log(`  Mutation Score: ${(prov.results.mutation_score * 100).toFixed(1)}%`);
      console.log(`  Contracts: ${prov.results.contracts ? "✅" : "❌"}`);
      console.log(`  Tests Passed: ${prov.results.tests_passed}`);
      console.log();

      console.log("⚖️  SCORE BREAKDOWN:");
      Object.entries(result.breakdown).forEach(([key, value]) => {
        console.log(`  ${key}: ${(value * 100).toFixed(0)}%`);
      });
      console.log();

      console.log(`🎯 FINAL TRUST SCORE: ${result.score}/100`);
      console.log(`${result.passed ? "✅ PASSED" : "❌ FAILED"} (Target: 80+)`);
      console.log();

      if (result.recommendations.length > 0) {
        console.log("💡 RECOMMENDATIONS:");
        result.recommendations.forEach(rec => console.log(`  • ${rec}`));
        console.log();
      }

      // Exit with appropriate code
      process.exit(result.passed ? 0 : 1);

    } catch (error) {
      console.error("❌ Trust score calculation failed:", error);
      process.exit(1);
    }
  } else {
    console.log("CAWS Trust Score Calculator");
    console.log("");
    console.log("Usage:");
    console.log("  trust calculate [provenance.json]  - Calculate trust score");
    console.log("");
    console.log("The tool automatically:");
    console.log("  - Loads .agent/provenance.json");
    console.log("  - Extracts tier from .caws/working-spec.yaml");
    console.log("  - Calculates weighted trust score");
    console.log("  - Provides actionable recommendations");
  }
}

export { calculateTrustScore, loadProvenance, loadWorkingSpecTier };
