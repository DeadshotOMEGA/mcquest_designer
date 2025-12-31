'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from './editor-store'
import type { ProjectSnapshot } from '@mcquest/schema'

/**
 * Autosave debounce delay in milliseconds
 */
const AUTOSAVE_DEBOUNCE_MS = 2000

/**
 * Save snapshot to the API
 *
 * @param projectId - The project ID to save
 * @param snapshot - The snapshot data to save
 * @returns The updated project data on success
 * @throws Error on failure with message
 */
async function saveSnapshot(
  projectId: string,
  snapshot: ProjectSnapshot
): Promise<{ updatedAt: string }> {
  const response = await fetch(`/api/projects/${projectId}/snapshot`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ snapshot }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const message =
      errorData.error?.message || `Failed to save (${response.status})`
    throw new Error(message)
  }

  const data = await response.json()
  return { updatedAt: data.project.updatedAt }
}

/**
 * Result from useAutosave hook
 */
export interface UseAutosaveResult {
  /**
   * Manually trigger a save retry
   * Useful for retry after error
   */
  retry: () => void
}

/**
 * useAutosave - Hook for automatic debounced saving
 *
 * Watches the editor store for changes and automatically saves
 * after a 2-second debounce delay.
 *
 * Acceptance criteria from #33 and #34:
 * - Debounce delay: 2 seconds
 * - Calls PATCH /api/projects/[id]/snapshot with snapshot
 * - Updates syncStatus in store (saving, saved, error)
 * - Returns retry function for manual save trigger
 *
 * @param projectId - The project ID to save to
 * @returns Object with retry function
 */
export function useAutosave(projectId: string): UseAutosaveResult {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Get store actions and state
  const isDirty = useEditorStore((state) => state.isDirty)
  const snapshot = useEditorStore((state) => state.snapshot)
  const setSyncState = useEditorStore((state) => state.setSyncState)
  const markClean = useEditorStore((state) => state.markClean)

  /**
   * Perform the actual save operation
   */
  const performSave = useCallback(async () => {
    if (!snapshot) {
      return
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    // Set status to saving
    setSyncState({ status: 'saving', error: undefined })

    try {
      const result = await saveSnapshot(projectId, snapshot)

      // On success: mark clean and update status
      markClean()
      setSyncState({
        status: 'saved',
        lastSavedAt: new Date(result.updatedAt),
        error: undefined,
      })
    } catch (error) {
      // Only handle error if not aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      const message =
        error instanceof Error ? error.message : 'Unknown error occurred'

      setSyncState({
        status: 'error',
        error: message,
      })
    }
  }, [projectId, snapshot, setSyncState, markClean])

  /**
   * Watch for dirty state changes and trigger debounced save
   */
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    // Only schedule save if dirty and we have data
    if (isDirty && snapshot) {
      debounceTimerRef.current = setTimeout(() => {
        void performSave()
      }, AUTOSAVE_DEBOUNCE_MS)
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [isDirty, snapshot, performSave])

  /**
   * Cleanup abort controller on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  /**
   * Manual retry function for error recovery
   */
  const retry = useCallback(() => {
    void performSave()
  }, [performSave])

  return { retry }
}
