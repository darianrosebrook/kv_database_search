// @ts-nocheck
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  rules: {
    // Frontend specific rules
    "no-console": "off", // Allow console in frontend
    "no-unused-vars": "warn",
  },
  ignorePatterns: ["build/", "node_modules/", "*.js", "*.d.ts"],
};
