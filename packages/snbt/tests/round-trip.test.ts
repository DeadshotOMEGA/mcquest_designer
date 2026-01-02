import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { parseSNBT } from '../src/parser.js';
import { parseLangFile } from '../src/lang-handler.js';
import { convertToSnapshot, convertFromSnapshot } from '../src/converter.js';
import { emitSNBT } from '../src/emitter.js';
import type { ProjectSnapshot } from '@mcquest/schema';

/**
 * Round-Trip Integration Tests (T3.5, T6.5)
 *
 * Tests the complete import → export → import cycle:
 * 1. Import SNBT → ProjectSnapshot
 * 2. Export ProjectSnapshot → SNBT
 * 3. Re-import SNBT → ProjectSnapshot
 * 4. Verify data equivalence
 *
 * Key requirements:
 * - IDs must be preserved via metadata
 * - Quest positions must be preserved
 * - All quest/task/reward data must survive round-trip
 * - Dependencies must remain correct
 * - Output must be deterministic (same input → same output)
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Round-Trip Integration Tests', () => {
  describe('Golden Export Round-Trip', () => {
    it('should preserve all data through import → export → import cycle', () => {
      // Load golden fixture
      const fixturesDir = join(__dirname, 'fixtures');
      const chapterSnbt = readFileSync(join(fixturesDir, 'chapter-the-beginning.snbt'), 'utf-8');
      const langSnbt = readFileSync(join(fixturesDir, 'lang-en_us.snbt'), 'utf-8');

      // Step 1: Import SNBT to snapshot
      const parseResult = parseSNBT(chapterSnbt, { format: 'ftb' });
      expect(parseResult.success).toBe(true);

      const langData = parseLangFile(langSnbt);

      const conversionResult = convertToSnapshot(parseResult.data, langData);
      expect(conversionResult.success).toBe(true);
      expect(conversionResult.snapshot).toBeDefined();

      const snapshot1 = conversionResult.snapshot!;

      // Verify import succeeded
      expect(snapshot1.chapters).toHaveLength(1);
      expect(snapshot1.quests.length).toBeGreaterThan(0);

      // Step 2: Export snapshot back to SNBT
      const snbtObj1 = convertFromSnapshot(snapshot1);
      const exportedSnbt1 = emitSNBT(snbtObj1, { format: 'ftb' });

      expect(exportedSnbt1).toBeTruthy();
      expect(exportedSnbt1.length).toBeGreaterThan(0);

      // Step 3: Re-import the exported SNBT
      const parseResult2 = parseSNBT(exportedSnbt1, { format: 'ftb' });
      expect(parseResult2.success).toBe(true);

      const conversionResult2 = convertToSnapshot(parseResult2.data, langData);
      expect(conversionResult2.success).toBe(true);
      expect(conversionResult2.snapshot).toBeDefined();

      const snapshot2 = conversionResult2.snapshot!;

      // Step 4: Verify equivalence
      verifySnapshotEquivalence(snapshot1, snapshot2);
    });

    it('should preserve FTB Quest IDs through round-trip', () => {
      const fixturesDir = join(__dirname, 'fixtures');
      const chapterSnbt = readFileSync(join(fixturesDir, 'chapter-the-beginning.snbt'), 'utf-8');

      // Import
      const parseResult = parseSNBT(chapterSnbt, { format: 'ftb' });
      const conversionResult = convertToSnapshot(parseResult.data, { titles: new Map(), descriptions: new Map() });
      const snapshot1 = conversionResult.snapshot!;

      // Get original FTB IDs from metadata
      const originalChapterId = snapshot1.chapters[0].metadata?.ftbQuestsId;
      const originalQuestIds = snapshot1.quests.map((q) => q.metadata?.ftbQuestsId);

      // Export and re-import
      const snbtObj = convertFromSnapshot(snapshot1);
      const exportedSnbt = emitSNBT(snbtObj, { format: 'ftb' });

      const parseResult2 = parseSNBT(exportedSnbt, { format: 'ftb' });
      const conversionResult2 = convertToSnapshot(parseResult2.data, { titles: new Map(), descriptions: new Map() });
      const snapshot2 = conversionResult2.snapshot!;

      // Verify FTB IDs are preserved
      expect(snapshot2.chapters[0].metadata?.ftbQuestsId).toBe(originalChapterId);

      snapshot2.quests.forEach((quest, i) => {
        expect(quest.metadata?.ftbQuestsId).toBe(originalQuestIds[i]);
      });
    });

    it('should preserve quest positions exactly', () => {
      const fixturesDir = join(__dirname, 'fixtures');
      const chapterSnbt = readFileSync(join(fixturesDir, 'chapter-the-beginning.snbt'), 'utf-8');

      // Import
      const parseResult = parseSNBT(chapterSnbt, { format: 'ftb' });
      const conversionResult = convertToSnapshot(parseResult.data, { titles: new Map(), descriptions: new Map() });
      const snapshot1 = conversionResult.snapshot!;

      // Get original positions
      const originalPositions = snapshot1.quests.map((q) => ({ ...q.position }));

      // Export and re-import
      const snbtObj = convertFromSnapshot(snapshot1);
      const exportedSnbt = emitSNBT(snbtObj, { format: 'ftb' });

      const parseResult2 = parseSNBT(exportedSnbt, { format: 'ftb' });
      const conversionResult2 = convertToSnapshot(parseResult2.data, { titles: new Map(), descriptions: new Map() });
      const snapshot2 = conversionResult2.snapshot!;

      // Verify positions are preserved
      snapshot2.quests.forEach((quest, i) => {
        expect(quest.position.x).toBeCloseTo(originalPositions[i].x, 1);
        expect(quest.position.y).toBeCloseTo(originalPositions[i].y, 1);
      });
    });

    it('should preserve dependencies correctly', () => {
      const fixturesDir = join(__dirname, 'fixtures');
      const chapterSnbt = readFileSync(join(fixturesDir, 'chapter-the-beginning.snbt'), 'utf-8');

      // Import
      const parseResult = parseSNBT(chapterSnbt, { format: 'ftb' });
      const conversionResult = convertToSnapshot(parseResult.data, { titles: new Map(), descriptions: new Map() });
      const snapshot1 = conversionResult.snapshot!;

      // Get original dependencies
      const originalDeps = snapshot1.dependencies.map((d) => ({ ...d }));

      // Export and re-import
      const snbtObj = convertFromSnapshot(snapshot1);
      const exportedSnbt = emitSNBT(snbtObj, { format: 'ftb' });

      const parseResult2 = parseSNBT(exportedSnbt, { format: 'ftb' });
      const conversionResult2 = convertToSnapshot(parseResult2.data, { titles: new Map(), descriptions: new Map() });
      const snapshot2 = conversionResult2.snapshot!;

      // Verify dependencies count matches
      expect(snapshot2.dependencies).toHaveLength(originalDeps.length);

      // Create quest index maps for both snapshots
      const questIndexMap1 = new Map(snapshot1.quests.map((q, i) => [q.id, i]));
      const questIndexMap2 = new Map(snapshot2.quests.map((q, i) => [q.id, i]));

      // Verify each dependency exists (by quest position, not UUID)
      originalDeps.forEach((originalDep) => {
        const fromIndex1 = questIndexMap1.get(originalDep.fromQuestId);
        const toIndex1 = questIndexMap1.get(originalDep.toQuestId);

        // Find corresponding dependency in snapshot2 by quest positions
        const found = snapshot2.dependencies.some((dep) => {
          const fromIndex2 = questIndexMap2.get(dep.fromQuestId);
          const toIndex2 = questIndexMap2.get(dep.toQuestId);
          return fromIndex2 === fromIndex1 && toIndex2 === toIndex1 && dep.type === originalDep.type;
        });
        expect(found).toBe(true);
      });
    });
  });

  describe('Deterministic Output', () => {
    it('should produce identical SNBT output for same snapshot (determinism)', () => {
      // Create a test snapshot
      const snapshot = createTestSnapshot();

      // Export twice
      const snbtObj1 = convertFromSnapshot(snapshot);
      const export1 = emitSNBT(snbtObj1, { format: 'ftb' });

      const snbtObj2 = convertFromSnapshot(snapshot);
      const export2 = emitSNBT(snbtObj2, { format: 'ftb' });

      // Outputs should be byte-identical
      expect(export1).toBe(export2);
    });

    it('should produce stable output after multiple round-trips', () => {
      const snapshot1 = createTestSnapshot();

      // First export
      const snbtObj1 = convertFromSnapshot(snapshot1);
      const export1 = emitSNBT(snbtObj1, { format: 'ftb' });

      // Re-import
      const parseResult1 = parseSNBT(export1, { format: 'ftb' });
      const conversionResult1 = convertToSnapshot(parseResult1.data, { titles: new Map(), descriptions: new Map() });
      const snapshot2 = conversionResult1.snapshot!;

      // Second export
      const snbtObj2 = convertFromSnapshot(snapshot2);
      const export2 = emitSNBT(snbtObj2, { format: 'ftb' });

      // Re-import again
      const parseResult2 = parseSNBT(export2, { format: 'ftb' });
      const conversionResult2 = convertToSnapshot(parseResult2.data, { titles: new Map(), descriptions: new Map() });
      const snapshot3 = conversionResult2.snapshot!;

      // Third export
      const snbtObj3 = convertFromSnapshot(snapshot3);
      const export3 = emitSNBT(snbtObj3, { format: 'ftb' });

      // All exports after first round-trip should be identical
      expect(export2).toBe(export3);
    });
  });

  describe('Data Integrity', () => {
    it('should preserve all task types through round-trip', () => {
      const snapshot = createSnapshotWithAllTaskTypes();

      // Export and re-import
      const snbtObj = convertFromSnapshot(snapshot);
      const exportedSnbt = emitSNBT(snbtObj, { format: 'ftb' });

      const parseResult = parseSNBT(exportedSnbt, { format: 'ftb' });
      const conversionResult = convertToSnapshot(parseResult.data, { titles: new Map(), descriptions: new Map() });
      const snapshot2 = conversionResult.snapshot!;

      // Verify all task types survived
      const taskTypes1 = new Set(snapshot.quests.flatMap((q) => q.tasks.map((t) => t.type)));
      const taskTypes2 = new Set(snapshot2.quests.flatMap((q) => q.tasks.map((t) => t.type)));

      expect(taskTypes2.size).toBe(taskTypes1.size);
      taskTypes1.forEach((type) => {
        expect(taskTypes2.has(type)).toBe(true);
      });
    });

    it('should preserve all reward types through round-trip', () => {
      const snapshot = createSnapshotWithAllRewardTypes();

      // Export and re-import
      const snbtObj = convertFromSnapshot(snapshot);
      const exportedSnbt = emitSNBT(snbtObj, { format: 'ftb' });

      const parseResult = parseSNBT(exportedSnbt, { format: 'ftb' });
      const conversionResult = convertToSnapshot(parseResult.data, { titles: new Map(), descriptions: new Map() });
      const snapshot2 = conversionResult.snapshot!;

      // Verify all reward types survived
      const rewardTypes1 = new Set(snapshot.quests.flatMap((q) => q.rewards.map((r) => r.type)));
      const rewardTypes2 = new Set(snapshot2.quests.flatMap((q) => q.rewards.map((r) => r.type)));

      expect(rewardTypes2.size).toBe(rewardTypes1.size);
      rewardTypes1.forEach((type) => {
        expect(rewardTypes2.has(type)).toBe(true);
      });
    });

    it('should preserve quest settings (optional, hideUntilDeps, etc.)', () => {
      const snapshot = createTestSnapshot();

      // Set various quest settings
      snapshot.quests[0].settings.optional = true;
      snapshot.quests[0].settings.hideUntilDeps = true;

      // Export and re-import
      const snbtObj = convertFromSnapshot(snapshot);
      const exportedSnbt = emitSNBT(snbtObj, { format: 'ftb' });

      const parseResult = parseSNBT(exportedSnbt, { format: 'ftb' });
      const conversionResult = convertToSnapshot(parseResult.data, { titles: new Map(), descriptions: new Map() });
      const snapshot2 = conversionResult.snapshot!;

      // Verify settings preserved
      expect(snapshot2.quests[0].settings.optional).toBe(true);
      expect(snapshot2.quests[0].settings.hideUntilDeps).toBe(true);
    });
  });
});

/**
 * Helper: Verify two snapshots are equivalent
 */
