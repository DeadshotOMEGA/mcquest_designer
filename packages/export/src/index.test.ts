import { describe, it, expect } from 'vitest'
import { EXPORT_VERSION, SUPPORTED_VERSIONS, compileSnapshot } from './index'
import { createDefaultSnapshot } from '@mcquest/schema'

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
    it('returns empty result for stub implementation', () => {
      const snapshot = createDefaultSnapshot('Test Project')

      const result = compileSnapshot(snapshot)

      expect(result.files).toBeInstanceOf(Map)
      expect(result.files.size).toBe(0)
      expect(result.warnings).toEqual([])
    })

    it('accepts version parameter', () => {
      const snapshot = createDefaultSnapshot('Test Project')

      // Should not throw
      const result = compileSnapshot(snapshot, '1.21')
      expect(result).toBeDefined()
    })
  })
})
