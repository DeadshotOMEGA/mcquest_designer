import { checkProjectAccess } from '@/lib/auth'
import { handleApiError, ApiErrors } from '@/lib/api-error'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { UpdateSnapshotRequestSchema } from '@mcquest/schema'
import type { Prisma } from '@prisma/client'

/**
 * PATCH /api/projects/:id/snapshot
 * Update project's latest snapshot
 * Requires EDITOR or OWNER role
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Verify user has at least EDITOR access
    await checkProjectAccess(id, 'EDITOR')

    const body = await request.json()

    // Validate with Zod schema
    const validatedData = UpdateSnapshotRequestSchema.parse(body)

    // If expectedVersion is provided, implement optimistic locking
    if (validatedData.expectedVersion) {
      const currentProject = await prisma.projects.findUnique({
        where: { id },
        select: { updated_at: true },
      })

      if (!currentProject) {
        throw ApiErrors.notFound('Project')
      }

      // Compare expected version (ISO timestamp) with current updatedAt
      if (currentProject.updated_at.toISOString() !== validatedData.expectedVersion) {
        throw ApiErrors.conflict(
          'Project has been modified by another user. Please refresh and try again.'
        )
      }
    }

    // Update the snapshot metadata timestamps
    const updatedSnapshot = {
      ...validatedData.snapshot,
      metadata: {
        ...validatedData.snapshot.metadata,
        updatedAt: new Date().toISOString(),
      },
    }

    // Update project with new snapshot
    const project = await prisma.projects.update({
      where: { id },
      data: {
        latest_snapshot: updatedSnapshot as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        name: true,
        description: true,
        latest_snapshot: true,
        updated_at: true,
      },
    })

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        latestSnapshot: project.latest_snapshot,
        updatedAt: project.updated_at.toISOString(),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
