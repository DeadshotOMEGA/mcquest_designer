import { BasePage } from './base-page'

/**
 * EditorPage - Quest graph editor page object
 *
 * Handles React Flow canvas interactions, quest node manipulation,
 * and inspector panel interactions.
 *
 * Common failures:
 * - "Quest node not visible": Check autosave timing, wait for render
 * - "Inspector not updated": Verify React Flow event propagation
 * - "Drag failed": Ensure React Flow viewport is stable
 */
export class EditorPage extends BasePage {
  // Locators
  get addQuestButton() {
    return this.page.getByRole('button', { name: /add new quest/i })
  }

  get questNodes() {
    return this.getByTestId('quest-node')
  }

  get questTitleInput() {
    return this.page.getByLabel(/title/i)
  }

  get questSubtitleInput() {
    return this.page.getByLabel(/subtitle/i)
  }

  get questDescriptionInput() {
    return this.page.getByLabel(/description/i)
  }

  get deleteQuestButton() {
    return this.page.getByRole('button', { name: /delete quest/i })
  }

  get confirmDeleteButton() {
    return this.page.getByRole('button', { name: /^delete$/i })
  }

  get inspector() {
    return this.getByTestId('quest-inspector')
  }

  get canvas() {
    return this.getByTestId('react-flow-canvas')
  }

  get autoArrangeButton() {
    return this.page.getByRole('button', { name: /auto-arrange quests/i })
  }

  get undoButton() {
    return this.page.getByRole('button', { name: /undo/i })
  }

  get redoButton() {
    return this.page.getByRole('button', { name: /redo/i })
  }

  get compactQuestNodes() {
    // React Flow renders nodes with data-type attribute
    return this.page.locator('.react-flow__node[data-type="compact-quest-node"]')
  }

  get questDetailsModal() {
    return this.page.getByRole('dialog')
  }

  get modalCloseButton() {
    return this.page.getByRole('button', { name: /close/i })
  }

  // Actions
  async navigateToEditor(projectId: string) {
    await this.navigate(`/editor/${projectId}`)
  }

  async addQuest() {
    await this.addQuestButton.click()
    // Wait for node to render
    await this.page.waitForTimeout(500)
  }

  async selectQuest(title: string) {
    await this.questNodes.filter({ hasText: title }).first().click()
    // Wait for inspector to open
    await this.page.waitForTimeout(300)
  }

  async editQuest(data: {
    title?: string
    subtitle?: string
    description?: string
  }) {
    if (data.title) {
      await this.questTitleInput.fill(data.title)
      await this.questTitleInput.blur()
    }
    if (data.subtitle) {
      await this.questSubtitleInput.fill(data.subtitle)
      await this.questSubtitleInput.blur()
    }
    if (data.description) {
      await this.questDescriptionInput.fill(data.description)
      await this.questDescriptionInput.blur()
    }
    // Wait for autosave
    await this.page.waitForTimeout(1000)
  }

  async deleteQuest() {
    await this.deleteQuestButton.click()
    await this.confirmDeleteButton.click()
    // Wait for deletion to complete
    await this.page.waitForTimeout(500)
  }

  async dragNode(fromX: number, fromY: number, toX: number, toY: number) {
    const node = this.questNodes.first()
    await node.dragTo(node, {
      sourcePosition: { x: fromX, y: fromY },
      targetPosition: { x: toX, y: toY },
    })
  }

  async getQuestCount(): Promise<number> {
    return await this.questNodes.count()
  }

  async clickCompactNode(index: number = 0) {
    const node = this.compactQuestNodes.nth(index)
    await node.waitFor({ state: 'visible' })
    // Click the button inside the node (the compact node renders a button element)
    const button = node.locator('button').first()
    await button.click()
    // Wait for modal animation
    await this.page.waitForTimeout(300)
  }

  async clickAutoArrange() {
    await this.autoArrangeButton.click()
    // Wait for dialog
    await this.page.waitForTimeout(200)
    // Click confirm button in dialog
    const confirmButton = this.page.getByRole('button', { name: /arrange/i })
    await confirmButton.click()
    // Wait for layout calculation
    await this.page.waitForTimeout(500)
  }

  async verifyCompactNodesVisible(expectedCount: number) {
    await this.compactQuestNodes.first().waitFor({ state: 'visible', timeout: 5000 })
    const count = await this.compactQuestNodes.count()
    return count === expectedCount
  }

  async verifyModalOpen() {
    await this.questDetailsModal.waitFor({ state: 'visible', timeout: 3000 })
    return await this.questDetailsModal.isVisible()
  }

  async closeModal() {
    await this.modalCloseButton.click()
    await this.questDetailsModal.waitFor({ state: 'hidden' })
  }
}
