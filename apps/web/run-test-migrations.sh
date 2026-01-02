#!/bin/bash
# Script to run Prisma migrations on test database

set -e

echo "🔄 Running migrations on test database (neondb_test)..."
echo ""

# Load test environment
if [ ! -f .env.test ]; then
    echo "❌ Error: .env.test not found!"
    echo "   Make sure you're in the apps/web directory"
    exit 1
fi

# Extract DATABASE_URL_TEST from .env.test
export DATABASE_URL=$(grep "^DATABASE_URL_TEST=" .env.test | cut -d '=' -f2-)

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL_TEST not found in .env.test"
    exit 1
fi

echo "📦 Database: neondb_test"
echo ""

# Run migrations
pnpm prisma migrate deploy

echo ""
echo "✅ Migrations completed successfully!"
echo ""
echo "Next step: Create test user in Clerk"
echo "  1. Go to: https://dashboard.clerk.com"
echo "  2. Users → Create User"
echo "  3. Email: e2e-test@example.com"
echo "  4. Password: TestPassword123!"
