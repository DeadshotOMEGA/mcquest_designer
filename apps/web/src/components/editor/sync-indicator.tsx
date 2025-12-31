'use client'

import React from 'react'
import { useSyncState } from '@/lib/store'
import { useAutosaveContext } from './autosave-provider'
import { cn } from '@/lib/utils'

/**
 * SyncIndicator - Displays the current autosave/sync status
 *
 * Shows different states:
 * - idle: No indicator (hidden)
 * - saving: "Saving..." with spinner
 * - saved: "Saved" with timestamp
 * - error: "Error" with message and retry button
 *
 * Acceptance criteria from #33 and #34:
 * - Shows sync indicator in UI
 * - Shows: 'Saving...', 'Saved', 'Error' states
 * - Timestamp of last save
 * - Error retry button (automatic from context)
 */

interface SyncIndicatorProps {
  className?: string
}

export function SyncIndicator({
  className,
}: SyncIndicatorProps): React.ReactElement | null {
  const syncState = useSyncState()
  const autosaveContext = useAutosaveContext()
  const onRetry = autosaveContext?.retry

  // Don't render anything when idle
  if (syncState.status === 'idle') {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm',
        syncState.status === 'error' && 'text-destructive',
        syncState.status === 'saving' && 'text-muted-foreground',
        syncState.status === 'saved' && 'text-muted-foreground',
        className
      )}
    >
      {syncState.status === 'saving' && (
        <>
          <SavingSpinner />
          <span>Saving...</span>
        </>
      )}

      {syncState.status === 'saved' && (
        <>
          <CheckIcon />
          <span>
            Saved
            {syncState.lastSavedAt && (
              <span className="ml-1">
                at {formatTime(syncState.lastSavedAt)}
              </span>
            )}
          </span>
        </>
      )}

      {syncState.status === 'error' && (
        <>
          <ErrorIcon />
          <span title={syncState.error}>
            Error saving
            {syncState.error && `: ${syncState.error}`}
          </span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="ml-2 rounded px-2 py-0.5 text-xs font-medium hover:bg-muted"
            >
              Retry
            </button>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Simple spinner for saving state
 */
function SavingSpinner(): React.ReactElement {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

/**
 * Check icon for saved state
 */
function CheckIcon(): React.ReactElement {
  return (
    <svg
      className="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/**
 * Error icon for error state
 */
function ErrorIcon(): React.ReactElement {
  return (
    <svg
      className="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/**
 * Format time as HH:MM:SS
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
