/**
 * Validation rules for ProjectSnapshot semantic validation.
 *
 * Each rule function takes a snapshot and returns an array of Problems.
 * Rules are organized by domain: quest, chapter, dependency.
 */

import type { ProjectSnapshot } from '../core'
import type { Problem } from './types'
import { createProblem } from './types'

// ============================================
// Quest Validation Rules
// ============================================

/**
 * Validates that all quests have a non-empty title.
 * Severity: error (blocking)
 */
export function validateQuestTitles(snapshot: ProjectSnapshot): Problem[] {
  const problems: Problem[] = []

  for (const quest of snapshot.quests) {
    if (!quest.title || quest.title.trim() === '') {
      problems.push(
        createProblem(
          'error',
          'MISSING_QUEST_TITLE',
          `Quest is missing a title`,
          { kind: 'quest', id: quest.id }
        )
      )
    }
  }

  return problems
}

/**
 * Validates that all quests reference existing chapters.
 * Severity: error (blocking)
 */
export function validateQuestChapterReferences(snapshot: ProjectSnapshot): Problem[] {
  const problems: Problem[] = []
  const chapterIds = new Set(snapshot.chapters.map((c) => c.id))

  for (const quest of snapshot.quests) {
    if (!chapterIds.has(quest.chapterId)) {
      problems.push(
        createProblem(
          'error',
          'QUEST_MISSING_CHAPTER',
          `Quest references non-existent chapter "${quest.chapterId}"`,
          { kind: 'quest', id: quest.id }
        )
      )
    }
  }

  return problems
}

/**
 * Validates that there are no duplicate quest IDs.
 * Severity: error (blocking)
 */
export function validateUniqueQuestIds(snapshot: ProjectSnapshot): Problem[] {
  const problems: Problem[] = []
  const seenIds = new Set<string>()

  for (const quest of snapshot.quests) {
    if (seenIds.has(quest.id)) {
      problems.push(
        createProblem(
          'error',
          'DUPLICATE_QUEST_ID',
          `Duplicate quest ID detected`,
          { kind: 'quest', id: quest.id }
        )
      )
    }
    seenIds.add(quest.id)
  }

  return problems
}

/**
 * Identifies orphan quests - quests with no dependencies pointing to or from them.
 * Severity: warning (non-blocking, but may indicate design issues)
 *
 * Note: This only warns if there are multiple quests. A single quest being
 * an "orphan" is expected for starting quests or standalone questbooks.
 */
export function validateOrphanQuests(snapshot: ProjectSnapshot): Problem[] {
  const problems: Problem[] = []

  // Skip if there's only one or no quests
  if (snapshot.quests.length <= 1) {
    return problems
  }

  // Build sets of quests that are connected
  const connectedQuests = new Set<string>()

  for (const dep of snapshot.dependencies) {
    connectedQuests.add(dep.fromQuestId)
    connectedQuests.add(dep.toQuestId)
  }

  // Find quests not in any dependency
  for (const quest of snapshot.quests) {
    if (!connectedQuests.has(quest.id)) {
      problems.push(
        createProblem(
          'warning',
          'ORPHAN_QUEST',
          `Quest "${quest.title}" has no dependencies to or from other quests`,
          { kind: 'quest', id: quest.id }
        )
      )
    }
  }

  return problems
}

// ============================================
// Chapter Validation Rules
// ============================================

/**
 * Validates that all chapters have a non-empty title.
 * Severity: error (blocking)
 */
export function validateChapterTitles(snapshot: ProjectSnapshot): Problem[] {
  const problems: Problem[] = []

  for (const chapter of snapshot.chapters) {
    if (!chapter.title || chapter.title.trim() === '') {
      problems.push(
        createProblem(
          'error',
          'MISSING_CHAPTER_TITLE',
          `Chapter is missing a title`,
          { kind: 'chapter', id: chapter.id }
        )
      )
    }
  }

  return problems
}

/**
 * Validates that there are no duplicate chapter IDs.
 * Severity: error (blocking)
 */
