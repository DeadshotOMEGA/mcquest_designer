/**
 * Multi-file SNBT import orchestrator
 *
 * Handles the complete import workflow for FTB Quests questbooks:
 * 1. Index Build - Parse metadata files and discover chapter files
 * 2. Entity Parsing - Parse chapters in parallel, converting to ProjectSnapshot
 * 3. Reference Resolution - Resolve cross-file dependencies (hexId → UUID)
 * 4. Validation - Run semantic validation
 * 5. Finalization - Build complete ProjectSnapshot
 *
 * Supports questbook structure:
 * ```
 * config/ftbquests/quests/
 * ├── data.snbt              # Global config
 * ├── chapters/              # Chapter files
 * │   ├── chapter1.snbt
 * │   └── chapter2.snbt
 * ├── lang/                  # Localization
 * │   └── en_us.snbt
 * └── reward_tables/         # Optional reward tables
 *     └── table1.snbt
 * ```
 */

import type { ProjectSnapshot, Chapter, Quest } from '@mcquest/schema';
import { convertToSnapshot, type ImportProblem } from './converter.js';
import { parseSNBT } from './parser.js';
import { parseLangFile, type LangData } from './lang-handler.js';
import { routeFile } from './file-router.js';
import { resolveReferences } from './reference-resolver.js';

export interface ImportFile {
  path: string;
  content: string;
}

export interface ImportResult {
  success: boolean;
  snapshot: ProjectSnapshot | null;
  problems: ImportProblem[];
  metadata: {
    filesProcessed: number;
    chaptersImported: number;
    questsImported: number;
    dependenciesResolved: number;
    duration: number;
  };
}

/**
 * Orchestrate multi-file SNBT import
 * @param files Array of SNBT files (path + content)
 */
