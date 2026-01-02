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
 * Tree UI state for quest/chapter hierarchy visualization
 *
 * Manages the expanded/collapsed state of chapters and entity selection.
 */
export interface TreeUIState {
  /**
   * Set of expanded chapter IDs
   */
  expandedChapterIds: Set<string>

  /**
   * Currently selected entity ID (quest or chapter)
   */
  selectedEntityId: string | null

  /**
   * Type of selected entity
   */
  selectedEntityType: 'quest' | 'chapter' | null

  /**
   * Toggle expansion state of a chapter
   */
  toggleChapter: (id: string) => void

  /**
   * Select an entity (quest or chapter)
   */
  selectEntity: (id: string, type: 'quest' | 'chapter') => void

  /**
   * Collapse all chapters
   */
  collapseAll: () => void

  /**
   * Expand all chapters
   */
  expandAll: () => void
}

/**
 * Preview UI state for quest/chapter preview panel
 *
 * Manages the visibility and scope of the preview panel.
 */
export interface PreviewUIState {
  /**
   * Whether the preview panel is visible
   */
  showPreview: boolean

  /**
   * Scope of the preview (what entity type is being previewed)
   */
  previewScope: 'quest' | 'chapter' | 'project'

  /**
   * Toggle preview panel visibility
   */
  togglePreview: () => void

  /**
   * Set the preview scope
   */
  setPreviewScope: (scope: 'quest' | 'chapter' | 'project') => void
}

/**
 * Dirty tracking state for tracking unsaved changes per entity
 *
 * Manages which entities have been modified but not saved.
 */
export interface DirtyTrackingState {
  /**
   * Set of entity IDs that have unsaved changes
   */
  dirtyEntities: Set<string>

  /**
   * Mark an entity as having unsaved changes
   */
  markDirty: (entityId: string) => void

  /**
   * Mark an entity as clean (saved)
   */
  markClean: (entityId: string) => void

  /**
   * Clear all dirty entities
   */
  clearAll: () => void

  /**
   * Check if there are any dirty entities
   */
  hasDirtyEntities: () => boolean
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

  /**
   * Whether auto-layout is currently running
   */
  isArranging: boolean

  /**
   * Tree UI state for quest/chapter hierarchy
   */
  treeUI: TreeUIState

  /**
   * Preview UI state
   */
  previewUI: PreviewUIState

  /**
   * Dirty tracking state for per-entity changes
   */
  dirtyTracking: DirtyTrackingState
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
   * Add a new quest to the project
   * @param quest - The quest to add
   */
  addQuest: (quest: Quest) => void

  /**
   * Update a single quest by ID
   * @param questId - The quest to update
   * @param updates - Partial quest data to merge
   */
  updateQuest: (questId: string, updates: QuestUpdate) => void

  /**
   * Delete a quest by ID
   * Also removes all dependencies involving this quest
   * @param questId - The quest to delete
   */
  deleteQuest: (questId: string) => void

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

  /**
   * Apply auto-layout to the active chapter
   * Records an undo point before applying layout changes
   * Updates quest positions deterministically based on dependencies
   */
  applyAutoLayout: () => void

  /**
   * Set whether layout is being calculated
   * @param arranging - Whether layout calculation is in progress
   */
  setArranging: (arranging: boolean) => void

  /**
   * Toggle expansion state of a chapter in the tree UI
   * @param chapterId - The chapter ID to toggle
   */
  toggleChapter: (chapterId: string) => void

  /**
   * Select an entity in the tree UI
   * @param entityId - The entity ID to select
   * @param entityType - The type of entity (quest or chapter)
   */
  selectEntity: (entityId: string, entityType: 'quest' | 'chapter') => void

  /**
   * Collapse all chapters in the tree UI
   */
  collapseAll: () => void

  /**
   * Expand all chapters in the tree UI
   */
  expandAll: () => void

  /**
   * Toggle the visibility of the preview panel
   */
  togglePreview: () => void

  /**
   * Set the scope of the preview panel
   * @param scope - The scope type (quest, chapter, or project)
   */
  setPreviewScope: (scope: 'quest' | 'chapter' | 'project') => void

  /**
   * Mark an entity as having unsaved changes
   * @param entityId - The entity ID to mark as dirty
   */
  markEntityDirty: (entityId: string) => void

  /**
   * Mark an entity as clean (saved)
   * @param entityId - The entity ID to mark as clean
   */
  markEntityClean: (entityId: string) => void

  /**
   * Clear all dirty entities
   */
  clearDirtyEntities: () => void

  /**
   * Check if there are any dirty entities
   * @returns true if any entities are dirty, false otherwise
   */
  hasDirtyEntities: () => boolean
}

/**
 * Complete editor store type
 */
export type EditorStore = EditorState & EditorActions
