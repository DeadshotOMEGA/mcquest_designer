import { z } from 'zod'

/**
 * Schema package version - used for compatibility checks
 */
export const SCHEMA_VERSION = '0.1.0'

/**
 * Placeholder Quest schema - will be expanded in future issues
 */
export const QuestSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
})

export type Quest = z.infer<typeof QuestSchema>

/**
 * Placeholder ProjectSnapshot schema
 */
export const ProjectSnapshotSchema = z.object({
  version: z.string(),
  chapters: z.array(z.unknown()),
  quests: z.array(QuestSchema),
})

export type ProjectSnapshot = z.infer<typeof ProjectSnapshotSchema>
