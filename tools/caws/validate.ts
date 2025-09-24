#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import Ajv from "ajv";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export function validateWorkingSpec(specPath: string): ValidationResult {
  try {
    // Read the working spec file
    const specContent = fs.readFileSync(specPath, "utf-8");
    let spec: any;

    // Try to parse as YAML first, then JSON
    try {
      // For now, assume JSON - in production you'd add YAML parsing
      spec = JSON.parse(specContent);
    } catch (e) {
      return {
        valid: false,
        errors: ["Invalid JSON/YAML format in working spec"],
      };
    }

    // Load schema
    const schemaPath = path.join(
      __dirname,
      "../../.caws/schemas/working-spec.schema.json"
    );
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");
    const schema = JSON.parse(schemaContent);

    // Validate against schema
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(schema);
    const valid = validate(spec);

    if (!valid) {
      return {
        valid: false,
        errors:
          validate.errors?.map(
            (err) => `${err.instancePath}: ${err.message}`
          ) || [],
      };
    }

    // Additional business logic validations
    const warnings: string[] = [];

    // Check risk tier thresholds
    if (spec.risk_tier === 1 && spec.acceptance?.length < 5) {
      warnings.push("Tier 1 specs should have at least 5 acceptance criteria");
    }

    if (spec.risk_tier === 2 && spec.contracts?.length === 0) {
      warnings.push("Tier 2 specs should have contract definitions");
    }

    // Check for required non-functional requirements
    const requiredNonFunctional = ["perf"];
    const missingNonFunctional = requiredNonFunctional.filter(
      (req) => !spec.non_functional?.[req]
    );

    if (missingNonFunctional.length > 0) {
      warnings.push(
        `Missing non-functional requirements: ${missingNonFunctional.join(
          ", "
        )}`
      );
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Validation failed: ${error}`],
    };
  }
}

export function validateProvenance(provenancePath: string): ValidationResult {
  try {
    const provenanceContent = fs.readFileSync(provenancePath, "utf-8");
    const provenance = JSON.parse(provenanceContent);

    // Basic structure validation
    const requiredFields = [
      "agent",
      "model",
      "commit",
      "artifacts",
      "results",
      "approvals",
    ];
    const missingFields = requiredFields.filter((field) => !provenance[field]);

    if (missingFields.length > 0) {
      return {
        valid: false,
        errors: [`Missing required fields: ${missingFields.join(", ")}`],
      };
    }

    // Validate results structure
    const requiredResults = [
      "coverage_branch",
      "mutation_score",
      "tests_passed",
    ];
    const missingResults = requiredResults.filter(
      (field) => typeof provenance.results[field] !== "number"
    );

    if (missingResults.length > 0) {
      return {
        valid: false,
        errors: [`Missing numeric results: ${missingResults.join(", ")}`],
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      errors: [`Provenance validation failed: ${error}`],
    };
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const filePath = process.argv[3];

  if (!command || !filePath) {
    console.error("Usage: validate <working-spec|provenance> <file-path>");
    process.exit(1);
  }

  let result: ValidationResult;

  switch (command) {
    case "working-spec":
      result = validateWorkingSpec(filePath);
      break;
    case "provenance":
      result = validateProvenance(filePath);
      break;
    default:
      console.error("Unknown validation type. Use: working-spec or provenance");
      process.exit(1);
  }

  if (result.valid) {
    console.log("✅ Validation passed");
    if (result.warnings) {
      console.log("⚠️  Warnings:");
      result.warnings.forEach((warning) => console.log(`   ${warning}`));
    }
    process.exit(0);
  } else {
    console.error("❌ Validation failed");
    if (result.errors) {
      result.errors.forEach((error) => console.error(`   ${error}`));
    }
    process.exit(1);
  }
}
