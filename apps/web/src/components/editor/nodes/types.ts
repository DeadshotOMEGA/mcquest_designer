import type { Node, BuiltInNode } from '@xyflow/react'
import type { QuestShape, IconReference, Quest } from '@mcquest/schema'

/**
 * Validation state for a quest node
 * Used to display error/warning borders
 */
export type ValidationState = 'valid' | 'warning' | 'error'

/**
 * Data structure for the QuestNode React Flow component
 *
 * This extends the Quest schema with UI-specific state:
 * - validationState: Current validation status
 * - validationMessages: Error/warning messages to display
 *
 * Note: Uses index signature for React Flow v12 compatibility
 */
export type QuestNodeData = {
  // Core quest data (subset of Quest schema)
  questId: string
  title: string
  subtitle?: string
  shape: QuestShape
  icon?: IconReference
  size: number

  // Validation state (from validation engine)
  validationState: ValidationState
  validationMessages?: string[]
}

/**
 * QuestFlowNode - React Flow node type for quests
 *
 * node.id === quest.id (UUID)
 * node.position comes from quest.position
 */
export type QuestFlowNode = Node<QuestNodeData, 'quest'>

/**
 * All node types in the editor
 */
export type EditorNode = QuestFlowNode | BuiltInNode

/**
 * Shape configurations for visual rendering
 */
export const QUEST_SHAPE_STYLES: Record<
  QuestShape,
  {
    borderRadius: string
    clipPath?: string
  }
> = {
  square: { borderRadius: '0' },
  rsquare: { borderRadius: '8px' },
  circle: { borderRadius: '50%' },
  diamond: {
    borderRadius: '0',
    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  },
  pentagon: {
    borderRadius: '0',
    clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
  },
  hexagon: {
    borderRadius: '0',
    clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
  },
  octagon: {
    borderRadius: '0',
    clipPath:
      'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
  },
}

/**
 * Default node dimensions
 */
export const NODE_BASE_SIZE = 64
export const NODE_MIN_SIZE = 48
export const NODE_MAX_SIZE = 128

/**
 * CompactQuestNodeData - minimal data for compact nodes
 *
 * Used by CompactQuestNode for auto-layout visualization.
 * Includes the full quest object plus UI state flags.
 */
export type CompactQuestNodeData = {
  quest: Quest
  isSelected: boolean
  isOptional: boolean
  onSelect?: (questId: string) => void
}
