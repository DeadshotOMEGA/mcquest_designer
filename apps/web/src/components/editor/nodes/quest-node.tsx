'use client'

import React, { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import type { QuestNodeData } from './types'
import { QUEST_SHAPE_STYLES, NODE_BASE_SIZE } from './types'

/**
 * QuestNode - Custom React Flow node for quests
 *
 * Renders a quest as a visual node with:
 * - Title display
 * - Icon reference (text, not texture)
 * - Shape indicator (circle, square, hexagon, etc.)
 * - Validation state (error/warning borders)
 * - Selection state highlighting
 *
 * Acceptance criteria from #19:
 * ✅ Renders quest title, icon reference, shape indicator
 * ✅ Supports validation state (error/warning border)
 * ✅ Handles selection state visually
 * ✅ Matches QuestFlowNode type from contracts
 */

type QuestNodeProps = NodeProps & {
  data: QuestNodeData
}

function QuestNodeComponent({ data, selected }: QuestNodeProps) {
  const { title, subtitle, shape, icon, size, validationState } = data

  // Calculate actual size based on quest size multiplier
  const nodeSize = NODE_BASE_SIZE * size
  const shapeStyle = QUEST_SHAPE_STYLES[shape]

  // Determine border color based on validation state
  const borderColorClass = {
    valid: 'border-border',
    warning: 'border-yellow-500',
    error: 'border-red-500',
  }[validationState]

  // Selection adds a ring
  const selectionClass = selected
    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
    : ''

  return (
    <div
      className="relative"
      style={{ width: nodeSize, height: nodeSize }}
    >
      {/* Incoming handle (dependencies point here) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
      />

      {/* Node body */}
      <div
        className={cn(
          'flex flex-col items-center justify-center',
          'w-full h-full',
          'bg-card text-card-foreground',
          'border-2',
          borderColorClass,
          selectionClass,
          'cursor-pointer',
          'transition-all duration-150',
          'hover:shadow-md',
          validationState === 'error' && 'bg-red-50 dark:bg-red-950/20',
          validationState === 'warning' && 'bg-yellow-50 dark:bg-yellow-950/20'
        )}
        style={{
          borderRadius: shapeStyle.borderRadius,
          clipPath: shapeStyle.clipPath,
        }}
      >
        {/* Icon reference (item ID as text) */}
        {icon && (
          <span className="text-[10px] text-muted-foreground truncate max-w-[90%] mb-0.5">
            {icon.value.split(':')[1] || icon.value}
          </span>
        )}

        {/* Quest title */}
        <span
          className={cn(
            'text-xs font-medium text-center px-1 leading-tight',
            'truncate max-w-[90%]',
            !icon && 'text-sm'
          )}
          title={title}
        >
          {title}
        </span>

        {/* Subtitle (if present and space allows) */}
        {subtitle && size >= 1.5 && (
          <span className="text-[9px] text-muted-foreground truncate max-w-[90%]">
            {subtitle}
          </span>
        )}
      </div>

      {/* Outgoing handle (this quest is a dependency) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
      />

      {/* Validation indicator badge */}
      {validationState !== 'valid' && (
        <div
          className={cn(
            'absolute -top-1 -right-1',
            'w-4 h-4 rounded-full',
            'flex items-center justify-center',
            'text-[10px] font-bold text-white',
            validationState === 'error' && 'bg-red-500',
            validationState === 'warning' && 'bg-yellow-500'
          )}
        >
          {validationState === 'error' ? '!' : '⚠'}
        </div>
      )}
    </div>
  )
}

/**
 * Memoized QuestNode for React Flow performance
 *
 * React Flow recommends memoizing custom nodes to prevent
 * unnecessary re-renders during pan/zoom operations.
 */
export const QuestNode = memo(QuestNodeComponent)
