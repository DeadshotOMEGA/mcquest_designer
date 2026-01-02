import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChapterPanel } from './chapter-panel'
import { useEditorStore } from '@/lib/store/editor-store'
import { createDefaultSnapshot } from '@/lib/editor/default-snapshot'
import { createDefaultChapter } from '@mcquest/schema'

describe('ChapterPanel', () => {
  beforeEach(() => {
    // Reset store before each test
    const snapshot = createDefaultSnapshot('Test Project')
    useEditorStore.setState({
      projectId: 'test-project',
      snapshot,
      selection: {
        selectedChapterId: snapshot.chapters[0]!.id,
        selectedQuestId: null,
      },
      isDirty: false,
      lastSavedAt: null,
    })
  })

  it('should render chapter list', () => {
    render(<ChapterPanel />)

    expect(screen.getByText('Chapters')).toBeInTheDocument()
    expect(screen.getByText('Main')).toBeInTheDocument()
  })

  it('should show "No chapters yet" message when list is empty', () => {
    useEditorStore.setState((state) => {
      if (state.snapshot) {
        state.snapshot.chapters = []
      }
    })

    render(<ChapterPanel />)

    expect(screen.getByText(/No chapters yet/)).toBeInTheDocument()
    expect(screen.getByText(/Click \+ to add one/)).toBeInTheDocument()
  })

  it('should highlight active chapter', () => {
    render(<ChapterPanel />)

    const mainChapter = screen.getByText('Main').closest('button')
    expect(mainChapter).toHaveClass('bg-accent')
  })

  it('should add a new chapter when plus button is clicked', async () => {
    const user = userEvent.setup()
    render(<ChapterPanel />)

    const addButton = screen.getByRole('button', { name: /add new chapter/i })
    await user.click(addButton)

    const state = useEditorStore.getState()
    expect(state.snapshot?.chapters).toHaveLength(2)
    expect(state.snapshot?.chapters[1]?.title).toBe('Chapter 2')
  })

  it('should switch active chapter when clicking on a chapter', async () => {
    // Add a second chapter
    const newChapter = createDefaultChapter('Chapter 2', 1)
    useEditorStore.getState().addChapter(newChapter)

    const user = userEvent.setup()
    render(<ChapterPanel />)

    const chapter2Button = screen.getByText('Chapter 2')
    await user.click(chapter2Button)

    const state = useEditorStore.getState()
    expect(state.selection.selectedChapterId).toBe(newChapter.id)
  })

  it('should show delete confirmation dialog', async () => {
    const user = userEvent.setup()
    render(<ChapterPanel />)

    // Hover over chapter to show delete button
    const chapterItem = screen.getByText('Main').closest('button')
    if (!chapterItem) throw new Error('Chapter item not found')

    await user.hover(chapterItem)

    // Find and click delete button
    const deleteButton = screen.getByRole('button', { name: /delete chapter/i })
    await user.click(deleteButton)

    // Dialog should appear
    expect(screen.getByText(/Delete Chapter/i)).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
  })

  it('should cancel deletion when clicking cancel', async () => {
    const user = userEvent.setup()
    render(<ChapterPanel />)

    // Hover and click delete
    const chapterItem = screen.getByText('Main').closest('button')
    if (!chapterItem) throw new Error('Chapter item not found')

    await user.hover(chapterItem)
    const deleteButton = screen.getByRole('button', { name: /delete chapter/i })
    await user.click(deleteButton)

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    // Chapter should still exist
    const state = useEditorStore.getState()
    expect(state.snapshot?.chapters).toHaveLength(1)

    // Dialog should be closed
    expect(screen.queryByText(/Delete Chapter/i)).not.toBeInTheDocument()
  })

  it('should delete chapter when confirming deletion', async () => {
    const user = userEvent.setup()
    render(<ChapterPanel />)

    // Hover and click delete
    const chapterItem = screen.getByText('Main').closest('button')
    if (!chapterItem) throw new Error('Chapter item not found')

    await user.hover(chapterItem)
    const deleteButton = screen.getByRole('button', { name: /delete chapter/i })
    await user.click(deleteButton)

    // Click delete
    const confirmButton = screen.getByRole('button', { name: /^delete$/i })
    await user.click(confirmButton)

    // Chapter should be deleted
    const state = useEditorStore.getState()
    expect(state.snapshot?.chapters).toHaveLength(0)
  })

  it('should show quest count for each chapter', () => {
    // Add a quest to the chapter
    const snapshot = useEditorStore.getState().snapshot
    const chapterId = snapshot?.chapters[0]?.id

    if (!chapterId) throw new Error('No chapter found')

    useEditorStore.setState((state) => {
      if (state.snapshot) {
        state.snapshot.quests.push({
          id: 'quest-1',
          chapterId,
          title: 'Test Quest',
          subtitle: '',
          description: '',
          position: { x: 0, y: 0 },
          tasks: [],
          rewards: [],
          dependencies: [],
          settings: {
            repeatable: false,
            hidden: false,
            optional: false,
            requireAllDependencies: false,
            shape: 'default',
            size: 1,
          },
        })
      }
    })

    render(<ChapterPanel />)

    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('should sort chapters by order', () => {
    // Add chapters out of order
    useEditorStore.setState((state) => {
      if (state.snapshot) {
        state.snapshot.chapters = [
          createDefaultChapter('Chapter C', 2),
          createDefaultChapter('Chapter A', 0),
          createDefaultChapter('Chapter B', 1),
        ]
      }
    })

    render(<ChapterPanel />)

    const chapterItems = screen.getAllByRole('button', { name: /chapter/i })
    expect(chapterItems[0]).toHaveTextContent('Chapter A')
    expect(chapterItems[1]).toHaveTextContent('Chapter B')
    expect(chapterItems[2]).toHaveTextContent('Chapter C')
  })

  it('should show warning when deleting chapter with quests', async () => {
    const snapshot = useEditorStore.getState().snapshot
    const chapterId = snapshot?.chapters[0]?.id

    if (!chapterId) throw new Error('No chapter found')

    // Add quests to the chapter
    useEditorStore.setState((state) => {
      if (state.snapshot) {
        state.snapshot.quests = [
          {
            id: 'quest-1',
            chapterId,
            title: 'Quest 1',
            subtitle: '',
            description: '',
            position: { x: 0, y: 0 },
            tasks: [],
            rewards: [],
            dependencies: [],
            settings: {
              repeatable: false,
              hidden: false,
              optional: false,
              requireAllDependencies: false,
              shape: 'default',
              size: 1,
            },
          },
          {
            id: 'quest-2',
            chapterId,
            title: 'Quest 2',
            subtitle: '',
            description: '',
            position: { x: 100, y: 100 },
            tasks: [],
            rewards: [],
            dependencies: [],
            settings: {
              repeatable: false,
              hidden: false,
              optional: false,
              requireAllDependencies: false,
              shape: 'default',
              size: 1,
            },
          },
        ]
      }
    })

    const user = userEvent.setup()
    render(<ChapterPanel />)

    // Hover and click delete
    const chapterItem = screen.getByText('Main').closest('button')
    if (!chapterItem) throw new Error('Chapter item not found')

    await user.hover(chapterItem)
    const deleteButton = screen.getByRole('button', { name: /delete chapter/i })
    await user.click(deleteButton)

    // Should show warning about quests
    expect(screen.getByText(/This will also delete 2 quests/)).toBeInTheDocument()
  })
})

// Export to satisfy linting rules
export {}
