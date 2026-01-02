import * as React from 'react'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { ProjectCard } from '@/components/project-card'
import { CreateProjectDialog } from '@/components/create-project-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Dashboard Page - User's project list
 *
 * Server Component that fetches user's projects and displays them in a grid
 *
 * Features:
 * - Real data from database via Prisma
 * - Project cards with metadata
 * - Create new project dialog
 * - Empty state for new users
 * - Loading states handled by Suspense
 *
 * Security:
 * - CVE-2025-29927 mitigation: requireUser() verifies auth
 * - Only fetches projects where user is a member
 */

// Force dynamic rendering - this page requires authentication
export const dynamic = 'force-dynamic'

async function ProjectList() {
  const clerkUser = await requireUser()

  // Get database user
  const dbUser = await prisma.users.findUnique({
    where: { clerkId: clerkUser.id },
  })

  if (!dbUser) {
    // User hasn't been synced to database yet
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Projects Yet</CardTitle>
            <CardDescription>
              Get started by creating your first questbook project. You'll be able to add chapters,
              quests, tasks, and rewards in the visual editor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateProjectDialog>
              <Button className="w-full">Create Your First Project</Button>
            </CreateProjectDialog>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch user's projects with member information
  const projects = await prisma.projects.findMany({
    where: {
      project_members: {
        some: {
          user_id: dbUser.id,
        },
      },
    },
    include: {
      project_members: {
        select: {
          role: true,
          user_id: true,
        },
      },
      _count: {
        select: {
          project_members: true,
        },
      },
    },
    orderBy: {
      updated_at: 'desc',
    },
  })

  if (projects.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Projects Yet</CardTitle>
            <CardDescription>
              Get started by creating your first questbook project. You'll be able to add chapters,
              quests, tasks, and rewards in the visual editor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateProjectDialog>
              <Button className="w-full">Create Your First Project</Button>
            </CreateProjectDialog>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Define the project type from findMany result
  type ProjectWithMembers = (typeof projects)[number]
  type MemberInfo = ProjectWithMembers['project_members'][number]

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project: ProjectWithMembers) => {
        const userMembership = project.project_members.find((m: MemberInfo) => m.user_id === dbUser.id)
        return (
          <ProjectCard
            key={project.id}
            project={{
              id: project.id,
              name: project.name,
              description: project.description,
              updatedAt: project.updated_at.toISOString(),
              memberCount: project._count.project_members,
              role: userMembership?.role,
            }}
          />
        )
      })}
    </div>
  )
}

function ProjectListSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function DashboardPage() {
  const user = await requireUser()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.firstName || user.emailAddresses[0].emailAddress}!
          </p>
        </div>
        <CreateProjectDialog>
          <Button size="lg">
            <span aria-hidden="true">+</span> New Project
          </Button>
        </CreateProjectDialog>
      </div>

      <React.Suspense fallback={<ProjectListSkeleton />}>
        <ProjectList />
      </React.Suspense>
    </div>
  )
}
