import { Page, Locator } from '@playwright/test'

/**
 * Base Page Object
 *
 * Common functionality for all page objects.
 * Provides navigation, waiting, and utility methods.
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigate to a path and wait for DOM content to load
   */
  async navigate(path: string) {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' })
    await this.waitForPageLoad()
  }

  /**
   * Wait for DOM content to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded')
  }

  /**
   * Wait for network activity to settle
   * Use sparingly - prefer specific element visibility
   */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Take a screenshot for debugging
   */
  async screenshot(name: string) {
    return await this.page.screenshot({
      path: `screenshots/${name}.png`,
      fullPage: true
    })
  }

  /**
   * Get element by data-testid attribute
   */
  getByTestId(testId: string): Locator {
    return this.page.locator(`[data-testid="${testId}"]`)
  }
}
