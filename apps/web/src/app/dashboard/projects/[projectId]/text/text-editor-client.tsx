'use client'

import * as React from 'react'
import { TextEditorLayout, Panel } from '@/components/editor/text-editor-layout'
import { SaveButton } from '@/components/editor/save-button'
import { UnsavedChangesDialog } from '@/components/editor/unsaved-changes-dialog'
import { ValidationPanel } from '@/components/editor/panels/validation-panel'
import { useEditorStore } from '@/lib/store/editor-store'
import { useBlockNavigation } from '@/hooks/use-block-navigation'
import type { ProjectSnapshot } from '@mcquest/schema'

interface TextEditorClientProps {
  projectId: string
  projectName: string
  snapshot: unknown // JSONB from database
  role: string
}

export function TextEditorClient({
  projectId,
  projectName,
  snapshot,
  role
}: TextEditorClientProps) {
  const initializeProject = useEditorStore((state) => state.initializeProject)
  const hasDirtyEntities = useEditorStore((state) => state.hasDirtyEntities)

  // State for unsaved changes dialog
  const [showUnsavedDialog, setShowUnsavedDialog] = React.useState(false)

  // Navigation guard for unsaved changes
  const {
    handleSaveAndLeave,
    handleLeaveWithoutSaving,
  } = useBlockNavigation(hasDirtyEntities(), {
    onSaveAndLeave: () => {
      // User confirmed save and leave - proceed with navigation
    },
    onLeave: () => {
      // User confirmed leave without saving - proceed with navigation
    },
  })

  // Initialize editor store on mount
  React.useEffect(() => {
    initializeProject(projectId, snapshot as ProjectSnapshot)
  }, [projectId, snapshot, initializeProject])

  return (
    <div className="h-screen w-screen overflow-hidden">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{projectName}</h1>
          <span className="text-xs text-muted-foreground">Text Editor</span>
        </div>
        <div className="flex items-center gap-2">
          <SaveButton />
          <span className="text-xs text-muted-foreground">
            Role: {role}
          </span>
        </div>
      </header>

      {/* Main Editor Layout */}
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">
        <div className="flex-1 overflow-hidden">
          <TextEditorLayout
            sidebar={
              <Panel title="Chapters & Quests">
                {/* Placeholder for sidebar tree - will be implemented in T2 */}
                <div className="p-4 text-sm text-muted-foreground">
                  Sidebar tree navigation will be implemented here
                </div>
              </Panel>
            }
            detail={
              <Panel title="Quest Details">
                {/* Placeholder for detail forms - will be implemented in T5 */}
                <div className="p-4 text-sm text-muted-foreground">
                  Quest/chapter editing forms will be implemented here
                </div>
              </Panel>
            }
            preview={
              <Panel title="SNBT Preview">
                {/* Placeholder for SNBT preview - will be implemented in T15 */}
                <div className="p-4 text-sm text-muted-foreground">
                  SNBT preview will be implemented here
                </div>
              </Panel>
            }
            showPreview={true}
          />
        </div>

        {/* Validation Panel - Global validation feedback */}
        <div className="h-64 border-t flex-shrink-0">
          <ValidationPanel />
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onSaveAndLeave={handleSaveAndLeave}
        onLeaveWithoutSaving={handleLeaveWithoutSaving}
      />
    </div>
  )
}
