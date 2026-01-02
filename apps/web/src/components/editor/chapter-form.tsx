'use client'

import React, { useCallback, useRef, useState, useEffect } from 'react'
import type { Chapter, IconReference } from '@mcquest/schema'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChapterOrderEditor } from './chapter-order-editor'
import { IconSelector } from './panels/inspector/icon-selector'
import { ChapterFormDataSchema, validateUniqueOrders } from '@/lib/validation/chapter-validation'
import type { ChapterFormData } from '@/lib/validation/chapter-validation'

/**
 * Props for the ChapterForm component
 */
interface ChapterFormProps {
  /**
   * The chapter data to display and edit
   */
  chapter: Chapter

  /**
   * All chapters in the project (for order uniqueness validation)
   */
  allChapters: Chapter[]

  /**
   * Callback when chapter data changes
   * Called with partial chapter updates to merge into store
   */
  onUpdate: (updates: Partial<Chapter>) => void

  /**
   * Optional callback to move chapter up (decrease order)
   */
  onMoveUp?: () => void

  /**
   * Optional callback to move chapter down (increase order)
   */
  onMoveDown?: () => void
}

/**
 * Local form state type for controlled inputs
 */
type FormState = ChapterFormData

/**
 * Form errors object - maps field names to error strings
 */
interface FormErrors {
  title?: string
  description?: string
  order?: string
  icon?: string
  defaultQuestShape?: string
}

/**
 * ChapterForm - Form component for editing chapter metadata
 *
 * This component provides:
 * - Title editing (required, 1-100 chars)
 * - Description editing (optional, multiline)
 * - Icon selection with item ID input
 * - Order editing with optional up/down buttons
 * - Default quest shape selection
 * - Real-time validation with error display
 * - Blur-triggered store updates to minimize re-renders during typing
 *
 * Acceptance criteria:
 * - Form submits valid data matching Chapter schema
 * - Validation works with inline errors
 * - Order changes update immediately
 * - All chapter fields editable
 * - Order validation prevents duplicates
 */
