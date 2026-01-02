import { z } from 'zod'
import { TaskSchema, RewardSchema, IconReferenceSchema } from '@mcquest/schema'

/**
 * Client-side validation schemas for quest form
 * Built on top of @mcquest/schema definitions
 */

// Re-export core schemas
export const QuestTitleSchema = z.string().min(1, 'Quest title is required').max(255)

export const QuestSubtitleSchema = z.string().max(255).optional()

export const QuestDescriptionSchema = z.string().max(5000).optional()

export const IconReferenceClientSchema = IconReferenceSchema.optional()

export const QuestSettingsClientSchema = z.object({
  optional: z.boolean().default(false),
  hidden: z.enum(['true', 'false', 'dependency']).default('false'),
  repeatable: z.boolean().default(false),
  canRepeat: z.boolean().default(false),
  hideUntilDeps: z.boolean().default(false),
})

// Task validation - match schema but allow count to be optional in form
export const TaskClientSchema = z.object({
  id: TaskSchema.shape.id,
  type: TaskSchema.shape.type,
  title: TaskSchema.shape.title,
  count: z.number().int().positive().optional(),
  item: z.string().optional(),
  advancementId: z.string().optional(),
  entityType: z.string().optional(),
  dimension: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
  range: z.number().positive().optional(),
})

export const TasksArraySchema = z.array(TaskClientSchema).default([])

// Reward validation - match schema but allow count to be optional in form
export const RewardClientSchema = z.object({
  id: RewardSchema.shape.id,
  type: RewardSchema.shape.type,
  title: RewardSchema.shape.title,
  count: z.number().int().positive().optional(),
  item: z.string().optional(),
  command: z.string().optional(),
  xp: z.number().int().optional(),
  levels: z.number().int().optional(),
  table: z.string().optional(),
})

export const RewardsArraySchema = z.array(RewardClientSchema).default([])

/**
 * Quest Form Schema - mirrors Quest structure but organized for forms
 * Used by react-hook-form for client-side validation
 *
 * Note: tasks and rewards are guaranteed non-null by defaulting to empty arrays in useForm
 */
export const QuestFormSchema = z.object({
  title: QuestTitleSchema,
  subtitle: QuestSubtitleSchema,
  description: QuestDescriptionSchema,
  icon: IconReferenceClientSchema,
  settings: QuestSettingsClientSchema,
  tasks: z.array(TaskClientSchema),
  rewards: z.array(RewardClientSchema),
})

export type QuestFormData = z.infer<typeof QuestFormSchema>

/**
 * Validation errors for display in UI
 */
export type ValidationError = {
  field: string
  message: string
  code: string
}

/**
 * Parse form data and return errors if validation fails
 */
export function validateQuestForm(data: unknown): {
  success: boolean
  data?: QuestFormData
  errors?: ValidationError[]
} {
  const result = QuestFormSchema.safeParse(data)

  if (!result.success) {
    const errors: ValidationError[] = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }))
    return { success: false, errors }
  }

  return { success: true, data: result.data }
}
