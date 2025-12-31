'use client'

import React, { useCallback, useEffect, useState } from 'react'
import type { Task } from '@mcquest/schema'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

/**
 * Props for the TaskItemForm component
 */
interface TaskItemFormProps {
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
 * Form state for item task fields
 */
interface ItemFormState {
  item: string
  count: number
  title: string
  consumeItems: boolean
}

/**
 * TaskItemForm - Form for editing ITEM type tasks
 *
 * Item tasks require:
 * - item: The Minecraft item ID (e.g., "minecraft:diamond")
 * - count: How many items are required
 * - title: Optional display title
 * - consumeItems: Whether to consume items on completion (stored as a flag)
 */
export function TaskItemForm({ task, onUpdate }: TaskItemFormProps) {
  const [formState, setFormState] = useState<ItemFormState>(() => ({
    item: task.item ?? '',
    count: task.count ?? 1,
    title: task.title ?? '',
    consumeItems: false, // Note: consumeItems is not in the schema yet, but we'll track it for future
  }))

  // Sync form state when task prop changes
  useEffect(() => {
    setFormState({
      item: task.item ?? '',
      count: task.count ?? 1,
      title: task.title ?? '',
      consumeItems: false,
    })
  }, [task.id, task.item, task.count, task.title])

  /**
   * Handle field change and push update immediately for blur
   */
  const handleChange = useCallback(
    (field: keyof ItemFormState) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = field === 'count' ? parseInt(e.target.value, 10) || 1 : e.target.value
        setFormState((prev) => ({
          ...prev,
          [field]: value,
        }))
      },
    []
  )

  /**
   * Handle blur - push updates to parent
   */
  const handleBlur = useCallback(
    (field: keyof ItemFormState) => () => {
      const updates: Partial<Task> = {}

      if (field === 'item') {
        updates.item = formState.item.trim() || undefined
      } else if (field === 'count') {
        updates.count = Math.max(1, formState.count)
      } else if (field === 'title') {
        updates.title = formState.title.trim() || undefined
      }

      onUpdate(updates)
    },
    [formState, onUpdate]
  )

  /**
   * Handle checkbox change - immediate update
   */
  const handleConsumeChange = useCallback(
    (checked: boolean | 'indeterminate') => {
      const isChecked = checked === true
      setFormState((prev) => ({ ...prev, consumeItems: isChecked }))
      // Note: consumeItems would need to be added to the Task schema
      // For now this is a UI placeholder
    },
    []
  )

  return (
    <div className="space-y-3">
      {/* Item ID field */}
      <div className="space-y-1.5">
        <Label htmlFor={`task-${task.id}-item`} className="text-xs">
          Item ID
        </Label>
        <Input
          id={`task-${task.id}-item`}
          value={formState.item}
          onChange={handleChange('item')}
          onBlur={handleBlur('item')}
          placeholder="minecraft:diamond"
          className="h-8 text-sm"
        />
      </div>

      {/* Count field */}
      <div className="space-y-1.5">
        <Label htmlFor={`task-${task.id}-count`} className="text-xs">
          Count
        </Label>
        <Input
          id={`task-${task.id}-count`}
          type="number"
          min={1}
          value={formState.count}
          onChange={handleChange('count')}
          onBlur={handleBlur('count')}
          className="h-8 text-sm"
        />
      </div>

      {/* Title field (optional) */}
      <div className="space-y-1.5">
        <Label htmlFor={`task-${task.id}-title`} className="text-xs">
          Title (optional)
        </Label>
        <Input
          id={`task-${task.id}-title`}
          value={formState.title}
          onChange={handleChange('title')}
          onBlur={handleBlur('title')}
          placeholder="Custom display title"
          className="h-8 text-sm"
        />
      </div>

      {/* Consume items checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`task-${task.id}-consume`}
          checked={formState.consumeItems}
          onCheckedChange={handleConsumeChange}
        />
        <Label htmlFor={`task-${task.id}-consume`} className="text-xs font-normal">
          Consume items on completion
        </Label>
      </div>
    </div>
  )
}
