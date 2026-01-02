/**
 * ZIP file extraction utilities
 *
 * Extracts ZIP files in-memory to a flat file map for import processing.
 * Uses JSZip to handle ZIP extraction without disk writes.
 */

import JSZip from 'jszip'

export interface ExtractedFile {
  path: string
  content: string
  size: number
}

export interface ExtractionResult {
  success: boolean
  files: ExtractedFile[]
  totalSize: number
  errors: string[]
}

/**
 * Extract ZIP file from ArrayBuffer to in-memory file map
 *
 * @param zipData - ZIP file data as ArrayBuffer
 * @param maxFileSize - Max size per file (default: 50MB)
 * @param maxTotalSize - Max total extracted size (default: 500MB)
 * @returns Extracted files and metadata
 *
 * @throws Error if ZIP is malformed or extraction fails
 */
export async function extractZip(
  zipData: ArrayBuffer,
  maxFileSize: number = 50 * 1024 * 1024, // 50MB per file
  maxTotalSize: number = 500 * 1024 * 1024 // 500MB total
): Promise<ExtractionResult> {
  const errors: string[] = []
  const files: ExtractedFile[] = []
  let totalSize = 0

  try {
    const zip = await JSZip.loadAsync(zipData)

    // Extract all non-directory files
    for (const [path, fileEntry] of Object.entries(zip.files)) {
      // Type assertion for JSZip file entry
      const file = fileEntry as { dir: boolean; async: (type: string) => Promise<string> }

      // Skip directories and hidden files
      if (file.dir || path.startsWith('.')) {
        continue
      }

      try {
        const content = await file.async('string')
        const size = content.length

        // Validate file size
        if (size > maxFileSize) {
          errors.push(
            `File too large: ${path} (${(size / 1024 / 1024).toFixed(2)}MB, max ${(maxFileSize / 1024 / 1024).toFixed(2)}MB)`
          )
          continue
        }

        // Check total size doesn't exceed limit
        if (totalSize + size > maxTotalSize) {
          errors.push(`Total extracted size exceeds limit of ${(maxTotalSize / 1024 / 1024).toFixed(2)}MB`)
          break
        }

        // Normalize path (remove leading config/ftbquests/quests/ if present)
        const normalizedPath = normalizePath(path)

        files.push({
          path: normalizedPath,
          content,
          size,
        })

        totalSize += size
      } catch (fileError) {
        errors.push(`Failed to extract ${path}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`)
      }
    }

    return {
      success: errors.length === 0,
      files,
      totalSize,
      errors,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract ZIP: ${error.message}`)
    }
    throw new Error('Failed to extract ZIP: Unknown error')
  }
}

/**
 * Normalize ZIP paths to relative questbook structure
 *
 * Handles common patterns:
 * - config/ftbquests/quests/chapters/... → chapters/...
 * - chapters/... → chapters/... (pass-through)
 *
 * @param path - Original path from ZIP
 * @returns Normalized path
 */
function normalizePath(path: string): string {
  // Remove leading/trailing slashes
  let normalized = path.replace(/^\/+|\/+$/g, '')

  // Remove common prefix paths
  const prefixes = [
    'config/ftbquests/quests/',
    'config/ftbquests/quests', // Without trailing slash
  ]

  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.slice(prefix.length)
      break
    }
  }

  // Remove any remaining leading slashes after prefix removal
  normalized = normalized.replace(/^\/+/, '')

  return normalized
}

/**
 * Validate extracted files contain required questbook structure
 *
 * @param files - Extracted files
 * @returns Validation result
 */
export function validateZipStructure(files: ExtractedFile[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const paths = new Set(files.map((f) => f.path))

  // Check for suspicious paths (path traversal attempts)
  for (const file of files) {
    if (file.path.includes('..') || file.path.startsWith('/')) {
      errors.push(`Suspicious path detected: ${file.path}`)
    }
  }

  // Check for required directories or at least some SNBT files
  const hasChapters = Array.from(paths).some((p) => p.startsWith('chapters/') && p.endsWith('.snbt'))
  const hasLang = Array.from(paths).some((p) => p.startsWith('lang/') && p.endsWith('.snbt'))
  const hasData = Array.from(paths).some((p) => p === 'data.snbt')

  // Allow import with just chapters, or chapters + lang, or all three
  if (!hasChapters) {
    errors.push('No chapter files found (expected chapters/*.snbt)')
  }

  // Warn if missing optional files but don't fail
  const warnings: string[] = []
  if (!hasLang) {
    warnings.push('No language files found (will use default English)')
  }
  if (!hasData) {
    warnings.push('No data.snbt found (using default project configuration)')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get file extension
 *
 * @param path - File path
 * @returns File extension (lowercase, with dot)
 */
export function getFileExtension(path: string): string {
  const lastDot = path.lastIndexOf('.')
  if (lastDot === -1) return ''
  return path.slice(lastDot).toLowerCase()
}

/**
 * Validate that all extracted files have allowed extensions
 *
 * @param files - Extracted files
 * @param allowedExtensions - Allowed file extensions (default: ['.snbt'])
 * @returns Validation result
 */
export function validateFileExtensions(
  files: ExtractedFile[],
  allowedExtensions: string[] = ['.snbt']
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const file of files) {
    const ext = getFileExtension(file.path)
    if (ext && !allowedExtensions.includes(ext)) {
      errors.push(`Invalid file type: ${file.path} (${ext}). Only ${allowedExtensions.join(', ')} files are allowed`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
