#!/usr/bin/env bash

# Validate GitHub Actions workflow syntax
# Usage: .github/scripts/validate-workflows.sh

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Validating GitHub Actions workflows...${NC}\n"

# Find all workflow files
WORKFLOW_DIR=".github/workflows"
ERRORS=0

if [ ! -d "$WORKFLOW_DIR" ]; then
    echo -e "${RED}Error: Workflow directory not found: $WORKFLOW_DIR${NC}"
    exit 1
fi

# Check if any workflow files exist
if ! ls "$WORKFLOW_DIR"/*.yml >/dev/null 2>&1 && ! ls "$WORKFLOW_DIR"/*.yaml >/dev/null 2>&1; then
    echo -e "${RED}Error: No workflow files found in $WORKFLOW_DIR${NC}"
    exit 1
fi

# Validate each workflow file
for workflow in "$WORKFLOW_DIR"/*.{yml,yaml}; do
    # Skip if glob didn't match
    [ -f "$workflow" ] || continue

    echo -e "Validating: ${YELLOW}$workflow${NC}"

    # Check YAML syntax using Python
    if command -v python3 >/dev/null 2>&1; then
        if ! python3 -c "import sys, yaml; yaml.safe_load(open('$workflow'))" 2>/dev/null; then
            echo -e "${RED}✗ YAML syntax error in $workflow${NC}"
            python3 -c "import sys, yaml; yaml.safe_load(open('$workflow'))" 2>&1 || true
            ERRORS=$((ERRORS + 1))
        else
            echo -e "${GREEN}✓ YAML syntax valid${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Python3 not available, skipping YAML validation${NC}"
    fi

    # Check required fields
    if ! grep -q "^name:" "$workflow"; then
        echo -e "${RED}✗ Missing 'name' field${NC}"
        ERRORS=$((ERRORS + 1))
    fi

    if ! grep -q "^on:" "$workflow"; then
        echo -e "${RED}✗ Missing 'on' field${NC}"
        ERRORS=$((ERRORS + 1))
    fi

    if ! grep -q "^jobs:" "$workflow"; then
        echo -e "${RED}✗ Missing 'jobs' field${NC}"
        ERRORS=$((ERRORS + 1))
    fi

    # Check for common issues
    if grep -q "uses: actions/checkout@v3" "$workflow"; then
        echo -e "${YELLOW}⚠ Consider upgrading to actions/checkout@v4${NC}"
    fi

    if grep -q "uses: actions/setup-node@v3" "$workflow"; then
        echo -e "${YELLOW}⚠ Consider upgrading to actions/setup-node@v4${NC}"
    fi

    # Check for secrets without proper handling
    if grep -q "\${{ secrets\." "$workflow" && ! grep -q "||" "$workflow"; then
        echo -e "${YELLOW}⚠ Secrets used without fallback values${NC}"
    fi

    echo ""
done

# Validate dependabot.yml if it exists
DEPENDABOT_FILE=".github/dependabot.yml"
if [ -f "$DEPENDABOT_FILE" ]; then
    echo -e "Validating: ${YELLOW}$DEPENDABOT_FILE${NC}"

    if command -v python3 >/dev/null 2>&1; then
        if ! python3 -c "import sys, yaml; yaml.safe_load(open('$DEPENDABOT_FILE'))" 2>/dev/null; then
            echo -e "${RED}✗ YAML syntax error in $DEPENDABOT_FILE${NC}"
            python3 -c "import sys, yaml; yaml.safe_load(open('$DEPENDABOT_FILE'))" 2>&1 || true
            ERRORS=$((ERRORS + 1))
        else
            echo -e "${GREEN}✓ Dependabot configuration valid${NC}"
        fi
    fi

    # Check required fields
    if ! grep -q "^version:" "$DEPENDABOT_FILE"; then
        echo -e "${RED}✗ Missing 'version' field${NC}"
        ERRORS=$((ERRORS + 1))
    fi

    if ! grep -q "^updates:" "$DEPENDABOT_FILE"; then
        echo -e "${RED}✗ Missing 'updates' field${NC}"
        ERRORS=$((ERRORS + 1))
    fi

    echo ""
fi

# Summary
echo -e "================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All workflows validated successfully${NC}"
    exit 0
else
    echo -e "${RED}✗ Validation failed with $ERRORS error(s)${NC}"
    exit 1
fi
