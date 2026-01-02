/**
 * POST /api/projects/:id/zip-import
 *
 * Accept ZIP file uploads, extract files in-memory, pass to import orchestrator,
 * and return ProjectSnapshot or detailed errors.
 *
 * Accepts:
 * - Content-Type: multipart/form-data
 * - Body: { file: <zip file> }
 *
 * Returns (success):
 * {
 *   success: true,
 *   snapshot: ProjectSnapshot,
 *   problems: ImportProblem[],
 *   stats: {
 *     chapters: number,
 *     quests: number,
 *     rewardTables: number
 *   }
 * }
 *
 * Returns (error):
 * {
 *   success: false,
 *   error: string,
 *   problems: ImportProblem[]
 * }
 *
 * Security:
 * - Validates user has EDITOR or OWNER role
 * - Validates ZIP structure and size limits
 * - Extracts files in-memory (no disk writes)
 * - Prevents path traversal attacks
 * - Validates file extensions
 *
 * Limits:
 * - Max ZIP size: 200MB
 * - Max extracted size: 500MB
 * - Max 50MB per file
 */

import { NextResponse } from 'next/server'
import { checkProjectAccess } from '@/lib/auth'
import { handleApiError, ApiErrors } from '@/lib/api-error'
import { extractZip, validateZipStructure, validateFileExtensions } from '@/lib/upload/zip-extractor'
import { validateImportFiles, MAX_UPLOAD_SIZE } from '@/lib/upload/file-validator'
import { orchestrateImport } from '@mcquest/snbt'
import type { ImportFile } from '@mcquest/snbt'
import { inngest } from '@/inngest/client'
import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'

/**
 * Threshold for async import jobs (configurable via environment)
 */
const ASYNC_IMPORT_THRESHOLD = parseInt(
  process.env.ASYNC_IMPORT_QUEST_THRESHOLD || '100',
  10
)

/**
 * POST handler for ZIP import
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Step 1: Verify user has at least EDITOR access
    const membership = await checkProjectAccess(id, 'EDITOR')

    // Step 2: Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      throw ApiErrors.badRequest('Request must contain a "file" field with a ZIP file')
    }

    // Step 3: Validate uploaded file
    const uploadValidation = validateImportFiles(file, [])
    if (uploadValidation.errors.length > 0) {
      throw ApiErrors.validation('File validation failed', {
        errors: uploadValidation.errors,
        warnings: uploadValidation.warnings,
      })
    }

    // Step 4: Check file size before reading
    if (file.size > MAX_UPLOAD_SIZE) {
      throw ApiErrors.badRequest(`File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB, max 200MB)`)
    }

    // Step 5: Read ZIP data
    const arrayBuffer = await file.arrayBuffer()

    // Step 6: Extract ZIP files in-memory
    let extractionResult
    try {
      extractionResult = await extractZip(arrayBuffer)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw ApiErrors.badRequest(`Failed to extract ZIP: ${message}`)
    }

    if (!extractionResult.success && extractionResult.errors.length > 0) {
      throw ApiErrors.validation('ZIP extraction failed', {
        errors: extractionResult.errors,
      })
    }

    // Step 7: Validate ZIP structure
    const structureValidation = validateZipStructure(extractionResult.files)
    if (!structureValidation.valid) {
      throw ApiErrors.badRequest(`Invalid ZIP structure: ${structureValidation.errors.join(', ')}`)
    }

    // Step 8: Validate file extensions
    const extensionValidation = validateFileExtensions(extractionResult.files)
    if (!extensionValidation.valid) {
      throw ApiErrors.badRequest(`Invalid files in ZIP: ${extensionValidation.errors.join(', ')}`)
    }

    // Step 9: Validate extracted files
    const fileValidation = validateImportFiles(file, extractionResult.files)
    if (!fileValidation.valid && fileValidation.errors.length > 0) {
      throw ApiErrors.validation('File validation failed', {
        errors: fileValidation.errors,
        warnings: fileValidation.warnings,
      })
    }

    // Step 10: Convert to import format
    const importFiles: ImportFile[] = extractionResult.files.map((file) => ({
      path: file.path,
      content: file.content,
    }))

    // Step 11: Try synchronous import first to count quests
    const importResult = await orchestrateImport(importFiles)

    if (!importResult?.snapshot) {
      // Import failed completely
      throw ApiErrors.validation('Import failed: No snapshot could be created', {
        problems: importResult?.problems,
      })
    }

    const questCount = importResult.snapshot.quests.length

    // Step 12: Check if import should be async
    if (questCount >= ASYNC_IMPORT_THRESHOLD) {
      return await handleAsyncImport(
        id,
        membership.user_id,
        importFiles,
        importResult.snapshot,
        extractionResult.files
      )
    }

    // Step 13: For small imports, handle synchronously
    return await handleSyncImport(
      id,
      membership.user_id,
      importResult,
      extractionResult.files
    )
  } catch (error) {
    // Handle all errors with standard error response
    return handleApiError(error)
  }
}

/**
 * Handle synchronous import for small questbooks
 */
