import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ProjectSnapshot, Chapter, Quest } from '@mcquest/schema'
import { calculateLayout } from '@/lib/layout/dagre-layout'
import {
  MAX_HISTORY_SIZE,
  type EditorStore,
  type EditorState,
  type QuestUpdate,
  type ChapterUpdate,
  type DependencyOperation,
  type SyncState,
} from './types'

/**
 * Stable empty array references to prevent infinite re-renders
 * These are used in selectors when data doesn't exist yet
 */
const EMPTY_CHAPTERS: Chapter[] = []
const EMPTY_QUESTS: Quest[] = []

/**
 * Initial state for the editor store
 */
const initialState: EditorState = {
  projectId: null,
  snapshot: null,
  isDirty: false,
  syncState: {
    status: 'idle',
  },
  selection: {
    selectedQuestId: null,
    selectedChapterId: null,
  },
  history: {
    undoStack: [],
    redoStack: [],
  },
  isArranging: false,
  treeUI: {
    expandedChapterIds: new Set(),
    selectedEntityId: null,
    selectedEntityType: null,
    toggleChapter: () => {},
    selectEntity: () => {},
    collapseAll: () => {},
    expandAll: () => {},
  },
  previewUI: {
    showPreview: false,
    previewScope: 'project',
    togglePreview: () => {},
    setPreviewScope: () => {},
  },
  dirtyTracking: {
    dirtyEntities: new Set(),
    markDirty: () => {},
    markClean: () => {},
    clearAll: () => {},
    hasDirtyEntities: () => false,
  },
}

/**
 * Editor Store
 *
 * Central state management for the quest graph editor.
 * Uses Zustand with immer middleware for immutable updates.
 *
 * Key responsibilities:
 * - Holds the working copy of ProjectSnapshot
 * - Tracks dirty state for autosave
 * - Provides actions for quest and dependency updates
 *
 * Acceptance criteria from #23:
 * ✅ Store contains: snapshot, isDirty, syncStatus
 * ✅ Actions: setSnapshot, updateQuest, updateDependencies
 * ✅ Uses immer middleware for immutable updates
 * ✅ TypeScript types for all state and actions
 */
