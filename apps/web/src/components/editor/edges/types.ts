import type { Edge } from '@xyflow/react'
import type { DependencyType } from '@mcquest/schema'

/**
 * Validation state for a dependency edge
 * Used to display error highlights (e.g., circular dependency)
 */
export type EdgeValidationState = 'valid' | 'warning' | 'error'

/**
 * Data structure for the DependencyEdge React Flow component
 *
 * Extends the Dependency schema with UI-specific state
 */
export type DependencyEdgeData = {
  // Dependency type from schema (AND/OR)
  dependencyType: DependencyType

  // Validation state (from validation engine)
  validationState: EdgeValidationState
  validationMessage?: string
}

/**
 * DependencyFlowEdge - React Flow edge type for quest dependencies
 *
 * edge.id follows the pattern: `${fromQuestId}-->${toQuestId}`
 * edge.source === fromQuestId
 * edge.target === toQuestId
 */
export type DependencyFlowEdge = Edge<DependencyEdgeData, 'dependency'>

/**
 * Edge style configurations for dependency types
 */
export const DEPENDENCY_TYPE_STYLES: Record<
  DependencyType,
  {
    strokeColor: string
    strokeDasharray?: string
    label: string
  }
> = {
  AND: {
    strokeColor: 'var(--foreground)',
    label: 'AND',
  },
  OR: {
    strokeColor: 'var(--primary)',
    strokeDasharray: '5 5',
    label: 'OR',
  },
}

/**
 * Edge style configurations for validation states
 */
export const VALIDATION_STATE_COLORS: Record<EdgeValidationState, string> = {
  valid: 'var(--foreground)',
  warning: '#eab308', // yellow-500
  error: '#ef4444', // red-500
}
