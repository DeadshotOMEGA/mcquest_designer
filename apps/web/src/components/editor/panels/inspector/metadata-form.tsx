'use client'

import React, { useCallback, useRef, useState, useEffect } from 'react'
import type { Quest } from '@mcquest/schema'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

/**
 * Props for the MetadataForm component
 */
interface MetadataFormProps {
  /**
   * The quest data to display and edit
   */
  quest: Quest

  /**
   * Callback when quest metadata changes
   * Called on blur with the changed fields
   */
  onUpdate: (updates: Partial<Pick<Quest, 'title' | 'subtitle' | 'description'>>) => void
}

/**
 * Local form state type for controlled inputs
 */
interface FormState {
  title: string
  subtitle: string
  description: string
}

/**
 * MetadataForm - Form component for editing quest metadata
 *
 * Displays editable fields for:
 * - Title (required)
 * - Subtitle (optional)
 * - Description (optional, multiline)
 *
 * Updates are pushed on blur to minimize store updates during typing.
 */
export function MetadataForm({ quest, onUpdate }: MetadataFormProps) {
  // Track form values locally for controlled inputs
  const [formState, setFormState] = useState<FormState>(() => ({
    title: quest.title,
    subtitle: quest.subtitle ?? '',
    description: quest.description ?? '',
  }))

  // Track initial values to detect actual changes
  const initialValues = useRef<FormState>({
    title: quest.title,
    subtitle: quest.subtitle ?? '',
    description: quest.description ?? '',
  })

  // Sync form state when quest prop changes (different quest selected)
  useEffect(() => {
    const newState = {
      title: quest.title,
      subtitle: quest.subtitle ?? '',
      description: quest.description ?? '',
    }
    setFormState(newState)
    initialValues.current = newState
  }, [quest.id, quest.title, quest.subtitle, quest.description])

  /**
   * Handle field change - update local state only
   */
  const handleChange = useCallback(
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
  const handleBlur = useCallback(
    (field: keyof FormState) => () => {
      const currentValue = formState[field]
      const initialValue = initialValues.current[field]

      // Only update if value actually changed
      if (currentValue !== initialValue) {
        const update: Partial<Pick<Quest, 'title' | 'subtitle' | 'description'>> = {}

        if (field === 'title') {
          // Title is required, don't allow empty
          if (currentValue.trim()) {
            update.title = currentValue.trim()
          } else {
            // Revert to initial value if empty
            setFormState((prev) => ({ ...prev, title: initialValue }))
            return
          }
        } else if (field === 'subtitle') {
          // Subtitle is optional - empty string becomes undefined
          update.subtitle = currentValue.trim() || undefined
        } else if (field === 'description') {
          // Description is optional - empty string becomes undefined
          update.description = currentValue.trim() || undefined
        }

        // Update the initial value reference for next comparison
        initialValues.current = {
          ...initialValues.current,
          [field]: currentValue,
        }

        onUpdate(update)
      }
    },
    [formState, onUpdate]
  )

  return (
    <div className="space-y-4">
      {/* Title field */}
      <div className="space-y-2">
        <Label htmlFor="quest-title">Title</Label>
        <Input
          id="quest-title"
          value={formState.title}
          onChange={handleChange('title')}
          onBlur={handleBlur('title')}
          placeholder="Quest title"
          required
        />
      </div>

      {/* Subtitle field */}
      <div className="space-y-2">
        <Label htmlFor="quest-subtitle">Subtitle</Label>
        <Input
          id="quest-subtitle"
          value={formState.subtitle}
          onChange={handleChange('subtitle')}
          onBlur={handleBlur('subtitle')}
          placeholder="Optional subtitle"
        />
      </div>

      {/* Description field */}
      <div className="space-y-2">
        <Label htmlFor="quest-description">Description</Label>
        <Textarea
          id="quest-description"
          value={formState.description}
          onChange={handleChange('description')}
          onBlur={handleBlur('description')}
          placeholder="Quest description..."
          rows={4}
        />
      </div>
    </div>
  )
}
