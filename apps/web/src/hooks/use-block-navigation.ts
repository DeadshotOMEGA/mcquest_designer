'use client'

import * as React from 'react'

interface UseBlockNavigationOptions {
  /**
   * Callback when user confirms they want to leave
   */
  onLeave?: () => void

  /**
   * Callback when user confirms save and leave
   */
  onSaveAndLeave?: () => void
}

/**
 * useBlockNavigation Hook
 *
 * Provides navigation guards that warn users before leaving when unsaved changes exist.
 * Intercepts:
 * - Browser back/forward navigation (beforeunload)
 * - Next.js client-side navigation (router.push/replace)
 *
 * Usage:
 * ```ts
 * const { showDialog, hasDirtyChanges } = useBlockNavigation(
 *   shouldBlock,
 *   { onLeave: () => router.push('/') }
 * )
 * ```
 *
 * Call the returned functions in your unsaved changes dialog:
 * - showDialog(true) - trigger the dialog
 * - hasDirtyChanges() - check if navigation should be blocked
 */
export function useBlockNavigation(
  shouldBlock: boolean,
  options: UseBlockNavigationOptions = {}
) {
  const [showDialog, setShowDialog] = React.useState(false)
  const pendingNavigationRef = React.useRef<(() => void) | null>(null)

  /**
   * Handle browser navigation attempts (back/forward/close)
   */
  React.useEffect(() => {
    if (!shouldBlock) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
      return ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [shouldBlock])

  /**
   * Intercept Next.js client-side navigation
   * We can't directly intercept router.push, but we can prevent navigation
   * by managing state and requiring explicit user confirmation
   */
  const interceptNavigation = React.useCallback(
    (callback: () => void) => {
      if (shouldBlock) {
        pendingNavigationRef.current = callback
        setShowDialog(true)
      } else {
        callback()
      }
    },
    [shouldBlock]
  )

  /**
   * Proceed with pending navigation (user confirmed)
   */
  const proceedNavigation = React.useCallback(() => {
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current()
      pendingNavigationRef.current = null
    }
  }, [])

  /**
   * Cancel pending navigation (user chose to stay)
   */
  const cancelNavigation = React.useCallback(() => {
    pendingNavigationRef.current = null
    setShowDialog(false)
  }, [])

  /**
   * Handle "Save and Leave" from dialog
   */
  const handleSaveAndLeave = React.useCallback(() => {
    options.onSaveAndLeave?.()
    proceedNavigation()
  }, [options, proceedNavigation])

  /**
   * Handle "Leave Without Saving" from dialog
   */
  const handleLeaveWithoutSaving = React.useCallback(() => {
    options.onLeave?.()
    proceedNavigation()
  }, [options, proceedNavigation])

  return {
    showDialog,
    setShowDialog,
    interceptNavigation,
    cancelNavigation,
    handleSaveAndLeave,
    handleLeaveWithoutSaving,
    hasDirtyChanges: () => shouldBlock,
  }
}
