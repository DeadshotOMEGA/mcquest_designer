'use client'

import React, { useCallback, useState, useEffect, useRef } from 'react'
import type { Reward } from '@mcquest/schema'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

/**
 * Props for the RewardCommandForm component
 */
interface RewardCommandFormProps {
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
  command: string
}

/**
 * RewardCommandForm - Form component for editing COMMAND type rewards
 *
 * Displays editable fields for:
 * - Title (optional)
 * - Command (the command to run, e.g., "give @p diamond 64")
 *
 * Updates are pushed on blur to minimize store updates during typing.
 *
 * Note: Command rewards are user-authored strings. Per 80_security.md,
 * they should be escaped safely in SNBT and never executed server-side.
 */
export function RewardCommandForm({ reward, onUpdate }: RewardCommandFormProps) {
  // Track form values locally for controlled inputs
  const [formState, setFormState] = useState<FormState>(() => ({
    title: reward.title ?? '',
    command: reward.command ?? '',
  }))

  // Track initial values to detect actual changes
  const initialValues = useRef<FormState>({
    title: reward.title ?? '',
    command: reward.command ?? '',
  })

  // Sync form state when reward prop changes
  useEffect(() => {
    const newState = {
      title: reward.title ?? '',
      command: reward.command ?? '',
    }
    setFormState(newState)
    initialValues.current = newState
  }, [reward.id, reward.title, reward.command])

  /**
   * Handle string field change - update local state only
   */
  const handleChange = useCallback(
    (field: 'title' | 'command') =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormState((prev) => ({
          ...prev,
          [field]: e.target.value,
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

    // Check command
    if (formState.command !== initialValues.current.command) {
      updates.command = formState.command.trim()
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
          onChange={handleChange('title')}
          onBlur={handleBlur}
          placeholder="Optional title"
          className="h-8 text-sm"
        />
      </div>

      {/* Command field */}
      <div className="space-y-1">
        <Label htmlFor={`reward-${reward.id}-command`} className="text-xs">
          Command
        </Label>
        <Textarea
          id={`reward-${reward.id}-command`}
          value={formState.command}
          onChange={handleChange('command')}
          onBlur={handleBlur}
          placeholder="give @p minecraft:diamond 64"
          className="min-h-[60px] font-mono text-sm"
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          Command to run when reward is claimed. Use @p for the player.
        </p>
      </div>
    </div>
  )
}
