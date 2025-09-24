# CAWS (Code Assessment Workflow System) Tools

This directory contains a comprehensive set of tools for code quality assessment, compliance checking, and trust scoring. The tools have been refactored to use shared base classes and utilities for better maintainability and consistency.

## Architecture

### Shared Components

#### `shared/base-tool.ts`
- **Purpose**: Base class providing common functionality for all CAWS tools
- **Features**:
  - File system operations (read/write JSON, YAML, file existence checks)
  - Directory management
  - Configuration loading (tier policies, CAWS config)
  - Logging utilities with consistent formatting
  - Argument parsing
  - Environment validation
  - Result handling and exit codes

#### `shared/types.ts`
- **Purpose**: Centralized type definitions for CAWS tools
- **Contains**:
  - Validation results and gate check options
  - Coverage, mutation, and contract test data structures
  - Trust score components and results
  - Tier policies and configuration
  - Provenance data structures

#### `shared/validator.ts`
- **Purpose**: Shared validation utilities for working specs, provenance, and other data
- **Features**:
  - JSON Schema validation with AJV
  - YAML and JSON file validation
  - Working specification validation with business logic
  - Provenance file validation
  - File and directory existence validation

#### `shared/config-manager.ts`
- **Purpose**: Centralized configuration management for CAWS tools
- **Features**:
  - Load/save configuration from/to files
  - Default configuration with sensible defaults
  - Section-specific getters (gates, tools, paths, features)
  - YAML import/export support
  - Configuration validation and directory creation

#### `shared/gate-checker.ts`
- **Purpose**: Centralized logic for performing CAWS gate checks
- **Features**:
  - Coverage report validation
  - Mutation testing score calculation
  - Contract test verification
  - Trust score calculation with weighted components
  - Tier-based policy enforcement

## Tools

### `gates.ts`
Command-line tool for running individual CAWS gate checks.

**Usage**:
```bash
gates coverage --working-directory /path/to/project --tier 2
gates mutation --working-directory /path/to/project --tier 2
gates contracts --working-directory /path/to/project --tier 2
```

**Options**:
- `--working-directory`: Path to project directory (default: current directory)
- `--tier`: Risk tier (1-3) for threshold application

### `trust.ts`
Command-line tool for calculating overall CAWS trust score.

**Usage**:
```bash
trust --working-directory /path/to/project --tier 2
```

**Options**:
- `--working-directory`: Path to project directory (default: current directory)
- `--tier`: Risk tier (1-3) for threshold application

### `validate.ts`
Command-line tool for validating working specifications and provenance data.

**Usage**:
```bash
validate working-spec /path/to/spec.yaml
validate provenance /path/to/provenance.json
validate file /path/to/file
validate directory /path/to/directory
```

### `config.ts`
Command-line tool for managing CAWS configuration.

**Usage**:
```bash
config get [section]              # Get configuration or specific section
config set <key> <value>          # Set a configuration value
config reset                      # Reset to defaults
config export                     # Export as YAML
config import <file>              # Import from YAML file
config load <file>                # Load from JSON file
config save <file>                # Save to JSON file
config features                   # Show enabled features
config paths                      # Show configured paths
config gates                      # Show gate configurations
config tools                      # Show tool configurations
```

**Examples**:
```bash
config get gates
config set gates.coverage.enabled false
config import my-config.yaml
```

## Configuration

The CAWS system uses a centralized configuration file located at `.caws/config.json`. The configuration includes:

### Gates Configuration
- Coverage thresholds for statements, branches, functions, lines
- Mutation testing thresholds for killed/survived tests
- Contract testing requirements
- Trust score thresholds

### Tool Configuration
- Command and arguments for coverage tools (nyc)
- Command and arguments for mutation tools (stryker)
- Command and arguments for contract tools (pact)
- Command and arguments for linting and testing

### Path Configuration
- Working directory
- Reports directory
- Coverage directory
- Artifacts directory

### Feature Flags
- Multi-modal content support
- Obsidian vault support
- Parallel processing

### Logging Configuration
- Log level (debug, info, warn, error)
- Log file path
- Log format (json, text)

## Usage Examples

### Setting up a new project
```bash
# Initialize CAWS configuration
caws config get

# Run all gate checks
caws gates coverage --tier 2
caws gates mutation --tier 2
caws gates contracts --tier 2

# Calculate trust score
caws trust --tier 2

# Validate working specification
caws validate working-spec ./working-spec.yaml
```

### Custom configuration
```bash
# View current configuration
caws config get

# Disable mutation testing
caws config set gates.mutation.enabled false

# Change coverage thresholds
caws config set gates.coverage.thresholds.branches 80

# Export configuration for sharing
caws config export > shared-config.yaml
```

## Development

When adding new CAWS tools:

1. **Extend CawsBaseTool**: Use the shared base class for common functionality
2. **Use shared types**: Import types from `shared/types.ts`
3. **Leverage validators**: Use `CawsValidator` for data validation
4. **Utilize config manager**: Use `CawsConfigManager` for configuration
5. **Follow gate checker**: Use `CawsGateChecker` for gate logic

Example new tool structure:
```typescript
import { CawsBaseTool, ToolResult } from "./shared/base-tool.js";
import { CawsValidator } from "./shared/validator.js";

export class MyCawsTool extends CawsBaseTool {
  async run(): Promise<ToolResult> {
    // Use inherited methods and shared utilities
    const validator = new CawsValidator();
    const config = this.loadCawsConfig();

    // Tool logic here...

    return this.createResult(true, "Success message");
  }
}
```

## Error Handling

All tools follow consistent error handling patterns:

- **Validation errors**: Return structured error messages
- **File system errors**: Graceful handling of missing files/directories
- **Configuration errors**: Fall back to defaults when configuration is invalid
- **Exit codes**: 0 for success, 1 for failure

## Testing

Tools should be tested with various scenarios:

- Valid and invalid inputs
- Missing files and directories
- Different configuration settings
- Various risk tiers
- Network timeouts (for external services)

## Contributing

When contributing to CAWS tools:

1. Follow the established patterns in existing tools
2. Use the shared utilities and base classes
3. Add appropriate error handling and logging
4. Update this documentation for new features
5. Include usage examples and help text
6. Test thoroughly with edge cases

## License

These tools are part of the Obsidian RAG project and follow the same licensing terms.
