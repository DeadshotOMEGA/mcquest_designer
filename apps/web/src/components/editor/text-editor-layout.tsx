'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Resizable panel component using CSS resize
 * Falls back to fixed widths if resize is not supported
 */
interface ResizablePanelProps {
  children: React.ReactNode
  className?: string
  defaultWidth?: string
  minWidth?: string
  maxWidth?: string
  resizable?: boolean
  id: string
}

const ResizablePanel = React.forwardRef<HTMLDivElement, ResizablePanelProps>(
  ({ children, className, defaultWidth, minWidth, maxWidth, resizable = false, id }, ref) => {
    const [width, setWidth] = React.useState<string | undefined>(undefined)

    // Load persisted width from localStorage on mount
    React.useEffect(() => {
      const stored = localStorage.getItem(`panel-width-${id}`)
      if (stored) {
        setWidth(stored)
      } else if (defaultWidth) {
        setWidth(defaultWidth)
      }
    }, [id, defaultWidth])

    // Persist width changes to localStorage
    const handleResize = React.useCallback(
      (e: React.SyntheticEvent<HTMLDivElement>) => {
        const newWidth = e.currentTarget.style.width
        if (newWidth) {
          setWidth(newWidth)
          localStorage.setItem(`panel-width-${id}`, newWidth)
        }
      },
      [id]
    )

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          resizable && 'resize-x',
          className
        )}
        style={{
          width: width || defaultWidth,
          minWidth,
          maxWidth,
        }}
        onMouseUp={handleResize}
        onTouchEnd={handleResize}
      >
        {children}
      </div>
    )
  }
)
ResizablePanel.displayName = 'ResizablePanel'

/**
 * Resize handle component for manual drag-based resizing
 */
interface ResizeHandleProps {
  onResize?: (delta: number) => void
  className?: string
}

const ResizeHandle = React.forwardRef<HTMLDivElement, ResizeHandleProps>(
  ({ onResize, className }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false)
    const startX = React.useRef(0)

    const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true)
      startX.current = e.clientX
      e.preventDefault()
    }

    React.useEffect(() => {
      if (!isDragging) return

      const handleMouseMove = (e: MouseEvent) => {
        const delta = e.clientX - startX.current
        onResize?.(delta)
        startX.current = e.clientX
      }

      const handleMouseUp = () => {
        setIsDragging(false)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }, [isDragging, onResize])

    return (
      <div
        ref={ref}
        className={cn(
          'w-1 cursor-col-resize bg-border hover:bg-primary/50 transition-colors',
          isDragging && 'bg-primary',
          className
        )}
        onMouseDown={handleMouseDown}
      />
    )
  }
)
ResizeHandle.displayName = 'ResizeHandle'

/**
 * 3-Panel Layout for Text Editor
 *
 * Layout structure:
 * ┌────────────┬──────────────────────┬─────────────┐
 * │  Sidebar   │   Detail Panel       │  Preview    │
 * │  (Tree)    │   (Forms)            │  (SNBT)     │
 * │  250px     │   flex-1             │  350px      │
 * │  resizable │                      │  collapsible│
 * └────────────┴──────────────────────┴─────────────┘
 */
interface TextEditorLayoutProps {
  sidebar: React.ReactNode
  detail: React.ReactNode
  preview: React.ReactNode
  showPreview?: boolean
}

export function TextEditorLayout({
  sidebar,
  detail,
  preview,
  showPreview = true,
}: TextEditorLayoutProps) {
  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* Sidebar Panel - Tree Navigation */}
      <ResizablePanel
        id="sidebar"
        defaultWidth="250px"
        minWidth="200px"
        maxWidth="400px"
        resizable
        className="border-r"
      >
        {sidebar}
      </ResizablePanel>

      {/* Detail Panel - Form Editing */}
      <div className="flex-1 overflow-hidden">
        {detail}
      </div>

      {/* Preview Panel - SNBT Preview (Collapsible) */}
      {showPreview && (
        <>
          <ResizeHandle />
          <ResizablePanel
            id="preview"
            defaultWidth="350px"
            minWidth="250px"
            maxWidth="600px"
            resizable
            className="border-l"
          >
            {preview}
          </ResizablePanel>
        </>
      )}
    </div>
  )
}

/**
 * Panel container with consistent styling
 */
interface PanelProps {
  children: React.ReactNode
  className?: string
  title?: string
  actions?: React.ReactNode
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ children, className, title, actions }, ref) => {
    return (
      <div ref={ref} className={cn('flex h-full flex-col', className)}>
        {title && (
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">{title}</h2>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    )
  }
)

Panel.displayName = 'Panel'
