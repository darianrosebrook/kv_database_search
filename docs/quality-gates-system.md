# CAWS Quality Gates System

**Author:** @darianrosebrook
**Status:** Active
**Last Updated:** 2025-09-30

## Overview

The CAWS Quality Gates System provides comprehensive code quality assurance through graduated checks that run at different stages of the development workflow. Since this project doesn't use PRs, we've implemented precommit hooks and manual quality gate verification.

## Architecture

### Quality Gates Levels

The system provides **4 levels** of quality assurance:

#### 1. **Precommit Gates** (Fast - Runs on every commit)
- **ESLint** - Code style and error checking
- **TypeScript** - Type checking
- **Quick Unit Tests** - Fast subset of critical tests
- **Execution Time:** ~10-30 seconds

#### 2. **Staging Gates** (Medium - Run before pushing)
- All Precommit Gates +
- **Full Unit Tests** - Complete test suite
- **Execution Time:** ~1-3 minutes

#### 3. **CI Gates** (Comprehensive - Run in CI/CD)
- All Staging Gates +
- **Coverage Analysis** - Code coverage metrics
- **Mutation Testing** - Mutation score validation
- **Contract Testing** - API contract compliance
- **Execution Time:** ~5-15 minutes

#### 4. **Full Analysis** (Complete - Manual deep analysis)
- All CI Gates +
- **Quality Reports** - Generate comprehensive reports
- **Trust Score** - Calculate overall quality metric
- **Execution Time:** ~10-30 minutes

## Quality Gate Requirements

### CAWS Framework Tier Requirements

| Tier | Coverage | Mutation | Contracts | Trust Score | Manual Review |
|------|----------|----------|-----------|-------------|----------------|
| **1 (Critical)** | ≥90% | ≥70% | Required | N/A | Required |
| **2 (Production)** | ≥80% | ≥50% | Required | ≥80% | No |
| **3 (Development)** | ≥70% | ≥30% | Optional | N/A | No |

**Current Target:** Tier 2 (Production Ready)

## Usage

### Precommit Hooks (Automatic)

The system automatically runs precommit quality gates on every commit:

```bash
# Automatic - runs when you commit
git commit -m "feat: add new feature"
# Precommit hooks run automatically
```

### Manual Quality Gate Checks

#### Quick Precommit Check
```bash
npm run quality:precommit
# Fast checks for development workflow
```

#### Staging Check (Before Push)
```bash
npm run quality:staging
# Medium checks for local validation
```

#### CI Check (Pipeline)
```bash
npm run quality:ci
# Full checks for CI/CD pipeline
```

#### Complete Analysis
```bash
npm run quality:full
# Deep analysis with reports
```

### Individual Gate Verification

```bash
# Check specific quality aspects
npm run gates:coverage    # Coverage metrics
npm run gates:mutation    # Mutation testing
npm run gates:contracts   # Contract tests
npm run gates:trust       # Trust score
npm run gates:verify      # All gates
```

## Quality Gate Components

### 1. Code Quality (ESLint + TypeScript)

**Purpose:** Ensure code quality and type safety

**Checks:**
- ESLint rules compliance
- TypeScript type checking
- Code style consistency
- Import/export validation

**Failure Action:** Commit blocked

### 2. Unit Testing (Vitest)

**Purpose:** Validate core functionality

**Coverage:** Critical business logic and utilities

**Metrics:**
- Test pass rate
- Basic functionality validation

**Failure Action:** Commit blocked (precommit), Warning (staging)

### 3. Coverage Analysis (V8 Coverage)

**Purpose:** Ensure adequate test coverage

**Requirements (Tier 2):**
- Branch coverage: ≥80%
- Line coverage: ≥80%
- Function coverage: ≥80%

**Failure Action:** CI pipeline fails

### 4. Mutation Testing (Stryker)

**Purpose:** Validate test quality and effectiveness

**Requirements (Tier 2):**
- Mutation score: ≥50%
- Tests kill mutants effectively

**Failure Action:** CI pipeline fails

### 5. Contract Testing (Pact)

