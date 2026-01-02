'use client';

import type { ProjectSnapshot } from '@mcquest/schema';
import { parseSNBT, convertToSnapshot, parseLangFile } from '@mcquest/snbt';
import type { SnbtFiles } from '@/components/import';

export interface ImportProblem {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  entity?: {
    kind: 'quest' | 'chapter';
    id?: string;
    line?: number;
  };
  snbtLocation?: {
    file: string;
    line?: number;
    column?: number;
  };
}

export interface ParseSNBTFilesResult {
  snapshot: ProjectSnapshot | null;
  problems: ImportProblem[];
}

/**
 * Parse SNBT files and convert to ProjectSnapshot
 *
 * This function:
 * 1. Reads all chapter files using FileReader
 * 2. Parses each with parseSNBT
 * 3. Parses lang file if present
 * 4. Combines all chapters into a single SNBT object
 * 5. Converts to ProjectSnapshot using convertToSnapshot
 *
 * @param files Categorized SNBT files (chapters and optional lang file)
 * @returns Promise with snapshot and problems array
 */
export async function parseSNBTFiles(
  files: SnbtFiles
): Promise<ParseSNBTFilesResult> {
  const problems: ImportProblem[] = [];

  // Validate that we have at least one chapter file
  if (!files.chapters || files.chapters.length === 0) {
    problems.push({
      severity: 'error',
      code: 'NO_CHAPTER_FILES',
      message: 'At least one chapter file is required',
    });
    return { snapshot: null, problems };
  }

  // Read and parse all chapter files
  const parsedChapters: unknown[] = [];
  const allQuests: unknown[] = [];

  for (const chapterFile of files.chapters) {
    try {
      // Read file using FileReader
      const text = await readFile(chapterFile);

      // Parse SNBT
      const parseResult = parseSNBT(text, { format: 'ftb' });

      if (!parseResult.success) {
        problems.push({
          severity: 'error',
          code: 'PARSE_ERROR',
          message: `Failed to parse chapter file "${chapterFile.name}": ${parseResult.error?.message || 'Unknown error'}`,
          snbtLocation: {
            file: chapterFile.name,
            line: parseResult.error?.line,
            column: parseResult.error?.column,
          },
        });
        continue;
      }

      // Validate parsed data is an object
      if (!parseResult.data || typeof parseResult.data !== 'object') {
        problems.push({
          severity: 'error',
          code: 'INVALID_CHAPTER_FORMAT',
          message: `Chapter file "${chapterFile.name}" does not contain a valid SNBT object`,
          snbtLocation: { file: chapterFile.name },
        });
        continue;
      }

      const chapterData = parseResult.data as Record<string, unknown>;

      // Extract chapter data
      if (Array.isArray(chapterData.chapters)) {
        parsedChapters.push(...chapterData.chapters);
      }

      // Extract quests
      if (Array.isArray(chapterData.quests)) {
        allQuests.push(...chapterData.quests);
      }
    } catch (error) {
      problems.push({
        severity: 'error',
        code: 'FILE_READ_ERROR',
        message: `Failed to read chapter file "${chapterFile.name}": ${error instanceof Error ? error.message : String(error)}`,
        snbtLocation: { file: chapterFile.name },
      });
      continue;
    }
  }

  // If all chapters failed to parse, return early
  if (parsedChapters.length === 0) {
    problems.push({
      severity: 'error',
      code: 'NO_VALID_CHAPTERS',
      message: 'No valid chapter data could be extracted from the provided files',
    });
    return { snapshot: null, problems };
  }

  // Parse lang file if provided
  let langData = undefined;
  if (files.langFile) {
    try {
      const langText = await readFile(files.langFile);
      langData = parseLangFile(langText);
    } catch (error) {
      problems.push({
        severity: 'warning',
        code: 'LANG_FILE_READ_ERROR',
        message: `Failed to read language file "${files.langFile.name}": ${error instanceof Error ? error.message : String(error)}`,
        snbtLocation: { file: files.langFile.name },
      });
      // Continue anyway - lang file is optional
    }
  }

  // Combine all parsed data into a single SNBT object
  const combinedData = {
    chapters: parsedChapters,
    quests: allQuests,
  };

  // Convert to snapshot
  const conversionResult = convertToSnapshot(combinedData, langData);

  // Collect conversion problems
  problems.push(...conversionResult.problems);

  return {
    snapshot: conversionResult.snapshot,
    problems,
  };
}

/**
 * Read a File object as text using FileReader API
 *
 * @param file File object to read
 * @returns Promise with file text content
 */
function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('FileReader returned non-string result'));
      }
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${reader.error?.message || 'Unknown error'}`));
    };

    reader.readAsText(file);
  });
}
