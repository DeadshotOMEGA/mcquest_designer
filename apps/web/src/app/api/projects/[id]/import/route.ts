import { checkProjectAccess } from '@/lib/auth'
import { handleApiError, ApiErrors } from '@/lib/api-error'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { ProjectSnapshotSchema } from '@mcquest/schema'
import type { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'

/**
 * Import request body schema
 */
interface ImportRequestBody {
  snapshot: unknown
}

/**
 * POST /api/projects/:id/import
 * Import SNBT snapshot into project
 *
 * Creates a new version from the imported snapshot and sets it as the latest.
 * Requires EDITOR or OWNER role.
 *
 * Request body:
 * ```json
 * {
 *   "snapshot": { ... ProjectSnapshot ... }
 * }
 * ```
 *
 * Response:
 * ```json
 * {
 *   "success": true,
 *   "versionId": "uuid",
 *   "project": {
 *     "id": "uuid",
 *     "name": "string",
 *     "updatedAt": "ISO 8601"
 *   }
 * }
 * ```
 *
 * Security:
 * - Validates user has EDITOR or OWNER access
 * - Validates snapshot with Zod schema
 * - Creates immutable version record
 * - Updates project's latestSnapshot
 *
 * @example
 * ```ts
 * const response = await fetch('/api/projects/123/import', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ snapshot: convertedSnapshot })
 * })
 * ```
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify user has at least EDITOR access
    const membership = await checkProjectAccess(id, 'EDITOR')

    // Parse and validate request body
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || !('snapshot' in body)) {
      throw ApiErrors.validation('Request body must contain a snapshot field')
    }

    const { snapshot } = body as ImportRequestBody

    // Validate snapshot with Zod schema
    const validatedSnapshot = ProjectSnapshotSchema.parse(snapshot)

    // Update snapshot metadata with current timestamp
    const now = new Date().toISOString()
    const updatedSnapshot = {
      ...validatedSnapshot,
      metadata: {
        ...validatedSnapshot.metadata,
        updatedAt: now,
      },
    }

    // Create new version record for audit trail
    const version = await prisma.project_versions.create({
      data: {
        id: randomUUID(),
        project_id: id,
        snapshot: updatedSnapshot as unknown as Prisma.InputJsonValue,
        created_by: membership.user_id,
        message: 'Imported from SNBT files',
      },
      select: {
        id: true,
        created_at: true,
      },
    })

    // Update project with the new snapshot as latest
    const project = await prisma.projects.update({
      where: { id },
      data: {
        latest_snapshot: updatedSnapshot as unknown as Prisma.InputJsonValue,
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        description: true,
        updated_at: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        versionId: version.id,
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          updatedAt: project.updated_at.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
