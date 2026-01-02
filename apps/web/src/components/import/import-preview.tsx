'use client'

import * as React from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight, Info } from 'lucide-react'
import type { ProjectSnapshot } from '@mcquest/schema'
import type { ImportProblem } from '@mcquest/snbt'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface ImportPreviewProps {
  /** Parsed project snapshot from SNBT conversion */
  snapshot: ProjectSnapshot | null
  /** Validation problems and warnings from converter */
  problems: ImportProblem[]
  /** Callback when user confirms import */
  onConfirm: () => void
  /** Callback when user cancels and goes back to file selection */
  onCancel: () => void
}

/**
 * Import preview component - displays parsed SNBT data before importing.
 *
 * Features:
 * - Project summary (name, chapter count, quest count, dependencies)
 * - Problem list with severity badges (errors block import)
 * - Chapter list preview
 * - Sample quest preview (first 5 quests)
 * - Accessible error/warning announcements
 * - Keyboard navigation support
 *
 * @example
 * ```tsx
 * <ImportPreview
 *   snapshot={convertedSnapshot}
 *   problems={validationProblems}
 *   onConfirm={() => handleImport()}
 *   onCancel={() => setStep('upload')}
 * />
 * ```
 */
export function ImportPreview({ snapshot, problems, onConfirm, onCancel }: ImportPreviewProps) {
  // Count problem severities
  const errorCount = problems.filter((p) => p.severity === 'error').length
  const warningCount = problems.filter((p) => p.severity === 'warning').length
  const hasBlockingErrors = errorCount > 0

  // Extract counts from snapshot
  const chapterCount = snapshot?.chapters.length ?? 0
  const questCount = snapshot?.quests.length ?? 0
  const dependencyCount = snapshot?.dependencies.length ?? 0
  const projectName = snapshot?.metadata.projectName ?? 'Unknown Project'

  // Get sample quests (first 5)
  const sampleQuests = snapshot?.quests.slice(0, 5) ?? []

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle>Import Preview</CardTitle>
          <CardDescription>
            Review the parsed questbook data before importing to your project
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <dt className="text-sm font-medium text-muted-foreground">Project Name</dt>
              <dd className="mt-1 text-lg font-semibold">{projectName}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-medium text-muted-foreground">Minecraft Version</dt>
              <dd className="mt-1 text-lg font-semibold">
                {snapshot?.metadata.targetMinecraftVersion ?? 'Unknown'}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-medium text-muted-foreground">Chapters</dt>
              <dd className="mt-1 text-lg font-semibold">{chapterCount}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-medium text-muted-foreground">Quests</dt>
              <dd className="mt-1 text-lg font-semibold">{questCount}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-medium text-muted-foreground">Dependencies</dt>
              <dd className="mt-1 text-lg font-semibold">{dependencyCount}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-medium text-muted-foreground">Import Source</dt>
              <dd className="mt-1 text-lg font-semibold">
                {snapshot?.metadata.importedFrom === 'snbt' ? 'FTB Quests SNBT' : 'Unknown'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Problems Card */}
      {problems.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Validation Results</CardTitle>
              <div className="flex gap-2">
                {errorCount > 0 && (
                  <Badge variant="destructive" aria-label={`${errorCount} errors found`}>
                    {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge variant="secondary" aria-label={`${warningCount} warnings found`}>
                    {warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Screen reader announcement for problem count */}
            <div
              className="sr-only"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {errorCount > 0 && `${errorCount} ${errorCount === 1 ? 'error' : 'errors'} found. `}
              {warningCount > 0 && `${warningCount} ${warningCount === 1 ? 'warning' : 'warnings'} found. `}
              {hasBlockingErrors && 'Import cannot proceed until errors are resolved.'}
            </div>

            <ul className="space-y-3" role="list" aria-label="Validation problems">
              {problems.map((problem, index) => (
                <li
                  key={`problem-${index}`}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3',
                    problem.severity === 'error' && 'border-destructive/50 bg-destructive/5',
                    problem.severity === 'warning' && 'border-yellow-500/50 bg-yellow-500/5'
                  )}
                >
                  {problem.severity === 'error' ? (
                    <AlertCircle
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive"
                      aria-hidden="true"
                    />
                  ) : (
                    <AlertTriangle
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-500"
                      aria-hidden="true"
                    />
                  )}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={problem.severity === 'error' ? 'destructive' : 'outline'}
                        className={cn(
                          problem.severity === 'warning' &&
                            'border-yellow-600 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                        )}
                      >
                        {problem.severity === 'error' ? 'Error' : 'Warning'}
                      </Badge>
                      <code className="text-xs text-muted-foreground">{problem.code}</code>
                    </div>
                    <p className="text-sm">{problem.message}</p>
                    {problem.entity && (
                      <p className="text-xs text-muted-foreground">
                        Entity: {problem.entity.kind}
                        {problem.entity.id && ` (${problem.entity.id})`}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {hasBlockingErrors && (
              <div
                className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive"
                role="alert"
                aria-live="assertive"
              >
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>
                  Import cannot proceed while errors exist. Please fix the issues in your SNBT
                  files and try again.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Success indicator when no problems */}
      {problems.length === 0 && (
        <div
          className="flex items-center gap-3 rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-green-700 dark:text-green-400"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">Validation Passed</p>
            <p className="text-sm">No problems detected. Ready to import.</p>
          </div>
        </div>
      )}

      {/* Chapters List */}
      {chapterCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Chapters ({chapterCount})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2" role="list" aria-label="Chapters">
              {snapshot?.chapters.map((chapter, index) => (
                <li
                  key={chapter.id}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{chapter.title}</p>
                    {chapter.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {chapter.description}
                      </p>
                    )}
                  </div>
                  {chapter.icon && (
                    <code className="text-xs text-muted-foreground">{chapter.icon.value}</code>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Sample Quests */}
      {sampleQuests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Sample Quests (showing {sampleQuests.length} of {questCount})
            </CardTitle>
            <CardDescription>
              Preview of the first few quests. All quests will be imported.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2" role="list" aria-label="Sample quests">
              {sampleQuests.map((quest) => (
                <li
                  key={quest.id}
                  className="flex items-start gap-3 rounded-lg border bg-card p-3"
                >
                  <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <p className="font-medium">{quest.title}</p>
                      {quest.subtitle && (
                        <p className="text-sm text-muted-foreground">{quest.subtitle}</p>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{quest.tasks.length} {quest.tasks.length === 1 ? 'task' : 'tasks'}</span>
                      <span>{quest.rewards.length} {quest.rewards.length === 1 ? 'reward' : 'rewards'}</span>
                      {quest.settings.optional && <Badge variant="outline">Optional</Badge>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {questCount > 5 && (
              <p className="mt-3 text-center text-sm text-muted-foreground">
                + {questCount - 5} more {questCount - 5 === 1 ? 'quest' : 'quests'}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          aria-label="Cancel import and return to file selection"
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={hasBlockingErrors}
          className="flex-1"
          aria-label={
            hasBlockingErrors
              ? 'Import disabled due to validation errors'
              : 'Confirm and proceed with import'
          }
        >
          {hasBlockingErrors ? 'Cannot Import (Errors)' : 'Confirm Import'}
        </Button>
      </div>
    </div>
  )
}
