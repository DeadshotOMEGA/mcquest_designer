# Debugging E2E Tests for AI Assistants

This guide helps AI assistants (like Claude Code) debug E2E test failures using Playwright artifacts.

## Quick Reference

| Artifact | Location | What It Shows |
|----------|----------|---------------|
| Screenshot | `test-results/<test>/test-failed-N.png` | Visual state at failure point |
| Video | `test-results/<test>/video.webm` | Full test execution recording |
| Trace | `test-results/<test>/trace.zip` | Timeline with DOM/network/console |
| HTML Report | `playwright-report/index.html` | All artifacts + error details |

## Debugging Workflow for AI

### 1. User Reports Test Failure

User will typically share:
- Test name
- Error message
- Screenshot or video (if available)

### 2. Analyze Error Message

Common patterns:

#### "Locator not found" Errors

```
Error: Locator '[role="button"][name=/sign in/i]' not found
```

**Possible Causes:**
- Element selector changed (UI refactoring)
- Element not rendered (conditional rendering)
- Timing issue (element not ready)

**Debugging Steps:**
1. Ask user for screenshot from `test-results/`
2. Verify element exists in screenshot
3. Check page HTML structure
4. Update selector in page object if needed
5. Add explicit wait if timing issue

#### "Timeout" Errors

```
Error: Timeout 30000ms exceeded waiting for locator to be visible
```

**Possible Causes:**
- Network request slow/failed
- JavaScript error preventing render
- Incorrect selector

**Debugging Steps:**
1. Check video to see if element ever appears
2. Ask for console logs from trace
3. Check network activity in trace
4. Increase timeout if legitimate slow operation
5. Fix underlying issue (API, rendering bug)

#### "Assertion Failed" Errors

```
Error: Expected toHaveText 'Expected value' but got 'Actual value'
```

**Possible Causes:**
- Business logic bug
- Test expectation outdated
- Timing issue (data not loaded)

**Debugging Steps:**
1. Verify expected value is still correct
2. Check screenshot for actual state
3. Review recent code changes
4. Update test if expectation changed
5. Add wait for data load if timing issue

### 3. Request Specific Artifacts

When debugging, ask user for:

```
Can you share:
1. The screenshot from test-results/<test-name>/test-failed-1.png
2. The error message from the HTML report
3. Any console errors from the trace viewer
```

### 4. Analyze Screenshot

Look for:
- Is the expected element visible?
- Is it in the expected state (enabled/disabled)?
- Are there error messages on screen?
- Is the page layout broken?
- Are there loading spinners?

### 5. Analyze Console Logs

Common errors to look for:
- `TypeError: Cannot read property`
- `NetworkError: Failed to fetch`
- `Unhandled Promise Rejection`
- `React: Warning: ...`

### 6. Analyze Network Activity

Check trace for:
- Failed API requests (4xx, 5xx status)
- Slow requests (>5s)
- Missing requests (expected call not made)
- Incorrect request payload

## Common Failure Patterns

### Authentication Failures

**Symptom:** Test redirects to login unexpectedly

**Causes:**
- Session expired during test
- Clerk environment misconfigured
- Test user credentials invalid

**Fix:**
```typescript
// Verify test user exists and credentials are correct
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL!,
  password: process.env.TEST_USER_PASSWORD!,
}

// Add explicit auth check
test.beforeEach(async ({ authenticatedPage }) => {
  const authPage = new AuthPage(authenticatedPage)
  expect(await authPage.isAuthenticated()).toBe(true)
})
```

### Database State Issues

**Symptom:** Test fails due to unexpected data

**Causes:**
- Database not cleaned between tests
- Test database shared with dev environment
- Previous test didn't clean up

**Fix:**
```typescript
// Use database fixture in all tests
import { test } from '../fixtures/database'

test('my test', async ({ cleanDatabase }) => {
  // Database is clean at start
})
```

### React Flow / Canvas Issues

