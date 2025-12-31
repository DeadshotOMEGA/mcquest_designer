import {
  ProjectSnapshotSchema,
  type ProjectSnapshot,
  type Quest,
  type Dependency,
  type DependencyType,
} from '@mcquest/schema'
import type { Node, Edge, XYPosition } from '@xyflow/react'
import type { QuestNodeData } from '@/components/editor/nodes'
import type { DependencyEdgeData } from '@/components/editor/edges'

/**
 * ReactFlow-to-Snapshot Mapper
 *
 * Converts React Flow changes back to ProjectSnapshot format.
 * This is the reverse of snapshot-mapper.ts (#21).
 *
 * Key operations:
 * - Updates quest positions from node drag operations
 * - Syncs dependencies from edge add/remove operations
 * - Preserves all non-UI quest data
 * - Validates output with Zod schema
 *
 * @see snapshot-mapper.ts for the forward direction (snapshot -> React Flow)
 */

/**
 * Update quest positions from React Flow node positions
 *
 * Takes the current nodes and updates the corresponding quest positions
 * in the snapshot. Preserves all other quest data.
 *
 * @param snapshot - Current project snapshot
 * @param nodes - Current React Flow nodes
 * @returns Updated snapshot with new quest positions
 */
export function updateQuestPositions(
  snapshot: ProjectSnapshot,
  nodes: Node<QuestNodeData>[]
): ProjectSnapshot {
  // Create a map of node positions by quest ID
  const positionMap = new Map<string, XYPosition>()
  for (const node of nodes) {
    positionMap.set(node.id, node.position)
  }

  // Update quest positions
  const updatedQuests = snapshot.quests.map((quest): Quest => {
    const newPosition = positionMap.get(quest.id)
    if (newPosition) {
      return {
        ...quest,
        position: {
          x: newPosition.x,
          y: newPosition.y,
        },
      }
    }
    return quest
  })

  return {
    ...snapshot,
    quests: updatedQuests,
    metadata: {
      ...snapshot.metadata,
      updatedAt: new Date().toISOString(),
    },
  }
}

/**
 * Parse edge ID to extract source and target quest IDs
 *
 * Edge IDs follow the pattern: ${fromQuestId}-->${toQuestId}
 *
 * @param edgeId - The edge ID to parse
 * @returns Object with fromQuestId and toQuestId, or null if invalid
 */
function parseEdgeId(edgeId: string): { fromQuestId: string; toQuestId: string } | null {
  const match = edgeId.match(/^(.+)-->(.+)$/)
  if (!match) return null
  return {
    fromQuestId: match[1],
    toQuestId: match[2],
  }
}

/**
 * Sync dependencies from React Flow edges
 *
 * Compares current edges with snapshot dependencies and applies
 * additions and removals. Preserves dependency type from edge data.
 *
 * @param snapshot - Current project snapshot
 * @param edges - Current React Flow edges
 * @param activeChapterId - Active chapter (for scoping changes)
 * @returns Updated snapshot with synced dependencies
 */
