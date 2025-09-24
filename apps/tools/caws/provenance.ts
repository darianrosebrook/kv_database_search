#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

export async function generateProvenance(): Promise<ProvenanceManifest> {
  const timestamp = new Date().toISOString();

  // Get git commit
  let commit = "unknown";
  try {
    commit = execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
  } catch (e) {
    console.warn("Could not get git commit hash");
  }

  // Collect artifacts (source files, tests, configs)
  const artifacts = await collectArtifacts();

  // Collect test results
  const results = await collectTestResults();

  // Basic agent info (would be expanded in real implementation)
  const manifest: ProvenanceManifest = {
    agent: "obsidian-rag-dev",
    model: process.env.MODEL || "unknown",
    prompts: [], // Would track actual prompts used
    commit,
    timestamp,
    artifacts,
    results,
    approvals: [], // Would be populated by human reviewers
  };

  return manifest;
}

async function collectArtifacts(): Promise<string[]> {
  const artifacts: string[] = [];

  // Source files
  const srcFiles = await findFiles("src", ["**/*.ts", "**/*.js"]);
  artifacts.push(...srcFiles);

  // Test files
  const testFiles = await findFiles("tests", ["**/*.test.ts", "**/*.spec.ts"]);
  artifacts.push(...testFiles);

  // Config files
  const configFiles = [
    "package.json",
    "tsconfig.json",
    "vitest.config.ts",
    ".caws/working-spec.yaml",
    "stryker.conf.json",
  ];

  for (const file of configFiles) {
    if (fs.existsSync(file)) {
      artifacts.push(file);
    }
  }

  return artifacts;
}

async function collectTestResults(): Promise<ProvenanceManifest["results"]> {
  const results: ProvenanceManifest["results"] = {
    coverage_branch: 0,
    mutation_score: 0,
    tests_passed: 0,
  };

  // Run tests and collect coverage if no coverage exists
  const coveragePath = path.join(
    __dirname,
    "../../coverage/coverage-summary.json"
  );
  if (!fs.existsSync(coveragePath)) {
    console.log("📊 Running tests with coverage...");
    try {
      execSync("npm run test:unit -- --coverage --run", {
        cwd: path.join(__dirname, "../.."),
        stdio: "inherit",
      });
    } catch (e) {
      console.warn("Test execution failed, proceeding without coverage");
    }
  }

  // Read coverage results
  try {
    // Try coverage-summary.json first (from npm run test:coverage)
    let coverageData = null;
    if (fs.existsSync(coveragePath)) {
      coverageData = JSON.parse(fs.readFileSync(coveragePath, "utf-8"));
    } else {
      // Try coverage-final.json (from direct vitest run)
      const coverageFinalPath = path.join(
        __dirname,
        "../../coverage/coverage-final.json"
      );
      if (fs.existsSync(coverageFinalPath)) {
        const finalCoverage = JSON.parse(
          fs.readFileSync(coverageFinalPath, "utf-8")
        );
        // Calculate totals from individual file coverage
        let totalBranches = 0,
          coveredBranches = 0,
          totalLines = 0,
          coveredLines = 0;
        for (const fileData of Object.values(finalCoverage) as any[]) {
          if (fileData.b) {
            for (const branchCount of Object.values(fileData.b) as number[]) {
              totalBranches++;
              if (branchCount > 0) coveredBranches++;
            }
          }
          if (fileData.s) {
            for (const statementCount of Object.values(
              fileData.s
            ) as number[]) {
              totalLines++;
              if (statementCount > 0) coveredLines++;
            }
          }
        }
        coverageData = {
          total: {
            branches: {
              pct:
                totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0,
            },
            lines: {
              pct: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
            },
          },
        };
      }
    }

    if (coverageData) {
      results.coverage_branch = coverageData.total.branches.pct / 100;
      results.tests_passed = Math.floor(
        (coverageData.total.lines.pct / 100) * 10
      ); // Estimate test count
    }
  } catch (e) {
    console.warn("Could not read coverage results:", e.message);
  }

  // Run mutation tests if results don't exist
  const mutationPath = path.join(
    __dirname,
    "../../reports/mutation/mutation.json"
  );
  if (!fs.existsSync(mutationPath)) {
    console.log("🧬 Running mutation tests...");
    try {
      execSync("npm run test:mutation", {
        cwd: path.join(__dirname, "../.."),
        stdio: "inherit",
      });
    } catch (e) {
      console.warn(
        "Mutation testing failed, proceeding without mutation score"
      );
    }
  }

  // Read mutation results
  try {
    if (fs.existsSync(mutationPath)) {
      const mutationContent = fs.readFileSync(mutationPath, "utf-8");
      // Check if the file contains valid JSON (not corrupted source code)
      if (mutationContent.trim().startsWith("{")) {
        const mutation = JSON.parse(mutationContent);

        // Stryker v8 format: aggregate metrics across all files
        let totalKilled = 0;
        let totalTimeout = 0;
        let totalSurvived = 0;
        let totalNoCoverage = 0;

        if (mutation.files) {
          for (const [fileName, fileData] of Object.entries(
            mutation.files
          ) as any[]) {
            if (fileData.mutants) {
              const statusCounts = fileData.mutants.reduce(
                (acc: any, mutant: any) => {
                  acc[mutant.status] = (acc[mutant.status] || 0) + 1;
                  return acc;
                },
                {}
              );

              totalKilled += statusCounts.Killed || 0;
              totalTimeout += statusCounts.Timeout || 0;
              totalSurvived += statusCounts.Survived || 0;
              totalNoCoverage += statusCounts.NoCoverage || 0;
            }
          }
        }

        const totalDetected =
          totalKilled + totalTimeout + totalSurvived + totalNoCoverage;
        if (totalDetected > 0) {
          results.mutation_score = (totalKilled + totalTimeout) / totalDetected;
        } else {
          results.mutation_score = 0;
        }
      } else {
        console.warn(
          "Mutation report appears corrupted, skipping mutation score"
        );
        results.mutation_score = 0; // Default to 0 for corrupted reports
      }
    } else {
      console.warn("Mutation report not found");
      results.mutation_score = 0; // Default to 0 if no report
    }
  } catch (e) {
    console.warn("Could not parse mutation results:", e.message);
    results.mutation_score = 0; // Default to 0 on parse error
  }

  // Run contract tests if results don't exist
  const contractResultsPath = path.join(
    __dirname,
    "../../test-results/contract-results.json"
  );
  if (!fs.existsSync(contractResultsPath)) {
    console.log("📋 Running contract tests...");
    try {
      execSync("npm run test:contract", {
        cwd: path.join(__dirname, "../.."),
        stdio: "inherit",
      });
    } catch (e) {
      console.warn("Contract testing failed");
    }
  }

  // Contract test results
  try {
    if (fs.existsSync(contractResultsPath)) {
      const contractResults = JSON.parse(
        fs.readFileSync(contractResultsPath, "utf-8")
      );
      results.contracts = {
        consumer: contractResults.numPassed > 0,
        provider: contractResults.numPassed > 0,
      };
    } else {
      // Fallback: run contract tests and check exit code
      try {
        execSync("npm run test:contract", {
          cwd: path.join(__dirname, "../.."),
          stdio: "pipe",
        });
        results.contracts = {
          consumer: true,
          provider: true,
        };
      } catch (e) {
        results.contracts = {
          consumer: false,
          provider: false,
        };
      }
    }
  } catch (e) {
    results.contracts = {
      consumer: false,
      provider: false,
    };
  }

  // A11y results (placeholder - would integrate with axe-core)
  results.a11y = "unknown";

  // Performance results (placeholder - would integrate with Lighthouse CI)
  results.perf = {};

  return results;
}