async function handleSyncImport(
  projectId: string,
  userId: string,
  importResult: Awaited<ReturnType<typeof orchestrateImport>>,
  extractedFiles: Array<{ path: string; content: string }>
) {
  const stats = {
    chapters: importResult.snapshot!.chapters.length,
    quests: importResult.snapshot!.quests.length,
    rewardTables: extractedFiles.filter((file) => file.path.startsWith('reward_tables/')).length,
  }

  // Create version and update project
  const version = await prisma.project_versions.create({
    data: {
      id: randomUUID(),
      project_id: projectId,
      snapshot: importResult.snapshot as Prisma.InputJsonValue,
      created_by: userId,
      message: 'Imported from SNBT files',
    },
    select: {
      id: true,
      created_at: true,
    },
  })

  await prisma.projects.update({
    where: { id: projectId },
    data: {
      latest_snapshot: importResult.snapshot as Prisma.InputJsonValue,
      updated_at: new Date(),
    },
  })

  return NextResponse.json(
    {
      success: true,
      snapshot: importResult.snapshot,
      problems: importResult.problems,
      stats,
      metadata: {
        filesProcessed: importResult.metadata.filesProcessed,
        filesExtracted: extractedFiles.length,
        importDuration: importResult.metadata.duration,
        mode: 'synchronous',
      },
      versionId: version.id,
    },
    { status: 200 }
  )
}

/**
 * Handle asynchronous import for large questbooks
 */
async function handleAsyncImport(
  projectId: string,
  userId: string,
  importFiles: ImportFile[],
  snapshot: unknown,
  extractedFiles: Array<{ path: string; content: string }>
) {
  // Create job record
  const jobId = randomUUID()
  await ((prisma as unknown) as Record<string, unknown>).import_jobs.create({
    data: {
      id: jobId,
      project_id: projectId,
      user_id: userId,
      status: 'pending',
      progress: 0,
    },
  })

  // Convert ImportFile objects to serializable format for Inngest
  const serializableFiles = importFiles.map((f) => ({
    path: f.path,
    content: f.content,
  }))

  // Trigger async job
  await inngest.send({
    name: 'questbook/import.requested',
    data: {
      jobId,
      projectId,
      userId,
      files: serializableFiles,
    },
  })

  // Return job reference for polling
  const stats = {
    chapters: (snapshot as { chapters: unknown[] }).chapters.length,
    quests: (snapshot as { quests: unknown[] }).quests.length,
    rewardTables: extractedFiles.filter((file) => file.path.startsWith('reward_tables/')).length,
  }

  return NextResponse.json(
    {
      success: true,
      jobId,
      stats,
      metadata: {
        filesProcessed: importFiles.length,
        filesExtracted: extractedFiles.length,
        mode: 'asynchronous',
      },
      message: `Import queued as background job. Use /api/projects/${projectId}/import-status/${jobId} to poll status.`,
    },
    { status: 202 }
  )
}
