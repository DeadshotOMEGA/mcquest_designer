import { prisma } from '@/lib/db'
import { inngest } from '@/inngest/client'
import type { ImportFile } from '@mcquest/snbt'
import { orchestrateImport } from '@mcquest/snbt'
import { ProjectSnapshotSchema } from '@mcquest/schema'
import type { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'

/**
 * Import job phases for progress tracking
 */
export const IMPORT_PHASES = {
  VALIDATION: 'validation',
  INDEX_BUILD: 'index-build',
  ENTITY_PARSING: 'entity-parsing',
  DEPENDENCY_RESOLUTION: 'dependency-resolution',
  LAYOUT_GENERATION: 'layout-generation',
  FINALIZATION: 'finalization',
} as const

export type ImportPhase = (typeof IMPORT_PHASES)[keyof typeof IMPORT_PHASES]

/**
 * Options for job handler
 */
interface ImportJobHandlerOptions {
  jobId: string
  projectId: string
  userId: string
  files: ImportFile[]
}

/**
 * Handle questbook import job execution
 * Orchestrates the import process with phase-level progress tracking
 *
 * @param options Job configuration
 * @returns The created version ID
 * @throws Error on failure (will trigger retry logic)
 */
export async function handleImportJob(options: ImportJobHandlerOptions): Promise<string> {
  const { jobId, projectId, userId, files } = options

  try {
    // Update job status to processing
    await updateJobStatus(jobId, 'processing', 0, IMPORT_PHASES.VALIDATION)

    // Phase 1: Validate files and structure
    await reportProgress(jobId, IMPORT_PHASES.VALIDATION, 10, 'Validating ZIP structure and files')

    // Phase 2: Index building (file parsing)
    await reportProgress(jobId, IMPORT_PHASES.INDEX_BUILD, 25, 'Building file index')

    // Phase 3: Entity parsing (chapters, quests, etc.)
    await reportProgress(jobId, IMPORT_PHASES.ENTITY_PARSING, 40, 'Parsing quest entities')

    // Phase 4: Dependency resolution
    await reportProgress(jobId, IMPORT_PHASES.DEPENDENCY_RESOLUTION, 60, 'Resolving dependencies')

    // Phase 5: Layout generation
    await reportProgress(jobId, IMPORT_PHASES.LAYOUT_GENERATION, 75, 'Generating layout')

    // Phase 6: Execute the actual import
    const importResult = await orchestrateImport(files)

    if (!importResult.snapshot) {
      throw new Error('Import orchestration failed: No snapshot generated')
    }

    // Validate the generated snapshot
    const validatedSnapshot = ProjectSnapshotSchema.parse(importResult.snapshot)

    // Phase 7: Finalization (save to database)
    await reportProgress(jobId, IMPORT_PHASES.FINALIZATION, 90, 'Saving to database')

    // Update snapshot metadata with current timestamp
    const now = new Date().toISOString()
    const snapshotWithMetadata = {
      ...validatedSnapshot,
      metadata: {
        ...validatedSnapshot.metadata,
        updatedAt: now,
      },
    }

    // Create new version record for audit trail
    const version = await prisma.project_versions.create({
      data: {
        id: randomUUID(),
        project_id: projectId,
        snapshot: snapshotWithMetadata as unknown as Prisma.InputJsonValue,
        created_by: userId,
        message: 'Imported from SNBT files (async job)',
      },
    })

    // Update project with new snapshot as latest
    await prisma.projects.update({
      where: { id: projectId },
      data: {
        latest_snapshot: snapshotWithMetadata as unknown as Prisma.InputJsonValue,
        updated_at: new Date(),
      },
    })

    // Update job to completed state
    await updateJobStatus(jobId, 'completed', 100, IMPORT_PHASES.FINALIZATION, {
      snapshot: snapshotWithMetadata,
      versionId: version.id,
    })

    // Emit completion event for real-time notifications
    await inngest.send({
      name: 'questbook/import.completed',
      data: {
        jobId,
        projectId,
        versionId: version.id,
        snapshot: snapshotWithMetadata,
      },
    })

    return version.id
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Update job with error state
    await updateJobStatus(jobId, 'failed', 0, null, null, errorMessage)

    // Emit failure event for real-time notifications
    await inngest.send({
      name: 'questbook/import.failed',
      data: {
        jobId,
        projectId,
        error: errorMessage,
      },
    })

    throw error
  }
}

/**
 * Update job status in database
 */
async function updateJobStatus(
  jobId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  progress: number,
  phase: ImportPhase | null,
  result?: unknown,
  error?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    progress,
    updated_at: new Date(),
  }

  if (phase) updateData.phase = phase
  if (result) updateData.result = result
  if (error) updateData.error = error

  await ((prisma as unknown) as Record<string, unknown>).import_jobs.update({
    where: { id: jobId },
    data: updateData,
  })
}

/**
 * Report progress to job and emit event for real-time updates
 */
async function reportProgress(
  jobId: string,
  phase: ImportPhase,
  progress: number,
  message: string
): Promise<void> {
  // Update database with progress
  await updateJobStatus(jobId, 'processing', progress, phase)

  // Emit progress event for real-time UI updates
  await inngest.send({
    name: 'questbook/import.progress',
    data: {
      jobId,
      phase,
      progress,
      message,
    },
  })
}
