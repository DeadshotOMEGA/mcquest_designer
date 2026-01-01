# Testing Guide for MCQuest Designer

This document describes the testing infrastructure for the web application.

## Test Stack

- **Vitest**: Unit and integration testing
- **@testing-library/react**: React component testing
- **Playwright**: End-to-end browser testing

## Running Tests

```bash
# Run all unit/integration tests
pnpm test

# Run tests in watch mode
pnpm --filter web test

# Run tests with UI
pnpm --filter web test:ui

# Run tests once (CI mode)
pnpm --filter web test:run

# Run tests with coverage
pnpm --filter web test:coverage

# Run E2E tests
pnpm --filter web test:e2e

# Run E2E tests with UI
pnpm --filter web test:e2e:ui

# Run E2E tests in debug mode
pnpm --filter web test:e2e:debug
```

## Test Organization

### Unit Tests

Location: `src/**/*.test.ts`

Unit tests focus on individual functions and modules:

- **Store tests** (`src/lib/store/editor-store.test.ts`): Test Zustand store actions and state management
- Tests are colocated with the code they test

### Integration Tests

Location: `src/**/*.test.tsx`

Integration tests verify component behavior and user interactions:

- **ChapterPanel tests** (`src/components/editor/panels/chapter-panel.test.tsx`): Test chapter CRUD operations and UI interactions

### E2E Tests

Location: `e2e/**/*.spec.ts`

End-to-end tests verify complete user workflows:

- **Quest Editor** (`e2e/quest-editor.spec.ts`): Tests the complete quest creation and editing workflow

## Test Configuration

### Vitest Configuration

File: `vitest.config.ts`

- **Environment**: jsdom (browser simulation)
- **Setup file**: `src/tests/setup.ts`
- **Coverage**: v8 provider with HTML, JSON, and text reporters
- **Path aliases**: Configured to match project aliases (@/, @mcquest/*)

### Playwright Configuration

File: `playwright.config.ts`

- **Browsers**: Chromium, Firefox, WebKit
- **Base URL**: `http://localhost:3001`
- **Screenshots**: Captured on failure
- **Traces**: Captured on first retry
- **Web server**: Automatically starts dev server

## Test Setup

The test setup file (`src/tests/setup.ts`) includes:

- **Cleanup**: Automatic cleanup after each test
- **Next.js Router**: Mocked navigation functions
- **Clerk Auth**: Mocked authentication for testing
- **Environment variables**: Test-specific configuration

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from './editor-store'

describe('EditorStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useEditorStore.setState({ /* initial state */ })
  })

  it('should add a quest', () => {
    const quest = createDefaultQuest(/* ... */)
    useEditorStore.getState().addQuest(quest)

    const state = useEditorStore.getState()
    expect(state.snapshot?.quests).toHaveLength(1)
  })
})
```

### Integration Test Example

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChapterPanel } from './chapter-panel'

it('should add a chapter', async () => {
  const user = userEvent.setup()
  render(<ChapterPanel />)

  await user.click(screen.getByRole('button', { name: /add/i }))

  expect(screen.getByText('Chapter 2')).toBeInTheDocument()
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test('should create a quest', async ({ page }) => {
  await page.goto('/dashboard')
  await page.getByRole('button', { name: /new quest/i }).click()

  await expect(page.getByText('New Quest')).toBeVisible()
})
```

## Coverage

To generate a coverage report:

```bash
pnpm --filter web test:coverage
```

Open the HTML report at `apps/web/coverage/index.html`

## CI/CD Integration

Tests are designed to run in CI environments:

- Vitest runs with `--run` flag (no watch mode)
- Playwright has retries enabled for flaky tests
- Screenshots and traces captured on failures for debugging

## Known Issues

Some tests may need adjustments for:

1. **ResizeObserver**: Add polyfill if needed for ScrollArea components
2. **Async operations**: Ensure proper waiting for state updates
3. **Authentication**: Clerk test mode or mocked auth required for E2E tests

## Test Data

Test utilities are available for creating test data:

- `createDefaultSnapshot()`: Create a test project snapshot
- `createDefaultQuest()`: Create a test quest
- `createDefaultChapter()`: Create a test chapter

These are exported from `@mcquest/schema`.

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Use `beforeEach` to reset state
3. **User perspective**: Test from the user's perspective, not implementation details
4. **Meaningful assertions**: Test behavior, not implementation
5. **Data attributes**: Use `data-testid` for stable element selection in E2E tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Playwright Documentation](https://playwright.dev/)