export function syncDependencies(
  snapshot: ProjectSnapshot,
  edges: Edge<DependencyEdgeData>[],
  activeChapterId: string
): ProjectSnapshot {
  // Get quest IDs in the active chapter
  const activeQuestIds = new Set(
    snapshot.quests
      .filter((quest) => quest.chapterId === activeChapterId)
      .map((quest) => quest.id)
  )

  // Build a set of existing dependency keys for active chapter
  const existingDeps = new Map<string, Dependency>()
  for (const dep of snapshot.dependencies) {
    if (activeQuestIds.has(dep.fromQuestId) && activeQuestIds.has(dep.toQuestId)) {
      const key = `${dep.fromQuestId}-->${dep.toQuestId}`
      existingDeps.set(key, dep)
    }
  }

  // Build a set of edge keys from React Flow
  const edgeDeps = new Map<string, { from: string; to: string; type: DependencyType }>()
  for (const edge of edges) {
    const parsed = parseEdgeId(edge.id)
    if (parsed) {
      edgeDeps.set(edge.id, {
        from: parsed.fromQuestId,
        to: parsed.toQuestId,
        type: edge.data?.dependencyType ?? 'AND',
      })
    }
  }

  // Find dependencies to remove (exist in snapshot but not in edges)
  const depsToRemove = new Set<string>()
  for (const key of existingDeps.keys()) {
    if (!edgeDeps.has(key)) {
      depsToRemove.add(key)
    }
  }

  // Find dependencies to add (exist in edges but not in snapshot)
  const depsToAdd: Dependency[] = []
  for (const [key, edge] of edgeDeps.entries()) {
    if (!existingDeps.has(key)) {
      depsToAdd.push({
        fromQuestId: edge.from,
        toQuestId: edge.to,
        type: edge.type,
      })
    }
  }

  // Apply changes
  const updatedDependencies = [
    // Keep dependencies not being removed
    ...snapshot.dependencies.filter((dep) => {
      const key = `${dep.fromQuestId}-->${dep.toQuestId}`
      return !depsToRemove.has(key)
    }),
    // Add new dependencies
    ...depsToAdd,
  ]

  return {
    ...snapshot,
    dependencies: updatedDependencies,
    metadata: {
      ...snapshot.metadata,
      updatedAt: new Date().toISOString(),
    },
  }
}

/**
 * Options for flow-to-snapshot conversion
 */
export interface FlowToSnapshotOptions {
  /**
   * Active chapter ID for scoping dependency changes
   */
  activeChapterId: string

  /**
   * Whether to validate the output with Zod schema
   * @default true
   */
  validate?: boolean
}

/**
 * Result of flow-to-snapshot conversion
 */
export interface FlowToSnapshotResult {
  /**
   * Updated snapshot (or original if validation failed)
   */
  snapshot: ProjectSnapshot

  /**
   * Whether the conversion was successful
   */
  success: boolean

  /**
   * Validation errors if any
   */
  errors?: string[]
}

/**
 * Apply React Flow changes back to a ProjectSnapshot
 *
 * This is the main entry point for syncing React Flow state back to the snapshot.
 * It handles position updates and dependency changes, then validates the result.
 *
 * @param originalSnapshot - The original snapshot before changes
 * @param nodes - Current React Flow nodes
 * @param edges - Current React Flow edges
 * @param options - Conversion options
 * @returns Updated snapshot with validation result
 *
 * @example
 * ```ts
 * const result = flowToSnapshot(
 *   currentSnapshot,
 *   reactFlowNodes,
 *   reactFlowEdges,
 *   { activeChapterId: uiState.activeChapterId }
 * )
 *
 * if (result.success) {
 *   setSnapshot(result.snapshot)
 * } else {
 *   console.error('Validation failed:', result.errors)
 * }
 * ```
 */
export function flowToSnapshot(
  originalSnapshot: ProjectSnapshot,
  nodes: Node<QuestNodeData>[],
  edges: Edge<DependencyEdgeData>[],
  options: FlowToSnapshotOptions
): FlowToSnapshotResult {
  const { activeChapterId, validate = true } = options

  // Apply position updates
  let updatedSnapshot = updateQuestPositions(originalSnapshot, nodes)

  // Apply dependency changes
  updatedSnapshot = syncDependencies(updatedSnapshot, edges, activeChapterId)

  // Validate if requested
  if (validate) {
    const parseResult = ProjectSnapshotSchema.safeParse(updatedSnapshot)
    if (!parseResult.success) {
      return {
        snapshot: originalSnapshot,
        success: false,
        errors: parseResult.error.errors.map(
          (e) => `${e.path.join('.')}: ${e.message}`
        ),
      }
    }
    return {
      snapshot: parseResult.data,
      success: true,
    }
  }

  return {
    snapshot: updatedSnapshot,
    success: true,
  }
}
