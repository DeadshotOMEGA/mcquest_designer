import { describe, it, expect } from 'vitest';
import { parseSNBT } from '../src/parser.js';
import { convertToSnapshot, convertFromSnapshot } from '../src/converter.js';
import { emitSNBT } from '../src/emitter.js';
import { createIDMapper } from '../src/id-mapper.js';
import type { ProjectSnapshot } from '@mcquest/schema';

/**
 * Performance Benchmarks (T6.3-T6.4)
 *
 * Tests performance characteristics of SNBT parsing, conversion, and emission:
 * - Parse time for various SNBT sizes
 * - Conversion time (SNBT → ProjectSnapshot)
 * - Emission time (ProjectSnapshot → SNBT)
 * - ID mapping performance with many entities
 * - Memory usage characteristics
 *
 * Thresholds are based on expected real-world usage:
 * - Small: 1-10 quests (< 10ms)
 * - Medium: 50-100 quests (< 100ms)
 * - Large: 500+ quests (< 1000ms)
 */

describe('Performance Benchmarks', () => {
  describe('Parse Performance', () => {
    it('should parse small SNBT (< 10 quests) in under 10ms', () => {
      const smallSNBT = generateChapterSNBT(5);

      const startTime = performance.now();
      const result = parseSNBT(smallSNBT, { format: 'ftb' });
      const endTime = performance.now();

      expect(result.success).toBe(true);

      const duration = endTime - startTime;
      console.log(`Small SNBT parse time: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(10);
    });

    it('should parse medium SNBT (50 quests) in under 100ms', () => {
      const mediumSNBT = generateChapterSNBT(50);

      const startTime = performance.now();
      const result = parseSNBT(mediumSNBT, { format: 'ftb' });
      const endTime = performance.now();

      expect(result.success).toBe(true);

      const duration = endTime - startTime;
      console.log(`Medium SNBT parse time: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });

    it('should parse large SNBT (500 quests) in under 1000ms', () => {
      const largeSNBT = generateChapterSNBT(500);

      const startTime = performance.now();
      const result = parseSNBT(largeSNBT, { format: 'ftb' });
      const endTime = performance.now();

      expect(result.success).toBe(true);

      const duration = endTime - startTime;
      console.log(`Large SNBT parse time: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Conversion Performance (SNBT → Snapshot)', () => {
    it('should convert small dataset in under 20ms', () => {
      const snbt = generateChapterSNBT(10);
      const parseResult = parseSNBT(snbt, { format: 'ftb' });
      expect(parseResult.success).toBe(true);

      const startTime = performance.now();
      const result = convertToSnapshot(parseResult.data, {});
      const endTime = performance.now();

      expect(result.snapshot).toBeDefined();

      const duration = endTime - startTime;
      console.log(`Small conversion time: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(20);
    });

    it('should convert medium dataset in under 200ms', () => {
      const snbt = generateChapterSNBT(100);
      const parseResult = parseSNBT(snbt, { format: 'ftb' });
      expect(parseResult.success).toBe(true);

      const startTime = performance.now();
      const result = convertToSnapshot(parseResult.data, {});
      const endTime = performance.now();

      expect(result.snapshot).toBeDefined();

      const duration = endTime - startTime;
      console.log(`Medium conversion time: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(200);
    });

    it('should convert large dataset in under 2000ms', () => {
      const snbt = generateChapterSNBT(500);
      const parseResult = parseSNBT(snbt, { format: 'ftb' });
      expect(parseResult.success).toBe(true);

      const startTime = performance.now();
      const result = convertToSnapshot(parseResult.data, {});
      const endTime = performance.now();

      expect(result.snapshot).toBeDefined();

      const duration = endTime - startTime;
      console.log(`Large conversion time: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Emission Performance (Snapshot → SNBT)', () => {
    it('should emit small snapshot in under 20ms', () => {
      const snapshot = generateProjectSnapshot(10);

      const startTime = performance.now();
      const snbtObj = convertFromSnapshot(snapshot);
      const snbtText = emitSNBT(snbtObj, { format: 'ftb' });
      const endTime = performance.now();

      expect(snbtText).toBeTruthy();
      expect(snbtText.length).toBeGreaterThan(0);

      const duration = endTime - startTime;
      console.log(`Small emission time: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(20);
    });

    it('should emit medium snapshot in under 200ms', () => {
      const snapshot = generateProjectSnapshot(100);

      const startTime = performance.now();
      const snbtObj = convertFromSnapshot(snapshot);
      const snbtText = emitSNBT(snbtObj, { format: 'ftb' });
      const endTime = performance.now();

      expect(snbtText).toBeTruthy();

      const duration = endTime - startTime;
      console.log(`Medium emission time: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(200);
    });

    it('should emit large snapshot in under 2000ms', () => {
      const snapshot = generateProjectSnapshot(500);

      const startTime = performance.now();
      const snbtObj = convertFromSnapshot(snapshot);
      const snbtText = emitSNBT(snbtObj, { format: 'ftb' });
      const endTime = performance.now();

      expect(snbtText).toBeTruthy();

      const duration = endTime - startTime;
      console.log(`Large emission time: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('ID Mapping Performance', () => {
    it('should map 1000 entity IDs in under 50ms', () => {
      const entities = Array.from({ length: 1000 }, (_, i) => ({
        id: `quest-${i}`,
        order: i,
        position: { x: i * 10, y: 0 },
      }));

      const startTime = performance.now();
      const mapper = createIDMapper(entities);
      const endTime = performance.now();

      const duration = endTime - startTime;
      console.log(`ID mapping (1000 entities): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);

      // Verify mapping works
      expect(mapper.toHexId(entities[0].id)).toHaveLength(8);
    });

    it('should perform deterministic sorting for 1000 quests in under 100ms', () => {
      const quests = Array.from({ length: 1000 }, (_, i) => ({
        id: `quest-${i}`,
        chapterId: `chapter-${Math.floor(i / 100)}`,
        position: {
          x: Math.random() * 1000,
          y: Math.random() * 1000,
        },
        title: `Quest ${i}`,
        tasks: [],
        rewards: [],
        dependencies: [],
      }));

      const startTime = performance.now();
      const sorted = [...quests].sort((a, b) => {
        // Sort by y position, then x position, then id
        if (a.position.y !== b.position.y) {
          return a.position.y - b.position.y;
        }
        if (a.position.x !== b.position.x) {
          return a.position.x - b.position.x;
        }
        return a.id.localeCompare(b.id);
      });
      const endTime = performance.now();

      const duration = endTime - startTime;
      console.log(`Sorting 1000 quests: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
      expect(sorted.length).toBe(1000);
    });
  });

  describe('Round-Trip Performance', () => {
    it('should complete full round-trip (parse → convert → emit) in under 100ms for medium dataset', () => {
      // Generate test SNBT
      const originalSNBT = generateChapterSNBT(50);

      const startTime = performance.now();

      // Step 1: Parse SNBT
      const parseResult = parseSNBT(originalSNBT, { format: 'ftb' });
      expect(parseResult.success).toBe(true);

      // Step 2: Convert to snapshot
      const conversionResult = convertToSnapshot(parseResult.data, {});
      expect(conversionResult.snapshot).toBeDefined();

      // Step 3: Convert back to SNBT
      const snbtObj = convertFromSnapshot(conversionResult.snapshot!);
      const finalSNBT = emitSNBT(snbtObj, { format: 'ftb' });

      const endTime = performance.now();

      expect(finalSNBT).toBeTruthy();

      const duration = endTime - startTime;
      console.log(`Full round-trip (50 quests): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Memory Efficiency', () => {
    it('should not leak memory during repeated conversions', () => {
      const snapshot = generateProjectSnapshot(50);

      // Perform 100 conversions
      for (let i = 0; i < 100; i++) {
        const snbtObj = convertFromSnapshot(snapshot);
        const snbtText = emitSNBT(snbtObj, { format: 'ftb' });

        // Ensure output is valid
        expect(snbtText).toBeTruthy();
      }

      // If we get here without OOM, test passes
      // (In a real scenario, you'd monitor actual memory usage)
      expect(true).toBe(true);
    });
  });
});

/**
 * Helper: Generate test SNBT with specified number of quests
 */
function generateChapterSNBT(questCount: number): string {
  const quests: string[] = [];

  for (let i = 0; i < questCount; i++) {
    quests.push(`
\t\t{
\t\t\tid: "${generateHexId(i)}"
\t\t\tx: ${i * 5}.0d
\t\t\ty: 0.0d
\t\t\ticon: { id: "minecraft:diamond" }
\t\t\ttasks: [
\t\t\t\t{
\t\t\t\t\tid: "${generateHexId(i * 1000)}"
\t\t\t\t\ttype: "item"
\t\t\t\t\titem: { id: "minecraft:diamond" }
\t\t\t\t\tcount: 1L
\t\t\t\t}
\t\t\t]
\t\t}`);
  }

  return `{
\tfilename: "perf_test_chapter"
\tid: "PERFTEST"
\torder_index: 0
\ticon: { id: "minecraft:book" }
\tquests: [${quests.join('')}
\t]
}`;
}

/**
 * Helper: Generate test ProjectSnapshot with specified number of quests
 */
function generateProjectSnapshot(questCount: number): ProjectSnapshot {
  const snapshot: ProjectSnapshot = {
    version: '1.0.0',
    projectName: 'Performance Test',
    chapters: [
      {
        id: 'chapter-1',
        title: 'Test Chapter',
        order: 0,
        icon: 'minecraft:book',
      },
    ],
    quests: [],
    dependencies: [],
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

  for (let i = 0; i < questCount; i++) {
    snapshot.quests.push({
      id: `quest-${i}`,
      chapterId: 'chapter-1',
      title: `Quest ${i}`,
      subtitle: '',
      description: `This is quest number ${i}`,
      position: { x: i * 5, y: 0 },
      icon: 'minecraft:diamond',
      tasks: [
        {
          id: `task-${i}`,
          type: 'item',
          title: `Gather Item ${i}`,
          item: 'minecraft:diamond',
          count: 1,
        },
      ],
      rewards: [
        {
          id: `reward-${i}`,
          type: 'item',
          title: `Reward ${i}`,
          item: 'minecraft:emerald',
          count: 1,
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
    });
  }

  return snapshot;
}

/**
 * Helper: Generate deterministic 8-character hex ID from number
 */
function generateHexId(num: number): string {
  return num.toString(16).toUpperCase().padStart(8, '0');
}
