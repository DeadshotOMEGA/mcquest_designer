import { test, expect } from '@playwright/test'

test.describe('Quest Editor', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')

    // Sign in (assuming test environment has auth bypass or test credentials)
    // If Clerk test mode is enabled, this should work
    await page.waitForLoadState('networkidle')
  })

  test('should create a new project and open editor', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Click "New Project" button
    await page.getByRole('button', { name: /new project/i }).click()

    // Fill in project details
    await page.getByLabel(/project name/i).fill('Test Quest Project')
    await page.getByLabel(/description/i).fill('A test project for E2E testing')

    // Submit form
    await page.getByRole('button', { name: /create/i }).click()

    // Should redirect to editor
    await expect(page).toHaveURL(/\/editor\//)

    // Verify editor loaded
    await expect(page.getByText('Test Quest Project')).toBeVisible()
    await expect(page.getByText('Chapters')).toBeVisible()
  })

  test('should add and delete chapters', async ({ page }) => {
    // Assuming we're already in the editor
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Get the first project and click it
    const firstProject = page.locator('[data-testid="project-card"]').first()
    await firstProject.click()

    await page.waitForLoadState('networkidle')

    // Count initial chapters
    const initialChapters = await page.locator('[data-testid="chapter-item"]').count()

    // Click add chapter button
    await page.getByRole('button', { name: /add new chapter/i }).click()

    // Verify new chapter was added
    await expect(page.locator('[data-testid="chapter-item"]')).toHaveCount(initialChapters + 1)

    // Verify the new chapter appears in the list
    await expect(page.getByText('Chapter 2')).toBeVisible()

    // Hover over the chapter and click delete
    await page.getByText('Chapter 2').hover()
    await page.getByRole('button', { name: /delete chapter/i }).first().click()

    // Confirm deletion in dialog
    await page.getByRole('button', { name: /^delete$/i }).click()

    // Verify chapter was deleted
    await expect(page.locator('[data-testid="chapter-item"]')).toHaveCount(initialChapters)
  })

  test('should create a new quest', async ({ page }) => {
    // Navigate to a project editor
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const firstProject = page.locator('[data-testid="project-card"]').first()
    await firstProject.click()

    await page.waitForLoadState('networkidle')

    // Click the floating "Add Quest" button
    await page.getByRole('button', { name: /add new quest/i }).click()

    // Verify quest inspector shows the new quest
    await expect(page.getByText('New Quest')).toBeVisible()

    // Verify the quest appears on the canvas
    await expect(page.locator('[data-testid="quest-node"]')).toBeVisible()
  })

  test('should edit quest details', async ({ page }) => {
    // Navigate to a project editor and create a quest
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const firstProject = page.locator('[data-testid="project-card"]').first()
    await firstProject.click()

    await page.waitForLoadState('networkidle')

    // Create a quest
    await page.getByRole('button', { name: /add new quest/i }).click()

    // Edit quest title
    const titleInput = page.getByLabel(/title/i)
    await titleInput.fill('My First Quest')
    await titleInput.blur()

    // Edit quest subtitle
    const subtitleInput = page.getByLabel(/subtitle/i)
    await subtitleInput.fill('An exciting adventure')
    await subtitleInput.blur()

    // Edit quest description
    const descriptionTextarea = page.getByLabel(/description/i)
    await descriptionTextarea.fill('This is a detailed description of the quest.')
    await descriptionTextarea.blur()

    // Wait for autosave
    await page.waitForTimeout(2000)

    // Verify changes persisted - reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Click on the quest node to select it
    await page.locator('[data-testid="quest-node"]').first().click()

    // Verify the edited values appear
    await expect(page.getByLabel(/title/i)).toHaveValue('My First Quest')
    await expect(page.getByLabel(/subtitle/i)).toHaveValue('An exciting adventure')
    await expect(page.getByLabel(/description/i)).toHaveValue(
      'This is a detailed description of the quest.'
    )
  })

  test('should delete a quest', async ({ page }) => {
    // Navigate to a project editor and create a quest
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const firstProject = page.locator('[data-testid="project-card"]').first()
    await firstProject.click()

    await page.waitForLoadState('networkidle')

    // Create a quest
    await page.getByRole('button', { name: /add new quest/i }).click()

    // Verify quest exists
    await expect(page.locator('[data-testid="quest-node"]')).toBeVisible()

    // Click delete button in inspector
    await page.getByRole('button', { name: /delete/i }).click()

    // Confirm deletion in dialog
    await page.getByRole('button', { name: /delete/i }).click()

    // Verify quest was deleted
    await expect(page.locator('[data-testid="quest-node"]')).not.toBeVisible()
    await expect(page.getByText('No quest selected')).toBeVisible()
  })

  test('should drag and reposition quest node', async ({ page }) => {
    // Navigate to a project editor and create a quest
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const firstProject = page.locator('[data-testid="project-card"]').first()
    await firstProject.click()

    await page.waitForLoadState('networkidle')

    // Create a quest
    await page.getByRole('button', { name: /add new quest/i }).click()

    // Get the quest node
    const questNode = page.locator('[data-testid="quest-node"]').first()

    // Get initial position
    const initialBox = await questNode.boundingBox()
    if (!initialBox) throw new Error('Quest node not found')

    // Drag the quest node
    await questNode.dragTo(questNode, {
      sourcePosition: { x: initialBox.width / 2, y: initialBox.height / 2 },
      targetPosition: { x: initialBox.width / 2 + 100, y: initialBox.height / 2 + 100 },
    })

    // Wait for position update
    await page.waitForTimeout(500)

    // Get new position
    const newBox = await questNode.boundingBox()
    if (!newBox) throw new Error('Quest node not found after drag')

    // Verify position changed
    expect(Math.abs(newBox.x - initialBox.x)).toBeGreaterThan(50)
    expect(Math.abs(newBox.y - initialBox.y)).toBeGreaterThan(50)
  })

  test('should show autosave indicator', async ({ page }) => {
    // Navigate to a project editor
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const firstProject = page.locator('[data-testid="project-card"]').first()
    await firstProject.click()

    await page.waitForLoadState('networkidle')

    // Create a quest
    await page.getByRole('button', { name: /add new quest/i }).click()

    // Look for sync indicator
    const syncIndicator = page.locator('[data-testid="sync-indicator"]')

    // Should show "saving" or "saved" state
    await expect(syncIndicator).toBeVisible()

    // Wait for save to complete
    await page.waitForTimeout(2000)

    // Should show "saved" state
    await expect(syncIndicator).toContainText(/saved/i)
  })

  test('should switch between chapters', async ({ page }) => {
    // Navigate to a project editor
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    const firstProject = page.locator('[data-testid="project-card"]').first()
    await firstProject.click()

    await page.waitForLoadState('networkidle')

    // Add a second chapter
    await page.getByRole('button', { name: /add new chapter/i }).click()

    // Click on Chapter 2
    await page.getByText('Chapter 2').click()

    // Verify Chapter 2 is active
    const chapter2 = page.getByText('Chapter 2').locator('..')
    await expect(chapter2).toHaveClass(/bg-accent/)

    // Create a quest in Chapter 2
    await page.getByRole('button', { name: /add new quest/i }).click()

    // Verify quest exists
    await expect(page.locator('[data-testid="quest-node"]')).toBeVisible()

    // Switch back to Chapter 1 (Main)
    await page.getByText('Main').click()

    // Verify no quests in Chapter 1
    await expect(page.locator('[data-testid="quest-node"]')).not.toBeVisible()
  })
})

export {}
