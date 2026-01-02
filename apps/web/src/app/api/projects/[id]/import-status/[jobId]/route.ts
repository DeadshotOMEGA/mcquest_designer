import { checkProjectAccess } from '@/lib/auth'
import { handleApiError, ApiErrors } from '@/lib/api-error'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

/**
 * GET /api/projects/:id/import-status/:jobId
 *
 * Poll the status of an import job
 *
 * Returns:
 * ```json
 * {
 *   jobId: string
 *   status: 'pending' | 'processing' | 'completed' | 'failed'
 *   progress: number // 0-100
 *   phase: string | null
 *   result?: {
 *     snapshot: ProjectSnapshot
 *     versionId: string
 *   }
 *   error?: string
 * }
 * ```
 *
 * Security:
 * - Validates user has at least VIEWER access to project
 * - Only allows users to poll their own jobs or jobs in projects they have access to
 *
 * Status codes:
 * - 200: Job found, status returned
 * - 404: Job or project not found
 * - 403: User doesn't have access to project
 * - 500: Database error
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; jobId: string }> }
) {
  try {
    const { id: projectId, jobId } = await params

    // Verify user has at least VIEWER access to the project
    await checkProjectAccess(projectId, 'VIEWER')

    // Get the import job record
    // Note: Once Prisma migration is applied, this will have proper types
    const job = await ((prisma as unknown) as Record<string, unknown>).import_jobs.findUnique({
      where: {
        id: jobId,
      },
      select: {
        id: true,
        project_id: true,
        status: true,
        progress: true,
        phase: true,
        result: true,
        error: true,
        created_at: true,
        updated_at: true,
      },
    })

    if (!job) {
      throw ApiErrors.notFound('Import job')
    }

    // Verify the job belongs to the requested project
    if (job.project_id !== projectId) {
      throw ApiErrors.forbidden('This import job does not belong to the requested project')
    }

    // Parse the result JSON if it exists
    const result =
      job.result && job.status === 'completed'
        ? {
            snapshot: job.result,
          }
        : undefined

    return NextResponse.json(
      {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        phase: job.phase,
        result,
        error: job.error || undefined,
        createdAt: job.created_at.toISOString(),
        updatedAt: job.updated_at.toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
