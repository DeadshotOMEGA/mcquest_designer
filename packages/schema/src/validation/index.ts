/**
 * Validation module for ProjectSnapshot semantic validation.
 *
 * Provides validation beyond Zod schema checking:
 * - Graph integrity
 * - Circular dependency detection
 * - Business rules
 */

// Types
export type {
  Problem,
  ProblemSeverity,
  ProblemEntity,
  ProblemCode,
  ValidationResult,
} from './types'

export { createProblem } from './types'

// Validator
export {
  validateSnapshot,
  isSnapshotValid,
  filterBySeverity,
  filterByEntityKind,
  getProblemsForEntity,
} from './validator'

export type { ValidateSnapshotOptions } from './validator'

// Individual rules (for advanced use cases)
export {
  // Quest rules
  validateQuestTitles,
  validateQuestChapterReferences,
  validateUniqueQuestIds,
  validateOrphanQuests,
  // Chapter rules
  validateChapterTitles,
  validateUniqueChapterIds,
  validateUniqueChapterOrder,
  // Dependency rules
  validateDependencySourceExists,
  validateDependencyTargetExists,
  validateNoSelfDependencies,
  validateNoDuplicateDependencies,
  validateNoCircularDependencies,
  validateCrossChapterDependencies,
  // Rule registry
  allValidationRules,
} from './rules'