function verifySnapshotEquivalence(s1: ProjectSnapshot, s2: ProjectSnapshot): void {
  // Same number of chapters and quests
  expect(s2.chapters).toHaveLength(s1.chapters.length);
  expect(s2.quests).toHaveLength(s1.quests.length);
  expect(s2.dependencies).toHaveLength(s1.dependencies.length);

  // Verify chapters match
  s1.chapters.forEach((ch1, i) => {
    const ch2 = s2.chapters[i];
    expect(ch2.title).toBe(ch1.title);
    expect(ch2.order).toBe(ch1.order);
    expect(ch2.icon).toStrictEqual(ch1.icon);
  });

  // Verify quests match (by position, since UUIDs are regenerated on import)
  s1.quests.forEach((q1, i) => {
    const q2 = s2.quests[i];
    expect(q2).toBeDefined();

    if (!q2) return;

    expect(q2.title).toBe(q1.title);
    // Chapter ID will be different (new UUID), so don't compare directly
    expect(q2.tasks).toHaveLength(q1.tasks.length);
    expect(q2.rewards).toHaveLength(q1.rewards.length);
  });
}

/**
 * Helper: Create test snapshot
 */
function createTestSnapshot(): ProjectSnapshot {
  return {
    version: '1.0.0',
    projectName: 'Round-Trip Test',
    chapters: [
      {
        id: 'chapter-1',
        title: 'Test Chapter',
        order: 0,
        icon: 'minecraft:book',
        metadata: { ftbQuestsId: '12345678' },
      },
    ],
    quests: [
      {
        id: 'quest-1',
        chapterId: 'chapter-1',
        title: 'First Quest',
        subtitle: 'A test quest',
        description: 'Description here',
        position: { x: 0, y: 0 },
        icon: 'minecraft:diamond',
        tasks: [
          {
            id: 'task-1',
            type: 'item',
            title: 'Gather Diamonds',
            item: 'minecraft:diamond',
            count: 10,
          },
        ],
        rewards: [
          {
            id: 'reward-1',
            type: 'item',
            title: 'Reward Emeralds',
            item: 'minecraft:emerald',
            count: 5,
          },
        ],
        dependencies: [],
        settings: {
          optional: false,
          hidden: 'false',
          repeatable: false,
          canRepeat: false,
          hideUntilDeps: false,
        },
        metadata: { ftbQuestsId: 'ABCDEF01' },
      },
      {
        id: 'quest-2',
        chapterId: 'chapter-1',
        title: 'Second Quest',
        subtitle: '',
        description: '',
        position: { x: 5, y: 0 },
        icon: 'minecraft:emerald',
        tasks: [],
        rewards: [],
        dependencies: [],
        settings: {
          optional: false,
          hidden: 'false',
          repeatable: false,
          canRepeat: false,
          hideUntilDeps: false,
        },
        metadata: { ftbQuestsId: 'ABCDEF02' },
      },
    ],
    dependencies: [
      {
        id: 'dep-1',
        fromQuestId: 'quest-1',
        toQuestId: 'quest-2',
      },
    ],
    uiState: {
      viewport: { x: 0, y: 0, zoom: 1 },
      selectedQuestId: null,
      activeChapterId: 'chapter-1',
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Helper: Create snapshot with all task types
 */
function createSnapshotWithAllTaskTypes(): ProjectSnapshot {
  const snapshot = createTestSnapshot();

  snapshot.quests[0].tasks = [
    { id: 't1', type: 'item', title: 'Item Task', item: 'minecraft:diamond', count: 1 },
    { id: 't2', type: 'checkmark', title: 'Checkmark Task' },
    { id: 't3', type: 'xp', title: 'XP Task', value: 100 },
  ];

  return snapshot;
}

/**
 * Helper: Create snapshot with all reward types
 */
function createSnapshotWithAllRewardTypes(): ProjectSnapshot {
  const snapshot = createTestSnapshot();

  snapshot.quests[0].rewards = [
    { id: 'r1', type: 'item', title: 'Item Reward', item: 'minecraft:emerald', count: 5 },
    { id: 'r2', type: 'xp', title: 'XP Reward', value: 100 },
    { id: 'r3', type: 'command', title: 'Command Reward', command: '/give @p minecraft:diamond 1' },
  ];

  return snapshot;
}
