'use client'

import React, { useCallback, useEffect, useState } from 'react'
import type { Task } from '@mcquest/schema'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Props for the TaskCheckboxForm component
 */
interface TaskCheckboxFormProps {
  /**
   * The task to edit
   */
  task: Task

  /**
   * Callback when task changes
   */
  onUpdate: (updates: Partial<Task>) => void
}

/**
 * Form state for checkmark task fields
 */
interface CheckboxFormState {
  title: string
}

/**
 * TaskCheckboxForm - Form for editing CHECKMARK type tasks
 *
 * Checkmark tasks are simple manual completion tasks that only need:
 * - title: The display text for the checkbox
 *
 * In FTB Quests, these appear as simple checkboxes players can click
 * to manually mark a task as complete.
 */
export function TaskCheckboxForm({ task, onUpdate }: TaskCheckboxFormProps) {
  const [formState, setFormState] = useState<CheckboxFormState>(() => ({
    title: task.title ?? '',
  }))

  // Sync form state when task prop changes
  useEffect(() => {
    setFormState({
      title: task.title ?? '',
    })
  }, [task.id, task.title])

  /**
   * Handle title change
   */
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({ title: e.target.value })
  }, [])

  /**
   * Handle blur - push updates to parent
   */
  const handleTitleBlur = useCallback(() => {
    onUpdate({ title: formState.title.trim() || undefined })
  }, [formState.title, onUpdate])

  return (
    <div className="space-y-3">
      {/* Title field */}
      <div className="space-y-1.5">
        <Label htmlFor={`task-${task.id}-title`} className="text-xs">
          Checkbox Label
        </Label>
        <Input
          id={`task-${task.id}-title`}
          value={formState.title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          placeholder="Click to complete"
          className="h-8 text-sm"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Players can manually check this task to mark it complete.
      </p>
    </div>
  )
}
