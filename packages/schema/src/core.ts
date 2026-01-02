import { z } from 'zod'

export const SCHEMA_VERSION = '0.2.0' // v0.2.0 adds SNBT metadata support

// ============================================
// Primitive Types
// ============================================

export const UuidSchema = z.string().uuid()

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

export type Position = z.infer<typeof PositionSchema>

export const SizeSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
})

export type Size = z.infer<typeof SizeSchema>

// ============================================
// Task Types (FTB Quests 1.21.x)
// ============================================

export const TaskTypeSchema = z.enum([
  'item', // Collect/craft items
  'checkmark', // Manual completion
  'advancement', // Achieve advancement
  'kill', // Kill entities
  'location', // Visit location
  'observation', // Look at block
  'xp', // Gain XP
  'stat', // Reach stat value
])

export type TaskType = z.infer<typeof TaskTypeSchema>

export const TaskSchema = z.object({
  id: UuidSchema,
  type: TaskTypeSchema,
  title: z.string().optional(),
  count: z.number().int().positive().default(1),
  // Type-specific fields
  item: z.string().optional(), // For 'item' type
  advancementId: z.string().optional(), // For 'advancement' type
  entityType: z.string().optional(), // For 'kill' type
  dimension: z.string().optional(), // For 'location' type
  position: PositionSchema.optional(), // For 'location' type
  range: z.number().positive().optional(), // For 'location' type
})

export type Task = z.infer<typeof TaskSchema>

// ============================================
// Reward Types (FTB Quests 1.21.x)
// ============================================

export const RewardTypeSchema = z.enum([
  'item', // Give item
  'command', // Run command
  'xp', // Give XP
  'xp_levels', // Give XP levels
  'choice', // Player chooses from options
  'random', // Random from pool
  'loot', // Loot table
])

export type RewardType = z.infer<typeof RewardTypeSchema>

export const RewardSchema = z.object({
  id: UuidSchema,
  type: RewardTypeSchema,
  title: z.string().optional(),
  count: z.number().int().positive().default(1),
  // Type-specific fields
  item: z.string().optional(), // For 'item' type
  command: z.string().optional(), // For 'command' type
  xp: z.number().int().optional(), // For 'xp' type
  levels: z.number().int().optional(), // For 'xp_levels' type
  table: z.string().optional(), // For 'loot' type
})

export type Reward = z.infer<typeof RewardSchema>

// ============================================
// Quest Definition
// ============================================

export const QuestShapeSchema = z.enum([
  'square',
  'rsquare',
  'circle',
  'diamond',
  'pentagon',
  'hexagon',
  'octagon',
])

export type QuestShape = z.infer<typeof QuestShapeSchema>

export const IconReferenceSchema = z.object({
  type: z.enum(['item', 'texture']),
  value: z.string(), // e.g., "minecraft:book" or "ftbquests:textures/..."
})

export type IconReference = z.infer<typeof IconReferenceSchema>

export const QuestSettingsSchema = z.object({
  optional: z.boolean().default(false),
  hidden: z.enum(['true', 'false', 'dependency']).default('false'),
  repeatable: z.boolean().default(false),
  canRepeat: z.boolean().default(false),
  hideUntilDeps: z.boolean().default(false),
})

export type QuestSettings = z.infer<typeof QuestSettingsSchema>

export const QuestMetadataSchema = z.object({
  /** Original FTB Quests hex ID (for round-trip reference) */
  ftbQuestsId: z.string().optional(),
  /** Preserve unknown SNBT fields for round-trip compatibility */
  snbtMetadata: z.record(z.unknown()).optional(),
})

export type QuestMetadata = z.infer<typeof QuestMetadataSchema>

export const QuestSchema = z.object({
  id: UuidSchema,
  chapterId: UuidSchema,
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  position: PositionSchema,
  size: z.number().positive().default(1),
  shape: QuestShapeSchema.default('square'),
  icon: IconReferenceSchema.optional(),
  tasks: z.array(TaskSchema).default([]),
  rewards: z.array(RewardSchema).default([]),
  settings: QuestSettingsSchema.default({}),
  metadata: QuestMetadataSchema.optional(),
})

export type Quest = z.infer<typeof QuestSchema>

// ============================================
// Chapter Definition
// ============================================

export const ChapterImageSchema = z.object({
  image: z.string(), // Texture reference
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().default(0),
  alpha: z.number().min(0).max(1).default(1),
})

export type ChapterImage = z.infer<typeof ChapterImageSchema>

export const ChapterMetadataSchema = z.object({
  /** Original FTB Quests hex ID */
  ftbQuestsId: z.string().optional(),
  /** Background decoration images (FTB Quests feature) */
  images: z.array(ChapterImageSchema).optional(),
  /** Preserve unknown SNBT fields */
  snbtMetadata: z.record(z.unknown()).optional(),
})

export type ChapterMetadata = z.infer<typeof ChapterMetadataSchema>

export const ChapterSchema = z.object({
  id: UuidSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().nonnegative(),
  icon: IconReferenceSchema.optional(),
  background: z.string().optional(), // Background image reference
  defaultQuestShape: QuestShapeSchema.optional(),
  metadata: ChapterMetadataSchema.optional(),
})

export type Chapter = z.infer<typeof ChapterSchema>

// ============================================
// Dependencies
// ============================================

export const DependencyTypeSchema = z.enum(['AND', 'OR'])

export type DependencyType = z.infer<typeof DependencyTypeSchema>

export const DependencySchema = z.object({
  fromQuestId: UuidSchema,
  toQuestId: UuidSchema,
  type: DependencyTypeSchema.default('AND'),
})

export type Dependency = z.infer<typeof DependencySchema>

// ============================================
// UI State (editor-only, not exported)
// ============================================

export const ViewportStateSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number().positive(),
})

export type ViewportState = z.infer<typeof ViewportStateSchema>

export const UISnapshotSchema = z.object({
  activeChapterId: UuidSchema.optional(),
  viewportByChapter: z.record(UuidSchema, ViewportStateSchema).default({}),
  selectedQuestId: UuidSchema.optional(),
})

export type UISnapshot = z.infer<typeof UISnapshotSchema>

// ============================================
// Project Metadata
// ============================================

export const MinecraftVersionSchema = z.enum(['1.21', '1.21.1', '1.21.2', '1.21.3', '1.21.4'])

export type MinecraftVersion = z.infer<typeof MinecraftVersionSchema>

export const ProjectMetadataSchema = z.object({
  projectName: z.string().min(1).max(255),
  targetMinecraftVersion: MinecraftVersionSchema.default('1.21.1'),
  targetFTBQuestsVersion: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  /** Source of the project data */
  importedFrom: z.enum(['snbt', 'native']).optional(),
  /** Original format metadata */
  originalFormat: z.object({
    source: z.string(),
    version: z.string().optional(),
  }).optional(),
})

export type ProjectMetadata = z.infer<typeof ProjectMetadataSchema>

// ============================================
// Complete Project Snapshot
// ============================================

export const ProjectSnapshotSchema = z.object({
  version: z.string().default(SCHEMA_VERSION),
  metadata: ProjectMetadataSchema,
  chapters: z.array(ChapterSchema).default([]),
  quests: z.array(QuestSchema).default([]),
  dependencies: z.array(DependencySchema).default([]),
  uiState: UISnapshotSchema.optional(),
})

export type ProjectSnapshot = z.infer<typeof ProjectSnapshotSchema>
