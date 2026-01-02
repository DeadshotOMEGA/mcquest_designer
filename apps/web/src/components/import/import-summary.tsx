'use client'

import * as React from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface ImportStats {
  chapters: number
  quests: number
  rewardTables: number
  errors: number
  warnings: number
}

export interface ImportSummaryProps {
  stats: ImportStats
}

/**
 * ImportSummary Component
 *
 * Displays high-level statistics about the import result:
 * - Number of chapters imported
 * - Number of quests imported
 * - Number of reward tables
 * - Count of errors and warnings
 *
 * Uses badges for quick visual scanning of counts.
 * Errors are highlighted in red, warnings in yellow.
 *
 * @example
 * ```tsx
 * <ImportSummary
 *   stats={{
 *     chapters: 5,
 *     quests: 127,
 *     rewardTables: 3,
 *     errors: 2,
 *     warnings: 5
 *   }}
 * />
 * ```
 */
export function ImportSummary({ stats }: ImportSummaryProps) {
  const hasErrors = stats.errors > 0
  const hasWarnings = stats.warnings > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Chapters */}
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Chapters</p>
              <p className="text-lg font-semibold">{stats.chapters}</p>
            </div>
          </div>

          {/* Quests */}
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Quests</p>
              <p className="text-lg font-semibold">{stats.quests}</p>
            </div>
          </div>

          {/* Reward Tables */}
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Reward Tables</p>
              <p className="text-lg font-semibold">{stats.rewardTables}</p>
            </div>
          </div>

          {/* Errors */}
          {hasErrors && (
            <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-destructive/70">Errors</p>
                <p className="text-lg font-semibold text-destructive">{stats.errors}</p>
              </div>
            </div>
          )}

          {/* Warnings */}
          {hasWarnings && (
            <div className="flex items-center gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-500" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70">Warnings</p>
                <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-500">{stats.warnings}</p>
              </div>
            </div>
          )}
        </div>

        {/* Overall status */}
        <div className="mt-4 rounded-lg bg-muted p-3 text-sm">
          {!hasErrors && !hasWarnings && (
            <p className="text-muted-foreground">
              Ready to import: <strong>{stats.chapters}</strong> chapters with{' '}
              <strong>{stats.quests}</strong> quests
            </p>
          )}
          {hasErrors && (
            <p className="text-destructive">
              <strong>{stats.errors}</strong> error{stats.errors !== 1 ? 's' : ''} must be resolved before import
            </p>
          )}
          {!hasErrors && hasWarnings && (
            <p className="text-yellow-600 dark:text-yellow-500">
              <strong>{stats.warnings}</strong> warning{stats.warnings !== 1 ? 's' : ''} - import can proceed
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