export function validateUniqueChapterIds(snapshot: ProjectSnapshot): Problem[] {
  const problems: Problem[] = []
  const seenIds = new Set<string>()

  for (const chapter of snapshot.chapters) {
    if (seenIds.has(chapter.id)) {
      problems.push(
        createProblem(
          'error',
          'DUPLICATE_CHAPTER_ID',
          `Duplicate chapter ID detected`,
          { kind: 'chapter', id: chapter.id }
        )
      )
    }
    seenIds.add(chapter.id)
  }

  return problems
}

/**
 * Validates that chapter order values are unique.
 * Severity: warning (non-blocking, but may cause export ordering issues)
 */
export function validateUniqueChapterOrder(snapshot: ProjectSnapshot): Problem[] {
  const problems: Problem[] = []
  const orderToChapter = new Map<number, string>()

  for (const chapter of snapshot.chapters) {
    const existingId = orderToChapter.get(chapter.order)
    if (existingId) {
      problems.push(
        createProblem(
          'warning',
          'DUPLICATE_CHAPTER_ORDER',
          `Chapter shares order ${chapter.order} with another chapter`,
          { kind: 'chapter', id: chapter.id }
        )
      )
    } else {
      orderToChapter.set(chapter.order, chapter.id)
    }
  }

  return problems
}

// ============================================
// Dependency Validation Rules
// ============================================

/**
 * Validates that dependencies reference existing quests (source).
 * Severity: error (blocking)
 */
export function validateDependencySourceExists(snapshot: ProjectSnapshot): Problem[] {
  const problems: Problem[] = []
  const questIds = new Set(snapshot.quests.map((q) => q.id))

  for (const dep of snapshot.dependencies) {
    if (!questIds.has(dep.fromQuestId)) {
      problems.push(
        createProblem(
          'error',
          'DEPENDENCY_MISSING_SOURCE',
          `Dependency references non-existent source quest "${dep.fromQuestId}"`,
          { kind: 'dependency', id: `${dep.fromQuestId}->${dep.toQuestId}` }
        )
      )
    }
  }

  return problems
}

/**
 * Validates that dependencies reference existing quests (target).
 * Severity: error (blocking)
 */
export function validateDependencyTargetExists(snapshot: ProjectSnapshot): Problem[] {
  const problems: Problem[] = []
  const questIds = new Set(snapshot.quests.map((q) => q.id))

  for (const dep of snapshot.dependencies) {
    if (!questIds.has(dep.toQuestId)) {
      problems.push(
        createProblem(
          'error',
          'DEPENDENCY_MISSING_TARGET',
          `Dependency references non-existent target quest "${dep.toQuestId}"`,
          { kind: 'dependency', id: `${dep.fromQuestId}->${dep.toQuestId}` }
        )
      )
    }
  }

  return problems
}

/**
 * Validates that no quest depends on itself.
 * Severity: error (blocking)
 */
export function validateNoSelfDependencies(snapshot: ProjectSnapshot): Problem[] {
  const problems: Problem[] = []

  for (const dep of snapshot.dependencies) {
    if (dep.fromQuestId === dep.toQuestId) {
      problems.push(
        createProblem(
          'error',
          'SELF_DEPENDENCY',
          `Quest depends on itself`,
          { kind: 'quest', id: dep.fromQuestId }
        )
      )
    }
  }

  return problems
}

/**
 * Validates that there are no duplicate dependencies.
 * Severity: warning (non-blocking)
 */
export function validateNoDuplicateDependencies(snapshot: ProjectSnapshot): Problem[] {
  const problems: Problem[] = []
  const seenDeps = new Set<string>()

  for (const dep of snapshot.dependencies) {
    const key = `${dep.fromQuestId}->${dep.toQuestId}`
    if (seenDeps.has(key)) {
      problems.push(
        createProblem(
          'warning',
          'DUPLICATE_DEPENDENCY',
          `Duplicate dependency from quest to quest`,
          { kind: 'dependency', id: key }
        )
      )
    }
    seenDeps.add(key)
  }

  return problems
}

/**
 * Detects circular dependencies in the quest graph.
 * Severity: error (blocking)
 *
 * Uses Kahn's algorithm variant for cycle detection.
 * Reports all quests that are part of cycles.
 */
