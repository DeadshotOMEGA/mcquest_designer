/**
 * SNBT parser - wraps snbt-js library for FTB Quests format
 */

import { parseNbtString } from 'snbt-js';
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
 * Flatten snbt-js output structure to plain JavaScript object
 * snbt-js returns { childs: { key: { value: ... } } }
 * We need { key: value }
 */
function flattenNbtData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle objects with childs (NBT compound tags or list tags)
  if (typeof data === 'object' && data !== null && 'childs' in data) {
    const obj = data as { childs: unknown };

    // If childs is an array, it's an NBT list tag
    if (Array.isArray(obj.childs)) {
      return obj.childs.map(flattenNbtData);
    }

    // Otherwise it's an NBT compound tag (object)
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj.childs as Record<string, unknown>)) {
      result[key] = flattenNbtData(value);
    }
    return result;
  }

  // Handle primitive value wrappers (NBT primitive tags)
  // These have a 'value' property and may have helper properties like 'text'
  if (typeof data === 'object' && data !== null && 'value' in data && !('childs' in data)) {
    const obj = data as Record<string, unknown>;
    return flattenNbtData(obj.value);
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(flattenNbtData);
  }

  // Handle regular objects (recursively flatten)
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = flattenNbtData(value);
    }
    return result;
  }

  // Return primitives as-is
  return data;
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
    const rawData = parseNbtString(snbtText);

    // Flatten the snbt-js structure to plain JavaScript object
    const data = flattenNbtData(rawData);

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
