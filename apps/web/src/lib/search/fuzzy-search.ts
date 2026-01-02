import type { Chapter, Quest } from '@mcquest/schema'

/**
 * Fuzzy search result
 */
export interface SearchResult {
  id: string
  type: 'chapter' | 'quest'
  score: number
  matchedFields: ('title' | 'description')[]
}

/**
 * Search options
 */
export interface SearchOptions {
  caseSensitive?: boolean
  threshold?: number // Minimum score threshold (0-1)
}

/**
 * Simple fuzzy string matching using character-by-character scoring
 * Returns a score between 0-1 where 1 is perfect match
 *
 * Algorithm:
 * - Looks for characters in order
 * - Rewards consecutive matches
 * - Rewards matches at start of string or after spaces
 * - Penalizes gaps between matches
 */
export function fuzzyScore(haystack: string, needle: string): number {
  if (!needle) return 1 // Empty needle matches everything
  if (!haystack) return 0
  if (needle.length > haystack.length) return 0

  const normalizedNeedle = needle.toLowerCase()
  const normalizedHaystack = haystack.toLowerCase()

  let needleIndex = 0
  let haystackIndex = 0
  let score = 0
  let consecutiveMatches = 0
  const totalNeedleChars = needle.length

  while (haystackIndex < normalizedHaystack.length && needleIndex < normalizedNeedle.length) {
    if (normalizedNeedle[needleIndex] === normalizedHaystack[haystackIndex]) {
      // Character match found
      consecutiveMatches++

      // Reward for matching at start or after space
      const isAfterSpace = haystackIndex === 0 || normalizedHaystack[haystackIndex - 1] === ' '
      score += isAfterSpace ? 2 : 1

      needleIndex++
    } else {
      // Character mismatch - penalize for gaps
      consecutiveMatches = 0
      score -= 0.1
    }
    haystackIndex++
  }

  // Did we match all characters in the needle?
  if (needleIndex !== totalNeedleChars) return 0

  // Bonus for consecutive matches (rewards "tight" matches)
  if (consecutiveMatches > 0) score += consecutiveMatches * 0.5

  // Normalize score to 0-1 range
  // Higher score for shorter haystacks relative to needle length
  const lengthRatio = totalNeedleChars / normalizedHaystack.length
  return Math.min(1, (score / (totalNeedleChars * 2)) * lengthRatio)
}

/**
 * Search chapters and quests by query string
 *
 * Searches across:
 * - Chapter titles
 * - Quest titles
 * - Quest descriptions (if present)
 *
 * Returns results sorted by score (highest first)
 */
export function searchQuestsAndChapters(
  chapters: Chapter[],
  quests: Quest[],
  query: string,
  options: SearchOptions = {}
): SearchResult[] {
  if (!query.trim()) return []

  const { threshold = 0.3 } = options
  const results: SearchResult[] = []

  // Search chapters
  for (const chapter of chapters) {
    const titleScore = fuzzyScore(chapter.title, query)
    if (titleScore >= threshold) {
      results.push({
        id: chapter.id,
        type: 'chapter',
        score: titleScore,
        matchedFields: ['title'],
      })
    }
  }

  // Search quests
  for (const quest of quests) {
    const titleScore = fuzzyScore(quest.title, query)
    const descriptionScore = quest.description ? fuzzyScore(quest.description, query) : 0

    const maxScore = Math.max(titleScore, descriptionScore)
    if (maxScore >= threshold) {
      const matchedFields: ('title' | 'description')[] = []
      if (titleScore >= threshold) matchedFields.push('title')
      if (descriptionScore >= threshold) matchedFields.push('description')

      results.push({
        id: quest.id,
        type: 'quest',
        score: maxScore,
        matchedFields,
      })
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score)

  return results
}

/**
 * Filter quests by criteria
 */
export interface FilterCriteria {
  chapterId?: string
  questType?: 'any' | 'standard' // Can be extended for other types
  completionStatus?: 'all' | 'completed' | 'incomplete'
}

/**
 * Apply filters to quests
 */
export function filterQuests(
  quests: Quest[],
  _chapters: Chapter[],
  criteria: FilterCriteria
): Quest[] {
  let filtered = quests

  // Filter by chapter
  if (criteria.chapterId) {
    filtered = filtered.filter((q) => q.chapterId === criteria.chapterId)
  }

  // Filter by quest type
  if (criteria.questType && criteria.questType !== 'any') {
    // Expand this when more quest types are supported
    // For now, just return all
  }

  // Filter by completion status (placeholder - depends on schema)
  if (criteria.completionStatus && criteria.completionStatus !== 'all') {
    // This would require adding a "completed" field to Quest schema
    // For now, just return all
  }

  return filtered
}

/**
 * Combine search results and filters
 * Returns quest IDs that match both search AND filter criteria
 */
export function searchAndFilter(
  chapters: Chapter[],
  quests: Quest[],
  searchQuery: string,
  filterCriteria: FilterCriteria,
  searchOptions: SearchOptions = {}
): SearchResult[] {
  // Start with filtered quests
  const filteredQuests = filterQuests(quests, chapters, filterCriteria)

  // If no search query, return filtered quests with neutral scores
  if (!searchQuery.trim()) {
    return filteredQuests.map((q) => ({
      id: q.id,
      type: 'quest' as const,
      score: 1,
      matchedFields: [],
    }))
  }

  // Search within filtered set
  const searchResults = searchQuestsAndChapters(chapters, filteredQuests, searchQuery, searchOptions)

  // If chapter filter is active, also show the chapter itself in results
  if (filterCriteria.chapterId) {
    const chapter = chapters.find((c) => c.id === filterCriteria.chapterId)
    if (chapter) {
      const chapterScore = fuzzyScore(chapter.title, searchQuery)
      if (chapterScore >= (searchOptions.threshold ?? 0.3)) {
        searchResults.unshift({
          id: chapter.id,
          type: 'chapter',
          score: chapterScore,
          matchedFields: ['title'],
        })
      }
    }
  }

  return searchResults
}
