# Search & Filter Integration Guide

Quick reference for how the search and filter system integrates with the existing codebase.

## Component Hierarchy

```
SidebarTree (updated)
├── SearchBar (new)
│   └── Input with debouncing
│   └── Triggers searchAndFilter()
│   └── Shows result count/no results
├── FilterDropdown (new)
│   └── Chapter selector
│   └── Type filter (future)
│   └── Status filter (future)
│   └── Active filter badges
├── Expand/Collapse buttons
└── VirtualizedTree
    └── TreeNode (updated)
        └── Highlight if in search results
```

## State Flow

### Search Store (`useSearchStore`)
```typescript
// Hooks provided:
useSearchQuery()           // Current search text
useFilterCriteria()        // Active filters
useSearchResults()         // Search result items
useIsSearching()          // Loading state
useSearch()               // All combined

// Actions available:
setSearchQuery(q)         // Update search
setFilterCriteria(c)      // Update filters
clearFilters()           // Reset filters
setSearchResults(r)       // Update results
clearSearch()            // Reset everything
```

### Integration with Editor Store
```typescript
// Used in SearchBar & FilterDropdown:
useChapters()            // From editor-store
useQuests()              // From editor-store
useChapterQuests(id)     // From editor-store

// Data flows:
Chapters + Quests → fuzzyScore + filterQuests → searchResults
                                      ↓
                        (stored in search-store)
                                      ↓
                            SidebarTree tree flattening
```

## Key Integration Points

### 1. SearchBar Component
**Location**: `/apps/web/src/components/editor/search-bar.tsx`

**Input**: User types
**Process**:
1. Debounce 300ms
2. Call `searchAndFilter(chapters, quests, query, filterCriteria)`
3. Store results in `useSearchStore`
4. Tree re-renders automatically

**Usage in SidebarTree**:
```tsx
<SearchBar placeholder="Search quests and chapters..." />
```

### 2. FilterDropdown Component
**Location**: `/apps/web/src/components/editor/filter-dropdown.tsx`

**Input**: User selects filter
**Process**:
1. Call `setFilterCriteria()` in search-store
2. SearchBar detects change via `useFilterCriteria()`
3. Re-runs `searchAndFilter()` with new criteria
4. Results update automatically

**Usage in SidebarTree**:
```tsx
<FilterDropdown />
```

### 3. Auto-Expand Effect
**Location**: `/apps/web/src/components/editor/sidebar-tree.tsx:99-125`

**Trigger**: `searchQuery` or `searchResults` changes
**Action**: Auto-expand chapters containing matching items

```typescript
React.useEffect(() => {
  if (searchQuery && searchResults.length > 0) {
    const chaptersToExpand = new Set<string>()
    // Calculate which chapters contain results
    // Update expandedChapterIds
  }
}, [searchQuery, searchResults, chapters, questsByChapter])
```

### 4. Tree Filtering Logic
**Location**: `/apps/web/src/components/editor/sidebar-tree.tsx:128-212`

**When search active**:
- Only render items in `searchResults`
- Show parent chapter as grouping header
- Respect auto-expansion

**When search inactive**:
- Render full tree
- Respect manual expand/collapse state

### 5. TreeNode Highlighting
**Location**: `/apps/web/src/components/editor/tree-node.tsx:82-98`

**Condition**: `isSearchHighlight` prop passed from SidebarTree

```tsx
isSearchHighlight={
  !!(searchQuery && searchResults.some((r) => r.id === item.id))
}
```

**Styling**: `bg-yellow-100/50 dark:bg-yellow-900/20`

## Data Flow Examples

### Example 1: User Types "quest"
```
SearchBar receives input "quest"
  ↓
Debounce 300ms
  ↓
performSearch("quest") called
  ↓
searchAndFilter(chapters, quests, "quest", filterCriteria, {threshold: 0.2})
  ↓
fuzzyScore("First Quest", "quest") → 0.8
fuzzyScore("Advanced Quest", "quest") → 0.8
... (calculate all scores)
  ↓
Results sorted by score, filtered by threshold
  ↓
setSearchResults([{id: 'q1', type: 'quest', score: 0.8, ...}, ...])
  ↓
SidebarTree detects change (useSearchResults)
  ↓
Auto-expand chapters with results
Flatten tree with filtered items
  ↓
TreeNodes render with highlights
  ↓
User sees "2 results" and matching items highlighted
```

