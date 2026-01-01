import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * E2E Test: SNBT Import Workflow (T6.1)
 *
 * Tests the complete import pipeline:
 * 1. Navigate to import page
 * 2. Upload SNBT files (drag-and-drop or file picker)
 * 3. Preview imported snapshot with validation
 * 4. Confirm import
 * 5. Verify quests appear in editor with correct data
 */

test.describe('SNBT Import Workflow', () => {
  let projectId: string

  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Create a test project for import testing
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Click "New Project" button
    await page.getByRole('button', { name: /new project/i }).click()

    // Fill in project details
    await page.getByLabel(/project name/i).fill('Import Test Project')
    await page.getByLabel(/description/i).fill('Testing SNBT import workflow')

    // Submit form
    await page.getByRole('button', { name: /create/i }).click()

    // Wait for redirect to editor and extract project ID from URL
    await expect(page).toHaveURL(/\/editor\/(.+)/)
    const url = page.url()
    const match = url.match(/\/editor\/(.+)/)
    if (match) {
      projectId = match[1]
    }

    await page.waitForLoadState('networkidle')
  })

  test('should navigate to import page from editor', async ({ page }) => {
    // Verify we're on the editor page
    await expect(page).toHaveURL(/\/editor\//)

    // Click Import button in editor header
    await page.getByRole('button', { name: /import/i }).click()

    // Should navigate to import page
    await expect(page).toHaveURL(new RegExp(`/dashboard/projects/${projectId}/import`))

    // Verify import page elements are visible
    await expect(page.getByText(/import questbook/i)).toBeVisible()
    await expect(page.getByText(/upload.*snbt.*files/i)).toBeVisible()
  })

  test('should navigate to import page from project card', async ({ page }) => {
    // Navigate back to dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Find the project card we created
    const projectCard = page.getByText('Import Test Project').locator('..')

    // Click Import button on the project card
    await projectCard.getByRole('button', { name: /import/i }).click()

    // Should navigate to import page
    await expect(page).toHaveURL(new RegExp(`/dashboard/projects/${projectId}/import`))

    // Verify import page loaded
    await expect(page.getByText(/import questbook/i)).toBeVisible()
  })

  test('should upload and preview simple SNBT file', async ({ page }) => {
    // Navigate to import page
    await page.goto(`/dashboard/projects/${projectId}/import`)
    await page.waitForLoadState('networkidle')

    // Prepare a simple test SNBT file
    const simpleSNBT = `{
\tfilename: "test_chapter"
\tid: "12345678"
\torder_index: 0
\ticon: { id: "minecraft:book" }
\tquests: [
\t\t{
\t\t\tid: "ABCDEF01"
\t\t\tx: 0.0d
\t\t\ty: 0.0d
\t\t\ticon: { id: "minecraft:diamond" }
\t\t\ttasks: [
\t\t\t\t{
\t\t\t\t\tid: "TASK0001"
\t\t\t\t\ttype: "item"
\t\t\t\t\titem: { id: "minecraft:diamond" }
\t\t\t\t\tcount: 1L
\t\t\t\t}
\t\t\t]
\t\t}
\t]
}`

    // Create a File object from the SNBT content
    const file = new File([simpleSNBT], 'chapter-test.snbt', { type: 'text/plain' })

    // Find the file input and upload
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'chapter-test.snbt',
      mimeType: 'text/plain',
      buffer: Buffer.from(simpleSNBT),
    })

    // Wait for file to be parsed
    await page.waitForTimeout(1000)

    // Verify preview shows the imported data
    await expect(page.getByText(/preview/i)).toBeVisible()
    await expect(page.getByText(/1.*chapter/i)).toBeVisible()
    await expect(page.getByText(/1.*quest/i)).toBeVisible()

    // Verify chapter details in preview
    await expect(page.getByText('test_chapter')).toBeVisible()

    // Look for validation status
    const validationStatus = page.locator('[data-testid="validation-status"]')
    await expect(validationStatus).toContainText(/valid|success/i)
  })

  test('should complete full import workflow and verify in editor', async ({ page }) => {
    // Navigate to import page
    await page.goto(`/dashboard/projects/${projectId}/import`)
    await page.waitForLoadState('networkidle')

    // Use the fixture file from the test suite
    const fixturePath = join(
      process.cwd(),
      '../../packages/snbt/tests/fixtures/chapter-the-beginning.snbt'
    )
    const fixtureContent = readFileSync(fixturePath, 'utf-8')

    // Upload the fixture file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'chapter-the-beginning.snbt',
      mimeType: 'text/plain',
      buffer: Buffer.from(fixtureContent),
    })

    // Wait for parsing
    await page.waitForTimeout(1500)

    // Verify preview shows correct counts
    await expect(page.getByText(/1.*chapter/i)).toBeVisible()
    await expect(page.getByText(/4.*quests/i)).toBeVisible() // The fixture has 4 quests

    // Click confirm/import button
    await page.getByRole('button', { name: /confirm|import/i }).click()

    // Should redirect to editor after import
    await expect(page).toHaveURL(new RegExp(`/editor/${projectId}`))
    await page.waitForLoadState('networkidle')

    // Verify chapter was imported
    await expect(page.getByText('The Beginning')).toBeVisible() // Chapter title from lang file

    // Verify quests appear on canvas
    const questNodes = page.locator('[data-testid="quest-node"]')
    await expect(questNodes).toHaveCount(4)

    // Click on first quest to verify details
    await questNodes.first().click()

    // Verify quest inspector shows imported quest data
    await expect(page.getByLabel(/title/i)).toBeVisible()

    // Verify tasks were imported
    await expect(page.getByText(/tasks/i)).toBeVisible()

    // Verify rewards were imported
    await expect(page.getByText(/rewards/i)).toBeVisible()
  })

  test('should show validation warnings for problematic SNBT', async ({ page }) => {
    // Navigate to import page
    await page.goto(`/dashboard/projects/${projectId}/import`)
    await page.waitForLoadState('networkidle')

    // Create invalid SNBT (missing required fields)
    const invalidSNBT = `{
\tfilename: "broken_chapter"
\tquests: [
\t\t{
\t\t\tx: 0.0d
\t\t\ty: 0.0d
\t\t}
\t]
}`

    // Upload invalid file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'broken-chapter.snbt',
      mimeType: 'text/plain',
      buffer: Buffer.from(invalidSNBT),
    })

    // Wait for parsing
    await page.waitForTimeout(1000)

    // Verify validation warnings appear
    const warnings = page.locator('[data-testid="validation-warning"]')
    await expect(warnings).toBeVisible()

    // Verify warning message mentions missing fields
    await expect(page.getByText(/missing|required|invalid/i)).toBeVisible()
  })

  test('should handle multiple file upload', async ({ page }) => {
    // Navigate to import page
    await page.goto(`/dashboard/projects/${projectId}/import`)
    await page.waitForLoadState('networkidle')

    // Create two chapter files
    const chapter1SNBT = `{
\tfilename: "chapter_one"
\tid: "11111111"
\torder_index: 0
\ticon: { id: "minecraft:book" }
\tquests: []
}`

    const chapter2SNBT = `{
\tfilename: "chapter_two"
\tid: "22222222"
\torder_index: 1
\ticon: { id: "minecraft:enchanted_book" }
\tquests: []
}`

    // Upload both files
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles([
      {
        name: 'chapter-one.snbt',
        mimeType: 'text/plain',
        buffer: Buffer.from(chapter1SNBT),
      },
      {
        name: 'chapter-two.snbt',
        mimeType: 'text/plain',
        buffer: Buffer.from(chapter2SNBT),
      },
    ])

    // Wait for parsing
    await page.waitForTimeout(1500)

    // Verify preview shows both chapters
    await expect(page.getByText(/2.*chapters/i)).toBeVisible()

    // Verify both chapter names appear
    await expect(page.getByText('chapter_one')).toBeVisible()
    await expect(page.getByText('chapter_two')).toBeVisible()
  })

  test('should allow canceling import and returning to dashboard', async ({ page }) => {
    // Navigate to import page
    await page.goto(`/dashboard/projects/${projectId}/import`)
    await page.waitForLoadState('networkidle')

    // Look for cancel/back button
    const cancelButton = page.getByRole('button', { name: /cancel|back/i })
    await cancelButton.click()

    // Should navigate back to dashboard
    await expect(page).toHaveURL(/\/dashboard/)

    // Verify project still exists and wasn't modified
    await expect(page.getByText('Import Test Project')).toBeVisible()
  })

  test('should preserve existing quests when importing (merge mode)', async ({ page }) => {
    // First, create a quest in the project
    await page.goto(`/editor/${projectId}`)
    await page.waitForLoadState('networkidle')

    // Create a quest
    await page.getByRole('button', { name: /add new quest/i }).click()
    await page.getByLabel(/title/i).fill('Existing Quest')
    await page.getByLabel(/title/i).blur()

    // Wait for save
    await page.waitForTimeout(2000)

    // Verify quest exists
    await expect(page.locator('[data-testid="quest-node"]')).toHaveCount(1)

    // Now import SNBT
    await page.goto(`/dashboard/projects/${projectId}/import`)
    await page.waitForLoadState('networkidle')

    // Upload a simple chapter
    const simpleSNBT = `{
\tfilename: "imported_chapter"
\tid: "99999999"
\torder_index: 1
\ticon: { id: "minecraft:compass" }
\tquests: [
\t\t{
\t\t\tid: "IMPORT01"
\t\t\tx: 5.0d
\t\t\ty: 0.0d
\t\t\ticon: { id: "minecraft:emerald" }
\t\t}
\t]
}`

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'imported-chapter.snbt',
      mimeType: 'text/plain',
      buffer: Buffer.from(simpleSNBT),
    })

    await page.waitForTimeout(1000)

    // Confirm import
    await page.getByRole('button', { name: /confirm|import/i }).click()

    // Go back to editor
    await expect(page).toHaveURL(new RegExp(`/editor/${projectId}`))
    await page.waitForLoadState('networkidle')

    // Verify we now have 2 chapters (Main + imported_chapter)
    const chapterItems = page.locator('[data-testid="chapter-item"]')
    await expect(chapterItems).toHaveCount(2)

    // Switch to first chapter (Main) and verify existing quest is still there
    await page.getByText('Main').click()
    await expect(page.locator('[data-testid="quest-node"]')).toHaveCount(1)
    await expect(page.getByText('Existing Quest')).toBeVisible()

    // Switch to imported chapter and verify imported quest
    await page.getByText('imported_chapter').click()
    await expect(page.locator('[data-testid="quest-node"]')).toHaveCount(1)
  })
})

export {}
