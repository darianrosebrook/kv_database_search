#!/usr/bin/env tsx

import { CawsGateChecker } from "./shared/gate-checker.js";
import { GateResult } from "./shared/types.js";

export async function checkCoverage(
  tier: number,
  workingDirectory?: string
): Promise<GateResult> {
  const checker = new CawsGateChecker();
  return await checker.checkCoverage({ tier, workingDirectory });
}

export async function checkMutation(
  tier: number,
  workingDirectory?: string
): Promise<GateResult> {
  const checker = new CawsGateChecker();
  return await checker.checkMutation({ tier, workingDirectory });
}

export async function checkContracts(
  tier: number,
  workingDirectory?: string
): Promise<GateResult> {
  const checker = new CawsGateChecker();
  return await checker.checkContracts({ tier, workingDirectory });
}

export async function calculateTrustScore(
  tier: number,
  workingDirectory?: string
): Promise<GateResult> {
  const checker = new CawsGateChecker();
  return await checker.calculateTrustScore({ tier, workingDirectory });
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const tier = parseInt(process.argv[3] || "2");
  const workingDirectory = process.argv[4];

  if (!command) {
    console.log(
      "Usage: gates <coverage|mutation|contracts|trust> [tier] [working-directory]"
    );
    console.log("Available commands:");
    console.log(
      "  coverage <tier>  - Check branch coverage against tier requirements"
    );
    console.log("  mutation <tier>  - Check mutation testing score");
    console.log("  contracts <tier> - Check contract test compliance");
    console.log("  trust <tier>     - Calculate overall trust score");
    console.log("\nExamples:");
    console.log("  gates coverage 2");
    console.log("  gates trust 1 /path/to/project");
    process.exit(1);
  }

  if (tier < 1 || tier > 3) {
    console.error("Tier must be 1, 2, or 3");
    process.exit(1);
  }

  let result: GateResult;

  try {
    switch (command) {
      case "coverage":
        result = await checkCoverage(tier, workingDirectory);
        break;
      case "mutation":
        result = await checkMutation(tier, workingDirectory);
        break;
      case "contracts":
        result = await checkContracts(tier, workingDirectory);
        break;
      case "trust":
        result = await calculateTrustScore(tier, workingDirectory);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }

    console.log(
      `\n🔍 CAWS Gate Check: ${command.toUpperCase()} (Tier ${tier})`
    );
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
  } catch (error) {
    console.error(`❌ Gate check failed: ${error}`);
    process.exit(1);
  }
}
