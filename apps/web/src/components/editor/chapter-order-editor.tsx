'use client'

import React, { useCallback, useRef, useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown } from 'lucide-react'

/**
 * Props for the ChapterOrderEditor component
 */
interface ChapterOrderEditorProps {
  /**
   * The current order value
   */
  order: number

  /**
   * Callback when order changes
   * Called on blur with the new order value
   */
  onUpdate: (order: number) => void

  /**
   * Optional error message to display
   */
  error?: string

  /**
   * Callback to move chapter up (decrease order)
   * Optional - if provided, shows up/down buttons
   */
  onMoveUp?: () => void

  /**
   * Callback to move chapter down (increase order)
   * Optional - if provided, shows up/down buttons
   */
  onMoveDown?: () => void
}

/**
 * Local form state type for controlled input
 */
interface FormState {
  order: string
}

/**
 * ChapterOrderEditor - Component for editing chapter order
 *
 * Features:
 * - Numeric input for direct order editing
 * - Optional up/down buttons for quick reordering
 * - Validates on blur
 * - Displays inline error messages
 *
 * Updates are pushed on blur to minimize store updates during typing.
 */
export function ChapterOrderEditor({
  order,
  onUpdate,
  error,
  onMoveUp,
  onMoveDown,
}: ChapterOrderEditorProps) {
  // Track form values locally for controlled input
  const [formState, setFormState] = useState<FormState>(() => ({
    order: order.toString(),
  }))

  // Track initial values to detect actual changes
  const initialValues = useRef<FormState>({
    order: order.toString(),
  })

  // Sync form state when order prop changes (different chapter selected)
  useEffect(() => {
    const newState = {
      order: order.toString(),
    }
    setFormState(newState)
    initialValues.current = newState
  }, [order])

  /**
   * Handle input change - update local state only
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    // Allow empty string for clearing, or numeric values
    if (value === '' || /^-?\d+$/.test(value)) {
      setFormState((prev) => ({
        ...prev,
        order: value,
      }))
    }
  }, [])

  /**
   * Handle blur - validate and push updates to store if changed
   */
  const handleBlur = useCallback(() => {
    const currentValue = formState.order
    const initialValue = initialValues.current.order

    // If value didn't change, do nothing
    if (currentValue === initialValue) {
      return
    }

    // Parse the value
    const parsed = parseInt(currentValue, 10)

    // Validate: must be a valid number and non-negative
    if (isNaN(parsed)) {
      // Revert to initial value if invalid
      setFormState((prev) => ({
        ...prev,
        order: initialValue,
      }))
      return
    }

    if (parsed < 0) {
      // Revert to initial value if negative
      setFormState((prev) => ({
        ...prev,
        order: initialValue,
      }))
      return
    }

    // Update the initial value reference and push update
    initialValues.current = {
      order: currentValue,
    }

    onUpdate(parsed)
  }, [formState.order, onUpdate])

  /**
   * Handle moving chapter up
   */
  const handleMoveUp = useCallback(() => {
    if (onMoveUp) {
      onMoveUp()
    }
  }, [onMoveUp])

  /**
   * Handle moving chapter down
   */
  const handleMoveDown = useCallback(() => {
    if (onMoveDown) {
      onMoveDown()
    }
  }, [onMoveDown])

  return (
    <div className="space-y-2">
      <Label htmlFor="chapter-order">Order</Label>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            id="chapter-order"
            type="text"
            inputMode="numeric"
            value={formState.order}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="0"
            aria-invalid={!!error}
            className={error ? 'border-destructive' : ''}
          />
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>

        {/* Optional up/down buttons for quick reordering */}
        {(onMoveUp || onMoveDown) && (
          <div className="flex gap-1">
            {onMoveUp && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleMoveUp}
                className="h-9 w-9"
                aria-label="Move chapter up"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
            {onMoveDown && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleMoveDown}
                className="h-9 w-9"
                aria-label="Move chapter down"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
