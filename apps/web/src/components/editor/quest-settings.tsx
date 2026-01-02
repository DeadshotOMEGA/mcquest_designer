'use client'

import React from 'react'
import { type UseFormRegister, type FieldValues, type Path } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

/**
 * Props for QuestSettingsForm
 */
interface QuestSettingsProps<T extends FieldValues> {
  register: UseFormRegister<T>
}

/**
 * Quest Settings Form Component
 *
 * Renders checkboxes for quest settings:
 * - optional: Quest is optional to complete chapter
 * - repeatable: Quest can be repeated after completion
 * - canRepeat: Allow repeat completion
 * - hideUntilDeps: Quest hidden until dependencies met
 * - hidden: Quest visibility (true/false/dependency)
 *
 * Uses react-hook-form for uncontrolled state management
 */
export function QuestSettingsForm<T extends FieldValues>({
  register,
}: QuestSettingsProps<T>) {
  return (
    <div className="space-y-4">
      {/* Optional setting */}
      <div className="flex items-start space-x-3">
        <Checkbox
          id="settings-optional"
          {...register('settings.optional' as Path<T>)}
        />
        <div className="flex-1">
          <Label htmlFor="settings-optional" className="cursor-pointer font-medium">
            Optional
          </Label>
          <p className="text-xs text-muted-foreground">Quest is optional to complete chapter</p>
        </div>
      </div>

      {/* Repeatable setting */}
      <div className="flex items-start space-x-3">
        <Checkbox
          id="settings-repeatable"
          {...register('settings.repeatable' as Path<T>)}
        />
        <div className="flex-1">
          <Label htmlFor="settings-repeatable" className="cursor-pointer font-medium">
            Repeatable
          </Label>
          <p className="text-xs text-muted-foreground">Quest can be repeated after completion</p>
        </div>
      </div>

      {/* Can Repeat setting */}
      <div className="flex items-start space-x-3">
        <Checkbox
          id="settings-can-repeat"
          {...register('settings.canRepeat' as Path<T>)}
        />
        <div className="flex-1">
          <Label htmlFor="settings-can-repeat" className="cursor-pointer font-medium">
            Can Repeat
          </Label>
          <p className="text-xs text-muted-foreground">Allow repeat completion</p>
        </div>
      </div>

      {/* Hide Until Dependencies setting */}
      <div className="flex items-start space-x-3">
        <Checkbox
          id="settings-hide-until-deps"
          {...register('settings.hideUntilDeps' as Path<T>)}
        />
        <div className="flex-1">
          <Label htmlFor="settings-hide-until-deps" className="cursor-pointer font-medium">
            Hide Until Dependencies
          </Label>
          <p className="text-xs text-muted-foreground">Quest hidden until all dependencies met</p>
        </div>
      </div>

      {/* Hidden state selection */}
      <div className="space-y-2 pt-2">
        <Label className="font-medium text-sm">Visibility</Label>
        <div className="space-y-2 ml-0.5">
          {(['false', 'true', 'dependency'] as const).map((value) => (
            <div key={value} className="flex items-center space-x-2">
              <input
                type="radio"
                id={`settings-hidden-${value}`}
                value={value}
                {...register('settings.hidden' as Path<T>)}
                className="h-4 w-4 cursor-pointer accent-primary"
              />
              <Label htmlFor={`settings-hidden-${value}`} className="cursor-pointer text-sm font-normal capitalize">
                {value === 'dependency' ? 'Hidden until dependencies' : value}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
