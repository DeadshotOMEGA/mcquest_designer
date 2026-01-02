'use client'

import * as React from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Loader2, AlertTriangle, FileUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { FileUpload, type SnbtFiles } from '@/components/import/file-upload'
import { parseSNBT, parseLangFile, convertToSnapshot } from '@mcquest/snbt'
import type { ImportProblem, ConversionResult } from '@mcquest/snbt'
import type { ProjectSnapshot } from '@mcquest/schema'

/**
 * Import workflow step types
 */
type ImportStep = 'upload' | 'preview' | 'importing' | 'complete' | 'error'

/**
 * Import state
 */
interface ImportState {
  step: ImportStep
  files: SnbtFiles | null
  snapshot: ProjectSnapshot | null
  problems: ImportProblem[]
  error: string | null
}

/**
 * Import Workflow Page
 *
 * Multi-step workflow for importing FTB Quests SNBT files:
 * 1. Upload - Select SNBT files via drag-and-drop or file picker
 * 2. Preview - Show parsed snapshot and validation problems
 * 3. Importing - Loading state while creating new version
 * 4. Complete - Success state with redirect to editor
 * 5. Error - Error state with recovery options
 *
 * Features:
 * - Client-side SNBT parsing with @mcquest/snbt
 * - Real-time validation feedback
 * - Problem severity filtering (errors vs warnings)
 * - Accessible step indicators and error messages
 * - Keyboard navigation support
 *
 * @example
 * Route: /dashboard/projects/[projectId]/import
 */
