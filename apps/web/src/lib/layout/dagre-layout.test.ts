import { describe, it, expect } from 'vitest'
import { calculateLayout, getQuestLayoutKey } from './dagre-layout'
import type { Quest, Dependency } from '@mcquest/schema'

/**
 * Helper to create a test quest
 */
function createQuest(
  id: string,
  position: { x: number; y: number } = { x: 0, y: 0 }
): Quest {
  return {
    id,
    chapterId: 'chapter-1',
    title: `Quest ${id}`,
    position,
    shape: 'square',
    tasks: [],
    rewards: [],
    settings: {
      optional: false,
      hidden: 'false',
      repeatable: false,
      canRepeat: false,
      hideUntilDeps: false,
    },
  }
}

describe('dagre-layout', () => {
  describe('calculateLayout', () => {
    it('should return positions for a single quest', () => {
      const quest = createQuest('quest-1')
      const result = calculateLayout([quest], [])

      expect(result.positions.has('quest-1')).toBe(true)
      const pos = result.positions.get('quest-1')
      expect(pos?.x).toBeDefined()
      expect(pos?.y).toBeDefined()
    })

    it('should handle linear dependencies (A -> B -> C)', () => {
      const quests = [
        createQuest('a', { x: 0, y: 0 }),
        createQuest('b', { x: 100, y: 100 }),
        createQuest('c', { x: 200, y: 200 }),
      ]

      const dependencies: Dependency[] = [
        { fromQuestId: 'a', toQuestId: 'b', type: 'AND' },
        { fromQuestId: 'b', toQuestId: 'c', type: 'AND' },
      ]

      const result = calculateLayout(quests, dependencies)

      expect(result.positions.size).toBe(3)
      expect(result.positions.has('a')).toBe(true)
      expect(result.positions.has('b')).toBe(true)
      expect(result.positions.has('c')).toBe(true)

      // B should be below A (higher Y in TB layout)
      const posA = result.positions.get('a')!
      const posB = result.positions.get('b')!
      const posC = result.positions.get('c')!

      expect(posB.y).toBeGreaterThan(posA.y)
      expect(posC.y).toBeGreaterThan(posB.y)
    })

    it('should handle branching dependencies', () => {
      // A branches to B and C
      const quests = [
        createQuest('a'),
        createQuest('b'),
        createQuest('c'),
      ]

      const dependencies: Dependency[] = [
        { fromQuestId: 'a', toQuestId: 'b', type: 'AND' },
        { fromQuestId: 'a', toQuestId: 'c', type: 'AND' },
      ]

      const result = calculateLayout(quests, dependencies)

      expect(result.positions.size).toBe(3)

      const posA = result.positions.get('a')!
      const posB = result.positions.get('b')!
      const posC = result.positions.get('c')!

      // Both B and C should be below A
      expect(posB.y).toBeGreaterThan(posA.y)
      expect(posC.y).toBeGreaterThan(posA.y)
    })

    it('should handle merging dependencies (diamond)', () => {
      // A -> B, A -> C, B -> D, C -> D
      const quests = [
        createQuest('a'),
        createQuest('b'),
        createQuest('c'),
        createQuest('d'),
      ]

      const dependencies: Dependency[] = [
        { fromQuestId: 'a', toQuestId: 'b', type: 'AND' },
        { fromQuestId: 'a', toQuestId: 'c', type: 'AND' },
        { fromQuestId: 'b', toQuestId: 'd', type: 'AND' },
        { fromQuestId: 'c', toQuestId: 'd', type: 'AND' },
      ]

      const result = calculateLayout(quests, dependencies)

      expect(result.positions.size).toBe(4)

      const posA = result.positions.get('a')!
      const posB = result.positions.get('b')!
      const posC = result.positions.get('c')!
      const posD = result.positions.get('d')!

      // B and C should be below A
      expect(posB.y).toBeGreaterThan(posA.y)
      expect(posC.y).toBeGreaterThan(posA.y)

      // D should be below both B and C
      expect(posD.y).toBeGreaterThan(posB.y)
      expect(posD.y).toBeGreaterThan(posC.y)
    })

    it('should handle cycles gracefully', () => {
      // Create a cycle: A -> B -> C -> A
      const quests = [
        createQuest('a'),
        createQuest('b'),
        createQuest('c'),
      ]

      const dependencies: Dependency[] = [
        { fromQuestId: 'a', toQuestId: 'b', type: 'AND' },
        { fromQuestId: 'b', toQuestId: 'c', type: 'AND' },
        { fromQuestId: 'c', toQuestId: 'a', type: 'AND' }, // Cycle!
      ]

      // Should not throw; instead break the cycle
      const result = calculateLayout(quests, dependencies)

      expect(result.positions.size).toBe(3)
      expect(result.positions.has('a')).toBe(true)
      expect(result.positions.has('b')).toBe(true)
      expect(result.positions.has('c')).toBe(true)
    })

    it('should handle mixed valid and cyclic dependencies', () => {
      // A -> B -> C (valid), C -> B (cycle back)
      const quests = [
        createQuest('a'),
        createQuest('b'),
        createQuest('c'),
      ]

      const dependencies: Dependency[] = [
        { fromQuestId: 'a', toQuestId: 'b', type: 'AND' },
        { fromQuestId: 'b', toQuestId: 'c', type: 'AND' },
        { fromQuestId: 'c', toQuestId: 'b', type: 'AND' }, // Cycle
      ]

      const result = calculateLayout(quests, dependencies)

      expect(result.positions.size).toBe(3)
      // A should be above B (since A -> B is valid)
      expect(result.positions.get('b')!.y).toBeGreaterThan(
        result.positions.get('a')!.y
      )
    })

    it('should produce deterministic results for same input', () => {
      const quests = [
        createQuest('a', { x: 0, y: 0 }),
        createQuest('b', { x: 100, y: 100 }),
      ]

      const dependencies: Dependency[] = [
        { fromQuestId: 'a', toQuestId: 'b', type: 'AND' },
      ]

      // Run layout twice
      const result1 = calculateLayout(quests, dependencies)
      const result2 = calculateLayout(quests, dependencies)

      // Positions should be identical
      for (const questId of ['a', 'b']) {
        const pos1 = result1.positions.get(questId)
        const pos2 = result2.positions.get(questId)

        expect(pos1).toBeDefined()
        expect(pos2).toBeDefined()
        expect(pos1!.x).toBe(pos2!.x)
        expect(pos1!.y).toBe(pos2!.y)
      }
    })

    it('should respect custom layout options', () => {
      const quests = [createQuest('a'), createQuest('b')]
      const dependencies: Dependency[] = [
        { fromQuestId: 'a', toQuestId: 'b', type: 'AND' },
      ]

      // LR layout (left-to-right)
      const resultLR = calculateLayout(quests, dependencies, {
        direction: 'LR',
      })

      // TB layout (top-to-bottom)
      const resultTB = calculateLayout(quests, dependencies, {
        direction: 'TB',
      })

      const posALR = resultLR.positions.get('a')!
      const posBLR = resultLR.positions.get('b')!
      const posATB = resultTB.positions.get('a')!
      const posBTB = resultTB.positions.get('b')!

      // In LR, B should be to the right of A (higher X)
      expect(posBLR.x).toBeGreaterThan(posALR.x)

      // In TB, B should be below A (higher Y)
      expect(posBTB.y).toBeGreaterThan(posATB.y)
    })

    it('should handle empty graph', () => {
      const result = calculateLayout([], [])

      expect(result.positions.size).toBe(0)
    })

    it('should ignore self-loops', () => {
      const quests = [createQuest('a')]

      const dependencies: Dependency[] = [
        { fromQuestId: 'a', toQuestId: 'a', type: 'AND' }, // Self-loop
      ]

      const result = calculateLayout(quests, dependencies)

      expect(result.positions.size).toBe(1)
      expect(result.positions.has('a')).toBe(true)
    })

    it('should ignore dependencies with non-existent quests', () => {
      const quests = [createQuest('a')]

      const dependencies: Dependency[] = [
        { fromQuestId: 'a', toQuestId: 'nonexistent', type: 'AND' },
        { fromQuestId: 'nonexistent', toQuestId: 'a', type: 'AND' },
      ]

      const result = calculateLayout(quests, dependencies)

      // Should only have position for the valid quest
      expect(result.positions.size).toBe(1)
      expect(result.positions.has('a')).toBe(true)
    })
  })

  describe('getQuestLayoutKey', () => {
    it('should generate a unique key for each quest', () => {
      const quest1 = createQuest('quest-1', { x: 0, y: 0 })
      const quest2 = createQuest('quest-2', { x: 100, y: 100 })

      const key1 = getQuestLayoutKey(quest1)
      const key2 = getQuestLayoutKey(quest2)

      expect(key1).not.toBe(key2)
    })

    it('should generate same key for quests with same position and ID', () => {
      const quest1 = createQuest('quest-1', { x: 100, y: 50 })
      const quest2 = createQuest('quest-1', { x: 100, y: 50 })

      const key1 = getQuestLayoutKey(quest1)
      const key2 = getQuestLayoutKey(quest2)

      expect(key1).toBe(key2)
    })

    it('should incorporate Y, X, and ID in sort key', () => {
      // Create quests with specific positions
      const questY0 = createQuest('quest-a', { x: 100, y: 0 })
      const questY100 = createQuest('quest-b', { x: 50, y: 100 })

      const key0 = getQuestLayoutKey(questY0)
      const key100 = getQuestLayoutKey(questY100)

      // Keys should be different
      expect(key0).not.toBe(key100)
      // Keys should include position and ID information
      expect(key0).toContain('quest-a')
      expect(key100).toContain('quest-b')
      expect(key0).toContain('0:')
      expect(key100).toContain('100:')
    })
  })
})
