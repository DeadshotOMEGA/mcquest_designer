# E2E Test Authoring Patterns

This guide shows how to write new E2E tests following established patterns for AI-friendliness and maintainability.

## Table of Contents

1. [Page Object Pattern](#page-object-pattern)
2. [Fixture Usage](#fixture-usage)
3. [Test Data Builders](#test-data-builders)
4. [Test Structure](#test-structure)
5. [Assertions](#assertions)
6. [Visual Regression](#visual-regression)

---

## Page Object Pattern

**What:** Centralize selectors and actions in dedicated page classes.

**Why:** Changes to UI require updating only one file, not every test.

### Example: Creating a New Page Object

```typescript
// e2e/pages/my-new-page.ts
import { BasePage } from './base-page'

export class MyNewPage extends BasePage {
  // Locators (getters for dynamic elements)
  get myButton() {
    return this.page.getByRole('button', { name: /click me/i })
  }

  get myInput() {
    return this.page.getByLabel(/enter text/i)
  }

  // Actions (methods that perform operations)
  async navigateToMyPage() {
    await this.navigate('/my-page')
  }

  async fillForm(text: string) {
    await this.myInput.fill(text)
    await this.myButton.click()
    await this.waitForNetworkIdle()
  }

  // Queries (methods that return data)
  async getResultText(): Promise<string> {
    return await this.page.locator('[data-testid="result"]').textContent() || ''
  }
}
```

### Using the Page Object in Tests

```typescript
import { test, expect } from '@playwright/test'
import { MyNewPage } from '../pages/my-new-page'

test('should display result after form submission', async ({ page }) => {
  const myPage = new MyNewPage(page)

  await myPage.navigateToMyPage()
  await myPage.fillForm('test input')

  const result = await myPage.getResultText()
  expect(result).toBe('test input')
})
```

---

## Fixture Usage

**What:** Reusable test setup and teardown logic.

**Why:** Avoid duplicating auth/database setup in every test.

### Using the Auth Fixture

```typescript
import { test, expect } from '../fixtures/auth'
import { DashboardPage } from '../pages/dashboard-page'

// This test runs with an authenticated user
test('should access protected route', async ({ authenticatedPage }) => {
  const dashboard = new DashboardPage(authenticatedPage)
  await dashboard.navigateToDashboard()

  // User is already signed in
  await expect(authenticatedPage).toHaveURL(/\/dashboard/)
})
```

### Using the Database Fixture

```typescript
import { test as baseTest } from '../fixtures/auth'
import { test as dbTest } from '../fixtures/database'

// Combine fixtures
const test = baseTest.extend(dbTest)

test('should have clean database', async ({ authenticatedPage, cleanDatabase }) => {
  // Database is clean at start of test
  // User is authenticated
  // Both fixtures applied
})
```

### Creating a Custom Fixture

```typescript
// e2e/fixtures/project-with-quests.ts
import { test as base } from './auth'
import { DashboardPage } from '../pages/dashboard-page'
import { EditorPage } from '../pages/editor-page'

export const test = base.extend({
  projectWithQuests: async ({ authenticatedPage }, use) => {
    const dashboard = new DashboardPage(authenticatedPage)
    const editor = new EditorPage(authenticatedPage)

    // Setup: create project with quests
    await dashboard.navigateToDashboard()
    await dashboard.createProject('Test Project')
    await dashboard.openProject('Test Project')

    await editor.addQuest()
    await editor.addQuest()

    // Provide project context to test
    await use({ projectName: 'Test Project', questCount: 2 })

    // Teardown: cleanup happens automatically via database fixture
  },
})
```

---

## Test Data Builders

**What:** Functions that generate test data with sensible defaults.

**Why:** Avoid hardcoding test data, make tests more readable.

### Using Builders

```typescript
import { buildProject } from '../builders/project'
import { buildQuest } from '../builders/quest'

test('should create project with custom name', async () => {
  // Use default values
  const project1 = buildProject()

  // Override specific fields
  const project2 = buildProject({
    name: 'Custom Project Name',
    description: 'Custom description',
  })

  // Generate multiple projects
  const projects = buildProjects(5) // Creates 5 projects
})
```

### Creating a New Builder

```typescript
// e2e/builders/chapter.ts
export interface ChapterData {
  title: string
  order: number
  description?: string
}

export const buildChapter = (overrides: Partial<ChapterData> = {}): ChapterData => ({
  title: `Test Chapter ${Date.now()}`,
  order: 0,
  description: 'Test chapter description',
  ...overrides,
})

export const buildChapters = (count: number): ChapterData[] => {
  const timestamp = Date.now()
  return Array.from({ length: count }, (_, i) => ({
    title: `Chapter ${timestamp}-${i + 1}`,
    order: i,
    description: `Chapter ${i + 1} description`,
  }))
}
```

---

## Test Structure

**What:** Consistent organization of test files.

**Why:** AI can easily understand and generate new tests.

### Template for New Test File

```typescript
/**
 * [Feature] Tests
 *
 * [Brief description of what is tested]
 *
 * Test Data: [What builders/fixtures are used]
 * Auth: [Authentication requirements]
 * Database: [Database requirements]
 *
 * Common Failures:
 * - "[Error message]": [Cause and fix]
 * - "[Another error]": [Cause and fix]
 */

import { test, expect } from '../fixtures/auth'
import { MyPage } from '../pages/my-page'
import { buildMyData } from '../builders/my-data'

test.describe('[Feature Group]', () => {
  let myPage: MyPage

  test.beforeEach(async ({ authenticatedPage }) => {
    myPage = new MyPage(authenticatedPage)
    await myPage.navigateToMyPage()
  })

  test('should [do something]', async () => {
    // Arrange
    const testData = buildMyData()

    // Act
    await myPage.performAction(testData)

    // Assert
    await expect(myPage.result).toBeVisible()
  })

  test('should handle edge case', async () => {
    // Test specific edge case
  })
})
```

---

## Assertions

**What:** Verifying expected behavior.

**Why:** Tests must fail clearly when behavior breaks.

### Common Assertion Patterns

```typescript
// Visibility
await expect(element).toBeVisible()
await expect(element).not.toBeVisible()

// Text content
await expect(element).toHaveText('Expected text')
await expect(element).toContainText('partial')

// Count
const count = await elements.count()
expect(count).toBe(5)

// URL
await expect(page).toHaveURL(/\/expected-path/)

// Attributes
await expect(element).toHaveAttribute('disabled')
await expect(element).toHaveClass('active')

// Custom conditions
expect(await myPage.getStatus()).toBe('success')

// Wait for condition
await expect(async () => {
  const status = await myPage.getStatus()
  expect(status).toBe('complete')
}).toPass({ timeout: 5000 })
```

### Soft Assertions (Multiple Checks)

```typescript
test('should have correct form state', async ({ page }) => {
  // Continue test even if assertions fail
  await expect.soft(titleInput).toHaveValue('Title')
  await expect.soft(descriptionInput).toHaveValue('Description')
  await expect.soft(submitButton).toBeEnabled()

  // All failures reported at end of test
})
```

---

## Visual Regression

**What:** Capture and compare screenshots to detect visual changes.

**Why:** Catch unintended UI changes automatically.

### Adding Visual Regression Tests

```typescript
test('should maintain button styling', async ({ page }) => {
  await page.goto('/my-page')

  const button = page.getByRole('button', { name: /submit/i })

  // Capture element screenshot
  await expect(button).toHaveScreenshot('submit-button.png', {
    maxDiffPixels: 50, // Allow minor differences
  })
})

test('should maintain page layout', async ({ page }) => {
  await page.goto('/my-page')

  // Capture full page screenshot
  await expect(page).toHaveScreenshot('my-page-layout.png', {
    fullPage: true,
    maxDiffPixels: 100,
  })
})
```

### Managing Baselines

```bash
# Create initial baselines
pnpm --filter web test:e2e --update-snapshots

# Review visual diffs
# Check test-results/ for diff images

# Update baselines after intentional changes
pnpm --filter web test:e2e --update-snapshots
```

---

## Best Practices Summary

1. **Use Page Objects** for all UI interactions
2. **Use Fixtures** for shared setup (auth, database)
3. **Use Builders** for test data generation
4. **Add descriptive comments** at file and test level
5. **Document common failures** in test file header
6. **Keep tests independent** - no test should depend on another
7. **Use stable selectors** - prefer role/label over CSS classes
8. **Wait for specific conditions** - avoid arbitrary timeouts
9. **Clean up after tests** - use database fixture
10. **Group related tests** in describe blocks

## AI-Friendly Tips

When writing tests for AI to maintain:

- Use clear, descriptive variable names
- Add comments explaining non-obvious logic
- Document test intent in file headers
- Use consistent patterns across all tests
- Keep test files focused on single features
- Provide examples of common failures and fixes

This structure allows AI assistants (like Claude Code) to:
- Understand test intent quickly
- Generate new tests following patterns
- Debug failures using documented error patterns
- Maintain consistency across the test suite
