import type { Dependency } from '@mcquest/schema'

/**
 * Cycle detection result
 */
export interface CycleDetectionResult {
  hasCycle: boolean
  cycle?: string[] // Path that forms a cycle
  message?: string
}

/**
 * Dependency graph analyzer using DFS (Depth-First Search)
 * Detects cycles in quest dependencies
 */
export class DependencyGraph {
  private graph: Map<string, Set<string>> = new Map()
  private dependencies: Dependency[]

  constructor(dependencies: Dependency[]) {
    this.dependencies = dependencies
    this.buildGraph()
  }

  /**
   * Build adjacency list representation of dependency graph
   * fromQuestId → Set of toQuestId
   */
  private buildGraph(): void {
    for (const dep of this.dependencies) {
      if (!this.graph.has(dep.fromQuestId)) {
        this.graph.set(dep.fromQuestId, new Set())
      }
      this.graph.get(dep.fromQuestId)!.add(dep.toQuestId)
    }
  }

  /**
   * Check if adding a new dependency would create a cycle
   * Uses DFS to detect if there's already a path from toQuestId to fromQuestId
   * If so, adding fromQuestId → toQuestId would create: toQuestId → ... → fromQuestId → toQuestId
   */
  canAddDependency(fromQuestId: string, toQuestId: string): CycleDetectionResult {
    // Self-dependency is always invalid
    if (fromQuestId === toQuestId) {
      return {
        hasCycle: true,
        cycle: [fromQuestId],
        message: `Cannot add dependency: quest cannot depend on itself`,
      }
    }

    // Check if there's already a path from toQuestId to fromQuestId
    const cycle = this.findPathDFS(toQuestId, fromQuestId)

    if (cycle) {
      // Path exists: toQuestId → ... → fromQuestId
      // Adding fromQuestId → toQuestId creates: toQuestId → ... → fromQuestId → toQuestId
      const fullCycle = [...cycle, toQuestId]
      const message = `Cannot add dependency: would create circular chain ${fullCycle.join(' → ')}`
      return {
        hasCycle: true,
        cycle: fullCycle,
        message,
      }
    }

    return {
      hasCycle: false,
    }
  }

  /**
   * Find a path from start to end using DFS
   * Returns the path if found (excluding start, including end)
   * Returns undefined if no path exists
   */
  private findPathDFS(start: string, end: string, visited = new Set<string>()): string[] | undefined {
    if (start === end) {
      return [end]
    }

    if (visited.has(start)) {
      return undefined
    }

    visited.add(start)

    const neighbors = this.graph.get(start)
    if (!neighbors) {
      return undefined
    }

    for (const neighbor of neighbors) {
      const path = this.findPathDFS(neighbor, end, new Set(visited))
      if (path) {
        return [start, ...path]
      }
    }

    return undefined
  }

  /**
   * Check if there are any cycles in the entire graph
   * Uses DFS from each unvisited node
   */
  hasCycles(): boolean {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    for (const questId of this.graph.keys()) {
      if (!visited.has(questId)) {
        if (this.hasCycleDFS(questId, visited, recursionStack)) {
          return true
        }
      }
    }

    return false
  }

  /**
   * DFS helper to detect cycles (detects if node is in current recursion stack)
   */
  private hasCycleDFS(
    questId: string,
    visited: Set<string>,
    recursionStack: Set<string>
  ): boolean {
    visited.add(questId)
    recursionStack.add(questId)

    const neighbors = this.graph.get(questId)
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (this.hasCycleDFS(neighbor, visited, recursionStack)) {
            return true
          }
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle: neighbor is in current recursion stack
          return true
        }
      }
    }

    recursionStack.delete(questId)
    return false
  }

  /**
   * Find all quests that depend on a given quest (incoming dependencies)
   */
  findDependentsOf(questId: string): string[] {
    const dependents: string[] = []

    for (const [fromId, toIds] of this.graph) {
      if (toIds.has(questId)) {
        dependents.push(fromId)
      }
    }

    return dependents
  }

  /**
   * Find all quests that a given quest depends on (outgoing dependencies)
   */
  findDependenciesOf(questId: string): string[] {
    return Array.from(this.graph.get(questId) ?? [])
  }
}

/**
 * Validate a dependency before adding it
 * Returns structured error if invalid, undefined if valid
 */
export function validateDependency(
  dependency: Dependency,
  allDependencies: Dependency[]
): CycleDetectionResult | undefined {
  const graph = new DependencyGraph(allDependencies)
  const result = graph.canAddDependency(dependency.fromQuestId, dependency.toQuestId)

  return result.hasCycle ? result : undefined
}

/**
 * Get all cycles in the graph (for debugging/reporting)
 */
export function findAllCycles(dependencies: Dependency[]): string[][] {
  const cycles: string[][] = []
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  const currentPath: string[] = []

  const graph = new Map<string, Set<string>>()
  for (const dep of dependencies) {
    if (!graph.has(dep.fromQuestId)) {
      graph.set(dep.fromQuestId, new Set())
    }
    graph.get(dep.fromQuestId)!.add(dep.toQuestId)
  }

  function dfs(questId: string): void {
    visited.add(questId)
    recursionStack.add(questId)
    currentPath.push(questId)

    const neighbors = graph.get(questId)
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor)
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = currentPath.indexOf(neighbor)
          if (cycleStart !== -1) {
            const cycle = currentPath.slice(cycleStart).concat(neighbor)
            cycles.push(cycle)
          }
        }
      }
    }

    currentPath.pop()
    recursionStack.delete(questId)
  }

  for (const questId of graph.keys()) {
    if (!visited.has(questId)) {
      dfs(questId)
    }
  }

  return cycles
}