export function validateNoCircularDependencies(snapshot: ProjectSnapshot): Problem[] {
  const problems: Problem[] = []

  // Build adjacency list (fromQuestId -> toQuestIds)
  // Dependency direction: fromQuestId must be completed before toQuestId
  const adjacency = new Map<string, Set<string>>()
  const inDegree = new Map<string, number>()

  // Initialize all quests
  for (const quest of snapshot.quests) {
    adjacency.set(quest.id, new Set())
    inDegree.set(quest.id, 0)
  }

  // Build graph from dependencies
  for (const dep of snapshot.dependencies) {
    // Skip invalid dependencies (handled by other rules)
    if (!adjacency.has(dep.fromQuestId) || !adjacency.has(dep.toQuestId)) {
      continue
    }
    // Skip self-dependencies (handled by other rules)
    if (dep.fromQuestId === dep.toQuestId) {
      continue
    }

    const targets = adjacency.get(dep.fromQuestId)!
    if (!targets.has(dep.toQuestId)) {
      targets.add(dep.toQuestId)
      inDegree.set(dep.toQuestId, (inDegree.get(dep.toQuestId) ?? 0) + 1)
    }
  }

  // Kahn's algorithm - find all nodes with no incoming edges
  const queue: string[] = []
  for (const [id, degree] of inDegree) {
    if (degree === 0) {
      queue.push(id)
    }
  }

  // Process nodes
  let processedCount = 0
  while (queue.length > 0) {
    const current = queue.shift()!
    processedCount++

    const targets = adjacency.get(current)
    if (targets) {
      for (const target of targets) {
        const newDegree = (inDegree.get(target) ?? 0) - 1
        inDegree.set(target, newDegree)
        if (newDegree === 0) {
          queue.push(target)
        }
      }
    }
  }

  // If we didn't process all nodes, there are cycles
  if (processedCount < snapshot.quests.length) {
    // Find nodes still with incoming edges (part of cycles)
    const questMap = new Map(snapshot.quests.map((q) => [q.id, q]))

    for (const [id, degree] of inDegree) {
      if (degree > 0) {
        const quest = questMap.get(id)
        const title = quest?.title ?? 'Unknown'
        problems.push(
          createProblem(
            'error',
            'CIRCULAR_DEPENDENCY',
            `Quest "${title}" is part of a circular dependency chain`,
            { kind: 'quest', id }
          )
        )
      }
    }
  }

  return problems
}

/**
 * Warns about cross-chapter dependencies.
 * Severity: warning (non-blocking, but may indicate design issues)
 *
 * Cross-chapter dependencies are valid but may complicate quest progression.
 */
export function validateCrossChapterDependencies(snapshot: ProjectSnapshot): Problem[] {
  const problems: Problem[] = []
  const questToChapter = new Map<string, string>()

  for (const quest of snapshot.quests) {
    questToChapter.set(quest.id, quest.chapterId)
  }

  for (const dep of snapshot.dependencies) {
    const fromChapter = questToChapter.get(dep.fromQuestId)
    const toChapter = questToChapter.get(dep.toQuestId)

    // Skip if quests don't exist (handled by other rules)
    if (!fromChapter || !toChapter) {
      continue
    }

    if (fromChapter !== toChapter) {
      problems.push(
        createProblem(
          'warning',
          'CROSS_CHAPTER_DEPENDENCY',
          `Dependency crosses chapter boundaries`,
          { kind: 'dependency', id: `${dep.fromQuestId}->${dep.toQuestId}` }
        )
      )
    }
  }

  return problems
}

// ============================================
// Rule Registry
// ============================================

/**
 * All validation rules in execution order.
 * Order matters: structure rules run before semantic rules.
 */
export const allValidationRules: Array<(snapshot: ProjectSnapshot) => Problem[]> = [
  // Quest structure rules
  validateUniqueQuestIds,
  validateQuestTitles,
  validateQuestChapterReferences,

  // Chapter structure rules
  validateUniqueChapterIds,
  validateChapterTitles,
  validateUniqueChapterOrder,

  // Dependency structure rules
  validateDependencySourceExists,
  validateDependencyTargetExists,
  validateNoSelfDependencies,
  validateNoDuplicateDependencies,

  // Graph analysis rules
  validateNoCircularDependencies,

  // Design warning rules
  validateOrphanQuests,
  validateCrossChapterDependencies,
]
