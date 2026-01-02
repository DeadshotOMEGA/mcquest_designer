/**
 * Recursively read directory structure client-side using File System Access API
 *
 * Handles the questbook directory structure:
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

/**
 * Result of reading a directory
 */
export interface DirectoryReadResult {
  /** Map of relative file paths to file contents */
  files: Map<string, string>
  /** Total files read */
  fileCount: number
  /** Total size of all files in bytes */
  totalSize: number
  /** Any warnings during reading (e.g., skipped files) */
  warnings: string[]
}

/**
 * Read all files from a directory recursively
 *
 * Requires File System Access API (Chrome/Edge 86+)
 * Client-side only - no server upload
 *
 * @param dirHandle - Directory handle from showDirectoryPicker
 * @param basePath - Optional base path for relative paths (e.g., 'config/ftbquests/quests')
 * @returns Map of relative paths to file contents
 * @throws If permission is denied or I/O error occurs
 */
export async function readDirectory(
  dirHandle: FileSystemDirectoryHandle,
  basePath: string = ''
): Promise<DirectoryReadResult> {
  const files = new Map<string, string>()
  const warnings: string[] = []
  let totalSize = 0

  /**
   * Recursively walk directory tree
   */
  async function walkDirectory(
    handle: FileSystemDirectoryHandle,
    currentPath: string
  ): Promise<void> {
    try {
      // Iterate all entries in the directory
      for await (const entry of (handle as unknown as { values(): AsyncIterableIterator<FileSystemHandle> }).values()) {
        const fsEntry = entry as FileSystemHandle & { kind: string; name: string; getFile?: () => Promise<File>}
        const entryPath = currentPath ? `${currentPath}/${fsEntry.name}` : fsEntry.name

        try {
          if (fsEntry.kind === 'file') {
            // Read file content
            const getFile = (entry as unknown as { getFile(): Promise<File> }).getFile
            const file = await getFile.call(entry)

            // Skip large files (over 10MB) to prevent memory issues
            if (file.size > 10 * 1024 * 1024) {
              warnings.push(`Skipped large file: ${entryPath} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
              continue
            }

            // Read file content as text
            const content = await file.text()
            files.set(entryPath, content)
            totalSize += file.size
          } else if (fsEntry.kind === 'directory') {
            // Recursively read subdirectory
            await walkDirectory(entry as FileSystemDirectoryHandle, entryPath)
          }
        } catch (error) {
          // Permission denied or read error for specific entry
          const errorMsg = error instanceof Error ? error.message : String(error)
          warnings.push(`Failed to read ${entryPath}: ${errorMsg}`)
        }
      }
    } catch (error) {
      // Permission denied for directory
      const errorMsg = error instanceof Error ? error.message : String(error)
      throw new Error(`Permission denied or error reading directory ${currentPath}: ${errorMsg}`)
    }
  }

  // Start walking from the selected directory
  await walkDirectory(dirHandle, basePath)

  return {
    files,
    fileCount: files.size,
    totalSize,
    warnings,
  }
}

/**
 * Validate that a directory contains questbook structure
 *
 * Checks for required files/folders:
 * - At least one .snbt file (chapter)
 * - Optionally data.snbt (global config)
 * - Optionally lang/en_us.snbt (language file)
 *
 * @param files - File map from readDirectory
 * @returns Validation result
 */
export function validateQuestbookStructure(files: Map<string, string>): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for at least one SNBT file
  const snbtFiles = Array.from(files.keys()).filter((path) => path.endsWith('.snbt'))
  if (snbtFiles.length === 0) {
    errors.push('No .snbt files found in the selected directory')
  }

  // Check for chapter files (should be in chapters/ or at root)
  const chapterFiles = snbtFiles.filter((path) => path.includes('chapters/') || !path.includes('/'))
  if (chapterFiles.length === 0) {
    warnings.push(
      'No chapter files found. Expected files in chapters/ directory or .snbt files at root'
    )
  }

  // Optional: check for data.snbt (global config)
  const hasDataFile = snbtFiles.some((path) => path === 'data.snbt')
  if (!hasDataFile) {
    warnings.push('No data.snbt found. Global config will be inferred from chapters.')
  }

  // Optional: check for lang file
  const hasLangFile = snbtFiles.some((path) => path.includes('lang/') && path.includes('.snbt'))
  if (!hasLangFile) {
    warnings.push('No language file found. Descriptions will use default language.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Transform directory structure to import-ready format
 *
 * Handles various directory layouts:
 * 1. Direct questbook: root contains chapters/, data.snbt, etc.
 * 2. Nested: config/ftbquests/quests/ contains chapters/, data.snbt, etc.
 * 3. Flat: all .snbt files at root
 *
 * @param files - File map from readDirectory
 * @returns Normalized files with questbook paths
 */
export function normalizeQuestbookPaths(files: Map<string, string>): Map<string, string> {
  const normalized = new Map<string, string>()

  // Check if files are already in questbook structure
  const hasQuestbookPath = Array.from(files.keys()).some(
    (path) =>
      path.includes('chapters/') ||
      path.includes('data.snbt') ||
      path.includes('lang/') ||
      path.includes('reward_tables/')
  )

  if (hasQuestbookPath) {
    // Already in correct structure
    return files
  }

  // Try to find nested structure (config/ftbquests/quests/)
  const questsPathMatch = Array.from(files.keys()).find(
    (path) =>
      path.includes('config/ftbquests/quests/') ||
      path.includes('ftbquests/quests/')
  )

  if (questsPathMatch) {
    // Extract base path
    const match = questsPathMatch.match(/(.*?)(ftbquests\/quests)\//);
    if (match) {
      const basePath = `${match[1]}${match[2]}/`
      // Remap paths by removing the base path
      for (const [path, content] of files) {
        if (path.startsWith(basePath)) {
          const relativePath = path.substring(basePath.length)
          normalized.set(relativePath, content)
        } else {
          normalized.set(path, content)
        }
      }
      return normalized
    }
  }

  // If all files are .snbt at root, assume they're chapters
  const allSnbt = Array.from(files.keys()).every((path) => path.endsWith('.snbt'))
  if (allSnbt && files.size > 0) {
    // Add chapters/ prefix to all files except data.snbt
    for (const [path, content] of files) {
      if (path === 'data.snbt') {
        normalized.set(path, content)
      } else {
        normalized.set(`chapters/${path}`, content)
      }
    }
    return normalized
  }

  // Couldn't determine structure, return as-is
  return files
}
