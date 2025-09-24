// @ts-nocheck
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: [
      "tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/contract/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/e2e/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/axe/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    exclude: [
      "node_modules",
      "dist",
      ".caws",
      "contracts",
      "docs",
      "**/pdf-processor.test.ts",
      "**/multi-modal*.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "node_modules/",
        "dist/",
        "tests/",
        "tools/",
        "src/scripts/",
        "**/*.d.ts",
        "**/*.config.{js,ts}",
        "src/lib/__tests__/",
        "**/*.test.ts",
        "**/*.spec.ts",
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      all: false, // Only track files that are actually imported/executed
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 60000, // 60 seconds for setup/teardown
    retry: 2, // Retry flaky tests
    bail: 1, // Stop on first failure in CI
    reporters: process.env.CI ? ["verbose", "github-actions"] : ["verbose"],
    root: process.cwd(), // Explicitly set root to current working directory
  },
  esbuild: {
    target: "node18",
  },
});
