import { describe, it, expect } from 'vitest';
import { createIDMapper, type IDMapper } from '../src/id-mapper.js';

describe('IDMapper', () => {
  describe('determinism', () => {
    it('should generate the same mappings for identical inputs', () => {
      const entities = [
        { id: '550e8400-e29b-41d4-a716-446655440000', order: 0, position: { x: 0, y: 0 } },
        { id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', order: 1, position: { x: 10, y: 10 } },
        { id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8', order: 2, position: { x: 20, y: 20 } },
      ];

      const mapper1 = createIDMapper(entities);
      const mapper2 = createIDMapper(entities);

      // Same UUIDs should produce same hex IDs
      expect(mapper1.toHexId(entities[0].id)).toBe(mapper2.toHexId(entities[0].id));
      expect(mapper1.toHexId(entities[1].id)).toBe(mapper2.toHexId(entities[1].id));
      expect(mapper1.toHexId(entities[2].id)).toBe(mapper2.toHexId(entities[2].id));
    });

    it('should produce same mappings regardless of input order', () => {
      const entities = [
        { id: '550e8400-e29b-41d4-a716-446655440000', order: 0, position: { x: 0, y: 0 } },
        { id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', order: 1, position: { x: 10, y: 10 } },
        { id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8', order: 2, position: { x: 20, y: 20 } },
      ];

      const shuffledEntities = [entities[2], entities[0], entities[1]];

      const mapper1 = createIDMapper(entities);
      const mapper2 = createIDMapper(shuffledEntities);

      // Despite different input order, mappings should be the same
      // because they're sorted internally
      expect(mapper1.toHexId(entities[0].id)).toBe(mapper2.toHexId(entities[0].id));
      expect(mapper1.toHexId(entities[1].id)).toBe(mapper2.toHexId(entities[1].id));
      expect(mapper1.toHexId(entities[2].id)).toBe(mapper2.toHexId(entities[2].id));
    });

    it('should be consistent when mapping is called multiple times', () => {
      const entities = [
        { id: '550e8400-e29b-41d4-a716-446655440000', order: 0, position: { x: 0, y: 0 } },
        { id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', order: 1, position: { x: 10, y: 10 } },
      ];

      const mapper = createIDMapper(entities);

      const uuid = entities[0].id;
      const hexId1 = mapper.toHexId(uuid);
      const hexId2 = mapper.toHexId(uuid);
      const hexId3 = mapper.toHexId(uuid);

      expect(hexId1).toBe(hexId2);
      expect(hexId2).toBe(hexId3);
    });
  });

  describe('hex ID format', () => {
    it('should generate 8-character hex IDs', () => {
      const entities = [
        { id: '550e8400-e29b-41d4-a716-446655440000' },
        { id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' },
      ];

      const mapper = createIDMapper(entities);

      const hexId1 = mapper.toHexId(entities[0].id);
      const hexId2 = mapper.toHexId(entities[1].id);

      expect(hexId1).toMatch(/^[0-9A-F]{8}$/);
      expect(hexId2).toMatch(/^[0-9A-F]{8}$/);
    });

    it('should generate uppercase hex strings', () => {
      const entities = [{ id: '550e8400-e29b-41d4-a716-446655440000' }];

      const mapper = createIDMapper(entities);
      const hexId = mapper.toHexId(entities[0].id);

      expect(hexId).toMatch(/^[0-9A-F]+$/);
    });
  });

  describe('collision-free generation', () => {
    it('should generate unique hex IDs for 100 entities', () => {
      const entities = Array.from({ length: 100 }, (_, i) => ({
        id: `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`,
        position: { x: i % 10, y: Math.floor(i / 10) },
      }));

      const mapper = createIDMapper(entities);
      const hexIds = new Set<string>();

      for (const entity of entities) {
        const hexId = mapper.toHexId(entity.id);
        expect(hexIds.has(hexId)).toBe(false);
        hexIds.add(hexId);
      }

      expect(hexIds.size).toBe(100);
    });

    it('should generate unique hex IDs for 1000 entities', () => {
      const entities = Array.from({ length: 1000 }, (_, i) => ({
        id: `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`,
        position: { x: i % 50, y: Math.floor(i / 50) },
      }));

      const mapper = createIDMapper(entities);
      const hexIds = new Set<string>();

      for (const entity of entities) {
        const hexId = mapper.toHexId(entity.id);
        expect(hexIds.has(hexId)).toBe(false);
        hexIds.add(hexId);
      }

      expect(hexIds.size).toBe(1000);
    });

    it('should generate unique hex IDs with position-based sorting', () => {
      const entities = [
        { id: 'uuid-1', position: { x: 0, y: 0 } },
        { id: 'uuid-2', position: { x: 10, y: 0 } },
        { id: 'uuid-3', position: { x: 0, y: 10 } },
        { id: 'uuid-4', position: { x: 10, y: 10 } },
        { id: 'uuid-5', position: { x: 5, y: 5 } },
      ];

      const mapper = createIDMapper(entities);
      const hexIds = new Set<string>();

      for (const entity of entities) {
        const hexId = mapper.toHexId(entity.id);
        hexIds.add(hexId);
      }

      expect(hexIds.size).toBe(5);
    });
  });

  describe('round-trip compatibility', () => {
    it('should preserve existing mappings', () => {
      const existingMappings = new Map([
        ['550e8400-e29b-41d4-a716-446655440000', '2B3C4D5E'],
        ['6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'ABCDEF00'],
      ]);

      const entities = [
        { id: '550e8400-e29b-41d4-a716-446655440000', order: 0 },
        { id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', order: 1 },
      ];

      const mapper = createIDMapper(entities, { existingMappings });

      expect(mapper.toHexId(entities[0].id)).toBe('2B3C4D5E');
      expect(mapper.toHexId(entities[1].id)).toBe('ABCDEF00');
    });

    it('should assign new IDs for unmapped entities', () => {
      const existingMappings = new Map([['550e8400-e29b-41d4-a716-446655440000', '2B3C4D5E']]);

      const entities = [
        { id: '550e8400-e29b-41d4-a716-446655440000' },
        { id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' },
      ];

      const mapper = createIDMapper(entities, { existingMappings });

      expect(mapper.toHexId(entities[0].id)).toBe('2B3C4D5E');

      // New entity should have a generated ID
      const newId = mapper.toHexId(entities[1].id);
      expect(newId).not.toBe('2B3C4D5E');
      expect(newId).toMatch(/^[0-9A-F]{8}$/);
    });

    it('should support round-trip mapping', () => {
      const entities = [
        { id: '550e8400-e29b-41d4-a716-446655440000', order: 0 },
        { id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', order: 1 },
      ];

      const mapper1 = createIDMapper(entities);

      // Simulate an export/import cycle
      const mappings = mapper1.getAllMappings();

      // Create a new mapper with the same mappings
      const mapper2 = createIDMapper(entities, { existingMappings: mappings });

      // The new mapper should produce the same results
      for (const entity of entities) {
        expect(mapper1.toHexId(entity.id)).toBe(mapper2.toHexId(entity.id));
      }
    });
  });

  describe('reverse lookup', () => {
    it('should map hex IDs back to UUIDs', () => {
      const entities = [
        { id: '550e8400-e29b-41d4-a716-446655440000' },
        { id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' },
      ];

      const mapper = createIDMapper(entities);

      for (const entity of entities) {
        const hexId = mapper.toHexId(entity.id);
        const uuid = mapper.toUUID(hexId);
        expect(uuid).toBe(entity.id);
      }
    });

    it('should return undefined for unmapped hex IDs', () => {
      const entities = [{ id: '550e8400-e29b-41d4-a716-446655440000' }];

      const mapper = createIDMapper(entities);
      const unmappedHex = 'FFFFFFFF';

      expect(mapper.toUUID(unmappedHex)).toBeUndefined();
    });
  });

  describe('getAllMappings', () => {
    it('should return all mappings', () => {
      const entities = [
        { id: '550e8400-e29b-41d4-a716-446655440000' },
        { id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' },
        { id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8' },
      ];

      const mapper = createIDMapper(entities);
      const mappings = mapper.getAllMappings();

      expect(mappings.size).toBe(3);

      for (const entity of entities) {
        expect(mappings.has(entity.id)).toBe(true);
        expect(mappings.get(entity.id)).toMatch(/^[0-9A-F]{8}$/);
      }
    });

    it('should return a copy of the mappings', () => {
      const entities = [{ id: '550e8400-e29b-41d4-a716-446655440000' }];

      const mapper = createIDMapper(entities);
      const mappings1 = mapper.getAllMappings();
      const mappings2 = mapper.getAllMappings();

      expect(mappings1).not.toBe(mappings2);
      expect(mappings1.size).toBe(mappings2.size);

      // Mutating the returned map should not affect subsequent calls
      const firstKey = Array.from(mappings1.keys())[0]!;
      mappings1.delete(firstKey);

      expect(mapper.getAllMappings().has(firstKey)).toBe(true);
    });
  });

  describe('stable sorting', () => {
    it('should sort by order first', () => {
      const entities = [
        { id: 'uuid-1', order: 2, position: { x: 0, y: 0 } },
        { id: 'uuid-2', order: 1, position: { x: 10, y: 10 } },
        { id: 'uuid-3', order: 0, position: { x: 5, y: 5 } },
      ];

      const mapper = createIDMapper(entities);

      // Get the mappings and check order by creating new mapper with same entities
      // and verifying determinism
      const mapper2 = createIDMapper([entities[0], entities[1], entities[2]]);
      const mapper3 = createIDMapper([entities[2], entities[0], entities[1]]);

      // All should produce the same mapping
      for (const entity of entities) {
        expect(mapper.toHexId(entity.id)).toBe(mapper2.toHexId(entity.id));
        expect(mapper.toHexId(entity.id)).toBe(mapper3.toHexId(entity.id));
      }
    });

    it('should sort by position.y second', () => {
      // Entities with no order should sort by Y position
      const entities = [
        { id: 'uuid-1', position: { x: 0, y: 10 } },
        { id: 'uuid-2', position: { x: 10, y: 0 } },
        { id: 'uuid-3', position: { x: 5, y: 5 } },
      ];

      const mapper1 = createIDMapper(entities);
      const mapper2 = createIDMapper([entities[2], entities[0], entities[1]]);

      for (const entity of entities) {
        expect(mapper1.toHexId(entity.id)).toBe(mapper2.toHexId(entity.id));
      }
    });

    it('should sort by position.x third', () => {
      // Entities with same Y should sort by X
      const entities = [
        { id: 'uuid-1', position: { x: 20, y: 0 } },
        { id: 'uuid-2', position: { x: 10, y: 0 } },
        { id: 'uuid-3', position: { x: 5, y: 0 } },
      ];

      const mapper1 = createIDMapper(entities);
      const mapper2 = createIDMapper([entities[1], entities[0], entities[2]]);

      for (const entity of entities) {
        expect(mapper1.toHexId(entity.id)).toBe(mapper2.toHexId(entity.id));
      }
    });

    it('should use UUID as final tie-breaker', () => {
      // Entities with same order and position should sort by UUID
      const entities = [
        { id: 'zzzzz', position: { x: 0, y: 0 } },
        { id: 'aaaaa', position: { x: 0, y: 0 } },
        { id: 'mmmmm', position: { x: 0, y: 0 } },
      ];

      const mapper1 = createIDMapper(entities);
      const mapper2 = createIDMapper([entities[2], entities[0], entities[1]]);

      for (const entity of entities) {
        expect(mapper1.toHexId(entity.id)).toBe(mapper2.toHexId(entity.id));
      }
    });
  });

  describe('error handling', () => {
    it('should throw for unmapped UUID', () => {
      const entities = [{ id: '550e8400-e29b-41d4-a716-446655440000' }];

      const mapper = createIDMapper(entities);

      expect(() => {
        mapper.toHexId('unmapped-uuid');
      }).toThrow('No hex ID mapping found for UUID: unmapped-uuid');
    });

    it('should handle empty entity list', () => {
      const mapper = createIDMapper([]);

      expect(mapper.getAllMappings().size).toBe(0);
      expect(() => {
        mapper.toHexId('any-uuid');
      }).toThrow();
    });

    it('should handle entities with missing position', () => {
      const entities = [
        { id: 'uuid-1' },
        { id: 'uuid-2', position: { x: 0, y: 0 } },
        { id: 'uuid-3' },
      ];

      const mapper = createIDMapper(entities);

      // Should not throw
      const hexIds = entities.map(e => mapper.toHexId(e.id));
      expect(new Set(hexIds).size).toBe(3);
    });

    it('should handle entities with missing order', () => {
      const entities = [
        { id: 'uuid-1', order: 1, position: { x: 0, y: 0 } },
        { id: 'uuid-2', position: { x: 0, y: 0 } },
        { id: 'uuid-3', order: 0, position: { x: 0, y: 0 } },
      ];

      const mapper = createIDMapper(entities);

      // Should not throw
      const hexIds = entities.map(e => mapper.toHexId(e.id));
      expect(new Set(hexIds).size).toBe(3);
    });
  });

  describe('seed-based variation', () => {
    it('should support seed parameter for additional variation', () => {
      const entities = [
        { id: '550e8400-e29b-41d4-a716-446655440000' },
        { id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' },
      ];

      const mapper1 = createIDMapper(entities, { seed: 'seed1' });
      const mapper2 = createIDMapper(entities, { seed: 'seed2' });

      // Different seeds should produce different IDs
      expect(mapper1.toHexId(entities[0].id)).not.toBe(mapper2.toHexId(entities[0].id));
    });
  });
});
