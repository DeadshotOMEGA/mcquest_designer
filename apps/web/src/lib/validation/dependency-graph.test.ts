import { describe, it, expect } from 'vitest'
import type { Dependency } from '@mcquest/schema'
import {
  DependencyGraph,
  validateDependency,
  findAllCycles,
} from './dependency-graph'

describe('DependencyGraph', () => {
  describe('cycle detection', () => {
    it('detects self-dependency as a cycle', () => {
      const deps: Dependency[] = []
      const graph = new DependencyGraph(deps)

      const result = graph.canAddDependency('quest-1', 'quest-1')

      expect(result.hasCycle).toBe(true)
      expect(result.message).toContain('cannot depend on itself')
    })

    it('detects direct cycle (A → B → A)', () => {
      const deps: Dependency[] = [
        { fromQuestId: 'quest-1', toQuestId: 'quest-2', type: 'AND' },
      ]
      const graph = new DependencyGraph(deps)

      // Attempting to add quest-2 → quest-1 would create: quest-1 → quest-2 → quest-1
      const result = graph.canAddDependency('quest-2', 'quest-1')

      expect(result.hasCycle).toBe(true)
      expect(result.cycle).toContain('quest-1')
      expect(result.cycle).toContain('quest-2')
    })

    it('detects indirect cycle (A → B → C → A)', () => {
      const deps: Dependency[] = [
        { fromQuestId: 'quest-1', toQuestId: 'quest-2', type: 'AND' },
        { fromQuestId: 'quest-2', toQuestId: 'quest-3', type: 'AND' },
      ]
      const graph = new DependencyGraph(deps)

      // Attempting to add quest-3 → quest-1 would create: quest-1 → quest-2 → quest-3 → quest-1
      const result = graph.canAddDependency('quest-3', 'quest-1')

      expect(result.hasCycle).toBe(true)
      expect(result.message).toContain('circular chain')
    })

    it('allows valid dependency chain (A → B → C)', () => {
      const deps: Dependency[] = [
        { fromQuestId: 'quest-1', toQuestId: 'quest-2', type: 'AND' },
        { fromQuestId: 'quest-2', toQuestId: 'quest-3', type: 'AND' },
      ]
      const graph = new DependencyGraph(deps)

      // Adding quest-3 → quest-4 is valid (doesn't create cycle)
      const result = graph.canAddDependency('quest-3', 'quest-4')

      expect(result.hasCycle).toBe(false)
      expect(result.cycle).toBeUndefined()
    })

    it('detects complex cycle (A → B, B → C, C → A)', () => {
      const deps: Dependency[] = [
        { fromQuestId: 'quest-a', toQuestId: 'quest-b', type: 'AND' },
        { fromQuestId: 'quest-b', toQuestId: 'quest-c', type: 'AND' },
      ]
      const graph = new DependencyGraph(deps)

      const result = graph.canAddDependency('quest-c', 'quest-a')

      expect(result.hasCycle).toBe(true)
    })

    it('detects cycle with multiple branches', () => {
      const deps: Dependency[] = [
        { fromQuestId: 'quest-1', toQuestId: 'quest-2', type: 'AND' },
        { fromQuestId: 'quest-1', toQuestId: 'quest-3', type: 'AND' },
        { fromQuestId: 'quest-2', toQuestId: 'quest-4', type: 'AND' },
        { fromQuestId: 'quest-3', toQuestId: 'quest-4', type: 'AND' },
      ]
      const graph = new DependencyGraph(deps)

      // quest-4 → quest-1 would create cycle regardless of multiple paths
      const result = graph.canAddDependency('quest-4', 'quest-1')

      expect(result.hasCycle).toBe(true)
    })
  })

  describe('findPathDFS', () => {
    it('finds direct path', () => {
      const deps: Dependency[] = [
        { fromQuestId: 'quest-1', toQuestId: 'quest-2', type: 'AND' },
      ]
      const graph = new DependencyGraph(deps)

      // Should find that quest-2 → quest-1 would create a cycle
      const result = graph.canAddDependency('quest-2', 'quest-1')
      expect(result.hasCycle).toBe(true)
    })

    it('finds multi-hop path', () => {
      const deps: Dependency[] = [
        { fromQuestId: 'a', toQuestId: 'b', type: 'AND' },
        { fromQuestId: 'b', toQuestId: 'c', type: 'AND' },
        { fromQuestId: 'c', toQuestId: 'd', type: 'AND' },
      ]
      const graph = new DependencyGraph(deps)

      // Adding d → a would create a cycle through the entire chain
      const result = graph.canAddDependency('d', 'a')
      expect(result.hasCycle).toBe(true)
    })

    it('returns no path when nodes are not connected', () => {
      const deps: Dependency[] = [
        { fromQuestId: 'quest-1', toQuestId: 'quest-2', type: 'AND' },
      ]
      const graph = new DependencyGraph(deps)

      // No connection between quest-3 and quest-1
      const result = graph.canAddDependency('quest-3', 'quest-1')

      expect(result.hasCycle).toBe(false)
    })
  })

  describe('findDependentsOf', () => {
    it('returns quests that depend on a given quest', () => {
      const deps: Dependency[] = [
        { fromQuestId: 'quest-1', toQuestId: 'quest-2', type: 'AND' },
        { fromQuestId: 'quest-3', toQuestId: 'quest-2', type: 'AND' },
      ]
      const graph = new DependencyGraph(deps)

      const dependents = graph.findDependentsOf('quest-2')

      expect(dependents).toContain('quest-1')
      expect(dependents).toContain('quest-3')
      expect(dependents.length).toBe(2)
    })

    it('returns empty array when no dependents', () => {
      const deps: Dependency[] = [
        { fromQuestId: 'quest-1', toQuestId: 'quest-2', type: 'AND' },
      ]
      const graph = new DependencyGraph(deps)

      const dependents = graph.findDependentsOf('quest-1')

      expect(dependents).toEqual([])
    })
  })

  describe('findDependenciesOf', () => {
    it('returns quests that a quest depends on', () => {
      const deps: Dependency[] = [
        { fromQuestId: 'quest-1', toQuestId: 'quest-2', type: 'AND' },
        { fromQuestId: 'quest-1', toQuestId: 'quest-3', type: 'AND' },
      ]
      const graph = new DependencyGraph(deps)

      const dependencies = graph.findDependenciesOf('quest-1')

      expect(dependencies).toContain('quest-2')
      expect(dependencies).toContain('quest-3')
      expect(dependencies.length).toBe(2)
    })

    it('returns empty array when no dependencies', () => {
      const deps: Dependency[] = [
        { fromQuestId: 'quest-1', toQuestId: 'quest-2', type: 'AND' },
      ]
      const graph = new DependencyGraph(deps)

      const dependencies = graph.findDependenciesOf('quest-2')

      expect(dependencies).toEqual([])
    })
  })

  describe('hasCycles', () => {
    it('detects no cycle in acyclic graph', () => {
      const deps: Dependency[] = [
        { fromQuestId: 'quest-1', toQuestId: 'quest-2', type: 'AND' },
        { fromQuestId: 'quest-2', toQuestId: 'quest-3', type: 'AND' },
        { fromQuestId: 'quest-3', toQuestId: 'quest-4', type: 'AND' },
      ]
      const graph = new DependencyGraph(deps)

      expect(graph.hasCycles()).toBe(false)
    })

    it('detects cycle in graph', () => {
      const deps: Dependency[] = [
        { fromQuestId: 'quest-1', toQuestId: 'quest-2', type: 'AND' },
        { fromQuestId: 'quest-2', toQuestId: 'quest-3', type: 'AND' },
        { fromQuestId: 'quest-3', toQuestId: 'quest-1', type: 'AND' },
      ]
      const graph = new DependencyGraph(deps)

      expect(graph.hasCycles()).toBe(true)
    })

    it('handles empty graph', () => {
      const deps: Dependency[] = []
      const graph = new DependencyGraph(deps)

      expect(graph.hasCycles()).toBe(false)
    })

    it('detects self-loop', () => {
      const deps: Dependency[] = [
        { fromQuestId: 'quest-1', toQuestId: 'quest-1', type: 'AND' },
      ]
      const graph = new DependencyGraph(deps)

      expect(graph.hasCycles()).toBe(true)
    })
  })

  describe('validateDependency', () => {
    it('returns undefined for valid dependency', () => {
      const deps: Dependency[] = [
        { fromQuestId: 'quest-1', toQuestId: 'quest-2', type: 'AND' },
      ]
      const newDep: Dependency = {
        fromQuestId: 'quest-2',
        toQuestId: 'quest-3',
        type: 'AND',
      }

      const result = validateDependency(newDep, deps)

      expect(result).toBeUndefined()
    })

    it('returns error for cyclic dependency', () => {
      const deps: Dependency[] = [
        { fromQuestId: 'quest-1', toQuestId: 'quest-2', type: 'AND' },
      ]
      const newDep: Dependency = {
        fromQuestId: 'quest-2',
        toQuestId: 'quest-1',
        type: 'AND',
      }

      const result = validateDependency(newDep, deps)

      expect(result).toBeDefined()
      expect(result?.hasCycle).toBe(true)
      expect(result?.message).toBeDefined()
    })
  })

  describe('findAllCycles', () => {
    it('finds all cycles in graph', () => {
      const deps: Dependency[] = [
        { fromQuestId: 'quest-1', toQuestId: 'quest-2', type: 'AND' },
        { fromQuestId: 'quest-2', toQuestId: 'quest-1', type: 'AND' },
      ]

      const cycles = findAllCycles(deps)

      expect(cycles.length).toBeGreaterThan(0)
    })

    it('returns empty array for acyclic graph', () => {
      const deps: Dependency[] = [
        { fromQuestId: 'quest-1', toQuestId: 'quest-2', type: 'AND' },
        { fromQuestId: 'quest-2', toQuestId: 'quest-3', type: 'AND' },
      ]

      const cycles = findAllCycles(deps)

      expect(cycles.length).toBe(0)
    })

    it('handles empty dependency list', () => {
      const deps: Dependency[] = []

      const cycles = findAllCycles(deps)

      expect(cycles.length).toBe(0)
    })
  })
})
