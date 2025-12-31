'use client'

import React, { useCallback, useState, useEffect, useRef } from 'react'
import type { Reward } from '@mcquest/schema'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Props for the RewardXpForm component
 */
interface RewardXpFormProps {
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
  xp: number
}

/**
 * RewardXpForm - Form component for editing XP type rewards
 *
 * Displays editable fields for:
 * - Title (optional)
 * - XP amount (how much XP to give)
 *
 * Updates are pushed on blur to minimize store updates during typing.
 */
export function RewardXpForm({ reward, onUpdate }: RewardXpFormProps) {
  // Track form values locally for controlled inputs
  const [formState, setFormState] = useState<FormState>(() => ({
    title: reward.title ?? '',
    xp: reward.xp ?? 0,
  }))

  // Track initial values to detect actual changes
  const initialValues = useRef<FormState>({
    title: reward.title ?? '',
    xp: reward.xp ?? 0,
  })

  // Sync form state when reward prop changes
  useEffect(() => {
    const newState = {
      title: reward.title ?? '',
      xp: reward.xp ?? 0,
    }
    setFormState(newState)
    initialValues.current = newState
  }, [reward.id, reward.title, reward.xp])

  /**
   * Handle string field change - update local state only
   */
  const handleStringChange = useCallback(
    (field: 'title') => (e: React.ChangeEvent<HTMLInputElement>) => {
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
    (field: 'xp') => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10)
      setFormState((prev) => ({
        ...prev,
        [field]: isNaN(value) ? 0 : value,
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

    // Check xp
    if (formState.xp !== initialValues.current.xp) {
      updates.xp = formState.xp
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

      {/* XP amount field */}
      <div className="space-y-1">
        <Label htmlFor={`reward-${reward.id}-xp`} className="text-xs">
          XP Amount
        </Label>
        <Input
          id={`reward-${reward.id}-xp`}
          type="number"
          min={0}
          value={formState.xp}
          onChange={handleNumberChange('xp')}
          onBlur={handleBlur}
          className="h-8 text-sm"
        />
      </div>
    </div>
  )
}
