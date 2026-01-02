/**
 * Project test data builder
 *
 * Generates valid project data with sensible defaults
 * that can be overridden for specific test cases.
 */

export interface ProjectData {
  name: string
  description?: string
}

export const buildProject = (overrides: Partial<ProjectData> = {}): ProjectData => ({
  name: `Test Project ${Date.now()}`,
  description: 'E2E test project',
  ...overrides,
})

/**
 * Build multiple projects with sequential naming
 */
export const buildProjects = (count: number): ProjectData[] => {
  const timestamp = Date.now()
  return Array.from({ length: count }, (_, i) => ({
    name: `Test Project ${timestamp}-${i + 1}`,
    description: `E2E test project ${i + 1}`,
  }))
}

// Re-export quest builder for convenience
export { buildQuest, buildQuests, type QuestData } from './quest'
