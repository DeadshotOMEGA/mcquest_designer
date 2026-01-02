'use client'

import * as React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useEditorStore, useSnapshot } from '@/lib/store/editor-store'
import { validateSnapshot } from '@mcquest/schema'
import { toast } from 'sonner'

interface UnsavedChangesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveAndLeave?: () => void
  onLeaveWithoutSaving?: () => void
}

/**
 * UnsavedChangesDialog Component
 *
 * Confirmation dialog triggered when user tries to navigate with unsaved changes.
 * Shows three actions:
 * - Save and Leave
 * - Leave Without Saving
 * - Cancel (stay on page)
 */
export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onSaveAndLeave,
  onLeaveWithoutSaving,
}: UnsavedChangesDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false)
  const snapshot = useSnapshot()
  const clearDirtyEntities = useEditorStore((state) => state.clearDirtyEntities)
  const projectId = useEditorStore((state) => state.projectId)

  /**
   * Handle "Save and Leave" action:
   * 1. Validate snapshot
   * 2. POST to API
   * 3. Call callback to proceed with navigation
   */
  const handleSaveAndLeave = React.useCallback(async () => {
    if (!snapshot || !projectId) {
      toast.error('Unable to save: project not loaded')
      return
    }

    // Validate snapshot before saving
    const validationResult = validateSnapshot(snapshot)
    if (!validationResult.valid) {
      toast.error(`Cannot save: ${validationResult.errorCount} validation error(s)`)
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
        throw new Error(errorData.error?.message || 'Save failed')
      }

      // Clear dirty state
      clearDirtyEntities()

      // Close dialog and proceed with navigation
      onOpenChange(false)
      onSaveAndLeave?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      toast.error('Failed to save', { description: message })
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }, [snapshot, projectId, clearDirtyEntities, onOpenChange, onSaveAndLeave])

  /**
   * Handle "Leave Without Saving" action:
   * Clear dirty state and proceed with navigation
   */
  const handleLeaveWithoutSaving = React.useCallback(() => {
    clearDirtyEntities()
    onOpenChange(false)
    onLeaveWithoutSaving?.()
  }, [clearDirtyEntities, onOpenChange, onLeaveWithoutSaving])

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Would you like to save them before leaving?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>

          <Button
            onClick={handleLeaveWithoutSaving}
            disabled={isSaving}
            variant="destructive"
            size="sm"
          >
            Leave Without Saving
          </Button>

          <AlertDialogAction onClick={handleSaveAndLeave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save and Leave'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
