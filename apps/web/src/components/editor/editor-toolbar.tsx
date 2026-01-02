'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { LayoutGrid, Undo2, Redo2, Download, Upload, Loader2 } from 'lucide-react'

/**
 * EditorToolbar - Action toolbar for the quest editor
 *
 * Provides quick access to common editor actions:
 * - Auto-arrange quests with dagre layout
 * - Undo/redo with keyboard shortcuts
 * - Export/import operations (optional)
 *
 * Accessibility:
 * - All buttons have descriptive aria-labels
 * - Keyboard navigation support (Tab, Enter/Space)
 * - Disabled states properly conveyed to screen readers
 * - Tooltips provide additional context
 */
export interface EditorToolbarProps {
  /** Currently active chapter ID (null if none selected) */
  activeChapterId: string | null

  /** Callback to trigger auto-layout algorithm */
  onAutoArrange: () => void

  /** Whether layout calculation is in progress */
  isArranging?: boolean

  /** Callback for export action (optional) */
  onExport?: () => void

  /** Callback for import action (optional) */
  onImport?: () => void

  /** Callback for undo action (optional) */
  onUndo?: () => void

  /** Callback for redo action (optional) */
  onRedo?: () => void

  /** Whether undo is available */
  canUndo?: boolean

  /** Whether redo is available */
  canRedo?: boolean

  /** Custom className for positioning */
  className?: string
}

export function EditorToolbar({
  activeChapterId,
  onAutoArrange,
  isArranging = false,
  onExport,
  onImport,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  className = '',
}: EditorToolbarProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  /**
   * Handle auto-arrange button click
   * Shows confirmation dialog before executing
   */
  const handleAutoArrangeClick = () => {
    if (!activeChapterId) {
      return
    }
    setShowConfirmDialog(true)
  }

  /**
   * Confirm auto-arrange and execute layout
   */
  const handleConfirmArrange = () => {
    setShowConfirmDialog(false)
    onAutoArrange()
  }

  /**
   * Cancel auto-arrange
   */
  const handleCancelArrange = () => {
    setShowConfirmDialog(false)
  }

  /**
   * Handle keyboard shortcuts
   */
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo && onUndo) {
          onUndo()
        }
      }

      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault()
        if (canRedo && onRedo) {
          onRedo()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [canUndo, canRedo, onUndo, onRedo])

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={`flex items-center gap-1 rounded-md border bg-card p-1 shadow-sm ${className}`}
        role="toolbar"
        aria-label="Editor actions"
      >
        {/* Auto-arrange button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAutoArrangeClick}
              disabled={!activeChapterId || isArranging}
              aria-label="Auto-arrange quests in current chapter"
            >
              {isArranging ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="sr-only">
                {isArranging ? 'Arranging quests...' : 'Auto-arrange quests'}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Auto-arrange quests</p>
            <p className="text-xs text-muted-foreground">Organize with dagre layout</p>
          </TooltipContent>
        </Tooltip>

        {/* Divider */}
        {(onUndo || onRedo) && <div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />}

        {/* Undo button */}
        {onUndo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onUndo}
                disabled={!canUndo}
                aria-label="Undo last action"
              >
                <Undo2 className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Undo (Ctrl+Z)</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Undo</p>
              <p className="text-xs text-muted-foreground">Ctrl+Z</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Redo button */}
        {onRedo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRedo}
                disabled={!canRedo}
                aria-label="Redo last undone action"
              >
                <Redo2 className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Redo (Ctrl+Shift+Z)</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Redo</p>
              <p className="text-xs text-muted-foreground">Ctrl+Shift+Z</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Divider */}
        {(onExport || onImport) && <div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />}

        {/* Export button */}
        {onExport && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onExport}
                aria-label="Export questbook"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Export</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Export</p>
              <p className="text-xs text-muted-foreground">Download SNBT files</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Import button */}
        {onImport && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onImport}
                aria-label="Import questbook"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Import</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Import</p>
              <p className="text-xs text-muted-foreground">Load from SNBT files</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Auto-Arrange Quests</DialogTitle>
            <DialogDescription>
              This will automatically rearrange all quests in the current chapter using a
              hierarchical layout algorithm. Your current positions will be replaced. This action
              can be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelArrange}>
              Cancel
            </Button>
            <Button onClick={handleConfirmArrange}>Rearrange</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