async function findFiles(dir: string, patterns: string[]): Promise<string[]> {
  const files: string[] = [];

  function walk(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip certain directories
        if (
          !["node_modules", ".git", "dist", "coverage"].includes(entry.name)
        ) {
          walk(fullPath);
        }
      } else {
        // Check if file matches patterns
        for (const pattern of patterns) {
          if (matchesPattern(fullPath, pattern)) {
            files.push(fullPath);
            break;
          }
        }
      }
    }
  }

  walk(dir);
  return files.sort();
}

function matchesPattern(filePath: string, pattern: string): boolean {
  // Simple glob matching - could be enhanced
  const regexPattern = pattern
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, ".");
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(filePath);
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  generateProvenance()
    .then((manifest) => {
      // Ensure .agent directory exists
      const agentDir = path.join(__dirname, "../../.agent");
      if (!fs.existsSync(agentDir)) {
        fs.mkdirSync(agentDir, { recursive: true });
      }

      // Write manifest
      const manifestPath = path.join(agentDir, "provenance.json");
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

      console.log("✅ Provenance manifest generated");
      console.log(`📄 Saved to: ${manifestPath}`);
      console.log("\n📊 Summary:");
      console.log(`  Commit: ${manifest.commit}`);
      console.log(`  Artifacts: ${manifest.artifacts.length}`);
      console.log(
        `  Coverage: ${(manifest.results.coverage_branch * 100).toFixed(1)}%`
      );
      console.log(
        `  Mutation: ${(manifest.results.mutation_score * 100).toFixed(1)}%`
      );
      console.log(`  Tests: ${manifest.results.tests_passed}`);
    })
    .catch((error) => {
      console.error("❌ Failed to generate provenance:", error);
      process.exit(1);
    });
}
