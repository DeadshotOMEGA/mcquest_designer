'use client'

import * as React from 'react'
import { Upload, X, File, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * Categorized SNBT files for import
 */
export interface SnbtFiles {
  /** Chapter SNBT files */
  chapters: File[]
  /** Language file (en_us.snbt or similar) */
  langFile?: File
}

export interface FileUploadProps {
  /** Callback when files are selected and categorized */
  onFilesSelected: (files: SnbtFiles) => void
  /** Whether the component is in a loading state */
  isLoading?: boolean
  /** Error message to display */
  error?: string
}

/**
 * File metadata for display
 */
interface FileItem {
  file: File
  type: 'chapter' | 'lang'
}

/**
 * Categorize SNBT files into chapter files and language files
 */
function categorizeFiles(files: File[]): SnbtFiles {
  const chapters: File[] = []
  let langFile: File | undefined

  for (const file of files) {
    // Check if this is a language file
    const fileName = file.name.toLowerCase()
    const isLangFile =
      fileName === 'en_us.snbt' ||
      fileName.includes('lang/') ||
      fileName.startsWith('lang_')

    if (isLangFile && !langFile) {
      // Only accept the first lang file
      langFile = file
    } else {
      chapters.push(file)
    }
  }

  return { chapters, langFile }
}

/**
 * Validate that a file has .snbt extension
 */
function validateSnbtFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.snbt')
}

/**
 * File upload component with drag-and-drop support for SNBT import.
 *
 * Features:
 * - Drag-and-drop zone with visual feedback
 * - Click to open file picker
 * - Multi-file selection
 * - File type validation (.snbt extension)
 * - Automatic categorization of chapter vs language files
 * - File preview with removal capability
 * - Loading and error states
 * - Full keyboard accessibility
 *
 * @example
 * ```tsx
 * <FileUpload
 *   onFilesSelected={(files) => {
 *     console.log('Chapters:', files.chapters)
 *     console.log('Lang:', files.langFile)
 *   }}
 *   isLoading={false}
 *   error={errorMessage}
 * />
 * ```
 */
export function FileUpload({ onFilesSelected, isLoading = false, error }: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [selectedFiles, setSelectedFiles] = React.useState<FileItem[]>([])
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const dropZoneRef = React.useRef<HTMLDivElement>(null)

  /**
   * Process selected files and categorize them
   */
  const processFiles = React.useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)

    // Validate all files are .snbt
    const invalidFiles = fileArray.filter(f => !validateSnbtFile(f))
    if (invalidFiles.length > 0) {
      setValidationError(
        `Invalid file type: ${invalidFiles.map(f => f.name).join(', ')}. Only .snbt files are allowed.`
      )
      return
    }

    setValidationError(null)

    // Categorize files
    const categorized = categorizeFiles(fileArray)

    // Create file items for display
    const items: FileItem[] = [
      ...categorized.chapters.map(file => ({ file, type: 'chapter' as const })),
      ...(categorized.langFile ? [{ file: categorized.langFile, type: 'lang' as const }] : []),
    ]

    setSelectedFiles(items)
    onFilesSelected(categorized)
  }, [onFilesSelected])

  /**
   * Handle file input change
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files)
  }

  /**
   * Handle drag enter
   */
  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }

  /**
   * Handle drag over
   */
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
  }

  /**
   * Handle drag leave
   */
  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    // Only set dragging to false if we're leaving the drop zone itself
    if (event.currentTarget === dropZoneRef.current) {
      setIsDragging(false)
    }
  }

  /**
   * Handle drop
   */
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)

    const { files } = event.dataTransfer
    processFiles(files)
  }

  /**
   * Handle click on drop zone to open file picker
   */
  const handleClick = () => {
    if (!isLoading) {
      fileInputRef.current?.click()
    }
  }

  /**
   * Handle keyboard activation (Enter/Space)
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleClick()
    }
  }

  /**
   * Remove a specific file
   */
  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)

    // Recategorize and notify
    const files = newFiles.map(item => item.file)
    const categorized = categorizeFiles(files)
    onFilesSelected(categorized)
  }

  /**
   * Clear all files
   */
  const clearAll = () => {
    setSelectedFiles([])
    setValidationError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onFilesSelected({ chapters: [] })
  }

  const displayError = validationError || error
  const hasFiles = selectedFiles.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload SNBT Files</CardTitle>
        <CardDescription>
          Select or drag and drop .snbt chapter files and optionally a language file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          ref={dropZoneRef}
          role="button"
          tabIndex={isLoading ? -1 : 0}
          aria-label="File upload drop zone. Click or press Enter to select files, or drag and drop files here."
          aria-disabled={isLoading}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
            isDragging && !isLoading && 'border-primary bg-primary/5',
            !isDragging && !isLoading && 'border-muted-foreground/25 hover:border-muted-foreground/50',
            isLoading && 'cursor-not-allowed opacity-50',
            !isLoading && 'cursor-pointer'
          )}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
        >
          <Upload
            className={cn(
              'mb-4 h-10 w-10 transition-colors',
              isDragging ? 'text-primary' : 'text-muted-foreground'
            )}
            aria-hidden="true"
          />
          <p className="mb-2 text-sm font-medium">
            {isDragging ? 'Drop files here' : 'Choose files or drag and drop'}
          </p>
          <p className="text-xs text-muted-foreground">
            .snbt files only
          </p>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".snbt"
            className="sr-only"
            onChange={handleFileChange}
            disabled={isLoading}
            aria-label="File input"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div
            className="flex items-center justify-center gap-2 rounded-lg bg-muted p-4 text-sm"
            role="status"
            aria-live="polite"
          >
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
            <span>Processing files...</span>
          </div>
        )}

        {/* Error Display */}
        {displayError && (
          <div
            className="flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{displayError}</span>
          </div>
        )}

        {/* File List */}
        {hasFiles && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                Selected Files ({selectedFiles.length})
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={isLoading}
                aria-label="Clear all files"
              >
                Clear all
              </Button>
            </div>

            <ul className="space-y-2" role="list" aria-label="Selected files">
              {selectedFiles.map((item, index) => (
                <li
                  key={`${item.file.name}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <File className="h-5 w-5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={item.file.name}>
                        {item.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(item.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Badge
                      variant={item.type === 'lang' ? 'secondary' : 'outline'}
                      className="flex-shrink-0"
                    >
                      {item.type === 'lang' ? 'Language' : 'Chapter'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    disabled={isLoading}
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>

            {/* Success Indicator */}
            {!displayError && !isLoading && (
              <div
                className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400"
                role="status"
                aria-live="polite"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Files ready for import</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
