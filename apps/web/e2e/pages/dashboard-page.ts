import { BasePage } from './base-page'

/**
 * DashboardPage - Project management page object
 *
 * Handles project listing, creation, opening, and deletion.
 *
 * Common failures:
 * - "Project card not found": Check project creation API response
 * - "Delete confirmation not visible": Verify modal rendering
 */
export class DashboardPage extends BasePage {
  // Locators
  get newProjectButton() {
    return this.page.getByRole('button', { name: /new project/i })
  }

  get projectNameInput() {
    return this.page.getByLabel(/project name/i)
  }

  get projectDescriptionInput() {
    return this.page.getByLabel(/description/i)
  }

  get createButton() {
    return this.page.getByRole('button', { name: /create/i })
  }

  getProjectCard(name: string) {
    // Use .first() to handle cases where multiple projects with same name exist
    return this.getByTestId('project-card').filter({ hasText: name }).first()
  }

  // Actions
  async navigateToDashboard() {
    await this.navigate('/dashboard')
  }

  async createProject(name: string, description: string = '') {
    // Wait for network to be idle (ensures React is hydrated)
    await this.waitForNetworkIdle()

    // Close any existing dialogs first (cleanup from previous operations)
    const escapeAttempts = 3
    for (let i = 0; i < escapeAttempts; i++) {
      await this.page.keyboard.press('Escape')
      await this.page.waitForTimeout(100)
    }

    // Wait for button to be visible and enabled
    await this.newProjectButton.waitFor({ state: 'visible' })
    await this.page.waitForTimeout(500) // Allow any animations to complete

    // Click to open dialog
    await this.newProjectButton.click()

    // Wait for dialog to open
    await this.projectNameInput.waitFor({ state: 'visible', timeout: 10000 })

    // Fill in the form
    await this.projectNameInput.fill(name)
    if (description) {
      await this.projectDescriptionInput.fill(description)
    }

    // Submit and wait for completion
    await this.createButton.click()
    await this.waitForNetworkIdle()

    // Ensure dialog is fully closed before returning
    await this.projectNameInput.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
  }

  async openProject(name: string) {
    // Click the card directly (now clickable with cursor-pointer)
    const card = this.getProjectCard(name)
    await card.click()
    await this.waitForNetworkIdle()
  }

  async deleteProject(name: string) {
    const card = this.getProjectCard(name)

    // Click the dropdown menu button (MoreVertical icon)
    const menuButton = card.getByRole('button', { name: /project actions/i })
    await menuButton.click()

    // Click the Delete Project menu item
    await this.page.getByRole('menuitem', { name: /delete project/i }).click()

    // Confirm deletion in AlertDialog
    await this.page.getByRole('button', { name: /^delete$/i }).click()
    await this.waitForNetworkIdle()
  }

  async getProjectList() {
    return await this.getByTestId('project-card').all()
  }
}
