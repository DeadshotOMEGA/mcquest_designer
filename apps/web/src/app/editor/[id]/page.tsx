import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Editor Page - Placeholder for project editor
 *
 * This is a temporary placeholder. The full editor implementation
 * will be added in a future milestone (M2).
 */

// Force dynamic rendering - this page requires authentication
export const dynamic = 'force-dynamic'
export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const clerkUser = await requireUser()

  // Get database user
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  })

  if (!dbUser) {
    notFound()
  }

  // Fetch project with access check
  const project = await prisma.project.findFirst({
    where: {
      id,
      members: {
        some: {
          userId: dbUser.id,
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

  if (!project) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to Dashboard
            </Link>
            <h1 className="text-xl font-semibold">{project.name}</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Editor Coming Soon</CardTitle>
            <CardDescription>
              The visual quest editor will be implemented in Milestone 2
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Project Details</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-muted-foreground">Name:</dt>
                <dd className="font-medium">{project.name}</dd>

                {project.description && (
                  <>
                    <dt className="text-muted-foreground">Description:</dt>
                    <dd className="font-medium">{project.description}</dd>
                  </>
                )}

                <dt className="text-muted-foreground">Your Role:</dt>
                <dd className="font-medium">{project.members[0]?.role}</dd>

                <dt className="text-muted-foreground">Last Updated:</dt>
                <dd className="font-medium">{new Date(project.updatedAt).toLocaleString()}</dd>
              </dl>
            </div>

            <div className="pt-4">
              <Link href="/dashboard">
                <Button>Return to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
