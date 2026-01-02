'use client'

import * as React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Chapter, Quest } from '@mcquest/schema'
import { Panel } from './text-editor-layout'
import { TreeNode } from './tree-node'
import { useTreeUIStore, useExpandedChapterIds, useSelectedEntity } from '@/lib/store/tree-state'
import { useChapters, useChapterQuests, useEditorStore } from '@/lib/store/editor-store'
import { useSearch, useSearchResults } from '@/lib/store/search-store'
import { useValidationErrors } from '@/lib/validation/use-validation-aggregator'
import { SearchBar } from './search-bar'
import { FilterDropdown } from './filter-dropdown'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Flattened tree item for virtualization
 */
interface FlatTreeItem {
  id: string
  type: 'chapter' | 'quest'
  entity: Chapter | Quest
  depth: number
}

/**
 * Props for SidebarTree component
 */
interface SidebarTreeProps {
  /**
   * Optional callback when a quest is selected
   */
  onSelectQuest?: (questId: string) => void

  /**
   * Optional callback when a chapter is selected
   */
  onSelectChapter?: (chapterId: string) => void

  /**
   * Optional error count per entity (entityId -> count)
   */
  errorCounts?: Record<string, number>
}

/**
 * SidebarTree Component
 *
 * Virtualized tree navigation for chapters and quests using @tanstack/react-virtual.
 * Handles:
 * - Expand/collapse chapters
 * - Selection highlighting
 * - Keyboard navigation (arrow keys, enter to select)
 * - Performance: renders 600+ items smoothly (<16ms per frame)
 * - Integrated search and filtering
 * - Auto-expand chapters containing search results
 *
 * Architecture:
 * 1. Search bar at top with debounced input (300ms)
 * 2. Filter dropdown with composable criteria
 * 3. Flatten tree structure with chapters and quests
 * 4. Filter items based on search results when active
 * 5. Use react-virtual to virtualize the flattened list
 * 6. Track expanded/selected state in tree-state.ts store
 * 7. Sync selection with editor-store for quest/chapter details
 */
