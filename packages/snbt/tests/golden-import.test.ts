import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseSNBT } from '../src/parser.js';
import { parseLangFile } from '../src/lang-handler.js';
import { convertToSnapshot } from '../src/converter.js';
import type { ProjectSnapshot, Quest, Chapter, Dependency } from '@mcquest/schema';

/**
 * Golden Import Test Suite (T2.5)
 *
 * Tests the complete SNBT import pipeline:
 * 1. Parse chapter.snbt files with FTB format normalization
 * 2. Parse lang files (en_us.snbt) for text content
 * 3. Convert to ProjectSnapshot
 * 4. Validate structure and content
 *
 * The golden fixture represents a minimal realistic FTB Quests chapter
 * with multiple quests, dependencies, tasks, rewards, and lang entries.
 */

interface TestFixtures {
  chapterSnbt: string;
  langSnbt: string;
}

let fixtures: TestFixtures;

beforeAll(() => {
  const fixturesDir = join(__dirname, 'fixtures');

  fixtures = {
    chapterSnbt: readFileSync(join(fixturesDir, 'chapter-the-beginning.snbt'), 'utf-8'),
    langSnbt: readFileSync(join(fixturesDir, 'lang-en_us.snbt'), 'utf-8'),
  };
});

describe('Golden Import Test - FTB Quests SNBT Pipeline', () => {
  describe('Step 1: Parse SNBT Chapter File', () => {
    it('should parse chapter SNBT with FTB format option', () => {
      const result = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });

      if (!result.success) {
        console.log('Parse error:', result.error);
        console.log('First 500 chars of input:', fixtures.chapterSnbt.substring(0, 500));
      }

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should extract chapter metadata', () => {
      const result = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const data = result.data as Record<string, unknown>;

      expect(data.filename).toBe('the_beginning');
      expect(data.id).toBe('7598810BEF4F4370');
      expect(data.order_index).toBe(0);
      expect(data.group).toBe('4E06BB3DD10B837B');
    });

    it('should extract chapter icon', () => {
      const result = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const data = result.data as Record<string, unknown>;

      expect(data.icon).toBeDefined();
      const icon = data.icon as Record<string, unknown>;
      expect(icon.id).toBe('minecraft:oak_sapling');
    });

    it('should extract quests array', () => {
      const result = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const data = result.data as Record<string, unknown>;

      expect(Array.isArray(data.quests)).toBe(true);
      const quests = data.quests as unknown[];
      expect(quests.length).toBe(4);
    });

    it('should extract quest details (ID, shape, position, icon)', () => {
      const result = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const data = result.data as Record<string, unknown>;
      const quests = data.quests as Record<string, unknown>[];
      const firstQuest = quests[0];

      expect(firstQuest.id).toBe('4A2123FF92275F64');
      expect(firstQuest.shape).toBe('square');
      expect(firstQuest.x).toBe(-0.5);
      expect(firstQuest.y).toBe(-1.0);
      expect(firstQuest.size).toBe(2.0);

      const icon = firstQuest.icon as Record<string, unknown>;
      expect(icon.id).toBe('minecraft:oak_log');
    });

    it('should extract quest tasks', () => {
      const result = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const data = result.data as Record<string, unknown>;
      const quests = data.quests as Record<string, unknown>[];
      const firstQuest = quests[0];

      expect(Array.isArray(firstQuest.tasks)).toBe(true);
      const tasks = firstQuest.tasks as Record<string, unknown>[];
      expect(tasks.length).toBe(1);

      const task = tasks[0];
      expect(task.type).toBe('item');
      expect(task.id).toBeDefined();

      const item = task.item as Record<string, unknown>;
      expect(item.id).toBe('minecraft:oak_log');
    });

    it('should extract quest rewards (item, xp, command)', () => {
      const result = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const data = result.data as Record<string, unknown>;
      const quests = data.quests as Record<string, unknown>[];

      // First quest has item and xp rewards
      const firstQuest = quests[0];
      const firstRewards = firstQuest.rewards as Record<string, unknown>[];
      expect(firstRewards.length).toBe(2);
      expect(firstRewards[0].type).toBe('item');
      expect(firstRewards[1].type).toBe('xp');

      // Third quest has command reward
      const thirdQuest = quests[2];
      const thirdRewards = thirdQuest.rewards as Record<string, unknown>[];
      const commandReward = thirdRewards.find((r: Record<string, unknown>) => r.type === 'command');
      expect(commandReward).toBeDefined();
      expect(commandReward?.command).toContain('puffish_skills');
    });

    it('should extract quest dependencies', () => {
      const result = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const data = result.data as Record<string, unknown>;
      const quests = data.quests as Record<string, unknown>[];

      // First quest has no dependencies
      expect(quests[0].dependencies).toBeUndefined();

      // Second quest depends on first
      expect(Array.isArray(quests[1].dependencies)).toBe(true);
      const deps2 = quests[1].dependencies as unknown[];
      expect(deps2.length).toBe(1);
      expect(deps2[0]).toBe('4A2123FF92275F64');

      // Third quest depends on second
      const deps3 = quests[2].dependencies as unknown[];
      expect(deps3.length).toBe(1);
      expect(deps3[0]).toBe('2617EB4B3D2A80DA');

      // Fourth quest depends on third
      const deps4 = quests[3].dependencies as unknown[];
      expect(deps4.length).toBe(1);
      expect(deps4[0]).toBe('44F07423FC4BA868');
    });

    it('should extract optional and hide_until_deps flags', () => {
      const result = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const data = result.data as Record<string, unknown>;
      const quests = data.quests as Record<string, unknown>[];

      // Third quest is not optional
      expect(quests[2].optional).toBe(false);

      // Fourth quest is optional and hidden until deps
      expect(quests[3].optional).toBe(true);
      expect(quests[3].hide_until_deps).toBe(true);
    });

    it('should extract chapter images (decorations)', () => {
      const result = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const data = result.data as Record<string, unknown>;

      expect(Array.isArray(data.images)).toBe(true);
      const images = data.images as Record<string, unknown>[];
      expect(images.length).toBeGreaterThan(0);

      const firstImage = images[0];
      expect(firstImage.x).toBe(9.0);
      expect(firstImage.y).toBe(-1.0);
      expect(firstImage.width).toBe(3.0);
      expect(firstImage.height).toBe(3.0);
      expect(firstImage.image).toContain('forbidden_arcanus');
    });
  });

  describe('Step 2: Parse Lang File', () => {
    it('should parse lang file successfully', () => {
      const langData = parseLangFile(fixtures.langSnbt);

      expect(langData.titles).toBeDefined();
      expect(langData.descriptions).toBeDefined();
    });

    it('should extract quest titles', () => {
      const langData = parseLangFile(fixtures.langSnbt);

      expect(langData.titles.get('4A2123FF92275F64')).toContain('Punch A Tree');
      expect(langData.titles.get('2617EB4B3D2A80DA')).toContain('Wooden Pickaxe');
      expect(langData.titles.get('44F07423FC4BA868')).toContain('Stone Age');
      expect(langData.titles.get('592271A09A5655D4')).toContain('Smelt It');
    });

    it('should extract quest descriptions (multi-line)', () => {
      const langData = parseLangFile(fixtures.langSnbt);

      const desc1 = langData.descriptions.get('4A2123FF92275F64');
      expect(desc1).toBeDefined();
      expect(desc1).toContain('wood from trees');
      expect(desc1).toContain('oak logs');

      const desc2 = langData.descriptions.get('2617EB4B3D2A80DA');
      expect(desc2).toBeDefined();
      expect(desc2).toContain('Wooden Pickaxe');
    });

    it('should extract chapter title', () => {
      const langData = parseLangFile(fixtures.langSnbt);

      expect(langData.titles.get('7598810BEF4F4370')).toContain('The Beginning');
    });

    it('should handle missing lang entries gracefully', () => {
      const langData = parseLangFile(fixtures.langSnbt);

      // Some quests might not have lang entries
      const missingEntry = langData.titles.get('NONEXISTENT_ID');
      expect(missingEntry).toBeUndefined();
    });
  });

  describe('Step 3: Convert to ProjectSnapshot', () => {
    it('should convert SNBT to ProjectSnapshot successfully', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);

      expect(result.success).toBe(true);
      expect(result.snapshot).toBeDefined();
      expect(result.problems).toBeDefined();
      expect(Array.isArray(result.problems)).toBe(true);
    });

    it('should have no errors for valid input', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);

      const errors = result.problems.filter((p) => p.severity === 'error');
      expect(errors).toHaveLength(0);
    });

    it('should create one chapter from import', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);
      const snapshot = result.snapshot as ProjectSnapshot;

      expect(snapshot.chapters).toBeDefined();
      expect(snapshot.chapters.length).toBe(1);
    });

    it('should populate chapter metadata correctly', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);
      const snapshot = result.snapshot as ProjectSnapshot;
      const chapter = snapshot.chapters[0];

      expect(chapter.title).toContain('The Beginning');
      expect(chapter.id).toBeDefined();
      expect(chapter.order).toBe(0);
      expect(chapter.icon).toBeDefined();
      expect(chapter.icon?.value).toBe('minecraft:oak_sapling');
    });

    it('should convert all 4 quests from chapter', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);
      const snapshot = result.snapshot as ProjectSnapshot;

      expect(snapshot.quests).toBeDefined();
      expect(snapshot.quests.length).toBe(4);
    });

    it('should populate quest titles from lang file', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);
      const snapshot = result.snapshot as ProjectSnapshot;
      const quests = snapshot.quests as Quest[];

      expect(quests[0].title).toContain('Punch A Tree');
      expect(quests[1].title).toContain('Wooden Pickaxe');
      expect(quests[2].title).toContain('Stone Age');
      expect(quests[3].title).toContain('Smelt It');
    });

    it('should populate quest descriptions from lang file', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);
      const snapshot = result.snapshot as ProjectSnapshot;
      const quests = snapshot.quests as Quest[];

      expect(quests[0].description).toBeDefined();
      expect(quests[0].description).toContain('wood from trees');

      expect(quests[1].description).toBeDefined();
      expect(quests[1].description).toContain('Wooden Pickaxe');
    });

    it('should preserve quest positions', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);
      const snapshot = result.snapshot as ProjectSnapshot;
      const quests = snapshot.quests as Quest[];

      expect(quests[0].position.x).toBe(-0.5);
      expect(quests[0].position.y).toBe(-1.0);

      expect(quests[1].position.x).toBe(1.5);
      expect(quests[1].position.y).toBe(-1.0);

      expect(quests[3].position.x).toBe(5.5);
      expect(quests[3].position.y).toBe(-1.0);
    });

    it('should preserve quest sizes', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);
      const snapshot = result.snapshot as ProjectSnapshot;
      const quests = snapshot.quests as Quest[];

      expect(quests[0].size).toBe(2.0);
      expect(quests[3].size).toBe(1.25);
    });

    it('should preserve quest shapes', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);
      const snapshot = result.snapshot as ProjectSnapshot;
      const quests = snapshot.quests as Quest[];

      expect(quests[0].shape).toBe('square');
      expect(quests[1].shape).toBe('rsquare');
      expect(quests[3].shape).toBe('hexagon');
    });

    it('should extract and preserve quest icons', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);
      const snapshot = result.snapshot as ProjectSnapshot;
      const quests = snapshot.quests as Quest[];

      expect(quests[0].icon?.value).toBe('minecraft:oak_log');
      expect(quests[2].icon?.value).toBe('minecraft:stone_pickaxe');
    });

    it('should convert tasks with correct types and items', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);
      const snapshot = result.snapshot as ProjectSnapshot;
      const quests = snapshot.quests as Quest[];

      // First quest has one task
      expect(quests[0].tasks.length).toBe(1);
      expect(quests[0].tasks[0].type).toBe('item');
      expect(quests[0].tasks[0].item).toBe('minecraft:oak_log');

      // Fourth quest has 3 tasks
      expect(quests[3].tasks.length).toBe(3);
      expect(quests[3].tasks[0].item).toBe('minecraft:furnace');
      expect(quests[3].tasks[1].item).toBe('minecraft:coal');
      expect(quests[3].tasks[2].item).toBe('minecraft:iron_ingot');
    });

    it('should convert rewards with counts and types', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);
      const snapshot = result.snapshot as ProjectSnapshot;
      const quests = snapshot.quests as Quest[];

      // First quest has 8 torches and 5 xp
      expect(quests[0].rewards.length).toBe(2);
      expect(quests[0].rewards[0].type).toBe('item');
      expect(quests[0].rewards[0].count).toBe(8);
      expect(quests[0].rewards[1].type).toBe('xp');
      expect(quests[0].rewards[1].xp).toBe(5);
    });

    it('should convert command rewards', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);
      const snapshot = result.snapshot as ProjectSnapshot;
      const quests = snapshot.quests as Quest[];

      // Third quest has a command reward
      const commandReward = quests[2].rewards.find((r) => r.type === 'command');
      expect(commandReward).toBeDefined();
      expect(commandReward?.command).toContain('puffish_skills');
    });

    it('should preserve quest settings (optional, hide_until_deps)', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);
      const snapshot = result.snapshot as ProjectSnapshot;
      const quests = snapshot.quests as Quest[];

      expect(quests[2].settings.optional).toBe(false);

      expect(quests[3].settings.optional).toBe(true);
      expect(quests[3].settings.hideUntilDeps).toBe(true);
    });

    it('should create correct dependencies between quests', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);
      const snapshot = result.snapshot as ProjectSnapshot;
      const deps = snapshot.dependencies as Dependency[];

      // Should have 3 dependencies (linear chain)
      expect(deps.length).toBe(3);

      // Check dependency structure
      // Quest 2 depends on quest 1
      const dep1 = deps.find((d) => d.toQuestId === snapshot.quests[1].id);
      expect(dep1?.fromQuestId).toBe(snapshot.quests[1].id);
      expect(dep1?.toQuestId).toBe(snapshot.quests[0].id);
      expect(dep1?.type).toBe('AND');
    });

    it('should preserve SNBT IDs in metadata for round-trip', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);
      const snapshot = result.snapshot as ProjectSnapshot;
      const chapter = snapshot.chapters[0] as Chapter;

      expect(chapter.metadata?.ftbQuestsId).toBe('7598810BEF4F4370');

      const quest = snapshot.quests[0] as Quest;
      expect(quest.metadata?.ftbQuestsId).toBe('4A2123FF92275F64');
    });

    it('should assign chapter ID to all quests', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);
      const snapshot = result.snapshot as ProjectSnapshot;
      const chapter = snapshot.chapters[0];
      const quests = snapshot.quests as Quest[];

      for (const quest of quests) {
        expect(quest.chapterId).toBe(chapter.id);
      }
    });

    it('should set active chapter in uiState', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);
      const snapshot = result.snapshot as ProjectSnapshot;

      expect(snapshot.uiState?.activeChapterId).toBe(snapshot.chapters[0].id);
    });

    it('should set metadata for import tracking', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);
      const snapshot = result.snapshot as ProjectSnapshot;

      expect(snapshot.metadata.importedFrom).toBe('snbt');
      expect(snapshot.metadata.targetMinecraftVersion).toBe('1.21.1');
      expect(snapshot.metadata.originalFormat?.source).toContain('FTB Quests');
    });

    it('should extract chapter images as metadata', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);
      const snapshot = result.snapshot as ProjectSnapshot;
      const chapter = snapshot.chapters[0] as Chapter;

      expect(chapter.metadata?.images).toBeDefined();
      expect(Array.isArray(chapter.metadata?.images)).toBe(true);
      expect((chapter.metadata?.images as unknown[]).length).toBeGreaterThan(0);
    });
  });

  describe('Integration: Complete Pipeline', () => {
    it('should complete full import pipeline without errors', () => {
      // Step 1: Parse SNBT
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      expect(parseResult.success).toBe(true);

      // Step 2: Parse lang file
      const langData = parseLangFile(fixtures.langSnbt);
      expect(langData.titles.size).toBeGreaterThan(0);

      // Step 3: Convert to ProjectSnapshot
      const conversionResult = convertToSnapshot(parseResult.data, langData);
      expect(conversionResult.success).toBe(true);
      expect(conversionResult.snapshot).toBeDefined();
      expect(conversionResult.problems.filter((p) => p.severity === 'error')).toHaveLength(0);
    });

    it('should produce valid ProjectSnapshot structure', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);
      const conversionResult = convertToSnapshot(parseResult.data, langData);

      const snapshot = conversionResult.snapshot as ProjectSnapshot;

      // Validate structure
      expect(snapshot.version).toBeDefined();
      expect(snapshot.metadata).toBeDefined();
      expect(snapshot.chapters).toBeDefined();
      expect(snapshot.quests).toBeDefined();
      expect(snapshot.dependencies).toBeDefined();
      expect(snapshot.uiState).toBeDefined();
    });

    it('should maintain referential integrity in dependencies', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);
      const conversionResult = convertToSnapshot(parseResult.data, langData);

      const snapshot = conversionResult.snapshot as ProjectSnapshot;
      const quests = snapshot.quests as Quest[];
      const questIds = new Set(quests.map((q) => q.id));
      const dependencies = snapshot.dependencies as Dependency[];

      // All quest IDs in dependencies should exist
      for (const dep of dependencies) {
        expect(questIds.has(dep.fromQuestId)).toBe(true);
        expect(questIds.has(dep.toQuestId)).toBe(true);
      }
    });

    it('should handle large task/reward counts', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);
      const conversionResult = convertToSnapshot(parseResult.data, langData);

      const snapshot = conversionResult.snapshot as ProjectSnapshot;
      const quests = snapshot.quests as Quest[];

      // Fourth quest has 16 and 2 random bonus counts
      expect(quests[3].rewards[0].count).toBe(16);
    });

    it('should provide detailed problem reports if conversion issues occur', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);
      const result = convertToSnapshot(parseResult.data, langData);

      expect(result.problems).toBeDefined();
      expect(Array.isArray(result.problems)).toBe(true);

      // Each problem should have required fields
      for (const problem of result.problems) {
        expect(problem.severity).toMatch(/error|warning/);
        expect(problem.code).toBeDefined();
        expect(problem.message).toBeDefined();
      }
    });
  });

  describe('Edge Cases & Validation', () => {
    it('should handle malformed SNBT gracefully', () => {
      const malformedSnbt = '{ invalid snbt }';
      const result = parseSNBT(malformedSnbt, { format: 'ftb' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle missing lang entries with fallbacks', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      // Create lang data without some entries
      const emptyLangData = { titles: new Map(), descriptions: new Map() };

      const result = convertToSnapshot(parseResult.data, emptyLangData);

      // Should still succeed, using quest IDs as fallback
      expect(result.success).toBe(true);
      expect(result.snapshot).toBeDefined();
    });

    it('should handle missing task/reward items', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const result = convertToSnapshot(parseResult.data, langData);

      // Should complete successfully even with potentially missing items
      expect(result.success).toBe(true);
    });

    it('should preserve unknown SNBT fields in metadata', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);
      const result = convertToSnapshot(parseResult.data, langData);

      const snapshot = result.snapshot as ProjectSnapshot;
      const chapter = snapshot.chapters[0] as Chapter;

      // Unknown fields should be captured in snbtMetadata
      expect(chapter.metadata?.snbtMetadata).toBeDefined();
    });
  });

  describe('Performance Characteristics', () => {
    it('should parse chapter file in reasonable time', () => {
      const start = performance.now();
      parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const elapsed = performance.now() - start;

      // Should parse in less than 100ms
      expect(elapsed).toBeLessThan(100);
    });

    it('should convert to snapshot in reasonable time', () => {
      const parseResult = parseSNBT(fixtures.chapterSnbt, { format: 'ftb' });
      const langData = parseLangFile(fixtures.langSnbt);

      const start = performance.now();
      convertToSnapshot(parseResult.data, langData);
      const elapsed = performance.now() - start;

      // Should convert in less than 50ms
      expect(elapsed).toBeLessThan(50);
    });
  });
});
