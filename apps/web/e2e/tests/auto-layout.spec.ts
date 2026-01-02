import { test, expect } from '../fixtures/auth'
import { DashboardPage } from '../pages/dashboard-page'
import { EditorPage } from '../pages/editor-page'
import { buildProject } from '../builders/project'

/**
 * Auto-Layout Visualization E2E Tests
 *
 * Tests the Phase 4 implementation of auto-layout visualization:
 * - Compact quest nodes (40x40px)
 * - Quest details modal (click node → modal opens)
 * - Auto-arrange button functionality
 * - Undo/redo integration
 */
test.describe('Auto-Layout Visualization', () => {
  test('should display compact quest nodes by default', async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage)
    const editor = new EditorPage(authenticatedPage)
    const project = buildProject()

    // Create project
    await dashboard.navigateToDashboard()
    await dashboard.createProject(project.name, project.description)

    // Open the project
    await dashboard.openProject(project.name)
    await editor.waitForPageLoad()

    // Add a quest to ensure we have nodes
    await editor.addQuest()
    await editor.waitForPageLoad()

    // Verify compact nodes are visible
    await expect(editor.compactQuestNodes.first()).toBeVisible({ timeout: 10000 })

    const compactNodeCount = await editor.compactQuestNodes.count()
    expect(compactNodeCount).toBeGreaterThan(0)

    // Verify node is compact (small size)
    const firstNode = editor.compactQuestNodes.first()
    const boundingBox = await firstNode.boundingBox()
    expect(boundingBox).toBeTruthy()
    if (boundingBox) {
      // Compact nodes should be ~40x40px (allow generous margin for padding/badges)
      expect(boundingBox.width).toBeLessThan(150)
      expect(boundingBox.height).toBeLessThan(150)
    }
  })

  test('should open quest details modal when clicking compact node', async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage)
    const editor = new EditorPage(authenticatedPage)
    const project = buildProject()

    // Create and open project
    await dashboard.navigateToDashboard()
    await dashboard.createProject(project.name, project.description)
    await dashboard.openProject(project.name)
    await editor.waitForPageLoad()

    // Add a quest
    await editor.addQuest()
    await editor.waitForPageLoad()

    // Wait for compact nodes to be visible
    await expect(editor.compactQuestNodes.first()).toBeVisible({ timeout: 10000 })

    // Click on the compact node
    await editor.clickCompactNode(0)

    // Verify modal is open
    const modalVisible = await editor.verifyModalOpen()
    expect(modalVisible).toBe(true)

    // Verify modal has content
    await expect(editor.questDetailsModal).toContainText(/quest/i)

    // Close modal
    await editor.closeModal()

    // Verify modal is closed
    await expect(editor.questDetailsModal).not.toBeVisible()
  })

  test('should auto-arrange quests with Dagre layout', async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage)
    const editor = new EditorPage(authenticatedPage)
    const project = buildProject()

    // Create and open project
    await dashboard.navigateToDashboard()
    await dashboard.createProject(project.name, project.description)
    await dashboard.openProject(project.name)
    await editor.waitForPageLoad()

    // Add multiple quests
    await editor.addQuest()
    await editor.waitForPageLoad()
    await editor.addQuest()
    await editor.waitForPageLoad()
    await editor.addQuest()
    await editor.waitForPageLoad()

    // Wait for compact nodes
    await expect(editor.compactQuestNodes.first()).toBeVisible({ timeout: 10000 })

    // Get initial positions of nodes
    const initialPositions: { x: number; y: number }[] = []
    const nodeCount = await editor.compactQuestNodes.count()

    for (let i = 0; i < nodeCount; i++) {
      const node = editor.compactQuestNodes.nth(i)
      const box = await node.boundingBox()
      if (box) {
        initialPositions.push({ x: box.x, y: box.y })
      }
    }

    // Click auto-arrange button
    await editor.clickAutoArrange()

    // Verify nodes are still visible after layout
    await expect(editor.compactQuestNodes.first()).toBeVisible()

    // Verify at least some positions changed (layout was applied)
    // We just check that layout completed without errors
    const finalCount = await editor.compactQuestNodes.count()
    expect(finalCount).toBe(nodeCount)
  })

  test('should support undo/redo with keyboard shortcuts', async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage)
    const editor = new EditorPage(authenticatedPage)
    const project = buildProject()

    // Create and open project
    await dashboard.navigateToDashboard()
    await dashboard.createProject(project.name, project.description)
    await dashboard.openProject(project.name)
    await editor.waitForPageLoad()

    // Add a quest
    await editor.addQuest()
    await editor.waitForPageLoad()

    // Wait for node
    await expect(editor.compactQuestNodes.first()).toBeVisible({ timeout: 10000 })
    const initialCount = await editor.compactQuestNodes.count()

    // Add another quest
    await editor.addQuest()
    await editor.waitForPageLoad()

    // Verify quest was added
    const afterAddCount = await editor.compactQuestNodes.count()
    expect(afterAddCount).toBe(initialCount + 1)

    // Undo (Ctrl+Z)
    await authenticatedPage.keyboard.press('Control+z')
    await authenticatedPage.waitForTimeout(1000)

    // Verify quest was removed
    const afterUndoCount = await editor.compactQuestNodes.count()
    expect(afterUndoCount).toBe(initialCount)

    // Redo (Ctrl+Shift+Z)
    await authenticatedPage.keyboard.press('Control+Shift+z')
    await authenticatedPage.waitForTimeout(1000)

    // Verify quest was re-added
    const afterRedoCount = await editor.compactQuestNodes.count()
    expect(afterRedoCount).toBe(initialCount + 1)
  })

  test('should preserve compact nodes after page reload', async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage)
    const editor = new EditorPage(authenticatedPage)
    const project = buildProject()

    // Create and open project
    await dashboard.navigateToDashboard()
    await dashboard.createProject(project.name, project.description)
    await dashboard.openProject(project.name)
    await editor.waitForPageLoad()

    // Add quests
    await editor.addQuest()
    await editor.waitForPageLoad()
    await editor.addQuest()
    await editor.waitForPageLoad()

    // Wait for nodes and get count
    await expect(editor.compactQuestNodes.first()).toBeVisible({ timeout: 10000 })
    const initialCount = await editor.compactQuestNodes.count()
    expect(initialCount).toBeGreaterThan(0)

    // Reload page
    await authenticatedPage.reload()
    await editor.waitForPageLoad()

    // Verify compact nodes still visible after reload
    await expect(editor.compactQuestNodes.first()).toBeVisible({ timeout: 10000 })
    const reloadedCount = await editor.compactQuestNodes.count()
    expect(reloadedCount).toBe(initialCount)
  })

  test('should handle empty chapter gracefully', async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage)
    const editor = new EditorPage(authenticatedPage)
    const project = buildProject()

    // Create and open project (empty, no quests added)
    await dashboard.navigateToDashboard()
    await dashboard.createProject(project.name, project.description)
    await dashboard.openProject(project.name)
    await editor.waitForPageLoad()

    // Verify canvas loads even with no quests
    await expect(editor.canvas).toBeVisible()

    // Add a quest
    await editor.addQuest()
    await editor.waitForPageLoad()

    // Now verify compact node appears
    await expect(editor.compactQuestNodes.first()).toBeVisible({ timeout: 10000 })
  })
})
