import { checkProjectAccess } from '@/lib/auth'
import { handleApiError, ApiErrors } from '@/lib/api-error'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { ProjectSnapshotSchema } from '@mcquest/schema'
import type { Prisma } from '@prisma/client'

/**
 * Import request body schema
 */
interface ImportRequestBody {
  snapshot: unknown
}

/**
 * POST /api/projects/:projectId/import
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
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params

    // Verify user has at least EDITOR access
    const membership = await checkProjectAccess(projectId, 'EDITOR')

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
    const version = await prisma.projectVersion.create({
      data: {
        projectId,
        snapshot: updatedSnapshot as unknown as Prisma.InputJsonValue,
        createdById: membership.userId,
        comment: 'Imported from SNBT files',
      },
      select: {
        id: true,
        versionNumber: true,
        createdAt: true,
      },
    })

    // Update project with the new snapshot as latest
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        latestSnapshot: updatedSnapshot as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        name: true,
        description: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        versionId: version.id,
        versionNumber: version.versionNumber,
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          updatedAt: project.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
