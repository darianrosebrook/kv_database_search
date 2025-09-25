#!/usr/bin/env tsx

import path from "path";
import { fileURLToPath } from "url";
import { CawsValidator } from "./shared/validator.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const filePath = process.argv[3];

  if (!command || !filePath) {
    console.error(
      "Usage: validate <working-spec|provenance|file|directory> <file-path>"
    );
    process.exit(1);
  }

  const validator = new CawsValidator();
  let result: any;

  switch (command) {
    case "working-spec":
      result = validator.validateWorkingSpec(filePath);
      break;
    case "provenance":
      result = validator.validateProvenance(filePath);
      break;
    case "file":
      result = validator.validateFileExists(filePath);
      break;
    case "directory":
      result = validator.validateDirectoryExists(filePath);
      break;
    default:
      console.error(
        "Unknown validation type. Use: working-spec, provenance, file, or directory"
      );
      process.exit(1);
  }

  if (result.valid) {
    console.log("✅ Validation passed");
    if (result.warnings) {
      console.log("⚠️  Warnings:");
      result.warnings.forEach((warning: string) =>
        console.log(`   ${warning}`)
      );
    }
    process.exit(0);
  } else {
    console.error("❌ Validation failed");
    if (result.errors) {
      result.errors.forEach((error: string) => console.error(`   ${error}`));
    }
    process.exit(1);
  }
}