**Symptom:** Drag operations fail, nodes not visible

**Causes:**
- React Flow viewport not initialized
- Canvas not rendered fully
- Browser viewport too small

**Fix:**
```typescript
// Wait for canvas to be ready
await page.waitForLoadState('networkidle')
await page.waitForTimeout(500) // Allow React Flow to initialize

// Ensure viewport is large enough
use: {
  viewport: { width: 1920, height: 1080 },
}
```

### Autosave Timing Issues

**Symptom:** Changes not saved before test ends

**Causes:**
- Autosave debounce delay
- Test moving too fast

**Fix:**
```typescript
// Wait for autosave after edit
await editor.editQuest({ title: 'New Title' })
await page.waitForTimeout(1000) // Wait for autosave debounce

// Or wait for specific network request
await page.waitForResponse(resp =>
  resp.url().includes('/api/projects') && resp.status() === 200
)
```

## Analyzing Artifacts

### Screenshots

AI can analyze screenshots to identify:
- Visual regressions (layout changes)
- Missing elements (selector issues)
- Error states (error messages visible)
- Loading states (spinners, skeletons)

### Videos

AI cannot directly watch videos, but can ask user:
- "Does the element ever appear in the video?"
- "At what timestamp does the test start failing?"
- "Are there any visible errors in the video?"

### Traces

Trace viewer shows:
1. **Action log** - Each Playwright action taken
2. **DOM snapshots** - Page state at each action
3. **Network** - All HTTP requests
4. **Console** - Browser console output

Ask user to:
```bash
npx playwright show-trace test-results/.../trace.zip
```

Then request specific information:
- "What's the last successful action before failure?"
- "Are there any failed network requests?"
- "What console errors appear before the failure?"

## Generating Fixes

### When Selector Breaks

```typescript
// Old (broken)
get submitButton() {
  return this.page.getByRole('button', { name: /submit/i })
}

// New (fixed after UI change)
get submitButton() {
  return this.getByTestId('submit-button') // More stable
}
```

### When Timing Changes

```typescript
// Old (flaky)
await button.click()
await expect(result).toBeVisible()

// New (explicit wait)
await button.click()
await page.waitForLoadState('networkidle')
await expect(result).toBeVisible({ timeout: 10000 })
```

### When Business Logic Changes

```typescript
// Old (outdated expectation)
await expect(title).toHaveText('Old Title')

// New (updated expectation)
await expect(title).toHaveText('New Title')
```

## AI Debugging Checklist

When user reports test failure:

- [ ] Ask for error message
- [ ] Request screenshot from test-results/
- [ ] Check if recent code changes affected selector
- [ ] Verify test expectations are still valid
- [ ] Look for timing issues (add waits if needed)
- [ ] Check for authentication/database issues
- [ ] Review console logs from trace (if available)
- [ ] Suggest specific fix with code example
- [ ] Explain why failure occurred
- [ ] Suggest how to prevent similar failures

## Preventing Future Failures

### Use Stable Selectors

```typescript
// Good: Role-based (semantic)
page.getByRole('button', { name: /submit/i })

// Good: Test ID (explicit)
page.getByTestId('submit-button')

// Bad: CSS class (fragile)
page.locator('.btn-submit')
```

### Add Explicit Waits

```typescript
// Wait for specific condition
await expect(element).toBeVisible({ timeout: 10000 })

// Wait for network request
await page.waitForResponse('/api/projects/**')

// Wait for element to be ready
await element.waitFor({ state: 'visible' })
```

### Add Error Context

```typescript
// Add helpful error messages
expect(count, 'Expected 3 quests to be created').toBe(3)

// Log state before assertion
console.log('Current quest count:', await editor.getQuestCount())
await expect(editor.questNodes).toHaveCount(3)
```

## Resources for AI

- [Playwright Debugging Guide](https://playwright.dev/docs/debug)
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)
- [Common Errors](https://playwright.dev/docs/test-timeouts)
