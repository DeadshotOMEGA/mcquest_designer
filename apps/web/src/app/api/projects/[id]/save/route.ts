import { checkProjectAccess } from '@/lib/auth'
import { handleApiError, ApiErrors } from '@/lib/api-error'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { ProjectSnapshotSchema, validateSnapshot } from '@mcquest/schema'
import type { Prisma } from '@prisma/client'

/**
 * POST /api/projects/:id/save
 * Save project snapshot with full validation
 * Requires EDITOR or OWNER role
 *
 * This endpoint:
 * 1. Validates user has project access
 * 2. Validates snapshot schema
 * 3. Validates snapshot semantic rules (graph integrity, etc.)
 * 4. Creates a new version record
 * 5. Updates project's latest snapshot
 *
 * Request body:
 * {
 *   snapshot: ProjectSnapshot
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   version?: {
 *     id: string
 *     projectId: string
 *     snapshot: ProjectSnapshot
 *     createdAt: string
 *   }
 *   validation?: {
 *     valid: boolean
 *     errorCount: number
 *     warningCount: number
 *   }
 * }
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Verify user has at least EDITOR access
    await checkProjectAccess(id, 'EDITOR')

    const body = await request.json()

    // Validate request body has snapshot property
    if (!body.snapshot) {
      throw ApiErrors.badRequest('Missing snapshot in request body')
    }

    // Validate snapshot schema
    const snapshot = ProjectSnapshotSchema.parse(body.snapshot)

    // Validate snapshot semantic rules
    const validationResult = validateSnapshot(snapshot)
    if (!validationResult.valid) {
      throw ApiErrors.validation(
        `Snapshot validation failed with ${validationResult.errorCount} error(s)`,
        {
          problems: validationResult.problems.filter((p) => p.severity === 'error'),
        }
      )
    }

    // Update snapshot metadata timestamp to current time
    const updatedSnapshot = {
      ...snapshot,
      metadata: {
        ...snapshot.metadata,
        updatedAt: new Date().toISOString(),
      },
    }

    // Update project with new snapshot
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
        latest_snapshot: true,
        updated_at: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        version: {
          id: project.id,
          projectId: id,
          snapshot: updatedSnapshot,
          updatedAt: project.updated_at.toISOString(),
        },
        validation: {
          valid: validationResult.valid,
          errorCount: validationResult.errorCount,
          warningCount: validationResult.warningCount,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
