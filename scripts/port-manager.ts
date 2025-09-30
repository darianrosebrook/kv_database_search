#!/usr/bin/env tsx
/**
 * @fileoverview Dynamic Port Manager for Obsidian RAG
 * @author @darianrosebrook
 *
 * This utility provides intelligent port management, process cleanup,
 * and dynamic server startup for the Obsidian RAG project.
 *
 * Features:
 * - Automatic port conflict detection and resolution
 * - Process cleanup and management
 * - Smart server startup with fallback ports
 * - Health checking and monitoring
 */

import { execSync, spawn, ChildProcess } from "child_process";
import { existsSync, writeFileSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";

interface PortInfo {
  port: number;
  pid: number;
  command: string;
  service: string;
}

interface ServerConfig {
  name: string;
  script: string;
  defaultPort: number;
  fallbackPorts: number[];
  healthEndpoint?: string;
  startupTimeout: number;
}

class PortManager {
  private readonly PID_FILE = ".server.pid";
  private readonly LOG_FILE = "logs/port-manager.log";

  private readonly SERVERS: ServerConfig[] = [
    {
      name: "kv-database",
      script: "apps/kv_database/src/server.ts",
      defaultPort: 3001,
      fallbackPorts: [3002, 3003, 3004, 3005],
      healthEndpoint: "/health",
      startupTimeout: 10000,
    },
    {
      name: "graph-rag",
      script: "apps/kv_database/src/graph-rag-server.ts",
      defaultPort: 3002,
      fallbackPorts: [3003, 3004, 3005, 3006],
      healthEndpoint: "/health",
      startupTimeout: 10000,
    },
    {
      name: "rag-editor",
      script: "apps/rag_editor",
      defaultPort: 3000,
      fallbackPorts: [3001, 3002, 3003, 3004],
      startupTimeout: 15000,
    },
  ];

  /**
   * Check if a port is in use and return process information
   */
  private checkPort(port: number): PortInfo | null {
    try {
      const output = execSync(`lsof -i :${port}`, { encoding: "utf8" });
      const lines = output
        .trim()
        .split("\n")
        .filter((line) => line.includes("LISTEN"));

      if (lines.length === 0) return null;

      const line = lines[0];
      const parts = line.split(/\s+/);
      const pid = parseInt(parts[1]);
      const command = parts[0];

      return {
        port,
        pid,
        command,
        service: this.identifyService(command, pid),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Identify the service running on a port based on process info
   */
  private identifyService(command: string, pid: number): string {
    try {
      const psOutput = execSync(`ps -p ${pid} -o command`, {
        encoding: "utf8",
      });
      const commandLine = psOutput.split("\n")[1] || "";

      if (commandLine.includes("apps/kv_database/src/server.ts"))
        return "kv-database";
      if (commandLine.includes("apps/kv_database/src/graph-rag-server.ts"))
        return "graph-rag";
      if (commandLine.includes("apps/rag_editor")) return "rag-editor";
      if (commandLine.includes("tsx")) return "tsx-process";
      if (commandLine.includes("node")) return "node-process";

      return "unknown";
    } catch {
      return "unknown";
    }
  }

  /**
   * Kill processes on a specific port
   */
  private killPortProcesses(port: number): boolean {
    try {
      const pids = execSync(`lsof -t -i:${port}`, { encoding: "utf8" })
        .trim()
        .split("\n")
        .filter((pid) => pid && !isNaN(parseInt(pid)));

      if (pids.length === 0) return true;

      console.log(`🔪 Killing ${pids.length} process(es) on port ${port}...`);

      for (const pid of pids) {
        try {
          execSync(`kill -9 ${pid}`, { stdio: "ignore" });
          console.log(`   ✅ Killed process ${pid}`);
        } catch (error) {
          console.log(`   ⚠️  Failed to kill process ${pid}: ${error}`);
        }
      }

      // Wait for port to be released
      let attempts = 0;
      while (attempts < 10 && this.checkPort(port) !== null) {
        execSync("sleep 0.5", { stdio: "ignore" });
        attempts++;
      }

      return this.checkPort(port) === null;
    } catch (error) {
      console.log(`   ✅ Port ${port} is already free`);
      return true;
    }
  }

  /**
   * Find an available port from the fallback list
   */
  private findAvailablePort(server: ServerConfig): number {
    const portsToCheck = [server.defaultPort, ...server.fallbackPorts];

    for (const port of portsToCheck) {
      if (this.checkPort(port) === null) {
        return port;
      }
    }

    throw new Error(
      `No available ports found for ${
        server.name
      }. Checked: ${portsToCheck.join(", ")}`
    );
  }

  /**
   * Start a server with intelligent port management
   */
  public async startServer(
    serverName: string,
    options: {
      forceKill?: boolean;
      port?: number;
      watch?: boolean;
    } = {}
  ): Promise<{ port: number; pid: number }> {
    const server = this.SERVERS.find((s) => s.name === serverName);
    if (!server) {
      throw new Error(
        `Unknown server: ${serverName}. Available: ${this.SERVERS.map(
          (s) => s.name
        ).join(", ")}`
      );
    }

    console.log(`🚀 Starting ${server.name} server...`);

    // Check if server is already running
    const existingPid = this.getStoredPid(server.name);
    if (existingPid && this.isProcessRunning(existingPid)) {
      if (options.forceKill) {
        console.log(
          `🔪 Force killing existing ${server.name} server (PID: ${existingPid})...`
        );
        this.killProcess(existingPid);
      } else {
        console.log(
          `⚠️  ${server.name} server is already running (PID: ${existingPid})`
        );
        console.log(`   Use --force to kill and restart`);
        return { port: server.defaultPort, pid: existingPid };
      }
    }

    // Determine target port
    let targetPort = options.port || server.defaultPort;

    // Check if port is available or can be freed
    const portInfo = this.checkPort(targetPort);
    if (portInfo) {
      if (options.forceKill || this.isOurProcess(portInfo)) {
        console.log(`🔪 Freeing port ${targetPort} (${portInfo.service})...`);
        this.killPortProcesses(targetPort);
      } else {
        console.log(`⚠️  Port ${targetPort} is in use by ${portInfo.service}`);
        targetPort = this.findAvailablePort(server);
        console.log(`🔄 Using fallback port ${targetPort}`);
      }
    }

    // Start the server
    const pid = await this.spawnServer(server, targetPort, options.watch);

    // Store PID for future reference
    this.storePid(server.name, pid);

    // Wait for server to be ready
    await this.waitForServer(server, targetPort);

    console.log(`✅ ${server.name} server started successfully`);
    console.log(`   Port: ${targetPort}`);
    console.log(`   PID: ${pid}`);
    console.log(
      `   Health: http://localhost:${targetPort}${server.healthEndpoint || ""}`
    );

    return { port: targetPort, pid };
  }

  /**
   * Spawn a server process
   */
  private async spawnServer(
    server: ServerConfig,
    port: number,
    watch: boolean = false
  ): Promise<number> {
    const env = { ...process.env, PORT: port.toString() };

    let command: string;
    let args: string[];

    if (server.name === "rag-editor") {
      // Next.js app
      command = "npm";
      args = ["run", "dev"];
    } else {
      // TypeScript server
      command = "tsx";
      args = watch ? ["watch", server.script] : [server.script];
    }

    console.log(`   Running: ${command} ${args.join(" ")}`);
    console.log(`   Environment: PORT=${port}`);

    const child = spawn(command, args, {
      env,
      stdio: "inherit",
      detached: false,
    });

    return child.pid!;
  }

  /**
   * Wait for server to be ready
   */
  private async waitForServer(
    server: ServerConfig,
    port: number
  ): Promise<void> {
    if (!server.healthEndpoint) {
      console.log(
        `   ⏳ Waiting ${server.startupTimeout}ms for server startup...`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, server.startupTimeout)
      );
      return;
    }

    const healthUrl = `http://localhost:${port}${server.healthEndpoint}`;
    console.log(`   🔍 Checking health endpoint: ${healthUrl}`);

    const startTime = Date.now();
    const timeout = server.startupTimeout;

    while (Date.now() - startTime < timeout) {
      try {
        execSync(`curl -s ${healthUrl}`, { stdio: "ignore" });
        console.log(`   ✅ Health check passed`);
        return;
      } catch {
        // Continue waiting
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error(`Server health check failed after ${timeout}ms`);
  }

  /**
   * Stop a server by name
   */
  public stopServer(serverName: string): boolean {
    const pid = this.getStoredPid(serverName);
    if (!pid) {
      console.log(`⚠️  No stored PID for ${serverName}`);
      return false;
    }

    if (!this.isProcessRunning(pid)) {
      console.log(`⚠️  Process ${pid} is not running`);
      this.clearStoredPid(serverName);
      return false;
    }

    console.log(`🛑 Stopping ${serverName} server (PID: ${pid})...`);
    this.killProcess(pid);
    this.clearStoredPid(serverName);

    return true;
  }

  /**
   * List all running servers
   */
  public listServers(): void {
    console.log("📊 Server Status:");
    console.log("================");

    for (const server of this.SERVERS) {
      const pid = this.getStoredPid(server.name);
      const isRunning = pid && this.isProcessRunning(pid);
      const portInfo = isRunning ? this.checkPort(server.defaultPort) : null;

      console.log(`${server.name}:`);
      console.log(`   Status: ${isRunning ? "🟢 Running" : "🔴 Stopped"}`);
      if (isRunning) {
        console.log(`   PID: ${pid}`);
        console.log(`   Port: ${portInfo?.port || "unknown"}`);
      }
      console.log("");
    }
  }

  /**
   * Clean up all servers
   */
  public cleanupAll(): void {
    console.log("🧹 Cleaning up all servers...");

    for (const server of this.SERVERS) {
      this.stopServer(server.name);
    }

    // Clean up PID files
    try {
      unlinkSync(this.PID_FILE);
    } catch {
      // File doesn't exist, that's fine
    }

    console.log("✅ Cleanup complete");
  }

  // Helper methods
  private getStoredPid(serverName: string): number | null {
    try {
      if (!existsSync(this.PID_FILE)) return null;

      const data = JSON.parse(readFileSync(this.PID_FILE, "utf8"));
      return data[serverName] || null;
    } catch {
      return null;
    }
  }

  private storePid(serverName: string, pid: number): void {
    try {
      let data = {};
      if (existsSync(this.PID_FILE)) {
        data = JSON.parse(readFileSync(this.PID_FILE, "utf8"));
      }

      data[serverName] = pid;
      writeFileSync(this.PID_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.log(`⚠️  Failed to store PID: ${error}`);
    }
  }

  private clearStoredPid(serverName: string): void {
    try {
      if (!existsSync(this.PID_FILE)) return;

      const data = JSON.parse(readFileSync(this.PID_FILE, "utf8"));
      delete data[serverName];

      if (Object.keys(data).length === 0) {
        unlinkSync(this.PID_FILE);
      } else {
        writeFileSync(this.PID_FILE, JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.log(`⚠️  Failed to clear PID: ${error}`);
    }
  }

  private isProcessRunning(pid: number): boolean {
    try {
      execSync(`kill -0 ${pid}`, { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }

  private killProcess(pid: number): void {
    try {
      execSync(`kill -9 ${pid}`, { stdio: "ignore" });
    } catch (error) {
      console.log(`⚠️  Failed to kill process ${pid}: ${error}`);
    }
  }

  private isOurProcess(portInfo: PortInfo): boolean {
    return this.SERVERS.some((server) => server.name === portInfo.service);
  }
}

// CLI interface
async function main() {
  const manager = new PortManager();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("🔧 Obsidian RAG Port Manager");
    console.log("");
    console.log("Usage:");
    console.log("  tsx scripts/port-manager.ts start <server> [options]");
    console.log("  tsx scripts/port-manager.ts stop <server>");
    console.log("  tsx scripts/port-manager.ts list");
    console.log("  tsx scripts/port-manager.ts cleanup");
    console.log("");
    console.log("Servers:");
    console.log("  kv-database  - Main KV database server");
    console.log("  graph-rag    - Graph RAG server");
    console.log("  rag-editor    - RAG editor frontend");
    console.log("");
    console.log("Options:");
    console.log("  --force      - Force kill existing processes");
    console.log("  --port <n>   - Use specific port");
    console.log("  --watch      - Enable watch mode");
    return;
  }

  const command = args[0];

  try {
    switch (command) {
      case "start": {
        const serverName = args[1];
        if (!serverName) {
          console.error("❌ Server name required");
          process.exit(1);
        }

        const options = {
          forceKill: args.includes("--force"),
          port: args.includes("--port")
            ? parseInt(args[args.indexOf("--port") + 1])
            : undefined,
          watch: args.includes("--watch"),
        };

        await manager.startServer(serverName, options);
        break;
      }

      case "stop": {
        const serverName = args[1];
        if (!serverName) {
          console.error("❌ Server name required");
          process.exit(1);
        }

        manager.stopServer(serverName);
        break;
      }

      case "list": {
        manager.listServers();
        break;
      }

      case "cleanup": {
        manager.cleanupAll();
        break;
      }

      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error: ${error}`);
    process.exit(1);
  }
}

// Check if this is the main module (ES module equivalent)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { PortManager };
