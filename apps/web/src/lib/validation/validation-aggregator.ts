import type { ProjectSnapshot, Problem } from '@mcquest/schema'
import { validateSnapshot } from '@mcquest/schema'

/**
 * Aggregates validation errors by entity ID (quest or chapter)
 * Returns a map of entityId -> error count
 *
 * This function:
 * - Runs snapshot validation to get all problems
 * - Groups problems by entity ID
 * - Counts only error-severity problems (not warnings)
 * - Returns a map for easy lookup in tree rendering
 */
export function aggregateValidationErrorsByEntity(snapshot: ProjectSnapshot): Record<string, number> {
  if (!snapshot) return {}

  const result = validateSnapshot(snapshot)
  const errorCounts: Record<string, number> = {}

  // Group error-severity problems by entity ID
  for (const problem of result.problems) {
    // Only count errors, not warnings
    if (problem.severity === 'error' && problem.entity) {
      const entityId = problem.entity.id
      errorCounts[entityId] = (errorCounts[entityId] ?? 0) + 1
    }
  }

  return errorCounts
}

/**
 * Aggregates validation warnings by entity ID (quest or chapter)
 * Returns a map of entityId -> warning count
 *
 * Similar to aggregateValidationErrorsByEntity but for warning-severity problems
 */
export function aggregateValidationWarningsByEntity(snapshot: ProjectSnapshot): Record<string, number> {
  if (!snapshot) return {}

  const result = validateSnapshot(snapshot)
  const warningCounts: Record<string, number> = {}

  // Group warning-severity problems by entity ID
  for (const problem of result.problems) {
    // Only count warnings, not errors
    if (problem.severity === 'warning' && problem.entity) {
      const entityId = problem.entity.id
      warningCounts[entityId] = (warningCounts[entityId] ?? 0) + 1
    }
  }

  return warningCounts
}

/**
 * Combines error and warning counts by entity, preferring errors
 * If an entity has both errors and warnings, only the error count is shown
 * (errors are blocking, so they take priority)
 *
 * Returns:
 * - { count: number, severity: 'error' | 'warning' } for entities with issues
 * - undefined for entities with no issues
 */
export function aggregateValidationByEntity(
  snapshot: ProjectSnapshot
): Record<string, { count: number; severity: 'error' | 'warning' }> {
  if (!snapshot) return {}

  const result = validateSnapshot(snapshot)
  const counts: Record<string, { count: number; severity: 'error' | 'warning' }> = {}

  // Group problems by entity and severity
  for (const problem of result.problems) {
    if (problem.entity && (problem.severity === 'error' || problem.severity === 'warning')) {
      const entityId = problem.entity.id

      if (!counts[entityId]) {
        counts[entityId] = { count: 0, severity: problem.severity }
      } else if (problem.severity === 'error') {
        // Upgrade to error if we encounter an error (errors take priority)
        counts[entityId].severity = 'error'
      }

      counts[entityId].count += 1
    }
  }

  return counts
}

/**
 * Get the most severe validation issue for a specific entity
 * Returns the first error if any exist, otherwise the first warning
 */
export function getMostSevereIssueForEntity(snapshot: ProjectSnapshot, entityId: string): Problem | null {
  if (!snapshot) return null

  const result = validateSnapshot(snapshot)

  // Find errors first (more severe)
  const error = result.problems.find((p) => p.severity === 'error' && p.entity?.id === entityId)
  if (error) return error

  // Then check warnings
  const warning = result.problems.find((p) => p.severity === 'warning' && p.entity?.id === entityId)
  return warning ?? null
}
