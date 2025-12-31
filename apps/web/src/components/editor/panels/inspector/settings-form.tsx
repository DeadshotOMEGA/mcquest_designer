'use client'

import React, { useCallback, useState, useEffect } from 'react'
import type { Quest, QuestSettings } from '@mcquest/schema'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

/**
 * Props for the SettingsForm component
 */
interface SettingsFormProps {
  /**
   * The quest data to display and edit
   */
  quest: Quest

  /**
   * Callback when quest settings change
   * Called with the updated settings object
   */
  onUpdate: (updates: Partial<Pick<Quest, 'settings'>>) => void
}

/**
 * SettingsForm - Form component for editing quest settings
 *
 * Displays checkboxes for quest settings:
 * - optional: Quest is optional to complete chapter
 * - hidden: Quest visibility state (true/false/dependency)
 * - repeatable: Quest can be repeated after completion
 * - hideUntilDeps: Quest hidden until dependencies are met
 *
 * Updates are pushed immediately on change.
 */
export function SettingsForm({ quest, onUpdate }: SettingsFormProps) {
  // Track form values locally for controlled inputs
  const [formState, setFormState] = useState<QuestSettings>(() => ({
    optional: quest.settings?.optional ?? false,
    hidden: quest.settings?.hidden ?? 'false',
    repeatable: quest.settings?.repeatable ?? false,
    canRepeat: quest.settings?.canRepeat ?? false,
    hideUntilDeps: quest.settings?.hideUntilDeps ?? false,
  }))

  // Sync form state when quest prop changes (different quest selected)
  useEffect(() => {
    const newState: QuestSettings = {
      optional: quest.settings?.optional ?? false,
      hidden: quest.settings?.hidden ?? 'false',
      repeatable: quest.settings?.repeatable ?? false,
      canRepeat: quest.settings?.canRepeat ?? false,
      hideUntilDeps: quest.settings?.hideUntilDeps ?? false,
    }
    setFormState(newState)
  }, [quest.id])

  /**
   * Handle boolean checkbox change - update immediately
   */
  const handleBooleanChange = useCallback(
    (field: 'optional' | 'repeatable' | 'canRepeat' | 'hideUntilDeps') => (checked: boolean) => {
      const newSettings: QuestSettings = {
        ...formState,
        [field]: checked,
      }
      setFormState(newSettings)
      onUpdate({ settings: newSettings })
    },
    [formState, onUpdate]
  )

  /**
   * Handle hidden state change (enum with 3 values)
   */
  const handleHiddenChange = useCallback(
    (value: 'true' | 'false' | 'dependency') => {
      const newSettings: QuestSettings = {
        ...formState,
        hidden: value,
      }
      setFormState(newSettings)
      onUpdate({ settings: newSettings })
    },
    [formState, onUpdate]
  )

  return (
    <div className="space-y-4">
      {/* Optional setting */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="quest-optional"
          checked={formState.optional}
          onCheckedChange={(checked) => handleBooleanChange('optional')(checked as boolean)}
        />
        <Label htmlFor="quest-optional" className="cursor-pointer font-medium">
          Optional
        </Label>
        <p className="text-xs text-muted-foreground">Quest is optional to complete chapter</p>
      </div>

      {/* Hidden setting - radio-like selection */}
      <div className="space-y-2">
        <Label className="font-medium">Hidden</Label>
        <div className="space-y-2">
          {(['false', 'true', 'dependency'] as const).map((value) => (
            <div key={value} className="flex items-center space-x-2">
              <input
                type="radio"
                id={`quest-hidden-${value}`}
                name="hidden"
                value={value}
                checked={formState.hidden === value}
                onChange={() => handleHiddenChange(value)}
                className="h-4 w-4 cursor-pointer accent-primary"
              />
              <Label htmlFor={`quest-hidden-${value}`} className="cursor-pointer capitalize">
                {value === 'dependency' ? 'Hidden until dependencies' : value}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Repeatable setting */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="quest-repeatable"
          checked={formState.repeatable}
          onCheckedChange={(checked) => handleBooleanChange('repeatable')(checked as boolean)}
        />
        <Label htmlFor="quest-repeatable" className="cursor-pointer font-medium">
          Repeatable
        </Label>
        <p className="text-xs text-muted-foreground">Quest can be repeated after completion</p>
      </div>

      {/* Can Repeat setting */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="quest-can-repeat"
          checked={formState.canRepeat}
          onCheckedChange={(checked) => handleBooleanChange('canRepeat')(checked as boolean)}
        />
        <Label htmlFor="quest-can-repeat" className="cursor-pointer font-medium">
          Can Repeat
        </Label>
        <p className="text-xs text-muted-foreground">Allow repeat completion</p>
      </div>

      {/* Hide Until Dependencies setting */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="quest-hide-until-deps"
          checked={formState.hideUntilDeps}
          onCheckedChange={(checked) => handleBooleanChange('hideUntilDeps')(checked as boolean)}
        />
        <Label htmlFor="quest-hide-until-deps" className="cursor-pointer font-medium">
          Hide Until Dependencies
        </Label>
        <p className="text-xs text-muted-foreground">Quest hidden until all dependencies met</p>
      </div>
    </div>
  )
}