export const SidebarTree = React.forwardRef<HTMLDivElement, SidebarTreeProps>(
  ({ onSelectQuest, onSelectChapter, errorCounts: providedErrorCounts = {} }, ref) => {
    const chapters = useChapters()
    const expandedChapterIds = useExpandedChapterIds()
    const { toggleChapter, selectEntity } = useTreeUIStore(
      (state) => ({
        toggleChapter: state.toggleChapter,
        selectEntity: state.selectEntity,
      })
    )
    const selectedEntity = useSelectedEntity()
    const { selectQuest, selectChapter } = useEditorStore((state) => ({
      selectQuest: state.selectQuest,
      selectChapter: state.selectChapter,
    }))
    const { searchQuery } = useSearch()
    const searchResults = useSearchResults()

    // Get validation errors from the store
    const validationErrors = useValidationErrors()

    // Use provided error counts if available, otherwise use aggregated validation errors
    const errorCounts = providedErrorCounts && Object.keys(providedErrorCounts).length > 0
      ? providedErrorCounts
      : validationErrors

    // Get quests for each chapter
    const questsByChapter = React.useMemo(
      () => {
        const map = new Map<string, Quest[]>()
        for (const chapter of chapters) {
          const chapterQuests = useChapterQuests(chapter.id)
          map.set(chapter.id, chapterQuests)
        }
        return map
      },
      [chapters]
    )

    // When search is active, auto-expand chapters containing results
    React.useEffect(() => {
      if (searchQuery && searchResults.length > 0) {
        const chaptersToExpand = new Set<string>()
        for (const result of searchResults) {
          if (result.type === 'chapter') {
            chaptersToExpand.add(result.id)
          } else if (result.type === 'quest') {
            // Find chapter for this quest
            const quest = chapters
              .flatMap((c) => questsByChapter.get(c.id) || [])
              .find((q) => q.id === result.id)
            if (quest) {
              chaptersToExpand.add(quest.chapterId)
            }
          }
        }

        // Update expanded chapters
        if (chaptersToExpand.size > 0) {
          const newExpanded = new Set(expandedChapterIds)
          for (const chapterId of chaptersToExpand) {
            newExpanded.add(chapterId)
          }
          useTreeUIStore.setState({ expandedChapterIds: newExpanded })
        }
      }
    }, [searchQuery, searchResults, chapters, questsByChapter])

    // Build flattened tree structure
    const flatItems = React.useMemo(() => {
      const items: FlatTreeItem[] = []

      // If search is active, only show items in search results
      if (searchQuery && searchResults.length > 0) {
        const resultIds = new Set(searchResults.map((r) => r.id))

        for (const chapter of chapters) {
          if (resultIds.has(chapter.id)) {
            // Add chapter from search results
            items.push({
              id: chapter.id,
              type: 'chapter',
              entity: chapter,
              depth: 0,
            })

            // Add matching quests under this chapter
            const chapterQuests = questsByChapter.get(chapter.id) || []
            for (const quest of chapterQuests) {
              if (resultIds.has(quest.id)) {
                items.push({
                  id: quest.id,
                  type: 'quest',
                  entity: quest,
                  depth: 1,
                })
              }
            }
          } else {
            // Chapter not in results, but check if any quests are
            const chapterQuests = questsByChapter.get(chapter.id) || []
            const hasMatchingQuests = chapterQuests.some((q) => resultIds.has(q.id))

            if (hasMatchingQuests) {
              // Add the chapter header (for grouping)
              items.push({
                id: chapter.id,
                type: 'chapter',
                entity: chapter,
                depth: 0,
              })

              // Add only matching quests
              for (const quest of chapterQuests) {
                if (resultIds.has(quest.id)) {
                  items.push({
                    id: quest.id,
                    type: 'quest',
                    entity: quest,
                    depth: 1,
                  })
                }
              }
            }
          }
        }
      } else {
        // No search - show full tree
        for (const chapter of chapters) {
          // Add chapter
          items.push({
            id: chapter.id,
            type: 'chapter',
            entity: chapter,
            depth: 0,
          })

          // Add quests if chapter is expanded
          if (expandedChapterIds.has(chapter.id)) {
            const chapterQuests = questsByChapter.get(chapter.id) || []
            for (const quest of chapterQuests) {
              items.push({
                id: quest.id,
                type: 'quest',
                entity: quest,
                depth: 1,
              })
            }
          }
        }
      }

      return items
    }, [chapters, expandedChapterIds, questsByChapter, searchQuery, searchResults])

    // Virtualization
    const parentRef = React.useRef<HTMLDivElement>(null)
    const virtualizer = useVirtualizer({
      count: flatItems.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 32, // Approximate height of each item
      overscan: 10, // Render 10 items beyond visible area
    })

    const virtualItems = virtualizer.getVirtualItems()
    const totalSize = virtualizer.getTotalSize()

    // Handle entity selection
    const handleSelectEntity = (entityId: string, type: 'chapter' | 'quest') => {
      selectEntity(entityId, type)

      if (type === 'chapter') {
        selectChapter(entityId)
        onSelectChapter?.(entityId)
      } else {
        selectQuest(entityId)
        onSelectQuest?.(entityId)
      }
    }

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!selectedEntity.id) return

      const currentIndex = flatItems.findIndex((item) => item.id === selectedEntity.id)
      if (currentIndex === -1) return

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          const nextIndex = Math.min(currentIndex + 1, flatItems.length - 1)
          const nextItem = flatItems[nextIndex]
          if (nextItem) {
            handleSelectEntity(nextItem.id, nextItem.type)
            // Scroll into view
            virtualizer.measureElement(
              typeof window !== 'undefined' ? document.getElementById(`tree-item-${nextItem.id}`) : null
            )
          }
          break
        }

        case 'ArrowUp': {
          e.preventDefault()
          const prevIndex = Math.max(currentIndex - 1, 0)
          const prevItem = flatItems[prevIndex]
          if (prevItem) {
            handleSelectEntity(prevItem.id, prevItem.type)
            // Scroll into view
            virtualizer.measureElement(
              typeof window !== 'undefined' ? document.getElementById(`tree-item-${prevItem.id}`) : null
            )
          }
          break
        }

        case 'ArrowRight': {
          e.preventDefault()
          const item = flatItems[currentIndex]
          if (item?.type === 'chapter' && !expandedChapterIds.has(item.id)) {
            toggleChapter(item.id)
          }
          break
        }

        case 'ArrowLeft': {
          e.preventDefault()
          const item = flatItems[currentIndex]
          if (item?.type === 'chapter' && expandedChapterIds.has(item.id)) {
            toggleChapter(item.id)
          } else if (item?.type === 'quest') {
            // Select parent chapter
            const quest = item.entity as Quest
            handleSelectEntity(quest.chapterId, 'chapter')
          }
          break
        }

        case 'Enter':
        case ' ': {
          e.preventDefault()
          const item = flatItems[currentIndex]
          if (item) {
            if (item.type === 'chapter') {
              toggleChapter(item.id)
            }
          }
          break
        }
      }
    }

    // Expand all chapters
    const handleExpandAll = () => {
      const allChapterIds = new Set(chapters.map((c) => c.id))
      useTreeUIStore.setState({ expandedChapterIds: allChapterIds })
    }

    // Collapse all chapters
    const handleCollapseAll = () => {
      useTreeUIStore.setState({ expandedChapterIds: new Set() })
    }

    return (
      <Panel ref={ref} title="Chapters & Quests">
        {/* Search and Filter Bar */}
        <div className="flex flex-col gap-2 px-4 py-3 border-b">
          <SearchBar placeholder="Search quests and chapters..." />
          <div className="flex items-center justify-between gap-2">
            <FilterDropdown />
            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleExpandAll}
                title="Expand all chapters"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleCollapseAll}
                title="Collapse all chapters"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tree Items */}
        <div
          ref={parentRef}
          className="flex flex-col h-full w-full overflow-y-auto overflow-x-hidden"
          onKeyDown={handleKeyDown}
        >
          <div
            style={{
              height: `${totalSize}px`,
            }}
            className="relative w-full"
          >
            {virtualItems.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No chapters or quests
              </div>
            ) : (
              virtualItems.map((virtualItem) => {
                const item = flatItems[virtualItem.index]
                if (!item) return null

                return (
                  <div
                    key={item.id}
                    id={`tree-item-${item.id}`}
                    data-index={virtualItem.index}
                    className="absolute top-0 left-0 w-full"
                    style={{
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <TreeNode
                      entity={item.entity}
                      type={item.type}
                      isSelected={selectedEntity.id === item.id}
                      isExpanded={
                        item.type === 'chapter' ? expandedChapterIds.has(item.id) : undefined
                      }
                      onToggleExpand={() => toggleChapter(item.id)}
                      onSelect={handleSelectEntity}
                      errorCount={errorCounts[item.id]}
                      depth={item.depth}
                      isSearchHighlight={
                        !!(searchQuery && searchResults.some((r) => r.id === item.id))
                      }
                    />
                  </div>
                )
              })
            )}
          </div>
        </div>
      </Panel>
    )
  }
)

SidebarTree.displayName = 'SidebarTree'
