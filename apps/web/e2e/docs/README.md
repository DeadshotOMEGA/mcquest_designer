# E2E Testing Guide

AI-first Playwright testing for MCQuest Designer.

## Quick Start

```bash
# Install dependencies (if not already done)
pnpm install

# Set up test environment
cp .env.test.example .env.test
# Edit .env.test with your test credentials

# Run tests (headless)
pnpm --filter web test:e2e

# Run tests (headed mode, see browser)
pnpm --filter web test:e2e:headed

# Run tests (UI mode, interactive)
pnpm --filter web test:e2e:ui

# Run tests (debug mode, step through)
pnpm --filter web test:e2e:debug

# Run specific test file
pnpm --filter web test:e2e tests/auth.spec.ts

# Update visual regression baselines
pnpm --filter web test:e2e --update-snapshots
```

## Test Structure

```
e2e/
  pages/            # Page Object Model classes
    base-page.ts    # Common functionality
    auth-page.ts    # Authentication flows
    dashboard-page.ts   # Project management
    editor-page.ts  # Quest editor canvas
    export-dialog.ts    # Export functionality
  fixtures/         # Test fixtures
    auth.ts         # Authenticated user fixture
    database.ts     # Clean database fixture
  builders/         # Test data builders
    project.ts      # Project data generator
    quest.ts        # Quest data generator
  tests/            # Test specs
    auth.spec.ts    # Authentication tests
    crud.spec.ts    # CRUD operations tests
    editor.spec.ts  # Editor interaction tests
    export.spec.ts  # Export functionality tests
    visual-regression.spec.ts   # Visual regression tests
  docs/             # Documentation
    README.md       # This file
    PATTERNS.md     # Test authoring patterns
    DEBUGGING.md    # Debugging guide
```

## Environment Setup

### Test Database

You MUST use a separate database for E2E tests to avoid polluting your development data.

1. Create a test database:
   ```bash
   createdb mcquest_test
   ```

2. Run migrations on test database:
   ```bash
   DATABASE_URL="postgresql://localhost:5432/mcquest_test" pnpm --filter web prisma migrate deploy
   ```

3. Set DATABASE_URL_TEST in .env.test

### Clerk Test Environment

1. Create a test environment in Clerk dashboard
2. Create a persistent test user for E2E tests
3. Set credentials in .env.test:
   - CLERK_SECRET_KEY
   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   - TEST_USER_EMAIL
   - TEST_USER_PASSWORD

## Debugging Failed Tests

### 1. Check Test Artifacts

After a test fails, check these locations:

```
test-results/
  <test-name>-chromium/
    test-failed-1.png      # Screenshot at failure
    video.webm             # Full test recording
    trace.zip              # Playwright trace file

playwright-report/
  index.html               # HTML report with all artifacts
```

### 2. Open HTML Report

```bash
npx playwright show-report
```

This opens an interactive report with:
- Screenshots at failure point
- Video recordings of test execution
- Console logs and network activity
- Stack traces and error messages

### 3. Use Playwright Trace Viewer

For detailed timeline analysis:

```bash
npx playwright show-trace test-results/.../trace.zip
```

Trace viewer shows:
- DOM snapshots at each action
- Network requests/responses
- Console logs
- Screenshots
- Action timeline

### 4. Run Tests in Debug Mode

```bash
pnpm --filter web test:e2e:debug
```

This opens Playwright Inspector, allowing you to:
- Step through test actions
- Inspect page state at each step
- Modify selectors on the fly
- Record new test actions

### 5. Run Tests in Headed Mode

```bash
pnpm --filter web test:e2e:headed
```

Watch the browser execute tests in real-time.

## Writing New Tests

See [PATTERNS.md](./PATTERNS.md) for detailed examples and conventions.

Quick example:

```typescript
import { test, expect } from '../fixtures/auth'
import { DashboardPage } from '../pages/dashboard-page'

test('my new test', async ({ authenticatedPage }) => {
  const dashboard = new DashboardPage(authenticatedPage)
  await dashboard.navigateToDashboard()

  // Your test logic here
  await dashboard.createProject('My Project')

  // Assertions
  await expect(dashboard.getProjectCard('My Project')).toBeVisible()
})
```

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Pull requests (full suite)
- Manual workflow dispatch

Artifacts are uploaded to GitHub Actions on failure for review.

### Pre-commit Hooks

(Deferred to later phase)

Smoke tests can be configured to run before commits:
- Fast subset of critical tests
- Prevents obviously broken commits

## Common Issues

### "Command failed: pnpm run dev"

**Cause:** Dev server already running on port 3001

**Fix:** Stop existing dev server or change PORT in .env.test

### "Test failed: Sign in button not found"

**Cause:** Clerk environment not configured or test user doesn't exist

**Fix:** Verify Clerk credentials in .env.test and ensure test user exists

### "Database connection failed"

**Cause:** DATABASE_URL_TEST not set or test database doesn't exist

**Fix:** Create test database and set DATABASE_URL_TEST in .env.test

### "Screenshot mismatch"

**Cause:** Visual regression detected or baseline needs updating

**Fix:** Review diff in test-results/, then update baseline if intended:
```bash
pnpm --filter web test:e2e --update-snapshots
```

## Performance Tips

- Use `fullyParallel: true` for faster execution (already configured)
- Prefer specific element visibility over `networkidle` waits
- Use fixtures to share setup across tests
- Keep tests focused and independent

## Best Practices

1. **One assertion per test** (generally) - makes failures easier to diagnose
2. **Use Page Objects** - centralize selectors and actions
3. **Use fixtures** - share setup logic (auth, database cleanup)
4. **Use builders** - generate test data with sensible defaults
5. **Add comments** - explain test intent and common failures
6. **Keep tests independent** - each test should work in isolation
7. **Clean up after tests** - use database fixture for clean state

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
