import type { ProjectSnapshot, Quest, Dependency, Chapter } from '@mcquest/schema'

/**
 * Maximum number of undo/redo history entries to keep
 */
export const MAX_HISTORY_SIZE = 50

/**
 * History state for undo/redo functionality
 *
 * Stores snapshot arrays for time-travel navigation.
 * Per 50_frontend_rules.md: snapshot-based undo/redo for v1.
 */
export interface HistoryState {
  /**
   * Stack of previous snapshots for undo operations
   * Most recent at the end (push/pop from end)
   */
  undoStack: ProjectSnapshot[]

  /**
   * Stack of snapshots for redo operations
   * Cleared when new changes are made
   */
  redoStack: ProjectSnapshot[]
}

/**
 * Sync status for autosave operations
 */
export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Sync state for tracking autosave status
 */
export interface SyncState {
  status: SyncStatus
  lastSavedAt?: Date
  error?: string
}

/**
 * Selection state for the editor
 */
export interface SelectionState {
  /**
   * Currently selected quest ID (null if none)
   */
  selectedQuestId: string | null

  /**
   * Currently active chapter ID
   */
  selectedChapterId: string | null
}

/**
 * Editor store state
 *
 * Contains the working copy of the project snapshot and UI state.
 */
export interface EditorState {
  /**
   * Current project ID being edited
   */
  projectId: string | null

  /**
   * Working copy of the project snapshot
   * This is the source of truth for the editor
   */
  snapshot: ProjectSnapshot | null

  /**
   * Whether the snapshot has unsaved changes
   */
  isDirty: boolean

  /**
   * Current sync status for autosave
   */
  syncState: SyncState

  /**
   * Current selection state
   */
  selection: SelectionState

  /**
   * Undo/redo history state
   */
  history: HistoryState
}

/**
 * Partial quest update - allows updating specific fields
 */
export type QuestUpdate = Partial<Omit<Quest, 'id' | 'chapterId'>>

/**
 * Partial chapter update - allows updating specific fields
 */
export type ChapterUpdate = Partial<Omit<Chapter, 'id'>>

/**
 * Dependency update operation
 */
export type DependencyOperation =
  | { type: 'add'; dependency: Dependency }
  | { type: 'remove'; fromQuestId: string; toQuestId: string }
  | { type: 'update'; fromQuestId: string; toQuestId: string; updates: Partial<Dependency> }

/**
 * Editor store actions
 */
export interface EditorActions {
  /**
   * Initialize the store with a project
   */
  initializeProject: (projectId: string, snapshot: ProjectSnapshot) => void

  /**
   * Set the entire snapshot (used for undo/redo, initial load)
   * NOTE: Does NOT push to undo stack - use pushUndoPoint before modifying
   */
  setSnapshot: (snapshot: ProjectSnapshot) => void

  /**
   * Push current snapshot to undo stack before making changes.
   * Clears the redo stack (new changes invalidate redo history).
   * Call this before drag stop, connect/disconnect, or inspector save.
   */
  pushUndoPoint: () => void

  /**
   * Undo the last change.
   * Pushes current snapshot to redo stack before restoring.
   */
  undo: () => void

  /**
   * Redo the last undone change.
   * Pushes current snapshot to undo stack before restoring.
   */
  redo: () => void

  /**
   * Update a single quest by ID
   * @param questId - The quest to update
   * @param updates - Partial quest data to merge
   */
  updateQuest: (questId: string, updates: QuestUpdate) => void

  /**
   * Update dependencies (add, remove, or modify)
   * @param operation - The dependency operation to perform
   */
  updateDependencies: (operation: DependencyOperation) => void

  /**
   * Mark the snapshot as dirty (has unsaved changes)
   */
  markDirty: () => void

  /**
   * Mark the snapshot as clean (no unsaved changes)
   */
  markClean: () => void

  /**
   * Update sync state
   */
  setSyncState: (state: Partial<SyncState>) => void

  /**
   * Select a quest by ID
   * @param questId - The quest to select (null to deselect)
   */
  selectQuest: (questId: string | null) => void

  /**
   * Select/switch to a chapter
   * @param chapterId - The chapter to select
   */
  selectChapter: (chapterId: string) => void

  /**
   * Clear all selection
   */
  clearSelection: () => void

  /**
   * Add a new chapter to the project
   * @param chapter - The chapter to add
   */
  addChapter: (chapter: Chapter) => void

  /**
   * Update a chapter by ID
   * @param chapterId - The chapter to update
   * @param updates - Partial chapter data to merge
   */
  updateChapter: (chapterId: string, updates: ChapterUpdate) => void

  /**
   * Delete a chapter by ID
   * Also removes all quests in the chapter and their dependencies
   * @param chapterId - The chapter to delete
   */
  deleteChapter: (chapterId: string) => void

  /**
   * Reset the store to initial state
   */
  reset: () => void
}

/**
 * Complete editor store type
 */
export type EditorStore = EditorState & EditorActions
