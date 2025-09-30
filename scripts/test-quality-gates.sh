#!/bin/bash

# @author @darianrosebrook  
# Test Quality Gates for CAWS Framework
#
# This script verifies that all quality gate files are in place
# and runs the CAWS verification tool

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 CAWS Quality Gate Test${NC}"
echo "=========================="
echo ""

# Get the project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Check for required files
echo "📋 Checking for required files..."
echo ""

FILES=(
  "coverage/coverage-summary.json"
  "reports/mutation/mutation.json"
  "test-results/contract-results.json"
  ".agent/provenance.json"
)

ALL_FILES_EXIST=true

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} $file"
  else
    echo -e "${RED}❌${NC} $file ${YELLOW}(missing)${NC}"
    ALL_FILES_EXIST=false
  fi
done

echo ""

if [ "$ALL_FILES_EXIST" = false ]; then
  echo -e "${YELLOW}⚠️  Some required files are missing${NC}"
  echo ""
  echo "You can generate placeholder files by running:"
  echo "  bash scripts/generate-quality-reports.sh"
  echo ""
  exit 1
fi

echo -e "${GREEN}✅ All required files are present${NC}"
echo ""

# Run the CAWS verification tool
echo "🔐 Running CAWS Verification..."
echo "-------------------------------"
echo ""

if npx tsx apps/tools/caws/verify-gates.ts; then
  echo ""
  echo -e "${GREEN}✅ Quality gates verification passed!${NC}"
  exit 0
else
  echo ""
  echo -e "${RED}❌ Quality gates verification failed${NC}"
  exit 1
fi
