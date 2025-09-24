#!/usr/bin/env node
// @ts-nocheck

/**
 * Component Accessibility Validation CLI Script
 *
 * Validates individual component token files for WCAG 2.1 compliance
 * Usage: node scripts/validate-components.mjs [components-dir]
 */

import {
  validateAllComponentTokens,
  generateComponentReport,
} from "../utils/accessibility/componentValidator.ts";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get components directory from command line argument or use default
const componentsDir =
  process.argv[2] || path.join(__dirname, "../ui/components");

console.log("🧩 Component Token Accessibility Validator");
console.log("═".repeat(40));
console.log(`📁 Scanning: ${componentsDir}\n`);

try {
  if (!fs.existsSync(componentsDir)) {
    console.error(`❌ Components directory not found: ${componentsDir}`);
    process.exit(1);
  }

  const validations = await validateAllComponentTokens(componentsDir);

  if (validations.length === 0) {
    console.log("⚠️  No component token files found.");
    process.exit(0);
  }

  const report = generateComponentReport(validations);
  console.log(report);

  // Write report to file
  const reportPath = path.join(
    process.cwd(),
    "component-accessibility-report.txt"
  );
  fs.writeFileSync(reportPath, report);
  console.log(`📄 Report saved to: ${reportPath}`);

  // Exit with error code if there are invalid components
  const invalidComponents = validations.filter((v) => !v.isValid).length;
  if (invalidComponents > 0) {
    console.log(
      `\n❌ ${invalidComponents} components have accessibility issues. Please fix before deployment.`
    );
    process.exit(1);
  } else {
    console.log(
      `\n✅ All ${validations.length} components pass accessibility requirements!`
    );
  }
} catch (error) {
  console.error("❌ Validation failed:", error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
}
