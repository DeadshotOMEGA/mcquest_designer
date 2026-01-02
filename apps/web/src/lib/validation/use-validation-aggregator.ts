'use client'

import * as React from 'react'
import { useSnapshot } from '@/lib/store/editor-store'
import {
  aggregateValidationErrorsByEntity,
  aggregateValidationWarningsByEntity,
} from './validation-aggregator'

/**
 * Hook for retrieving error counts per entity
 *
 * Returns a memoized map of entityId -> error count
 * Recalculates only when snapshot changes
 *
 * Usage:
 * ```tsx
 * const errorCounts = useValidationErrors()
 * <TreeNode errorCount={errorCounts[questId]} ... />
 * ```
 */
export function useValidationErrors(): Record<string, number> {
  const snapshot = useSnapshot()

  return React.useMemo(() => {
    if (!snapshot) return {}
    return aggregateValidationErrorsByEntity(snapshot)
  }, [snapshot])
}

/**
 * Hook for retrieving warnings count per entity
 *
 * Similar to useValidationErrors but for warning-severity problems
 */
export function useValidationWarnings(): Record<string, number> {
  const snapshot = useSnapshot()

  return React.useMemo(() => {
    if (!snapshot) return {}
    return aggregateValidationWarningsByEntity(snapshot)
  }, [snapshot])
}
