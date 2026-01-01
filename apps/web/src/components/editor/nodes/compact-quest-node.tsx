'use client'

import React, { memo, useCallback } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Star, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Quest } from '@mcquest/schema'

/**
 * Data structure for compact quest node
 *
 * Minimal data required to render a quest in compact form:
 * - quest: The full quest object for context
 * - isSelected: Whether this node is currently selected
 * - isOptional: Whether this quest is optional
 * - onSelect: Callback when node is clicked
 */
export interface CompactQuestNodeData {
  quest: Quest
  isSelected: boolean
  isOptional: boolean
  onSelect?: (questId: string) => void
}

type CompactQuestNodeProps = NodeProps & {
  data: CompactQuestNodeData
}

/**
 * CompactQuestNode - Minimal quest node for auto-layout visualization
 *
 * Features:
 * - Minimal size: icon + title only (40px base)
 * - Visual badges: optional (star), required (checkmark)
 * - Click handler for opening details modal
 * - Hover state highlighting
 * - Uses shadcn/ui components and Tailwind
 *
 * Design:
 * - Icon (16px) + title text (truncated)
 * - Optional badge: star in top-right
 * - Required badge: checkmark (omitted if optional)
 * - Selection ring when selected
 * - Subtle hover shadow
 *
 * Acceptance criteria from T4.2:
 * ✅ Minimal size: icon + title only
 * ✅ Visual badges: optional (star), required (checkmark)
 * ✅ Click handler for opening details modal
 * ✅ Hover state highlighting
 * ✅ Uses shadcn/ui components and Tailwind styles
 */
function CompactQuestNodeComponent({ data, isConnectable }: CompactQuestNodeProps) {
  const { quest, isSelected, isOptional, onSelect } = data

  // Handle click to select/open this quest
  const handleClick = useCallback(() => {
    if (onSelect) {
      onSelect(quest.id)
    }
  }, [quest.id, onSelect])

  // Extract item name from icon reference (e.g., "minecraft:book" -> "book")
  const iconName = quest.icon?.value.split(':')[1] || '?'

  // Determine background color based on selection state
  const bgColor = isSelected
    ? 'bg-primary text-primary-foreground'
    : 'bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground'

  return (
    <div className="relative">
      {/* Incoming handle (dependencies point here) */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-2 !h-2 !bg-muted-foreground !border !border-background"
      />

      {/* Node body */}
      <button
        onClick={handleClick}
        className={cn(
          'relative',
          'flex flex-col items-center justify-center gap-0.5',
          'w-10 h-10 px-1.5 py-1',
          'rounded-md',
          'border border-border',
          'transition-all duration-150',
          'hover:shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          bgColor,
          isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md'
        )}
        title={quest.title}
      >
        {/* Icon reference text (very small) */}
        <span className="text-[9px] font-medium leading-none truncate w-full text-center">
          {iconName}
        </span>

        {/* Quest title (truncated with tooltip) */}
        <span className="text-[10px] font-medium leading-tight truncate w-full text-center">
          {quest.title}
        </span>
      </button>

      {/* Optional badge - star in top-right corner */}
      {isOptional && (
        <div
          className={cn(
            'absolute -top-1.5 -right-1.5',
            'flex items-center justify-center',
            'w-4 h-4 rounded-full',
            'bg-amber-400 text-amber-900',
            'shadow-sm'
          )}
          title="Optional quest"
        >
          <Star className="w-2.5 h-2.5 fill-current" />
        </div>
      )}

      {/* Required badge - checkmark (only if not optional) */}
      {!isOptional && (
        <div
          className={cn(
            'absolute -top-1.5 -right-1.5',
            'flex items-center justify-center',
            'w-4 h-4 rounded-full',
            'bg-green-400 text-green-900',
            'shadow-sm'
          )}
          title="Required quest"
        >
          <CheckCircle2 className="w-2.5 h-2.5" />
        </div>
      )}

      {/* Outgoing handle (this quest is a dependency) */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!w-2 !h-2 !bg-muted-foreground !border !border-background"
      />
    </div>
  )
}

/**
 * Memoized CompactQuestNode for React Flow performance
 *
 * React Flow recommends memoizing custom nodes to prevent
 * unnecessary re-renders during pan/zoom operations.
 */
export const CompactQuestNode = memo(CompactQuestNodeComponent)
