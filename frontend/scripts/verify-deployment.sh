#!/bin/bash

# CloverShield Deployment Verification Script
# Run this after deploying to Vercel to verify all services are working

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_URL="${1:-https://your-project.vercel.app}"
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
ML_API_URL="${NEXT_PUBLIC_ML_API_URL:-}"

echo "🧪 CloverShield Deployment Verification"
echo "========================================"
echo ""

# Test 1: Site is accessible
echo "Test 1: Checking if site is accessible..."
if curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL" | grep -q "200"; then
    echo -e "${GREEN}✅ Site is accessible${NC}"
else
    echo -e "${RED}❌ Site is not accessible${NC}"
    exit 1
fi

# Test 2: Supabase connection
if [ -n "$SUPABASE_URL" ]; then
    echo ""
    echo "Test 2: Checking Supabase connection..."
    if curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/rest/v1/users?limit=1" | grep -q "200\|401"; then
        echo -e "${GREEN}✅ Supabase is accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  Supabase connection check failed (may need auth)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Supabase URL not set, skipping${NC}"
fi

# Test 3: ML API health
if [ -n "$ML_API_URL" ]; then
    echo ""
    echo "Test 3: Checking ML API health..."
    HEALTH_RESPONSE=$(curl -s "$ML_API_URL/health" || echo "ERROR")
    if echo "$HEALTH_RESPONSE" | grep -q "healthy\|status"; then
        echo -e "${GREEN}✅ ML API is healthy${NC}"
        echo "   Response: $HEALTH_RESPONSE"
    else
        echo -e "${RED}❌ ML API health check failed${NC}"
        echo "   Response: $HEALTH_RESPONSE"
    fi
else
    echo -e "${YELLOW}⚠️  ML API URL not set, skipping${NC}"
fi

# Test 4: Check for JavaScript errors (basic)
echo ""
echo "Test 4: Checking page structure..."
HTML_CONTENT=$(curl -s "$DEPLOYMENT_URL")
if echo "$HTML_CONTENT" | grep -q "CloverShield\|clovershield"; then
    echo -e "${GREEN}✅ Page content loaded${NC}"
else
    echo -e "${YELLOW}⚠️  Page content check inconclusive${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅ Basic verification complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Open $DEPLOYMENT_URL in browser"
echo "2. Run full smoke test (see SMOKE_TEST.md)"
echo "3. Check browser console for errors"
echo "4. Test transaction processing"

