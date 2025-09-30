import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    include: [
      "tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "tests/contract/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "apps/kv_database/tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "apps/kv_database/tests/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "apps/kv_database/tests/contract/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      ...(process.env.MUTATION_TESTING === "true"
        ? []
        : [
            "tests/e2e/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            "tests/axe/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            "apps/kv_database/tests/e2e/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
          ]),
    ],
    exclude: [
      "node_modules",
      "dist",
      ".caws",
      "contracts",
      "docs",
      ".stryker-tmp",
      "**/.stryker-tmp/**",
      "**/pdf-processor.test.ts",
      ...(process.env.MUTATION_TESTING === "true"
        ? [
            "**/image-*.test.ts", // Skip image-related tests in mutation testing
            "**/multi-modal.test.ts", // Skip multi-modal tests in mutation testing
            "**/database.test.ts", // Skip database integration tests in mutation testing
          ]
        : []),
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["apps/kv_database/src/**/*.ts"],
      exclude: [
        "node_modules/",
        "dist/",
        "tests/",
        "apps/tools/",
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
    testTimeout: 15000, // Reduced from 30s to prevent memory accumulation
    hookTimeout: 30000, // Reduced from 60s to prevent memory accumulation
    retry: 1, // Reduced from 2 to minimize memory usage
    bail: 1, // Stop on first failure in CI
    reporters: process.env.CI ? ["verbose", "github-actions"] : ["verbose"],
    root: process.cwd(), // Explicitly set root to current working directory
  },
  esbuild: {
    target: "node18",
  },
});
