'use client'

import * as React from 'react'
import { AlertCircle, AlertTriangle, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ImportProblem } from '@mcquest/snbt'
import { cn } from '@/lib/utils'

export interface ImportErrorsListProps {
  errors: ImportProblem[]
  warnings: ImportProblem[]
  onNavigateToEntity?: (entityId: string, type: 'quest' | 'chapter') => void
}

interface ProblemItemProps {
  problem: ImportProblem
  onNavigate?: (entityId: string, type: 'quest' | 'chapter') => void
}

/**
 * Individual problem item component
 *
 * Displays a single validation problem with:
 * - Severity icon and code
 * - Human-readable message
 * - Entity reference (if applicable)
 * - Navigation button to the entity (if onNavigate provided)
 */
function ProblemItem({ problem, onNavigate }: ProblemItemProps) {
  const SeverityIcon = problem.severity === 'error' ? AlertCircle : AlertTriangle
  const severityColor = problem.severity === 'error' ? 'text-destructive' : 'text-yellow-600 dark:text-yellow-500'

  const handleNavigate = () => {
    if (!problem.entity || !problem.entity.id || !onNavigate) return
    // Determine entity type: treat 'dependency' as 'quest'
    const entityType: 'quest' | 'chapter' = problem.entity.kind === 'chapter' ? 'chapter' : 'quest'
    onNavigate(problem.entity.id, entityType)
  }

  return (
    <div className={cn('border-l-2 px-4 py-3', problem.severity === 'error' ? 'border-destructive' : 'border-yellow-500')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <SeverityIcon className={cn('mt-0.5 h-4 w-4 flex-shrink-0', severityColor)} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-foreground">{problem.message}</p>
              <Badge variant="outline" className="text-xs whitespace-nowrap">
                {problem.code}
              </Badge>
            </div>
            {problem.entity && (
              <p className="mt-1 text-xs text-muted-foreground">
                {problem.entity.kind === 'quest' ? 'Quest' : problem.entity.kind === 'chapter' ? 'Chapter' : 'Dependency'}: {problem.entity.id}
              </p>
            )}
          </div>
        </div>

        {/* Navigate button */}
        {problem.entity && problem.entity.id && onNavigate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNavigate}
            className="flex-shrink-0 whitespace-nowrap"
            aria-label={`Navigate to ${problem.entity.kind}`}
          >
            <ArrowRight className="h-4 w-4 mr-1" aria-hidden="true" />
            <span className="hidden sm:inline">Go To</span>
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Collapsible section for grouped problems
 */
interface ProblemSectionProps {
  title: string
  icon: React.ReactNode
  problems: ImportProblem[]
  severity: 'error' | 'warning'
  onNavigateToEntity?: (entityId: string, type: 'quest' | 'chapter') => void
}

function ProblemSection({ title, icon, problems, severity, onNavigateToEntity }: ProblemSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(severity === 'error')

  if (problems.length === 0) {
    return null
  }

  const Icon = isExpanded ? ChevronDown : ChevronRight

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-3 text-left font-medium transition-colors',
          'hover:bg-muted/50'
        )}
        aria-expanded={isExpanded}
      >
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        {icon}
        <span className="flex-1">
          {title} ({problems.length})
        </span>
        <Badge variant={severity === 'error' ? 'destructive' : 'secondary'}>
          {problems.length}
        </Badge>
      </button>

      {isExpanded && (
        <div className="space-y-0 bg-muted/30">
          {problems.map((problem, index) => (
            <ProblemItem
              key={`${problem.code}-${problem.entity?.id ?? index}`}
              problem={problem}
              onNavigate={onNavigateToEntity}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * ImportErrorsList Component
 *
 * Displays validation errors and warnings from the import process.
 * Features:
 * - Grouped by severity (errors first, then warnings)
 * - Collapsible sections for each severity level
 * - Problem details: message, code, entity reference
 * - Navigation buttons to jump to problematic entities in the editor
 * - Visual indicators (icons, colors, badges)
 *
 * @example
 * ```tsx
 * <ImportErrorsList
 *   errors={result.problems.filter(p => p.severity === 'error')}
 *   warnings={result.problems.filter(p => p.severity === 'warning')}
 *   onNavigateToEntity={(entityId, type) => {
 *     selectEntity(entityId, type)
 *     closeDialog()
 *   }}
 * />
 * ```
 */
export function ImportErrorsList({ errors, warnings, onNavigateToEntity }: ImportErrorsListProps) {
  const hasErrors = errors.length > 0
  const hasWarnings = warnings.length > 0

  if (!hasErrors && !hasWarnings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">No issues found - ready to import</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Issues</CardTitle>
        <CardDescription>
          {hasErrors && `${errors.length} error${errors.length !== 1 ? 's' : ''}`}
          {hasErrors && hasWarnings && ' and '}
          {hasWarnings && `${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y border-t">
          <ProblemSection
            title="Errors"
            icon={<AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />}
            problems={errors}
            severity="error"
            onNavigateToEntity={onNavigateToEntity}
          />

          <ProblemSection
            title="Warnings"
            icon={<AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" aria-hidden="true" />}
            problems={warnings}
            severity="warning"
            onNavigateToEntity={onNavigateToEntity}
          />
        </div>
      </CardContent>
    </Card>
  )
}
