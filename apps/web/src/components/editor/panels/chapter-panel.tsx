'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { createDefaultChapter } from '@mcquest/schema'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useChapters,
  useQuests,
  useSelectedChapterId,
  useEditorStore,
} from '@/lib/store/editor-store'
import { ChapterItem } from './chapter-item'
import type { Chapter } from '@mcquest/schema'

/**
 * ChapterPanel - Chapter selector sidebar panel
 *
 * Displays a list of chapters sorted by order with the following functionality:
 * - Lists chapters sorted by order
 * - Active chapter highlighted
 * - Click switches active chapter
 * - Add chapter button (creates new chapter)
 * - Delete chapter (with confirmation)
 *
 * Acceptance criteria from Issue #27:
 * - Lists chapters sorted by order
 * - Active chapter highlighted
 * - Click switches active chapter
 * - Add chapter button (creates new chapter)
 * - Delete chapter (with confirmation)
 */
export function ChapterPanel() {
  const chapters = useChapters()
  const quests = useQuests()
  const selectedChapterId = useSelectedChapterId()
  const selectChapter = useEditorStore((state) => state.selectChapter)
  const addChapter = useEditorStore((state) => state.addChapter)
  const deleteChapter = useEditorStore((state) => state.deleteChapter)

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [chapterToDelete, setChapterToDelete] = React.useState<Chapter | null>(null)

  // Sort chapters by order
  const sortedChapters = React.useMemo(() => {
    return [...chapters].sort((a, b) => a.order - b.order)
  }, [chapters])

  // Get quest count per chapter
  // Compute counts directly without memoization to avoid infinite loop
  // The computation is fast enough and prevents dependency chain issues
  const questCountByChapter: Record<string, number> = {}
  for (const quest of quests) {
    questCountByChapter[quest.chapterId] = (questCountByChapter[quest.chapterId] ?? 0) + 1
  }

  const handleAddChapter = () => {
    // Calculate next order number
    const maxOrder = sortedChapters.length > 0
      ? Math.max(...sortedChapters.map((c) => c.order))
      : -1

    const newChapter = createDefaultChapter(
      `Chapter ${sortedChapters.length + 1}`,
      maxOrder + 1
    )

    addChapter(newChapter)
    // Select the newly created chapter
    selectChapter(newChapter.id)
  }

  const handleSelectChapter = (chapterId: string) => {
    selectChapter(chapterId)
  }

  const handleDeleteRequest = (chapterId: string) => {
    const chapter = chapters.find((c) => c.id === chapterId)
    if (chapter) {
      setChapterToDelete(chapter)
      setDeleteDialogOpen(true)
    }
  }

  const handleConfirmDelete = () => {
    if (chapterToDelete) {
      deleteChapter(chapterToDelete.id)
    }
    setDeleteDialogOpen(false)
    setChapterToDelete(null)
  }

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false)
    setChapterToDelete(null)
  }

  const questCount = chapterToDelete ? questCountByChapter[chapterToDelete.id] ?? 0 : 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-sm font-semibold">Chapters</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleAddChapter}
          aria-label="Add new chapter"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Chapter list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedChapters.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No chapters yet.
              <br />
              Click + to add one.
            </div>
          ) : (
            sortedChapters.map((chapter) => (
              <ChapterItem
                key={chapter.id}
                chapter={chapter}
                isActive={chapter.id === selectedChapterId}
                questCount={questCountByChapter[chapter.id] ?? 0}
                onSelect={handleSelectChapter}
                onDelete={handleDeleteRequest}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chapter</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{chapterToDelete?.title}&quot;?
              {questCount > 0 && (
                <>
                  {' '}
                  This will also delete {questCount} {questCount === 1 ? 'quest' : 'quests'} and
                  their dependencies.
                </>
              )}
              <br />
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
