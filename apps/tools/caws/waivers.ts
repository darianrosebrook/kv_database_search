#!/usr/bin/env tsx

import * as fs from "fs";
import * as path from "path";
import { WaiverConfig, CawsConfig } from "./shared/types";
import { CawsConfigManager } from "./shared/config-manager";

export class WaiversManager {
  private configManager: CawsConfigManager;
  private waiversPath: string;

  constructor() {
    this.configManager = new CawsConfigManager();
    const config = this.configManager.getConfig();
    this.waiversPath =
      config.waiversPath || path.join(config.cawsDirectory, "waivers.yml");
  }

  async loadWaivers(): Promise<Record<string, WaiverConfig>> {
    try {
      if (!fs.existsSync(this.waiversPath)) {
        return {};
      }

      const yaml = await import("js-yaml");
      const content = fs.readFileSync(this.waiversPath, "utf-8");
      return yaml.load(content) as Record<string, WaiverConfig>;
    } catch (error) {
      console.error(`Failed to load waivers: ${error}`);
      return {};
    }
  }

  async saveWaivers(waivers: Record<string, WaiverConfig>): Promise<void> {
    try {
      const yaml = await import("js-yaml");
      const content = yaml.dump(waivers);
      fs.writeFileSync(this.waiversPath, content, "utf-8");
    } catch (error) {
      throw new Error(`Failed to save waivers: ${error}`);
    }
  }

  async addWaiver(
    id: string,
    gate: string,
    reason: string,
    owner: string,
    expiryDays: number = 14,
    options: {
      compensating_control?: string;
      ticket_url?: string;
      approved_by?: string;
    } = {}
  ): Promise<void> {
    const waivers = await this.loadWaivers();

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + expiryDays);

    waivers[id] = {
      gate,
      reason,
      owner,
      expiry: expiry.toISOString(),
      compensating_control: options.compensating_control,
      ticket_url: options.ticket_url,
      approved_by: options.approved_by,
      created_at: new Date().toISOString(),
      status: "active",
    };

