import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from './editor-store'
import { createDefaultSnapshot } from '@/lib/editor/default-snapshot'
import { createDefaultQuest, createDefaultChapter } from '@mcquest/schema'
import type { Quest, Chapter } from '@mcquest/schema'

describe('EditorStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useEditorStore.setState({
      projectId: null,
      snapshot: null,
      selection: {
        selectedChapterId: null,
        selectedQuestId: null,
      },
      isDirty: false,
      isArranging: false,
      history: {
        undoStack: [],
        redoStack: [],
      },
      syncState: {
        status: 'idle',
      },
    })
  })

  describe('initialization', () => {
    it('should initialize project with snapshot', () => {
      const snapshot = createDefaultSnapshot('Test Project')
      useEditorStore.getState().initializeProject('project-1', snapshot)

      const state = useEditorStore.getState()
      expect(state.projectId).toBe('project-1')
      expect(state.snapshot).toEqual(snapshot)
      expect(state.selection.selectedChapterId).toBe(snapshot.uiState?.activeChapterId)
      expect(state.isDirty).toBe(false)
    })

    it('should not reinitialize if project ID matches', () => {
      const snapshot1 = createDefaultSnapshot('Project 1')
      const snapshot2 = createDefaultSnapshot('Project 2')

      useEditorStore.getState().initializeProject('project-1', snapshot1)
      const initialState = useEditorStore.getState().snapshot

      useEditorStore.getState().initializeProject('project-1', snapshot2)
      const finalState = useEditorStore.getState().snapshot

      expect(finalState).toBe(initialState) // Should be same reference
    })

    it('should reinitialize if project ID changes', () => {
      const snapshot1 = createDefaultSnapshot('Project 1')
      const snapshot2 = createDefaultSnapshot('Project 2')

      useEditorStore.getState().initializeProject('project-1', snapshot1)
      useEditorStore.getState().initializeProject('project-2', snapshot2)

      const state = useEditorStore.getState()
      expect(state.projectId).toBe('project-2')
      expect(state.snapshot?.metadata.projectName).toBe('Project 2')
    })
  })

  describe('chapter operations', () => {
    beforeEach(() => {
      const snapshot = createDefaultSnapshot('Test Project')
      useEditorStore.getState().initializeProject('project-1', snapshot)
    })

    it('should add a new chapter', () => {
      const newChapter = createDefaultChapter('Chapter 2', 1)
      useEditorStore.getState().addChapter(newChapter)

      const state = useEditorStore.getState()
      expect(state.snapshot?.chapters).toHaveLength(2)
      expect(state.snapshot?.chapters[1]).toEqual(newChapter)
      expect(state.isDirty).toBe(true)
    })

    it('should delete a chapter', () => {
      const snapshot = useEditorStore.getState().snapshot
      const chapterId = snapshot?.chapters[0]?.id

      if (!chapterId) throw new Error('No chapter found')

      useEditorStore.getState().deleteChapter(chapterId)

      const state = useEditorStore.getState()
      expect(state.snapshot?.chapters).toHaveLength(0)
      expect(state.isDirty).toBe(true)
    })

    it('should select a chapter', () => {
      const snapshot = useEditorStore.getState().snapshot
      const chapterId = snapshot?.chapters[0]?.id

      if (!chapterId) throw new Error('No chapter found')

      useEditorStore.getState().selectChapter(chapterId)

      const state = useEditorStore.getState()
      expect(state.selection.selectedChapterId).toBe(chapterId)
      expect(state.snapshot?.uiState?.activeChapterId).toBe(chapterId)
    })
  })

  describe('quest operations', () => {
    let chapterId: string

    beforeEach(() => {
      const snapshot = createDefaultSnapshot('Test Project')
      useEditorStore.getState().initializeProject('project-1', snapshot)
      chapterId = snapshot.chapters[0]!.id
    })

    it('should add a new quest', () => {
      const newQuest = createDefaultQuest(chapterId, 'Test Quest', { x: 100, y: 100 })
      useEditorStore.getState().addQuest(newQuest)

      const state = useEditorStore.getState()
      expect(state.snapshot?.quests).toHaveLength(1)
      expect(state.snapshot?.quests[0]).toEqual(newQuest)
      expect(state.isDirty).toBe(true)
      expect(state.selection.selectedQuestId).toBe(newQuest.id)
    })

    it('should update quest position', () => {
      const quest = createDefaultQuest(chapterId, 'Test Quest', { x: 100, y: 100 })
      useEditorStore.getState().addQuest(quest)

      useEditorStore.getState().updateQuest(quest.id, {
        position: { x: 200, y: 200 },
      })

      const state = useEditorStore.getState()
      const updatedQuest = state.snapshot?.quests[0]
      expect(updatedQuest?.position).toEqual({ x: 200, y: 200 })
      expect(state.isDirty).toBe(true)
    })

    it('should update quest metadata', () => {
      const quest = createDefaultQuest(chapterId, 'Test Quest', { x: 100, y: 100 })
      useEditorStore.getState().addQuest(quest)

      useEditorStore.getState().updateQuest(quest.id, {
        title: 'Updated Title',
        subtitle: 'New Subtitle',
        description: 'New Description',
      })

      const state = useEditorStore.getState()
      const updatedQuest = state.snapshot?.quests[0]
      expect(updatedQuest?.title).toBe('Updated Title')
      expect(updatedQuest?.subtitle).toBe('New Subtitle')
      expect(updatedQuest?.description).toBe('New Description')
    })

    it('should delete a quest', () => {
      const quest = createDefaultQuest(chapterId, 'Test Quest', { x: 100, y: 100 })
      useEditorStore.getState().addQuest(quest)

      useEditorStore.getState().deleteQuest(quest.id)

      const state = useEditorStore.getState()
      expect(state.snapshot?.quests).toHaveLength(0)
      expect(state.selection.selectedQuestId).toBeNull()
      expect(state.isDirty).toBe(true)
    })

    it('should delete quest and remove related dependencies', () => {
      const quest1 = createDefaultQuest(chapterId, 'Quest 1', { x: 100, y: 100 })
      const quest2 = createDefaultQuest(chapterId, 'Quest 2', { x: 200, y: 200 })

      useEditorStore.getState().addQuest(quest1)
      useEditorStore.getState().addQuest(quest2)

      // Add dependency manually
      useEditorStore.setState((state) => {
        if (state.snapshot) {
          state.snapshot.dependencies.push({
            fromQuestId: quest1.id,
            toQuestId: quest2.id,
          })
        }
      })

      useEditorStore.getState().deleteQuest(quest1.id)

      const state = useEditorStore.getState()
      expect(state.snapshot?.quests).toHaveLength(1)
      expect(state.snapshot?.dependencies).toHaveLength(0)
    })

    it('should select a quest', () => {
      const quest = createDefaultQuest(chapterId, 'Test Quest', { x: 100, y: 100 })
      useEditorStore.getState().addQuest(quest)

      useEditorStore.getState().selectQuest(quest.id)

      const state = useEditorStore.getState()
      expect(state.selection.selectedQuestId).toBe(quest.id)
      expect(state.snapshot?.uiState?.selectedQuestId).toBe(quest.id)
    })

    it('should clear quest selection', () => {
      const quest = createDefaultQuest(chapterId, 'Test Quest', { x: 100, y: 100 })
      useEditorStore.getState().addQuest(quest)
      useEditorStore.getState().selectQuest(quest.id)

      useEditorStore.getState().selectQuest(null)

      const state = useEditorStore.getState()
      expect(state.selection.selectedQuestId).toBeNull()
      expect(state.snapshot?.uiState?.selectedQuestId).toBeUndefined()
    })
  })

  describe('dirty state tracking', () => {
    beforeEach(() => {
      const snapshot = createDefaultSnapshot('Test Project')
      useEditorStore.getState().initializeProject('project-1', snapshot)
    })

    it('should mark as dirty when adding a quest', () => {
      const snapshot = useEditorStore.getState().snapshot
      const chapterId = snapshot?.chapters[0]?.id

      if (!chapterId) throw new Error('No chapter found')

      const quest = createDefaultQuest(chapterId, 'Test', { x: 0, y: 0 })
      useEditorStore.getState().addQuest(quest)

      expect(useEditorStore.getState().isDirty).toBe(true)
    })

    it('should clear dirty flag when marking clean', () => {
      const snapshot = useEditorStore.getState().snapshot
      const chapterId = snapshot?.chapters[0]?.id

      if (!chapterId) throw new Error('No chapter found')

      const quest = createDefaultQuest(chapterId, 'Test', { x: 0, y: 0 })
      useEditorStore.getState().addQuest(quest)

      useEditorStore.getState().markClean()

      expect(useEditorStore.getState().isDirty).toBe(false)
      expect(useEditorStore.getState().lastSavedAt).not.toBeNull()
    })

    it('should track last saved timestamp', () => {
      const beforeSave = Date.now()

      useEditorStore.getState().markClean()

      const state = useEditorStore.getState()
      const afterSave = Date.now()

      expect(state.lastSavedAt).not.toBeNull()
      expect(state.lastSavedAt!).toBeGreaterThanOrEqual(beforeSave)
      expect(state.lastSavedAt!).toBeLessThanOrEqual(afterSave)
    })
  })

  describe('selectors', () => {
    beforeEach(() => {
      const snapshot = createDefaultSnapshot('Test Project')
      useEditorStore.getState().initializeProject('project-1', snapshot)
    })

    it('useChapters should return all chapters', () => {
      const chapters = useEditorStore.getState().snapshot?.chapters ?? []
      expect(chapters).toHaveLength(1)
      expect(chapters[0]?.title).toBe('Main')
    })

    it('useQuests should return all quests', () => {
      const snapshot = useEditorStore.getState().snapshot
      const chapterId = snapshot?.chapters[0]?.id

      if (!chapterId) throw new Error('No chapter found')

      const quest = createDefaultQuest(chapterId, 'Test', { x: 0, y: 0 })
      useEditorStore.getState().addQuest(quest)

      const quests = useEditorStore.getState().snapshot?.quests ?? []
      expect(quests).toHaveLength(1)
    })
  })

  describe('auto-layout', () => {
    let chapterId: string

    beforeEach(() => {
      const snapshot = createDefaultSnapshot('Test Project')
      useEditorStore.getState().initializeProject('project-1', snapshot)
      chapterId = snapshot.chapters[0]!.id
      useEditorStore.getState().selectChapter(chapterId)
    })

    it('should apply layout and update quest positions', () => {
      const quest1 = createDefaultQuest(chapterId, 'Quest 1', { x: 100, y: 100 })
      const quest2 = createDefaultQuest(chapterId, 'Quest 2', { x: 200, y: 200 })

      useEditorStore.getState().addQuest(quest1)
      useEditorStore.getState().addQuest(quest2)

      // Add dependency: quest1 -> quest2
      useEditorStore.setState((state) => {
        if (state.snapshot) {
          state.snapshot.dependencies.push({
            fromQuestId: quest1.id,
            toQuestId: quest2.id,
          })
        }
      })

      const originalPositions = {
        [quest1.id]: { ...quest1.position },
        [quest2.id]: { ...quest2.position },
      }

      useEditorStore.getState().applyAutoLayout()

      const state = useEditorStore.getState()
      const updatedQuest1 = state.snapshot?.quests.find((q) => q.id === quest1.id)
      const updatedQuest2 = state.snapshot?.quests.find((q) => q.id === quest2.id)

      expect(updatedQuest1?.position).toBeDefined()
      expect(updatedQuest2?.position).toBeDefined()

      // Positions should have changed (layout was applied)
      // We check that at least one position changed (dagre may not change all)
      const positionsChanged =
        JSON.stringify(updatedQuest1?.position) !== JSON.stringify(originalPositions[quest1.id]) ||
        JSON.stringify(updatedQuest2?.position) !== JSON.stringify(originalPositions[quest2.id])
      expect(positionsChanged).toBe(true)
    })

    it('should record undo point before applying layout', () => {
      const quest = createDefaultQuest(chapterId, 'Quest 1', { x: 100, y: 100 })
      useEditorStore.getState().addQuest(quest)

      const undoStackBefore = useEditorStore.getState().history.undoStack.length

      useEditorStore.getState().applyAutoLayout()

      const undoStackAfter = useEditorStore.getState().history.undoStack.length

      expect(undoStackAfter).toBe(undoStackBefore + 1)
    })

    it('should clear redo stack when applying layout', () => {
      const quest = createDefaultQuest(chapterId, 'Quest 1', { x: 100, y: 100 })
      useEditorStore.getState().addQuest(quest)

      // Populate redo stack
      useEditorStore.setState((state) => {
        state.history.redoStack = [state.snapshot!]
      })

      expect(useEditorStore.getState().history.redoStack.length).toBeGreaterThan(0)

      useEditorStore.getState().applyAutoLayout()

      expect(useEditorStore.getState().history.redoStack.length).toBe(0)
    })

    it('should mark snapshot as dirty after layout', () => {
      const quest = createDefaultQuest(chapterId, 'Quest 1', { x: 100, y: 100 })
      useEditorStore.getState().addQuest(quest)
      useEditorStore.getState().markClean()

      expect(useEditorStore.getState().isDirty).toBe(false)

      useEditorStore.getState().applyAutoLayout()

      expect(useEditorStore.getState().isDirty).toBe(true)
    })

    it('should be undoable', () => {
      const quest1 = createDefaultQuest(chapterId, 'Quest 1', { x: 100, y: 100 })
      const quest2 = createDefaultQuest(chapterId, 'Quest 2', { x: 200, y: 200 })

      useEditorStore.getState().addQuest(quest1)
      useEditorStore.getState().addQuest(quest2)

      // Add dependency
      useEditorStore.setState((state) => {
        if (state.snapshot) {
          state.snapshot.dependencies.push({
            fromQuestId: quest1.id,
            toQuestId: quest2.id,
          })
        }
      })

      // Get original positions
      const beforeLayout = useEditorStore
        .getState()
        .snapshot?.quests.map((q) => ({ id: q.id, pos: { ...q.position } }))

      // Apply layout
      useEditorStore.getState().applyAutoLayout()

      const afterLayout = useEditorStore
        .getState()
        .snapshot?.quests.map((q) => ({ id: q.id, pos: { ...q.position } }))

      // Undo the layout
      useEditorStore.getState().undo()

      const afterUndo = useEditorStore
        .getState()
        .snapshot?.quests.map((q) => ({ id: q.id, pos: { ...q.position } }))

      // After undo, positions should match before layout (within reason)
      expect(afterUndo).toEqual(beforeLayout)
    })

    it('should handle empty chapter gracefully', () => {
      const state = useEditorStore.getState()
      expect(state.snapshot?.quests.length).toBe(0)

      // Should not throw or cause issues
      useEditorStore.getState().applyAutoLayout()

      expect(useEditorStore.getState().snapshot?.quests.length).toBe(0)
    })

    it('should only layout quests in active chapter', () => {
      // Create a second chapter
      const chapter2 = createDefaultChapter('Chapter 2', 1)
      useEditorStore.getState().addChapter(chapter2)

      // Add quests to first chapter
      const quest1 = createDefaultQuest(chapterId, 'Quest 1', { x: 100, y: 100 })
      useEditorStore.getState().addQuest(quest1)

      // Add quests to second chapter
      const quest2 = createDefaultQuest(chapter2.id, 'Quest 2', { x: 200, y: 200 })
      useEditorStore.setState((state) => {
        if (state.snapshot) {
          state.snapshot.quests.push(quest2)
        }
      })

      // Select first chapter
      useEditorStore.getState().selectChapter(chapterId)

      const quest2OriginalPos = { ...quest2.position }

      // Apply layout to first chapter
      useEditorStore.getState().applyAutoLayout()

      // Quest2 should not have moved
      const updatedQuest2 = useEditorStore.getState().snapshot?.quests.find((q) => q.id === quest2.id)
      expect(updatedQuest2?.position).toEqual(quest2OriginalPos)
    })

    it('should update timestamp when applying layout', () => {
      const quest = createDefaultQuest(chapterId, 'Quest 1', { x: 100, y: 100 })
      useEditorStore.getState().addQuest(quest)

      const beforeLayout = useEditorStore.getState().snapshot?.metadata.updatedAt

      // Small delay to ensure timestamp changes
      const beforeTime = new Date().toISOString()
      useEditorStore.getState().applyAutoLayout()
      const afterTime = new Date().toISOString()

      const afterLayout = useEditorStore.getState().snapshot?.metadata.updatedAt

      expect(afterLayout).not.toBe(beforeLayout)
      expect(afterLayout).toBeGreaterThanOrEqual(beforeTime)
      expect(afterLayout).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('arranging state', () => {
    it('should set arranging state', () => {
      expect(useEditorStore.getState().isArranging).toBe(false)

      useEditorStore.getState().setArranging(true)
      expect(useEditorStore.getState().isArranging).toBe(true)

      useEditorStore.getState().setArranging(false)
      expect(useEditorStore.getState().isArranging).toBe(false)
    })
  })
})
