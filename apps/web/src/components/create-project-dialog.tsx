'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CreateProjectRequestSchema, type CreateProjectRequest } from '@mcquest/schema'

interface CreateProjectDialogProps {
  children?: React.ReactNode
}

/**
 * CreateProjectDialog - Modal form for creating new projects
 *
 * Accessibility:
 * - Focus trapped within modal when open
 * - Escape key closes dialog
 * - Form validation provides error feedback
 * - Submit disabled during loading state
 * - Error messages associated with inputs via aria-describedby
 */
export function CreateProjectDialog({ children }: CreateProjectDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState<CreateProjectRequest>({
    name: '',
    description: '',
  })
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setValidationErrors({})

    // Validate with Zod schema
    const validation = CreateProjectRequestSchema.safeParse(formData)
    if (!validation.success) {
      const errors: Record<string, string> = {}
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0]?.toString()
        if (path) {
          errors[path] = issue.message
        }
      })
      setValidationErrors(errors)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validation.data),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create project')
      }

      // Consume the response
      void (await response.json())

      // Close dialog and refresh
      setOpen(false)
      setFormData({ name: '', description: '' })
      router.refresh()

      // Optionally navigate to the new project if needed
      // const { project } = await response.json()
      // router.push(`/editor/${project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset form when closing
      setFormData({ name: '', description: '' })
      setError(null)
      setValidationErrors({})
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children || <Button>Create Project</Button>}</DialogTrigger>
      <DialogContent aria-describedby={error ? 'dialog-error' : undefined}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new questbook project. You can add chapters and quests in the editor.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div
                id="dialog-error"
                role="alert"
                className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">
                Project name{' '}
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="My Questbook"
                required
                aria-required="true"
                aria-invalid={!!validationErrors.name}
                aria-describedby={validationErrors.name ? 'name-error' : undefined}
                maxLength={255}
              />
              {validationErrors.name && (
                <p id="name-error" className="text-sm text-destructive" role="alert">
                  {validationErrors.name}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Project description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="A brief description of your questbook..."
                rows={3}
                aria-invalid={!!validationErrors.description}
                aria-describedby={validationErrors.description ? 'description-error' : undefined}
                maxLength={2000}
              />
              {validationErrors.description && (
                <p id="description-error" className="text-sm text-destructive" role="alert">
                  {validationErrors.description}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
