import { v4 as uuidv4 } from 'uuid'
import type { ProjectSnapshot, Chapter, Quest, Position } from './core'
import { SCHEMA_VERSION } from './core'

/**
 * Creates a default ProjectSnapshot with one empty chapter.
 */
export function createDefaultSnapshot(name: string): ProjectSnapshot {
  const now = new Date().toISOString()
  const chapterId = uuidv4()

  return {
    version: SCHEMA_VERSION,
    metadata: {
      projectName: name,
      targetMinecraftVersion: '1.21.1',
      createdAt: now,
      updatedAt: now,
    },
    chapters: [
      {
        id: chapterId,
        title: 'Getting Started',
        order: 0,
      },
    ],
    quests: [],
    dependencies: [],
    uiState: {
      activeChapterId: chapterId,
      viewportByChapter: {
        [chapterId]: { x: 0, y: 0, zoom: 1 },
      },
    },
  }
}

/**
 * Creates a new chapter with the specified title and order.
 */
export function createDefaultChapter(title: string, order: number): Chapter {
  return {
    id: uuidv4(),
    title,
    order,
  }
}

/**
 * Creates a new quest in the specified chapter at the given position.
 */
export function createDefaultQuest(chapterId: string, title: string, position: Position): Quest {
  return {
    id: uuidv4(),
    chapterId,
    title,
    position,
    size: 1,
    shape: 'square',
    tasks: [],
    rewards: [],
    settings: {
      optional: false,
      hidden: 'false',
      repeatable: false,
      canRepeat: false,
      hideUntilDeps: false,
    },
  }
}
