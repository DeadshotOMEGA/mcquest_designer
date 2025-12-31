/**
 * Main validation entry point for ProjectSnapshot semantic validation.
 *
 * Validates snapshots beyond Zod schema checking, including:
 * - Graph integrity (dependencies reference existing quests)
 * - Circular dependency detection
 * - Business rules (required titles, orphan detection)
 */

import type { ProjectSnapshot } from '../core'
import type { Problem, ValidationResult, ProblemSeverity } from './types'
import { allValidationRules } from './rules'

/**
 * Options for controlling validation behavior.
 */
export type ValidateSnapshotOptions = {
  /**
   * If true, stop validation after first error is found.
   * Useful for fail-fast scenarios.
   * @default false
   */
  stopOnFirstError?: boolean

  /**
   * If provided, only run rules that produce problems with this severity.
   * Useful for filtering to only errors or only warnings.
   */
  severityFilter?: ProblemSeverity

  /**
   * If true, skip warning-only rules for performance.
   * @default false
   */
  skipWarnings?: boolean
}

/**
 * Validates a ProjectSnapshot and returns all discovered problems.
 *
 * This is the main entry point for semantic validation. Use this after
 * Zod schema validation to check business rules and graph integrity.
 *
 * @param snapshot - The ProjectSnapshot to validate
 * @param options - Optional validation behavior settings
 * @returns ValidationResult with all problems and counts
 *
 * @example
 * ```ts
 * const snapshot = ProjectSnapshotSchema.parse(rawData)
 * const result = validateSnapshot(snapshot)
 *
 * if (!result.valid) {
 *   console.error('Validation failed:', result.problems)
 * }
 * ```
 */
export function validateSnapshot(
  snapshot: ProjectSnapshot,
  options: ValidateSnapshotOptions = {}
): ValidationResult {
  const { stopOnFirstError = false, severityFilter, skipWarnings = false } = options

  const problems: Problem[] = []
  let errorCount = 0
  let warningCount = 0

  for (const rule of allValidationRules) {
    const ruleProblems = rule(snapshot)

    for (const problem of ruleProblems) {
      // Apply severity filter if specified
      if (severityFilter && problem.severity !== severityFilter) {
        continue
      }

      // Skip warnings if requested
      if (skipWarnings && problem.severity === 'warning') {
        continue
      }

      problems.push(problem)

      if (problem.severity === 'error') {
        errorCount++
        if (stopOnFirstError) {
          return {
            valid: false,
            problems,
            errorCount,
            warningCount,
          }
        }
      } else {
        warningCount++
      }
    }
  }

  return {
    valid: errorCount === 0,
    problems,
    errorCount,
    warningCount,
  }
}

/**
 * Quick check if a snapshot has any blocking errors.
 *
 * More efficient than validateSnapshot when you only need a boolean result.
 *
 * @param snapshot - The ProjectSnapshot to validate
 * @returns true if snapshot is valid (no errors), false otherwise
 */
export function isSnapshotValid(snapshot: ProjectSnapshot): boolean {
  const result = validateSnapshot(snapshot, { stopOnFirstError: true, skipWarnings: true })
  return result.valid
}

/**
 * Filter problems by severity.
 *
 * @param problems - Array of problems to filter
 * @param severity - Severity to filter for
 * @returns Filtered array of problems
 */
export function filterBySeverity(problems: Problem[], severity: ProblemSeverity): Problem[] {
  return problems.filter((p) => p.severity === severity)
}

/**
 * Filter problems by entity kind.
 *
 * @param problems - Array of problems to filter
 * @param kind - Entity kind to filter for
 * @returns Filtered array of problems
 */
export function filterByEntityKind(
  problems: Problem[],
  kind: 'quest' | 'chapter' | 'dependency'
): Problem[] {
  return problems.filter((p) => p.entity?.kind === kind)
}

/**
 * Get all problems for a specific entity ID.
 *
 * @param problems - Array of problems to search
 * @param entityId - Entity ID to filter for
 * @returns Array of problems for that entity
 */
export function getProblemsForEntity(problems: Problem[], entityId: string): Problem[] {
  return problems.filter((p) => p.entity?.id === entityId)
}
