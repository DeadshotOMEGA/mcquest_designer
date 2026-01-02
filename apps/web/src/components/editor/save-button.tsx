'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { useEditorStore, useSnapshot } from '@/lib/store/editor-store'
import { validateSnapshot } from '@mcquest/schema'
import { toast } from 'sonner'
import { Loader2, Check } from 'lucide-react'

/**
 * SaveButton Component
 *
 * Displays a save button that:
 * - Is disabled when no changes exist
 * - Shows loading state while saving
 * - Validates entire snapshot before saving
 * - Shows success/error toasts
 * - Clears dirty state on successful save
 * - Listens for Cmd+S / Ctrl+S keyboard shortcut
 */
export function SaveButton() {
  const [isSaving, setIsSaving] = React.useState(false)
  const snapshot = useSnapshot()
  const hasDirtyEntities = useEditorStore((state) => state.hasDirtyEntities)
  const clearDirtyEntities = useEditorStore((state) => state.clearDirtyEntities)
  const projectId = useEditorStore((state) => state.projectId)

  // Check if button should be enabled (has dirty entities)
  const isEnabled = hasDirtyEntities()

  /**
   * Perform the save operation:
   * 1. Validate snapshot
   * 2. POST to API
   * 3. Show success/error toast
   * 4. Clear dirty state on success
   */
  const handleSave = React.useCallback(async () => {
    if (!snapshot || !projectId) {
      toast.error('Unable to save: project not loaded')
      return
    }

    // Validate snapshot before saving
    const validationResult = validateSnapshot(snapshot)
    if (!validationResult.valid) {
      const errorCount = validationResult.errorCount
      const errorMessages = validationResult.problems
        .filter((problem) => problem.severity === 'error')
        .slice(0, 3)
        .map((problem) => problem.message)
        .join('; ')

      toast.error(`Cannot save: ${errorCount} validation error(s)`, {
        description: errorMessages,
      })
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage =
          errorData.error?.message || `Save failed with status ${response.status}`
        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Clear dirty state after successful save
      clearDirtyEntities()

      toast.success('Project saved successfully', {
        description: `Version: ${data.version?.id?.slice(0, 8) || 'unknown'}`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error('Failed to save project', {
        description: message,
      })
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }, [snapshot, projectId, clearDirtyEntities])

  // Keyboard shortcut handler for Cmd+S / Ctrl+S
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const isSaveShortcut = isMac ? e.metaKey && e.key === 's' : e.ctrlKey && e.key === 's'

      if (isSaveShortcut && isEnabled) {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEnabled, handleSave])

  return (
    <Button
      onClick={handleSave}
      disabled={!isEnabled || isSaving}
      size="sm"
      variant={isEnabled ? 'default' : 'ghost'}
      className="gap-2"
      title={isEnabled ? 'Save project (Cmd+S or Ctrl+S)' : 'No unsaved changes'}
    >
      {isSaving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="hidden sm:inline">Saving...</span>
        </>
      ) : isEnabled ? (
        <>
          <Check className="h-4 w-4" />
          <span className="hidden sm:inline">Save</span>
        </>
      ) : (
        <>
          <Check className="h-4 w-4 text-muted-foreground" />
          <span className="hidden sm:inline text-muted-foreground">Saved</span>
        </>
      )}
    </Button>
  )
}