export function ChapterForm({
  chapter,
  allChapters,
  onUpdate,
  onMoveUp,
  onMoveDown,
}: ChapterFormProps) {
  // Track form values locally for controlled inputs
  const [formState, setFormState] = useState<FormState>(() => ({
    title: chapter.title,
    description: chapter.description ?? '',
    order: chapter.order,
    icon: chapter.icon,
    defaultQuestShape: chapter.defaultQuestShape,
  }))

  // Track initial values to detect actual changes
  const initialValues = useRef<FormState>({
    title: chapter.title,
    description: chapter.description ?? '',
    order: chapter.order,
    icon: chapter.icon,
    defaultQuestShape: chapter.defaultQuestShape,
  })

  // Track validation errors
  const [errors, setErrors] = useState<FormErrors>({})

  // Sync form state when chapter prop changes (different chapter selected)
  useEffect(() => {
    const newState: FormState = {
      title: chapter.title,
      description: chapter.description ?? '',
      order: chapter.order,
      icon: chapter.icon,
      defaultQuestShape: chapter.defaultQuestShape,
    }
    setFormState(newState)
    initialValues.current = newState
    setErrors({})
  }, [chapter.id, chapter.title, chapter.description, chapter.order, chapter.icon, chapter.defaultQuestShape])

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (field: keyof FormState, value: FormState[keyof FormState]): string | null => {
      try {
        if (field === 'title') {
          ChapterFormDataSchema.pick({ title: true }).parse({ title: value })
        } else if (field === 'description') {
          ChapterFormDataSchema.pick({ description: true }).parse({ description: value })
        } else if (field === 'order') {
          const orderValue = value as number
          ChapterFormDataSchema.pick({ order: true }).parse({ order: orderValue })

          // Additional check for uniqueness
          const orderError = validateUniqueOrders(allChapters, chapter.id)
          if (orderError) {
            return orderError
          }
        } else if (field === 'icon') {
          // Icon validation is lenient - just ensure it's an IconReference if provided
          if (value && typeof value === 'object') {
            ChapterFormDataSchema.pick({ icon: true }).parse({ icon: value })
          }
        } else if (field === 'defaultQuestShape') {
          if (value) {
            ChapterFormDataSchema.pick({ defaultQuestShape: true }).parse({
              defaultQuestShape: value,
            })
          }
        }

        return null
      } catch (err) {
        if (err instanceof Error) {
          return err.message
        }
        return 'Validation error'
      }
    },
    [allChapters, chapter.id]
  )

  /**
   * Handle field change - update local state only
   */
  const handleChange = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.value

        setFormState((prev) => ({
          ...prev,
          [field]: value,
        }))

        // Clear error for this field when user starts typing
        setErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }))
      },
    []
  )

  /**
   * Handle blur - validate and push updates to store if changed
   */
  const handleBlur = useCallback(
    (field: keyof FormState) => () => {
      const currentValue = formState[field]
      const initialValue = initialValues.current[field]

      // Validate the field
      const fieldError = validateField(field, currentValue)
      if (fieldError) {
        setErrors((prev) => ({
          ...prev,
          [field]: fieldError,
        }))
        return
      }

      // Clear error if validation passed
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }))

      // Only update if value actually changed
      if (currentValue === initialValue) {
        return
      }

      const update: Partial<Chapter> = {}

      if (field === 'title') {
        const titleValue = currentValue as string
        if (titleValue.trim()) {
          update.title = titleValue.trim()
        } else {
          // Revert to initial value if empty
          setFormState((prev) => ({ ...prev, title: initialValue as string }))
          return
        }
      } else if (field === 'description') {
        const descValue = currentValue as string
        update.description = descValue.trim() || undefined
      } else if (field === 'order') {
        update.order = currentValue as number
      } else if (field === 'defaultQuestShape') {
        const shapeValue = currentValue as string
        if (shapeValue) {
          // Validate that the shape is a valid QuestShape
          const validShapes = ['square', 'rsquare', 'circle', 'diamond', 'pentagon', 'hexagon', 'octagon']
          if (validShapes.includes(shapeValue)) {
            update.defaultQuestShape = shapeValue as Chapter['defaultQuestShape']
          }
        } else {
          update.defaultQuestShape = undefined
        }
      }

      // Update the initial value reference for next comparison
      initialValues.current = {
        ...initialValues.current,
        [field]: currentValue,
      }

      onUpdate(update)
    },
    [formState, validateField, onUpdate]
  )

  /**
   * Handle icon updates from the icon selector
   */
  const handleIconUpdate = useCallback(
    (icon: IconReference | undefined) => {
      setFormState((prev) => ({
        ...prev,
        icon,
      }))

      // Clear error if validation passed
      setErrors((prev) => ({
        ...prev,
        icon: undefined,
      }))

      // Update immediately since icon selector handles its own state
      initialValues.current = {
        ...initialValues.current,
        icon,
      }

      onUpdate({ icon })
    },
    [onUpdate]
  )

  /**
   * Handle order updates
   */
  const handleOrderUpdate = useCallback(
    (order: number) => {
      setFormState((prev) => ({
        ...prev,
        order,
      }))

      // Validate
      const orderError = validateUniqueOrders(allChapters, chapter.id)
      if (orderError) {
        setErrors((prev) => ({
          ...prev,
          order: orderError,
        }))
        return
      }

      // Clear error if validation passed
      setErrors((prev) => ({
        ...prev,
        order: undefined,
      }))

      // Update the initial value reference
      initialValues.current = {
        ...initialValues.current,
        order,
      }

      onUpdate({ order })
    },
    [allChapters, chapter.id, onUpdate]
  )

  /**
   * Handle quest shape selection
   */
  const handleShapeChange = useCallback(
    (value: string) => {
      // Validate that the shape is a valid QuestShape
      const validShapes = ['square', 'rsquare', 'circle', 'diamond', 'pentagon', 'hexagon', 'octagon']
      const shapeValue = value && validShapes.includes(value)
        ? (value as Chapter['defaultQuestShape'])
        : undefined

      setFormState((prev) => ({
        ...prev,
        defaultQuestShape: shapeValue,
      }))

      // Clear error if validation passed
      setErrors((prev) => ({
        ...prev,
        defaultQuestShape: undefined,
      }))

      // Update the initial value reference
      initialValues.current = {
        ...initialValues.current,
        defaultQuestShape: shapeValue,
      }

      onUpdate({ defaultQuestShape: shapeValue })
    },
    [onUpdate]
  )

  return (
    <div className="space-y-4">
      {/* Chapter ID and metadata */}
      <div className="rounded-md bg-muted/50 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Chapter ID: <span className="font-mono">{chapter.id.slice(0, 8)}...</span>
        </p>
      </div>

      {/* Title field */}
      <div className="space-y-2">
        <Label htmlFor="chapter-title">Title</Label>
        <Input
          id="chapter-title"
          value={formState.title}
          onChange={handleChange('title')}
          onBlur={handleBlur('title')}
          placeholder="Chapter title"
          required
          aria-invalid={!!errors.title}
          className={errors.title ? 'border-destructive' : ''}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
      </div>

      {/* Description field */}
      <div className="space-y-2">
        <Label htmlFor="chapter-description">Description</Label>
        <Textarea
          id="chapter-description"
          value={formState.description}
          onChange={handleChange('description')}
          onBlur={handleBlur('description')}
          placeholder="Chapter description..."
          rows={3}
          aria-invalid={!!errors.description}
          className={errors.description ? 'border-destructive' : ''}
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
      </div>

      {/* Icon selector */}
      <div className="border-t pt-4">
        <IconSelector icon={formState.icon} onUpdate={handleIconUpdate} />
      </div>

      {/* Order editor */}
      <div className="border-t pt-4">
        <ChapterOrderEditor
          order={formState.order}
          onUpdate={handleOrderUpdate}
          error={errors.order}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />
      </div>

      {/* Default quest shape selector */}
      <div className="border-t pt-4">
        <Label htmlFor="chapter-default-shape">Default Quest Shape</Label>
        <Select value={formState.defaultQuestShape ?? ''} onValueChange={handleShapeChange}>
          <SelectTrigger id="chapter-default-shape">
            <SelectValue placeholder="None (use global default)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None (use global default)</SelectItem>
            <SelectItem value="square">Square</SelectItem>
            <SelectItem value="rsquare">Rounded Square</SelectItem>
            <SelectItem value="circle">Circle</SelectItem>
            <SelectItem value="diamond">Diamond</SelectItem>
            <SelectItem value="pentagon">Pentagon</SelectItem>
            <SelectItem value="hexagon">Hexagon</SelectItem>
            <SelectItem value="octagon">Octagon</SelectItem>
          </SelectContent>
        </Select>
        {errors.defaultQuestShape && (
          <p className="text-xs text-destructive mt-1">{errors.defaultQuestShape}</p>
        )}
      </div>
    </div>
  )
}
