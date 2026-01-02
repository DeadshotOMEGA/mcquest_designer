import { create } from 'zustand'
import type { TreeUIState } from './types'

/**
 * Tree UI State Store
 *
 * Manages the expanded/collapsed state of chapters and entity selection
 * for the virtualized sidebar tree. Separate from EditorStore to keep
 * concerns isolated and improve performance.
 */
export const useTreeUIStore = create<TreeUIState>((set) => ({
  expandedChapterIds: new Set(),
  selectedEntityId: null,
  selectedEntityType: null,

  toggleChapter: (id: string) => {
    set((state) => {
      const expanded = new Set(state.expandedChapterIds)
      if (expanded.has(id)) {
        expanded.delete(id)
      } else {
        expanded.add(id)
      }
      return { expandedChapterIds: expanded }
    })
  },

  selectEntity: (id: string, type: 'quest' | 'chapter') => {
    set(() => ({
      selectedEntityId: id,
      selectedEntityType: type,
    }))
  },

  collapseAll: () => {
    set(() => ({
      expandedChapterIds: new Set(),
    }))
  },

  expandAll: () => {
    set((state) => {
      // Return the existing set as-is, will be populated by caller
      return { expandedChapterIds: state.expandedChapterIds }
    })
  },
}))

/**
 * Selector for expanded chapter IDs
 */
export const useExpandedChapterIds = () =>
  useTreeUIStore((state) => state.expandedChapterIds)

/**
 * Selector for selected entity
 */
export const useSelectedEntity = () =>
  useTreeUIStore((state) => ({
    id: state.selectedEntityId,
    type: state.selectedEntityType,
  }))

/**
 * Selector for tree actions
 */
export const useTreeActions = () =>
  useTreeUIStore((state) => ({
    toggleChapter: state.toggleChapter,
    selectEntity: state.selectEntity,
    collapseAll: state.collapseAll,
    expandAll: state.expandAll,
  }))
