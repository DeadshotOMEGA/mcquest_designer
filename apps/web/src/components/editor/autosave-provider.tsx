'use client'

import React, { createContext, useContext } from 'react'
import { useAutosave, type UseAutosaveResult } from '@/lib/store/autosave'

/**
 * Context for autosave functionality
 * Provides retry function to child components
 */
const AutosaveContext = createContext<UseAutosaveResult | null>(null)

/**
 * Hook to access autosave context
 * @returns Autosave result with retry function
 */
export function useAutosaveContext(): UseAutosaveResult | null {
  return useContext(AutosaveContext)
}

/**
 * AutosaveProvider - Provider component that enables autosave functionality
 *
 * Wraps editor components and runs the useAutosave hook to automatically
 * save changes after a 2-second debounce delay.
 *
 * Usage:
 * ```tsx
 * <AutosaveProvider projectId={projectId}>
 *   <EditorCanvas />
 *   <SyncIndicator />
 * </AutosaveProvider>
 * ```
 *
 * The provider exposes the retry function via context so that
 * SyncIndicator can access useAutosaveContext() for retry functionality.
 */

interface AutosaveProviderProps {
  /**
   * The project ID to save changes to
   */
  projectId: string

  /**
   * Child components to render
   */
  children: React.ReactNode
}

export function AutosaveProvider({
  projectId,
  children,
}: AutosaveProviderProps): React.ReactElement {
  // Run autosave hook - this sets up the debounced save logic
  const autosaveResult = useAutosave(projectId)

  // Provide autosave context to children
  return (
    <AutosaveContext.Provider value={autosaveResult}>
      {children}
    </AutosaveContext.Provider>
  )
}
