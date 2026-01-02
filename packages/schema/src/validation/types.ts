/**
 * Validation problem types for semantic snapshot validation.
 *
 * These types represent validation errors and warnings that go beyond
 * Zod schema validation - they check semantic rules like graph integrity,
 * circular dependencies, and business logic constraints.
 */

/**
 * Severity level for validation problems.
 * - 'error': Blocking - export cannot proceed
 * - 'warning': Non-blocking - export can proceed but may have issues
 */
export type ProblemSeverity = 'error' | 'warning'

/**
 * Entity reference for problems tied to specific entities.
 */
export type ProblemEntity = {
  kind: 'quest' | 'chapter' | 'dependency'
  id: string
}

/**
 * Validation problem codes.
 * Each code represents a specific validation rule violation.
 */
export type ProblemCode =
  // Quest validation
  | 'MISSING_QUEST_TITLE'
  | 'QUEST_MISSING_CHAPTER'
  | 'ORPHAN_QUEST'
  | 'DUPLICATE_QUEST_ID'
  // Chapter validation
  | 'MISSING_CHAPTER_TITLE'
  | 'DUPLICATE_CHAPTER_ID'
  | 'DUPLICATE_CHAPTER_ORDER'
  // Dependency validation
  | 'CIRCULAR_DEPENDENCY'
  | 'DEPENDENCY_MISSING_SOURCE'
  | 'DEPENDENCY_MISSING_TARGET'
  | 'SELF_DEPENDENCY'
  | 'DUPLICATE_DEPENDENCY'
  | 'CROSS_CHAPTER_DEPENDENCY'
  // SNBT metadata validation
  | 'INVALID_SNBT_METADATA'

/**
 * A validation problem discovered in a ProjectSnapshot.
 *
 * Problems are structured for:
 * 1. User display (message)
 * 2. Programmatic handling (code)
 * 3. Entity linking (entity)
 */
export type Problem = {
  /** Severity determines if export can proceed */
  severity: ProblemSeverity
  /** Machine-readable code for programmatic handling */
  code: ProblemCode
  /** Human-readable message describing the problem */
  message: string
  /** Optional reference to the affected entity */
  entity?: ProblemEntity
}

/**
 * Result of running validation on a snapshot.
 */
export type ValidationResult = {
  /** Whether validation passed (no errors, warnings allowed) */
  valid: boolean
  /** All discovered problems */
  problems: Problem[]
  /** Count of error-severity problems */
  errorCount: number
  /** Count of warning-severity problems */
  warningCount: number
}

/**
 * Helper to create a Problem with full type safety.
 */
export function createProblem(
  severity: ProblemSeverity,
  code: ProblemCode,
  message: string,
  entity?: ProblemEntity
): Problem {
  return entity ? { severity, code, message, entity } : { severity, code, message }
}
