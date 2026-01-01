/**
 * SNBT parser - wraps snbt-js library for FTB Quests format
 */

import { parse } from 'snbt-js';
import { normalizeFTBQuests } from './ftb-adapter.js';

export interface ParseOptions {
  /** Format mode - 'ftb' applies FTB Quests normalization */
  format?: 'ftb' | 'standard';
}

export interface ParseResult {
  success: boolean;
  data: unknown;
  error?: {
    message: string;
    line?: number;
    column?: number;
  };
}

/**
 * Parse SNBT text into JavaScript object
 * @param text SNBT text to parse
 * @param options Parse options
 */
export function parseSNBT(text: string, options: ParseOptions = {}): ParseResult {
  try {
    // Normalize FTB Quests format if requested
    let snbtText = text;
    if (options.format === 'ftb') {
      snbtText = normalizeFTBQuests(text);
    }

    // Parse using snbt-js library
    const data = parse(snbtText);

    return {
      success: true,
      data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Try to extract line/column info if available
    let line: number | undefined;
    let column: number | undefined;

    // Parse common error message formats
    const lineMatch = message.match(/line\s*:?\s*(\d+)/i);
    const colMatch = message.match(/column\s*:?\s*(\d+)/i);

    if (lineMatch) {
      line = parseInt(lineMatch[1], 10);
    }
    if (colMatch) {
      column = parseInt(colMatch[1], 10);
    }

    return {
      success: false,
      data: null,
      error: {
        message,
        line,
        column,
      },
    };
  }
}
