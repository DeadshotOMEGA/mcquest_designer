import React from 'react'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { EditorPageClient } from '@/components/editor/editor-page-client'

/**
 * Editor Page - Visual quest graph editor
 *
 * Server component that handles authentication and project loading,
 * then renders the client-side editor with React Flow.
 */

// Force dynamic rendering - this page requires authentication
export const dynamic = 'force-dynamic'

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const clerkUser = await requireUser()

  // Get database user
  const dbUser = await prisma.users.findUnique({
    where: { clerkId: clerkUser.id },
  })

  if (!dbUser) {
    notFound()
  }

  // Fetch project with access check
  const project = await prisma.projects.findFirst({
    where: {
      id,
      project_members: {
        some: {
          user_id: dbUser.id,
        },
      },
    },
    include: {
      project_members: {
        where: { user_id: dbUser.id },
        select: { role: true },
      },
    },
  })

  if (!project) {
    notFound()
  }

  // Transform for client component
  const projectData = {
    id: project.id,
    name: project.name,
    description: project.description,
    latestSnapshot: project.latest_snapshot,
    role: project.project_members[0]?.role ?? 'VIEWER',
  }

  return <EditorPageClient project={projectData} />
}
