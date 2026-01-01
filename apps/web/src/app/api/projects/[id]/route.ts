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

    const project = await prisma.projects.findUnique({
      where: { id },
      include: {
        project_members: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true,
              },
            },
          },
        },
        _count: {
          select: {
            project_versions: true,
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
        latestSnapshot: project.latest_snapshot,
        createdAt: project.created_at.toISOString(),
        updatedAt: project.updated_at.toISOString(),
        role: membership.role,
        members: project.project_members.map(
          (m: {
            user_id: string
            role: string
            users: { id: string; name: string | null; email: string; avatar_url: string | null }
            created_at: Date
          }) => ({
            userId: m.user_id,
            role: m.role,
            user: m.users,
            joinedAt: m.created_at.toISOString(),
          })
        ),
        versionCount: project._count.project_versions,
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
    const project = await prisma.projects.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
      },
      include: {
        project_members: {
          select: { role: true, user_id: true },
        },
      },
    })

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        latestSnapshot: project.latest_snapshot,
        createdAt: project.created_at.toISOString(),
        updatedAt: project.updated_at.toISOString(),
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
    await prisma.projects.delete({
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
