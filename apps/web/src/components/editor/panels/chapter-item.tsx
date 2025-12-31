'use client'

import * as React from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Chapter } from '@mcquest/schema'

interface ChapterItemProps {
  chapter: Chapter
  isActive: boolean
  questCount: number
  onSelect: (chapterId: string) => void
  onDelete: (chapterId: string) => void
}

/**
 * ChapterItem - Individual chapter list item
 *
 * Displays a chapter with its title, quest count, and delete action.
 * Highlights active chapter with different background.
 */
export function ChapterItem({
  chapter,
  isActive,
  questCount,
  onSelect,
  onDelete,
}: ChapterItemProps) {
  const handleClick = () => {
    onSelect(chapter.id)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(chapter.id)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      className={cn(
        'group flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm cursor-pointer transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
      )}
      aria-pressed={isActive}
      aria-label={`Chapter: ${chapter.title}${isActive ? ' (active)' : ''}`}
    >
      <div className="flex flex-col min-w-0 flex-1">
        <span className="truncate font-medium">{chapter.title}</span>
        <span className="text-xs text-muted-foreground">
          {questCount} {questCount === 1 ? 'quest' : 'quests'}
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={handleDeleteClick}
        aria-label={`Delete chapter: ${chapter.title}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
