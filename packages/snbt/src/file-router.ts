/**
 * SNBT file routing - determines file type and purpose
 *
 * Routes files from questbook directory structure to appropriate parsers:
 * - data.snbt → global config
 * - chapters/*.snbt → chapter files
 * - lang/*.snbt → language files
 * - reward_tables/*.snbt → reward tables
 */

export interface RoutedFile {
  success: boolean;
  type?: 'global_config' | 'chapter' | 'lang' | 'reward_table';
  tableId?: string;
  reason?: string;
}

/**
 * Route a file based on its path
 *
 * Expected structure:
 * ```
 * config/ftbquests/quests/
 * ├── data.snbt
 * ├── chapters/chapter1.snbt
 * ├── lang/en_us.snbt
 * └── reward_tables/table1.snbt
 * ```
 *
 * Also supports compressed/nested paths:
 * - ftbquests/quests/data.snbt
 * - quests/data.snbt
 * - data.snbt
 *
 * @param path File path
 * @returns Routing result
 */
export function routeFile(path: string): RoutedFile {
  // Normalize path separators
  const normalized = path.replace(/\\/g, '/').toLowerCase();

  // Remove leading/trailing slashes and spaces
  const clean = normalized.trim().replace(/^\/+|\/+$/g, '');

  // Check for global config (data.snbt)
  if (
    clean === 'data.snbt' ||
    clean.endsWith('/data.snbt') ||
    clean.endsWith('/quests/data.snbt') ||
    clean.endsWith('/ftbquests/quests/data.snbt')
  ) {
    return {
      success: true,
      type: 'global_config',
    };
  }

  // Check for chapter files (chapters/*.snbt or */chapters/*.snbt)
  if ((clean.startsWith('chapters/') || clean.includes('/chapters/')) && clean.endsWith('.snbt')) {
    return {
      success: true,
      type: 'chapter',
    };
  }

  // Check for lang files (lang/*.snbt or */lang/*.snbt)
  if ((clean.startsWith('lang/') || clean.includes('/lang/')) && clean.endsWith('.snbt')) {
    const localeMatch = clean.match(/\/lang\/([a-z_]+)\.snbt$/) || clean.match(/^lang\/([a-z_]+)\.snbt$/);
    const locale = localeMatch ? localeMatch[1] : 'en_us';

    return {
      success: true,
      type: 'lang',
      tableId: locale,
    };
  }

  // Check for reward tables (reward_tables/*.snbt or */reward_tables/*.snbt)
  if ((clean.startsWith('reward_tables/') || clean.includes('/reward_tables/')) && clean.endsWith('.snbt')) {
    const tableMatch =
      clean.match(/\/reward_tables\/([^/]+)\.snbt$/) || clean.match(/^reward_tables\/([^/]+)\.snbt$/);
    const tableId = tableMatch ? tableMatch[1] : `table_${Math.random().toString(36).substring(7)}`;

    return {
      success: true,
      type: 'reward_table',
      tableId,
    };
  }

  // File doesn't match known patterns
  return {
    success: false,
    reason: `File path "${path}" does not match expected questbook structure (expected: chapters/*.snbt, lang/*.snbt, reward_tables/*.snbt, or data.snbt)`,
  };
}

/**
 * Check if a file is a chapter file
 */
export function isChapterFile(path: string): boolean {
  const route = routeFile(path);
  return route.success && route.type === 'chapter';
}

/**
 * Check if a file is a language file
 */
export function isLangFile(path: string): boolean {
  const route = routeFile(path);
  return route.success && route.type === 'lang';
}

/**
 * Check if a file is a reward table
 */
export function isRewardTableFile(path: string): boolean {
  const route = routeFile(path);
  return route.success && route.type === 'reward_table';
}

/**
 * Check if a file is the global config
 */
export function isGlobalConfigFile(path: string): boolean {
  const route = routeFile(path);
  return route.success && route.type === 'global_config';
}

/**
 * Extract locale from lang file path
 */
export function extractLocale(path: string): string {
  const match = path.toLowerCase().match(/\/lang\/([a-z_]+)\.snbt$/);
  return match ? match[1] : 'en_us';
}

/**
 * Extract chapter name from chapter file path
 */
export function extractChapterName(path: string): string {
  const match = path.match(/\/chapters\/([^/]+)\.snbt$/i);
  if (match) {
    return match[1];
  }

  // Fallback: use full filename
  const filename = path.split('/').pop() || 'chapter';
  return filename.replace(/\.snbt$/, '');
}

/**
 * Extract reward table name from reward table file path
 */
export function extractRewardTableName(path: string): string {
  const match = path.match(/\/reward_tables\/([^/]+)\.snbt$/i);
  if (match) {
    return match[1];
  }

  // Fallback: use full filename
  const filename = path.split('/').pop() || 'table';
  return filename.replace(/\.snbt$/, '');
}
