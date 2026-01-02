import { inngest, type QuestbookImportRequestedEvent } from './client'
import { handleImportJob } from '@/lib/jobs/import-job-handler'
import type { ImportFile } from '@mcquest/snbt'

/**
 * Inngest function for asynchronous questbook import processing
 *
 * Handles large questbook imports (>100 quests) asynchronously with:
 * - Phase-level progress tracking
 * - Automatic retry on transient failures (3 attempts)
 * - Real-time progress updates via events
 * - Deterministic processing
 *
 * @example
 * ```ts
 * // Triggered by: inngest.send({
 * //   name: 'questbook/import.requested',
 * //   data: {
 * //     jobId: 'job_123',
 * //     projectId: 'proj_456',
 * //     userId: 'user_789',
 * //     files: [{ path: 'chapters.snbt', content: '...' }]
 * //   }
 * // })
 * ```
 */
export const questbookImportJob = inngest.createFunction(
  {
    id: 'questbook-import',
    name: 'Questbook Import Job',
    retries: 3,
  },
  { event: 'questbook/import.requested' },
  async ({
    event,
    step,
  }: {
    event: QuestbookImportRequestedEvent
    step: Record<string, unknown> // Step tools from Inngest
  }) => {
    const { jobId, projectId, userId, files } = event.data

    // Convert files to ImportFile format
    const importFiles: ImportFile[] = files.map(
      (f: { path: string; content: string | ArrayBuffer }) => ({
        path: f.path,
        content:
          typeof f.content === 'string'
            ? f.content
            : Buffer.from(f.content as ArrayBuffer).toString('utf-8'),
      })
    )

    // Execute import with step wrapper for resilience
    const stepRun = step.run as (
      name: string,
      fn: () => Promise<string>
    ) => Promise<string>

    const versionId = await stepRun('execute-import', async () => {
      return await handleImportJob({
        jobId,
        projectId,
        userId,
        files: importFiles,
      })
    })

    return {
      jobId,
      versionId,
      status: 'completed',
    }
  }
)
