# CAWS (Code Assessment Workflow System) Tools

This directory contains a comprehensive set of tools for code quality assessment, compliance checking, and trust scoring. The tools have been refactored to use shared base classes and utilities for better maintainability and consistency.

## 🚀 New Features (v1.1)

### Fast Lane Workflows
CAWS now supports controlled escape hatches for urgent changes and experimental work:

- **Waiver System**: Temporarily exempt specific quality gates (coverage, mutation, contracts) with approval and expiry
- **Human Overrides**: Senior developers can waive requirements in working specs for hotfixes
- **Experiment Mode**: Reduced ceremony for time-boxed prototypes and spikes
- **AI Confidence Assessment**: AI agents self-assess uncertainty and recommend human involvement

### Enhanced Flexibility
- **Tier-Based CI Optimization**: Low-risk changes skip expensive checks
- **Configurable Requirements**: Customize thresholds per project or language
- **Multi-Language Support**: Extensible tooling for Python, Java, and other ecosystems

See the [Fast Lane Guide](#fast-lane-features) below for usage examples.

## 🏎️ Fast Lane Features

### Waivers for Temporary Exemptions

Use waivers to temporarily bypass quality gates for urgent situations:

```bash
# Add a waiver for mutation testing (expires in 7 days)
npx caws waivers add HOTFIX-001 mutation "Urgent production fix" alice-smith 7

# Check waiver status
npx caws waivers check HOTFIX-001

# List all active waivers
npx caws waivers list

# Revoke a waiver
npx caws waivers revoke HOTFIX-001
```

### Human Overrides in Working Specs

For hotfixes or special cases, senior developers can override requirements:

```yaml
# In .caws/working-spec.yml
human_override:
  approved_by: "alice-smith"
  reason: "Critical production fix - bypassing mutation tests for immediate deployment"
  waived_requirements: ["mutation_testing", "manual_review"]
  expiry_date: "2025-10-01T00:00:00Z"
```

### Experiment Mode for Prototypes

Enable reduced requirements for experimental features:

```yaml
# In .caws/working-spec.yml
experiment_mode: true
timeboxed_hours: 24
```

Experiments automatically:
- Skip mutation testing
- Skip contract validation
- Reduce coverage requirements to 50%
- Skip manual review

### AI Confidence Assessment

AI agents can self-assess and flag uncertainty:

```yaml
# In .caws/working-spec.yml
ai_assessment:
  confidence_level: 6  # 1-10 scale
  uncertainty_areas: ["complex business logic", "performance implications"]
  recommended_pairing: true
```

Low confidence (< 5) triggers additional human oversight.

### Initialization with Fast Lane Options

```bash
# Interactive initialization
npx caws init spec --interactive

# Initialize experimental feature
npx caws init spec --experiment --id=EXP-001 --title="New AI Feature" --tier=3

# Initialize with AI assessment
npx caws init spec --id=FEAT-123 --title="User Authentication" --tier=1
```

## 📊 Advanced Quality Tools

### Test Quality Analysis

Beyond just coverage metrics, analyze test meaningfulness:

```bash
# Analyze test quality
npx tsx apps/tools/caws/test-quality.ts analyze tests .caws/working-spec.yml

# Checks for:
# - Meaningful assertions (not just trivial tests)
# - Spec coverage (each acceptance criterion has tests)
# - Property-based tests
# - Edge case coverage
# - Weak test detection
```

### Multi-Language Support

CAWS adapts to different programming languages:

```bash
# Auto-detect project language
npx tsx apps/tools/caws/language-adapters.ts detect

# List supported languages
npx tsx apps/tools/caws/language-adapters.ts list

# Get language-specific configuration
npx tsx apps/tools/caws/language-adapters.ts config python

# Get tier policy for language
npx tsx apps/tools/caws/language-adapters.ts tier rust 2
```

Supported: TypeScript, Python, Rust, Go, Java

### Legacy Codebase Migration

Assess and plan migration of legacy code to CAWS:

```bash
# Assess a legacy module
npx tsx apps/tools/caws/legacy-assessment.ts assess src/auth

# Generate full migration plan
npx tsx apps/tools/caws/legacy-assessment.ts plan .

# Provides:
# - Complexity analysis
# - Coverage assessment
# - Recommended tier
# - Migration priority
# - Quick wins
# - Phased migration plan
```

### Security & Provenance

Enhanced security with cryptographic signing and AI supply chain tracking:

```bash
# Sign provenance manifest
npx tsx apps/tools/caws/security-provenance.ts sign .agent/provenance.json

# Verify signature
npx tsx apps/tools/caws/security-provenance.ts verify .agent/provenance.json <signature>

# Run security scans
npx tsx apps/tools/caws/security-provenance.ts scan .

# Generate SLSA attestation
npx tsx apps/tools/caws/security-provenance.ts slsa <commit-hash>
```

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