export const useEditorStore = create<EditorStore>()(
  immer((set) => ({
    // Initial state
    ...initialState,

    // Actions
    initializeProject: (projectId: string, snapshot: ProjectSnapshot) => {
      set((state) => {
        state.projectId = projectId
        state.snapshot = snapshot
        state.isDirty = false
        state.syncState = { status: 'idle' }

        // Initialize selection from uiState or first chapter
        const activeChapterId =
          snapshot.uiState?.activeChapterId ?? snapshot.chapters[0]?.id ?? null
        const selectedQuestId = snapshot.uiState?.selectedQuestId ?? null

        state.selection = {
          selectedQuestId,
          selectedChapterId: activeChapterId,
        }
      })
    },

    setSnapshot: (snapshot: ProjectSnapshot) => {
      set((state) => {
        state.snapshot = snapshot
        state.isDirty = true
      })
    },

    pushUndoPoint: () => {
      set((state) => {
        if (!state.snapshot) return

        // Deep clone the current snapshot for undo history
        const snapshotCopy = JSON.parse(JSON.stringify(state.snapshot)) as ProjectSnapshot

        // Push to undo stack
        state.history.undoStack.push(snapshotCopy)

        // Trim to max history size
        if (state.history.undoStack.length > MAX_HISTORY_SIZE) {
          state.history.undoStack.shift()
        }

        // Clear redo stack - new changes invalidate redo history
        state.history.redoStack = []
      })
    },

    undo: () => {
      set((state) => {
        if (!state.snapshot || state.history.undoStack.length === 0) return

        // Save current state to redo stack before restoring
        const currentSnapshotCopy = JSON.parse(JSON.stringify(state.snapshot)) as ProjectSnapshot
        state.history.redoStack.push(currentSnapshotCopy)

        // Trim redo stack to max history size
        if (state.history.redoStack.length > MAX_HISTORY_SIZE) {
          state.history.redoStack.shift()
        }

        // Restore from undo stack
        const previousSnapshot = state.history.undoStack.pop()
        if (previousSnapshot) {
          state.snapshot = previousSnapshot
          state.isDirty = true
        }
      })
    },

    redo: () => {
      set((state) => {
        if (!state.snapshot || state.history.redoStack.length === 0) return

        // Save current state to undo stack before restoring
        const currentSnapshotCopy = JSON.parse(JSON.stringify(state.snapshot)) as ProjectSnapshot
        state.history.undoStack.push(currentSnapshotCopy)

        // Trim undo stack to max history size
        if (state.history.undoStack.length > MAX_HISTORY_SIZE) {
          state.history.undoStack.shift()
        }

        // Restore from redo stack
        const nextSnapshot = state.history.redoStack.pop()
        if (nextSnapshot) {
          state.snapshot = nextSnapshot
          state.isDirty = true
        }
      })
    },

    addQuest: (quest) => {
      set((state) => {
        if (!state.snapshot) return

        // Add the quest to the snapshot
        state.snapshot.quests.push(quest)

        // Update metadata timestamp
        state.snapshot.metadata.updatedAt = new Date().toISOString()
        state.isDirty = true

        // TEMPORARILY DISABLED: Auto-select causes infinite loop with QuestInspector
        // The massive unmount/remount of inspector components triggers Radix UI ref issues
        // TODO: Fix by preventing inspector from full unmount/remount
        // state.selection.selectedQuestId = quest.id
        // if (state.snapshot.uiState) {
        //   state.snapshot.uiState.selectedQuestId = quest.id
        // }
      })
    },

    updateQuest: (questId: string, updates: QuestUpdate) => {
      set((state) => {
        if (!state.snapshot) return

        const questIndex = state.snapshot.quests.findIndex((q) => q.id === questId)
        if (questIndex === -1) return

        // Merge updates into the quest
        const quest = state.snapshot.quests[questIndex]
        Object.assign(quest, updates)

        // Update metadata timestamp
        state.snapshot.metadata.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    deleteQuest: (questId: string) => {
      set((state) => {
        if (!state.snapshot) return

        // Remove the quest
        const questIndex = state.snapshot.quests.findIndex((q) => q.id === questId)
        if (questIndex === -1) return

        state.snapshot.quests.splice(questIndex, 1)

        // Remove all dependencies involving this quest
        state.snapshot.dependencies = state.snapshot.dependencies.filter(
          (d) => d.fromQuestId !== questId && d.toQuestId !== questId
        )

        // Clear selection if this quest was selected
        if (state.selection.selectedQuestId === questId) {
          state.selection.selectedQuestId = null
          if (state.snapshot.uiState) {
            state.snapshot.uiState.selectedQuestId = undefined
          }
        }

        // Update metadata timestamp
        state.snapshot.metadata.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    updateDependencies: (operation: DependencyOperation) => {
      set((state) => {
        if (!state.snapshot) return

        switch (operation.type) {
          case 'add': {
            // Check if dependency already exists
            const exists = state.snapshot.dependencies.some(
              (d) =>
                d.fromQuestId === operation.dependency.fromQuestId &&
                d.toQuestId === operation.dependency.toQuestId
            )
            if (!exists) {
              state.snapshot.dependencies.push(operation.dependency)
            }
            break
          }

          case 'remove': {
            const index = state.snapshot.dependencies.findIndex(
              (d) =>
                d.fromQuestId === operation.fromQuestId &&
                d.toQuestId === operation.toQuestId
            )
            if (index !== -1) {
              state.snapshot.dependencies.splice(index, 1)
            }
            break
          }

          case 'update': {
            const dep = state.snapshot.dependencies.find(
              (d) =>
                d.fromQuestId === operation.fromQuestId &&
                d.toQuestId === operation.toQuestId
            )
            if (dep) {
              Object.assign(dep, operation.updates)
            }
            break
          }
        }

        // Update metadata timestamp
        state.snapshot.metadata.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    markDirty: () => {
      set((state) => {
        state.isDirty = true
      })
    },

    markClean: () => {
      set((state) => {
        state.isDirty = false
      })
    },

    setSyncState: (syncState: Partial<SyncState>) => {
      set((state) => {
        state.syncState = { ...state.syncState, ...syncState }
      })
    },

    selectQuest: (questId: string | null) => {
      set((state) => {
        state.selection.selectedQuestId = questId

        // Update uiState in snapshot
        if (state.snapshot) {
          if (!state.snapshot.uiState) {
            state.snapshot.uiState = {
              activeChapterId: state.selection.selectedChapterId ?? undefined,
              viewportByChapter: {},
            }
          }
          state.snapshot.uiState.selectedQuestId = questId ?? undefined
        }
      })
    },

    selectChapter: (chapterId: string) => {
      set((state) => {
        // Clear quest selection when switching chapters
        state.selection.selectedQuestId = null
        state.selection.selectedChapterId = chapterId

        // Update uiState in snapshot
        if (state.snapshot) {
          if (!state.snapshot.uiState) {
            state.snapshot.uiState = {
              activeChapterId: chapterId,
              viewportByChapter: {},
            }
          } else {
            state.snapshot.uiState.activeChapterId = chapterId
            state.snapshot.uiState.selectedQuestId = undefined
          }
        }
      })
    },

    clearSelection: () => {
      set((state) => {
        state.selection.selectedQuestId = null

        // Update uiState in snapshot
        if (state.snapshot?.uiState) {
          state.snapshot.uiState.selectedQuestId = undefined
        }
      })
    },

    addChapter: (chapter: Chapter) => {
      set((state) => {
        if (!state.snapshot) return

        // Add the chapter
        state.snapshot.chapters.push(chapter)

        // Update metadata timestamp
        state.snapshot.metadata.updatedAt = new Date().toISOString()
        state.isDirty = true

        // If this is the first chapter or no chapter is selected, select it
        if (!state.selection.selectedChapterId) {
          state.selection.selectedChapterId = chapter.id
          if (state.snapshot.uiState) {
            state.snapshot.uiState.activeChapterId = chapter.id
          }
        }
      })
    },

    updateChapter: (chapterId: string, updates: ChapterUpdate) => {
      set((state) => {
        if (!state.snapshot) return

        const chapterIndex = state.snapshot.chapters.findIndex((c) => c.id === chapterId)
        if (chapterIndex === -1) return

        // Merge updates into the chapter
        const chapter = state.snapshot.chapters[chapterIndex]
        Object.assign(chapter, updates)

        // Update metadata timestamp
        state.snapshot.metadata.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    deleteChapter: (chapterId: string) => {
      set((state) => {
        if (!state.snapshot) return

        // Get all quest IDs in this chapter
        const questIdsToRemove = new Set(
          state.snapshot.quests.filter((q) => q.chapterId === chapterId).map((q) => q.id)
        )

        // Remove the chapter
        state.snapshot.chapters = state.snapshot.chapters.filter((c) => c.id !== chapterId)

        // Remove all quests in the chapter
        state.snapshot.quests = state.snapshot.quests.filter((q) => q.chapterId !== chapterId)

        // Remove all dependencies involving those quests
        state.snapshot.dependencies = state.snapshot.dependencies.filter(
          (d) => !questIdsToRemove.has(d.fromQuestId) && !questIdsToRemove.has(d.toQuestId)
        )

        // Update metadata timestamp
        state.snapshot.metadata.updatedAt = new Date().toISOString()
        state.isDirty = true

        // If the deleted chapter was selected, select another chapter
        if (state.selection.selectedChapterId === chapterId) {
          const remainingChapter = state.snapshot.chapters[0]
          state.selection.selectedChapterId = remainingChapter?.id ?? null
          state.selection.selectedQuestId = null

          if (state.snapshot.uiState) {
            state.snapshot.uiState.activeChapterId = remainingChapter?.id
            state.snapshot.uiState.selectedQuestId = undefined
          }
        }
      })
    },

    reset: () => {
      set(() => initialState)
    },

    // Tree UI actions
    toggleChapter: (chapterId: string) => {
      set((state) => {
        if (state.treeUI.expandedChapterIds.has(chapterId)) {
          state.treeUI.expandedChapterIds.delete(chapterId)
        } else {
          state.treeUI.expandedChapterIds.add(chapterId)
        }
      })
    },

    selectEntity: (entityId: string, entityType: 'quest' | 'chapter') => {
      set((state) => {
        state.treeUI.selectedEntityId = entityId
        state.treeUI.selectedEntityType = entityType
      })
    },

    collapseAll: () => {
      set((state) => {
        state.treeUI.expandedChapterIds.clear()
      })
    },

    expandAll: () => {
      set((state) => {
        if (!state.snapshot) return
        // Expand all chapters
        for (const chapter of state.snapshot.chapters) {
          state.treeUI.expandedChapterIds.add(chapter.id)
        }
      })
    },

    // Preview UI actions
    togglePreview: () => {
      set((state) => {
        state.previewUI.showPreview = !state.previewUI.showPreview
      })
    },

    setPreviewScope: (scope: 'quest' | 'chapter' | 'project') => {
      set((state) => {
        state.previewUI.previewScope = scope
      })
    },

    // Dirty tracking actions
    markEntityDirty: (entityId: string) => {
      set((state) => {
        state.dirtyTracking.dirtyEntities.add(entityId)
      })
    },

    markEntityClean: (entityId: string) => {
      set((state) => {
        state.dirtyTracking.dirtyEntities.delete(entityId)
      })
    },

    clearDirtyEntities: () => {
      set((state) => {
        state.dirtyTracking.dirtyEntities.clear()
      })
    },

    hasDirtyEntities: (): boolean => {
      const state = useEditorStore.getState()
      return state.dirtyTracking.dirtyEntities.size > 0
    },

    applyAutoLayout: () => {
      set((state) => {
        if (!state.snapshot) return

        // Get the active chapter
        const activeChapterId = state.selection.selectedChapterId
        if (!activeChapterId) return

        const chapter = state.snapshot.chapters.find((c) => c.id === activeChapterId)
        if (!chapter) return

        // Get quests in this chapter
        const chapterQuests = state.snapshot.quests.filter((q) => q.chapterId === activeChapterId)
        if (chapterQuests.length === 0) return

        // Record undo point BEFORE applying changes
        state.history.undoStack.push(JSON.parse(JSON.stringify(state.snapshot)) as ProjectSnapshot)

        // Trim undo stack to max history size
        if (state.history.undoStack.length > MAX_HISTORY_SIZE) {
          state.history.undoStack.shift()
        }

        // Clear redo stack - new changes invalidate redo history
        state.history.redoStack = []

        // Build dependencies for this chapter (only edges where both quests are in chapter)
        const chapterQuestIds = new Set(chapterQuests.map((q) => q.id))
        const chapterDependencies = state.snapshot.dependencies.filter(
          (d) => chapterQuestIds.has(d.fromQuestId) && chapterQuestIds.has(d.toQuestId)
        )

        // Calculate layout
        const layoutResult = calculateLayout(chapterQuests, chapterDependencies)

        // Apply new positions to quests
        for (const quest of chapterQuests) {
          const newPos = layoutResult.positions.get(quest.id)
          if (newPos) {
            quest.position = newPos
          }
        }

        // Update metadata timestamp
        state.snapshot.metadata.updatedAt = new Date().toISOString()
        state.isDirty = true
      })
    },

    setArranging: (arranging: boolean) => {
      set((state) => {
        state.isArranging = arranging
      })
    },
  }))
)

/**
 * Selector hooks for common state slices
 */

/**
 * Get the current snapshot
 */
export const useSnapshot = () => useEditorStore((state: EditorState) => state.snapshot)

/**
 * Get dirty state
 */
export const useIsDirty = () => useEditorStore((state: EditorState) => state.isDirty)

/**
 * Get sync state
 */
export const useSyncState = () => useEditorStore((state: EditorState) => state.syncState)

/**
 * Get a specific quest by ID
 */
export const useQuest = (questId: string) =>
  useEditorStore((state: EditorState) => state.snapshot?.quests.find((q: Quest) => q.id === questId))

/**
 * Get all quests for a chapter
 */
export const useChapterQuests = (chapterId: string) =>
  useEditorStore((state: EditorState) =>
    state.snapshot?.quests.filter((q: Quest) => q.chapterId === chapterId) ?? EMPTY_QUESTS
  )

/**
 * Get all chapters
 */
export const useChapters = () =>
  useEditorStore((state: EditorState) => state.snapshot?.chapters ?? EMPTY_CHAPTERS)

/**
 * Get all quests
 */
export const useQuests = () =>
  useEditorStore((state: EditorState) => state.snapshot?.quests ?? EMPTY_QUESTS)

/**
 * Get selection state
 */
export const useSelection = () => useEditorStore((state: EditorState) => state.selection)

/**
 * Get selected quest ID
 */
export const useSelectedQuestId = () =>
  useEditorStore((state: EditorState) => state.selection.selectedQuestId)

/**
 * Get selected chapter ID
 */
export const useSelectedChapterId = () =>
  useEditorStore((state: EditorState) => state.selection.selectedChapterId)

/**
 * Get the undo stack
 */
export const useUndoStack = () =>
  useEditorStore((state: EditorState) => state.history.undoStack)

/**
 * Get the redo stack
 */
export const useRedoStack = () =>
  useEditorStore((state: EditorState) => state.history.redoStack)

/**
 * Check if undo is available
 */
export const useCanUndo = () =>
  useEditorStore((state: EditorState) => state.history.undoStack.length > 0)

/**
 * Check if redo is available
 */
export const useCanRedo = () =>
  useEditorStore((state: EditorState) => state.history.redoStack.length > 0)

/**
 * Get whether auto-layout is currently running
 */
export const useIsArranging = () =>
  useEditorStore((state: EditorState) => state.isArranging)

/**
 * Get tree UI state
 */
export const useTreeUI = () => useEditorStore((state: EditorState) => state.treeUI)

/**
 * Get expanded chapter IDs
 */
export const useExpandedChapterIds = () =>
  useEditorStore((state: EditorState) => state.treeUI.expandedChapterIds)

/**
 * Get selected entity in tree UI
 */
export const useSelectedEntity = () =>
  useEditorStore((state: EditorState) => ({
    selectedEntityId: state.treeUI.selectedEntityId,
    selectedEntityType: state.treeUI.selectedEntityType,
  }))

/**
 * Get preview UI state
 */
export const usePreviewUI = () => useEditorStore((state: EditorState) => state.previewUI)

/**
 * Get preview visibility
 */
export const useShowPreview = () =>
  useEditorStore((state: EditorState) => state.previewUI.showPreview)

/**
 * Get preview scope
 */
export const usePreviewScope = () =>
  useEditorStore((state: EditorState) => state.previewUI.previewScope)

/**
 * Get dirty tracking state
 */
export const useDirtyTracking = () =>
  useEditorStore((state: EditorState) => state.dirtyTracking)

/**
 * Get dirty entities
 */
export const useDirtyEntities = () =>
  useEditorStore((state: EditorState) => state.dirtyTracking.dirtyEntities)