    await this.saveWaivers(waivers);
  }

  async revokeWaiver(id: string): Promise<void> {
    const waivers = await this.loadWaivers();
    if (waivers[id]) {
      waivers[id].status = "revoked";
      await this.saveWaivers(waivers);
    }
  }

  async checkWaiverStatus(id: string): Promise<{
    active: boolean;
    waiver?: WaiverConfig;
    reason?: string;
  }> {
    const waivers = await this.loadWaivers();
    const waiver = waivers[id];

    if (!waiver) {
      return { active: false, reason: "Waiver not found" };
    }

    if (waiver.status === "revoked") {
      return { active: false, reason: "Waiver revoked", waiver };
    }

    if (new Date(waiver.expiry) < new Date()) {
      waiver.status = "expired";
      await this.saveWaivers(waivers);
      return { active: false, reason: "Waiver expired", waiver };
    }

    return { active: true, waiver };
  }

  async getActiveWaivers(): Promise<Record<string, WaiverConfig>> {
    const waivers = await this.loadWaivers();
    const active: Record<string, WaiverConfig> = {};

    for (const [id, waiver] of Object.entries(waivers)) {
      if (waiver.status === "active" && new Date(waiver.expiry) > new Date()) {
        active[id] = waiver;
      }
    }

    return active;
  }

  async getWaiversByGate(gate: string): Promise<WaiverConfig[]> {
    const waivers = await this.loadWaivers();
    return Object.values(waivers).filter(
      (w) => w.gate === gate && w.status === "active"
    );
  }

  async cleanupExpiredWaivers(): Promise<number> {
    const waivers = await this.loadWaivers();
    let cleaned = 0;

    for (const [id, waiver] of Object.entries(waivers)) {
      if (waiver.status === "active" && new Date(waiver.expiry) < new Date()) {
        waiver.status = "expired";
        cleaned++;
      }
    }

    if (cleaned > 0) {
      await this.saveWaivers(waivers);
    }

    return cleaned;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const command = process.argv[2];
    const waiversManager = new WaiversManager();

    switch (command) {
      case "add": {
        const id = process.argv[3];
        const gate = process.argv[4];
        const reason = process.argv[5];
        const owner = process.argv[6];
        const expiryDays = parseInt(process.argv[7] || "14");

        if (!id || !gate || !reason || !owner) {
          console.error(
            "Usage: waivers add <id> <gate> <reason> <owner> [expiry-days]"
          );
          console.error(
            "Gates: coverage, mutation, contracts, a11y, perf, security"
          );
          process.exit(1);
        }

        try {
          await waiversManager.addWaiver(id, gate, reason, owner, expiryDays);
          console.log(
            `✅ Waiver '${id}' added for ${gate} gate, expires in ${expiryDays} days`
          );
        } catch (error) {
          console.error(`❌ Failed to add waiver: ${error}`);
          process.exit(1);
        }
        break;
      }

      case "revoke": {
        const id = process.argv[3];
        if (!id) {
          console.error("Usage: waivers revoke <id>");
          process.exit(1);
        }

        try {
          await waiversManager.revokeWaiver(id);
          console.log(`✅ Waiver '${id}' revoked`);
        } catch (error) {
          console.error(`❌ Failed to revoke waiver: ${error}`);
          process.exit(1);
        }
        break;
      }

      case "check": {
        const id = process.argv[3];
        if (!id) {
          console.error("Usage: waivers check <id>");
          process.exit(1);
        }

        try {
          const status = await waiversManager.checkWaiverStatus(id);
          if (status.active) {
            console.log(`✅ Waiver '${id}' is active`);
            console.log(`   Gate: ${status.waiver?.gate}`);
            console.log(`   Expires: ${status.waiver?.expiry}`);
            console.log(`   Reason: ${status.waiver?.reason}`);
          } else {
            console.log(`❌ Waiver '${id}' is not active: ${status.reason}`);
          }
        } catch (error) {
          console.error(`❌ Failed to check waiver: ${error}`);
          process.exit(1);
        }
        break;
      }

      case "list": {
        try {
          const waivers = await waiversManager.getActiveWaivers();
          console.log("Active Waivers:");
          console.log("===============");

          if (Object.keys(waivers).length === 0) {
            console.log("No active waivers");
          } else {
            Object.entries(waivers).forEach(([id, waiver]) => {
              console.log(`📋 ${id}`);
              console.log(`   Gate: ${waiver.gate}`);
              console.log(`   Owner: ${waiver.owner}`);
              console.log(`   Expires: ${waiver.expiry}`);
              console.log(`   Reason: ${waiver.reason}`);
              console.log("");
            });
          }
        } catch (error) {
          console.error(`❌ Failed to list waivers: ${error}`);
          process.exit(1);
        }
        break;
      }

      case "cleanup": {
        try {
          const cleaned = await waiversManager.cleanupExpiredWaivers();
          console.log(`✅ Cleaned up ${cleaned} expired waivers`);
        } catch (error) {
          console.error(`❌ Failed to cleanup waivers: ${error}`);
          process.exit(1);
        }
        break;
      }

      default:
        console.log("CAWS Waivers Manager");
        console.log("");
        console.log("Usage:");
        console.log(
          "  waivers add <id> <gate> <reason> <owner> [expiry-days] - Add waiver"
        );
        console.log(
          "  waivers revoke <id>                                        - Revoke waiver"
        );
        console.log(
          "  waivers check <id>                                         - Check waiver status"
        );
        console.log(
          "  waivers list                                              - List active waivers"
        );
        console.log(
          "  waivers cleanup                                           - Clean expired waivers"
        );
        console.log("");
        console.log(
          "Gates: coverage, mutation, contracts, a11y, perf, security"
        );
        break;
    }
  })();
}
