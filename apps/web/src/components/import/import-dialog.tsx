'use client'

import * as React from 'react'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { UploadZone } from './upload-zone'
import { ImportErrorsList } from './import-errors-list'
import { ImportSummary } from './import-summary'
import { toast } from 'sonner'
import type { ImportFile, ImportResult } from '@mcquest/snbt'
import { useEditorStore } from '@/lib/store/editor-store'
import { validateSnapshot } from '@mcquest/schema'

/**
 * Dialog state - manages the current phase of the import workflow
 */
type DialogPhase = 'upload' | 'processing' | 'review' | 'saving' | 'complete'

interface DialogState {
  phase: DialogPhase
  progress?: number
  result?: ImportResult
  error?: string
}

export interface ImportDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when the dialog is closed (rejected or completed) */
  onOpenChange: (open: boolean) => void
  /** Callback when import is successfully completed */
  onImportComplete?: () => void
  /** Project ID for the current project */
  projectId: string
}

/**
 * ImportDialog Component
 *
 * Main import workflow dialog that guides users through:
 * 1. Upload (folder picker or ZIP)
 * 2. Processing (with progress indicator for large imports)
 * 3. Review (errors/warnings display with navigation)
 * 4. Decision (accept/reject)
 * 5. Saving (to database)
 * 6. Complete (redirect to editor)
 *
 * Features:
 * - Multi-phase workflow with clear state transitions
 * - Progress display for large imports (>100 quests)
 * - Error navigation (click "Go To" to jump to quest/chapter)
 * - Partial import acceptance (with warnings)
 * - Integration with Zustand editor store for entity selection
 * - Automatic redirect to editor on success
 * - Comprehensive error handling
 *
 * @example
 * ```tsx
 * <ImportDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onImportComplete={() => {
 *     router.push(`/editor/${projectId}`)
 *   }}
 *   projectId={projectId}
 * />
 * ```
 */
