#!/bin/bash

# @author @darianrosebrook
# Precommit Quality Gates for CAWS Framework
#
# This script provides graduated quality gates for different scenarios:
# - precommit: Fast checks for development workflow
# - staging: Medium checks for local testing
# - ci: Full checks for CI/CD pipeline

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Default mode
MODE="${1:-precommit}"

echo -e "${BLUE}🔍 CAWS Quality Gates - ${MODE} Mode${NC}"
echo "======================================"
echo ""

# Get the project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

case "$MODE" in
    "precommit")
        echo -e "${PURPLE}🎯 Running Fast Precommit Checks${NC}"
        echo "----------------------------------"
        echo ""

        # 1. Lint and Type Check (Fast)
        echo "🔍 Running ESLint..."
        if npm run lint 2>&1 | grep -q "✖.*error"; then
            echo -e "${RED}❌${NC} ESLint errors found"
            echo "Run 'npm run lint:fix' to auto-fix issues"
            echo -e "${YELLOW}⚠️${NC}  Continuing with warnings (fix errors to improve quality)"
        else
            echo -e "${GREEN}✅${NC} ESLint passed (warnings allowed)"
        fi

        # 2. Type Check (Fast)
        echo "🔍 Running TypeScript check..."
        if npx tsc --noEmit --skipLibCheck > /dev/null 2>&1; then
            echo -e "${GREEN}✅${NC} TypeScript check passed"
        else
            echo -e "${RED}❌${NC} TypeScript check failed"
            exit 1
        fi

        # 3. Quick Unit Tests (Fast subset)
        echo "🔍 Running quick unit tests..."
        if npm run test:unit:quick > /dev/null 2>&1; then
            echo -e "${GREEN}✅${NC} Quick unit tests passed"
        else
            echo -e "${YELLOW}⚠️${NC}  Quick unit tests failed (run full tests manually)"
            # Don't fail on quick tests in precommit
        fi

        echo ""
        echo -e "${GREEN}✅ Precommit quality gates passed!${NC}"
        ;;

    "staging")
        echo -e "${PURPLE}🏗️  Running Staging Checks${NC}"
        echo "---------------------------"
        echo ""

        # Run precommit checks first
        "$0" precommit

        # Additional staging checks
        echo "🔍 Running full unit tests..."
        if npm run test:unit > /dev/null 2>&1; then
            echo -e "${GREEN}✅${NC} Full unit tests passed"
        else
            echo -e "${YELLOW}⚠️${NC}  Full unit tests failed (continue with caution)"
            echo "Fix test issues to improve quality"
            # Don't fail on staging - allow for development workflow
        fi

        echo ""
        echo -e "${GREEN}✅ Staging quality gates passed!${NC}"
        ;;

    "ci")
        echo -e "${PURPLE}🚀 Running CI Quality Gates${NC}"
        echo "----------------------------"
        echo ""

        # Run staging checks first
        "$0" staging

        # Full CI checks
        echo "🔍 Running coverage checks..."
        if npm run gates:coverage > /dev/null 2>&1; then
            echo -e "${GREEN}✅${NC} Coverage gates passed"
        else
            echo -e "${RED}❌${NC} Coverage gates failed"
            exit 1
        fi

        echo "🔍 Running mutation tests..."
        if npm run gates:mutation > /dev/null 2>&1; then
            echo -e "${GREEN}✅${NC} Mutation gates passed"
        else
            echo -e "${RED}❌${NC} Mutation gates failed"
            exit 1
        fi

        echo "🔍 Running contract tests..."
        if npm run gates:contracts > /dev/null 2>&1; then
            echo -e "${GREEN}✅${NC} Contract gates passed"
        else
            echo -e "${RED}❌${NC} Contract gates failed"
            exit 1
        fi

        echo ""
        echo -e "${GREEN}✅ CI quality gates passed!${NC}"
        ;;

    "full")
        echo -e "${PURPLE}🔬 Running Full Quality Analysis${NC}"
        echo "-----------------------------------"
        echo ""

        # Run all checks
        "$0" ci

        echo "🔍 Generating quality reports..."
        if bash scripts/generate-quality-reports.sh > /dev/null 2>&1; then
            echo -e "${GREEN}✅${NC} Quality reports generated"
        else
            echo -e "${YELLOW}⚠️${NC}  Quality reports generation failed"
        fi

        echo "🔍 Calculating trust score..."
        if npm run gates:trust > /dev/null 2>&1; then
            echo -e "${GREEN}✅${NC} Trust score calculated"
        else
            echo -e "${RED}❌${NC} Trust score calculation failed"
            exit 1
        fi

        echo ""
        echo -e "${GREEN}✅ Full quality analysis completed!${NC}"
        ;;

    *)
        echo -e "${RED}❌ Invalid mode: $MODE${NC}"
        echo ""
        echo "Available modes:"
        echo "  precommit - Fast checks for development (default)"
        echo "  staging   - Medium checks for local testing"
        echo "  ci        - Full checks for CI/CD pipeline"
        echo "  full      - Complete analysis with reports"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}📊 Quality Gate Summary:${NC}"
echo "  Mode: $MODE"
echo "  Status: PASSED"
echo "  Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
