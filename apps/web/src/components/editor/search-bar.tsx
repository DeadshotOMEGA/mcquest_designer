'use client'

import * as React from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSearch } from '@/lib/store/search-store'
import { useChapters, useQuests } from '@/lib/store/editor-store'
import { searchAndFilter } from '@/lib/search/fuzzy-search'

/**
 * Props for SearchBar component
 */
interface SearchBarProps {
  className?: string
  placeholder?: string
}

/**
 * SearchBar Component
 *
 * Features:
 * - Real-time search input with debouncing (300ms)
 * - Integrated with search store for filter criteria
 * - Shows result count when searching
 * - Clear button with Escape key support
 * - Keyboard accessible
 *
 * Debouncing:
 * - Input changes trigger delayed search computation
 * - Prevents excessive re-renders and search operations
 * - 300ms delay balances responsiveness with performance
 */
export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, placeholder = 'Search quests and chapters...' }, ref) => {
    const {
      searchQuery,
      setSearchQuery,
      filterCriteria,
      setSearchResults,
      setIsSearching,
      searchResults,
    } = useSearch()

    const chapters = useChapters()
    const quests = useQuests()

    // Debounce timer ref
    const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null)

    // Perform search with current criteria
    const performSearch = React.useCallback(
      (query: string) => {
        setIsSearching(true)

        try {
          const results = searchAndFilter(chapters, quests, query, filterCriteria, {
            threshold: 0.2, // Lower threshold for more results
          })
          setSearchResults(results)
        } finally {
          setIsSearching(false)
        }
      },
      [chapters, quests, filterCriteria, setSearchResults, setIsSearching]
    )

    // Handle input change with debouncing
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newQuery = e.currentTarget.value
      setSearchQuery(newQuery)

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Set new timer for debounced search
      debounceTimerRef.current = setTimeout(() => {
        performSearch(newQuery)
      }, 300) // 300ms debounce delay
    }

    // Handle clear button
    const handleClear = () => {
      setSearchQuery('')
      setSearchResults([])
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }

    // Handle Escape key
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape' && searchQuery) {
        e.preventDefault()
        handleClear()
      }
    }

    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }
      }
    }, [])

    return (
      <div className={cn('relative w-full', className)}>
        <div className="relative flex items-center">
          {/* Search Icon */}
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />

          {/* Input Field */}
          <Input
            ref={ref}
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="pl-9 pr-10 py-2 h-9 text-sm rounded"
            aria-label="Search quests and chapters"
            aria-describedby={searchResults.length > 0 ? 'search-result-count' : undefined}
          />

          {/* Clear Button */}
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 h-6 w-6 p-0"
              onClick={handleClear}
              title="Clear search (ESC)"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Result Count */}
        {searchQuery && searchResults.length > 0 && (
          <div
            id="search-result-count"
            className="absolute -bottom-5 left-0 text-xs text-muted-foreground pointer-events-none"
          >
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* No Results Message */}
        {searchQuery && searchResults.length === 0 && (
          <div
            id="search-no-results"
            className="absolute -bottom-5 left-0 text-xs text-destructive pointer-events-none"
          >
            No results found
          </div>
        )}
      </div>
    )
  }
)

SearchBar.displayName = 'SearchBar'
