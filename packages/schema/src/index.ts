// Core schemas and types
export {
  // Version
  SCHEMA_VERSION,
  // Primitive Types
  UuidSchema,
  PositionSchema,
  SizeSchema,
  // Task Types
  TaskTypeSchema,
  TaskSchema,
  // Reward Types
  RewardTypeSchema,
  RewardSchema,
  // Quest Definition
  QuestShapeSchema,
  IconReferenceSchema,
  QuestSettingsSchema,
  QuestSchema,
  // Chapter Definition
  ChapterSchema,
  // Dependencies
  DependencyTypeSchema,
  DependencySchema,
  // UI State
  ViewportStateSchema,
  UISnapshotSchema,
  // Project Metadata
  MinecraftVersionSchema,
  ProjectMetadataSchema,
  // Complete Project Snapshot
  ProjectSnapshotSchema,
} from './core'

export type {
  // Primitive Types
  Position,
  Size,
  // Task Types
  TaskType,
  Task,
  // Reward Types
  RewardType,
  Reward,
  // Quest Definition
  QuestShape,
  IconReference,
  QuestSettings,
  Quest,
  // Chapter Definition
  Chapter,
  // Dependencies
  DependencyType,
  Dependency,
  // UI State
  ViewportState,
  UISnapshot,
  // Project Metadata
  MinecraftVersion,
  ProjectMetadata,
  // Complete Project Snapshot
  ProjectSnapshot,
} from './core'

// API schemas
export {
  CreateProjectRequestSchema,
  UpdateProjectRequestSchema,
  UpdateSnapshotRequestSchema,
  ProjectListQuerySchema,
} from './api'

export type {
  CreateProjectRequest,
  UpdateProjectRequest,
  UpdateSnapshotRequest,
  ProjectListQuery,
} from './api'

// Factory functions
export { createDefaultSnapshot, createDefaultChapter, createDefaultQuest } from './defaults'

// Validation
export {
  // Main validator
  validateSnapshot,
  isSnapshotValid,
  // Problem helpers
  createProblem,
  filterBySeverity,
  filterByEntityKind,
  getProblemsForEntity,
  // Individual rules
  validateQuestTitles,
  validateQuestChapterReferences,
  validateUniqueQuestIds,
  validateOrphanQuests,
  validateChapterTitles,
  validateUniqueChapterIds,
  validateUniqueChapterOrder,
  validateDependencySourceExists,
  validateDependencyTargetExists,
  validateNoSelfDependencies,
  validateNoDuplicateDependencies,
  validateNoCircularDependencies,
  validateCrossChapterDependencies,
  allValidationRules,
} from './validation'

export type {
  Problem,
  ProblemSeverity,
  ProblemEntity,
  ProblemCode,
  ValidationResult,
  ValidateSnapshotOptions,
} from './validation'