### Example 2: User Selects Chapter Filter
```
FilterDropdown receives chapter selection
  ↓
setFilterCriteria({chapterId: 'ch1'})
  ↓
Search store updates
  ↓
SearchBar's useFilterCriteria() detects change
  ↓
performSearch() re-runs with:
  - searchQuery: "quest" (unchanged)
  - filterCriteria: {chapterId: 'ch1'} (updated)
  ↓
searchAndFilter applies both:
  1. Filter quests to chapter ch1
  2. Search within filtered quests
  ↓
Results update
  ↓
Tree re-renders with filtered+searched results
  ↓
Filter badge appears next to dropdown
```

### Example 3: User Presses ESC
```
SearchBar receives ESC key
  ↓
handleClear() called
  ↓
setSearchQuery('')
setSearchResults([])
  ↓
Search store updates
  ↓
SidebarTree detects empty results
  ↓
Tree flattening uses else branch (no search)
  ↓
Full tree rendered with original expand state
  ↓
No highlights
```

## Extensibility Points

### Adding a New Filter Type
1. Update `FilterCriteria` in `/apps/web/src/lib/search/fuzzy-search.ts`
2. Add filter logic in `filterQuests()`
3. Add UI in `/apps/web/src/components/editor/filter-dropdown.tsx`
4. Example for quest type:
   ```typescript
   export interface FilterCriteria {
     questType?: 'any' | 'standard' | 'quest' | 'task' // Add new types
   }

   export function filterQuests(...) {
     if (criteria.questType && criteria.questType !== 'any') {
       filtered = filtered.filter((q) => q.type === criteria.questType)
     }
   }
   ```

### Improving Search Algorithm
- Modify `fuzzyScore()` algorithm in `/apps/web/src/lib/search/fuzzy-search.ts`
- Consider:
  - Weighting matches at word boundaries higher
  - Implementing Levenshtein distance for typos
  - Adding phonetic matching
  - Supporting regex patterns

### Changing Debounce Delay
- Edit `SearchBar` component (line ~65):
  ```typescript
  }, 300) // Change to different milliseconds
  ```
  - Smaller = more responsive but more searches
  - Larger = fewer searches but less responsive

### Styling Results Highlight
- Edit `TreeNode` component className (line ~91):
  ```typescript
  isSearchHighlight && 'bg-yellow-100/50 dark:bg-yellow-900/20',
  ```

## Performance Considerations

### Memoization
- `flatItems` is memoized (useMemo)
- Only recalculates when chapters/quests/search changes
- Prevents unnecessary tree flattening

### Debouncing
- Prevents running search on every keystroke
- 300ms is standard (feels instant to users)
- Can adjust based on performance needs

### Virtualization
- TanStack Virtual keeps only visible DOM nodes
- Works with filtered results automatically
- Important for large questbooks (600+ quests)

## Testing Checklist

- [ ] Search finds quests by title
- [ ] Search finds quests by description
- [ ] Search finds chapters by title
- [ ] Fuzzy matching works (typos, missing chars)
- [ ] Case-insensitive search
- [ ] Results highlighted in yellow
- [ ] Result count displays
- [ ] "No results" message shows
- [ ] ESC clears search
- [ ] Chapters auto-expand for results
- [ ] Keyboard navigation works with filtered results
- [ ] Filters work independently
- [ ] Filters + search work together
- [ ] Dark mode styling correct
- [ ] Accessibility: keyboard users can operate
- [ ] Accessibility: screen readers work

## Common Issues

### Search Results Don't Update
- Check SearchBar's `performSearch()` is being called
- Verify chapters/quests data is loaded
- Check browser console for errors in `searchAndFilter()`

### Highlights Not Showing
- Verify `isSearchHighlight` prop is passed correctly
- Check TreeNode className is applied
- Ensure `searchQuery` is not empty

### Auto-Expand Not Working
- Check SidebarTree's effect hook dependencies
- Verify `searchResults` includes chapter IDs
- Check `useTreeUIStore.setState()` is called

### Slow Search
- Monitor `searchAndFilter()` execution time
- Check if chapters/quests are very large (1000+)
- Consider Web Worker for heavy searches
- Profile with React DevTools Profiler
