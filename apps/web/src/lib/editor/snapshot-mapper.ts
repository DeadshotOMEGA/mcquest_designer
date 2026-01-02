import type { ProjectSnapshot, Quest, Dependency } from '@mcquest/schema'
import type { Node, Edge } from '@xyflow/react'
import type { CompactQuestNodeData } from '@/components/editor/nodes'
import type { DependencyEdgeData } from '@/components/editor/edges'

/**
 * Snapshot-to-ReactFlow Mapper
 *
 * Converts ProjectSnapshot data to React Flow nodes and edges for rendering.
 * This is a one-way conversion (snapshot -> React Flow).
 *
 * Key invariants (from #21):
 * - node.id === quest.id (UUID)
 * - edge.id follows ${fromQuestId}-->${toQuestId} pattern
 * - Filters by activeChapterId
 *
 * Uses compact quest nodes for auto-layout visualization (Phase 4).
 *
 * @see ReactFlow-to-Snapshot mapper in #22 for the reverse direction
 */

/**
 * Quest node type for React Flow (compact visualization)
 */
export type QuestFlowNode = Node<CompactQuestNodeData, 'compact-quest-node'>

/**
 * Dependency edge type for React Flow
 */
export type DependencyFlowEdge = Edge<DependencyEdgeData, 'dependency'>

/**
 * Options for snapshot mapping
 */
export interface SnapshotMapperOptions {
  /**
   * Active chapter ID - only quests in this chapter will be converted to nodes
   */
  activeChapterId: string

  /**
   * Optional validation results to attach to nodes/edges
   * Keys are entity IDs (quest or dependency)
   */
  validationResults?: Map<string, { state: 'warning' | 'error'; messages: string[] }>

  /**
   * Selected quest ID (for highlighting selected node)
   */
  selectedQuestId?: string | null

  /**
   * Callback when a quest node is clicked
   */
  onSelectQuest?: (questId: string) => void
}

/**
 * Convert quests to React Flow nodes
 *
 * Filters quests by activeChapterId and converts them to QuestFlowNode format.
 *
 * @param quests - All quests from the snapshot
 * @param options - Mapper options including active chapter filter
 * @returns Array of React Flow nodes for the active chapter
 */
export function snapshotToNodes(
  quests: Quest[],
  options: SnapshotMapperOptions
): QuestFlowNode[] {
  const { activeChapterId, selectedQuestId, onSelectQuest } = options

  return quests
    .filter((quest) => quest.chapterId === activeChapterId)
    .map((quest): QuestFlowNode => {
      return {
        // node.id === quest.id (UUID) - invariant from #21
        id: quest.id,
        type: 'compact-quest-node',
        position: {
          x: quest.position.x,
          y: quest.position.y,
        },
        data: {
          quest,
          isSelected: quest.id === selectedQuestId,
          isOptional: quest.settings.optional,
          onSelect: onSelectQuest,
        },
      }
    })
}

/**
 * Convert dependencies to React Flow edges
 *
 * Only includes dependencies where both source and target quests
 * are in the active chapter (i.e., both nodes are visible).
 *
 * @param dependencies - All dependencies from the snapshot
 * @param quests - All quests from the snapshot (for chapter filtering)
 * @param options - Mapper options including active chapter filter
 * @returns Array of React Flow edges for visible dependencies
 */
export function snapshotToEdges(
  dependencies: Dependency[],
  quests: Quest[],
  options: SnapshotMapperOptions
): DependencyFlowEdge[] {
  const { activeChapterId, validationResults } = options

  // Create a set of quest IDs in the active chapter for fast lookup
  const activeQuestIds = new Set(
    quests
      .filter((quest) => quest.chapterId === activeChapterId)
      .map((quest) => quest.id)
  )

  return dependencies
    .filter(
      // Only include dependencies where both quests are visible
      (dep) =>
        activeQuestIds.has(dep.fromQuestId) &&
        activeQuestIds.has(dep.toQuestId)
    )
    .map((dep): DependencyFlowEdge => {
      // edge.id follows ${from}-->${to} pattern - invariant from #21
      const edgeId = `${dep.fromQuestId}-->${dep.toQuestId}`

      // Get validation state for this dependency
      const validation = validationResults?.get(edgeId)

      return {
        id: edgeId,
        type: 'dependency',
        source: dep.fromQuestId,
        target: dep.toQuestId,
        data: {
          dependencyType: dep.type,
          validationState: validation?.state ?? 'valid',
          validationMessage: validation?.messages?.[0],
        },
      }
    })
}

/**
 * Result of snapshot to React Flow conversion
 */
export interface SnapshotToFlowResult {
  nodes: QuestFlowNode[]
  edges: DependencyFlowEdge[]
}

/**
 * Convert a ProjectSnapshot to React Flow nodes and edges
 *
 * This is the main entry point for converting snapshot data to React Flow format.
 * It handles chapter filtering and validation state mapping.
 *
 * @param snapshot - The project snapshot to convert
 * @param options - Mapper options including active chapter
 * @returns Object containing nodes and edges arrays
 *
 * @example
 * ```ts
 * const { nodes, edges } = snapshotToFlow(snapshot, {
 *   activeChapterId: uiState.activeChapterId,
 *   validationResults: validationEngine.validate(snapshot),
 * })
 * ```
 */
export function snapshotToFlow(
  snapshot: ProjectSnapshot,
  options: SnapshotMapperOptions
): SnapshotToFlowResult {
  return {
    nodes: snapshotToNodes(snapshot.quests, options),
    edges: snapshotToEdges(snapshot.dependencies, snapshot.quests, options),
  }
}
