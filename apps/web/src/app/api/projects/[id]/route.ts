import { checkProjectAccess } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { UpdateProjectRequestSchema } from '@mcquest/schema'

/**
 * GET /api/projects/:id
 * Fetch a single project with access check
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Verify user has access to this project
    const membership = await checkProjectAccess(id)

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            versions: true,
          },
        },
      },
    })

    if (!project) {
      // This shouldn't happen if checkProjectAccess succeeded, but handle it anyway
      throw new Error('Project not found')
    }

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        latestSnapshot: project.latestSnapshot,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        role: membership.role,
        members: project.members.map(
          (m: {
            userId: string
            role: string
            user: { id: string; name: string | null; email: string; avatarUrl: string | null }
            createdAt: Date
          }) => ({
            userId: m.userId,
            role: m.role,
            user: m.user,
            joinedAt: m.createdAt.toISOString(),
          })
        ),
        versionCount: project._count.versions,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/projects/:id
 * Update project metadata (name, description)
 * Requires EDITOR or OWNER role
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Verify user has at least EDITOR access
    await checkProjectAccess(id, 'EDITOR')

    const body = await request.json()

    // Validate with Zod schema
    const validatedData = UpdateProjectRequestSchema.parse(body)

    // Update project
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
      },
      include: {
        members: {
          select: { role: true, userId: true },
        },
      },
    })

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        latestSnapshot: project.latestSnapshot,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/projects/:id
 * Delete a project
 * Requires OWNER role
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Verify user is OWNER
    await checkProjectAccess(id, 'OWNER')

    // Delete project (cascade will delete members, versions, and share tokens)
    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Project deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
