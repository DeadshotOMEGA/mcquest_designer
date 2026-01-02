# E2E Test Environment Setup

Quick reference for setting up the Playwright E2E testing environment.

## ✅ Already Configured

- ✅ `.env.test` created with your Clerk test app keys
- ✅ Playwright config optimized for AI debugging
- ✅ 5 test suites ready (auth, editor, CRUD, export, visual regression)
- ✅ Page objects and fixtures implemented
- ✅ Test documentation complete

## 🔧 Manual Steps Required

### 1. Create Test Database (5 minutes)

**Option A: Neon Dashboard** (Recommended)
1. Go to https://console.neon.tech
2. Select project: `ep-blue-shadow-af9gdki7`
3. Databases → Create Database
4. Name: `neondb_test`
5. Owner: `neondb_owner`
6. Click "Create"

**Option B: SQL**
```sql
CREATE DATABASE neondb_test OWNER neondb_owner;
```

### 2. Run Migrations on Test Database

```bash
cd apps/web

# Apply schema to test database
DATABASE_URL=$DATABASE_URL_TEST pnpm prisma migrate deploy
```

### 3. Create Clerk Test User (2 minutes)

1. Go to https://dashboard.clerk.com
2. Select your test app (pk_test_ZGVjZW50LWNhaW1hbi0zOS5jbGVyay5hY2NvdW50cy5kZXYk)
3. Users → Create User
4. Email: `e2e-test@example.com`
5. Password: `TestPassword123!`
6. Click "Create"

### 4. Verify Setup

```bash
cd apps/web
./verify-test-setup.sh
```

This script checks:
- ✓ Environment file configuration
- ✓ Clerk keys validity
- ✓ Database connection
- ✓ Schema migrations
- ✓ Playwright installation
- ✓ Test files present

## 🚀 Run Tests

Once setup is complete:

```bash
cd apps/web

# Run all tests (headless)
pnpm test:e2e

# Run with visible browser (see what's happening)
pnpm test:e2e:headed

# Run with interactive UI (best for debugging)
pnpm test:e2e:ui

# Run specific test
pnpm playwright test auth.spec.ts

# Run tests matching pattern
pnpm playwright test --grep "sign in"
```

## 📊 View Test Results

After tests run:

```bash
# Open HTML report (includes screenshots, videos, traces)
pnpm playwright show-report
```

Artifacts are saved to:
- `test-results/` - Screenshots, videos, traces
- `playwright-report/` - HTML report

## 🐛 Debug Test Failures

When a test fails, you'll have:

1. **Screenshot** - Visual state at failure point
2. **Video** - Full test execution recording
3. **Trace** - Detailed step-by-step execution (open at trace.playwright.dev)
4. **Console logs** - Browser console output

See [e2e/docs/DEBUGGING.md](e2e/docs/DEBUGGING.md) for detailed debugging guide.

## 📚 Additional Documentation

- **[setup-test-db.md](setup-test-db.md)** - Detailed database setup
- **[setup-clerk-user.md](setup-clerk-user.md)** - Detailed Clerk user setup
- **[e2e/docs/README.md](e2e/docs/README.md)** - Test execution guide
- **[e2e/docs/PATTERNS.md](e2e/docs/PATTERNS.md)** - Writing new tests
- **[e2e/docs/DEBUGGING.md](e2e/docs/DEBUGGING.md)** - AI debugging workflows

## ⚡ Quick Test Commands

```bash
# Fastest feedback loop (headed mode, single worker)
pnpm playwright test auth.spec.ts --headed --workers=1

# Debug specific test with Playwright Inspector
pnpm playwright test auth.spec.ts --debug

# Update visual regression baselines
pnpm playwright test visual-regression.spec.ts --update-snapshots

# Show test coverage report
pnpm test:coverage
```

## 🔍 Troubleshooting

**"Cannot connect to database"**
- Make sure you created `neondb_test` database in Neon
- Check DATABASE_URL_TEST in `.env.test`

**"Clerk authentication failed"**
- Verify test user exists in Clerk Dashboard
- Check TEST_USER_EMAIL and TEST_USER_PASSWORD in `.env.test`

**"Dev server not starting"**
- Make sure port 3001 is free
- Check if another dev server is already running

**"Tests are flaky"**
- This is normal for E2E tests initially
- See [e2e/docs/DEBUGGING.md](e2e/docs/DEBUGGING.md) for flake fixes
- Visual regression tests may need baseline updates

## 🎯 Next Steps After Setup

1. **Run verification script**: `./verify-test-setup.sh`
2. **Run first test**: `pnpm test:e2e:headed` (watch it work!)
3. **Review test artifacts**: Open HTML report to see screenshots/videos
4. **Read test patterns**: Learn how to write new tests
5. **Let AI help**: When tests fail, share artifacts with Claude Code

---

**Setup complete?** Run `./verify-test-setup.sh` to confirm everything is ready!
