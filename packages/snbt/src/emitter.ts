/**
 * SNBT emitter - converts JavaScript objects to SNBT text
 */

export interface EmitOptions {
  /** Format mode - 'ftb' uses FTB Quests formatting (newline-delimited) */
  format?: 'ftb' | 'standard';
  /** Indent size (spaces) */
  indent?: number;
}

/**
 * Emit JavaScript object as SNBT text
 * @param data Object to serialize
 * @param options Emit options
 */
export function emitSNBT(data: unknown, options: EmitOptions = {}): string {
  const format = options.format ?? 'ftb';
  const indentStr = '\t'; // FTB Quests uses tabs

  return emitValue(data, format, 0, indentStr);
}

/**
 * Recursively emit a value
 */
function emitValue(
  value: unknown,
  format: 'ftb' | 'standard',
  depth: number,
  indentStr: string
): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return 'null';
  }

  // Handle booleans
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  // Handle numbers
  if (typeof value === 'number') {
    return formatNumber(value);
  }

  // Handle strings
  if (typeof value === 'string') {
    return escapeString(value);
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return emitArray(value, format, depth, indentStr);
  }

  // Handle objects
  if (typeof value === 'object' && value.constructor === Object) {
    return emitObject(value as Record<string, unknown>, format, depth, indentStr);
  }

  // Fallback for unknown types
  return String(value);
}

/**
 * Format a number with appropriate SNBT type suffix
 */
function formatNumber(num: number): string {
  // Detect integer vs float
  if (Number.isInteger(num)) {
    return String(num);
  }

  // Format float with sufficient precision and 'd' suffix for FTB Quests
  // Use toPrecision for very small/large numbers, toFixed for normal range
  let str: string;
  const absNum = Math.abs(num);

  if (absNum < 0.0001 || absNum > 1e6) {
    // For very small or very large numbers, use toPrecision to avoid scientific notation
    // Then manually format to decimal notation
    str = num.toExponential(10);
    const parsed = parseFloat(str);
    // Convert to fixed notation with enough decimal places
    const decimalPlaces = Math.max(1, 15 - Math.floor(Math.log10(absNum)));
    str = parsed.toFixed(Math.min(decimalPlaces, 15));
  } else {
    // For normal range numbers, use toFixed with appropriate precision
    const decimalPlaces = countDecimalPlaces(num);
    str = num.toFixed(Math.max(1, decimalPlaces));
  }

  // Remove trailing zeros after decimal point, but keep at least one
  str = str.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '.0');

  return str + 'd';
}

/**
 * Count decimal places in a number
 */
function countDecimalPlaces(num: number): number {
  const str = num.toString();
  if (str.includes('e')) {
    // Scientific notation - extract exponent
    const [, exp] = str.split('e');
    return Math.abs(parseInt(exp, 10));
  }
  const decimalIndex = str.indexOf('.');
  if (decimalIndex === -1) return 0;
  return str.length - decimalIndex - 1;
}

/**
 * Escape a string for SNBT format
 */
function escapeString(str: string): string {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    switch (char) {
      case '"':
        result += '\\"';
        break;
      case '\\':
        result += '\\\\';
        break;
      case '\n':
        result += '\\n';
        break;
      case '\r':
        result += '\\r';
        break;
      case '\t':
        result += '\\t';
        break;
      default:
        result += char;
    }
  }
  return `"${result}"`;
}

/**
 * Emit an array
 */
function emitArray(
  arr: unknown[],
  format: 'ftb' | 'standard',
  depth: number,
  indentStr: string
): string {
  if (arr.length === 0) {
    return '[]';
  }

  const nextDepth = depth + 1;
  const currentIndent = indentStr.repeat(nextDepth);
  const closeIndent = indentStr.repeat(depth);

  if (format === 'ftb') {
    // FTB format: elements on separate lines, no commas
    const elements = arr
      .map(item => currentIndent + emitValue(item, format, nextDepth, indentStr))
      .join('\n');

    return `[\n${elements}\n${closeIndent}]`;
  } else {
    // Standard format: comma-separated
    const elements = arr
      .map(item => emitValue(item, format, nextDepth, indentStr))
      .join(', ');

    return `[${elements}]`;
  }
}

/**
 * Emit an object (compound)
 */
function emitObject(
  obj: Record<string, unknown>,
  format: 'ftb' | 'standard',
  depth: number,
  indentStr: string
): string {
  const keys = Object.keys(obj);

  if (keys.length === 0) {
    return '{}';
  }

  const nextDepth = depth + 1;
  const currentIndent = indentStr.repeat(nextDepth);
  const closeIndent = indentStr.repeat(depth);

  // Sort keys for deterministic output
  const sortedKeys = keys.sort();

  if (format === 'ftb') {
    // FTB format: fields on separate lines, no commas between fields
    const fields = sortedKeys
      .map(key => {
        const value = obj[key];
        const valueStr = emitValue(value, format, nextDepth, indentStr);
        return `${currentIndent}${key}: ${valueStr}`;
      })
      .join('\n');

    return `{\n${fields}\n${closeIndent}}`;
  } else {
    // Standard format: comma-separated
    const fields = sortedKeys
      .map(key => {
        const value = obj[key];
        const valueStr = emitValue(value, format, nextDepth, indentStr);
        return `${key}: ${valueStr}`;
      })
      .join(', ');

    return `{${fields}}`;
  }
}
