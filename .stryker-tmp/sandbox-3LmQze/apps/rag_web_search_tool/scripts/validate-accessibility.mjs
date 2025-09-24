#!/usr/bin/env node
// @ts-nocheck

/**
 * Accessibility Validation CLI Script
 *
 * Validates design tokens for WCAG 2.1 compliance
 * Usage: node scripts/validate-accessibility.mjs [tokens-path]
 */

import { runAccessibilityValidation } from "../utils/accessibility/tokenValidator.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get tokens path from command line argument or use default
const tokensPath =
  process.argv[2] ||
  path.join(__dirname, "../ui/designTokens/designTokens.json");

console.log("🎨 Design Token Accessibility Validator");
console.log("═".repeat(40));

try {
  await runAccessibilityValidation(tokensPath);
} catch (error) {
  console.error("❌ Validation failed:", error.message);
  process.exit(1);
}
