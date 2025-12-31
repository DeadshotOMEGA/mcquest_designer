'use client'

import * as React from 'react'
import { AlertCircle, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useEditorStore, useSnapshot } from '@/lib/store/editor-store'
import {
  validateSnapshot,
  filterBySeverity,
  type Problem,
  type ValidationResult,
} from '@mcquest/schema'
import { cn } from '@/lib/utils'

/**
 * Debounce helper hook
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Collapsible section component for grouping problems by severity
 */
type ProblemSectionProps = {
  title: string
  count: number
  severity: 'error' | 'warning'
  problems: Problem[]
  isExpanded: boolean
  onToggle: () => void
  onProblemClick: (problem: Problem) => void
}

function ProblemSection({
  title,
  count,
  severity,
  problems,
  isExpanded,
  onToggle,
  onProblemClick,
}: ProblemSectionProps) {
  if (count === 0) return null

  const Icon = isExpanded ? ChevronDown : ChevronRight
  const SeverityIcon = severity === 'error' ? AlertCircle : AlertTriangle
  const severityColor = severity === 'error' ? 'text-destructive' : 'text-yellow-500'
  const badgeVariant = severity === 'error' ? 'destructive' : 'secondary'

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium',
          'hover:bg-muted/50 transition-colors'
        )}
        aria-expanded={isExpanded}
      >
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <SeverityIcon className={cn('h-4 w-4 shrink-0', severityColor)} />
        <span className="flex-1">{title}</span>
        <Badge variant={badgeVariant} className="ml-auto">
          {count}
        </Badge>
      </button>

      {isExpanded && (
        <div className="pb-2">
          {problems.map((problem, index) => (
            <ProblemItem
              key={`${problem.code}-${problem.entity?.id ?? index}`}
              problem={problem}
              onClick={() => onProblemClick(problem)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Individual problem item component
 */
type ProblemItemProps = {
  problem: Problem
  onClick: () => void
}

function ProblemItem({ problem, onClick }: ProblemItemProps) {
  const hasEntity = problem.entity?.kind === 'quest' || problem.entity?.kind === 'chapter'
  const isClickable = hasEntity

  return (
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={cn(
        'flex w-full flex-col gap-0.5 px-3 py-1.5 text-left text-xs',
        isClickable && 'hover:bg-muted/50 cursor-pointer transition-colors',
        !isClickable && 'cursor-default'
      )}
    >
      <span className="font-medium text-foreground">{problem.message}</span>
      {problem.entity && (
        <span className="text-muted-foreground">
          {problem.entity.kind}: {problem.entity.id.slice(0, 8)}...
        </span>
      )}
    </button>
  )
}

/**
 * ValidationPanel - Displays validation problems for the current snapshot
 *
 * Acceptance criteria from Issue #37:
 * - Lists all problems grouped by severity (errors first, then warnings)
 * - Click problem selects affected entity
 * - Updates on snapshot change (debounced 500ms)
 * - Collapsible by severity
 */
export function ValidationPanel() {
  const snapshot = useSnapshot()
  const selectQuest = useEditorStore((state) => state.selectQuest)
  const selectChapter = useEditorStore((state) => state.selectChapter)

  // Debounce the snapshot to avoid validating on every keystroke
  const debouncedSnapshot = useDebounce(snapshot, 500)

  // Expanded state for collapsible sections
  const [errorsExpanded, setErrorsExpanded] = React.useState(true)
  const [warningsExpanded, setWarningsExpanded] = React.useState(true)

  // Run validation when debounced snapshot changes
  const validationResult = React.useMemo<ValidationResult | null>(() => {
    if (!debouncedSnapshot) return null
    return validateSnapshot(debouncedSnapshot)
  }, [debouncedSnapshot])

  // Separate problems by severity
  const errors = React.useMemo(() => {
    if (!validationResult) return []
    return filterBySeverity(validationResult.problems, 'error')
  }, [validationResult])

  const warnings = React.useMemo(() => {
    if (!validationResult) return []
    return filterBySeverity(validationResult.problems, 'warning')
  }, [validationResult])

  // Handle clicking on a problem to select the affected entity
  const handleProblemClick = React.useCallback(
    (problem: Problem) => {
      if (!problem.entity) return

      if (problem.entity.kind === 'quest') {
        selectQuest(problem.entity.id)
      } else if (problem.entity.kind === 'chapter') {
        selectChapter(problem.entity.id)
      }
      // Dependencies don't have a direct selection mechanism
    },
    [selectQuest, selectChapter]
  )

  // Show loading state while waiting for debounce
  const isValidating = snapshot !== debouncedSnapshot

  if (!snapshot) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
        No project loaded
      </div>
    )
  }

  const totalProblems = (validationResult?.errorCount ?? 0) + (validationResult?.warningCount ?? 0)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Validation</h2>
        {isValidating ? (
          <Badge variant="outline" className="text-xs">
            Checking...
          </Badge>
        ) : totalProblems > 0 ? (
          <Badge variant={errors.length > 0 ? 'destructive' : 'secondary'} className="text-xs">
            {totalProblems} {totalProblems === 1 ? 'issue' : 'issues'}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-green-600">
            Valid
          </Badge>
        )}
      </div>

      {/* Problem list */}
      <ScrollArea className="flex-1">
        {totalProblems === 0 && !isValidating ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20">
              <AlertCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground">No validation issues found</p>
          </div>
        ) : (
          <div>
            <ProblemSection
              title="Errors"
              count={errors.length}
              severity="error"
              problems={errors}
              isExpanded={errorsExpanded}
              onToggle={() => setErrorsExpanded(!errorsExpanded)}
              onProblemClick={handleProblemClick}
            />
            <ProblemSection
              title="Warnings"
              count={warnings.length}
              severity="warning"
              problems={warnings}
              isExpanded={warningsExpanded}
              onToggle={() => setWarningsExpanded(!warningsExpanded)}
              onProblemClick={handleProblemClick}
            />
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
