/**
 * Quest test data builder
 *
 * Generates valid quest data with sensible defaults
 * that can be overridden for specific test cases.
 */

export interface QuestData {
  title: string
  subtitle?: string
  description?: string
  x?: number
  y?: number
}

export const buildQuest = (overrides: Partial<QuestData> = {}): QuestData => ({
  title: `Test Quest ${Date.now()}`,
  subtitle: 'Test subtitle',
  description: 'Test quest description',
  x: 0,
  y: 0,
  ...overrides,
})

/**
 * Build multiple quests with sequential naming
 */
export const buildQuests = (count: number): QuestData[] => {
  const timestamp = Date.now()
  return Array.from({ length: count }, (_, i) => ({
    title: `Test Quest ${timestamp}-${i + 1}`,
    subtitle: `Subtitle ${i + 1}`,
    description: `Description for quest ${i + 1}`,
    x: i * 300,
    y: Math.floor(i / 3) * 200,
  }))
}