**Purpose:** Ensure API contract compliance

**Checks:**
- Provider contract validation
- Consumer contract validation
- API compatibility

**Failure Action:** CI pipeline fails

### 6. Trust Score Calculation

**Purpose:** Overall quality composite metric

**Formula:**
```
TrustScore = (Coverage × 0.3) + (Mutation × 0.3) + (Contracts × 0.2) + (A11y × 0.1) + (Perf × 0.1)
```

**Requirements (Tier 2):** ≥80%

## Configuration

### Husky Precommit Hooks

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### Lint-staged Configuration

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix"
    ],
    "*.{ts,tsx}": [
      "tsc --noEmit --skipLibCheck",
      "npm run quality:precommit"
    ]
  }
}
```

### CI/CD Pipeline Integration

```yaml
# .github/workflows/ci.yml
- name: Run Quality Gates
  run: npm run quality:ci

- name: Generate Quality Reports
  run: bash scripts/generate-quality-reports.sh

- name: Upload Quality Reports
  uses: actions/upload-artifact@v3
  with:
    name: quality-reports
    path: |
      coverage/
      reports/
      test-results/
```

## Quality Gate Results

### Success Indicators

✅ **Green Indicators:**
- All checks pass
- No blocking issues
- Quality metrics meet targets

### Failure Indicators

❌ **Red Indicators:**
- Critical failures in any gate
- Quality metrics below thresholds
- Type errors or lint violations

⚠️ **Yellow Indicators:**
- Warnings in non-critical checks
- Performance degradation
- Coverage below targets

## Troubleshooting

### Precommit Hook Issues

```bash
# Skip hooks for urgent commits
git commit --no-verify -m "fix: urgent hotfix"

# Debug hook execution
git config --list | grep hook
```

### Quality Gate Failures

```bash
# Check individual gates
npm run gates:coverage  # Debug coverage issues
npm run gates:mutation  # Debug mutation issues

# Run with verbose output
npm run quality:precommit -- --verbose
```

### Performance Issues

```bash
# Run quick checks only
npm run quality:precommit

# Skip heavy checks for development
git commit --no-verify
```

## Best Practices

### Development Workflow

1. **Write code** with tests
2. **Run precommit checks** frequently
3. **Fix issues** immediately
4. **Run staging checks** before push
5. **Monitor CI results** after push

### Code Quality Standards

1. **Always run precommit hooks**
2. **Fix lint errors** before committing
3. **Maintain test coverage** above thresholds
4. **Review mutation test failures**
5. **Keep trust score** above 80%

### Performance Optimization

1. **Use precommit mode** for fast feedback
2. **Cache dependencies** in CI
3. **Parallelize tests** where possible
4. **Skip heavy checks** for hotfixes
5. **Monitor execution times**

## Integration Points

### Development Tools

- **VS Code:** ESLint and TypeScript extensions
- **Git:** Husky precommit hooks
- **CI/CD:** GitHub Actions with quality gates

### Monitoring

- **Trust Score Trends:** Track over time
- **Failure Patterns:** Identify common issues
- **Performance Metrics:** Monitor execution times
- **Coverage Reports:** Regular review

## Future Enhancements

### Planned Improvements

1. **Performance Budgets** - Automated performance monitoring
2. **Accessibility Gates** - WCAG compliance checking
3. **Security Scanning** - Automated vulnerability checks
4. **Flake Detection** - Automated test flakiness detection
5. **Incremental Gates** - Smarter change detection

### Advanced Features

1. **Risk-based Gates** - Different checks for different file types
2. **Historical Analysis** - Quality trend monitoring
3. **Automated Fixes** - AI-powered code improvement suggestions
4. **Team Dashboards** - Quality metrics visualization

## Resources

- [CAWS Framework Documentation](./development-methodology/README.md)
- [Testing Strategy](./evaluation/README.md)
- [Contract Testing Guide](../packages/contracts/README.md)
- [Husky Documentation](https://typicode.github.io/husky/)
- [Lint-staged Documentation](https://github.com/okonet/lint-staged)
