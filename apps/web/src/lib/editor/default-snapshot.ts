import type { ProjectSnapshot } from '@mcquest/schema'
import { SCHEMA_VERSION } from '@mcquest/schema'

/**
 * Creates a default empty snapshot for new projects
 *
 * Includes:
 * - 1 default chapter ("Main")
 * - 0 quests
 * - 0 dependencies
 * - Initialized metadata with current timestamps
 */
export function createDefaultSnapshot(projectName: string): ProjectSnapshot {
  const now = new Date().toISOString()
  const defaultChapterId = crypto.randomUUID()

  return {
    version: SCHEMA_VERSION,
    metadata: {
      projectName,
      targetMinecraftVersion: '1.21.1',
      createdAt: now,
      updatedAt: now,
    },
    chapters: [
      {
        id: defaultChapterId,
        title: 'Main',
        order: 0,
        description: 'Default chapter',
      },
    ],
    quests: [],
    dependencies: [],
    uiState: {
      activeChapterId: defaultChapterId,
      selectedQuestId: undefined,
      viewportByChapter: {},
    },
  }
}
