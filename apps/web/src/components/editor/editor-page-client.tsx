'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EditorCanvas } from './editor-canvas'
import { AutosaveProvider } from './autosave-provider'
import { SyncIndicator } from './sync-indicator'
import { ChapterPanel } from './panels/chapter-panel'
import { QuestInspector } from './panels/inspector/quest-inspector'
import { useEditorStore } from '@/lib/store/editor-store'
import { ProjectSnapshotSchema } from '@mcquest/schema'
import { createDefaultSnapshot } from '@/lib/editor'

/**
 * EditorPageClient - Client-side editor layout
 *
 * Handles the full-screen editor layout with:
 * - Header with project name and navigation
 * - Main canvas area (React Flow)
 * - Autosave with sync indicator
 * - Future: Side panels for chapter list, inspector, validation
 */

interface Project {
  id: string
  name: string
  description: string | null
  latestSnapshot: unknown
  role: string
}

interface EditorPageClientProps {
  project: Project
}

export function EditorPageClient({ project }: EditorPageClientProps) {
  const initializeProject = useEditorStore((state) => state.initializeProject)

  // Initialize the store on mount
  useEffect(() => {
    // Create default snapshot if none exists
    const rawSnapshot = project.latestSnapshot ?? createDefaultSnapshot(project.name)

    // Parse and validate the snapshot
    const parseResult = ProjectSnapshotSchema.safeParse(rawSnapshot)

    if (!parseResult.success) {
      console.error('Invalid snapshot:', parseResult.error)
      // Fall back to default snapshot if validation fails
      const defaultSnapshot = createDefaultSnapshot(project.name)
      initializeProject(project.id, defaultSnapshot)
      return
    }

    // Initialize store with validated snapshot
    initializeProject(project.id, parseResult.data)
  }, [project.id, project.name, project.latestSnapshot, initializeProject])

  return (
    <AutosaveProvider projectId={project.id}>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        {/* Editor Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                ← Dashboard
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-lg font-semibold">{project.name}</h1>
            <span className="text-xs text-muted-foreground">({project.role})</span>
          </div>
          <div className="flex items-center gap-2">
            <SyncIndicator />
            {/* Future: Undo/Redo buttons */}
          </div>
        </header>

        {/* Main Editor Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar - Chapter panel */}
          <aside className="w-64 shrink-0 border-r bg-card">
            <ChapterPanel />
          </aside>

          {/* Canvas */}
          <main className="flex-1">
            <EditorCanvas projectId={project.id} />
          </main>

          {/* Right sidebar - Inspector panel */}
          <aside className="w-80 shrink-0 border-l bg-card">
            <QuestInspector />
          </aside>
        </div>
      </div>
    </AutosaveProvider>
  )
}
