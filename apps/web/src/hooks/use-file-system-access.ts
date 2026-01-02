'use client'

import { useEffect, useState } from 'react'

/**
 * Feature detection and fallback logic for File System Access API
 *
 * Detects browser support for showDirectoryPicker and provides graceful
 * fallback information for unsupported browsers (Firefox, Safari, etc.)
 */
export interface UseFileSystemAccessReturn {
  /** Whether the browser supports File System Access API */
  isSupported: boolean
  /** Whether to show folder picker option */
  showFolderPicker: boolean
  /** Whether to show ZIP upload fallback */
  showZipUpload: boolean
  /** Human-readable message explaining why folder picker is unavailable */
  unsupportedReason: string | null
  /** Open the system directory picker */
  pickDirectory: () => Promise<FileSystemDirectoryHandle | null>
}

/**
 * Hook for File System Access API feature detection and directory picker
 *
 * Progressive enhancement approach:
 * - Chrome/Edge: Show folder picker (preferred)
 * - Firefox/Safari: Show ZIP upload only (fallback)
 * - Always show both options if supported + available
 *
 * @example
 * ```tsx
 * const { isSupported, pickDirectory, showFolderPicker } = useFileSystemAccess()
 *
 * if (!showFolderPicker) {
 *   return <p>{unsupportedReason}</p>
 * }
 * ```
 */
export function useFileSystemAccess(): UseFileSystemAccessReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [unsupportedReason, setUnsupportedReason] = useState<string | null>(null)

  // Feature detection on mount (client-side only)
  useEffect(() => {
    // Check if API is available
    const hasShowDirectoryPicker =
      typeof window !== 'undefined' && 'showDirectoryPicker' in (window as unknown as Record<string, unknown>)

    if (hasShowDirectoryPicker) {
      setIsSupported(true)
      setUnsupportedReason(null)
    } else {
      setIsSupported(false)

      // Detect browser for helpful message
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
      let reason = 'File System Access API is not supported in your browser'

      if (ua.includes('Firefox')) {
        reason = 'Firefox doesn\'t support File System Access API. Please use ZIP upload instead.'
      } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
        reason = 'Safari doesn\'t support File System Access API. Please use ZIP upload instead.'
      } else if (ua.includes('Edg') || ua.includes('Edge')) {
        reason = 'Update to the latest version of Edge to use folder picker.'
      } else if (ua.includes('Chrome')) {
        reason = 'Update to the latest version of Chrome to use folder picker.'
      }

      setUnsupportedReason(reason)
    }
  }, [])

  /**
   * Open the system directory picker and get directory handle
   *
   * @returns The selected directory handle, or null if picker was cancelled
   */
  const pickDirectory = async (): Promise<FileSystemDirectoryHandle | null> => {
    if (!isSupported) {
      console.warn('File System Access API is not supported')
      return null
    }

    try {
      return await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker()
    } catch (error) {
      // User cancelled the picker or permission denied
      if (error instanceof DOMException && error.name === 'AbortError') {
        // User cancelled - this is expected, not an error
        return null
      }
      // Other errors (permission denied, etc.) should be caught by caller
      throw error
    }
  }

  return {
    isSupported,
    // Show folder picker option if supported AND actually available
    showFolderPicker: isSupported,
    // Always show ZIP upload as fallback (works everywhere)
    showZipUpload: true,
    unsupportedReason,
    pickDirectory,
  }
}
