import { test as base, type Page } from '@playwright/test'
import { AuthPage } from '../pages/auth-page'

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'e2e-test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
}

type AuthFixtures = {
  authenticatedPage: Page
}

/**
 * Auth fixture - provides authenticated page context
 *
 * When DISABLE_AUTH=true, skips Clerk authentication and goes directly to dashboard.
 * Otherwise, performs full sign-in/sign-out flow.
 *
 * Usage:
 * ```ts
 * test('my test', async ({ authenticatedPage }) => {
 *   // Page is already authenticated (or auth is bypassed)
 *   await authenticatedPage.goto('/dashboard')
 * })
 * ```
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    const isAuthDisabled = process.env.DISABLE_AUTH === 'true'

    if (isAuthDisabled) {
      // Auth is disabled - just navigate to dashboard directly
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      await use(page)
      // No sign-out needed when auth is disabled
    } else {
      // Normal auth flow
      const authPage = new AuthPage(page)
      await authPage.signIn(TEST_USER.email, TEST_USER.password)
      await use(page)
      await authPage.signOut()
    }
  },
})

export { expect } from '@playwright/test'
