// @ts-nocheck
module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  rules: {
    // Allow console statements in scripts and tools
    "no-console": "off",
    // Allow unused variables that start with underscore
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    // Allow explicit any in some cases (can be tightened later)
    "no-undef": "off", // TypeScript handles this
  },
  ignorePatterns: [
    "dist/",
    "node_modules/",
    "coverage/",
    "reports/",
    ".caws/",
    "contracts/",
    "docs/",
    "tests/",
    "tools/",
  ],
};
