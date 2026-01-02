import dagre from '@dagrejs/dagre'
import type { Quest, Dependency } from '@mcquest/schema'

/**
 * Configuration options for the dagre auto-layout algorithm
 */
export interface LayoutOptions {
  /** Direction of the layout: TB (top-to-bottom) or LR (left-to-right) */
  direction: 'TB' | 'LR'
  /** Node width in pixels */
  nodeWidth: number
  /** Node height in pixels */
  nodeHeight: number
  /** Vertical spacing between ranks (pixels) */
  rankSep: number
  /** Horizontal spacing between nodes in same rank (pixels) */
  nodeSep: number
}

/**
 * Result of layout calculation
 */
export interface LayoutResult {
  /** Map of quest ID to calculated position */
  positions: Map<string, { x: number; y: number }>
}

/**
 * Default layout options for compact quest nodes
 * Compact nodes are 40x40px (w-10 h-10 in CompactQuestNode)
 */
const DEFAULT_LAYOUT_OPTIONS: LayoutOptions = {
  direction: 'TB',
  nodeWidth: 40,
  nodeHeight: 40,
  rankSep: 100,
  nodeSep: 60,
}

/**
 * Stable sort key for quests to ensure deterministic ordering
 * Used to break ordering ties and ensure consistent layout across runs
 */
function getQuestSortKey(quest: Quest): string {
  return `${quest.position.y}:${quest.position.x}:${quest.id}`
}

/**
 * Detects cycles in the dependency graph and returns one edge from each cycle
 * This allows us to break cycles so dagre can process the graph as a DAG
 *
 * @param questIds Set of all quest IDs
 * @param dependencies Array of dependencies
 * @returns Array of dependency edges that form cycles
 */
function detectCycles(
  questIds: Set<string>,
  dependencies: Dependency[]
): Array<{ from: string; to: string }> {
  // Build adjacency list
  const adj = new Map<string, string[]>()
  for (const questId of questIds) {
    adj.set(questId, [])
  }

  for (const dep of dependencies) {
    if (questIds.has(dep.fromQuestId) && questIds.has(dep.toQuestId)) {
      const neighbors = adj.get(dep.fromQuestId)
      if (neighbors) {
        neighbors.push(dep.toQuestId)
      }
    }
  }

  // DFS to find cycles
  const cycleEdges: Array<{ from: string; to: string }> = []
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function dfs(node: string): void {
    visited.add(node)
    recursionStack.add(node)

    const neighbors = adj.get(node) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor)
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle: edge from node to neighbor
        cycleEdges.push({ from: node, to: neighbor })
      }
    }

    recursionStack.delete(node)
  }

  for (const questId of questIds) {
    if (!visited.has(questId)) {
      dfs(questId)
    }
  }

  return cycleEdges
}

/**
 * Calculates layout positions for quests using dagre (DAG-based layout)
 *
 * This function:
 * 1. Creates a directed acyclic graph from quests and dependencies
 * 2. Detects and breaks cycles to allow dagre to process
 * 3. Runs dagre layout algorithm
 * 4. Returns deterministic positions for each quest
 *
 * @param quests Array of quests to layout
 * @param dependencies Array of quest dependencies (edges in the graph)
 * @param options Layout configuration options
 * @returns Layout result with position map
 */
export function calculateLayout(
  quests: Quest[],
  dependencies: Dependency[],
  options?: Partial<LayoutOptions>
): LayoutResult {
  const config = { ...DEFAULT_LAYOUT_OPTIONS, ...options }

  // Create dagre graph
  const g = new dagre.graphlib.Graph({ directed: true })
  g.setGraph({
    rankdir: config.direction === 'TB' ? 'TB' : 'LR',
    ranksep: config.rankSep,
    nodesep: config.nodeSep,
    marginx: 40,
    marginy: 40,
  })

  // Set default node and edge config
  g.setDefaultEdgeLabel(() => ({}))

  // Add nodes for all quests
  for (const quest of quests) {
    g.setNode(quest.id, {
      width: config.nodeWidth,
      height: config.nodeHeight,
    })
  }

  // Identify quest IDs and detect cycles
  const questIds = new Set(quests.map((q) => q.id))
  const cycleEdges = detectCycles(questIds, dependencies)
  const cycleSet = new Set(cycleEdges.map((e) => `${e.from}-->${e.to}`))

  // Add edges for non-cyclic dependencies
  for (const dep of dependencies) {
    const edgeKey = `${dep.fromQuestId}-->${dep.toQuestId}`
    if (!cycleSet.has(edgeKey)) {
      g.setEdge(dep.fromQuestId, dep.toQuestId)
    }
  }

  // Run dagre layout
  dagre.layout(g)

  // Extract positions from dagre graph
  const positions = new Map<string, { x: number; y: number }>()

  for (const quest of quests) {
    const node = g.node(quest.id)
    if (node) {
      positions.set(quest.id, {
        x: node.x,
        y: node.y,
      })
    }
  }

  return { positions }
}

/**
 * Helper function to get a deterministic sort key for quests
 * Useful for other sorting operations that need to match layout determinism
 *
 * @param quest Quest to get sort key for
 * @returns Sort key string
 */
export function getQuestLayoutKey(quest: Quest): string {
  return getQuestSortKey(quest)
}
