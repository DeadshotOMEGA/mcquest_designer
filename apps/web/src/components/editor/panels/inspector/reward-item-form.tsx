'use client'

import React, { useCallback, useState, useEffect, useRef } from 'react'
import type { Reward } from '@mcquest/schema'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Props for the RewardItemForm component
 */
interface RewardItemFormProps {
  /**
   * The reward data to display and edit
   */
  reward: Reward

  /**
   * Callback when reward changes
   * Called on blur with the updated reward
   */
  onUpdate: (rewardId: string, updates: Partial<Reward>) => void
}

/**
 * Local form state type for controlled inputs
 */
interface FormState {
  title: string
  item: string
  count: number
}

/**
 * RewardItemForm - Form component for editing ITEM type rewards
 *
 * Displays editable fields for:
 * - Title (optional)
 * - Item ID (e.g., "minecraft:diamond")
 * - Count (how many items)
 *
 * Updates are pushed on blur to minimize store updates during typing.
 */
export function RewardItemForm({ reward, onUpdate }: RewardItemFormProps) {
  // Track form values locally for controlled inputs
  const [formState, setFormState] = useState<FormState>(() => ({
    title: reward.title ?? '',
    item: reward.item ?? '',
    count: reward.count ?? 1,
  }))

  // Track initial values to detect actual changes
  const initialValues = useRef<FormState>({
    title: reward.title ?? '',
    item: reward.item ?? '',
    count: reward.count ?? 1,
  })

  // Sync form state when reward prop changes
  useEffect(() => {
    const newState = {
      title: reward.title ?? '',
      item: reward.item ?? '',
      count: reward.count ?? 1,
    }
    setFormState(newState)
    initialValues.current = newState
  }, [reward.id, reward.title, reward.item, reward.count])

  /**
   * Handle string field change - update local state only
   */
  const handleStringChange = useCallback(
    (field: 'title' | 'item') => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => ({
        ...prev,
        [field]: e.target.value,
      }))
    },
    []
  )

  /**
   * Handle number field change - update local state only
   */
  const handleNumberChange = useCallback(
    (field: 'count') => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10)
      setFormState((prev) => ({
        ...prev,
        [field]: isNaN(value) || value < 1 ? 1 : value,
      }))
    },
    []
  )

  /**
   * Handle blur - push updates to store if changed
   */
  const handleBlur = useCallback(() => {
    const updates: Partial<Reward> = {}
    let hasChanges = false

    // Check title
    if (formState.title !== initialValues.current.title) {
      updates.title = formState.title.trim() || undefined
      hasChanges = true
    }

    // Check item
    if (formState.item !== initialValues.current.item) {
      updates.item = formState.item.trim()
      hasChanges = true
    }

    // Check count
    if (formState.count !== initialValues.current.count) {
      updates.count = formState.count
      hasChanges = true
    }

    if (hasChanges) {
      initialValues.current = { ...formState }
      onUpdate(reward.id, updates)
    }
  }, [formState, reward.id, onUpdate])

  return (
    <div className="space-y-3">
      {/* Title field */}
      <div className="space-y-1">
        <Label htmlFor={`reward-${reward.id}-title`} className="text-xs">
          Title
        </Label>
        <Input
          id={`reward-${reward.id}-title`}
          value={formState.title}
          onChange={handleStringChange('title')}
          onBlur={handleBlur}
          placeholder="Optional title"
          className="h-8 text-sm"
        />
      </div>

      {/* Item ID field */}
      <div className="space-y-1">
        <Label htmlFor={`reward-${reward.id}-item`} className="text-xs">
          Item ID
        </Label>
        <Input
          id={`reward-${reward.id}-item`}
          value={formState.item}
          onChange={handleStringChange('item')}
          onBlur={handleBlur}
          placeholder="minecraft:diamond"
          className="h-8 font-mono text-sm"
        />
      </div>

      {/* Count field */}
      <div className="space-y-1">
        <Label htmlFor={`reward-${reward.id}-count`} className="text-xs">
          Count
        </Label>
        <Input
          id={`reward-${reward.id}-count`}
          type="number"
          min={1}
          value={formState.count}
          onChange={handleNumberChange('count')}
          onBlur={handleBlur}
          className="h-8 text-sm"
        />
      </div>
    </div>
  )
}
