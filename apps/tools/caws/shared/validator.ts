/**
 * CAWS Validator
 * Shared validation utilities for working specs, provenance, and other data
 */

import * as fs from "fs";
import * as path from "path";
import Ajv from "ajv";
import { fileURLToPath } from "url";
import yaml from "js-yaml";
import { ValidationResult } from "./types.ts";
import { CawsBaseTool } from "./base-tool.ts";

export class CawsValidator extends CawsBaseTool {
  private ajv: Ajv;

  constructor() {
    super();
    this.ajv = new Ajv({
      allErrors: true,
      strict: false,
      allowUnionTypes: true,
    });
  }

  /**
   * Validate a working spec file
   */
  validateWorkingSpec(specPath: string): ValidationResult {
    try {
      // Read the working spec file
      const specContent = fs.readFileSync(specPath, "utf-8");
      let spec: any;

      // Try to parse as YAML first, then JSON
      try {
        spec = yaml.load(specContent) as any;
      } catch (yamlError) {
        try {
          spec = JSON.parse(specContent);
        } catch (jsonError) {
          return {
            valid: false,
            errors: ["Invalid JSON/YAML format in working spec"],
          };
        }
      }

      // Load schema
      const schemaPath = path.join(
        this.getCawsDirectory(),
        "schemas/working-spec.schema.json"
      );
      const schemaContent = fs.readFileSync(schemaPath, "utf-8");
      const schema = JSON.parse(schemaContent);

      // Validate against schema
      const validate = this.ajv.compile(schema);
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
        warnings.push(
          "Tier 1 specs should have at least 5 acceptance criteria"
        );
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

  /**
   * Validate a provenance file
   */
  validateProvenance(provenancePath: string): ValidationResult {
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
      const missingFields = requiredFields.filter(
        (field) => !provenance[field]
      );

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

  /**
   * Validate a JSON file against a schema
   */
  validateJsonAgainstSchema(
    jsonPath: string,
    schemaPath: string
  ): ValidationResult {
    try {
      // Read JSON file
      const jsonContent = fs.readFileSync(jsonPath, "utf-8");
      const jsonData = JSON.parse(jsonContent);

      // Read schema file
      const schemaContent = fs.readFileSync(schemaPath, "utf-8");
      const schema = JSON.parse(schemaContent);

      // Validate
      const validate = this.ajv.compile(schema);
      const valid = validate(jsonData);

      if (!valid) {
        return {
          valid: false,
          errors:
            validate.errors?.map(
              (err) => `${err.instancePath}: ${err.message}`
            ) || [],
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [`Schema validation failed: ${error}`],
      };
    }
  }

  /**
   * Validate a YAML file against a schema
   */
  validateYamlAgainstSchema(
    yamlPath: string,
    schemaPath: string
  ): ValidationResult {
    try {
      // Read YAML file
      const yamlContent = fs.readFileSync(yamlPath, "utf-8");
      const yamlData = yaml.load(yamlContent) as any;

      // Read schema file
      const schemaContent = fs.readFileSync(schemaPath, "utf-8");
      const schema = JSON.parse(schemaContent);

      // Validate
      const validate = this.ajv.compile(schema);
      const valid = validate(yamlData);

      if (!valid) {
        return {
          valid: false,
          errors:
            validate.errors?.map(
              (err) => `${err.instancePath}: ${err.message}`
            ) || [],
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [`YAML schema validation failed: ${error}`],
      };
    }
  }

  /**
   * Validate file exists and is readable
   */
  validateFileExists(filePath: string): ValidationResult {
    try {
      if (!fs.existsSync(filePath)) {
        return {
          valid: false,
          errors: [`File not found: ${filePath}`],
        };
      }

      // Try to read the file
      fs.accessSync(filePath, fs.constants.R_OK);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [`File not readable: ${filePath}`],
      };
    }
  }

  /**
   * Validate directory exists and is writable
   */
  validateDirectoryExists(dirPath: string): ValidationResult {
    try {
      if (!fs.existsSync(dirPath)) {
        return {
          valid: false,
          errors: [`Directory not found: ${dirPath}`],
        };
      }

      // Try to write to the directory
      fs.accessSync(dirPath, fs.constants.W_OK);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [`Directory not writable: ${dirPath}`],
      };
    }
  }
}
