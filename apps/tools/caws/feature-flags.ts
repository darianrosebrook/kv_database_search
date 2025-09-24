#!/usr/bin/env tsx

/**
 * CAWS Feature Flag System
 *
 * Provides safe deployment capabilities through feature flags.
 * Allows gradual rollouts, safe rollbacks, and A/B testing.
 *
 * @author @darianrosebrook
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100, percentage of users/requests
  environment: string[]; // environments where flag is active
  userGroups: string[]; // specific user groups
  dependencies: string[]; // other flags this depends on
  createdAt: string;
  updatedAt: string;
  killSwitch?: boolean; // emergency override
}

interface FeatureFlagUpdate {
  name: string;
  enabled?: boolean;
  rolloutPercentage?: number;
  environment?: string[];
  userGroups?: string[];
  killSwitch?: boolean;
}

interface FeatureFlagEvaluation {
  enabled: boolean;
  flag: FeatureFlag;
  reason: string;
}

interface FeatureContext {
  environment: string;
  userId?: string;
  userGroups?: string[];
  requestId?: string;
  metadata?: Record<string, any>;
}

/**
 * Feature Flag Service
 * Manages feature flags and provides evaluation logic
 */
class FeatureFlagService {
  private readonly FLAGS_FILE = ".caws/feature-flags.json";
  private readonly DEFAULT_ENVIRONMENT = "development";
  private flags: Map<string, FeatureFlag> = new Map();

  constructor() {
    this.loadFlags();
  }

