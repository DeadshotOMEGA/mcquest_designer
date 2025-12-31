'use client'

import React, { useCallback, useRef, useState, useEffect } from 'react'
import type { IconReference } from '@mcquest/schema'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

/**
 * Common vanilla Minecraft items for quick icon selection
 */
const COMMON_ITEMS = [
  'minecraft:book',
  'minecraft:diamond',
  'minecraft:compass',
  'minecraft:map',
  'minecraft:oak_log',
  'minecraft:stone',
  'minecraft:iron_ingot',
  'minecraft:gold_ingot',
  'minecraft:emerald',
  'minecraft:redstone',
  'minecraft:coal',
  'minecraft:apple',
  'minecraft:chest',
  'minecraft:crafting_table',
  'minecraft:furnace',
  'minecraft:enchanting_table',
  'minecraft:beacon',
  'minecraft:nether_star',
  'minecraft:end_crystal',
  'minecraft:dragon_egg',
]

/**
 * Props for the IconSelector component
 */
interface IconSelectorProps {
  /**
   * The current icon reference (if any)
   */
  icon: IconReference | undefined

  /**
   * Callback when icon changes
   * Called on blur with the updated icon reference
   */
  onUpdate: (icon: IconReference | undefined) => void
}

/**
 * Local form state type for controlled inputs
 */
interface FormState {
  itemId: string
}

/**
 * IconSelector - Component for selecting quest icons
 *
 * Displays:
 * - Text input for item ID (e.g., 'minecraft:book')
 * - Dropdown with common vanilla items
 * - Shows current icon reference
 *
 * Updates are pushed on blur to minimize store updates during typing.
 * Supports both 'item' type icons (most common) for now.
 */
export function IconSelector({ icon, onUpdate }: IconSelectorProps) {
  // Track form values locally for controlled inputs
  const [formState, setFormState] = useState<FormState>(() => ({
    itemId: icon?.type === 'item' ? icon.value : '',
  }))

  // Track initial values to detect actual changes
  const initialValues = useRef<FormState>({
    itemId: icon?.type === 'item' ? icon.value : '',
  })

  // Sync form state when icon prop changes (different quest selected)
  useEffect(() => {
    const newState = {
      itemId: icon?.type === 'item' ? icon.value : '',
    }
    setFormState(newState)
    initialValues.current = newState
  }, [icon?.type === 'item' ? icon?.value : undefined])

  /**
   * Handle field change - update local state only
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      itemId: e.target.value,
    }))
  }, [])

  /**
   * Handle dropdown selection - update local state and blur
   */
  const handleSelectChange = useCallback((value: string) => {
    setFormState({
      itemId: value,
    })
    // Immediately persist the selection when choosing from dropdown
    persistChanges(value)
  }, [])

  /**
   * Persist changes to the store
   */
  const persistChanges = useCallback(
    (itemId: string) => {
      const trimmedId = itemId.trim()

      if (trimmedId) {
        // Create icon reference with 'item' type
        const newIcon: IconReference = {
          type: 'item',
          value: trimmedId,
        }
        onUpdate(newIcon)
      } else {
        // Empty string means remove the icon
        onUpdate(undefined)
      }

      // Update the initial value reference for next comparison
      initialValues.current = {
        itemId: trimmedId,
      }
    },
    [onUpdate]
  )

  /**
   * Handle blur - push updates to store if changed
   */
  const handleBlur = useCallback(() => {
    const currentValue = formState.itemId
    const initialValue = initialValues.current.itemId

    // Only update if value actually changed
    if (currentValue !== initialValue) {
      persistChanges(currentValue)
    }
  }, [formState.itemId, persistChanges])

  return (
    <div className="space-y-4">
      {/* Item ID input field */}
      <div className="space-y-2">
        <Label htmlFor="quest-icon">Icon (Item ID)</Label>
        <Input
          id="quest-icon"
          value={formState.itemId}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="e.g., minecraft:book"
        />
        <p className="text-xs text-muted-foreground">
          Enter a Minecraft item ID to use as the quest icon
        </p>
      </div>

      {/* Common items dropdown */}
      <div className="space-y-2">
        <Label htmlFor="quest-icon-preset">Quick Select</Label>
        <Select value={formState.itemId} onValueChange={handleSelectChange}>
          <SelectTrigger id="quest-icon-preset">
            <SelectValue placeholder="Choose a common item..." />
          </SelectTrigger>
          <SelectContent>
            {COMMON_ITEMS.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Display current icon reference */}
      {icon && (
        <div className="rounded-md bg-muted/50 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Current icon: <span className="font-mono font-semibold text-foreground">{icon.value}</span>
          </p>
        </div>
      )}
    </div>
  )
}
