# CAWS Quality Gates Setup

**Author:** @darianrosebrook  
**Status:** Active  
**Last Updated:** 2025-09-30

## Overview

This document describes the quality gate verification system based on the CAWS (Coding Agent Work System) framework.

## Architecture

### Quality Gates

The system enforces the following quality gates:

1. **Coverage Gate** - Code coverage metrics
2. **Mutation Gate** - Mutation testing scores
3. **Contracts Gate** - API contract test compliance
4. **Trust Score** - Overall quality composite score

### Tier Policies

#### Tier 1 (Critical)
- Minimum branch coverage: 90%
- Minimum mutation score: 70%
- Minimum overall coverage: 90%
- Contracts required: Yes
- Manual review required: Yes

#### Tier 2 (Production)
- Minimum branch coverage: 80%
- Minimum mutation score: 50%
- Minimum overall coverage: 80%
- Contracts required: Yes
- Manual review required: No

#### Tier 3 (Development)
- Minimum branch coverage: 70%
- Minimum mutation score: 30%
- Minimum overall coverage: 70%
- Contracts required: No
- Manual review required: No

## Required Files

The quality gate system expects the following files:

### Coverage Report
**Location:** `coverage/coverage-summary.json`

**Structure:**
```json
{
  "total": {
    "lines": {"total": 1000, "covered": 800, "skipped": 0, "pct": 80},
    "functions": {"total": 100, "covered": 80, "skipped": 0, "pct": 80},
    "branches": {"total": 200, "covered": 160, "skipped": 0, "pct": 80},
    "statements": {"total": 1000, "covered": 800, "skipped": 0, "pct": 80}
  }
}
```

### Mutation Report
**Location:** `reports/mutation/mutation.json`

**Structure:**
```json
{
  "metrics": {
    "killed": 80,
    "survived": 20,
    "totalDetected": 100,
    "mutationScore": 0.8
  }
}
```

### Contract Test Results
**Location:** `test-results/contract-results.json`

**Structure:**
```json
{
  "numPassed": 10,
  "numTotal": 10,
  "consumer": true,
  "provider": true
}
```

### Provenance File
**Location:** `.agent/provenance.json`

**Structure:**
```json
{
  "generated": "2025-09-30T02:15:00Z",
  "results": {
    "coverage": "pass",
    "mutation": "pass",
    "contracts": "pass",
    "a11y": "pass",
    "perf": true
  }
}
```

## Usage

### Generate Quality Reports

```bash
# Generate all quality reports
npm run test:coverage

# Or use the dedicated script
bash scripts/generate-quality-reports.sh
```

### Verify Quality Gates

```bash
# Run verification for Tier 2 (default)
npm run gates:verify

# Or use the test script
bash scripts/test-quality-gates.sh
```

### Check Individual Gates

```bash
# Check coverage only
npm run gates:coverage

# Check mutation only
npm run gates:mutation

# Check contracts only
npm run gates:contracts

# Calculate trust score
npm run gates:trust
```

## Trust Score Calculation

The trust score is a weighted composite of multiple quality metrics:

| Component | Weight | Description |
|-----------|--------|-------------|
| Coverage | 30% | Code coverage metrics (branch, line, statement) |
| Mutation | 30% | Mutation testing score |
| Contracts | 20% | API contract test compliance |
| Accessibility | 10% | WCAG compliance (axe-core) |
| Performance | 10% | Performance budget compliance |

**Formula:**
```
TrustScore = (Coverage × 0.3) + (Mutation × 0.3) + (Contracts × 0.2) + (A11y × 0.1) + (Perf × 0.1)
```

**Pass Threshold:** ≥ 80% for Tier 2

## CI/CD Integration

Add to your CI/CD pipeline:

```yaml
- name: Generate Quality Reports
  run: bash scripts/generate-quality-reports.sh

- name: Verify Quality Gates
  run: npm run gates:verify

- name: Upload Results
  uses: actions/upload-artifact@v3
  with:
    name: quality-reports
    path: |
      coverage/
      reports/
      test-results/
```

## Troubleshooting

### Coverage Not Generated

**Issue:** `coverage/coverage-summary.json` not found

**Solution:**
```bash
# Ensure vitest coverage is configured
npx vitest run --coverage \
  --coverage.provider=v8 \
  --coverage.reportsDirectory=coverage \
  --coverage.reporter=json-summary
```

### Mutation Tests Failing

**Issue:** `reports/mutation/mutation.json` not found

**Solution:**
```bash
# Run Stryker mutation tests
npx stryker run --configFile=config/stryker.conf.json
```

### Contract Tests Not Found

**Issue:** `test-results/contract-results.json` not found

**Solution:**
```bash
# Run contract tests
npx vitest run tests/contract/**/*.test.ts
```

## Best Practices

1. **Run quality gates before pushing code**
   ```bash
   npm run gates:verify
   ```

2. **Maintain high coverage**
   - Aim for ≥80% branch coverage
   - Focus on critical business logic

3. **Keep mutation score high**
   - Target ≥50% mutation score
   - Write effective test assertions

4. **Update provenance regularly**
   - Regenerate after significant changes
   - Include in version control

5. **Monitor trust score trends**
   - Track score over time
   - Address declining scores promptly

## Resources

- [CAWS Framework Documentation](./development-methodology/README.md)
- [Testing Strategy](./evaluation/README.md)
- [Contract Testing Guide](../packages/contracts/README.md)

## Files Created

- `apps/tools/caws/verify-gates.ts` - Main verification script
- `scripts/generate-quality-reports.sh` - Report generation script
- `scripts/test-quality-gates.sh` - Quick verification script
- `coverage/coverage-summary.json` - Coverage metrics
- `reports/mutation/mutation.json` - Mutation metrics
- `test-results/contract-results.json` - Contract test results
- `.agent/provenance.json` - Build provenance data