  /**
   * Evaluate a feature flag for a given context
   */
  evaluateFlag(
    flagName: string,
    context: FeatureContext
  ): FeatureFlagEvaluation {
    const flag = this.flags.get(flagName);
    if (!flag) {
      return {
        enabled: false,
        flag: this.createDefaultFlag(flagName),
        reason: "Flag not found",
      };
    }

    // Check emergency kill switch
    if (flag.killSwitch) {
      return {
        enabled: false,
        flag,
        reason: "Emergency kill switch activated",
      };
    }

    // Check environment
    if (!flag.environment.includes(context.environment)) {
      return {
        enabled: false,
        flag,
        reason: `Flag not active in environment: ${context.environment}`,
      };
    }

    // Check dependencies
    for (const dep of flag.dependencies) {
      const depEval = this.evaluateFlag(dep, context);
      if (!depEval.enabled) {
        return {
          enabled: false,
          flag,
          reason: `Dependency '${dep}' is not enabled`,
        };
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const userHash = this.getUserHash(
        context.userId || context.requestId || "anonymous"
      );
      const userPercentage = userHash % 100;

      if (userPercentage >= flag.rolloutPercentage) {
        return {
          enabled: false,
          flag,
          reason: `User not in rollout percentage (user: ${userPercentage}%, flag: ${flag.rolloutPercentage}%)`,
        };
      }
    }

    // Check user groups
    if (flag.userGroups.length > 0) {
      const userGroups = context.userGroups || [];
      const hasRequiredGroup = flag.userGroups.some((group) =>
        userGroups.includes(group)
      );

      if (!hasRequiredGroup) {
        return {
          enabled: false,
          flag,
          reason: `User not in required groups: ${flag.userGroups.join(", ")}`,
        };
      }
    }

    return {
      enabled: flag.enabled,
      flag,
      reason: flag.enabled ? "All conditions met" : "Flag is disabled",
    };
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(flagName: string, context: FeatureContext): boolean {
    const evaluation = this.evaluateFlag(flagName, context);
    return evaluation.enabled;
  }

  /**
   * Get all flags for an environment
   */
  getFlagsForEnvironment(environment: string): FeatureFlag[] {
    return Array.from(this.flags.values())
      .filter((flag) => flag.environment.includes(environment))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Create a new feature flag
   */
  createFlag(flag: Omit<FeatureFlag, "createdAt" | "updatedAt">): FeatureFlag {
    const now = new Date().toISOString();
    const newFlag: FeatureFlag = {
      ...flag,
      createdAt: now,
      updatedAt: now,
    };

    this.flags.set(flag.name, newFlag);
    this.saveFlags();
    console.log(`✅ Created feature flag: ${flag.name}`);
    return newFlag;
  }

  /**
   * Update an existing feature flag
   */
  updateFlag(update: FeatureFlagUpdate): FeatureFlag | null {
    const existing = this.flags.get(update.name);
    if (!existing) {
      console.log(`❌ Feature flag not found: ${update.name}`);
      return null;
    }

    const updated: FeatureFlag = {
      ...existing,
      ...update,
      updatedAt: new Date().toISOString(),
    };

    this.flags.set(update.name, updated);
    this.saveFlags();
    console.log(`✅ Updated feature flag: ${update.name}`);
    return updated;
  }

  /**
   * Delete a feature flag
   */
  deleteFlag(flagName: string): boolean {
    if (!this.flags.has(flagName)) {
      console.log(`❌ Feature flag not found: ${flagName}`);
      return false;
    }

    this.flags.delete(flagName);
    this.saveFlags();
    console.log(`🗑️ Deleted feature flag: ${flagName}`);
    return true;
  }

  /**
   * Enable emergency kill switch for a flag
   */
  activateKillSwitch(flagName: string): boolean {
    return this.updateFlag({ name: flagName, killSwitch: true }) !== null;
  }

  /**
   * Disable emergency kill switch for a flag
   */
  deactivateKillSwitch(flagName: string): boolean {
    return this.updateFlag({ name: flagName, killSwitch: false }) !== null;
  }

  /**
   * Get flag statistics
   */
  getStats(): {
    total: number;
    enabled: number;
    byEnvironment: Record<string, number>;
    withKillSwitch: number;
  } {
    const stats = {
      total: this.flags.size,
      enabled: 0,
      byEnvironment: {} as Record<string, number>,
      withKillSwitch: 0,
    };

    for (const flag of this.flags.values()) {
      if (flag.enabled) stats.enabled++;

      flag.environment.forEach((env) => {
        stats.byEnvironment[env] = (stats.byEnvironment[env] || 0) + 1;
      });

      if (flag.killSwitch) stats.withKillSwitch++;
    }

    return stats;
  }

  private loadFlags(): void {
    if (!existsSync(this.FLAGS_FILE)) {
      this.flags = new Map();
      return;
    }

    try {
      const data = JSON.parse(readFileSync(this.FLAGS_FILE, "utf-8"));
      this.flags = new Map();

      for (const [name, flagData] of Object.entries(data.flags || {})) {
        this.flags.set(name, flagData as FeatureFlag);
      }
    } catch (error) {
      console.warn("⚠️ Could not load feature flags:", error);
      this.flags = new Map();
    }
  }

  private saveFlags(): void {
    const data = {
      lastUpdated: new Date().toISOString(),
      flags: Object.fromEntries(this.flags.entries()),
    };

    writeFileSync(this.FLAGS_FILE, JSON.stringify(data, null, 2));
  }

  private createDefaultFlag(name: string): FeatureFlag {
    const now = new Date().toISOString();
    return {
      name,
      description: `Feature flag for ${name}`,
      enabled: false,
      rolloutPercentage: 0,
      environment: [this.DEFAULT_ENVIRONMENT],
      userGroups: [],
      dependencies: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  private getUserHash(userId: string): number {
    // Simple hash function for user bucketing
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("🚩 CAWS Feature Flag Tool");
    console.log("Usage: feature-flags.ts <command> [options]");
    console.log("");
    console.log("Commands:");
    console.log("  create     - Create a new feature flag");
    console.log("  update     - Update an existing feature flag");
    console.log("  delete     - Delete a feature flag");
    console.log("  evaluate   - Evaluate a flag for a context");
    console.log("  list       - List all feature flags");
    console.log("  stats      - Show feature flag statistics");
    console.log("  kill       - Activate emergency kill switch");
    console.log("  revive     - Deactivate emergency kill switch");
    console.log("");
    console.log("Examples:");
    console.log('  feature-flags.ts create "new-feature" "Enable new feature"');
    console.log('  feature-flags.ts evaluate "new-feature" production user123');
    console.log("  feature-flags.ts list");
    return;
  }

  const command = args[0];
  const service = new FeatureFlagService();

  try {
    switch (command) {
      case "create": {
        if (args.length < 3) {
          console.log(
            "❌ Usage: feature-flags.ts create <name> <description> [environment] [rollout%]"
          );
          return;
        }

        const [
          _,
          name,
          description,
          environment = "development",
          rolloutPercentage = 0,
        ] = args;
        const flag = service.createFlag({
          name,
          description,
          enabled: false,
          rolloutPercentage: parseInt(rolloutPercentage),
          environment: environment.split(","),
          userGroups: [],
          dependencies: [],
        });

        console.log(`✅ Created flag: ${flag.name}`);
        break;
      }

      case "update": {
        if (args.length < 3) {
          console.log(
            "❌ Usage: feature-flags.ts update <name> <property> <value>"
          );
          return;
        }

        const [_, name, property, value] = args;
        const update: FeatureFlagUpdate = { name };

        switch (property) {
          case "enabled":
            update.enabled = value === "true";
            break;
          case "rollout":
            update.rolloutPercentage = parseInt(value);
            break;
          case "environment":
            update.environment = value.split(",");
            break;
          case "killswitch":
            update.killSwitch = value === "true";
            break;
          default:
            console.log(`❌ Unknown property: ${property}`);
            return;
        }

        const updated = service.updateFlag(update);
        if (updated) {
          console.log(`✅ Updated ${property}: ${value}`);
        }
        break;
      }

      case "delete": {
        if (args.length < 2) {
          console.log("❌ Usage: feature-flags.ts delete <name>");
          return;
        }

        const name = args[1];
        if (service.deleteFlag(name)) {
          console.log(`🗑️ Deleted flag: ${name}`);
        }
        break;
      }

      case "evaluate": {
        if (args.length < 3) {
          console.log(
            "❌ Usage: feature-flags.ts evaluate <flag> <environment> [userId]"
          );
          return;
        }

        const [_, flagName, environment, userId] = args;
        const context: FeatureContext = {
          environment,
          userId,
          userGroups: [],
          requestId: `eval-${Date.now()}`,
        };

        const result = service.evaluateFlag(flagName, context);
        console.log(`🔍 Flag Evaluation: ${flagName}`);
        console.log(`   Environment: ${environment}`);
        console.log(`   User ID: ${userId || "anonymous"}`);
        console.log(`   Enabled: ${result.enabled ? "✅ YES" : "❌ NO"}`);
        console.log(`   Reason: ${result.reason}`);
        break;
      }

      case "list": {
        const environment = args[1] || "all";
        const flags =
          environment === "all"
            ? Array.from(service.flags.values()).sort((a, b) =>
                a.name.localeCompare(b.name)
              )
            : service.getFlagsForEnvironment(environment);

        console.log(`🚩 Feature Flags (${flags.length} total):`);
        flags.forEach((flag) => {
          const status = flag.killSwitch
            ? "🛑 KILLED"
            : flag.enabled
            ? "✅ ENABLED"
            : "❌ DISABLED";
          const rollout =
            flag.rolloutPercentage === 100
              ? "100%"
              : `${flag.rolloutPercentage}%`;
          console.log(
            `   ${flag.name}: ${status} (${rollout}) - ${flag.description}`
          );
          console.log(`     Environments: ${flag.environment.join(", ")}`);
          if (flag.userGroups.length > 0) {
            console.log(`     User Groups: ${flag.userGroups.join(", ")}`);
          }
        });
        break;
      }

      case "stats": {
        const stats = service.getStats();
        console.log("📊 Feature Flag Statistics:");
        console.log(`   Total flags: ${stats.total}`);
        console.log(`   Enabled: ${stats.enabled}`);
        console.log(`   With kill switch: ${stats.withKillSwitch}`);

        console.log("\n   By Environment:");
        Object.entries(stats.byEnvironment).forEach(([env, count]) => {
          console.log(`     ${env}: ${count}`);
        });
        break;
      }

      case "kill": {
        if (args.length < 2) {
          console.log("❌ Usage: feature-flags.ts kill <flag>");
          return;
        }

        const name = args[1];
        if (service.activateKillSwitch(name)) {
          console.log(`🛑 Activated kill switch for: ${name}`);
        }
        break;
      }

      case "revive": {
        if (args.length < 2) {
          console.log("❌ Usage: feature-flags.ts revive <flag>");
          return;
        }

        const name = args[1];
        if (service.deactivateKillSwitch(name)) {
          console.log(`✅ Deactivated kill switch for: ${name}`);
        }
        break;
      }

      default:
        console.log(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { FeatureFlagService };