export function ImportDialog({ open, onOpenChange, onImportComplete, projectId }: ImportDialogProps) {
  const [state, setState] = React.useState<DialogState>({ phase: 'upload' })
  const [isSaving, setIsSaving] = React.useState(false)

  // Editor store actions for navigation
  const selectEntity = useEditorStore((state) => state.selectEntity)
  const toggleChapter = useEditorStore((state) => state.toggleChapter)
  const initializeProject = useEditorStore((state) => state.initializeProject)

  /**
   * Handle files selected from upload zone
   * Initiate processing
   */
  const handleFilesSelected = React.useCallback(
    async (files: ImportFile[]) => {
      if (files.length === 0) {
        toast.error('No files selected')
        return
      }

      setState({
        phase: 'processing',
        progress: 0,
      })

      try {
        // Call the API to import files
        const response = await fetch(`/api/projects/${projectId}/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error?.message || 'Import failed')
        }

        const result = (await response.json()) as ImportResult

        setState({
          phase: 'review',
          result,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error occurred'
        setState({
          phase: 'review',
          error: message,
        })
        toast.error(message)
      }
    },
    [projectId]
  )

  /**
   * Handle navigation to a problematic entity
   * Selects the entity in the tree and optionally expands parent chapter
   */
  const handleNavigateToEntity = React.useCallback(
    (entityId: string, type: 'quest' | 'chapter') => {
      selectEntity(entityId, type)

      // If navigating to a quest, expand its chapter
      if (type === 'quest' && state.result?.snapshot) {
        const quest = state.result.snapshot.quests.find((q) => q.id === entityId)
        if (quest) {
          toggleChapter(quest.chapterId)
        }
      }

      // Close dialog to show the entity
      onOpenChange(false)
    },
    [selectEntity, toggleChapter, state.result, onOpenChange]
  )

  /**
   * Handle accept - save import to database
   */
  const handleAccept = React.useCallback(async () => {
    if (!state.result?.snapshot) {
      toast.error('No snapshot available')
      return
    }

    const snapshot = state.result.snapshot

    // Validate before saving
    const validation = validateSnapshot(snapshot)
    if (!validation.valid) {
      toast.error(`Snapshot has ${validation.errorCount} validation error(s)`)
      return
    }

    setIsSaving(true)
    setState({ ...state, phase: 'saving' })

    try {
      // Save snapshot to database
      const response = await fetch(`/api/projects/${projectId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'Save failed')
      }

      // Initialize editor store with the imported snapshot
      initializeProject(projectId, snapshot)

      setState({ phase: 'complete' })
      toast.success('Import completed successfully')

      // Close dialog and trigger callback
      onOpenChange(false)
      onImportComplete?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed'
      setState({
        phase: 'review',
        result: state.result,
        error: message,
      })
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }, [state, projectId, initializeProject, onOpenChange, onImportComplete])

  /**
   * Handle reject - discard import and reset to upload phase
   */
  const handleReject = React.useCallback(() => {
    setState({ phase: 'upload' })
  }, [])

  /**
   * Handle close dialog
   */
  const handleClose = React.useCallback(() => {
    onOpenChange(false)
    // Reset state after dialog closes
    setTimeout(() => {
      setState({ phase: 'upload' })
    }, 300)
  }, [onOpenChange])

  // Parse import result stats
  const importStats = state.result
    ? {
        chapters: state.result.metadata.chaptersImported,
        quests: state.result.metadata.questsImported,
        rewardTables: 0,
        errors: state.result.problems.filter((p) => p.severity === 'error').length,
        warnings: state.result.problems.filter((p) => p.severity === 'warning').length,
      }
    : null

  const errors = state.result?.problems.filter((p) => p.severity === 'error') ?? []
  const warnings = state.result?.problems.filter((p) => p.severity === 'warning') ?? []
  const canAccept = !state.error && (!errors || errors.length === 0)

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-h-[90vh] max-w-2xl overflow-hidden flex flex-col">
        {/* Upload Phase */}
        {state.phase === 'upload' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Import Questbook</AlertDialogTitle>
              <AlertDialogDescription>
                Select a questbook folder or upload a ZIP file containing SNBT quest files
              </AlertDialogDescription>
            </AlertDialogHeader>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="min-h-[400px] space-y-4 py-4 pr-4">
                <UploadZone onFilesSelected={handleFilesSelected} onFolderError={(err) => setState({ ...state, error: err })} />
              </div>
            </ScrollArea>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </>
        )}

        {/* Processing Phase */}
        {state.phase === 'processing' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Importing...</AlertDialogTitle>
              <AlertDialogDescription>Processing your questbook files. This may take a moment for large imports.</AlertDialogDescription>
            </AlertDialogHeader>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 py-4 pr-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Reading and parsing SNBT files...</p>
                {state.progress !== undefined && (
                  <div className="w-full max-w-xs space-y-2">
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${state.progress}%` }}
                        role="progressbar"
                        aria-valuenow={state.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground">{Math.round(state.progress)}%</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}

        {/* Review Phase */}
        {state.phase === 'review' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Review Import Results</AlertDialogTitle>
              <AlertDialogDescription>Check for any errors or warnings before accepting the import</AlertDialogDescription>
            </AlertDialogHeader>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4 pr-4">
                {/* Error display */}
                {state.error && (
                  <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-destructive text-sm">Import Failed</p>
                      <p className="text-sm text-destructive/80">{state.error}</p>
                    </div>
                  </div>
                )}

                {/* Summary */}
                {importStats && !state.error && <ImportSummary stats={importStats} />}

                {/* Errors and warnings list */}
                {!state.error && <ImportErrorsList errors={errors} warnings={warnings} onNavigateToEntity={handleNavigateToEntity} />}
              </div>
            </ScrollArea>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleReject} disabled={isSaving}>
                Reject & Start Over
              </AlertDialogCancel>

              {!state.error && (
                <Button onClick={handleAccept} disabled={isSaving || !canAccept}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Saving...
                    </>
                  ) : errors.length > 0 ? (
                    'Cannot Import - Fix Errors'
                  ) : (
                    'Accept & Import'
                  )}
                </Button>
              )}
            </AlertDialogFooter>
          </>
        )}

        {/* Saving Phase */}
        {state.phase === 'saving' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Saving Import...</AlertDialogTitle>
              <AlertDialogDescription>Your questbook is being saved to the project</AlertDialogDescription>
            </AlertDialogHeader>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 py-4 pr-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Saving snapshot to database...</p>
              </div>
            </ScrollArea>
          </>
        )}

        {/* Complete Phase */}
        {state.phase === 'complete' && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Import Complete</AlertDialogTitle>
              <AlertDialogDescription>Your questbook has been imported successfully</AlertDialogDescription>
            </AlertDialogHeader>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 py-4 pr-4">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" aria-hidden="true" />
                <p className="text-center text-sm font-medium">
                  {importStats?.quests ?? 0} quests across {importStats?.chapters ?? 0} chapters imported
                </p>
              </div>
            </ScrollArea>

            <AlertDialogFooter>
              <Button onClick={handleClose} variant="outline">
                Close
              </Button>
              <Button onClick={handleClose}>Go to Editor</Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
