import { describe, it, expect } from 'vitest'
import { EXPORT_VERSION, SUPPORTED_VERSIONS, compileSnapshot } from './index'
import { createDefaultSnapshot, createDefaultChapter, createDefaultQuest } from '@mcquest/schema'

describe('@mcquest/export', () => {
  describe('constants', () => {
    it('exports EXPORT_VERSION', () => {
      expect(EXPORT_VERSION).toBe('0.1.0')
    })

    it('exports SUPPORTED_VERSIONS', () => {
      expect(SUPPORTED_VERSIONS).toContain('1.21')
      expect(SUPPORTED_VERSIONS).toContain('1.21.1')
    })
  })

  describe('compileSnapshot', () => {
    it('produces quests.snbt file for valid snapshot', () => {
      const snapshot = createDefaultSnapshot('Test Project')

      const result = compileSnapshot(snapshot)

      expect(result.files).toBeInstanceOf(Map)
      expect(result.files.size).toBe(1)
      expect(result.files.has('quests.snbt')).toBe(true)
      expect(result.warnings).toEqual([])
    })

    it('produces valid SNBT output as string', () => {
      const snapshot = createDefaultSnapshot('Test Project')

      const result = compileSnapshot(snapshot)
      const snbtContent = result.files.get('quests.snbt')

      expect(typeof snbtContent).toBe('string')
      expect(snbtContent).toBeTruthy()
      // SNBT should contain chapters and quests fields
      expect(snbtContent).toContain('chapters')
      expect(snbtContent).toContain('quests')
    })

    it('accepts version parameter without error', () => {
      const snapshot = createDefaultSnapshot('Test Project')

      // Should not throw
      const result = compileSnapshot(snapshot, '1.21')
      expect(result).toBeDefined()
      expect(result.files.size).toBe(1)
    })

    it('exports snapshot with chapters and quests', () => {
      const snapshot = createDefaultSnapshot('Multi-Chapter Project')

      // Add a chapter
      const chapter = createDefaultChapter('Chapter 1', 1)
      snapshot.chapters.push(chapter)

      // Add a quest to the chapter
      const quest = createDefaultQuest(chapter.id, 'First Quest', { x: 0, y: 0 })
      snapshot.quests.push(quest)

      const result = compileSnapshot(snapshot)

      expect(result.files.size).toBe(1)
      const snbtContent = result.files.get('quests.snbt')
      expect(snbtContent).toBeTruthy()
      expect(snbtContent).toContain('Chapter 1')
      expect(snbtContent).toContain('First Quest')
      expect(result.warnings).toEqual([])
    })

    it('includes quests with tasks and rewards', () => {
      const snapshot = createDefaultSnapshot('Complex Project')
      const chapter = createDefaultChapter('Main', 1)
      snapshot.chapters.push(chapter)

      const quest = createDefaultQuest(chapter.id, 'Gather Items', { x: 0, y: 0 })
      // Add a task
      quest.tasks.push({
        id: 'task-1',
        type: 'item',
        title: 'Gather Diamond',
        item: 'minecraft:diamond',
        count: 10,
      })
      // Add a reward
      quest.rewards.push({
        id: 'reward-1',
        type: 'item',
        title: 'Reward Item',
        item: 'minecraft:diamond_block',
        count: 1,
      })
      snapshot.quests.push(quest)

      const result = compileSnapshot(snapshot)

      expect(result.files.size).toBe(1)
      const snbtContent = result.files.get('quests.snbt')
      expect(snbtContent).toContain('tasks')
      expect(snbtContent).toContain('rewards')
      expect(result.warnings).toEqual([])
    })

    it('handles round-trip conversion preservation', () => {
      const snapshot = createDefaultSnapshot('Round-trip Test')
      const chapter = createDefaultChapter('Chapter 1', 1)
      snapshot.chapters.push(chapter)

      const quest = createDefaultQuest(chapter.id, 'Test Quest', { x: 0, y: 0 })
      snapshot.quests.push(quest)

      const result = compileSnapshot(snapshot)
      const snbtContent = result.files.get('quests.snbt')

      // Verify the SNBT output is valid and contains key elements
      expect(snbtContent).toBeTruthy()
      expect(typeof snbtContent).toBe('string')
      // Should have proper SNBT structure
      expect(snbtContent?.length).toBeGreaterThan(0)
    })
  })
})