export default function ImportPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const router = useRouter()
  const [state, setState] = React.useState<ImportState>({
    step: 'upload',
    files: null,
    snapshot: null,
    problems: [],
    error: null,
  })

  /**
   * Parse SNBT files and convert to snapshot
   */
  const parseFiles = React.useCallback(async (files: SnbtFiles) => {
    try {
      setState((prev) => ({ ...prev, step: 'preview', files, error: null }))

      // Parse all chapter files
      const chapterData: unknown[] = []
      for (const chapterFile of files.chapters) {
        const text = await chapterFile.text()
        const parseResult = parseSNBT(text)
        if (parseResult.success && parseResult.data) {
          chapterData.push(parseResult.data)
        } else {
          throw new Error(`Failed to parse ${chapterFile.name}: ${parseResult.error || 'Unknown error'}`)
        }
      }

      // Parse lang file if provided
      let langData
      if (files.langFile) {
        const langText = await files.langFile.text()
        langData = parseLangFile(langText)
      }

      // Merge chapter data into a single object
      // For simplicity, we'll assume all chapters/quests are in a single structure
      const mergedData = {
        chapters: chapterData,
        quests: chapterData.flatMap((chapter: unknown) => {
          if (chapter && typeof chapter === 'object' && 'quests' in chapter) {
            return Array.isArray((chapter as { quests: unknown }).quests)
              ? (chapter as { quests: unknown[] }).quests
              : []
          }
          return []
        }),
      }

      // Convert to ProjectSnapshot
      const conversionResult: ConversionResult = convertToSnapshot(mergedData, langData)

      if (!conversionResult.success || !conversionResult.snapshot) {
        setState((prev) => ({
          ...prev,
          step: 'error',
          problems: conversionResult.problems,
          error: 'Failed to convert SNBT to snapshot. See problems below.',
        }))
        return
      }

      setState((prev) => ({
        ...prev,
        snapshot: conversionResult.snapshot,
        problems: conversionResult.problems,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        step: 'error',
        error: error instanceof Error ? error.message : 'Failed to parse files',
      }))
    }
  }, [])

  /**
   * Import snapshot to project
   */
  const importSnapshot = React.useCallback(async () => {
    if (!state.snapshot) return

    try {
      setState((prev) => ({ ...prev, step: 'importing', error: null }))

      const response = await fetch(`/api/projects/${projectId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot: state.snapshot }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Import failed')
      }

      await response.json()

      setState((prev) => ({ ...prev, step: 'complete' }))

      // Redirect to editor after a short delay
      setTimeout(() => {
        router.push(`/editor/${projectId}`)
      }, 2000)
    } catch (error) {
      setState((prev) => ({
        ...prev,
        step: 'error',
        error: error instanceof Error ? error.message : 'Failed to import snapshot',
      }))
    }
  }, [state.snapshot, projectId, router])

  /**
   * Reset workflow to start over
   */
  const resetWorkflow = React.useCallback(() => {
    setState({
      step: 'upload',
      files: null,
      snapshot: null,
      problems: [],
      error: null,
    })
  }, [])

  // Calculate problem counts
  const errorCount = state.problems.filter((p) => p.severity === 'error').length
  const warningCount = state.problems.filter((p) => p.severity === 'warning').length
  const canImport = state.snapshot !== null && errorCount === 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Projects
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/editor/${projectId}`}
          className="hover:text-foreground transition-colors"
        >
          Project
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">Import</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/editor/${projectId}`}>
          <Button variant="ghost" size="icon" aria-label="Back to editor">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import FTB Quests</h1>
          <p className="text-muted-foreground">
            Upload SNBT files from your questbook to import into this project
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <nav aria-label="Import progress">
        <ol className="flex items-center gap-2">
          {[
            { id: 'upload', label: 'Upload Files' },
            { id: 'preview', label: 'Preview' },
            { id: 'importing', label: 'Importing' },
            { id: 'complete', label: 'Complete' },
          ].map((step, index) => {
            const isCurrent = state.step === step.id
            const isComplete =
              (state.step === 'preview' && index < 1) ||
              (state.step === 'importing' && index < 2) ||
              (state.step === 'complete' && index < 3) ||
              (state.step === 'complete' && step.id === 'complete')

            return (
              <li key={step.id} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : isComplete
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isComplete && step.id !== 'complete' ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={isCurrent ? 'font-medium' : 'text-muted-foreground'}>
                  {step.label}
                </span>
                {index < 3 && (
                  <div className="h-px w-8 bg-border" aria-hidden="true" />
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Step 1: Upload */}
      {state.step === 'upload' && (
        <FileUpload onFilesSelected={parseFiles} error={state.error || undefined} />
      )}

      {/* Step 2: Preview */}
      {state.step === 'preview' && state.snapshot && (
        <div className="space-y-6">
          {/* Snapshot Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Import Preview</CardTitle>
              <CardDescription>
                Review the questbook data before importing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Chapters</p>
                  <p className="text-2xl font-bold">{state.snapshot.chapters.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Quests</p>
                  <p className="text-2xl font-bold">{state.snapshot.quests.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Dependencies</p>
                  <p className="text-2xl font-bold">{state.snapshot.dependencies.length}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Project Name</p>
                <p className="text-sm text-muted-foreground">
                  {state.snapshot.metadata.projectName}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Target Version</p>
                <p className="text-sm text-muted-foreground">
                  Minecraft {state.snapshot.metadata.targetMinecraftVersion}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Problems */}
          {state.problems.length > 0 && (
            <Alert variant={errorCount > 0 ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>
                {errorCount > 0 ? 'Validation Errors' : 'Validation Warnings'}
              </AlertTitle>
              <AlertDescription>
                <p className="mb-2">
                  Found {errorCount} error{errorCount !== 1 ? 's' : ''} and {warningCount}{' '}
                  warning{warningCount !== 1 ? 's' : ''}
                </p>
                <ul className="space-y-1 text-sm" role="list">
                  {state.problems.slice(0, 10).map((problem, index) => (
                    <li key={index}>
                      <strong>[{problem.severity.toUpperCase()}]</strong> {problem.message}
                      {problem.entity && ` (${problem.entity.kind})`}
                    </li>
                  ))}
                  {state.problems.length > 10 && (
                    <li className="text-muted-foreground">
                      ...and {state.problems.length - 10} more
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={resetWorkflow}>
              Cancel
            </Button>
            <Button
              onClick={importSnapshot}
              disabled={!canImport}
              aria-label={
                !canImport
                  ? 'Cannot import due to validation errors'
                  : 'Import questbook'
              }
            >
              <FileUp className="mr-2 h-4 w-4" aria-hidden="true" />
              Import Questbook
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Importing */}
      {state.step === 'importing' && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" aria-hidden="true" />
            <p className="text-lg font-medium mb-2">Importing questbook...</p>
            <p className="text-sm text-muted-foreground">
              Please wait while we process your files
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {state.step === 'complete' && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-green-500/10 p-3 mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" aria-hidden="true" />
            </div>
            <p className="text-lg font-medium mb-2">Import successful!</p>
            <p className="text-sm text-muted-foreground mb-4">
              Redirecting to editor...
            </p>
            <div
              role="status"
              aria-live="polite"
              className="h-1 w-48 bg-muted rounded-full overflow-hidden"
            >
              <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Error */}
      {state.step === 'error' && (
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Import Failed</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>

          {state.problems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Validation Problems</CardTitle>
                <CardDescription>
                  The following issues were found during import
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2" role="list">
                  {state.problems.map((problem, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm"
                    >
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          problem.severity === 'error'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                        }`}
                      >
                        {problem.severity.toUpperCase()}
                      </span>
                      <span>{problem.message}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => router.push(`/editor/${projectId}`)}>
              Cancel Import
            </Button>
            <Button onClick={resetWorkflow}>
              Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
