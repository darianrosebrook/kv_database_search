#!/usr/bin/env node

// Thin shim that resolves to the TypeScript CLI via tsx.
// When installed globally via `pnpm link --global`, tsx is a devDep
// so we fall back to the compiled dist/ if tsx isn't available.

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcCli = resolve(__dirname, "..", "src", "cli.ts");
const distCli = resolve(__dirname, "..", "dist", "cli.js");

const args = process.argv.slice(2);

// Try tsx first (dev / linked mode), fall back to compiled dist
try {
  const tsxBin = resolve(__dirname, "..", "node_modules", ".bin", "tsx");
  if (existsSync(srcCli) && existsSync(tsxBin)) {
    execFileSync(tsxBin, [srcCli, ...args], { stdio: "inherit" });
    process.exit(0);
  }
} catch (e) {
  if (e.status != null) process.exit(e.status);
  // tsx not found — fall back
}

// Fall back to compiled JS
if (existsSync(distCli)) {
  const result = await import(distCli);
  // cli.js runs on import, nothing else needed
} else {
  console.error(
    "video-extract: could not find CLI entry point.\n" +
      "Run `pnpm build` in the video-extract package, or ensure tsx is available."
  );
  process.exit(1);
}
