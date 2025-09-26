const js = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsparser = require("@typescript-eslint/parser");
const localRules = require("./eslint-rules/index.js");

module.exports = [
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.js"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: {
        // Node.js globals
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        setInterval: "readonly",
        setTimeout: "readonly",
        clearInterval: "readonly",
        clearTimeout: "readonly",
        setImmediate: "readonly",
        clearImmediate: "readonly",
        performance: "readonly",
        NodeJS: "readonly",
        // Test globals
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        vi: "readonly",
        // Browser globals for UI components
        window: "readonly",
        document: "readonly",
        React: "readonly",
        JSX: "readonly",
        HTMLTextAreaElement: "readonly",
        Event: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      local: localRules,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // Add any custom rules here
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-undef": "error", // Keep this to catch undefined variables
      "local/no-hype-identifiers": "error", // Purpose-first naming rule
    },
  },
  // Specific config for rag_web_search_tool UI components
  {
    files: ["apps/rag_web_search_tool/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        jsx: true,
      },
      globals: {
        HTMLTextAreaElement: "readonly",
        Event: "readonly",
        setTimeout: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off", // Allow unused vars in interfaces
    },
  },
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "stryker-tmp/**",
      "**/*.test.ts",
      "**/*.spec.ts",
    ],
  },
];
