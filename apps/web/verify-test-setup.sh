#!/bin/bash
# Test Environment Setup Verification Script

set -e

echo "🔍 Verifying E2E Test Environment Setup..."
echo ""

# Check if .env.test exists
echo "✓ Checking .env.test file..."
if [ ! -f ".env.test" ]; then
    echo "❌ .env.test not found!"
    echo "   Run: cp .env.test.example .env.test"
    exit 1
fi
echo "  ✅ .env.test exists"

# Load environment variables
while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ $key =~ ^#.*$ ]] && continue
    [[ -z $key ]] && continue
    # Export the variable
    export "$key=$value"
done < .env.test

# Check Clerk keys
echo ""
echo "✓ Checking Clerk configuration..."
if [[ ! "$CLERK_SECRET_KEY" =~ ^sk_test_ ]]; then
    echo "❌ CLERK_SECRET_KEY must start with sk_test_"
    exit 1
fi
if [[ ! "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" =~ ^pk_test_ ]]; then
    echo "❌ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must start with pk_test_"
    exit 1
fi
echo "  ✅ Clerk test keys configured"

# Check test user credentials
echo ""
echo "✓ Checking test user credentials..."
if [ "$TEST_USER_EMAIL" = "e2e-test@example.com" ] && [ "$TEST_USER_PASSWORD" = "TestPassword123!" ]; then
    echo "  ⚠️  Using default credentials (okay if you created user in Clerk)"
else
    echo "  ✅ Custom test user credentials set"
fi

# Check database URL
echo ""
echo "✓ Checking test database configuration..."
if [[ "$DATABASE_URL_TEST" =~ neondb_test ]]; then
    echo "  ✅ Test database URL configured (neondb_test)"
else
    echo "  ⚠️  Test database URL doesn't contain 'neondb_test'"
    echo "     Make sure you're using a separate test database!"
fi

# Try to connect to test database
echo ""
echo "✓ Testing database connection..."
if pnpm prisma db execute --url "$DATABASE_URL_TEST" --stdin <<< "SELECT 1;" &> /dev/null; then
    echo "  ✅ Test database connection successful"
else
    echo "  ❌ Cannot connect to test database!"
    echo "     Make sure you created the database in Neon Dashboard"
    echo "     See: setup-test-db.md"
    exit 1
fi

# Check if migrations are applied
echo ""
echo "✓ Checking database schema..."
TABLES=$(pnpm prisma db execute --url "$DATABASE_URL_TEST" --stdin <<< "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1 | tail -1)
if [ -z "$TABLES" ] || [ "$TABLES" = "0" ]; then
    echo "  ⚠️  No tables found in test database!"
    echo "     Run: pnpm prisma migrate deploy --url \$DATABASE_URL_TEST"
else
    echo "  ✅ Database schema exists"
fi

# Check if Playwright is installed
echo ""
echo "✓ Checking Playwright installation..."
if pnpm playwright --version &> /dev/null; then
    VERSION=$(pnpm playwright --version)
    echo "  ✅ Playwright installed: $VERSION"
else
    echo "  ❌ Playwright not installed!"
    echo "     Run: pnpm --filter web playwright install chromium"
    exit 1
fi

# Check if test files exist
echo ""
echo "✓ Checking test files..."
TEST_COUNT=$(find e2e/tests -name "*.spec.ts" | wc -l)
if [ "$TEST_COUNT" -gt 0 ]; then
    echo "  ✅ Found $TEST_COUNT test files"
else
    echo "  ❌ No test files found in e2e/tests/"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test Environment Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Create test user in Clerk Dashboard:"
echo "   → https://dashboard.clerk.com"
echo "   → Users → Create User"
echo "   → Email: $TEST_USER_EMAIL"
echo "   → Password: $TEST_USER_PASSWORD"
echo ""
echo "2. Run migrations on test database:"
echo "   → pnpm prisma migrate deploy --url \$DATABASE_URL_TEST"
echo ""
echo "3. Run E2E tests:"
echo "   → pnpm test:e2e          (headless)"
echo "   → pnpm test:e2e:headed   (visible browser)"
echo "   → pnpm test:e2e:ui       (interactive UI)"
echo ""
echo "📚 Documentation:"
echo "   → Setup guides: setup-test-db.md, setup-clerk-user.md"
echo "   → Test patterns: e2e/docs/PATTERNS.md"
echo "   → Debugging: e2e/docs/DEBUGGING.md"
echo ""

# Check if Chromium is installed
echo ""
echo "✓ Checking Chromium browser..."
if pnpm exec playwright --version &> /dev/null && [ -d "$HOME/.cache/ms-playwright/chromium-1200" ]; then
    echo "  ✅ Chromium browser installed"
else
    echo "  ❌ Chromium browser not installed!"
    echo "     Run: pnpm --filter web exec playwright install chromium"
fi
