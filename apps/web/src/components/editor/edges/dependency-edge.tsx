'use client'

import React, { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
import { cn } from '@/lib/utils'
import type { DependencyEdgeData } from './types'
import { DEPENDENCY_TYPE_STYLES, VALIDATION_STATE_COLORS } from './types'

/**
 * DependencyEdge - Custom React Flow edge for quest dependencies
 *
 * Renders a dependency between two quests with:
 * - Bezier curve from source to target
 * - Arrow marker at target end
 * - Visual distinction for AND vs OR types (solid vs dashed)
 * - Validation state coloring (error = red, warning = yellow)
 * - Label showing dependency type
 *
 * Acceptance criteria from #20:
 * ✅ Renders arrow from source to target
 * ✅ Visual distinction for AND vs OR dependency types
 * ✅ Supports validation state
 */

type DependencyEdgeProps = EdgeProps & {
  data?: DependencyEdgeData
}

function DependencyEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: DependencyEdgeProps) {
  // Get path for the edge
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  // Default to AND type and valid state if data not provided
  const dependencyType = data?.dependencyType ?? 'AND'
  const validationState = data?.validationState ?? 'valid'

  // Get styles based on type and validation state
  const typeStyle = DEPENDENCY_TYPE_STYLES[dependencyType]

  // Validation state overrides color
  const strokeColor =
    validationState !== 'valid'
      ? VALIDATION_STATE_COLORS[validationState]
      : typeStyle.strokeColor

  // Selection state
  const strokeWidth = selected ? 3 : 2
  const opacity = selected ? 1 : 0.8

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: typeStyle.strokeDasharray,
          opacity,
        }}
        markerEnd="url(#dependency-arrow)"
      />

      {/* Edge label (shows AND/OR) */}
      <EdgeLabelRenderer>
        <div
          className={cn(
            'absolute pointer-events-all nodrag nopan',
            'px-1.5 py-0.5 rounded text-[10px] font-medium',
            'bg-background border border-border shadow-sm',
            validationState === 'error' && 'border-red-500 text-red-600',
            validationState === 'warning' && 'border-yellow-500 text-yellow-600',
            selected && 'ring-1 ring-primary'
          )}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          {typeStyle.label}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

/**
 * Memoized DependencyEdge for React Flow performance
 */
export const DependencyEdge = memo(DependencyEdgeComponent)

/**
 * SVG marker definition for arrow heads
 * Must be included once in the ReactFlow component
 */
export function DependencyEdgeMarker() {
  return (
    <svg style={{ position: 'absolute', top: 0, left: 0 }}>
      <defs>
        <marker
          id="dependency-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill="currentColor"
            className="text-foreground"
          />
        </marker>
      </defs>
    </svg>
  )
}
