import { z } from 'zod'
import { IconReferenceSchema, QuestShapeSchema } from '@mcquest/schema'

/**
 * ChapterFormData - Zod schema for chapter form validation
 *
 * Validates:
 * - Title: required, 1-100 characters
 * - Description: optional string
 * - Order: required, non-negative integer
 * - Icon: optional IconReference with item ID validation
 * - DefaultQuestShape: optional quest shape
 */
export const ChapterFormDataSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less')
    .transform((v) => v.trim()),

  description: z
    .string()
    .max(5000, 'Description must be 5000 characters or less')
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),

  order: z
    .number()
    .int('Order must be a whole number')
    .nonnegative('Order must be 0 or greater'),

  icon: IconReferenceSchema.optional(),

  defaultQuestShape: QuestShapeSchema.optional(),
})

export type ChapterFormData = z.infer<typeof ChapterFormDataSchema>

/**
 * Validates that chapter orders are unique within a set of chapters
 *
 * Returns a validation error if any two chapters share the same order value
 */
export function validateUniqueOrders(
  chapters: Array<{ id: string; order: number }>,
  excludeChapterId?: string
): string | null {
  const orders = chapters
    .filter((c) => !excludeChapterId || c.id !== excludeChapterId)
    .map((c) => c.order)

  const uniqueOrders = new Set(orders)
  if (uniqueOrders.size !== orders.length) {
    return 'Chapter orders must be unique'
  }

  return null
}
