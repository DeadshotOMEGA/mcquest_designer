import { describe, it, expect } from 'vitest';
import { convertToSnapshot, convertFromSnapshot } from '../src/converter.js';
import type { ProjectSnapshot } from '@mcquest/schema';

describe('Converter - Round-trip conversion', () => {
  describe('convertFromSnapshot', () => {
    it('should convert a snapshot with chapters and quests to SNBT', () => {
      const snapshot: ProjectSnapshot = {
        version: '0.2.0',
        metadata: {
          projectName: 'Test Project',
          targetMinecraftVersion: '1.21.1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        chapters: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Chapter 1',
            order: 0,
            metadata: {
              ftbQuestsId: '2B3C4D5E',
            },
          },
        ],
        quests: [
          {
            id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            chapterId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Quest 1',
            position: { x: 0, y: 0 },
            settings: {
              optional: false,
              hidden: 'false',
              repeatable: false,
              canRepeat: false,
              hideUntilDeps: false,
            },
            metadata: {
              ftbQuestsId: 'ABCDEF00',
            },
          },
        ],
        dependencies: [],
      };

      const result = convertFromSnapshot(snapshot);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('chapters');
      expect(result).toHaveProperty('quests');

      const snbt = result as Record<string, unknown>;
      expect(Array.isArray(snbt.chapters)).toBe(true);
      expect(Array.isArray(snbt.quests)).toBe(true);
    });

    it('should preserve round-trip IDs from metadata', () => {
      const snapshot: ProjectSnapshot = {
        version: '0.2.0',
        metadata: {
          projectName: 'Test Project',
          targetMinecraftVersion: '1.21.1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        chapters: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Chapter 1',
            order: 0,
            metadata: {
              ftbQuestsId: '2B3C4D5E',
            },
          },
        ],
        quests: [
          {
            id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            chapterId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Quest 1',
            position: { x: 0, y: 0 },
            settings: {
              optional: false,
              hidden: 'false',
              repeatable: false,
              canRepeat: false,
              hideUntilDeps: false,
            },
            metadata: {
              ftbQuestsId: 'ABCDEF00',
            },
          },
        ],
        dependencies: [],
      };

      const result = convertFromSnapshot(snapshot);
      const snbt = result as Record<string, unknown>;
      const chapters = snbt.chapters as Record<string, unknown>[];
      const quests = snbt.quests as Record<string, unknown>[];

      // Chapter should have preserved hex ID
      expect(chapters[0]?.id).toBe('2B3C4D5E');

      // Quest should have preserved hex ID
      expect(quests[0]?.id).toBe('ABCDEF00');
    });

    it('should convert quest position correctly', () => {
      const snapshot: ProjectSnapshot = {
        version: '0.2.0',
        metadata: {
          projectName: 'Test Project',
          targetMinecraftVersion: '1.21.1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        chapters: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Chapter 1',
            order: 0,
          },
        ],
        quests: [
          {
            id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            chapterId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Quest 1',
            position: { x: 100, y: 200 },
            settings: {
              optional: false,
              hidden: 'false',
              repeatable: false,
              canRepeat: false,
              hideUntilDeps: false,
            },
          },
        ],
        dependencies: [],
      };

      const result = convertFromSnapshot(snapshot);
      const snbt = result as Record<string, unknown>;
      const quests = snbt.quests as Record<string, unknown>[];

      expect(quests[0]?.x).toBe(100);
      expect(quests[0]?.y).toBe(200);
    });

    it('should convert quest with tasks', () => {
      const snapshot: ProjectSnapshot = {
        version: '0.2.0',
        metadata: {
          projectName: 'Test Project',
          targetMinecraftVersion: '1.21.1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        chapters: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Chapter 1',
            order: 0,
          },
        ],
        quests: [
          {
            id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            chapterId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Quest 1',
            position: { x: 0, y: 0 },
            settings: {
              optional: false,
              hidden: 'false',
              repeatable: false,
              canRepeat: false,
              hideUntilDeps: false,
            },
            tasks: [
              {
                id: '11111111-1111-1111-1111-111111111111',
                type: 'item',
                item: 'minecraft:diamond',
                count: 10,
              },
            ],
          },
        ],
        dependencies: [],
      };

      const result = convertFromSnapshot(snapshot);
      const snbt = result as Record<string, unknown>;
      const quests = snbt.quests as Record<string, unknown>[];
      const tasks = (quests[0]?.tasks as Record<string, unknown>[]) || [];

      expect(tasks).toHaveLength(1);
      expect(tasks[0]?.type).toBe('item');
      expect(tasks[0]?.item).toBe('minecraft:diamond');
      expect(tasks[0]?.count).toBe(10);
    });

    it('should convert quest with rewards', () => {
      const snapshot: ProjectSnapshot = {
        version: '0.2.0',
        metadata: {
          projectName: 'Test Project',
          targetMinecraftVersion: '1.21.1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        chapters: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Chapter 1',
            order: 0,
          },
        ],
        quests: [
          {
            id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            chapterId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Quest 1',
            position: { x: 0, y: 0 },
            settings: {
              optional: false,
              hidden: 'false',
              repeatable: false,
              canRepeat: false,
              hideUntilDeps: false,
            },
            rewards: [
              {
                id: '22222222-2222-2222-2222-222222222222',
                type: 'item',
                item: 'minecraft:emerald',
                count: 5,
              },
            ],
          },
        ],
        dependencies: [],
      };

      const result = convertFromSnapshot(snapshot);
      const snbt = result as Record<string, unknown>;
      const quests = snbt.quests as Record<string, unknown>[];
      const rewards = (quests[0]?.rewards as Record<string, unknown>[]) || [];

      expect(rewards).toHaveLength(1);
      expect(rewards[0]?.type).toBe('item');
      expect(rewards[0]?.item).toBe('minecraft:emerald');
      expect(rewards[0]?.count).toBe(5);
    });

    it('should convert quest dependencies', () => {
      const questId1 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
      const questId2 = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

      const snapshot: ProjectSnapshot = {
        version: '0.2.0',
        metadata: {
          projectName: 'Test Project',
          targetMinecraftVersion: '1.21.1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        chapters: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Chapter 1',
            order: 0,
            metadata: {
              ftbQuestsId: '00000001',
            },
          },
        ],
        quests: [
          {
            id: questId1,
            chapterId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Quest 1',
            position: { x: 0, y: 0 },
            settings: {
              optional: false,
              hidden: 'false',
              repeatable: false,
              canRepeat: false,
              hideUntilDeps: false,
            },
            metadata: {
              ftbQuestsId: 'AAAAAAAA',
            },
          },
          {
            id: questId2,
            chapterId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Quest 2',
            position: { x: 10, y: 0 },
            settings: {
              optional: false,
              hidden: 'false',
              repeatable: false,
              canRepeat: false,
              hideUntilDeps: false,
            },
            metadata: {
              ftbQuestsId: 'BBBBBBBB',
            },
          },
        ],
        dependencies: [
          {
            fromQuestId: questId2,
            toQuestId: questId1,
            type: 'AND',
          },
        ],
      };

      const result = convertFromSnapshot(snapshot);
      const snbt = result as Record<string, unknown>;
      const quests = snbt.quests as Record<string, unknown>[];

      // Quest 1 (AAAAAAAA) should have no dependencies
      expect(quests[0]?.dependencies).toBeUndefined();

      // Quest 2 (BBBBBBBB) should depend on Quest 1 (AAAAAAAA)
      const quest2Deps = quests[1]?.dependencies as string[] | undefined;
      expect(quest2Deps).toBeDefined();
      expect(quest2Deps).toContain('AAAAAAAA');
    });

    it('should preserve unknown SNBT metadata', () => {
      const snapshot: ProjectSnapshot = {
        version: '0.2.0',
        metadata: {
          projectName: 'Test Project',
          targetMinecraftVersion: '1.21.1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        chapters: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Chapter 1',
            order: 0,
            metadata: {
              ftbQuestsId: '2B3C4D5E',
              snbtMetadata: {
                custom_field: 'custom_value',
                another_field: 42,
              },
            },
          },
        ],
        quests: [
          {
            id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            chapterId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Quest 1',
            position: { x: 0, y: 0 },
            settings: {
              optional: false,
              hidden: 'false',
              repeatable: false,
              canRepeat: false,
              hideUntilDeps: false,
            },
            metadata: {
              ftbQuestsId: 'ABCDEF00',
              snbtMetadata: {
                quest_custom: 'quest_value',
              },
            },
          },
        ],
        dependencies: [],
      };

      const result = convertFromSnapshot(snapshot);
      const snbt = result as Record<string, unknown>;
      const chapters = snbt.chapters as Record<string, unknown>[];
      const quests = snbt.quests as Record<string, unknown>[];

      // Check chapter metadata was restored
      expect(chapters[0]?.custom_field).toBe('custom_value');
      expect(chapters[0]?.another_field).toBe(42);

      // Check quest metadata was restored
      expect(quests[0]?.quest_custom).toBe('quest_value');
    });

    it('should preserve chapter metadata images', () => {
      const snapshot: ProjectSnapshot = {
        version: '0.2.0',
        metadata: {
          projectName: 'Test Project',
          targetMinecraftVersion: '1.21.1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        chapters: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Chapter 1',
            order: 0,
            metadata: {
              ftbQuestsId: '2B3C4D5E',
              images: [
                {
                  image: 'ftbquests:textures/gui/background.png',
                  x: 0,
                  y: 0,
                  width: 256,
                  height: 256,
                  rotation: 0,
                  alpha: 1,
                },
              ],
            },
          },
        ],
        quests: [],
        dependencies: [],
      };

      const result = convertFromSnapshot(snapshot);
      const snbt = result as Record<string, unknown>;
      const chapters = snbt.chapters as Record<string, unknown>[];

      expect(chapters[0]?.images).toBeDefined();
      const images = chapters[0]?.images as Array<Record<string, unknown>>;
      expect(images).toHaveLength(1);
      expect(images[0]?.image).toBe('ftbquests:textures/gui/background.png');
    });

    it('should handle optional quest settings', () => {
      const snapshot: ProjectSnapshot = {
        version: '0.2.0',
        metadata: {
          projectName: 'Test Project',
          targetMinecraftVersion: '1.21.1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        chapters: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Chapter 1',
            order: 0,
          },
        ],
        quests: [
          {
            id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            chapterId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Quest 1',
            position: { x: 0, y: 0 },
            settings: {
              optional: true,
              hidden: 'false',
              repeatable: false,
              canRepeat: false,
              hideUntilDeps: true,
            },
          },
        ],
        dependencies: [],
      };

      const result = convertFromSnapshot(snapshot);
      const snbt = result as Record<string, unknown>;
      const quests = snbt.quests as Record<string, unknown>[];

      expect(quests[0]?.optional).toBe(true);
      expect(quests[0]?.hide_until_deps).toBe(true);
    });

    it('should handle quest icons', () => {
      const snapshot: ProjectSnapshot = {
        version: '0.2.0',
        metadata: {
          projectName: 'Test Project',
          targetMinecraftVersion: '1.21.1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        chapters: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Chapter 1',
            order: 0,
            icon: { type: 'item', value: 'minecraft:writable_book' },
          },
        ],
        quests: [
          {
            id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            chapterId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Quest 1',
            position: { x: 0, y: 0 },
            settings: {
              optional: false,
              hidden: 'false',
              repeatable: false,
              canRepeat: false,
              hideUntilDeps: false,
            },
            icon: { type: 'item', value: 'minecraft:diamond' },
          },
        ],
        dependencies: [],
      };

      const result = convertFromSnapshot(snapshot);
      const snbt = result as Record<string, unknown>;
      const chapters = snbt.chapters as Record<string, unknown>[];
      const quests = snbt.quests as Record<string, unknown>[];

      const chapterIcon = chapters[0]?.icon as Record<string, unknown>;
      expect(chapterIcon?.id).toBe('minecraft:writable_book');

      const questIcon = quests[0]?.icon as Record<string, unknown>;
      expect(questIcon?.id).toBe('minecraft:diamond');
    });

    it('should not include default values in output', () => {
      const snapshot: ProjectSnapshot = {
        version: '0.2.0',
        metadata: {
          projectName: 'Test Project',
          targetMinecraftVersion: '1.21.1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        chapters: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Chapter 1',
            order: 0,
          },
        ],
        quests: [
          {
            id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            chapterId: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Quest 1',
            position: { x: 0, y: 0 },
            size: 1,
            shape: 'square',
            settings: {
              optional: false,
              hideUntilDeps: false,
            },
          },
        ],
        dependencies: [],
      };

      const result = convertFromSnapshot(snapshot);
      const snbt = result as Record<string, unknown>;
      const quests = snbt.quests as Record<string, unknown>[];

      // Default values should not be included
      expect(quests[0]?.size).toBeUndefined();
      expect(quests[0]?.shape).toBeUndefined();
      expect(quests[0]?.optional).toBeUndefined();
      expect(quests[0]?.hide_until_deps).toBeUndefined();
    });

    it('should handle empty snapshots', () => {
      const snapshot: ProjectSnapshot = {
        version: '0.2.0',
        metadata: {
          projectName: 'Empty Project',
          targetMinecraftVersion: '1.21.1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        chapters: [],
        quests: [],
        dependencies: [],
      };

      const result = convertFromSnapshot(snapshot);

      expect(result).toBeDefined();
      const snbt = result as Record<string, unknown>;
      expect(Array.isArray(snbt.chapters)).toBe(true);
      expect(Array.isArray(snbt.quests)).toBe(true);
      expect((snbt.chapters as unknown[]).length).toBe(0);
      expect((snbt.quests as unknown[]).length).toBe(0);
    });
  });
});
