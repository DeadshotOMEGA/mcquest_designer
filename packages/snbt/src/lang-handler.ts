/**
 * FTB Quests lang file (en_us.snbt) parser
 */

import { parseSNBT } from './parser.js';

export interface LangData {
  /** Map of quest ID to title */
  titles: Map<string, string>;
  /** Map of quest ID to description */
  descriptions: Map<string, string>;
}

/**
 * Parse FTB Quests lang file (en_us.snbt)
 * @param text SNBT lang file text
 */
export function parseLangFile(text: string): LangData {
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();

  // Parse the SNBT file
  const result = parseSNBT(text, { format: 'ftb' });

  if (!result.success || !result.data || typeof result.data !== 'object') {
    // Return empty maps if parsing fails
    return { titles, descriptions };
  }

  const data = result.data as Record<string, unknown>;

  // Iterate through all entries in the lang file
  for (const key in data) {
    const value = data[key];

    // Parse the key format: "quest.{ID}.title" or "quest.{ID}.quest_desc"
    // Also handle: "chapter.{ID}.title"
    const matches = key.match(/^(quest|chapter)\.([\w]{16})\.(\w+)$/);

    if (!matches) {
      continue;
    }

    const [, entityType, id, fieldType] = matches;

    if (entityType === 'quest') {
      if (fieldType === 'title') {
        // Handle title which may be a string or an array of strings/objects
        const titleValue = extractStringValue(value);
        if (titleValue) {
          titles.set(id, titleValue);
        }
      } else if (fieldType === 'quest_desc') {
        // Handle description which is typically an array of strings
        const descValue = extractDescription(value);
        if (descValue) {
          descriptions.set(id, descValue);
        }
      }
    } else if (entityType === 'chapter') {
      if (fieldType === 'title') {
        const titleValue = extractStringValue(value);
        if (titleValue) {
          titles.set(id, titleValue);
        }
      }
    }
  }

  return { titles, descriptions };
}

/**
 * Extract string value from various formats
 * Handles: string, array of strings, or object with text property
 */
function extractStringValue(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    const firstItem = value[0];

    if (typeof firstItem === 'string') {
      return firstItem;
    }

    if (typeof firstItem === 'object' && firstItem !== null) {
      const obj = firstItem as Record<string, unknown>;
      if (typeof obj.text === 'string') {
        return obj.text;
      }
    }
  }

  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    if (typeof obj.text === 'string') {
      return obj.text;
    }
  }

  return null;
}

/**
 * Extract description from array of strings (quest_desc format)
 */
function extractDescription(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const lines: string[] = [];

  for (const item of value) {
    if (typeof item === 'string') {
      if (item.trim() !== '') {
        lines.push(item);
      }
    }
  }

  if (lines.length === 0) {
    return null;
  }

  return lines.join('\n');
}
