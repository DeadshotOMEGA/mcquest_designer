/**
 * CRUD Operations Tests
 *
 * Tests project creation, editing, and deletion.
 *
 * Test Data: Uses buildProject() test data builder
 * Auth: Requires authenticated user (via fixture)
 * Database: Requires clean database (via fixture)
 *
 * Common Failures:
 * - "Project not created": Check API response, database connection
 * - "Project card not visible": Verify dashboard rendering
 */

import { test, expect } from '../fixtures/auth'
import { DashboardPage } from '../pages/dashboard-page'
import { buildProject } from '../builders/project'

test.describe('CRUD Operations', () => {
  let dashboard: DashboardPage

  test.beforeEach(async ({ authenticatedPage }) => {
    dashboard = new DashboardPage(authenticatedPage)
    await dashboard.navigateToDashboard()
  })

  test('should create a new project', async () => {
    const projectData = buildProject({ name: 'My Test Project' })

    await dashboard.createProject(projectData.name, projectData.description)

    // Verify project appears in dashboard
    const projectCard = dashboard.getProjectCard(projectData.name)
    await expect(projectCard).toBeVisible()
  })

  test('should delete a project', async () => {
    const projectData = buildProject({ name: 'Project to Delete' })

    // Create project first
    await dashboard.createProject(projectData.name, projectData.description)
    await expect(dashboard.getProjectCard(projectData.name)).toBeVisible()

    // Delete project
    await dashboard.deleteProject(projectData.name)

    // Verify project is removed from dashboard
    await expect(dashboard.getProjectCard(projectData.name)).not.toBeVisible()
  })

  test('should open project editor', async ({ authenticatedPage }) => {
    const projectData = buildProject({ name: 'Project to Open' })

    await dashboard.createProject(projectData.name, projectData.description)
    await dashboard.openProject(projectData.name)

    // Verify redirected to editor
    await expect(authenticatedPage).toHaveURL(/\/editor\//)
  })
})
