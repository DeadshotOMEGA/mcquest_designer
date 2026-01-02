import { expect } from '@playwright/test'
import { BasePage } from './base-page'

/**
 * AuthPage - Clerk authentication page object
 *
 * Handles sign in, sign up, and sign out flows.
 *
 * Common failures:
 * - "Sign in button not found": Check Clerk component rendering
 * - "Session not persisted": Verify cookie storage settings
 */
export class AuthPage extends BasePage {
  // Locators
  get signInButton() {
    return this.page.getByRole('button', { name: /sign in/i })
  }

  get emailInput() {
    return this.page.getByRole('textbox', { name: /email/i })
  }

  get passwordInput() {
    return this.page.getByRole('textbox', { name: /password/i })
  }

  get submitButton() {
    return this.page.getByRole('button', { name: /continue/i })
  }

  // Clerk UserButton (avatar/profile button)
  // Try multiple selectors as Clerk's implementation may vary
  get userButton() {
    return this.page.locator('button[aria-label*="user" i], button[aria-label*="profile" i], .cl-userButtonTrigger, [data-clerk-user-button-trigger]').first()
  }

  get signOutMenuItem() {
    return this.page.getByRole('menuitem', { name: /sign out/i })
  }

  // Actions
  async navigateToSignIn() {
    await this.navigate('/sign-in')
  }

  async navigateToSignUp() {
    await this.navigate('/sign-up')
  }

  async signIn(email: string, password: string) {
    await this.navigateToSignIn()

    // Wait for page to be fully loaded
    await this.page.waitForLoadState('networkidle', { timeout: 30000 })

    // Wait for Clerk component to load with extended timeout
    // Clerk can take time to initialize, especially in CI environments
    await this.page.waitForSelector('[data-clerk-component="SignIn"]', {
      timeout: 90000,
    })

    // Wait for form inputs to be visible and ready
    await this.emailInput.waitFor({ state: 'visible', timeout: 15000 })

    // Fill form fields
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)

    // Click submit and wait for navigation to dashboard
    await Promise.all([
      this.page.waitForURL('**/dashboard', { timeout: 90000 }),
      this.submitButton.click(),
    ])

    // Wait for dashboard to fully load
    await this.page.waitForLoadState('networkidle', { timeout: 90000 })
    await this.page.waitForLoadState('domcontentloaded', { timeout: 90000 })

    // Give Clerk time to set up the session
    await this.page.waitForTimeout(9000)
  }

  async signOut() {
    // Click the Clerk UserButton to open the menu
    await this.userButton.click()
    // Click the sign out menu item
    await this.signOutMenuItem.click()
    await this.waitForNetworkIdle()
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      // Check if the Clerk UserButton is visible (indicates signed in)
      await expect(this.userButton).toBeVisible({ timeout: 10000 })
      return true
    } catch {
      return false
    }
  }
}
