'use client'

import * as React from 'react'
import { FolderPicker, type FolderPickerProps } from './folder-picker'
import { FileUpload, type FileUploadProps, type SnbtFiles } from './file-upload'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ImportFile } from '@mcquest/snbt'

export interface UploadZoneProps {
  /** Callback when files are selected (from either folder or ZIP) */
  onFilesSelected: (files: ImportFile[]) => void
  /** Callback for folder picker errors */
  onFolderError?: (error: string) => void
  /** Optional error message to display */
  error?: string
  /** Whether the component is in a loading state */
  isLoading?: boolean
}

/**
 * UploadZone Component
 *
 * Combined upload interface supporting both:
 * 1. Folder Picker (Chrome/Edge) - native directory selection
 * 2. ZIP Upload (all browsers) - drag-and-drop SNBT ZIP files
 *
 * Features:
 * - Tabbed interface for browser-dependent methods
 * - Automatic fallback from folder picker to ZIP for unsupported browsers
 * - File validation and categorization
 * - Progress and error handling
 * - Accessible keyboard navigation
 *
 * @example
 * ```tsx
 * <UploadZone
 *   onFilesSelected={(files) => {
 *     console.log(`Selected ${files.length} files`)
 *     handleImport(files)
 *   }}
 *   isLoading={isProcessing}
 *   error={errorMessage}
 * />
 * ```
 */
export function UploadZone({ onFilesSelected, onFolderError, error, isLoading = false }: UploadZoneProps) {
  /**
   * Handle folder selection from FolderPicker
   * Convert ImportFile[] directly (already in the correct format)
   */
  const handleFolderSelected: FolderPickerProps['onFolderSelected'] = React.useCallback(
    (files) => {
      onFilesSelected(files)
    },
    [onFilesSelected]
  )

  /**
   * Helper function to read file as text
   */
  const readFileAsText = React.useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (typeof result === 'string') {
          resolve(result)
        } else {
          reject(new Error('Failed to read file'))
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    })
  }, [])

  /**
   * Handle ZIP upload from FileUpload
   * Convert SnbtFiles (chapters + optional lang file) to ImportFile[]
   */
  const handleFilesSelected: FileUploadProps['onFilesSelected'] = React.useCallback(
    async (snbtFiles: SnbtFiles) => {
      const importFiles: ImportFile[] = []

      try {
        // Add chapter files
        for (const chapterFile of snbtFiles.chapters) {
          const path = `chapters/${chapterFile.name}`
          const content = await readFileAsText(chapterFile)
          importFiles.push({ path, content })
        }

        // Add language file if present
        if (snbtFiles.langFile) {
          const langPath = `lang/${snbtFiles.langFile.name}`
          const content = await readFileAsText(snbtFiles.langFile)
          importFiles.push({ path: langPath, content })
        }

        onFilesSelected(importFiles)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to read files'
        onFolderError?.(message)
      }
    },
    [readFileAsText, onFilesSelected, onFolderError]
  )

  return (
    <div className="space-y-4">
      <Tabs defaultValue="folder" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="folder">Folder Picker</TabsTrigger>
          <TabsTrigger value="zip">ZIP Upload</TabsTrigger>
        </TabsList>

        {/* Folder Picker Tab */}
        <TabsContent value="folder" className="mt-4 space-y-4">
          <FolderPicker onFolderSelected={handleFolderSelected} onError={onFolderError} disabled={isLoading} />
        </TabsContent>

        {/* ZIP Upload Tab */}
        <TabsContent value="zip" className="mt-4 space-y-4">
          <FileUpload onFilesSelected={handleFilesSelected} isLoading={isLoading} error={error} />
        </TabsContent>
      </Tabs>

      {/* General error display (applies to both tabs) */}
      {error && (
        <div
          className="flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
          aria-live="assertive"
        >
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
