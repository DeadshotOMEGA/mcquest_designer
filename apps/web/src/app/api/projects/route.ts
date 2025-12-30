import { getCurrentDbUser } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import {
  CreateProjectRequestSchema,
  ProjectListQuerySchema,
  createDefaultSnapshot,
} from '@mcquest/schema'
import type { Prisma } from '@prisma/client'

/**
 * Protected API route for project operations
 *
 * CVE-2025-29927 Mitigation:
 * - Middleware protects /api/projects/* routes
 * - getCurrentDbUser() verifies authentication in the handler
 * - Never rely on middleware alone for API security
 */

export async function GET(request: Request) {
  try {
    // CRITICAL: Verify auth in every Route Handler
    const dbUser = await getCurrentDbUser()

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const query = ProjectListQuerySchema.parse({
      limit: searchParams.get('limit'),
      cursor: searchParams.get('cursor') || undefined,
      role: searchParams.get('role') || undefined,
    })

    // Build where clause
    const where = {
      members: {
        some: {
          userId: dbUser.id,
          ...(query.role && { role: query.role }),
        },
      },
    }

    // Fetch projects with pagination
    const projects = await prisma.project.findMany({
      where,
      take: query.limit + 1, // Fetch one extra to determine if there are more
      ...(query.cursor && {
        skip: 1,
        cursor: { id: query.cursor },
      }),
      orderBy: { updatedAt: 'desc' },
      include: {
        members: {
          where: { userId: dbUser.id },
          select: { role: true },
        },
        _count: {
          select: { members: true },
        },
      },
    })

    // Determine if there are more results
    const hasMore = projects.length > query.limit
    const items = hasMore ? projects.slice(0, -1) : projects

    // Format response - define the project type from findMany result
    type ProjectWithMembers = (typeof projects)[number]
    const formattedProjects = items.map((project: ProjectWithMembers) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      latestSnapshot: project.latestSnapshot,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      role: project.members[0]?.role,
      memberCount: project._count.members,
    }))

    return NextResponse.json({
      projects: formattedProjects,
      pagination: {
        nextCursor: hasMore ? items[items.length - 1]?.id : null,
        hasMore,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    // CRITICAL: Verify auth in every Route Handler
    const dbUser = await getCurrentDbUser()

    const body = await request.json()

    // Validate with Zod schema
    const validatedData = CreateProjectRequestSchema.parse(body)

    // Create default snapshot
    const defaultSnapshot = createDefaultSnapshot(validatedData.name)

    // Create project with owner membership in a transaction
    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        latestSnapshot: defaultSnapshot as unknown as Prisma.InputJsonValue,
        members: {
          create: {
            userId: dbUser.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          where: { userId: dbUser.id },
          select: { role: true },
        },
      },
    })

    return NextResponse.json(
      {
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          latestSnapshot: project.latestSnapshot,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
          role: project.members[0]?.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
