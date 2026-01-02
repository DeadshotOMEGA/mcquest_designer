/**
 * File validation utilities for import
 *
 * Validates ZIP file structure, size limits, and extracted file content.
 */

import type { ExtractedFile } from './zip-extractor'

export interface FileValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Maximum file size (in bytes)
 */
export const MAX_UPLOAD_SIZE = 200 * 1024 * 1024 // 200MB

/**
 * Maximum extracted total size (prevents zip bombs)
 */
export const MAX_EXTRACTED_SIZE = 500 * 1024 * 1024 // 500MB

/**
 * Validate uploaded file before processing
 *
 * @param file - Uploaded file from FormData
 * @returns Validation result
 */
export function validateUploadedFile(file: File): FileValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check file exists
  if (!file) {
    errors.push('No file provided')
    return { valid: false, errors, warnings }
  }

  // Check file type
  const validMimeTypes = ['application/zip', 'application/x-zip-compressed', 'application/octet-stream']
  if (!validMimeTypes.includes(file.type)) {
    // Don't fail on mime type since it can be unreliable
    // but warn the user
    warnings.push(`File type is ${file.type}, expected application/zip. Attempting to process anyway.`)
  }

  // Check file name
  if (!file.name.toLowerCase().endsWith('.zip')) {
    warnings.push(`File name is ${file.name}, expected .zip extension. Attempting to process anyway.`)
  }

  // Check file size
  if (file.size === 0) {
    errors.push('File is empty')
  } else if (file.size > MAX_UPLOAD_SIZE) {
    errors.push(
      `File is too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max ${(MAX_UPLOAD_SIZE / 1024 / 1024).toFixed(2)}MB)`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate extracted files from ZIP
 *
 * @param files - Extracted files
 * @returns Validation result
 */
export function validateExtractedFiles(files: ExtractedFile[]): FileValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check we have files
  if (files.length === 0) {
    errors.push('ZIP contains no files')
    return { valid: false, errors, warnings }
  }

  // Check file structure
  const paths = files.map((f) => f.path)
  const hasChapters = paths.some((p) => p.startsWith('chapters/'))
  const hasSnbtFiles = paths.some((p) => p.endsWith('.snbt'))

  if (!hasChapters) {
    errors.push('No chapter files found (expected chapters/ directory)')
  }

  if (!hasSnbtFiles) {
    errors.push('No .snbt files found in ZIP')
  }

  // Warn about missing optional files
  const hasLang = paths.some((p) => p.startsWith('lang/'))
  if (!hasLang) {
    warnings.push('No language files found (lang/). Using English only.')
  }

  const hasRewardTables = paths.some((p) => p.startsWith('reward_tables/'))
  if (!hasRewardTables) {
    warnings.push('No reward table files found. Import will only include inline rewards.')
  }

  // Check for suspicious paths
  for (const path of paths) {
    if (path.includes('..')) {
      errors.push(`Suspicious path detected: ${path}`)
    }
    if (path.startsWith('/')) {
      errors.push(`Invalid path format: ${path}`)
    }
  }

  // Check file names for invalid characters
  for (const path of paths) {
    // Only allow alphanumeric, _, -, /, and .
    if (!/^[a-zA-Z0-9/_.\-]+$/.test(path)) {
      errors.push(`Invalid characters in path: ${path}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate file content for empty or suspicious content
 *
 * @param file - Extracted file
 * @returns Validation result
 */
export function validateFileContent(file: ExtractedFile): FileValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for empty files
  if (file.content.length === 0) {
    warnings.push(`File is empty: ${file.path}`)
  }

  // Check for suspiciously large content
  if (file.size > MAX_EXTRACTED_SIZE) {
    errors.push(`File is too large: ${file.path} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
  }

  // Validate SNBT files have expected content
  if (file.path.endsWith('.snbt')) {
    if (!file.content.includes('{') || !file.content.includes('}')) {
      warnings.push(`File does not appear to be valid SNBT: ${file.path}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Comprehensive validation of all uploaded files
 *
 * @param uploadedFile - File from FormData
 * @param extractedFiles - Files extracted from ZIP
 * @returns Combined validation result
 */
export function validateImportFiles(
  uploadedFile: File,
  extractedFiles: ExtractedFile[]
): FileValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate uploaded file
  const uploadValidation = validateUploadedFile(uploadedFile)
  errors.push(...uploadValidation.errors)
  warnings.push(...uploadValidation.warnings)

  if (!uploadValidation.valid) {
    return { valid: false, errors, warnings }
  }

  // Validate extracted files
  const extractValidation = validateExtractedFiles(extractedFiles)
  errors.push(...extractValidation.errors)
  warnings.push(...extractValidation.warnings)

  if (!extractValidation.valid) {
    return { valid: false, errors, warnings }
  }

  // Validate individual files
  for (const file of extractedFiles) {
    const fileValidation = validateFileContent(file)
    errors.push(...fileValidation.errors)
    warnings.push(...fileValidation.warnings)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