export async function orchestrateImport(files: ImportFile[]): Promise<ImportResult> {
  const startTime = performance.now();
  const problems: ImportProblem[] = [];

  try {
    // Phase 1: Index Build
    const indexResult = indexFiles(files);
    if (!indexResult.success) {
      return {
        success: false,
        snapshot: null,
        problems: indexResult.problems,
        metadata: {
          filesProcessed: 0,
          chaptersImported: 0,
          questsImported: 0,
          dependenciesResolved: 0,
          duration: performance.now() - startTime,
        },
      };
    }

    problems.push(...indexResult.problems);

    // Phase 2: Parse chapters in parallel
    const parseResult = await parseChaptersParallel(
      indexResult.chapterFiles,
      indexResult.langData || undefined,
      indexResult.rewardTables
    );
    problems.push(...parseResult.problems);

    if (parseResult.chapters.length === 0) {
      return {
        success: false,
        snapshot: null,
        problems: [
          ...problems,
          {
            severity: 'error',
            code: 'NO_CHAPTERS_FOUND',
            message: 'No chapters were successfully parsed from the import',
          },
        ],
        metadata: {
          filesProcessed: files.length,
          chaptersImported: 0,
          questsImported: 0,
          dependenciesResolved: 0,
          duration: performance.now() - startTime,
        },
      };
    }

    // Phase 3: Resolve cross-file references
    const resolutionResult = resolveReferences({
      chapters: parseResult.chapters,
      quests: parseResult.quests,
      hexIdMap: parseResult.hexIdMap,
      problems: parseResult.problems,
    });
    problems.push(...resolutionResult.problems);

    // Phase 4: Build complete snapshot
    const projectName =
      typeof (indexResult.globalConfig?.project_name) === 'string'
        ? (indexResult.globalConfig.project_name as string)
        : 'Imported FTB Quests';

    const snapshot: ProjectSnapshot = {
      version: '0.2.0',
      metadata: {
        projectName,
        targetMinecraftVersion: '1.21.1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        importedFrom: 'snbt',
        originalFormat: {
          source: 'FTB Quests SNBT',
        },
      },
      chapters: resolutionResult.chapters,
      quests: resolutionResult.quests,
      dependencies: resolutionResult.dependencies,
      uiState: {
        activeChapterId:
          resolutionResult.chapters.length > 0 ? (resolutionResult.chapters[0]?.id as string) : undefined,
        viewportByChapter: {},
      },
    };

    // Phase 5: Final validation
    const hasErrors = problems.filter((p) => p.severity === 'error').length > 0;

    return {
      success: !hasErrors,
      snapshot,
      problems,
      metadata: {
        filesProcessed: files.length,
        chaptersImported: resolutionResult.chapters.length,
        questsImported: resolutionResult.quests.length,
        dependenciesResolved: resolutionResult.dependencies.length,
        duration: performance.now() - startTime,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    problems.push({
      severity: 'error',
      code: 'IMPORT_FATAL_ERROR',
      message: `Import failed with fatal error: ${message}`,
    });

    return {
      success: false,
      snapshot: null,
      problems,
      metadata: {
        filesProcessed: files.length,
        chaptersImported: 0,
        questsImported: 0,
        dependenciesResolved: 0,
        duration: performance.now() - startTime,
      },
    };
  }
}

/**
 * Phase 1: Index files and extract metadata
 */
interface IndexResult {
  success: boolean;
  chapterFiles: ImportFile[];
  langData: LangData | null;
  rewardTables: Map<string, unknown>;
  globalConfig: Record<string, unknown> | null;
  problems: ImportProblem[];
}

function indexFiles(files: ImportFile[]): IndexResult {
  const problems: ImportProblem[] = [];
  const chapterFiles: ImportFile[] = [];
  const rewardTables = new Map<string, unknown>();
  let langData: LangData | null = null;
  let globalConfig: Record<string, unknown> | null = null;

  for (const file of files) {
    const route = routeFile(file.path);

    if (!route.success) {
      problems.push({
        severity: 'warning',
        code: 'FILE_NOT_ROUTABLE',
        message: `Skipping file ${file.path}: ${route.reason}`,
      });
      continue;
    }

    try {
      switch (route.type) {
        case 'global_config': {
          const parseResult = parseSNBT(file.content, { format: 'ftb' });
          if (parseResult.success && parseResult.data) {
            globalConfig = parseResult.data as Record<string, unknown>;
          } else {
            problems.push({
              severity: 'warning',
              code: 'DATA_SNBT_PARSE_ERROR',
              message: `Failed to parse data.snbt: ${parseResult.error?.message || 'Unknown error'}`,
              snbtLocation: {
                file: file.path,
                line: parseResult.error?.line || 0,
              },
            });
          }
          break;
        }

        case 'chapter': {
          chapterFiles.push(file);
          break;
        }

        case 'lang': {
          const parseResult = parseSNBT(file.content, { format: 'ftb' });
          if (parseResult.success && parseResult.data) {
            const parsed = parseLangFile(file.content);
            if (langData) {
              // Merge with existing lang data
              for (const [key, value] of parsed.titles.entries()) {
                if (!langData.titles.has(key)) {
                  langData.titles.set(key, value);
                }
              }
              for (const [key, value] of parsed.descriptions.entries()) {
                if (!langData.descriptions.has(key)) {
                  langData.descriptions.set(key, value);
                }
              }
            } else {
              langData = parsed;
            }
          } else {
            problems.push({
              severity: 'warning',
              code: 'LANG_SNBT_PARSE_ERROR',
              message: `Failed to parse lang file: ${parseResult.error?.message || 'Unknown error'}`,
              snbtLocation: {
                file: file.path,
                line: parseResult.error?.line || 0,
              },
            });
          }
          break;
        }

        case 'reward_table': {
          const parseResult = parseSNBT(file.content, { format: 'ftb' });
          if (parseResult.success && parseResult.data) {
            const tableId = route.tableId || `table_${rewardTables.size}`;
            rewardTables.set(tableId, parseResult.data);
          } else {
            problems.push({
              severity: 'warning',
              code: 'REWARD_TABLE_PARSE_ERROR',
              message: `Failed to parse reward table: ${parseResult.error?.message || 'Unknown error'}`,
              snbtLocation: {
                file: file.path,
                line: parseResult.error?.line || 0,
              },
            });
          }
          break;
        }
      }
    } catch (error) {
      problems.push({
        severity: 'warning',
        code: 'FILE_PROCESSING_ERROR',
        message: `Error processing ${file.path}: ${error instanceof Error ? error.message : String(error)}`,
        snbtLocation: {
          file: file.path,
          line: 0,
        },
      });
    }
  }

  if (chapterFiles.length === 0) {
    problems.push({
      severity: 'error',
      code: 'NO_CHAPTERS_FOUND',
      message: 'No chapter files found in questbook structure (expected: chapters/*.snbt)',
    });
    return {
      success: false,
      chapterFiles,
      langData,
      rewardTables,
      globalConfig,
      problems,
    };
  }

  return {
    success: true,
    chapterFiles,
    langData,
    rewardTables,
    globalConfig,
    problems,
  };
}

/**
 * Phase 2: Parse chapters in parallel
 */
interface ParseChaptersResult {
  chapters: Chapter[];
  quests: Quest[];
  hexIdMap: Map<string, string>; // hexId -> UUID mapping
  problems: ImportProblem[];
}

async function parseChaptersParallel(
  chapterFiles: ImportFile[],
  langData: LangData | undefined,
  _rewardTables: Map<string, unknown>
): Promise<ParseChaptersResult> {
  const problems: ImportProblem[] = [];
  const chapters: Chapter[] = [];
  const quests: Quest[] = [];
  const hexIdMap = new Map<string, string>();

  // Parse all chapters in parallel
  const parsePromises = chapterFiles.map((file) =>
    parseChapterFile(file, langData).catch((error) => ({
      success: false as const,
      problems: [
        {
          severity: 'error' as const,
          code: 'CHAPTER_FILE_EXCEPTION',
          message: `Error processing chapter file: ${error instanceof Error ? error.message : String(error)}`,
          snbtLocation: {
            file: file.path,
            line: 0,
          },
        },
      ],
    }))
  );

  const results = await Promise.all(parsePromises);

  let chapterOrder = 0;
  for (const result of results) {
    problems.push(...result.problems);

    if (!result.success || !result.snapshot) {
      continue;
    }

    // Update chapter order
    for (const chapter of result.snapshot.chapters || []) {
      chapter.order = chapterOrder++;
      chapters.push(chapter);
      if (chapter.metadata?.ftbQuestsId) {
        hexIdMap.set(chapter.metadata.ftbQuestsId, chapter.id);
      }
    }

    // Collect quests from this chapter
    for (const quest of result.snapshot.quests || []) {
      // Map quest to this chapter
      if (chapters.length > 0) {
        quest.chapterId = chapters[chapters.length - 1].id;
      }
      quests.push(quest);
      if (quest.metadata?.ftbQuestsId) {
        hexIdMap.set(quest.metadata.ftbQuestsId, quest.id);
      }
    }
  }

  return {
    chapters,
    quests,
    hexIdMap,
    problems,
  };
}

/**
 * Parse a single chapter file
 */
interface ParseChapterFileResult {
  success: boolean;
  snapshot?: ProjectSnapshot;
  problems: ImportProblem[];
}

async function parseChapterFile(
  file: ImportFile,
  langData: LangData | undefined
): Promise<ParseChapterFileResult> {
  try {
    const parseResult = parseSNBT(file.content, { format: 'ftb' });

    if (!parseResult.success) {
      return {
        success: false,
        problems: [
          {
            severity: 'error',
            code: 'CHAPTER_PARSE_ERROR',
            message: `Failed to parse SNBT: ${parseResult.error?.message || 'Unknown error'}`,
            snbtLocation: {
              file: file.path,
              line: parseResult.error?.line || 0,
            },
          },
        ],
      };
    }

    const conversionResult = convertToSnapshot(parseResult.data, langData);

    return {
      success: conversionResult.success,
      snapshot: conversionResult.snapshot || undefined,
      problems: conversionResult.problems,
    };
  } catch (error) {
    return {
      success: false,
      problems: [
        {
          severity: 'error',
          code: 'CHAPTER_FILE_ERROR',
          message: `Error processing chapter file: ${error instanceof Error ? error.message : String(error)}`,
          snbtLocation: {
            file: file.path,
            line: 0,
          },
        },
      ],
    };
  }
}
