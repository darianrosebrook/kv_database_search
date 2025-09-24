/**
 * CAWS Gate Checker
 * Consolidated gate checking logic for coverage, mutation, contracts, and trust score
 */

import * as path from "path";
import { CawsBaseTool, ToolResult } from "./base-tool.js";
import {
  GateResult,
  GateCheckOptions,
  CoverageData,
  MutationData,
  ContractTestResults,
  TierPolicy,
} from "./types.js";

export class CawsGateChecker extends CawsBaseTool {
  private tierPolicies: Record<number, TierPolicy> = {
    1: {
      min_branch: 0.9,
      min_mutation: 0.7,
      requires_contracts: true,
      requires_manual_review: true,
    },
    2: {
      min_branch: 0.8,
      min_mutation: 0.5,
      requires_contracts: true,
    },
    3: {
      min_branch: 0.7,
      min_mutation: 0.3,
      requires_contracts: false,
    },
  };

  constructor() {
    super();
    this.loadTierPolicies();
  }

  /**
   * Load tier policies from configuration
   */
  private loadTierPolicies(): void {
    const policy = this.loadTierPolicy();
    if (policy) {
      this.tierPolicies = { ...this.tierPolicies, ...policy };
    }
  }

  /**
   * Check branch coverage against tier requirements
   */
  async checkCoverage(options: GateCheckOptions): Promise<GateResult> {
    try {
      const coveragePath = path.join(
        options.workingDirectory || this.getWorkingDirectory(),
        "coverage/coverage-summary.json"
      );

      if (!this.pathExists(coveragePath)) {
        return {
          passed: false,
          score: 0,
          details: {
            error: "Coverage report not found. Run tests with coverage first.",
          },
          errors: ["Coverage report not found"],
        };
      }

      const coverageData = this.readJsonFile<CoverageData>(coveragePath);
      if (!coverageData) {
        return {
          passed: false,
          score: 0,
          details: { error: "Failed to parse coverage data" },
          errors: ["Failed to parse coverage data"],
        };
      }

      const totals = coverageData.total;
      const branchCoverage = totals.branches.pct / 100;
      const policy = this.tierPolicies[options.tier];
      const passed = branchCoverage >= policy.min_branch;

      return {
        passed,
        score: branchCoverage,
        details: {
          branch_coverage: branchCoverage,
          required_branch: policy.min_branch,
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

  /**
   * Check mutation testing score
   */
  async checkMutation(options: GateCheckOptions): Promise<GateResult> {
    try {
      const mutationPath = path.join(
        options.workingDirectory || this.getWorkingDirectory(),
        "reports/mutation/mutation.json"
      );

      if (!this.pathExists(mutationPath)) {
        return {
          passed: false,
          score: 0,
          details: {
            error: "Mutation report not found. Run mutation tests first.",
          },
          errors: ["Mutation report not found"],
        };
      }

      const mutationData = this.readJsonFile<MutationData>(mutationPath);
      if (!mutationData) {
        return {
          passed: false,
          score: 0,
          details: { error: "Failed to parse mutation data" },
          errors: ["Failed to parse mutation data"],
        };
      }

      const killed = mutationData.metrics.killed || 0;
      const total = mutationData.metrics.totalDetected || 1;
      const mutationScore = killed / total;
      const policy = this.tierPolicies[options.tier];
      const passed = mutationScore >= policy.min_mutation;

      return {
        passed,
        score: mutationScore,
        details: {
          mutation_score: mutationScore,
          required_mutation: policy.min_mutation,
          killed,
          total,
          survived: mutationData.metrics.survived || 0,
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

  /**
   * Check contract test compliance
   */
  async checkContracts(options: GateCheckOptions): Promise<GateResult> {
    try {
      const policy = this.tierPolicies[options.tier];

      if (!policy.requires_contracts) {
        return {
          passed: true,
          score: 1.0,
          details: { contracts_required: false, tier: options.tier },
        };
      }

      const contractResultsPath = path.join(
        options.workingDirectory || this.getWorkingDirectory(),
        "test-results/contract-results.json"
      );

      if (!this.pathExists(contractResultsPath)) {
        return {
          passed: false,
          score: 0,
          details: { error: "Contract test results not found" },
          errors: ["Contract tests not run or results not found"],
        };
      }

      const results = this.readJsonFile<ContractTestResults>(contractResultsPath);
      if (!results) {
        return {
          passed: false,
          score: 0,
          details: { error: "Failed to parse contract test results" },
          errors: ["Failed to parse contract test results"],
        };
      }

      const passed = results.numPassed === results.numTotal && results.numTotal > 0;

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

  /**
   * Calculate overall trust score
   */
  async calculateTrustScore(options: GateCheckOptions): Promise<GateResult> {
    try {
      // Run all gate checks
      const [coverageResult, mutationResult, contractResult] = await Promise.all([
        this.checkCoverage(options),
        this.checkMutation(options),
        this.checkContracts(options),
      ]);

      // Load provenance if available
      let provenance = null;
      try {
        const provenancePath = path.join(
          options.workingDirectory || this.getWorkingDirectory(),
          ".agent/provenance.json"
        );
        if (this.pathExists(provenancePath)) {
          provenance = this.readJsonFile(provenancePath);
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
      const perfScore = provenance?.results?.perf ? 0.8 : 0.5;
      totalScore += perfScore * weights.perf;
      totalWeight += weights.perf;

      const finalScore = totalScore / totalWeight;
      const tierPolicy = this.tierPolicies[options.tier];
      const passed = finalScore >= 0.8;

      // Apply tier-specific penalties
      let adjustedScore = finalScore;
      if (options.tier <= 2 && !contractResult.passed) {
        adjustedScore *= 0.8; // 20% penalty for missing contracts on high tiers
      }

      return {
        passed,
        score: adjustedScore,
        details: {
          tier: options.tier,
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

  /**
   * Get tier policy for a specific tier
   */
  getTierPolicy(tier: number): TierPolicy | null {
    return this.tierPolicies[tier] || null;
  }

  /**
   * Get all available tiers
   */
  getAvailableTiers(): number[] {
    return Object.keys(this.tierPolicies).map(Number);
  }
}
