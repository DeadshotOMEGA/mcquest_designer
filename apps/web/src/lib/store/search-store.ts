import { create } from 'zustand'
import type { SearchResult, FilterCriteria } from '@/lib/search/fuzzy-search'

/**
 * Search Store State
 */
export interface SearchState {
  // Search query
  searchQuery: string
  setSearchQuery: (query: string) => void

  // Filter criteria
  filterCriteria: FilterCriteria
  setFilterCriteria: (criteria: Partial<FilterCriteria>) => void
  clearFilters: () => void

  // Search results
  searchResults: SearchResult[]
  setSearchResults: (results: SearchResult[]) => void

  // UI state
  isSearching: boolean
  setIsSearching: (searching: boolean) => void

  // Clear all search and filters
  clearSearch: () => void
}

/**
 * Search Store
 *
 * Manages:
 * - Current search query and debouncing
 * - Filter criteria (chapter, type, status)
 * - Search results
 * - UI state (is searching, result count, etc.)
 */
export const useSearchStore = create<SearchState>((set) => ({
  // Initial state
  searchQuery: '',
  filterCriteria: {},
  searchResults: [],
  isSearching: false,

  // Actions
  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  setFilterCriteria: (criteria: Partial<FilterCriteria>) => {
    set((state) => ({
      filterCriteria: {
        ...state.filterCriteria,
        ...criteria,
      },
    }))
  },

  clearFilters: () => {
    set({ filterCriteria: {} })
  },

  setSearchResults: (results: SearchResult[]) => {
    set({ searchResults: results })
  },

  setIsSearching: (searching: boolean) => {
    set({ isSearching: searching })
  },

  clearSearch: () => {
    set({
      searchQuery: '',
      filterCriteria: {},
      searchResults: [],
      isSearching: false,
    })
  },
}))

/**
 * Selector for current search query
 */
export const useSearchQuery = () => useSearchStore((state) => state.searchQuery)

/**
 * Selector for filter criteria
 */
export const useFilterCriteria = () => useSearchStore((state) => state.filterCriteria)

/**
 * Selector for search results
 */
export const useSearchResults = () => useSearchStore((state) => state.searchResults)

/**
 * Selector for searching state
 */
export const useIsSearching = () => useSearchStore((state) => state.isSearching)

/**
 * Selector for combined search state
 */
export const useSearch = () =>
  useSearchStore((state) => ({
    searchQuery: state.searchQuery,
    filterCriteria: state.filterCriteria,
    searchResults: state.searchResults,
    isSearching: state.isSearching,
    setSearchQuery: state.setSearchQuery,
    setFilterCriteria: state.setFilterCriteria,
    clearFilters: state.clearFilters,
    setSearchResults: state.setSearchResults,
    setIsSearching: state.setIsSearching,
    clearSearch: state.clearSearch,
  }))
