module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: ["eslint:recommended", "@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  rules: {
    // Allow console statements in scripts and tools
    "no-console": "off",
    // Allow unused variables that start with underscore
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    // Allow explicit any in some cases (can be tightened later)
    "@typescript-eslint/no-explicit-any": "warn",
  },
  ignorePatterns: [
    "dist/",
    "node_modules/",
    "coverage/",
    "reports/",
    ".caws/",
    "contracts/",
    "docs/",
  ],
};
