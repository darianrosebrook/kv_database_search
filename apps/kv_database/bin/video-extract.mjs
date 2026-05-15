#!/usr/bin/env node

/**
 * Thin shim that resolves to the TypeScript CLI via tsx (dev) or compiled
 * JavaScript (production). When this package is installed via `pnpm link --global`,
 * tsx is available as a workspace dev dep so source mode is preferred.
 */

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const srcCli = resolve(here, "..", "src", "cli", "video-extract.ts");
const distCli = resolve(here, "..", "dist", "cli", "video-extract.js");

const args = process.argv.slice(2);

// Try tsx via local node_modules first, then root workspace node_modules.
const tsxCandidates = [
  resolve(here, "..", "node_modules", ".bin", "tsx"),
  resolve(here, "..", "..", "..", "node_modules", ".bin", "tsx"),
];

for (const tsxBin of tsxCandidates) {
  if (existsSync(tsxBin) && existsSync(srcCli)) {
    try {
      execFileSync(tsxBin, [srcCli, ...args], { stdio: "inherit" });
      process.exit(0);
    } catch (e) {
      if (e.status != null) process.exit(e.status);
      // fall through to next candidate
    }
  }
}

// Fall back to compiled JS
if (existsSync(distCli)) {
  await import(distCli);
} else {
  console.error(
    "video-extract: could not find CLI entry point.\n" +
      "Run `pnpm --filter @kv/database build`, or ensure tsx is available in the workspace.",
  );
  process.exit(1);
}
