'use client'

import * as React from 'react'
import { ChevronRight, BookOpen, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ValidationBadge } from './validation-badge'
import type { Chapter, Quest } from '@mcquest/schema'

/**
 * Props for TreeNode component
 */
interface TreeNodeProps {
  /** The entity (chapter or quest) this node represents */
  entity: Chapter | Quest
  /** Whether this is a chapter or quest node */
  type: 'chapter' | 'quest'
  /** Whether this node is currently selected */
  isSelected: boolean
  /** Whether the chapter is expanded (only for chapters) */
  isExpanded?: boolean
  /** Callback when the chapter expand/collapse chevron is clicked */
  onToggleExpand?: () => void
  /** Callback when the node is selected */
  onSelect: (entityId: string, type: 'chapter' | 'quest') => void
  /** Optional error badge count for validation */
  errorCount?: number
  /** The depth level in the tree (for indentation) */
  depth: number
  /** Whether this node is highlighted in search results */
  isSearchHighlight?: boolean
}

/**
 * TreeNode Component
 *
 * Renders a single node in the chapter/quest tree. Supports:
 * - Chapters with expand/collapse chevron
 * - Quests nested under chapters
 * - Selection highlighting
 * - Error badges
 * - Proper indentation based on depth
 *
 * Accepts keyboard events but actual navigation is handled by parent.
 */
export const TreeNode = React.forwardRef<HTMLDivElement, TreeNodeProps>(
  (
    {
      entity,
      type,
      isSelected,
      isExpanded,
      onToggleExpand,
      onSelect,
      errorCount,
      depth,
      isSearchHighlight,
    },
    ref
  ) => {
    const isChapter = type === 'chapter'
    const chapter = entity as Chapter
    const quest = entity as Quest

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onSelect(entity.id, type)
    }

    const handleChevronClick = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onToggleExpand?.()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Allow parent virtualizer to handle keyboard navigation
      // Individual node just triggers selection on Enter
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onSelect(entity.id, type)
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex items-center gap-1 px-2 py-1 text-sm select-none',
          'hover:bg-accent/50 transition-colors',
          isSelected && 'bg-primary/15 border-l-2 border-primary',
          isSearchHighlight && 'bg-yellow-100/50 dark:bg-yellow-900/20',
          isChapter && 'font-medium'
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={isSelected ? 0 : -1}
        aria-selected={isSelected}
      >
        {/* Indentation based on depth */}
        <div style={{ width: `${Math.max(0, depth - 1) * 16}px` }} />

        {/* Expand/Collapse Chevron (chapters only) */}
        {isChapter && (
          <button
            className={cn(
              'inline-flex items-center justify-center flex-shrink-0',
              'h-5 w-5 rounded hover:bg-background/50 transition-colors',
              isExpanded && 'rotate-90'
            )}
            onClick={handleChevronClick}
            tabIndex={-1}
            aria-expanded={isExpanded}
            aria-hidden="true"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        {/* Icon spacer for quests (they don't have chevron) */}
        {!isChapter && <div className="w-5" />}

        {/* Icon */}
        <div className="inline-flex items-center justify-center flex-shrink-0">
          {isChapter ? (
            <BookOpen className="h-4 w-4 text-blue-500" />
          ) : (
            <ClipboardList className="h-4 w-4 text-green-500" />
          )}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <span className="truncate block text-foreground">
            {isChapter ? chapter.title : quest.title}
          </span>
        </div>

        {/* Validation Badge */}
        {errorCount && errorCount > 0 && (
          <ValidationBadge count={errorCount} severity="error" className="ml-2 flex-shrink-0" />
        )}
      </div>
    )
  }
)

TreeNode.displayName = 'TreeNode'
