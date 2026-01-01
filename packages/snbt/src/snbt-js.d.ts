/**
 * Type definitions for snbt-js library
 */

declare module 'snbt-js' {
  /**
   * Parse SNBT (Stringified NBT) text into a JavaScript object
   * @param text SNBT text to parse
   * @returns Parsed object
   * @throws {Error} if parsing fails
   */
  export function parseNbtString(text: string): unknown;

  /**
   * Stringify a JavaScript object to SNBT format (if available)
   * @param obj Object to stringify
   * @returns SNBT string
   */
  export function changeObj(obj: unknown): string;
}
