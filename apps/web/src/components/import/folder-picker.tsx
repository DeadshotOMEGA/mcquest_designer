'use client'

import * as React from 'react'
import { Folder, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFileSystemAccess } from '@/hooks/use-file-system-access'
import {
  readDirectory,
  validateQuestbookStructure,
  normalizeQuestbookPaths,
  type DirectoryReadResult,
} from '@/lib/upload/directory-reader'
import type { ImportFile } from '@mcquest/snbt'

export interface FolderPickerProps {
  /** Callback when folder is successfully read and validated */
  onFolderSelected: (files: ImportFile[]) => void
  /** Callback when error occurs during folder reading */
  onError?: (error: string) => void
  /** Whether component is disabled */
  disabled?: boolean
}

/**
 * File System Access API folder picker component
 *
 * Features:
 * - Native browser folder picker (Chrome/Edge)
 * - Graceful fallback message for unsupported browsers
 * - Recursive directory reading without ZIP
 * - Automatic validation of questbook structure
 * - Error handling with user-friendly messages
 * - Shows folder selection progress and results
 * - Accessible with proper ARIA labels
 *
 * @example
 * ```tsx
 * <FolderPicker
 *   onFolderSelected={(files) => {
 *     console.log(`Selected ${files.length} files`)
 *   }}
 *   onError={(error) => {
 *     console.error('Selection failed:', error)
 *   }}
 * />
 * ```
 */
export function FolderPicker({ onFolderSelected, onError, disabled = false }: FolderPickerProps) {
  const { showFolderPicker, unsupportedReason, pickDirectory } = useFileSystemAccess()
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedPath, setSelectedPath] = React.useState<string | null>(null)
  const [directoryInfo, setDirectoryInfo] = React.useState<DirectoryReadResult | null>(null)
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const [localError, setLocalError] = React.useState<string | null>(null)

  /**
   * Handle folder selection
   */
  const handlePickFolder = React.useCallback(async () => {
    setIsLoading(true)
    setLocalError(null)
    setValidationError(null)
    setDirectoryInfo(null)
    setSelectedPath(null)

    try {
      // Open system folder picker
      const dirHandle = await pickDirectory()
      if (!dirHandle) {
        // User cancelled
        setIsLoading(false)
        return
      }

      // Get the directory name for display
      setSelectedPath(dirHandle.name)

      // Read directory recursively
      const result = await readDirectory(dirHandle)

      // Show any warnings that occurred during reading
      if (result.warnings.length > 0) {
        console.warn('Directory read warnings:', result.warnings)
      }

      // Validate questbook structure
      const validation = validateQuestbookStructure(result.files)

      if (!validation.isValid) {
        const errorMsg = validation.errors.join('; ')
        setValidationError(errorMsg)
        onError?.(errorMsg)
        setIsLoading(false)
        return
      }

      // Show any structural warnings
      if (validation.warnings.length > 0) {
        console.warn('Questbook structure warnings:', validation.warnings)
      }

      // Normalize paths to questbook structure
      const normalizedFiles = normalizeQuestbookPaths(result.files)

      // Convert to ImportFile format
      const importFiles: ImportFile[] = Array.from(normalizedFiles.entries()).map(([path, content]) => ({
        path,
        content,
      }))

      setDirectoryInfo(result)

      // Call success callback
      onFolderSelected(importFiles)
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : String(error)

      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setLocalError('Permission denied. Please select a folder you have access to.')
      } else {
        setLocalError(`Failed to read folder: ${errorMsg}`)
      }

      onError?.(localError || errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [pickDirectory, onError, onFolderSelected])

  /**
   * Clear selection and reset state
   */
  const handleClear = React.useCallback(() => {
    setSelectedPath(null)
    setDirectoryInfo(null)
    setValidationError(null)
    setLocalError(null)
  }, [])

  // If not supported, show fallback message
  if (!showFolderPicker) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Folder Picker (Not Supported)</CardTitle>
          <CardDescription>
            File System Access API is not available in your browser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex items-start gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/5 p-4 text-sm text-yellow-700 dark:text-yellow-400"
            role="note"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <div className="space-y-2">
              <p className="font-medium">{unsupportedReason}</p>
              <p className="text-xs">Use the ZIP upload option instead, which works in all browsers.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Supported browser - show folder picker UI
  const displayError = validationError || localError
  const hasSelectedFolder = selectedPath !== null
  const isReadyToImport = hasSelectedFolder && !displayError && directoryInfo !== null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Folder Picker (Recommended)</CardTitle>
        <CardDescription>
          Select your questbook folder directly without compression (Chrome/Edge)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Button */}
        {!hasSelectedFolder ? (
          <Button
            onClick={handlePickFolder}
            disabled={isLoading || disabled}
            className="w-full"
            size="lg"
            aria-label="Choose folder containing questbook files"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Reading folder...
              </>
            ) : (
              <>
                <Folder className="mr-2 h-4 w-4" aria-hidden="true" />
                Choose Folder
              </>
            )}
          </Button>
        ) : null}

        {/* Selected Folder Info */}
        {hasSelectedFolder ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 rounded-lg border bg-card p-3 flex-1">
                <Folder className="h-5 w-5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={selectedPath || ''}>
                    {selectedPath}
                  </p>
                  {directoryInfo ? (
                    <p className="text-xs text-muted-foreground">
                      {directoryInfo.fileCount} files ({(directoryInfo.totalSize / 1024).toFixed(1)} KB)
                    </p>
                  ) : null}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={isLoading}
                aria-label="Clear folder selection"
              >
                Clear
              </Button>
            </div>

            {/* Error Display */}
            {displayError ? (
              <div
                className="flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>{displayError}</span>
              </div>
            ) : null}

            {/* Success Indicator */}
            {isReadyToImport ? (
              <div
                className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400"
                role="status"
                aria-live="polite"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Folder ready for import</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Supported Browsers Notice */}
        {!hasSelectedFolder && (
          <div
            className="flex items-start gap-2 rounded-lg border border-blue-500/50 bg-blue-500/5 p-3 text-sm text-blue-700 dark:text-blue-400"
            role="note"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <p>
              Supported in <strong>Chrome, Edge, Chromium</strong> browsers (version 86+)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
