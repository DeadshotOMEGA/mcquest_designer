'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Upload, MoreVertical, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { formatDistanceToNow } from '@/lib/date-utils'

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description?: string | null
    updatedAt: string
    memberCount?: number
    role?: 'OWNER' | 'EDITOR' | 'VIEWER'
  }
}

/**
 * ProjectCard - Displays project summary with metadata
 *
 * Accessibility:
 * - Card is clickable to open project
 * - Dropdown menu for project actions
 * - Delete confirmation dialog
 * - Role badge provides context
 * - Time information uses relative formatting
 */
export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleCardClick = () => {
    router.push(`/editor/${project.id}`)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete project')
      }

      // Refresh the page to show updated project list
      router.refresh()
    } catch (error) {
      console.error('Error deleting project:', error)
      // TODO: Show error toast
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <Card
        className="h-full transition-colors hover:bg-accent/50 group cursor-pointer"
        data-testid="project-card"
        onClick={handleCardClick}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="text-xl line-clamp-2">{project.name}</CardTitle>
            <div className="flex items-center gap-2 shrink-0">
              {project.role && (
                <Badge variant={project.role === 'OWNER' ? 'default' : 'secondary'}>
                  {project.role}
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Project actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/editor/${project.id}`)
                    }}
                  >
                    Open in Editor
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/dashboard/projects/${project.id}/import`)
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import Questbook
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDeleteDialog(true)
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {project.description && (
            <CardDescription className="line-clamp-3">{project.description}</CardDescription>
          )}
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <time
              dateTime={project.updatedAt}
              title={new Date(project.updatedAt).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
              suppressHydrationWarning
            >
              Updated {formatDistanceToNow(new Date(project.updatedAt))}
            </time>
            {project.memberCount !== undefined && project.memberCount > 1 && (
              <span className="flex items-center gap-1">
                <span aria-hidden="true">👥</span>
                <span className="sr-only">Members:</span>
                {project.memberCount}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
