'use client'

import * as React from 'react'
import { MoreHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSearch } from '@/lib/store/search-store'
import { useChapters } from '@/lib/store/editor-store'
import { Badge } from '@/components/ui/badge'

/**
 * Props for FilterDropdown component
 */
interface FilterDropdownProps {
  className?: string
}

/**
 * FilterDropdown Component
 *
 * Features:
 * - Filter by chapter (multi-select capable for future)
 * - Filter by quest type (extensible)
 * - Filter by completion status (placeholder)
 * - Show active filters as badges
 * - Clear individual filters or all filters
 *
 * The filter criteria are applied in combination with search:
 * - Results must match BOTH search query AND all active filters
 */
export const FilterDropdown = React.forwardRef<HTMLButtonElement, FilterDropdownProps>(
  ({ className }, ref) => {
    const { filterCriteria, setFilterCriteria, clearFilters } = useSearch()
    const chapters = useChapters()
    const [open, setOpen] = React.useState(false)

    const selectedChapter = chapters.find((c) => c.id === filterCriteria.chapterId)
    const hasActiveFilters = Object.values(filterCriteria).some((v) => v !== undefined && v !== 'all')

    // Handle chapter filter toggle
    const handleChapterChange = (chapterId: string | null) => {
      setFilterCriteria({
        chapterId: chapterId ?? undefined,
      })
      // Note: Search results will update automatically through useSearch hook
    }

    // Handle quest type filter
    const handleQuestTypeChange = (type: string) => {
      const newType = filterCriteria.questType === type ? 'any' : (type as 'any' | 'standard')
      setFilterCriteria({
        questType: newType,
      })
    }

    // Handle completion status filter
    const handleStatusChange = (status: string) => {
      const newStatus =
        filterCriteria.completionStatus === status
          ? 'all'
          : (status as 'all' | 'completed' | 'incomplete')
      setFilterCriteria({
        completionStatus: newStatus,
      })
    }

    return (
      <div className={`flex items-center gap-2 ${className ?? ''}`}>
        {/* Filter Button with Dropdown */}
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant={hasActiveFilters ? 'default' : 'outline'}
              size="sm"
              className="h-9 px-2 relative"
              ref={ref}
              title="Filter quests and chapters"
              aria-label={
                hasActiveFilters ? `Filters active (${Object.keys(filterCriteria).length})` : 'Add filters'
              }
            >
              <MoreHorizontal className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {Object.values(filterCriteria).filter((v) => v !== undefined && v !== 'all')
                    .length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            {/* Chapter Filter */}
            <DropdownMenuLabel className="text-xs font-semibold">Chapter</DropdownMenuLabel>
            {chapters.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">No chapters</div>
            ) : (
              <>
                <DropdownMenuCheckboxItem
                  checked={!filterCriteria.chapterId}
                  onCheckedChange={() => handleChapterChange(null)}
                  className="text-sm"
                >
                  All Chapters
                </DropdownMenuCheckboxItem>
                {chapters.map((chapter) => (
                  <DropdownMenuCheckboxItem
                    key={chapter.id}
                    checked={filterCriteria.chapterId === chapter.id}
                    onCheckedChange={() => handleChapterChange(chapter.id)}
                    className="text-sm"
                  >
                    {chapter.title}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}

            <DropdownMenuSeparator />

            {/* Quest Type Filter (Future) */}
            <DropdownMenuLabel className="text-xs font-semibold">Type</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={filterCriteria.questType === 'any' || !filterCriteria.questType}
              onCheckedChange={() => handleQuestTypeChange('any')}
              className="text-sm"
            >
              Any Type
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filterCriteria.questType === 'standard'}
              onCheckedChange={() => handleQuestTypeChange('standard')}
              className="text-sm"
            >
              Standard
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />

            {/* Completion Status Filter (Placeholder) */}
            <DropdownMenuLabel className="text-xs font-semibold">Status</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={filterCriteria.completionStatus === 'all' || !filterCriteria.completionStatus}
              onCheckedChange={() => handleStatusChange('all')}
              className="text-sm"
            >
              All
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filterCriteria.completionStatus === 'completed'}
              onCheckedChange={() => handleStatusChange('completed')}
              className="text-sm"
              disabled
            >
              Completed
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filterCriteria.completionStatus === 'incomplete'}
              onCheckedChange={() => handleStatusChange('incomplete')}
              className="text-sm"
              disabled
            >
              Incomplete
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs h-8 text-destructive hover:text-destructive"
                onClick={() => {
                  clearFilters()
                  setOpen(false)
                }}
              >
                <X className="h-3 w-3 mr-2" />
                Clear All Filters
              </Button>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1 flex-wrap">
            {selectedChapter && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5 gap-1">
                {selectedChapter.title}
                <button
                  onClick={() => handleChapterChange(null)}
                  className="ml-1 hover:text-destructive"
                  aria-label={`Remove ${selectedChapter.title} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filterCriteria.questType && filterCriteria.questType !== 'any' && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5 gap-1">
                Type: {filterCriteria.questType}
                <button
                  onClick={() => setFilterCriteria({ questType: 'any' })}
                  className="ml-1 hover:text-destructive"
                  aria-label="Remove type filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filterCriteria.completionStatus &&
              filterCriteria.completionStatus !== 'all' && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 gap-1">
                  Status: {filterCriteria.completionStatus}
                  <button
                    onClick={() => setFilterCriteria({ completionStatus: 'all' })}
                    className="ml-1 hover:text-destructive"
                    aria-label="Remove status filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
          </div>
        )}
      </div>
    )
  }
)

FilterDropdown.displayName = 'FilterDropdown'
