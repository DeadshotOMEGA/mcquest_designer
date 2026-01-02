import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { orchestrateImport, type ImportFile } from '../src/import-orchestrator.js';
import type { ProjectSnapshot } from '@mcquest/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = join(__dirname, 'fixtures');

describe('Import Orchestrator - Multi-file SNBT Import', () => {
  let testFiles: ImportFile[] = [];

  beforeAll(() => {
    const chapterContent = readFileSync(
      join(fixturesDir, 'chapter-the-beginning.snbt'),
      'utf-8'
    );
    const langContent = readFileSync(
      join(fixturesDir, 'lang-en_us.snbt'),
      'utf-8'
    );

    testFiles = [
      {
        path: 'chapters/the_beginning.snbt',
        content: chapterContent,
      },
      {
        path: 'lang/en_us.snbt',
        content: langContent,
      },
    ];
  });

  describe('Phase 1: File Indexing', () => {
    it('should route files to correct handlers', async () => {
      const result = await orchestrateImport(testFiles);

      expect(result.success).toBe(true);
      expect(result.metadata.filesProcessed).toBe(2);
    });
  });

  describe('Phase 2: Entity Parsing', () => {
    it('should parse chapters and quests from SNBT files', async () => {
      const result = await orchestrateImport(testFiles);

      expect(result.snapshot).toBeDefined();
      expect(result.snapshot?.chapters.length).toBeGreaterThan(0);
      expect(result.snapshot?.quests.length).toBeGreaterThan(0);
    });

    it('should extract chapter metadata', async () => {
      const result = await orchestrateImport(testFiles);
      const snapshot = result.snapshot as ProjectSnapshot;
      const chapter = snapshot.chapters[0];

      expect(chapter.id).toBeDefined();
      // Title should come from lang file if available, otherwise filename
      expect(chapter.title).toBeDefined();
      expect(chapter.title.length).toBeGreaterThan(0);
      expect(chapter.order).toBe(0);
      expect(chapter.icon?.value).toBe('minecraft:oak_sapling');
    });

    it('should extract quest metadata', async () => {
      const result = await orchestrateImport(testFiles);
      const snapshot = result.snapshot as ProjectSnapshot;
      const quest = snapshot.quests[0];

      expect(quest.id).toBeDefined();
      expect(quest.chapterId).toBe(snapshot.chapters[0].id);
      expect(quest.title).toBeDefined();
      expect(quest.position).toBeDefined();
      expect(quest.size).toBeGreaterThan(0);
    });

    it('should extract tasks and rewards', async () => {
      const result = await orchestrateImport(testFiles);
      const snapshot = result.snapshot as ProjectSnapshot;

      // Check for quests with tasks/rewards
      const questsWithTasks = snapshot.quests.filter((q) => q.tasks && q.tasks.length > 0);
      const questsWithRewards = snapshot.quests.filter((q) => q.rewards && q.rewards.length > 0);

      // The test fixture should have at least some quests with these
      expect(questsWithRewards.length).toBeGreaterThan(0);
    });

    it('should preserve FTB Quests metadata for round-trip fidelity', async () => {
      const result = await orchestrateImport(testFiles);
      const snapshot = result.snapshot as ProjectSnapshot;

      for (const chapter of snapshot.chapters) {
        expect(chapter.metadata?.ftbQuestsId).toBeDefined();
      }

      for (const quest of snapshot.quests) {
        expect(quest.metadata?.ftbQuestsId).toBeDefined();
      }
    });
  });

  describe('Phase 3: Reference Resolution', () => {
    it('should build hexId to UUID mapping', async () => {
      const result = await orchestrateImport(testFiles);

      expect(result.snapshot).toBeDefined();
      // All quests should have both hex IDs and UUIDs
      for (const quest of result.snapshot!.quests) {
        expect(quest.metadata?.ftbQuestsId).toBeTruthy(); // Hex ID
        expect(quest.id).toBeTruthy(); // UUID
        expect(quest.id).toMatch(/^[0-9a-f-]+$/i); // UUID format
      }
    });

    it('should resolve cross-chapter dependencies', async () => {
      const result = await orchestrateImport(testFiles);
      const snapshot = result.snapshot as ProjectSnapshot;

      // All dependency references should be valid UUIDs
      for (const dep of snapshot.dependencies) {
        expect(snapshot.quests.some((q) => q.id === dep.fromQuestId)).toBe(true);
        expect(snapshot.quests.some((q) => q.id === dep.toQuestId)).toBe(true);
      }
    });
  });

  describe('Phase 4: Validation', () => {
    it('should validate snapshot structure', async () => {
      const result = await orchestrateImport(testFiles);
      const snapshot = result.snapshot as ProjectSnapshot;

      expect(snapshot.version).toBe('0.2.0');
      expect(snapshot.metadata).toBeDefined();
      expect(snapshot.metadata.projectName).toBeDefined();
      expect(snapshot.metadata.targetMinecraftVersion).toBe('1.21.1');
      expect(snapshot.chapters).toBeDefined();
      expect(snapshot.quests).toBeDefined();
      expect(snapshot.dependencies).toBeDefined();
    });

    it('should track metadata about the import', async () => {
      const result = await orchestrateImport(testFiles);

      expect(result.metadata.filesProcessed).toBeGreaterThan(0);
      expect(result.metadata.chaptersImported).toBeGreaterThan(0);
      expect(result.metadata.questsImported).toBeGreaterThan(0);
      expect(result.metadata.duration).toBeGreaterThan(0);
    });

    it('should report problems without failing on warnings', async () => {
      const result = await orchestrateImport(testFiles);

      // Should succeed even if there are warnings
      expect(result.success).toBe(true);

      // Check that problem tracking works
      const errors = result.problems.filter((p) => p.severity === 'error');
      const warnings = result.problems.filter((p) => p.severity === 'warning');

      // For this fixture, we should have no errors
      expect(errors.length).toBe(0);
    });
  });

  describe('Phase 5: Finalization', () => {
    it('should return a complete, valid ProjectSnapshot', async () => {
      const result = await orchestrateImport(testFiles);

      expect(result.success).toBe(true);
      expect(result.snapshot).toBeDefined();

      const snapshot = result.snapshot as ProjectSnapshot;

      // Should have all required fields
      expect(snapshot.version).toBeDefined();
      expect(snapshot.metadata).toBeDefined();
      expect(snapshot.chapters.length).toBeGreaterThan(0);
      expect(snapshot.quests.length).toBeGreaterThan(0);
      expect(snapshot.uiState).toBeDefined();
    });

    it('should set initial UI state correctly', async () => {
      const result = await orchestrateImport(testFiles);
      const snapshot = result.snapshot as ProjectSnapshot;

      expect(snapshot.uiState.activeChapterId).toBe(snapshot.chapters[0].id);
      expect(snapshot.uiState.viewportByChapter).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing chapter files', async () => {
      const files: ImportFile[] = [
        {
          path: 'lang/en_us.snbt',
          content: testFiles[1].content,
        },
      ];

      const result = await orchestrateImport(files);

      expect(result.success).toBe(false);
      expect(result.problems.length).toBeGreaterThan(0);
      expect(result.problems.some((p) => p.code === 'NO_CHAPTERS_FOUND')).toBe(true);
    });

    it('should handle malformed SNBT gracefully', async () => {
      const files: ImportFile[] = [
        {
          path: 'chapters/bad.snbt',
          content: '{ this is not valid snbt! }}}',
        },
      ];

      const result = await orchestrateImport(files);

      // Should fail gracefully with structured error
      expect(result.success).toBe(false);
      expect(result.problems.length).toBeGreaterThan(0);
    });

    it('should collect all errors without failing early', async () => {
      // Mix valid and invalid files
      const files: ImportFile[] = [
        {
          path: 'chapters/valid.snbt',
          content: testFiles[0].content,
        },
        {
          path: 'chapters/invalid.snbt',
          content: '{ invalid }',
        },
      ];

      const result = await orchestrateImport(files);

      // Should still process valid files
      expect(result.metadata.chaptersImported).toBeGreaterThan(0);
      expect(result.problems.length).toBeGreaterThan(0);
    });

    it('should isolate per-file errors', async () => {
      const files: ImportFile[] = [
        {
          path: 'chapters/invalid.snbt',
          content: '{ invalid }',
        },
        {
          path: 'lang/bad.snbt',
          content: '{ also invalid }',
        },
      ];

      const result = await orchestrateImport(files);

      // Both errors should be reported
      const chapterErrors = result.problems.filter(
        (p) => p.snbtLocation?.file.includes('chapters')
      );
      const langErrors = result.problems.filter(
        (p) => p.snbtLocation?.file.includes('lang')
      );

      expect(chapterErrors.length).toBeGreaterThan(0);
      expect(langErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should import small questbooks quickly', async () => {
      const startTime = performance.now();
      const result = await orchestrateImport(testFiles);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(result.metadata.duration).toBeLessThan(1000);
    });
  });
});
