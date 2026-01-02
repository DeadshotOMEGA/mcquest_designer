import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { TextEditorClient } from './text-editor-client'
import { prisma } from '@/lib/db'

interface PageProps {
  params: Promise<{
    projectId: string
  }>
}

export default async function TextEditorPage({ params }: PageProps) {
  const resolvedParams = await params
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Fetch project with authorization check
  const project = await prisma.projects.findFirst({
    where: {
      id: resolvedParams.projectId,
      project_members: {
        some: {
          user_id: userId,
        },
      },
    },
    include: {
      project_versions: {
        orderBy: {
          created_at: 'desc',
        },
        take: 1,
      },
      project_members: {
        where: {
          user_id: userId,
        },
        select: {
          role: true,
        },
      },
    },
  })

  if (!project) {
    redirect('/dashboard')
  }

  const latestVersion = project.project_versions[0]
  const memberRole = project.project_members[0]?.role

  if (!latestVersion) {
    // No versions yet - redirect to import or create flow
    redirect(`/dashboard/projects/${project.id}/import`)
  }

  return (
    <TextEditorClient
      projectId={project.id}
      projectName={project.name}
      snapshot={latestVersion.snapshot}
      role={memberRole}
    />
  )
}
