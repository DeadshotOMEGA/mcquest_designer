import { z } from 'zod'
import { ProjectSnapshotSchema } from './core'

// ============================================
// Project API Schemas
// ============================================

export const CreateProjectRequestSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
})

export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>

export const UpdateProjectRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
})

export type UpdateProjectRequest = z.infer<typeof UpdateProjectRequestSchema>

export const UpdateSnapshotRequestSchema = z.object({
  snapshot: ProjectSnapshotSchema,
  expectedVersion: z.string().optional(),
})

export type UpdateSnapshotRequest = z.infer<typeof UpdateSnapshotRequestSchema>

// ============================================
// Query Schemas
// ============================================

export const ProjectListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  cursor: z.string().optional(),
  role: z.enum(['OWNER', 'EDITOR', 'VIEWER']).optional(),
})

export type ProjectListQuery = z.infer<typeof ProjectListQuerySchema>
