/**
 * FTB Quests SNBT format adapter
 * Handles non-standard SNBT syntax used by FTB Quests
 */

/**
 * Normalize FTB Quests SNBT format to standard SNBT
 * FTB Quests uses newline-delimited fields instead of comma-separated
 * @param text FTB Quests SNBT text
 */
export function normalizeFTBQuests(text: string): string {
  let result = '';
  let inString = false;
  let inEscape = false;
  let braceDepth = 0;
  let bracketDepth = 0;
  let lastNonWhitespace = '';
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = i + 1 < text.length ? text[i + 1] : '';

    // Handle escape sequences
    if (inString && inEscape) {
      result += char;
      inEscape = false;
      i++;
      continue;
    }

    if (inString && char === '\\') {
      result += char;
      inEscape = true;
      i++;
      continue;
    }

    // Track string state
    if (char === '"' && !inEscape) {
      inString = !inString;
      result += char;
      i++;
      continue;
    }

    // If we're in a string, just copy the character
    if (inString) {
      result += char;
      i++;
      continue;
    }

    // Track braces and brackets outside strings
    if (char === '{') {
      braceDepth++;
      result += char;
      lastNonWhitespace = char;
      i++;
      continue;
    }

    if (char === '}') {
      braceDepth--;
      result += char;
      lastNonWhitespace = char;
      i++;
      continue;
    }

    if (char === '[') {
      bracketDepth++;
      result += char;
      lastNonWhitespace = char;
      i++;
      continue;
    }

    if (char === ']') {
      bracketDepth--;
      result += char;
      lastNonWhitespace = char;
      i++;
      continue;
    }

    // Handle newlines that should become commas
    if (char === '\n' || char === '\r') {
      // Skip CRLF and LF combinations
      if (char === '\r' && nextChar === '\n') {
        i += 2;
      } else {
        i++;
      }

      // Only insert comma if we're inside an object (braceDepth > 0)
      // and the next non-whitespace character suggests we need one
      // Don't add comma right after opening braces or brackets
      if (braceDepth > 0 && lastNonWhitespace !== '{' && lastNonWhitespace !== '[') {
        // Look ahead to find next non-whitespace character
        let j = i;
        while (j < text.length && (text[j] === ' ' || text[j] === '\t' || text[j] === '\n' || text[j] === '\r')) {
          j++;
        }

        // Add comma if next char is a field name or another object (array of objects)
        // and current context isn't closing a structure
        if (j < text.length) {
          const nextNonWhitespace = text[j];
          // Field names start with letters or underscores
          // Also add comma before opening brace (new object in array)
          // But not before closing braces/brackets
          if ((/[a-zA-Z_]/.test(nextNonWhitespace) || nextNonWhitespace === '{') && nextNonWhitespace !== '}' && nextNonWhitespace !== ']') {
            result += ',';
          }
        }
      }

      continue;
    }

    // Copy regular characters
    result += char;

    // Track last non-whitespace character
    if (char !== ' ' && char !== '\t') {
      lastNonWhitespace = char;
    }

    i++;
  }

  return result;
}
